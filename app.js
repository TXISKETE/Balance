const K='finanzas_v1',TABS=['Resumen','Cuentas','Deudas','Inversiones','Intereses','Histórico'];
let S={bancos:[],saldos:[],deudas:[],intereses:[],fondos:[]},tab='Resumen';
try{const r=localStorage.getItem(K);if(r)S=JSON.parse(r)}catch(e){}
const save=()=>{ordenar();try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}};
const $=s=>document.querySelector(s);
const eur=n=>(n||0).toLocaleString('es-ES',{style:'currency',currency:'EUR'});
const hoy=()=>new Date().toISOString().slice(0,10);
const ultimo=(a,b)=>{const x=a.filter(r=>r.banco===b).sort((p,q)=>p.fecha<q.fecha?-1:1);return x.length?x[x.length-1].importe:0};
const suma=a=>a.reduce((s,r)=>s+r.importe,0);
const parts=f=>f.ap.reduce((s,a)=>s+a.part,0);
const inv=f=>f.ap.reduce((s,a)=>s+a.part*a.vl,0);
function go(t){const mismo=t===tab,y=window.scrollY;document.querySelectorAll('#v details[data-o]').forEach(d=>d.open?OPEN.add(d.dataset.o):OPEN.delete(d.dataset.o));tab=t;$('#nav').innerHTML=TABS.map(x=>`<button class="${x===t?'on':''}" data-tab="${x}">${x}</button>`).join('');
 ({Resumen:resumen,Cuentas:()=>registro('saldos','Saldo'),Deudas:()=>registro('deudas','Deuda'),Inversiones:inversiones,Intereses:intereses,Histórico:historico})[t]();if(mismo)window.scrollTo(0,y)}
function resumen(){
 const liq=S.bancos.reduce((s,b)=>s+ultimo(S.saldos,b),0),F=S.fondos.map(f=>({f,n:inv(f),v:parts(f)*f.vl})),
 fv=F.reduce((s,x)=>s+x.v,0),deu=S.bancos.reduce((s,b)=>s+ultimo(S.deudas,b),0),tot=liq+fv,neto=tot-deu,
 P=(x,t)=>t?(x/t*100).toFixed(1)+'%':'0%',
 grp=t=>{const a=F.filter(x=>(x.f.tipo||'V')===t);return{n:a.reduce((s,x)=>s+x.n,0),v:a.reduce((s,x)=>s+x.v,0)}},rv=grp('V'),rf=grp('F'),
 bs=(n,v)=>`<span class="${v>=n?'ok':'ko'}">${eur(v-n)}</span><span class="${v>=n?'ok':'ko'}">${pct(v,n)}</span>`,
 ben=(n,v)=>`<td class="${v>=n?'ok':'ko'}">${eur(v-n)}</td><td class="${v>=n?'ok':'ko'}">${pct(v,n)}</td>`,
 kpi=(t,v,s,c='')=>`<section class="kpi s3 ${c}"><small>${t}</small><b>${v}</b><small>${s}</small></section>`,
 com=S.carteras.reduce((s,c)=>s+c.com.reduce((t,x)=>t+x.importe,0),0),conDeuda=S.bancos.filter(b=>S.deudas.some(r=>r.banco===b));
 $('#v').innerHTML=`<div class="dash">
 ${kpi('Patrimonio neto',`<span class="${neto>=0?'':'ko'}">${eur(neto)}</span>`,'activos menos deuda','hero')}
 ${kpi('Efectivo',eur(liq),P(liq,tot)+' de los activos')}
 ${kpi('Invertido',eur(fv),P(fv,tot)+' de los activos')}
 ${kpi('Deuda total',`<span class="ko">${eur(deu)}</span>`,conDeuda.length+' con deuda')}
 <section class="s4"><h2>Distribución</h2><div class="donut" style="--p:${tot?liq/tot*100:0}"><div><span><b>${P(liq,tot)}</b><br>efectivo</span></div></div>
  <div class="leg" style="margin-top:12px"><span><i style="background:var(--a)"></i>Efectivo ${P(liq,tot)}</span><span><i style="background:#f59e0b"></i>Invertido ${P(fv,tot)}</span></div>
  <div class="bar"><span style="width:${fv?rv.v/fv*100:0}%"></span><span style="width:${fv?rf.v/fv*100:0}%"></span></div>
  <div class="leg"><span><i style="background:var(--a)"></i>R. variable ${P(rv.v,fv)}</span><span><i style="background:#f59e0b"></i>R. fija ${P(rf.v,fv)}</span></div></section>
 <section class="s4"><h2>Cuentas</h2><table>${S.bancos.slice().sort((p,q)=>ultimo(S.saldos,q)-ultimo(S.saldos,p)).map(b=>`<tr><td>${b}</td><td>${eur(ultimo(S.saldos,b))}</td></tr>`).join('')}<tfoot><tr><td>Total</td><td>${eur(liq)}</td></tr></tfoot></table></section>
 <section class="s4"><h2>Deudas</h2><table>${conDeuda.slice().sort((p,q)=>ultimo(S.deudas,q)-ultimo(S.deudas,p)).map(b=>`<tr><td>${b}</td><td class="ko">${eur(ultimo(S.deudas,b))}</td></tr>`).join('')}<tfoot><tr><td>Total deudas</td><td class="ko">${eur(deu)}</td></tr></tfoot></table></section>
 <section class="s12"><h2>Activos por cartera</h2><div class="gt">
 <div class="gr h"><span></span><span>Invertido</span><span>Valor actual</span><span>Beneficio</span><span>% beneficio</span></div>
 ${S.carteras.map(c=>{const as=F.filter(x=>x.f.cartera===c.n),n=as.reduce((t,x)=>t+x.n,0),v=as.reduce((t,x)=>t+x.v,0);
  return`<details class="rc" ${dop('r:'+c.n)}><summary class="gr"><span><b>${c.n}</b> <small style="color:var(--m)">(${P(v,fv)})</small></span><span>${eur(n)}</span><span>${eur(v)}</span>${bs(n,v)}</summary>${as.map(x=>`<div class="gr in"><span>${x.f.n} <small style="color:var(--m)">(${P(x.v,fv)})</small></span><span>${eur(x.n)}</span><span>${eur(x.v)}</span>${bs(x.n,x.v)}</div>`).join('')||'<div class="gr in"><span>Sin activos</span></div>'}</details>`}).join('')}
 <div class="gr tot"><span>Total activos</span><span>${eur(rv.n+rf.n)}</span><span>${eur(fv)}</span>${bs(rv.n+rf.n,fv)}</div>
 <div class="gr"><span>Renta variable (${P(rv.v,fv)})</span><span>${eur(rv.n)}</span><span>${eur(rv.v)}</span>${bs(rv.n,rv.v)}</div>
 <div class="gr"><span>Renta fija (${P(rf.v,fv)})</span><span>${eur(rf.n)}</span><span>${eur(rf.v)}</span>${bs(rf.n,rf.v)}</div>
 <div class="gr"><span>Comisiones pagadas</span><span></span><span></span><span class="ko">${eur(com)}</span><span></span></div></div></section></div>
 <section><div class="f"><button data-a="exp">Exportar copia</button><button data-a="imp">Importar copia</button></div></section>`}
const nt=t=>`<td style="text-align:left;color:var(--m);white-space:normal">${t||''}</td>`;
function formReg(k,l){return`<section><h2>Añadir</h2><div class="f"><select id="b" data-a="selb">${(()=>{const q=S.bancos.includes(SEL.b)?SEL.b:S.bancos[0];return(S.bancos.length?'':'<option value="">Selecciona banco…</option>')+S.bancos.map(b=>`<option${b===q?' selected':''}>${b}</option>`).join('')})()}<option value="__n">➕ Nuevo banco…</option></select><input type="date" id="d" value="${hoy()}"><input type="number" step="0.01" id="m" placeholder="${l} €"><input id="n" placeholder="Comentario (opcional)"><button class="p" data-a="add" data-k="${k}">Guardar</button></div></section>`}
function listaReg(k){const r=S[k].map((x,i)=>({...x,i})).sort((p,q)=>p.fecha<q.fecha?1:-1);return`<section><h2>Histórico de registros</h2><div style="max-height:400px;overflow:auto"><table>${r.map(x=>`<tr><td>${fes(x.fecha)}</td><td>${x.banco}</td><td>${eur(x.importe)}</td>${nt(x.nota)}<td><button data-a="del" data-k="${k}" data-i="${x.i}">✕</button></td></tr>`).join('')}</table></div></section>`}
const finMes=m=>{const[y,n]=m.split('-').map(Number);return String(new Date(y,n,0).getDate()).padStart(2,'0')+'/'+String(n).padStart(2,'0')+'/'+y};
function evol(k,vl){
 const rs=S[k],bs=S.bancos.filter(b=>(!FE[k]||b===FE[k])&&rs.some(r=>r.banco===b)),
 fs=[...new Set(rs.filter(r=>bs.includes(r.banco)).map(r=>r.fecha))].sort(),
 D=FM[k]==='m'?fs.filter((d,i)=>i===fs.length-1||fs[i+1].slice(0,7)!==d.slice(0,7)):fs,
 en=(b,d)=>{const x=rs.filter(r=>r.banco===b&&r.fecha<=d);return x.length?x[x.length-1].importe:0},
 R=D.map(d=>{const v=bs.map(b=>en(b,d)),o={k:d,t:v.reduce((a,b)=>a+b,0)};v.forEach((x,j)=>o['b'+j]=x);return o});
 R.forEach((r,i)=>r.d=i?r.t-R[i-1].t:null);
 const co=(()=>{if(!RG)return'';const d=new Date();d.setMonth(d.getMonth()-RG);return d.toISOString().slice(0,10)})(),V=co?R.filter(r=>r.k>=co):R,
 c=v=>v>=0?'ok':'ko',h=t=>`<td><b>${t}</b></td>`,sr=bs.map((b,j)=>['b'+j,COL[j%COL.length],b]);if(bs.length>1)sr.push(['t','#10b981','Total']);
 return`<section><h2>Evolución</h2><div class="f">${selH('fe',k,[['','Todos los bancos'],...S.bancos.map(b=>[b,b])],FE[k])}${selH('fm',k,[['r','Cada registro'],['m','Último registro de cada mes']],FM[k])}${rgSel()}</div>${V.length?lineas(V,sr)+`<div style="max-height:360px;overflow:auto"><table><tr>${h('Fecha')}${bs.map(b=>h(b)).join('')}${bs.length>1?h('Total'):''}${h(vl)}</tr>${V.slice().reverse().map(r=>`<tr><td>${fes(r.k)}</td>${bs.map((b,j)=>`<td>${eur(r['b'+j])}</td>`).join('')}${bs.length>1?`<td>${eur(r.t)}</td>`:''}<td class="${c(r.d)}">${r.d==null?'':eur(r.d)}</td></tr>`).join('')}</table></div>`:'<p>Aún no hay datos.</p>'}</section>`}
function registro(k,l){$('#v').innerHTML=evol(k,k==='deudas'?'Variación (cuota)':'Variación')+formReg(k,l)+listaReg(k)}
function intereses(){
 const co=(()=>{if(!FI.rg)return'';const d=new Date();d.setMonth(d.getMonth()-FI.rg);return d.toISOString().slice(0,10)})(),
 rec=S.intereses.filter(r=>(!FI.banco||r.banco===FI.banco)&&(!co||r.fecha>=co)),
 per=d=>FI.esc==='a'?d.slice(0,4):FI.esc==='t'?d.slice(0,4)+'-T'+Math.ceil(+d.slice(5,7)/3):d.slice(0,7),
 lab=p=>p.includes('-T')?'T'+p.split('-T')[1]+'-'+p.slice(0,4):p.length===7?fm(p):p,
 bs=S.bancos.filter(b=>rec.some(r=>r.banco===b)),ps=[...new Set(rec.map(r=>per(r.fecha)))].sort(),
 R=ps.map(p=>{const v=bs.map(b=>suma(rec.filter(r=>per(r.fecha)===p&&r.banco===b)));return{l:lab(p),v,t:v.reduce((a,b)=>a+b,0)}});
 $('#v').innerHTML=`<section><h2>Intereses recibidos</h2><div class="f">${selH('fi','banco',[['','Todos los bancos'],...S.bancos.map(b=>[b,b])],FI.banco)}${selH('fi','esc',[['m','Por mes'],['t','Por trimestre'],['a','Por año']],FI.esc)}${selH('fi','rg',RGOPT,FI.rg)}</div>${barras(R,bs)}
 <div style="max-height:320px;overflow:auto"><table><tr><td><b>Periodo</b></td>${bs.map(b=>`<td><b>${b}</b></td>`).join('')}<td><b>Total</b></td></tr>${R.map(x=>`<tr><td>${x.l}</td>${x.v.map(v=>`<td>${eur(v)}</td>`).join('')}<td>${eur(x.t)}</td></tr>`).join('')}<tfoot><tr><td>Total</td>${bs.map((b,j)=>`<td>${eur(R.reduce((a,x)=>a+x.v[j],0))}</td>`).join('')}<td>${eur(R.reduce((a,x)=>a+x.t,0))}</td></tr></tfoot></table></div></section>`+formReg('intereses','Interés')+listaReg('intereses')}
const fm=k=>{const[y,m]=k.split('-');return['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][m-1]+'-'+y.slice(2)};
const pct=(v,n)=>n?((v/n-1)*100).toFixed(2)+' %':'–';
let RES=[],SEL={b:'',cart:''},FE={saldos:'',deudas:''},FM={saldos:'r',deudas:'r'},FL={tipo:'',cart:'',fondo:''},RG='',FI={banco:'',esc:'m',rg:''};
const RGOPT=[['','Todo el histórico'],['3','Últimos 3 meses'],['6','Últimos 6 meses'],['12','Último año'],['24','Últimos 2 años']],
 COL=['#6366f1','#f59e0b','#10b981','#ef4444','#06b6d4','#a855f7','#84cc16','#f97316'],
 MON='€',num=v=>v.toLocaleString('es-ES',{maximumFractionDigits:v%1&&Math.abs(v)<100?2:0})+'\u00a0'+MON,
 cut=a=>RG?a.slice(-RG):a,
 selH=(a,k,o,v,i)=>`<select data-a="${a}"${k?` data-k="${k}"`:''}${i!==undefined?` data-i="${i}"`:''}>${o.map(x=>`<option value="${x[0]}"${String(v)===x[0]?' selected':''}>${x[1]}</option>`).join('')}</select>`,
 rgSel=()=>selH('rg','',RGOPT,RG);
const fes=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'';
function rango(ds){ds=ds.filter(Boolean).sort();if(!ds.length)return[];const o=[],e=hoy().slice(0,7);let[y,m]=ds[0].slice(0,7).split('-').map(Number);for(;;){const k=y+'-'+String(m).padStart(2,'0');o.push(k);if(k>=e)break;if(++m>12){m=1;y++}}return o}
const meses=()=>rango(S.fondos.flatMap(f=>f.ap.map(a=>a.fecha)));
function precioEn(f,fin){if(fin>=hoy()&&f.vl)return f.vl;const p=[...f.ap,...(f.hist||[])].filter(x=>x.fecha<=fin).sort((a,b)=>a.fecha<b.fecha?-1:1);return p.length?p[p.length-1].vl:0}
function serie(f,M){let t=0,c=0;return M.map(k=>{const a=f.ap.filter(x=>x.fecha.slice(0,7)===k),ap=a.reduce((s,x)=>s+x.part*x.vl,0),pa=a.reduce((s,x)=>s+x.part,0);t+=ap;c+=pa;return{k,ap,pa,pc:c,t,val:c*precioEn(f,k+'-31')}})}
const marcas=(n,ancho,w)=>{const st=Math.ceil(n/Math.max(2,Math.floor(ancho/w))),a=[];for(let i=0;i<n;i+=st)a.push(i);if(a[a.length-1]!==n-1){if(n-1-a[a.length-1]<st*.6)a.pop();a.push(n-1)}return a};
function lineas(r,sr){if(r.length<2)return'';const W=640,H=190,vs=r.flatMap(x=>sr.map(q=>x[q[0]])),mn=Math.min(0,...vs),mx=Math.max(0,...vs)||1,n=r.length,idx=marcas(n,W-60,62),X=i=>30+i*(W-60)/(n-1),Y=v=>H-28-(v-mn)/((mx-mn)||1)*(H-50),pl=[],
 lab=(x,y,t,c)=>{const w=t.length*5.2+4;for(const dy of[-7,13,-19,25]){const yy=y+dy;if(yy<9||yy>H-16)continue;const b=[x-w/2,x+w/2,yy-9,yy+2];if(!pl.some(p=>b[0]<p[1]&&b[1]>p[0]&&b[2]<p[3]&&b[3]>p[2])){pl.push(b);return`<text x="${x}" y="${yy}" text-anchor="middle" font-size="9" fill="${c}">${t}</text>`}}return''},
 etq=idx.slice().reverse().flatMap(i=>sr.map(q=>lab(X(i),Y(r[i][q[0]]),num(r[i][q[0]]),q[1]))).join('');
 return`<svg viewBox="0 0 ${W} ${H}" style="width:100%">${mn<0?`<line x1="0" x2="${W}" y1="${Y(0)}" y2="${Y(0)}" stroke="#9ca3af" stroke-dasharray="4"/>`:''}${sr.map(q=>`<polyline fill="none" stroke="${q[1]}" stroke-width="2" points="${r.map((x,i)=>X(i)+','+Y(x[q[0]])).join(' ')}"/>${idx.map(i=>`<circle cx="${X(i)}" cy="${Y(r[i][q[0]])}" r="2.5" fill="${q[1]}"/>`).join('')}`).join('')}${etq}${idx.map(i=>`<text x="${X(i)}" y="${H-8}" text-anchor="middle" font-size="9" fill="#8b92b3">${r[i].k.length>7?fes(r[i].k).slice(0,5):fm(r[i].k)}</text>`).join('')}</svg><div class="leg">${sr.map(q=>`<span><i style="background:${q[1]}"></i>${q[2]}</span>`).join('')}</div>`}
function barras(r,bs){if(!r.length)return'<p>Sin datos con este filtro.</p>';const W=640,H=190,mx=Math.max(...r.map(x=>x.t))||1,n=r.length,bw=Math.min(44,(W-20)/n*.7),idx=new Set(marcas(n,W-20,62)),X=i=>10+(i+.5)*(W-20)/n;
 return`<svg viewBox="0 0 ${W} ${H}" style="width:100%">${r.map((x,i)=>{let y=H-24;const g=x.v.map((v,j)=>{const h=v/mx*(H-60);y-=h;return`<rect x="${X(i)-bw/2}" y="${y}" width="${bw}" height="${h}" fill="${COL[j%COL.length]}" rx="2"/>`}).join('');return g+(idx.has(i)?`<text x="${X(i)}" y="${y-4}" text-anchor="middle" font-size="9" fill="currentColor">${num(x.t)}</text><text x="${X(i)}" y="${H-8}" text-anchor="middle" font-size="9" fill="#8b92b3">${x.l}</text>`:'')}).join('')}</svg><div class="leg">${bs.map((b,j)=>`<span><i style="background:${COL[j%COL.length]}"></i>${b}</span>`).join('')}</div>`}
const OPEN=new Set(),SEEN=new Set(),dop=(k,d)=>{if(!SEEN.has(k)){SEEN.add(k);if(d)OPEN.add(k)}return`data-o="${k.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"${OPEN.has(k)?' open':''}`};
const CLA={fondo:'Fondo',accion:'Acción',etf:'ETF',cripto:'Cripto'},dec=f=>f.clase==='cripto'?6:3,
 ord=a=>a.map((x,j)=>({...x,j})).sort((p,q)=>p.fecha<q.fecha?1:p.fecha>q.fecha?-1:0),
 kp=(t,v,c='')=>`<div class="k"><small>${t}</small><b class="${c}">${v}</b></div>`,
 tablaM=(r,p)=>`<div style="max-height:320px;overflow:auto"><table><tr><td><b>Fecha</b></td><td><b>Aportación</b></td>${p?'<td><b>Particip.</b></td>':''}<td><b>Total aportado</b></td><td><b>Valor acum.</b></td></tr>${r.map(x=>`<tr><td>${fm(x.k)}</td><td>${eur(x.ap)}</td>${p?`<td>${x.pa.toFixed(p)}</td>`:''}<td>${eur(x.t)}</td><td>${eur(x.val)}</td></tr>`).join('')}</table></div>`,
 resHTML=()=>RES.map((r,j)=>`<div class="f" style="align-items:center"><span style="flex:1">${r.nombre}<br><small style="color:var(--m)">${r.detalle}</small></span><button class="p" data-a="addres" data-r="${j}">Añadir</button></div>`).join('');
function inversiones(){
 const M=meses(),SR=S.fondos.map(f=>serie(f,M)),
 ok=S.fondos.map((f,i)=>i).filter(i=>(!FL.tipo||(S.fondos[i].tipo||'V')===FL.tipo)&&(!FL.cart||S.fondos[i].cartera===FL.cart)),
 sel=FL.fondo!==''&&ok.includes(+FL.fondo)?[+FL.fondo]:ok,
 sm=(i,c)=>sel.reduce((s,j)=>s+SR[j][i][c],0),
 AC=cut(sel.length===1?SR[sel[0]]:M.map((k,i)=>({k,ap:sm(i,'ap'),t:sm(i,'t'),val:sm(i,'val')})));
 const act=i=>{const f=S.fondos[i],p=parts(f),n=inv(f),v=p*f.vl,u=f.hist.slice(-1)[0],c=v>=n?'ok':'ko';
 return`<details class="sub" ${dop('a:'+f.n+'|'+f.cartera)}><summary><b>${f.n}</b><span>${eur(v)} · <span class="${c}">${pct(v,n)}</span></span></summary><div class="f"><button data-a="delact" data-i="${i}">Eliminar activo</button></div><small>${CLA[f.clase]||''} ${f.ext||''}${f.moneda?' · '+f.moneda+' → EUR':''}${u?' · '+fes(u.fecha):''}</small>
 <div class="g">${kp('Precio actual',f.vl)}${kp('Dinero invertido',eur(n))}${kp('Participaciones',p.toFixed(dec(f)))}${kp('Precio medio de compra',(p?n/p:0).toFixed(2)+' €')}${kp('Valor actual',eur(v))}${kp('Beneficio',eur(v-n)+' · '+pct(v,n),c)}</div>
 <div class="f"><label>Precio actual <input type="number" step="any" value="${f.vl}" data-a="vl" data-i="${i}"></label><label>Tipo ${selH('tipo','',[['V','Renta variable'],['F','Renta fija']],f.tipo||'V',i)}</label><label>Cartera ${selH('mv','',S.carteras.map(c=>[c.n,c.n]),f.cartera,i)}</label></div>
 <div class="f"><input type="date" id="fd${i}" value="${hoy()}"><input type="number" step="any" id="fv${i}" placeholder="Precio compra"><input type="number" step="any" id="fp${i}" placeholder="Nº particip."><input id="fn${i}" placeholder="Comentario (opcional)"><button class="p" data-a="ap" data-i="${i}">Añadir aportación</button></div>
 ${tablaM(SR[i],dec(f))}
 <details ${dop('p:'+f.n+'|'+f.cartera)}><summary>Aportaciones (${f.ap.length})</summary><table>${ord(f.ap).map(a=>`<tr><td>${fes(a.fecha)}</td><td>${a.vl}</td><td>${a.part}</td><td>${eur(a.vl*a.part)}</td>${nt(a.nota)}<td><button data-a="delap" data-i="${i}" data-j="${a.j}">✕</button></td></tr>`).join('')}</table></details>
 <details ${dop('h:'+f.n+'|'+f.cartera)}><summary>Historial de precios (${f.hist.length})</summary><table>${ord(f.hist).map(h=>`<tr><td>${fes(h.fecha)}</td><td>${h.vl}</td></tr>`).join('')}</table></details></details>`};
 const cart=(c,ci)=>{const as=S.fondos.map((f,i)=>i).filter(i=>S.fondos[i].cartera===c.n),n=as.reduce((t,i)=>t+inv(S.fondos[i]),0),v=as.reduce((t,i)=>t+parts(S.fondos[i])*S.fondos[i].vl,0),cm=c.com.reduce((t,x)=>t+x.importe,0);
 return`<section><details class="cart" ${dop('c:'+c.n,1)}><summary><h2 style="display:inline;margin:0">Cartera: ${c.n}</h2><span>${eur(v)} · <span class="${v>=n?'ok':'ko'}">${eur(v-n)} (${pct(v,n)})</span></span></summary><div class="g" style="margin-top:12px">${kp('Invertido',eur(n))}${kp('Valor actual',eur(v))}${kp('Beneficio',eur(v-n)+' · '+pct(v,n),v>=n?'ok':'ko')}${kp('Comisiones',eur(cm))}${kp('Resultado tras comisiones',eur(v-n-cm),v-n-cm>=0?'ok':'ko')}</div>
 <div class="f"><button data-a="delcart" data-c="${ci}">Eliminar cartera</button></div>
 <details ${dop('m:'+c.n)}><summary>Comisiones de la cartera (${c.com.length}) · ${eur(cm)}</summary><div class="f"><input type="date" id="cd${ci}" value="${hoy()}"><input type="number" step="0.01" id="cm${ci}" placeholder="Importe €"><input id="cn${ci}" placeholder="Comentario (ej. comisión anual)"><button class="p" data-a="com" data-c="${ci}">Añadir comisión</button></div><table>${ord(c.com).map(x=>`<tr><td>${fes(x.fecha)}</td><td>${eur(x.importe)}</td>${nt(x.nota)}<td><button data-a="delcom" data-c="${ci}" data-j="${x.j}">✕</button></td></tr>`).join('')}</table></details>
 ${as.map(act).join('')||'<p>Sin activos todavía.</p>'}</details></section>`};
 $('#v').innerHTML=`<section><h2>Añadir a una cartera</h2><div class="f"><select id="cart" data-a="selc">${S.carteras.map(c=>`<option${c.n===(S.carteras.some(x=>x.n===SEL.cart)?SEL.cart:S.carteras[0].n)?' selected':''}>${c.n}</option>`).join('')}<option value="__n">➕ Nueva cartera…</option></select><input id="q" placeholder="Buscar: ISIN, acción, bitcoin…"><button class="p" data-a="buscar">Buscar</button><button data-a="upd">Actualizar precios</button></div>
 <div class="f"><input id="nf" placeholder="O añadir un activo a mano (nombre)"><button data-a="fondo">+ activo</button></div><p id="msg"></p><div id="res">${resHTML()}</div></section>`
 +(AC.length?`<section><h2>Evolución</h2><div class="f">${selH('flt','tipo',[['','Renta fija y variable'],['V','Solo renta variable'],['F','Solo renta fija']],FL.tipo)}${selH('flt','cart',[['','Todas las carteras'],...S.carteras.map(c=>[c.n,c.n])],FL.cart)}${selH('flt','fondo',[['','Todos los activos'],...ok.map(i=>[String(i),S.fondos[i].n])],FL.fondo)}${rgSel()}</div>${lineas(AC,[['t','#9ca3af','Total aportado'],['val','#f97316','Valor acumulado']])}${tablaM(AC,sel.length===1&&dec(S.fondos[sel[0]]))}</section>`:'')
 +S.carteras.map(cart).join('')}
function historico(){
 const M=rango([...S.saldos,...S.deudas].map(r=>r.fecha).concat(S.fondos.flatMap(f=>f.ap.map(a=>a.fecha)))),
 en=(a,k)=>S.bancos.reduce((t,b)=>{const x=a.filter(r=>r.banco===b&&r.fecha<=k+'-31').sort((p,q)=>p.fecha<q.fecha?-1:1);return t+(x.length?x[x.length-1].importe:0)},0),
 SR=S.fondos.map(f=>serie(f,M)),
 R=M.map((k,i)=>{const liq=en(S.saldos,k),deu=en(S.deudas,k),val=SR.reduce((t,r)=>t+r[i].val,0);return{k,liq,deu,val,pat:liq+val-deu}});
 R.forEach((r,i)=>{const p=R[i-1];r.vr=p?r.liq-p.liq:0;r.pv=p&&p.liq?r.vr/p.liq*100:0;r.gan=p?r.pat-p.pat:0;r.rat=r.liq+r.val?r.deu/(r.liq+r.val):0});
 const V=cut(R),c=v=>v>=0?'ok':'ko',h=t=>`<td><b>${t}</b></td>`;
 $('#v').innerHTML=R.length?`<section><h2>Evolución mensual</h2><div class="f">${rgSel()}</div>${lineas(V,[['liq','#6366f1','Liquidez'],['deu','#ef4444','Deuda'],['pat','#10b981','Patrimonio neto']])}</section>
 <section><h2>Histórico</h2><div style="max-height:480px;overflow:auto"><table><tr>${h('Mes')}${h('Liquidez')}${h('Variación')}${h('%')}${h('Deuda total')}${h('Inversión')}${h('Patrimonio neto')}${h('Ganancia patrimonio')}${h('Ratio deuda/activos')}</tr>
 ${V.slice().reverse().map(r=>`<tr><td>${fm(r.k)}</td><td>${eur(r.liq)}</td><td class="${c(r.vr)}">${eur(r.vr)}</td><td class="${c(r.pv)}">${r.pv.toFixed(2)} %</td><td>${eur(r.deu)}</td><td>${eur(r.val)}</td><td class="${c(r.pat)}">${eur(r.pat)}</td><td class="${c(r.gan)}">${eur(r.gan)}</td><td>${r.rat.toFixed(2)}</td></tr>`).join('')}</table></div></section>`:'<section>Aún no hay datos. Añade saldos, deudas o aportaciones.</section>'}
function ordenar(){const o=(a,b)=>a.fecha<b.fecha?-1:a.fecha>b.fecha?1:0;['saldos','deudas','intereses'].forEach(k=>S[k].sort(o));S.fondos.forEach(f=>{f.ap.sort(o);f.hist.sort(o)});S.carteras.forEach(c=>c.com.sort(o))}
function migrar(){S.fondos=S.fondos||[];S.carteras=S.carteras||[];if(!S.carteras.length)S.carteras.push({n:'Cartera principal',com:[]});
 S.carteras.forEach(c=>c.com=c.com||[]);
 S.fondos.forEach(f=>{if(!f.cartera||!S.carteras.some(c=>c.n===f.cartera))f.cartera=S.carteras[0].n;if(f.isin&&!f.fuente){f.fuente='ft';f.ext=f.isin}f.clase=f.clase||'fondo';f.hist=f.hist||[];
  if(f.com&&f.com.length){const c=S.carteras.find(c=>c.n===f.cartera);f.com.forEach(x=>c.com.push({...x,nota:f.n+(x.nota?': '+x.nota:'')}))}delete f.com});ordenar()}
function setVl(f,v){f.vl=v;f.hist=f.hist||[];const d=hoy(),h=f.hist.find(x=>x.fecha===d);h?h.vl=v:f.hist.push({fecha:d,vl:v})}
async function api(u){const r=await fetch(u);let d;try{d=await r.json()}catch(e){throw new Error('el servidor no es servidor.py; páralo (Ctrl+C) y ejecuta: python servidor.py')}if(!r.ok)throw new Error(d.error||'Error');return d}
const msg=t=>{const m=$('#msg');if(m)m.textContent=t};
async function buscarAct(){const q=$('#q').value.trim();if(!q)return;msg('Buscando…');try{const d=await api('/api/buscar?q='+encodeURIComponent(q));RES=d.r;$('#res').innerHTML=resHTML();msg((RES.length?'':'Sin resultados. ')+(d.avisos.length?'Avisos: '+d.avisos.join(' · '):''))}catch(e){msg('No se pudo: '+e.message)}}
async function anadir(j){const r=RES[j],c=$('#cart').value;if(S.fondos.some(f=>f.fuente===r.fuente&&f.ext===r.id&&f.cartera===c))return msg('Ya está en esa cartera');msg('Añadiendo…');
 try{const d=await api('/api/precio?fuente='+r.fuente+'&id='+encodeURIComponent(r.id)),f={n:r.nombre,clase:r.clase,fuente:r.fuente,ext:r.id,cartera:c,moneda:d.moneda,tipo:/bond|treasury|government|fixed income|corporate|aggregate/i.test(r.nombre)?'F':'V',vl:0,ap:[],hist:[]};setVl(f,d.precio);S.fondos.push(f);RES=[];save();go('Inversiones');msg('Añadido: '+r.nombre)}catch(e){msg('No se pudo: '+e.message)}}
async function actualizar(){msg('Actualizando…');let ok=0,ko=0;for(const f of S.fondos.filter(f=>f.fuente)){try{setVl(f,(await api('/api/precio?fuente='+f.fuente+'&id='+encodeURIComponent(f.ext))).precio);ok++}catch(e){ko++}}save();go('Inversiones');msg(ok+' actualizados, '+ko+' con error')}
document.addEventListener('click',e=>{const t=e.target,a=t.dataset.a,i=+t.dataset.i;
 if(t.dataset.tab)return go(t.dataset.tab);if(!a)return;
 if(a==='banco'){const n=(prompt('Nombre del banco')||'').trim();if(n&&!S.bancos.includes(n))S.bancos.push(n)}
 else if(a==='add'){const m=parseFloat($('#m').value),b=$('#b').value;if(isNaN(m)||!b)return alert('Falta banco o importe');S[t.dataset.k].push({fecha:$('#d').value,banco:b,importe:m,nota:$('#n').value.trim()})}
 else if(a==='del'){if(!confirm('¿Eliminar este registro?'))return;S[t.dataset.k].splice(i,1)}
 else if(a==='fondo'){const n=$('#nf').value.trim();if(n)S.fondos.push({n,clase:'fondo',cartera:$('#cart').value,tipo:'V',vl:0,ap:[],hist:[]})}
 else if(a==='cart'){const n=$('#ncart').value.trim();if(n&&!S.carteras.some(c=>c.n===n))S.carteras.push({n,com:[]})}
 else if(a==='delcart'){const c=S.carteras[+t.dataset.c];if(S.carteras.length<2)return alert('Debe quedar al menos una cartera.');const as=S.fondos.filter(f=>f.cartera===c.n);if(!confirm(as.length?`La cartera «${c.n}» tiene ${as.length} activo(s) con sus aportaciones y ${c.com.length} comisión(es). Se eliminará todo. ¿Continuar?`:`¿Eliminar la cartera «${c.n}»?`))return;S.fondos=S.fondos.filter(f=>f.cartera!==c.n);S.carteras.splice(+t.dataset.c,1);if(SEL.cart===c.n)SEL.cart='';if(FL.cart===c.n)FL.cart=''}
 else if(a==='delact'){if(!confirm('¿Eliminar este activo y sus aportaciones?'))return;S.fondos.splice(i,1)}
 else if(a==='ap'){const v=parseFloat($('#fv'+i).value),p=parseFloat($('#fp'+i).value);if(isNaN(v)||isNaN(p))return alert('Faltan datos');const f=S.fondos[i];f.ap.push({fecha:$('#fd'+i).value,vl:v,part:p,nota:$('#fn'+i).value.trim()});if(!f.vl)f.vl=v}
 else if(a==='com'){const c=t.dataset.c,m=parseFloat($('#cm'+c).value);if(isNaN(m))return alert('Falta el importe');S.carteras[+c].com.push({fecha:$('#cd'+c).value,importe:m,nota:$('#cn'+c).value.trim()})}
 else if(a==='delcom'){if(!confirm('¿Eliminar esta comisión?'))return;S.carteras[+t.dataset.c].com.splice(+t.dataset.j,1)}
 else if(a==='delap'){if(!confirm('¿Eliminar esta aportación?'))return;S.fondos[i].ap.splice(+t.dataset.j,1)}
 else if(a==='exp'){const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:'application/json'}));l.download='finanzas-'+hoy()+'.json';l.click();return}
 else if(a==='imp'){$('#imp').click();return}
 else if(a==='buscar'){buscarAct();return}
 else if(a==='addres'){anadir(+t.dataset.r);return}
 else if(a==='upd'){actualizar();return}
 else return;
 save();go(tab)});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.a==='selb'){if(t.value==='__n'){const n=(prompt('Nombre del banco nuevo')||'').trim();if(n){if(!S.bancos.includes(n))S.bancos.push(n);SEL.b=n;save()}}else SEL.b=t.value;go(tab)}if(t.dataset.a==='selc'){if(t.value==='__n'){const n=(prompt('Nombre de la nueva cartera')||'').trim();if(n){if(!S.carteras.some(c=>c.n===n))S.carteras.push({n,com:[]});SEL.cart=n;save()}}else SEL.cart=t.value;go(tab)}if(t.dataset.a==='fm'){FM[t.dataset.k]=t.value;go(tab)}if(t.dataset.a==='fe'){FE[t.dataset.k]=t.value;go(tab)}if(t.dataset.a==='mv'){S.fondos[+t.dataset.i].cartera=t.value;save();go(tab)}if(t.dataset.a==='rg'){RG=t.value;go(tab)}if(t.dataset.a==='fi'){FI[t.dataset.k]=t.value;go(tab)}if(t.dataset.a==='flt'){FL[t.dataset.k]=t.value;go(tab)}if(t.dataset.a==='tipo'){S.fondos[+t.dataset.i].tipo=t.value;save();go(tab)}if(t.dataset.a==='vl'){setVl(S.fondos[+t.dataset.i],parseFloat(t.value)||0);save();go(tab)}});
$('#imp').addEventListener('change',e=>{const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.bancos||!d.fondos)throw 0;S=d;migrar();save();go('Resumen')}catch(x){alert('Archivo no válido')}};r.readAsText(e.target.files[0])});
migrar();go('Resumen');
