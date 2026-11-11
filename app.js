const K='finanzas_v1',TABS=['Resumen','Cuentas','Deudas','Inversiones','Intereses','Histórico','Ajustes'];
let S={bancos:[],saldos:[],deudas:[],intereses:[],fondos:[]},tab='Resumen';
try{const r=localStorage.getItem(K);if(r)S=JSON.parse(r)}catch(e){}
const save=()=>{ordenar();if(VAULT.key)volcar();else try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}};
const $=s=>document.querySelector(s);
const eur=n=>(n||0).toLocaleString('es-ES',{style:'currency',currency:'EUR'});
const hoy=()=>new Date().toISOString().slice(0,10);
const ultimo=(a,b)=>{const x=a.filter(r=>r.banco===b).sort((p,q)=>p.fecha<q.fecha?-1:1);return x.length?x[x.length-1].importe:0};
const suma=a=>a.reduce((s,r)=>s+r.importe,0);
const parts=f=>f.ap.reduce((s,a)=>s+a.part,0);
const inv=f=>f.ap.reduce((s,a)=>s+a.part*a.vl,0);
function go(t){const mismo=t===tab,y=window.scrollY;if(!mismo){OPEN.clear();SEEN.clear()}tab=t;const rb=$('#refreshSummary');if(rb)rb.style.display='inline-block';$('#nav').innerHTML=TABS.map(x=>`<button class="${x===t?'on':''}" data-tab="${x}">${x}</button>`).join('');
 ({Resumen:resumen,Cuentas:()=>registro('saldos','Saldo'),Deudas:()=>registro('deudas','Deuda'),Inversiones:inversiones,Intereses:intereses,Histórico:historico,Ajustes:ajustes})[t]();if(mismo)window.scrollTo(0,y)}
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
 ${kpi('Total efectivo + inversiones',eur(tot),'Activos totales')}
 <section class="s4"><h2>Distribución</h2><div class="donut" style="--p:${tot?liq/tot*100:0}"><div><span><b>${P(liq,tot)}</b><br>efectivo</span></div></div>
  <div class="leg" style="margin-top:12px"><span><i style="background:var(--a)"></i>Efectivo ${P(liq,tot)}</span><span><i style="background:#f59e0b"></i>Invertido ${P(fv,tot)}</span></div>
  <div class="bar"><span style="width:${fv?rv.v/fv*100:0}%"></span><span style="width:${fv?rf.v/fv*100:0}%"></span></div>
  <div class="leg"><span><i style="background:var(--a)"></i>R. variable ${P(rv.v,fv)}</span><span><i style="background:#f59e0b"></i>R. fija ${P(rf.v,fv)}</span></div></section>
 <section class="s4"><h2>Cuentas</h2><table>${S.bancos.slice().sort((p,q)=>ultimo(S.saldos,q)-ultimo(S.saldos,p)).map(b=>`<tr><td>${b}</td><td>${eur(ultimo(S.saldos,b))}</td></tr>`).join('')}<tfoot><tr><td>Total</td><td>${eur(liq)}</td></tr></tfoot></table></section>
 <section class="s4"><h2>Deudas</h2><table>${conDeuda.slice().sort((p,q)=>ultimo(S.deudas,q)-ultimo(S.deudas,p)).map(b=>`<tr><td>${b}</td><td class="ko">${eur(ultimo(S.deudas,b))}</td></tr>`).join('')}<tfoot><tr><td>Total deudas</td><td class="ko">${eur(deu)}</td></tr></tfoot></table></section>
 <section class="s12"><h2>Activos por cartera</h2><div class="gt">
 <div class="gr h"><span></span><span>Invertido</span><span>Valor actual</span><span>Beneficio</span><span>% beneficio</span></div>
 ${S.carteras.map(c=>{const as=F.filter(x=>x.f.cartera===c.n),n=as.reduce((t,x)=>t+x.n,0),v=as.reduce((t,x)=>t+x.v,0);
  const gv=t=>{const z=as.filter(x=>(x.f.tipo||'V')===t);return{n:z.reduce((q,x)=>q+x.n,0),v:z.reduce((q,x)=>q+x.v,0)}},rvC=gv('V'),rfC=gv('F'),mixta=rvC.v>0&&rfC.v>0;
  const categorias=mixta?`<div class="gr in category-row"><span><b>Renta variable</b> <small style="color:var(--m)">(${P(rvC.v,v)})</small></span><span>${eur(rvC.n)}</span><span>${eur(rvC.v)}</span>${bs(rvC.n,rvC.v)}</div><div class="gr in category-row"><span><b>Renta fija</b> <small style="color:var(--m)">(${P(rfC.v,v)})</small></span><span>${eur(rfC.n)}</span><span>${eur(rfC.v)}</span>${bs(rfC.n,rfC.v)}</div>`:'';
  const activos=as.map(x=>`<div class="gr in asset-row"><span>${x.f.n} <small style="color:var(--m)">(${P(x.v,v)})</small></span><span>${eur(x.n)}</span><span>${eur(x.v)}</span>${bs(x.n,x.v)}</div>`).join('')||'<div class="gr in"><span>Sin activos</span></div>';
  return`<details class="rc" ${dop('r:'+c.n)}><summary class="gr"><span><b>${c.n}</b> <small style="color:var(--m)">(${P(v,fv)})</small></span><span>${eur(n)}</span><span>${eur(v)}</span>${bs(n,v)}</summary>${categorias}${activos}</details>`}).join('')}
 <div class="gr tot"><span>Total activos</span><span>${eur(rv.n+rf.n)}</span><span>${eur(fv)}</span>${bs(rv.n+rf.n,fv)}</div>
 <div class="gr"><span>Comisiones pagadas</span><span></span><span></span><span class="ko">${eur(com)}</span><span></span></div></div></section></div>
`}
const nt=t=>`<td style="text-align:left;color:var(--m);white-space:normal">${t||''}</td>`;
function formReg(k,l){return`<section class="add-panel"><h2>${k==='saldos'?'Cuentas':k==='deudas'?'Deudas':'Intereses'}</h2><p class="muted">Registra un nuevo movimiento.</p><button class="p" data-a="openreg" data-k="${k}" data-l="${l}">＋ Añadir aportación</button></section>`}
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
 c=v=>k==='deudas'?(v<=0?'ok':'ko'):(v>=0?'ok':'ko'),h=t=>`<td><b>${t}</b></td>`,sr=bs.map((b,j)=>['b'+j,COL[j%COL.length],b]);if(bs.length>1)sr.push(['t','#10b981','Total']);
 return`<section><h2>Evolución</h2><div class="f">${selH('fe',k,[['','Todos los bancos'],...S.bancos.map(b=>[b,b])],FE[k])}${selH('fm',k,[['r','Cada registro'],['m','Último registro de cada mes']],FM[k])}${rgSel()}</div>${V.length?`<div style="max-height:360px;overflow:auto"><table><tr>${h('Fecha')}${bs.map(b=>h(b)).join('')}${bs.length>1?h('Total'):''}${h(vl)}</tr>${V.slice().reverse().map(r=>`<tr><td>${fes(r.k)}</td>${bs.map((b,j)=>`<td>${eur(r['b'+j])}</td>`).join('')}${bs.length>1?`<td>${eur(r.t)}</td>`:''}<td class="${c(r.d)}">${r.d==null?'':eur(r.d)}</td></tr>`).join('')}</table></div>`+lineas(V,sr):'<p>Aún no hay datos.</p>'}</section>`}
function registroDialog(k,l){const q=S.bancos.includes(SEL.b)?SEL.b:S.bancos[0];return`<dialog class="modal" id="regdlg"><form method="dialog" class="modal-card"><button class="modal-x" type="submit" formnovalidate value="cancel" aria-label="Cerrar">×</button><h2>Nueva aportación</h2><label>Cuenta / banco<select id="b" data-a="selb">${(S.bancos.length?'':'<option value="">Selecciona banco…</option>')+S.bancos.map(b=>`<option${b===q?' selected':''}>${b}</option>`).join('')}<option value="__n">＋ Nuevo banco…</option></select></label><label>Fecha<input type="date" id="d" value="${hoy()}" required></label><label>Importe (€)<input type="number" step="0.01" id="m" placeholder="${l}" required></label><label>Comentario<input id="n" placeholder="Opcional"></label><div class="modal-actions"><button type="submit" formnovalidate value="cancel">Cancelar</button><button class="p" type="button" data-a="add" data-k="${k}">Guardar aportación</button></div></form></dialog>`}
function balanceStats(k){
 const rs=S[k],banks=S.bancos.filter(b=>rs.some(r=>r.banco===b)),now=new Date(hoy()+'T12:00:00'),
 currentKey=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0'),
 previousDate=new Date(now.getFullYear(),now.getMonth()-1,1),
 previousKey=previousDate.getFullYear()+'-'+String(previousDate.getMonth()+1).padStart(2,'0'),
 monthValue=(own,key)=>{const x=own.filter(r=>(r.fecha||'').slice(0,7)===key).sort((a,b)=>a.fecha<b.fecha?-1:a.fecha>b.fecha?1:0);return x.length?Number(x[x.length-1].importe)||0:0},
 rows=banks.map(b=>{const own=rs.filter(r=>r.banco===b),value=monthValue(own,currentKey),prev=monthValue(own,previousKey),delta=value-prev;return{b,value,delta,prev}}),
 value=rows.reduce((a,x)=>a+x.value,0),delta=rows.reduce((a,x)=>a+x.delta,0),prev=rows.reduce((a,x)=>a+x.prev,0),
 card=(name,v,d,p,hero=false)=>{const color=d===null||d===0?'':(k==='deudas'?(d<0?'ok':'ko'):(d>0?'ok':'ko'));return '<div class="stat-card'+(hero?' hero':'')+'"><small>'+name+'</small><b>'+eur(v)+'</b><small class="'+color+'">'+(d===null?'Sin datos para comparar':(d>0?'+':'')+eur(d)+' · '+(p===null?'—':(p>0?'+':'')+p.toFixed(2)+'%')+' vs. mes anterior')+'</small></div>'};
 return '<div class="stat-grid">'+card('Total '+(k==='saldos'?'en cuentas':'deuda'),value,delta,prev!==0?delta/prev*100:null,true)+rows.map(x=>card(x.b,x.value,x.delta,x.prev!==0?x.delta/x.prev*100:null)).join('')+'</div>';
}
function registro(k,l){$('#v').innerHTML=formReg(k,l)+balanceStats(k)+`<details class="fold"><summary>Ver evolución</summary>${evol(k,k==='deudas'?'Variación (cuota)':'Variación')}</details><details class="fold"><summary>Ver registros anteriores (${S[k].length})</summary>${listaReg(k)}</details>`+registroDialog(k,l)}

function intereses(){
 const endDate=hoy(),period=FI.periodo==='1'?'month':(FI.periodo||'ytd'),
 startFor=v=>{const d=new Date();if(v==='ytd')return d.getFullYear()+'-01-01';if(v==='month')return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01';if(v==='all')return S.intereses.map(x=>x.fecha).sort()[0]||endDate;d.setMonth(d.getMonth()-Number(v));return d.toISOString().slice(0,10)},
 start=startFor(period),rec=S.intereses.filter(r=>r.fecha>=start&&r.fecha<=endDate&&(!FI.banco||r.banco===FI.banco)),
 allBanks=S.bancos.filter(b=>!FI.banco||b===FI.banco),
 balanceBefore=(b,day)=>{const x=S.saldos.filter(r=>r.banco===b&&r.fecha<day).sort((p,q)=>p.fecha<q.fecha?-1:1);return x.length?x[x.length-1].importe:null},
 months=[...new Set(rec.map(r=>r.fecha.slice(0,7)))].sort(),
 monthStats=(b,m)=>{const rows=rec.filter(r=>r.banco===b&&r.fecha.slice(0,7)===m).sort((x,y)=>x.fecha<y.fecha?-1:1),amount=rows.reduce((n,x)=>n+x.importe,0),base=rows.length?balanceBefore(b,rows[0].fecha):null;return{amount,base,rate:base!==null&&base>0?amount/base*100:null}},
 compound=z=>{const valid=z.filter(x=>x!==null&&Number.isFinite(x));return valid.length?(valid.reduce((f,x)=>f*(1+x/100),1)-1)*100:null},
 interestFor=b=>rec.filter(r=>r.banco===b).reduce((n,x)=>n+x.importe,0),
 active=allBanks.map(b=>({b,amount:interestFor(b),rate:compound(months.map(m=>monthStats(b,m)).filter(x=>x.amount>0).map(x=>x.rate))})).filter(x=>x.amount>0).sort((x,y)=>y.amount-x.amount),
 banks=active.map(x=>x.b),
 total=rec.reduce((n,x)=>n+x.importe,0),
 totalRate=compound(months.map(m=>{const rows=banks.map(b=>monthStats(b,m)).filter(x=>x.amount>0&&x.base!==null&&x.base>0),base=rows.reduce((n,x)=>n+x.base,0),amount=rows.reduce((n,x)=>n+x.amount,0);return base?amount/base*100:null})),
 card=(name,v,p,detail,hero=false)=>'<div class="stat-card'+(hero?' hero':'')+'"><small>'+name+'</small><b>'+eur(v)+'</b><small>'+(p===null?'Sin saldo anterior al abono': 'Rentabilidad compuesta del periodo: '+p.toFixed(2)+'%'+(detail?' · '+detail:''))+'</small></div>',
 opts=[['ytd','Este año'],['month','Este mes'],['3','Últimos 3 meses'],['6','Últimos 6 meses'],['12','Últimos 12 meses'],['all','Todo el histórico']],
 filters='<div class="f period-filters"><label>Periodo de cálculo '+selH('fi','periodo',opts,period)+'</label><label>Banco '+selH('fi','banco',[['','Todos los bancos'],...S.bancos.map(b=>[b,b])],FI.banco)+'</label></div>',
 cards='<div class="stat-grid">'+card('Intereses totales',total,totalRate,'suma de rentabilidades mensuales',true)+active.map(x=>card(x.b,x.amount,x.rate,'intereses cobrados')).join('')+'</div>',
 R=months.map(m=>{const v=banks.map(b=>monthStats(b,m).amount);return{l:fm(m),v,t:v.reduce((x,y)=>x+y,0)}}),
 rateRows=months.map(m=>{const z=banks.map(b=>monthStats(b,m)).filter(x=>x.amount>0&&x.base!==null&&x.base>0),base=z.reduce((n,x)=>n+x.base,0),amount=z.reduce((n,x)=>n+x.amount,0);return{m,rate:base?amount/base*100:null}});
 $('#v').innerHTML=formReg('intereses','Interés')+filters+cards+`<details class="fold"><summary>Ver desglose de intereses</summary><section><h2>Intereses recibidos por mes</h2><div style="max-height:320px;overflow:auto"><table><tr><td><b>Mes</b></td>${banks.map(b=>`<td><b>${b}</b></td>`).join('')}<td><b>Total</b></td><td><b>Rentabilidad mensual</b></td></tr>${R.slice().reverse().map(x=>{const i=months.findIndex(m=>fm(m)===x.l);return `<tr><td>${x.l}</td>${x.v.map(v=>`<td>${eur(v)}</td>`).join('')}<td>${eur(x.t)}</td><td>${rateRows[i]?.rate==null?'—':rateRows[i].rate.toFixed(2)+'%'}</td></tr>`}).join('')}</table></div>${barras(R,banks)}</section></details><details class="fold"><summary>Ver registros anteriores (${S.intereses.length})</summary>${listaReg('intereses')}</details>`+registroDialog('intereses','Interés');
}

const fm=k=>{const[y,m]=k.split('-');return['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][m-1]+'-'+y.slice(2)};
const pct=(v,n)=>n?((v/n-1)*100).toFixed(2)+' %':'–';
let RES=[],SEL={b:'',cart:''},FE={saldos:'',deudas:''},FM={saldos:'r',deudas:'r'},FL={tipo:'',cart:'',fondo:''},RG='',FI={banco:'',esc:'m',periodo:'ytd'};
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
 kp=(t,v,c='',s='')=>`<div class="k"><small>${t}</small><b class="${c}">${v}</b>${s?`<small>${s}</small>`:''}</div>`,
 pf=v=>(+v||0).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:4}),SIM={USD:'$',GBP:'£',GBX:'p',JPY:'¥'},
 ext=f=>f.moneda&&f.moneda!=='EUR'&&f.vlo!=null,
 pSub=f=>{const d=f.fp||(f.hist.slice(-1)[0]||{}).fecha;return(d?(f.fpd?'precio del ':'actualizado el ')+fes(d):'sin fecha')+(ext(f)&&f.tc?` · 1 ${f.moneda} = ${(+f.tc).toFixed(4)} €`:'')},
 tablaM=(r,p)=>`<div style="max-height:320px;overflow:auto"><table><tr><td><b>Fecha</b></td><td><b>Aportación</b></td>${p?'<td><b>Particip.</b></td>':''}<td><b>Total aportado</b></td><td><b>Valor acum.</b></td></tr>${r.slice().reverse().map(x=>`<tr><td>${fm(x.k)}</td><td>${eur(x.ap)}</td>${p?`<td>${x.pa.toFixed(p)}</td>`:''}<td>${eur(x.t)}</td><td>${eur(x.val)}</td></tr>`).join('')}</table></div>`,
 resHTML=()=>RES.map((r,j)=>`<div class="f" style="align-items:center"><span style="flex:1">${r.nombre}<br><small style="color:var(--m)">${r.detalle}</small></span><button class="p" data-a="addres" data-r="${j}">Añadir</button></div>`).join('');
function inversionDialog(){return`<dialog class="modal" id="apdlg"><form method="dialog" class="modal-card"><button class="modal-x" type="submit" formnovalidate value="cancel" aria-label="Cerrar">×</button><h2>Nueva aportación</h2><label>Fecha<input type="date" id="apfecha" value="${hoy()}" required></label><label>Precio de compra (€)<input type="number" step="any" id="apprecio" placeholder="Precio por participación" required></label><label>Número de participaciones<input type="number" step="any" id="appart" placeholder="Cantidad" required></label><label>Comentario<input id="apnota" placeholder="Opcional"></label><div class="modal-actions"><button type="submit" formnovalidate value="cancel">Cancelar</button><button class="p" type="button" data-a="ap">Guardar aportación</button></div></form></dialog>`}
function inversiones(){
 const M=meses(),SR=S.fondos.map(f=>serie(f,M)),
 ok=S.fondos.map((f,i)=>i).filter(i=>(!FL.tipo||(S.fondos[i].tipo||'V')===FL.tipo)&&(!FL.cart||S.fondos[i].cartera===FL.cart)),
 sel=FL.fondo!==''&&ok.includes(+FL.fondo)?[+FL.fondo]:ok,
 sm=(i,c)=>sel.reduce((s,j)=>s+SR[j][i][c],0),
 AC=cut(sel.length===1?SR[sel[0]]:M.map((k,i)=>({k,ap:sm(i,'ap'),t:sm(i,'t'),val:sm(i,'val')})));
 const act=i=>{const f=S.fondos[i],p=parts(f),n=inv(f),v=p*f.vl,u=f.hist.slice(-1)[0],c=v>=n?'ok':'ko';
 return`<details class="sub" ${dop('a:'+f.n+'|'+f.cartera)}><summary><b>${f.n}</b><span class="inv-summary-values"><span class="inv-total">${eur(v)}</span><span class="${c}">${eur(v-n)} · ${pct(v,n)}</span></span></summary><div class="f"><button data-a="delact" data-i="${i}">Eliminar activo</button></div><small>${CLA[f.clase]||''} ${f.ext||''}${f.moneda&&f.moneda!=='EUR'?' · '+f.moneda+' → EUR':''}</small>
 <div class="g">${kp('Precio actual',pf(f.vl)+' €'+(ext(f)?` <small style="display:inline;margin-left:4px">${pf(f.vlo)} ${SIM[f.moneda]||f.moneda}</small>`:''),'',pSub(f))}${kp('Dinero invertido',eur(n))}${kp('Participaciones',p.toFixed(dec(f)))}${kp('Precio medio de compra',(p?n/p:0).toFixed(2)+' €')}${kp('Valor actual',eur(v))}${kp('Beneficio',eur(v-n)+' · '+pct(v,n),c)}</div>
 <div class="f">${f.fuente?'':`<label>Precio actual (manual) <input type="number" step="any" value="${f.vl}" data-a="vl" data-i="${i}"></label>`}<label>Tipo ${selH('tipo','',[['V','Renta variable'],['F','Renta fija']],f.tipo||'V',i)}</label><label>Cartera ${selH('mv','',S.carteras.map(c=>[c.n,c.n]),f.cartera,i)}</label></div>
 <div class="f"><button class="p" data-a="openap" data-i="${i}">＋ Añadir aportación</button></div>
 <details class="fold"><summary>Evolución mensual</summary>${tablaM(SR[i],dec(f))}</details>
 <details ${dop('p:'+f.n+'|'+f.cartera)}><summary>Aportaciones (${f.ap.length})</summary><table class="contrib-table"><thead><tr><th>Fecha</th><th>Valor liquidativo</th><th>Participaciones</th><th>Precio total</th><th>Nota</th><th></th></tr></thead><tbody>${ord(f.ap).map(a=>`<tr><td>${fes(a.fecha)}</td><td>${a.vl}</td><td>${a.part}</td><td>${eur(a.vl*a.part)}</td>${nt(a.nota)}<td><button data-a="delap" data-i="${i}" data-j="${a.j}">✕</button></td></tr>`).join('')}</tbody></table></details>
 <details ${dop('h:'+f.n+'|'+f.cartera)}><summary>Historial de precios (${f.hist.length})</summary><table>${ord(f.hist).map(h=>`<tr><td>${fes(h.fecha)}</td><td>${h.vl}</td></tr>`).join('')}</table></details></details>`};
 const cart=(c,ci)=>{const as=S.fondos.map((f,i)=>i).filter(i=>S.fondos[i].cartera===c.n),n=as.reduce((t,i)=>t+inv(S.fondos[i]),0),v=as.reduce((t,i)=>t+parts(S.fondos[i])*S.fondos[i].vl,0),cm=c.com.reduce((t,x)=>t+x.importe,0);
 return`<section><details class="cart" ${dop('c:'+c.n)}><summary><h2 style="display:inline;margin:0">Cartera: ${c.n}</h2><span>${eur(v)} · <span class="${v>=n?'ok':'ko'}">${eur(v-n)} (${pct(v,n)})</span></span></summary><div class="g" style="margin-top:12px">${kp('Invertido',eur(n))}${kp('Valor actual',eur(v))}${kp('Beneficio',eur(v-n)+' · '+pct(v,n),v>=n?'ok':'ko')}${kp('Comisiones',eur(cm))}${kp('Resultado tras comisiones',eur(v-n-cm),v-n-cm>=0?'ok':'ko')}</div>
 <div class="f"><button data-a="delcart" data-c="${ci}">Eliminar cartera</button></div>
 <details ${dop('m:'+c.n)}><summary>Comisiones de la cartera (${c.com.length}) · ${eur(cm)}</summary><div class="f"><input type="date" id="cd${ci}" value="${hoy()}"><input type="number" step="0.01" id="cm${ci}" placeholder="Importe €"><input id="cn${ci}" placeholder="Comentario (ej. comisión anual)"><button class="p" data-a="com" data-c="${ci}">Añadir comisión</button></div><table>${ord(c.com).map(x=>`<tr><td>${fes(x.fecha)}</td><td>${eur(x.importe)}</td>${nt(x.nota)}<td><button data-a="delcom" data-c="${ci}" data-j="${x.j}">✕</button></td></tr>`).join('')}</table></details>
 ${as.map(act).join('')||'<p>Sin activos todavía.</p>'}</details></section>`};
 $('#v').innerHTML=inversionDialog()+`<section><h2>Añadir a una cartera</h2><div class="f"><select id="cart" data-a="selc">${S.carteras.map(c=>`<option${c.n===(S.carteras.some(x=>x.n===SEL.cart)?SEL.cart:S.carteras[0].n)?' selected':''}>${c.n}</option>`).join('')}<option value="__n">➕ Nueva cartera…</option></select><input id="q" placeholder="Buscar: ISIN, acción, bitcoin…"><button class="p" data-a="buscar">Buscar</button><button data-a="upd" class="investment-update">Actualizar precios</button></div>
 <div class="f"><input id="nf" placeholder="O añadir un activo a mano (nombre)"><button data-a="fondo">+ activo</button></div><p id="msg"></p><div id="res">${resHTML()}</div></section>`
 +S.carteras.map(cart).join('')
 +(AC.length?`<details class="fold"><summary>Evolución general de las inversiones</summary><section><div class="f">${selH('flt','tipo',[['','Renta fija y variable'],['V','Solo renta variable'],['F','Solo renta fija']],FL.tipo)}${selH('flt','cart',[['','Todas las carteras'],...S.carteras.map(c=>[c.n,c.n])],FL.cart)}${selH('flt','fondo',[['','Todos los activos'],...ok.map(i=>[String(i),S.fondos[i].n])],FL.fondo)}${rgSel()}</div>${tablaM(AC,sel.length===1&&dec(S.fondos[sel[0]]))}${lineas(AC,[['t','#9ca3af','Total aportado'],['val','#f97316','Valor acumulado']])}</section></details>`:'')}
function historico(){
 const M=rango([...S.saldos,...S.deudas].map(r=>r.fecha).concat(S.fondos.flatMap(f=>f.ap.map(a=>a.fecha)))),
 en=(a,k)=>S.bancos.reduce((t,b)=>{const x=a.filter(r=>r.banco===b&&r.fecha<=k+'-31').sort((p,q)=>p.fecha<q.fecha?-1:1);return t+(x.length?x[x.length-1].importe:0)},0),
 SR=S.fondos.map(f=>serie(f,M)),
 R=M.map((k,i)=>{const liq=en(S.saldos,k),deu=en(S.deudas,k),val=SR.reduce((t,r)=>t+r[i].val,0);return{k,liq,deu,val,pat:liq+val-deu}});
 R.forEach((r,i)=>{const p=R[i-1];r.vr=p?r.liq-p.liq:0;r.pv=p&&p.liq?r.vr/p.liq*100:0;r.gan=p?r.pat-p.pat:0;r.rat=r.liq+r.val?r.deu/(r.liq+r.val):0;r.total=r.liq+r.val;r.vt=p?r.total-p.total:0;r.pt=p&&p.total?r.vt/p.total*100:0});
 const V=cut(R),c=v=>v>=0?'ok':'ko',h=t=>`<td><b>${t}</b></td>`;
 $('#v').innerHTML=R.length?`<section><h2>Histórico</h2><div class="f">${rgSel()}</div><div style="max-height:480px;overflow:auto"><table><tr>${h('Mes')}${h('Liquidez')}${h('Variación')}${h('%')}${h('Inversión')}${h('Efectivo + inversiones')}${h('Variación')}${h('%')}${h('Deuda total')}${h('Patrimonio neto')}${h('Ganancia patrimonio')}${h('Ratio deuda/activos')}</tr>
 ${V.slice().reverse().map(r=>`<tr><td>${fm(r.k)}</td><td>${eur(r.liq)}</td><td class="${c(r.vr)}">${eur(r.vr)}</td><td class="${c(r.pv)}">${r.pv.toFixed(2)} %</td><td>${eur(r.val)}</td><td>${eur(r.total)}</td><td class="${c(r.vt)}">${eur(r.vt)}</td><td class="${c(r.pt)}">${r.pt.toFixed(2)} %</td><td>${eur(r.deu)}</td><td class="${c(r.pat)}">${eur(r.pat)}</td><td class="${c(r.gan)}">${eur(r.gan)}</td><td>${r.rat.toFixed(2)}</td></tr>`).join('')}</table></div></section>
 <section><h2>Evolución mensual</h2>${lineas(V,[['liq','#6366f1','Liquidez'],['deu','#ef4444','Deuda'],['pat','#10b981','Patrimonio neto']])}
 </section>`:'<section>Aún no hay datos. Añade saldos, deudas o aportaciones.</section>'}
function ordenar(){const o=(a,b)=>a.fecha<b.fecha?-1:a.fecha>b.fecha?1:0;['saldos','deudas','intereses'].forEach(k=>S[k].sort(o));S.fondos.forEach(f=>{f.ap.sort(o);f.hist.sort(o)});S.carteras.forEach(c=>c.com.sort(o))}
function migrar(){S.fondos=S.fondos||[];S.carteras=S.carteras||[];if(!S.carteras.length)S.carteras.push({n:'Cartera principal',com:[]});
 S.carteras.forEach(c=>c.com=c.com||[]);
 S.fondos.forEach(f=>{if(!f.cartera||!S.carteras.some(c=>c.n===f.cartera))f.cartera=S.carteras[0].n;if(f.isin&&!f.fuente){f.fuente='ft';f.ext=f.isin}f.clase=f.clase||'fondo';f.hist=f.hist||[];
  if(f.com&&f.com.length){const c=S.carteras.find(c=>c.n===f.cartera);f.com.forEach(x=>c.com.push({...x,nota:f.n+(x.nota?': '+x.nota:'')}))}delete f.com});ordenar()}
function setVl(f,v,fecha,orig,tc){v=Math.round(v*1e6)/1e6;f.vl=v;if(orig!==undefined){f.vlo=orig;f.tc=tc}f.hist=f.hist||[];const d=fecha||hoy();f.fp=d;f.fpd=fecha?1:0;const h=f.hist.find(x=>x.fecha===d);h?h.vl=v:f.hist.push({fecha:d,vl:v})}
async function api(u){const r=await fetch(u);let d;try{d=await r.json()}catch(e){throw new Error('el servidor no es servidor.py; páralo (Ctrl+C) y ejecuta: python servidor.py')}if(!r.ok)throw new Error(d.error||'HTTP '+r.status);return d}
const msg=t=>{const m=$('#msg');if(m)m.textContent=t};
async function buscarAct(){const q=$('#q').value.trim();if(!q)return;msg('Buscando…');try{const d=await api('/api/buscar?q='+encodeURIComponent(q));RES=d.r;$('#res').innerHTML=resHTML();msg((RES.length?'':'Sin resultados. ')+(d.avisos.length?'Avisos: '+d.avisos.join(' · '):''))}catch(e){msg('No se pudo: '+e.message)}}
async function anadir(j){const r=RES[j],c=$('#cart').value;if(S.fondos.some(f=>f.fuente===r.fuente&&f.ext===r.id&&f.cartera===c))return msg('Ya está en esa cartera');msg('Añadiendo…');
 try{const d=await api('/api/precio?fuente='+r.fuente+'&id='+encodeURIComponent(r.id)),f={n:r.nombre,clase:r.clase,fuente:r.fuente,ext:r.id,cartera:c,moneda:d.moneda,tipo:/bond|treasury|government|fixed income|corporate|aggregate/i.test(r.nombre)?'F':'V',vl:0,ap:[],hist:[]};setVl(f,d.precio,d.fecha,d.orig,d.tc);S.fondos.push(f);RES=[];save();go('Inversiones');msg('Añadido: '+r.nombre)}catch(e){msg('No se pudo: '+e.message)}}
let updateResults=[],updateStatus='idle';
function mostrarResumenActualizacion(){
 if(updateStatus==='busy')return;
 const dlg=document.createElement('dialog');dlg.className='modal update-dialog';
 const rows=updateResults.map(x=>'<tr><td>'+x.nombre+'</td><td>'+(x.precio||'—')+'</td><td>'+(x.fecha||'—')+'</td><td class="'+(x.error?'ko':'ok')+'">'+(x.error?'Error: '+x.error:'Actualizado')+'</td></tr>').join('');
 dlg.innerHTML='<div class="modal-card update-card"><button class="modal-x" type="button" aria-label="Cerrar">×</button><h2>Resumen de actualización</h2><p class="muted">'+updateResults.filter(x=>!x.error).length+' actualizados · '+updateResults.filter(x=>x.error).length+' errores</p><div class="update-table-wrap"><table><thead><tr><td><b>Activo</b></td><td><b>Precio</b></td><td><b>Fecha</b></td><td><b>Estado</b></td></tr></thead><tbody>'+(rows||'<tr><td colspan="4">No se actualizó ningún activo.</td></tr>')+'</tbody></table></div><div class="modal-actions"><button type="button" class="update-close">Cerrar</button></div></div>';
 dlg.querySelector('.modal-x').addEventListener('click',()=>dlg.close());dlg.querySelector('.update-close').addEventListener('click',()=>dlg.close());dlg.addEventListener('close',()=>dlg.remove());document.body.appendChild(dlg);dlg.showModal();
}
function pintarEstadoActualizacion(status){
 updateStatus=status;const el=$('#updateStatus');if(!el)return;
 el.className='update-status '+status;el.textContent=status==='busy'?'':status==='ok'?'✓':status==='warn'?'!':status==='error'?'×':'';
 el.title=status==='busy'?'Actualizando precios':status==='ok'?'Actualización correcta':status==='warn'?'Actualización con errores':status==='error'?'No se actualizó ningún activo':'Ver resumen de actualización';
 el.setAttribute('aria-label',el.title);el.style.display=status==='idle'?'none':'inline-flex';
}
async function actualizar(vista=tab){
 const activos=S.fondos.filter(f=>f.fuente);updateResults=[];pintarEstadoActualizacion('busy');
 const trigger=$('#refreshSummary');if(trigger)trigger.disabled=true;
 const inButton=document.querySelector('[data-a="upd"].investment-update');if(inButton)inButton.disabled=true;
 let ok=0,errores=0;
 for(let i=0;i<activos.length;i++){const f=activos[i];
  try{const d=await api('/api/precio?fuente='+f.fuente+'&id='+encodeURIComponent(f.ext));setVl(f,d.precio,d.fecha,d.orig,d.tc);f.moneda=d.moneda;ok++;updateResults.push({nombre:f.n,precio:pf(d.precio)+' '+(d.moneda||'EUR'),fecha:d.fecha?fes(d.fecha):'No indicada'})}
  catch(e){errores++;updateResults.push({nombre:f.n,error:e.message||String(e)})}
  if(f.fuente==='coingecko'&&i<activos.length-1)await new Promise(r=>setTimeout(r,1800))
 }
 if(ok)save();
 go(vista);
 pintarEstadoActualizacion(ok===0?'error':errores?'warn':'ok');
 if(trigger)trigger.disabled=false;
}
document.addEventListener('click',e=>{const t=e.target,a=t.dataset.a,i=+t.dataset.i;
 if(t.dataset.tab)return go(t.dataset.tab);if(!a)return;
 if(a==='banco'){const n=(prompt('Nombre del banco')||'').trim();if(n&&!S.bancos.includes(n))S.bancos.push(n)}
 else if(a==='openreg'){const d=$('#regdlg');if(d){d.querySelector('[data-a="add"]').dataset.k=t.dataset.k;d.showModal()}return}
 else if(a==='openap'){const d=$('#apdlg');if(d){d.dataset.i=i;d.showModal()}return}
 else if(a==='add'){const m=parseFloat($('#m').value),b=$('#b').value;if(isNaN(m)||!b)return alert('Falta banco o importe');S[t.dataset.k].push({fecha:$('#d').value,banco:b,importe:m,nota:$('#n').value.trim()});$('#regdlg')?.close()}
 else if(a==='del'){if(!confirm('¿Eliminar este registro?'))return;S[t.dataset.k].splice(i,1)}
 else if(a==='fondo'){const n=$('#nf').value.trim();if(n)S.fondos.push({n,clase:'fondo',cartera:$('#cart').value,tipo:'V',vl:0,ap:[],hist:[]})}
 else if(a==='cart'){const n=$('#ncart').value.trim();if(n&&!S.carteras.some(c=>c.n===n))S.carteras.push({n,com:[]})}
 else if(a==='delcart'){const c=S.carteras[+t.dataset.c];if(S.carteras.length<2)return alert('Debe quedar al menos una cartera.');const as=S.fondos.filter(f=>f.cartera===c.n);if(!confirm(as.length?`La cartera «${c.n}» tiene ${as.length} activo(s) con sus aportaciones y ${c.com.length} comisión(es). Se eliminará todo. ¿Continuar?`:`¿Eliminar la cartera «${c.n}»?`))return;S.fondos=S.fondos.filter(f=>f.cartera!==c.n);S.carteras.splice(+t.dataset.c,1);if(SEL.cart===c.n)SEL.cart='';if(FL.cart===c.n)FL.cart=''}
 else if(a==='delact'){if(!confirm('¿Eliminar este activo y sus aportaciones?'))return;S.fondos.splice(i,1)}
 else if(a==='ap'){const d=$('#apdlg'),j=+d.dataset.i,v=parseFloat($('#apprecio').value),p=parseFloat($('#appart').value);if(isNaN(v)||isNaN(p)||p<=0)return alert('Indica el precio y un número de participaciones válido');const f=S.fondos[j];f.ap.push({fecha:$('#apfecha').value,vl:v,part:p,nota:$('#apnota').value.trim()});if(!f.vl)f.vl=v;d.close()}
 else if(a==='com'){const c=t.dataset.c,m=parseFloat($('#cm'+c).value);if(isNaN(m))return alert('Falta el importe');S.carteras[+c].com.push({fecha:$('#cd'+c).value,importe:m,nota:$('#cn'+c).value.trim()})}
 else if(a==='delcom'){if(!confirm('¿Eliminar esta comisión?'))return;S.carteras[+t.dataset.c].com.splice(+t.dataset.j,1)}
 else if(a==='delap'){if(!confirm('¿Eliminar esta aportación?'))return;S.fondos[i].ap.splice(+t.dataset.j,1)}
 else if(a==='exp'){const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:'application/json'}));l.download='finanzas-'+hoy()+'.json';l.click();return}
 else if(a==='imp'){$('#imp').click();return}
 else if(a==='buscar'){buscarAct();return}
 else if(a==='addres'){anadir(+t.dataset.r);return}
 else if(a==='upd'){actualizar(tab);return}
 else if(a==='updstats'){mostrarResumenActualizacion();return}
 else if(a==='unlock'){desbloquear($('#pwl').value);return}
 else if(a==='sync'){activar();return}
 else if(a==='subir'){sube();return}
 else if(a==='bloq'){location.reload();return}
 else return;
 save();go(tab)});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.a==='selb'){if(t.value==='__n'){const n=(prompt('Nombre del banco nuevo')||'').trim();if(n){if(!S.bancos.includes(n)){S.bancos.push(n);const o=document.createElement('option');o.value=n;o.textContent=n;t.insertBefore(o,t.lastElementChild)}SEL.b=n;t.value=n;save()}else t.value=SEL.b||S.bancos[0]||''}else SEL.b=t.value}if(t.dataset.a==='selc'){if(t.value==='__n'){const n=(prompt('Nombre de la nueva cartera')||'').trim();if(n){if(!S.carteras.some(c=>c.n===n))S.carteras.push({n,com:[]});SEL.cart=n;save()}}else SEL.cart=t.value;go(tab)}if(t.dataset.a==='fm'){FM[t.dataset.k]=t.value;go(tab)}if(t.dataset.a==='fe'){FE[t.dataset.k]=t.value;go(tab)}if(t.dataset.a==='mv'){S.fondos[+t.dataset.i].cartera=t.value;save();go(tab)}if(t.dataset.a==='rg'){RG=t.value;go(tab)}if(t.dataset.a==='fi'){FI[t.dataset.k]=t.value;go(tab)}if(t.dataset.a==='flt'){FL[t.dataset.k]=t.value;go(tab)}if(t.dataset.a==='tipo'){S.fondos[+t.dataset.i].tipo=t.value;save();go(tab)}if(t.dataset.a==='vl'){setVl(S.fondos[+t.dataset.i],parseFloat(t.value)||0);save();go(tab)}});
$('#imp').addEventListener('change',e=>{const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.bancos||!d.fondos)throw 0;S=d;migrar();save();go('Resumen')}catch(x){alert('Archivo no válido')}};r.readAsText(e.target.files[0])});
// ---- Sincronización cifrada (opcional): los datos se cifran en este dispositivo con tu contraseña
let CFG={},VAULT={key:null,salt:null,t:0,pw:''},busy=0,again=0,vt=null;
const est=t=>{const e=$('#est');if(e)e.textContent=t};
const b64=u=>{let r='';for(let i=0;i<u.length;i+=32768)r+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(r)},ub=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
async function derivar(pw,salt){const m=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},m,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function nuevaClave(pw){VAULT.salt=crypto.getRandomValues(new Uint8Array(16));VAULT.key=await derivar(pw,VAULT.salt);VAULT.pw=pw}
async function cifrar(){const iv=crypto.getRandomValues(new Uint8Array(12)),c=await crypto.subtle.encrypt({name:'AES-GCM',iv},VAULT.key,new TextEncoder().encode(JSON.stringify(S)));return JSON.stringify({s:b64(VAULT.salt),i:b64(iv),c:b64(new Uint8Array(c)),t:Date.now()})}
async function abrir(txt,pw){const o=JSON.parse(txt),salt=ub(o.s),key=await derivar(pw,salt),p=await crypto.subtle.decrypt({name:'AES-GCM',iv:ub(o.i)},key,ub(o.c));VAULT.key=key;VAULT.salt=salt;VAULT.t=o.t;VAULT.pw=pw;return JSON.parse(new TextDecoder().decode(p))}
const DBKEY='balance-vault',DBSTORE='keys';
function abrirDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DBKEY,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(DBSTORE))r.result.createObjectStore(DBSTORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function guardarClave(){if(!VAULT.key)return;let db;try{db=await abrirDB();await new Promise((resolve,reject)=>{const tx=db.transaction(DBSTORE,'readwrite');tx.objectStore(DBSTORE).put(VAULT.key,'principal');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}catch(e){console.warn('No se pudo recordar el desbloqueo',e)}finally{if(db)db.close()}}
async function leerClave(){let db;try{db=await abrirDB();return await new Promise((resolve,reject)=>{const tx=db.transaction(DBSTORE,'readonly'),r=tx.objectStore(DBSTORE).get('principal');r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}catch(e){return null}finally{if(db)db.close()}}
async function abrirConClave(txt,key){const o=JSON.parse(txt),salt=ub(o.s),p=await crypto.subtle.decrypt({name:'AES-GCM',iv:ub(o.i)},key,ub(o.c));VAULT.key=key;VAULT.salt=salt;VAULT.t=o.t;return JSON.parse(new TextDecoder().decode(p))}
async function remoto(){let r;try{r=await fetch('/api/datos')}catch(e){throw new Error('No se pudo conectar con Cloudflare en /api/datos. Comprueba la conexión a Internet y que el Worker esté disponible ('+(e.message||'error de red')+').')}if(r.status===204)return null;if(!r.ok){let detalle='';try{const j=await r.clone().json();detalle=j.error||j.message||''}catch(e){try{detalle=(await r.text()).slice(0,240)}catch(x){}}throw new Error('HTTP '+r.status+(detalle?' — '+detalle:'')+'. Revisa el despliegue del Worker y la configuración D1.')}return r.text()}
function volcar(){clearTimeout(vt);vt=setTimeout(sube,400)}
async function sube(){if(busy){again=1;return}busy=1;
 try{const b=await cifrar();try{localStorage.setItem('fin_blob',b)}catch(e){}est('Guardando…');const r=await fetch('/api/datos',{method:'PUT',headers:{'X-Base':String(VAULT.t||0)},body:b});
  if(r.status===409){busy=0;alert('Los datos se cambiaron en otro dispositivo. Se cargará la versión más reciente.');await recargar();return}
  if(!r.ok)throw new Error(r.status);VAULT.t=JSON.parse(b).t;est('☁ Sincronizado')}catch(e){est('⚠ No se pudo sincronizar: '+(e.message||String(e))+' · Comprueba conexión y Worker')}
 busy=0;if(again){again=0;sube()}}
async function recargar(){try{const t=await remoto();if(t){try{S=await abrir(t,VAULT.pw)}catch(e){throw new Error(e.name==='OperationError'?'No se pudo descifrar la copia remota: la clave de este dispositivo no coincide. Vuelve a desbloquear con tu contraseña.':e.message)}migrar();est('☁ Sincronizado');go(tab)}else est('No hay datos guardados en la nube todavía.')}catch(e){est('⚠ Recarga fallida: '+e.message)}}
async function desbloquear(pw){const m=t=>{const e=$('#msg2');if(e)e.textContent=t};if(!pw)return m('Escribe la contraseña');m('Descifrando…');
 try{let txt=null,off=0;try{txt=await remoto()}catch(e){if(e.message==='Token incorrecto')throw e;off=1;txt=localStorage.getItem('fin_blob')}
  if(txt)S=await abrir(txt,pw);else{await nuevaClave(pw);try{const l=JSON.parse(localStorage.getItem(K)||'null');if(l)S=l}catch(e){}}
  await guardarClave();migrar();go('Resumen');est(off?'⚠ Sin conexión (copia local)':'☁ Sincronizado');if(!txt)sube()}
 catch(e){VAULT.key=null;m(e.name==='OperationError'?'Contraseña incorrecta':'No se pudo: '+e.message)}}
async function activar(){const m=t=>{const e=$('#msgA');if(e)e.textContent=t},a=$('#pw1').value;
 if(!window.crypto||!crypto.subtle)return m('El cifrado solo funciona abriendo la app por https (tu página de Cloudflare) o en localhost.');
 if(!a)return m('Falta la contraseña');if(a!==$('#pw2').value)return m('Las contraseñas no coinciden');if(a.length<8)return m('Usa al menos 8 caracteres');
 CFG={sync:true};m('Comprobando…');
 try{const txt=await remoto();if(txt){if(!confirm('Ya hay datos guardados en la nube. ¿Cargarlos aquí? Se sustituirán los datos de este dispositivo.')){CFG={};return m('')}S=await abrir(txt,a)}else await nuevaClave(a);
  localStorage.setItem('fin_cfg',JSON.stringify(CFG));await guardarClave();migrar();await sube();if(VAULT.t)localStorage.removeItem(K);go('Ajustes')}
 catch(e){CFG={};VAULT.key=null;m(e.name==='OperationError'?'Esa contraseña no corresponde a los datos que hay en la nube':'No se pudo: '+e.message)}}
function ajustes(){const ok=VAULT.key;$('#v').innerHTML='<section><h2>Copias de seguridad</h2><p style="color:var(--m)">Exporta una copia sin cifrar o importa un archivo JSON anterior.</p><div class="f"><button data-a="exp">Exportar copia</button><button data-a="imp">Importar copia</button></div></section>'+ (ok?`<section><h2>Sincronización</h2><p>Los datos se cifran en este dispositivo y en la nube solo hay un bloque ilegible. Estado: <b>${($('#est')||{}).textContent||''}</b></p><div class="f"><button data-a="subir">Sincronizar ahora</button><button data-a="bloq">Bloquear</button></div><p style="color:var(--m)">Si pierdes la contraseña, los datos no se pueden recuperar. «Exportar copia» genera un archivo sin cifrar.</p></section>`
 :`<section><h2>Sincronización y cifrado</h2><p style="color:var(--m)">Introduce una contraseña de cifrado (mínimo 8 caracteres). Será la misma en todos tus dispositivos. Los datos se cifran antes de enviarse a la nube.</p><div class="f"><input type="password" id="pw1" placeholder="Contraseña de cifrado (mín. 8)"><input type="password" id="pw2" placeholder="Repite la contraseña"></div><div class="f"><button class="p" data-a="sync">Activar</button></div><p id="msgA"></p></section>`)}
document.addEventListener('keydown',e=>{if(e.key!=='Enter')return;if(e.target.id==='q'){e.preventDefault();buscarAct()}else if(e.target.id==='pwl'){e.preventDefault();desbloquear(e.target.value)}});
function pantallaBloqueo(){ $('#nav').innerHTML='';$('#v').innerHTML='<section><h2>🔒 Datos cifrados</h2><div class="f"><input type="password" id="pwl" placeholder="Contraseña"><button class="p" data-a="unlock">Entrar</button></div><p id="msg2"></p></section>';const e=$('#pwl');if(e)e.focus()}
async function arranque(){try{CFG=JSON.parse(localStorage.getItem('fin_cfg')||'{}')}catch(e){CFG={}}
 if(!CFG.tok&&!CFG.sync){migrar();go('Resumen');return}
 $('#nav').innerHTML='';$('#v').innerHTML='<section><h2>🔒 Recuperando acceso…</h2><p>Comprobando este dispositivo.</p></section>';
 if(CFG.sync){try{const key=await leerClave();if(key){VAULT.key=key;let txt=null,off=false;try{txt=await remoto()}catch(e){off=true;txt=localStorage.getItem('fin_blob')}if(!txt)txt=localStorage.getItem('fin_blob');if(txt){S=await abrirConClave(txt,key);migrar();go('Resumen');est(off?'⚠ Sin conexión (copia local)':'☁ Sincronizado');return}}}catch(e){VAULT.key=null}}
 pantallaBloqueo()}
arranque();
