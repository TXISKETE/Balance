// Cloudflare Pages (modo avanzado): sirve la app y ofrece /api/datos, /api/buscar y /api/precio
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const UA={'user-agent':'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0','accept-language':'en'};
const get=async(u,txt)=>{const r=await fetch(u,{headers:UA});if(!r.ok)throw new Error('HTTP '+r.status+' en '+new URL(u).host);return txt?r.text():r.json()};
const MES={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
const fechaFT=h=>{const m=h.match(/as of\s+([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/i),k=m&&MES[m[1].toLowerCase()];return k?`${m[3]}-${String(k).padStart(2,'0')}-${m[2].padStart(2,'0')}`:''};
const iso=t=>new Date(t*1000).toISOString().slice(0,10);
let FX={t:0,r:{}};
async function conv(p,c){c=c||'EUR';if(c==='EUR')return[p,1];let k=1;if(c==='GBX'||c==='GBp'){k=.01;c='GBP'}
 if(!Object.keys(FX.r).length||Date.now()-FX.t>216e5){const x=await get('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml',1);FX.r={};for(const m of x.matchAll(/currency=.([A-Z]{3}). rate=.([\d.]+)./g))FX.r[m[1]]=+m[2];FX.t=Date.now()}
 if(!FX.r[c])throw new Error('divisa '+c+' no disponible');const t=k/FX.r[c];return[p*t,t]}
async function ftp(url,mon=''){const h=await get(url,1),n=h.match(/mod-tearsheet-overview__header__name[^>]*>\s*([\s\S]*?)\s*<\/h1>/)||h.match(/<h1[^>]*>\s*([\s\S]*?)\s*<\/h1>/)||h.match(/<title>([\s\S]*?)\s+summary/i),p=h.match(/Price \(([A-Za-z]{3})\)<\/span><span class="mod-ui-data-list__value">([\d,]*\.?\d+)<\/span>/);
 let cur,val;if(p){cur=p[1];val=p[2]}else{const g=h.match(/mod-ui-data-list__value">([\d,]+\.\d+)</);cur=mon;val=g&&g[1]}
 if(!n||!val||!cur)throw new Error('sin datos en la ficha de FT');return{nombre:n[1].replace(/<[^>]+>/g,'').trim(),moneda:cur,precio:parseFloat(val.replace(/,/g,'')),fecha:fechaFT(h)}}
async function ft(isin){const e=[];for(const m of['EUR','USD','GBP','GBX','CHF']){try{return await ftp(`https://markets.ft.com/data/funds/tearsheet/summary?s=${isin}:${m}`,m)}catch(x){e.push(m+': '+x.message)}}throw new Error('FT no devuelve datos ('+e.join('; ')+')')}
async function ftBuscar(q){const h=await get('https://markets.ft.com/data/search?query='+encodeURIComponent(q),1),mj={};for(const m of h.matchAll(/<a[^>]+href="(\/data\/(?:equities|etfs)\/tearsheet\/summary\?s=[^"]+)"[^>]*>\s*([^<]+?)\s*<\/a>/g)){const p=m[1].replace(/&amp;/g,'&');if(m[2].length>(mj[p]||'').length)mj[p]=m[2].trim()}
 return Object.entries(mj).slice(0,6).map(([p,n])=>{const e=p.includes('/etfs/'),s=new URL('https://x'+p).searchParams.get('s');return{fuente:'ftq',id:p,nombre:n,clase:e?'etf':'accion',detalle:`${e?'ETF':'Acción'} · ${s} · FT`}})}
const yMeta=async s=>(await get('https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(s)+'?range=1d&interval=1d')).chart.result[0].meta;
async function yBuscar(q){const j=await get('https://query1.finance.yahoo.com/v1/finance/search?quotesCount=8&newsCount=0&q='+encodeURIComponent(q)),T={EQUITY:['Acción','accion'],ETF:['ETF','etf'],MUTUALFUND:['Fondo','fondo']};
 return(j.quotes||[]).filter(x=>T[x.quoteType]).map(x=>({fuente:'yahoo',id:x.symbol,clase:T[x.quoteType][1],nombre:x.longname||x.shortname||x.symbol,detalle:`${T[x.quoteType][0]} · ${x.symbol} · ${x.exchDisp||''}`}))}
async function cBuscar(q){const j=await get('https://api.coingecko.com/api/v3/search?query='+encodeURIComponent(q));return(j.coins||[]).slice(0,3).map(c=>({fuente:'coingecko',id:c.id,nombre:`${c.name} (${c.symbol})`,detalle:'Cripto · CoinGecko',clase:'cripto'}))}
async function precio(f,id){let d,fe='';
 if(f==='ft'){d=await ft(id);fe=d.fecha}else if(f==='ftq'){if(!id.startsWith('/data/'))throw new Error('ruta no válida');d=await ftp('https://markets.ft.com'+id);fe=d.fecha}
 else if(f==='yahoo'){const m=await yMeta(id);d={nombre:m.longName||m.shortName||id,moneda:m.currency,precio:m.regularMarketPrice};fe=m.regularMarketTime?iso(m.regularMarketTime):''}
 else if(f==='coingecko'){const j=await get('https://api.coingecko.com/api/v3/simple/price?ids='+encodeURIComponent(id)+'&vs_currencies=eur&include_last_updated_at=true'),e=j[id];return{nombre:id,moneda:'EUR',precio:e.eur,orig:e.eur,tc:1,fecha:e.last_updated_at?iso(e.last_updated_at):''}}
 else throw new Error('fuente desconocida');
 const[p,tc]=await conv(d.precio,d.moneda);return{nombre:d.nombre,moneda:d.moneda,precio:p,orig:d.precio,tc,fecha:fe}}
async function buscar(q){const av=[];let fondos=[],bolsa=[],cripto=[];
 if(/^[A-Za-z]{2}[A-Za-z0-9]{9}\d$/.test(q)){try{const d=await ft(q.toUpperCase());fondos=[{fuente:'ft',id:q.toUpperCase(),nombre:d.nombre,detalle:`Fondo · ${q.toUpperCase()} · ${d.moneda}`,clase:'fondo'}]}catch(e){av.push('FT (fondo): '+e.message)}}
 try{bolsa=await yBuscar(q)}catch(e){av.push('Yahoo Finance: '+e.message)}
 if(!bolsa.length)try{bolsa=await ftBuscar(q)}catch(e){av.push('FT (bolsa): '+e.message)}
 try{cripto=await cBuscar(q)}catch(e){av.push('CoinGecko: '+e.message)}
 if(!bolsa.length&&/^[A-Za-z0-9.^=\-]{1,12}$/.test(q))bolsa=[{fuente:'yahoo',id:q.toUpperCase(),clase:'accion',nombre:`Usar «${q.toUpperCase()}» como ticker de Yahoo`,detalle:'Ticker manual · se comprueba el precio al añadir'}];
 const ql=q.trim().toLowerCase(),ex=cripto.some(c=>ql===c.id||ql===c.nombre.toLowerCase().split(' (')[0]||ql===c.nombre.toLowerCase().split('(').pop().replace(')',''));
 return{r:[...fondos,...(ex?[...cripto,...bolsa]:[...bolsa,...cripto])],avisos:av}}
// Datos cifrados en el navegador: aquí solo se guarda un bloque ilegible (D1 = base de datos de Cloudflare)
async function datos(req,env){
 if(!env.DB)throw Object.assign(new Error('Falta el binding D1 «DB»'),{s:500});
 await env.DB.exec('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT, t INTEGER)');
 if(req.method==='GET'){const r=await env.DB.prepare('SELECT v FROM kv WHERE k=?').bind('datos').first();return r?new Response(r.v,{headers:{'content-type':'application/json','cache-control':'no-store'}}):new Response(null,{status:204})}
 if(req.method==='PUT'){const b=await req.text();if(b.length>5e6)return J({error:'demasiado grande'},413);let n;try{n=JSON.parse(b);if(typeof n.t!=='number'||!n.c)throw 0}catch(e){return J({error:'formato no válido'},400)}
  const base=+req.headers.get('x-base')||0,row=await env.DB.prepare('SELECT t FROM kv WHERE k=?').bind('datos').first();
  if(!row)await env.DB.prepare('INSERT INTO kv(k,v,t) VALUES(?,?,?)').bind('datos',b,n.t).run();
  else{const r=await env.DB.prepare('UPDATE kv SET v=?,t=? WHERE k=? AND t=?').bind(b,n.t,'datos',base).run();if(!r.meta.changes)return J({error:'conflicto'},409)}
  return J({t:n.t})}
 return J({error:'método no permitido'},405)}
export default{async fetch(req,env){const u=new URL(req.url);if(!u.pathname.startsWith('/api/'))return env.ASSETS.fetch(req);
 try{if(!env.TOKEN)throw Object.assign(new Error('Falta el secreto TOKEN'),{s:500});if(req.headers.get('x-token')!==env.TOKEN)throw Object.assign(new Error('Token incorrecto'),{s:401});
  const g=k=>(u.searchParams.get(k)||'').trim();
  if(u.pathname==='/api/datos')return await datos(req,env);
  if(u.pathname==='/api/buscar')return J(await buscar(g('q')));
  if(u.pathname==='/api/precio')return J(await precio(g('fuente'),g('id')));
  return J({error:'ruta desconocida'},404)}catch(e){return J({error:e.message},e.s||502)}}};
