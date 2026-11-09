import os, re, json, time, urllib.request, urllib.parse, urllib.error
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

try:  # recomendado: pip install curl_cffi  (Yahoo bloquea las consultas "normales" de Python)
    from curl_cffi import requests as cr
except Exception:
    cr = None

UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0'}

def http(url, texto=False):
    host = urllib.parse.urlparse(url).netloc
    if cr:
        r = cr.get(url, impersonate='chrome', timeout=15)
        if r.status_code >= 400:
            raise ValueError('HTTP %s en %s' % (r.status_code, host))
        b = r.text
    else:
        try:
            b = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=15).read().decode('utf-8', 'ignore')
        except urllib.error.HTTPError as e:
            raise ValueError('HTTP %s en %s' % (e.code, host))
    return b if texto else json.loads(b)

# ---------- Divisas (Banco Central Europeo, sin bloqueos) ----------
_fx = {'t': 0, 'r': {}}
def tasa(cur):  # euros que vale 1 unidad de cur
    if not _fx['r'] or time.time() - _fx['t'] > 6 * 3600:
        x = http('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml', True)
        _fx['r'] = {m.group(1): float(m.group(2)) for m in re.finditer(r"currency=.([A-Z]{3}). rate=.([\d.]+).", x)}
        _fx['t'] = time.time()
    if cur not in _fx['r']:
        raise ValueError('divisa %s no disponible en el BCE' % cur)
    return 1 / _fx['r'][cur]

def a_eur(p, cur):
    cur = cur or 'EUR'
    if cur == 'EUR':
        return p
    if cur in ('GBX', 'GBp'):
        p, cur = p / 100, 'GBP'
    return p * tasa(cur)

# ---------- Financial Times ----------
def ftp(url, moneda=''):
    h = http(url, True)
    n = (re.search(r'mod-tearsheet-overview__header__name[^>]*>\s*(.*?)\s*</h1>', h, re.S)
         or re.search(r'<h1[^>]*>\s*(.*?)\s*</h1>', h, re.S)
         or re.search(r'<title>(.*?)\s+summary', h, re.S | re.I))
    p = re.search(r'Price \(([A-Za-z]{3})\)</span><span class="mod-ui-data-list__value">([\d,]*\.?\d+)</span>', h)
    if p:
        cur, val = p.group(1), p.group(2)
    else:
        g = re.search(r'mod-ui-data-list__value">([\d,]+\.\d+)<', h)
        cur, val = moneda, g.group(1) if g else None
    if not (n and val and cur):
        raise ValueError('sin datos en la ficha de FT')
    return {'nombre': re.sub(r'<[^>]+>', '', n.group(1)).strip(), 'moneda': cur, 'precio': float(val.replace(',', ''))}

def ft(isin):
    errores = []
    for m in ('EUR', 'USD', 'GBP', 'GBX', 'CHF'):
        try:
            return ftp('https://markets.ft.com/data/funds/tearsheet/summary?s=%s:%s' % (isin, m), m)
        except Exception as e:
            errores.append('%s: %s' % (m, e))
    raise ValueError('FT no devuelve datos (' + '; '.join(errores) + ')')

def ft_buscar(q):  # acciones y ETF en la búsqueda de FT
    h = http('https://markets.ft.com/data/search?query=' + urllib.parse.quote(q), True)
    mejor = {}
    for path, nom in re.findall(r'<a[^>]+href="(/data/(?:equities|etfs)/tearsheet/summary\?s=[^"]+)"[^>]*>\s*([^<]+?)\s*</a>', h):
        path = path.replace('&amp;', '&')
        if len(nom) > len(mejor.get(path, '')):
            mejor[path] = nom.strip()
    out = []
    for path, nom in list(mejor.items())[:6]:
        sym = urllib.parse.parse_qs(urllib.parse.urlparse(path).query).get('s', [''])[0]
        etf = '/etfs/' in path
        out.append({'fuente': 'ftq', 'id': path, 'nombre': nom, 'clase': 'etf' if etf else 'accion',
                    'detalle': '%s · %s · FT' % ('ETF' if etf else 'Acción', sym)})
    return out

# ---------- Yahoo Finance ----------
def yahoo_meta(sym):
    j = http('https://query1.finance.yahoo.com/v8/finance/chart/%s?range=1d&interval=1d' % urllib.parse.quote(sym))
    return j['chart']['result'][0]['meta']

def yahoo_buscar(q):
    j = http('https://query1.finance.yahoo.com/v1/finance/search?quotesCount=8&newsCount=0&q=' + urllib.parse.quote(q))
    tipos = {'EQUITY': ('Acción', 'accion'), 'ETF': ('ETF', 'etf'), 'MUTUALFUND': ('Fondo', 'fondo')}
    out = []
    for x in j.get('quotes', []):
        if x.get('quoteType') in tipos:
            t, cl = tipos[x['quoteType']]
            out.append({'fuente': 'yahoo', 'id': x['symbol'], 'clase': cl,
                        'nombre': x.get('longname') or x.get('shortname') or x['symbol'],
                        'detalle': '%s · %s · %s' % (t, x['symbol'], x.get('exchDisp', ''))})
    return out

# ---------- CoinGecko ----------
def cripto_buscar(q):
    j = http('https://api.coingecko.com/api/v3/search?query=' + urllib.parse.quote(q))
    return [{'fuente': 'coingecko', 'id': c['id'], 'nombre': '%s (%s)' % (c['name'], c['symbol']),
             'detalle': 'Cripto · CoinGecko', 'clase': 'cripto'} for c in j.get('coins', [])[:3]]

def precio(fuente, id):
    if fuente == 'ft':
        d = ft(id)
    elif fuente == 'ftq':
        if not id.startswith('/data/'):
            raise ValueError('ruta no válida')
        d = ftp('https://markets.ft.com' + id)
    elif fuente == 'yahoo':
        m = yahoo_meta(id)
        d = {'nombre': m.get('longName') or m.get('shortName') or id, 'moneda': m.get('currency'), 'precio': m['regularMarketPrice']}
    elif fuente == 'coingecko':
        j = http('https://api.coingecko.com/api/v3/simple/price?ids=%s&vs_currencies=eur' % urllib.parse.quote(id))
        return {'nombre': id, 'moneda': 'EUR', 'precio': j[id]['eur']}
    else:
        raise ValueError('fuente desconocida')
    return {'nombre': d['nombre'], 'moneda': d['moneda'], 'precio': a_eur(d['precio'], d['moneda'])}

def buscar(q):
    r, av = [], []
    fondos, bolsa, cripto = [], [], []
    if re.fullmatch(r'[A-Za-z]{2}[A-Za-z0-9]{9}\d', q):
        try:
            d = ft(q.upper())
            fondos.append({'fuente': 'ft', 'id': q.upper(), 'nombre': d['nombre'],
                           'detalle': 'Fondo · %s · %s' % (q.upper(), d['moneda']), 'clase': 'fondo'})
        except Exception as e:
            av.append('FT (fondo): %s' % e)
    try:
        bolsa = yahoo_buscar(q)
    except Exception as e:
        av.append('Yahoo Finance: %s' % e)
    if not bolsa:
        try:
            bolsa = ft_buscar(q)
        except Exception as e:
            av.append('FT (bolsa): %s' % e)
    try:
        cripto = cripto_buscar(q)
    except Exception as e:
        av.append('CoinGecko: %s' % e)
    if not bolsa and re.fullmatch(r'[A-Za-z0-9.^=\-]{1,12}', q):
        bolsa = [{'fuente': 'yahoo', 'id': q.upper(), 'clase': 'accion', 'nombre': 'Usar «%s» como ticker de Yahoo' % q.upper(),
                  'detalle': 'Ticker manual · se comprueba el precio al añadir'}]
    ql = q.strip().lower()
    exacto = any(ql == c['id'] or ql == c['nombre'].lower().split(' (')[0] or ql == c['nombre'].lower().rsplit('(', 1)[-1].strip(')') for c in cripto)
    return {'r': fondos + (cripto + bolsa if exacto else bolsa + cripto), 'avisos': av}

class H(SimpleHTTPRequestHandler):
    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        if not u.path.startswith('/api/'):
            return super().do_GET()
        q = urllib.parse.parse_qs(u.query)
        g = lambda k: q.get(k, [''])[0].strip()
        try:
            if u.path == '/api/buscar':
                d = buscar(g('q'))
            elif u.path == '/api/precio':
                d = precio(g('fuente'), g('id'))
            else:
                raise ValueError('ruta desconocida')
            c = 200
        except Exception as e:
            d, c = {'error': str(e)}, 502
        b = json.dumps(d).encode()
        self.send_response(c)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(b)))
        self.end_headers()
        self.wfile.write(b)

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print('curl_cffi:', 'sí' if cr else 'NO instalado (Yahoo puede rechazar las consultas; ver instrucciones)')
    print('App en http://localhost:8000  (Ctrl+C para parar)')
    ThreadingHTTPServer(('0.0.0.0', 8000), H).serve_forever()
