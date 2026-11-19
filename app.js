import * as CFG from './firebase-config.js';
import { MODELOS_PADRAO } from './modelos.js';
import { TABELA_PADRAO, CATEGORIAS, TABELA_FONTE } from './precos.js';
import { TERMOS_PADRAO } from './termos.js';
const { FIREBASE_CONFIG, ADMIN_EMAILS } = CFG;
const CLINICA = CFG.CLINICA || {};
const MODO = document.body.dataset.modo === 'gestao' ? 'gestao' : 'recepcao';
const ROUTES = { recepcao:['agenda','pacientes','prontuario','receituario','orcamento','tarefas'], gestao:['visao','agenda','pacientes','prontuario','receituario','orcamento','tarefas','financeiro','acessos'] };
const DONAS = (ADMIN_EMAILS||[]).map(e=>String(e).toLowerCase().trim());
const PAPEL = { recepcao:'Recepção', admin:'Administradora', sync:'Sincronização Google Agenda' };
const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
/* ============ helpers ============ */
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2,'0');
const iso = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parseISO = s => { const [y,m,d] = String(s).split('-').map(Number); return new Date(y,(m||1)-1,d||1); };
const todayISO = () => iso(new Date());
const addDays = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const BRL = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
const fmtData = s => s ? parseISO(s).toLocaleDateString('pt-BR') : '—';
const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const norm = s => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const initials = n => String(n||'?').trim().split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase() || '?';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const toMin = h => { const [a,b] = String(h||'0:0').split(':').map(Number); return (a||0)*60+(b||0); };
const digits = s => String(s||'').replace(/\D/g,'');

const STATUS = {
  agendado:'Agendado', confirmado:'Confirmado', atendimento:'Em atendimento',
  concluido:'Concluído', faltou:'Faltou', cancelado:'Cancelado'
};
const DENTE = {
  higido:{l:'Hígido', c:'#ffffff'}, carie:{l:'Cárie', c:'#ef4444'}, restaurado:{l:'Restaurado', c:'#3b82f6'},
  canal:{l:'Canal', c:'#8b5cf6'}, coroa:{l:'Coroa', c:'#f59e0b'}, implante:{l:'Implante', c:'#14b8a6'},
  extraido:{l:'Extraído / ausente', c:'#cbd5e1'}, tratar:{l:'A tratar', c:'#fb923c'}
};
const ARCADA_SUP = [[18,17,16,15,14,13,12,11],[21,22,23,24,25,26,27,28]];
const ARCADA_INF = [[48,47,46,45,44,43,42,41],[31,32,33,34,35,36,37,38]];

const ICON = {
  agenda:'<svg class="i" viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/></svg>',
  visao:'<svg class="i" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  pacientes:'<svg class="i" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  prontuario:'<svg class="i" viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="18" rx="2"/><path d="M9 3.5h6v3H9zM9 11h.01M12 11h4M9 15h.01M12 15h4"/></svg>',
  financeiro:'<svg class="i" viewBox="0 0 24 24"><path d="M19 7V5a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2"/><path d="M3 6v12a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-3"/></svg>',
  orcamento:'<svg class="i" viewBox="0 0 24 24"><rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8.5 6.5h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h3.5"/></svg>',
  acessos:'<svg class="i" viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="m10.85 12.15 8.65-8.65M18 5l2 2M15 8l2 2"/></svg>',
  tarefas:'<svg class="i" viewBox="0 0 24 24"><rect x="4" y="3.5" width="16" height="18" rx="2"/><path d="m8 9 1.5 1.5L12 8M8 15l1.5 1.5L12 14M14.5 9.5H17M14.5 15.5H17"/></svg>',
  receituario:'<svg class="i" viewBox="0 0 24 24"><rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M9 7h2.5a2 2 0 0 1 0 4H9V7zm0 4v5m2.5-5 4 5m0-3-3 3"/></svg>',
  trash:'<svg class="i" viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0-1 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 6M10 11v6M14 11v6"/></svg>',
  home:'<svg class="i" viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  x:'<svg class="i" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  plus:'<svg class="i" viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M12 5v14M5 12h14"/></svg>'
};
const TOOTH_PATH = 'M5 3c3-2 5 0 7 0s4-2 7 0c3 2 2 7 1 10-1 4-1 11-3 12-2 1-2-6-5-6s-3 7-5 6c-2-1-2-8-3-12-1-3-2-8 1-10z';

/* ============ state ============ */
const S = {
  db:null, auth:null, fb:null, fbApp:null, uid:null, email:'', role:null, authReady:false,
  get isAdmin(){ return this.role==='admin'; },
  readOnly:false, noDb:false, sync:'wait',
  agenda:[], pacientes:[], prontuarios:{}, fin:[], acessos:[], modelosDb:{}, notaTipo:'', tabelaDb:{}, orcamentos:[], tabBusca:'', tabCat:'', tabEdit:false, tarefas:[], tarFiltro:'abertas', tarResp:'', tarBusca:'', receitas:[], favMed:[], favBusca:'',
  agView: (window.innerWidth < 700 ? 'dia' : 'mes'), agDate: todayISO(), agProf:'',
  pacBusca:'', selPac:null, selDente:null, finStatus:'todos', finMes: todayISO().slice(0,7)
};
const COL = {
  agenda: () => S.db.collection('agenda'),
  pacientes: () => S.db.collection('clinica/dados/pacientes'),
  prontuarios: () => S.db.collection('clinica/dados/prontuarios'),
  fin: () => S.db.collection('adm/dados/financeiro'),
  acessos: () => S.db.collection('acessos'),
  modelos: () => S.db.collection('clinica/dados/modelos'),
  tabela: () => S.db.collection('clinica/dados/tabela'),
  orcamentos: () => S.db.collection('clinica/dados/orcamentos'),
  tarefas: () => S.db.collection('clinica/dados/tarefas'),
  receitas: () => S.db.collection('clinica/dados/receitas'),
  favmed: () => S.db.collection('clinica/dados/medfav'),
  anexos: () => S.db.collection('clinica/dados/anexos'),
  anexosBin: () => S.db.collection('clinica/dados/anexosBin'),
  termos: () => S.db.collection('clinica/dados/termos'),
  termosModelos: () => S.db.collection('clinica/dados/termosModelos')
};

/* ============ UI primitives ============ */
let toastT;
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.remove('hidden'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.add('hidden'),3800); }
function openModal(title, body, footer){
  const m=$('#modal');
  m.innerHTML = `<div class="mbox" role="dialog" aria-modal="true"><div class="mh"><h3>${esc(title)}</h3><button class="btn ghost sm" data-close>${ICON.x}</button></div><div class="mb">${body}</div>${footer?`<div class="mf">${footer}</div>`:''}</div>`;
  m.classList.remove('hidden');
  const first = m.querySelector('input,select,textarea'); if(first) setTimeout(()=>first.focus(),30);
  return m;
}
function closeModal(){ const m=$('#modal'); m.classList.add('hidden'); m.innerHTML=''; }
$('#modal').addEventListener('click', e => { if(e.target.id==='modal' || e.target.closest('[data-close]')) closeModal(); });
document.addEventListener('keydown', e => { if(e.key==='Escape' && !$('#modal').classList.contains('hidden')) closeModal(); });
function confirmBox(msg, ok='Excluir'){
  return new Promise(res=>{
    const m = openModal('Confirmar', `<p style="margin:0">${esc(msg)}</p>`, `<div class="r"><button class="btn" data-no>Cancelar</button><button class="btn primary" data-yes>${esc(ok)}</button></div>`);
    m.querySelector('[data-no]').onclick=()=>{closeModal();res(false)};
    m.querySelector('[data-yes]').onclick=()=>{closeModal();res(true)};
  });
}
function formData(form){ const o={}; new FormData(form).forEach((v,k)=>o[k]=typeof v==='string'?v.trim():v); return o; }

/* ============ db writes (one at a time per document) ============ */
const queues = new Map();
function queued(path, fn){ const p=(queues.get(path)||Promise.resolve()).then(fn,fn); queues.set(path,p.catch(()=>{})); return p; }
async function write(kind, ref, data){
  if(!S.db){ toast('Sem conexão com o banco de dados. Verifique a internet e a configuração do Firebase.'); return false; }
  return queued(ref.path, async()=>{
    const run = () => data===null ? ref.delete() : ref.set(data);
    try{ await run(); return true; }
    catch(e){
      if(e && e.code==='unavailable'){ await sleep(400+Math.random()*600); try{ await run(); return true; }catch(e2){ e=e2; } }
      const perm = e && (e.code==='permission-denied' || e.code==='invalid-argument');
      if(perm && kind==='agenda'){ toast('Não foi possível salvar: confira se paciente, data e horário estão preenchidos.'); }
      else if(perm){ toast('Sem permissão. Entre novamente como administrador.'); }
      else if(e && e.code==='resource-exhausted'){ toast('Limite gratuito do Firebase atingido hoje. Tente amanhã.'); }
      else if(e && e.code==='quota_exceeded'){ toast('Limite de armazenamento atingido: '+(e.message||'exclua registros antigos.')); }
      else toast('Não foi possível salvar agora. Tente novamente.');
      return false;
    }
  });
}

/* ============ routing ============ */
function route(){ return (location.hash||'').replace('#','') || 'inicio'; }
function go(r){ if(location.hash==='#'+r) render(); else location.hash = r; }
window.addEventListener('hashchange', render);

function render(){
  const r = route();
  if(r==='inicio' || !ROUTES[MODO].includes(r)){ $('#home').classList.remove('hidden'); $('#app').classList.add('hidden'); return; }
  $('#home').classList.add('hidden'); $('#app').classList.remove('hidden');
  const permitido = S.role && (MODO==='recepcao' ? ['admin','recepcao'].includes(S.role) : S.role==='admin');
  renderShell(permitido ? r : null);
  if(S.noDb){ $('#main').innerHTML = `<div class="note">Não foi possível conectar ao banco de dados. Verifique a internet — ou, se você é a administradora, confira o arquivo firebase-config.js.</div>`; return; }
  if(!S.authReady){ $('#main').innerHTML = '<div class="empty">Carregando…</div>'; return; }
  if(!S.uid || !S.role){ renderLogin(); return; }
  if(!permitido){ renderRestrito(); return; }
  // keep focus & typed values across live re-renders
  const a=document.activeElement, aid=a&&a.id, sel=a&&('selectionStart' in a)?a.selectionStart:null;
  const keep={}; document.querySelectorAll('#main [data-keep]').forEach(el=>keep[el.id]=el.value);
  ({agenda:renderAgenda, visao:renderVisao, pacientes:renderPacientes, prontuario:renderProntuario, financeiro:renderFinanceiro, acessos:renderAcessos, orcamento:renderOrcamento, tarefas:renderTarefas, receituario:renderReceituario})[r]();
  Object.entries(keep).forEach(([id,v])=>{ const el=document.getElementById(id); if(el && !el.value) el.value=v; });
  if(aid){ const el=document.getElementById(aid); if(el){ el.focus(); try{ if(sel!=null) el.setSelectionRange(sel,sel);}catch(_){} } }
}

function renderShell(r){
  const link=(k,l)=>`<a href="#${k}" class="${r===k?'on':''}">${ICON[k]}${l}</a>`;
  const nt = tarPendentes(); const lt = `Tarefas${nt?`<span class="cnt">${nt}</span>`:''}`;
  let side = '';
  if(r && MODO==='gestao') side = `${link('visao','Visão geral')}${link('agenda','Agenda')}<div class="sep">Clínica</div>${link('pacientes','Portal do paciente')}${link('prontuario','Prontuário')}${link('receituario','Receituário')}${link('orcamento','Orçamentos')}${link('tarefas',lt)}<div class="sep">Administração</div>${link('financeiro','Financeiro')}${link('acessos','Acessos')}`;
  else if(r) side = `${link('agenda','Agenda')}${link('pacientes','Pacientes')}${link('prontuario','Prontuário')}${link('receituario','Receituário')}${link('orcamento','Orçamentos')}${link('tarefas',lt)}`;
  $('#side').innerHTML = side + `<div class="sep"></div><a href="#inicio">${ICON.home}Início</a>`;
  $('#role').textContent = S.role ? PAPEL[S.role] : (MODO==='gestao' ? 'Gestão' : 'Recepção');
  $('#btnSair').classList.toggle('hidden', !S.uid);
  const sy = {ok:['ok','Sincronizado'], wait:['wait','Conectando…'], err:['err','Sem conexão']}[S.noDb?'err':S.sync];
  $('#sync').innerHTML = S.role ? `<span class="who">${esc(S.email)}</span> · <span class="dot ${sy[0]}"></span>${sy[1]}` : '';
}

function renderLogin(){
  if(S.uid && !S.role){
    $('#main').innerHTML = `<div class="card login"><div class="bd"><h2>Acesso não liberado</h2>
      <p class="s">A conta <b>${esc(S.email)}</b> não tem acesso liberado ou está suspensa. Peça à administradora da clínica para liberar em “Acessos”.</p>
      <button class="btn" data-act="sair">Sair e entrar com outra conta</button></div></div>`;
    return;
  }
  $('#main').innerHTML = `<div class="card login"><div class="bd">
    <h2>${MODO==='gestao'?'Painel da administração':'Entrar'}</h2>
    <p class="s">${MODO==='gestao'?'Acesso exclusivo da administradora da clínica.':'Use o e-mail e a senha que a administradora da clínica criou para você.'}</p>
    <form id="fLogin" class="fg">
      <label class="f full">E-mail<input type="email" name="email" id="lgEmail" data-keep required autocomplete="username"></label>
      <label class="f full">Senha<input type="password" name="senha" id="lgSenha" required autocomplete="current-password"></label>
      <div class="full warn hidden" id="loginErr"></div>
      <div class="full" style="display:flex;justify-content:space-between;align-items:center"><button type="button" class="btn ghost" data-act="esqueci" style="padding-left:0">Esqueci a senha</button><button class="btn primary">Entrar</button></div>
    </form></div></div>`;
}

function renderRestrito(){
  $('#main').innerHTML = `<div class="card login"><div class="bd" style="text-align:center">
    <h2>Painel exclusivo da administração</h2>
    <p class="s">Sua conta (${esc(S.email)}) é da <b>${esc(PAPEL[S.role]||'equipe')}</b>. ${S.role==='recepcao'?'Use o link da recepção para acessar agenda, pacientes e prontuário.':'Esta conta não acessa os painéis.'}</p>
    <button class="btn" data-act="sair">Sair</button></div></div>`;
}

/* ============ AGENDA ============ */
function agendaDays(){
  const d = parseISO(S.agDate);
  if(S.agView==='dia') return [d];
  const mon = addDays(d, -((d.getDay()+6)%7));
  return Array.from({length:7},(_,i)=>addDays(mon,i));
}
function profissionais(){ return [...new Set(S.agenda.map(a=>a.profissional).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR')); }

function apCard(a){
  return `<div class="ap s-${esc(a.status||'agendado')}" data-ap="${esc(a.id)}">
    <div class="t"><span>${esc(a.hora||'--:--')}${a.duracao?` · ${esc(a.duracao)} min`:''}</span>${S.agView==='semana'?'':''}</div>
    <div><div class="n">${esc(a.paciente||'Sem nome')}</div><div class="p">${esc([a.procedimento,a.profissional].filter(Boolean).join(' · '))}</div></div>
    <div style="margin-top:4px"><span class="st st-${esc(a.status||'agendado')}">${esc(STATUS[a.status]||'Agendado')}</span></div>
  </div>`;
}

function renderAgendaMes(){
  const base = parseISO(S.agDate), y = base.getFullYear(), mo = base.getMonth();
  const ini = new Date(y, mo, 1), ini0 = addDays(ini, -ini.getDay());           // começa no domingo
  const fim = new Date(y, mo+1, 0), semanas = Math.ceil((ini.getDay() + fim.getDate())/7);
  const t = todayISO();
  const doMes = S.agenda.filter(a=>String(a.data||'').startsWith(iso(ini).slice(0,7)) && (!S.agProf || a.profissional===S.agProf));
  const ativos = doMes.filter(a=>a.status!=='cancelado');
  const cells = Array.from({length:semanas*7},(_,i)=>{
    const d = addDays(ini0, i), k = iso(d), fora = d.getMonth()!==mo;
    const items = S.agenda.filter(a=>a.data===k && (!S.agProf || a.profissional===S.agProf)).sort((a,b)=>toMin(a.hora)-toMin(b.hora));
    const vis = items.slice(0,4);
    return `<div class="mc ${fora?'fora':''} ${k===t?'today':''}" data-agdia="${k}">
      <div class="mc-h"><span class="mc-n">${d.getDate()}</span>${items.length?`<span class="mc-c">${items.length}</span>`:''}${S.readOnly?'':`<button class="mc-add" data-new="${k}" title="Agendar em ${fmtData(k)}">+</button>`}</div>
      ${vis.map(a=>`<div class="mc-ap s-${esc(a.status||'agendado')}" data-ap="${esc(a.id)}" title="${esc((a.hora||'')+' · '+(a.paciente||'')+(a.procedimento?' · '+a.procedimento:''))}"><b>${esc(a.hora||'')}</b> ${esc(a.paciente||'Sem nome')}</div>`).join('')}
      ${items.length>4?`<div class="mc-mais">+ ${items.length-4} mais</div>`:''}
    </div>`;
  }).join('');
  return { titulo: `${MESES[mo][0].toUpperCase()+MESES[mo].slice(1)} de ${y}`, resumo: `${ativos.length} consulta${ativos.length===1?'':'s'} no mês${doMes.length>ativos.length?` · ${doMes.length-ativos.length} cancelada(s)`:''}`,
    html: `<div class="mes"><div class="mes-sem">${DIAS.map(d=>`<div>${d}</div>`).join('')}</div><div class="mes-g">${cells}</div></div>` };
}
function renderAgenda(){
  if(S.agView==='mes') return renderAgendaBase(renderAgendaMes());
  return renderAgendaBase(null);
}
function renderAgendaBase(mes){
  const days = mes ? [parseISO(S.agDate)] : agendaDays();
  const d0=days[0], d1=days[days.length-1];
  const title = mes ? mes.titulo + ' · ' + mes.resumo : S.agView==='dia'
    ? `${DIAS[d0.getDay()]}, ${d0.getDate()} de ${MESES[d0.getMonth()]}`
    : `${d0.getDate()} ${d0.getMonth()!==d1.getMonth()?'de '+MESES[d0.getMonth()]+' ':''}a ${d1.getDate()} de ${MESES[d1.getMonth()]} de ${d1.getFullYear()}`;
  const profs = profissionais();
  const t = todayISO();
  const cols = mes ? '' : days.map(d=>{
    const k = iso(d);
    const items = S.agenda.filter(a=>a.data===k && (!S.agProf || a.profissional===S.agProf)).sort((a,b)=>toMin(a.hora)-toMin(b.hora));
    return `<div class="day ${k===t?'today':''}"><div class="dh"><b>${DIAS[d.getDay()]} ${d.getDate()}</b><span>${items.length} ${items.length===1?'consulta':'consultas'}</span></div>
      <div class="dl">${items.map(apCard).join('') || (S.agView==='dia'?'<div class="empty">Nenhuma consulta neste dia.</div>':'')}
      ${S.readOnly?'':`<button class="add" data-new="${k}">+ Agendar</button>`}</div></div>`;
  }).join('');
  $('#main').innerHTML = `
    <div class="ph"><div><h2>Agenda</h2><div class="sub">${esc(title)}</div></div>
      <div class="tools">
        <div class="seg"><button data-agnav="-1">‹</button><button data-agnav="0">Hoje</button><button data-agnav="1">›</button></div>
        <div class="seg"><button data-agview="dia" class="${S.agView==='dia'?'on':''}">Dia</button><button data-agview="semana" class="${S.agView==='semana'?'on':''}">Semana</button><button data-agview="mes" class="${S.agView==='mes'?'on':''}">Mês</button></div>
        <input type="date" class="inp" id="agDate" value="${esc(S.agDate)}">
        <select class="inp" id="agProf"><option value="">Todos os profissionais</option>${profs.map(p=>`<option ${p===S.agProf?'selected':''}>${esc(p)}</option>`).join('')}</select>
        ${S.readOnly?'':`<button class="btn primary" data-new="${esc(S.agDate)}">${ICON.plus}Nova consulta</button>`}
      </div></div>
    ${mes ? mes.html : `<div class="week ${S.agView==='dia'?'one':''}">${cols}</div>`}`;
}

function openAppt(id, dataPadrao){
  const a = id ? S.agenda.find(x=>x.id===id) : null;
  if(id && !a) return;
  const v = a || {data:dataPadrao||S.agDate, hora:'08:00', duracao:'30', status:'agendado', profissional:S.agProf||''};
  const ro = S.readOnly;
  const dis = ro?'disabled':'';
  const profs = profissionais();
  const fone = digits(v.telefone);
  const gcal = a ? gcalLink(a) : '';
  const wa = fone ? `https://wa.me/${fone.length<=11?'55'+fone:fone}?text=${encodeURIComponent(`Olá, ${(v.paciente||'').split(' ')[0]}! Confirmando sua consulta em ${fmtData(v.data)} às ${v.hora}. Podemos confirmar?`)}` : '';
  const body = `<form id="fAp" class="fg">
    <label class="f full">Paciente<input name="paciente" required ${dis} value="${esc(v.paciente)}" list="dlPac" autocomplete="off"></label>
    <datalist id="dlPac">${S.pacientes.map(p=>`<option value="${esc(p.nome)}">`).join('')}</datalist>
    ${a&&a.atualizadoPor?`<div class="full" style="color:var(--muted);font-size:12px">Última alteração por ${esc(a.atualizadoPor)}${a.atualizadoEm?' em '+new Date(a.atualizadoEm).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):''}</div>`:''}
    <label class="f">Data<input type="date" name="data" required ${dis} value="${esc(v.data)}"></label>
    <label class="f">Horário<input type="time" name="hora" required ${dis} value="${esc(v.hora)}" step="300"></label>
    <label class="f">Duração<select name="duracao" ${dis}>${[15,20,30,40,45,60,90,120].map(n=>`<option value="${n}" ${String(v.duracao)===String(n)?'selected':''}>${n} min</option>`).join('')}</select></label>
    <label class="f">Status<select name="status" ${dis}>${Object.entries(STATUS).map(([k,l])=>`<option value="${k}" ${v.status===k?'selected':''}>${l}</option>`).join('')}</select></label>
    <label class="f">Telefone / WhatsApp<input name="telefone" ${dis} value="${esc(v.telefone)}" placeholder="(61) 90000-0000"></label>
    <label class="f">Profissional<input name="profissional" ${dis} value="${esc(v.profissional)}" list="dlProf" autocomplete="off"></label>
    <datalist id="dlProf">${profs.map(p=>`<option value="${esc(p)}">`).join('')}</datalist>
    <label class="f full">Procedimento<input name="procedimento" ${dis} value="${esc(v.procedimento)}" placeholder="Ex.: Limpeza, avaliação, restauração"></label>
    <label class="f full">Observações<textarea name="obs" ${dis}>${esc(v.obs)}</textarea></label>
    <div class="full warn hidden" id="apWarn"></div>
  </form>`;
  const foot = `${a && !ro?'<button class="btn danger" data-del>Excluir</button>':''}${wa?`<a class="btn" href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a>`:''}${gcal?`<a class="btn" href="${esc(gcal)}" target="_blank" rel="noopener">Google Agenda</a>`:''}
    <div class="r"><button class="btn" data-close>${ro?'Fechar':'Cancelar'}</button>${ro?'':'<button class="btn primary" data-save>Salvar</button>'}</div>`;
  const m = openModal(a?'Consulta':'Nova consulta', body, foot);
  const f = m.querySelector('#fAp');
  const check = () => {
    const o = formData(f), w = m.querySelector('#apWarn');
    const ini = toMin(o.hora), fim = ini + Number(o.duracao||30);
    const c = S.agenda.find(x => x.id!==id && x.data===o.data && x.status!=='cancelado' &&
      (!o.profissional || !x.profissional || x.profissional===o.profissional) &&
      toMin(x.hora) < fim && toMin(x.hora)+Number(x.duracao||30) > ini);
    w.classList.toggle('hidden', !c);
    if(c) w.textContent = `Atenção: conflita com ${c.paciente} às ${c.hora}${c.profissional?' ('+c.profissional+')':''}.`;
  };
  f.addEventListener('input', check); check();
  const save = async () => {
    if(!f.reportValidity()) return;
    const o = formData(f);
    const pac = S.pacientes.find(p=>norm(p.nome)===norm(o.paciente));
    const doc = {...(a?stripId(a):{}), ...o, duracao:Number(o.duracao)||30, atualizadoEm:new Date().toISOString(), atualizadoPor:S.email};
    if(pac){ doc.pacienteId = pac.id; if(!doc.telefone && pac.telefone) doc.telefone = pac.telefone; }
    if(!a) doc.criadoEm = doc.atualizadoEm;
    const ref = a ? COL.agenda().doc(a.id) : COL.agenda().doc();
    closeModal();
    if(await write('agenda', ref, doc)) toast(a?'Consulta atualizada.':'Consulta agendada.');
  };
  f.addEventListener('submit', e=>{e.preventDefault(); save();});
  m.querySelector('[data-save]')?.addEventListener('click', save);
  m.querySelector('[data-del]')?.addEventListener('click', async()=>{
    if(!await confirmBox(`Excluir a consulta de ${a.paciente} em ${fmtData(a.data)} às ${a.hora}?`)) return;
    if(await write('agenda', COL.agenda().doc(a.id), null)) toast('Consulta excluída.');
  });
}
function gcalLink(a){
  if(!a.data || !a.hora) return '';
  const ini = parseISO(a.data); const [h,m] = a.hora.split(':').map(Number); ini.setHours(h||0, m||0, 0, 0);
  const fim = new Date(ini.getTime() + (Number(a.duracao)||30)*60000);
  const f = d => `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const det = [a.procedimento&&('Procedimento: '+a.procedimento), a.profissional&&('Profissional: '+a.profissional), a.telefone&&('Telefone: '+a.telefone), a.obs].filter(Boolean).join('\n');
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + '&text=' + encodeURIComponent(`${a.paciente||'Consulta'}${a.procedimento?' · '+a.procedimento:''}`)
    + '&dates=' + f(ini) + '/' + f(fim) + '&ctz=America/Sao_Paulo'
    + '&details=' + encodeURIComponent(det);
}
const stripId = o => { const {id, ...r} = o; return r; };

/* ============ VISÃO GERAL ============ */
function finStatus(l){ return l.status==='pago' ? 'pago' : (l.vencimento && l.vencimento < todayISO() ? 'vencido' : 'pendente'); }
function renderVisao(){
  const t = todayISO(), mes = t.slice(0,7);
  const hoje = S.agenda.filter(a=>a.data===t).sort((a,b)=>toMin(a.hora)-toMin(b.hora));
  const ativos = hoje.filter(a=>a.status!=='cancelado');
  const conf = hoje.filter(a=>a.status==='confirmado').length;
  const aReceber = S.fin.filter(l=>l.status!=='pago').reduce((s,l)=>s+(+l.valor||0),0);
  const recebMes = S.fin.filter(l=>l.status==='pago' && String(l.pagoEm||'').startsWith(mes)).reduce((s,l)=>s+(+l.valor||0),0);
  const venc = S.fin.filter(l=>finStatus(l)==='vencido').sort((a,b)=>a.vencimento.localeCompare(b.vencimento));
  const d = new Date();
  $('#main').innerHTML = `
    <div class="ph"><div><h2>Visão geral</h2><div class="sub">${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}</div></div>
      <div class="tools"><button class="btn" data-newpac>${ICON.plus}Novo paciente</button><button class="btn primary" data-new="${t}">${ICON.plus}Nova consulta</button></div></div>
    <div class="kpis">
      <div class="kpi"><div class="l">Consultas hoje</div><div class="v">${ativos.length}</div></div>
      <div class="kpi"><div class="l">Confirmadas hoje</div><div class="v">${conf}</div></div>
      <div class="kpi"><div class="l">Pacientes cadastrados</div><div class="v">${S.pacientes.length}</div></div>
      <div class="kpi"><div class="l">Recebido no mês</div><div class="v green">${BRL(recebMes)}</div></div>
      <div class="kpi"><div class="l">A receber</div><div class="v ${venc.length?'red':''}">${BRL(aReceber)}</div></div>
    </div>
    <div class="grid2">
      <div class="card"><div class="hd"><h3>Agenda de hoje</h3><a href="#agenda" class="btn sm ghost">Ver agenda</a></div><div class="bd">
        ${hoje.map(a=>`<div class="row" style="cursor:pointer" data-ap="${esc(a.id)}"><div><b>${esc(a.hora)}</b> · ${esc(a.paciente)}<div class="m">${esc([a.procedimento,a.profissional].filter(Boolean).join(' · '))}</div></div><span class="st st-${esc(a.status||'agendado')}">${esc(STATUS[a.status]||'Agendado')}</span></div>`).join('') || '<div class="empty">Nenhuma consulta para hoje.</div>'}
      </div></div>
      <div class="card"><div class="hd"><h3>Cobranças vencidas</h3><a href="#financeiro" class="btn sm ghost">Ver financeiro</a></div><div class="bd">
        ${venc.slice(0,8).map(l=>`<div class="row"><div><b>${esc(l.paciente||'—')}</b><div class="m">${esc(l.descricao||'')} · venceu em ${fmtData(l.vencimento)}</div></div><b style="color:var(--red)">${BRL(l.valor)}</b></div>`).join('') || '<div class="empty">Nenhuma cobrança vencida.</div>'}
      </div></div>
    </div>`;
}

/* ============ PORTAL DO PACIENTE ============ */
function consultasDo(p){ return S.agenda.filter(a=>a.pacienteId===p.id || (!a.pacienteId && norm(a.paciente)===norm(p.nome))); }
function finDo(p){ return S.fin.filter(l=>l.pacienteId===p.id); }
function idade(n){ if(!n) return ''; const b=parseISO(n), t=new Date(); let i=t.getFullYear()-b.getFullYear(); if(t<new Date(t.getFullYear(),b.getMonth(),b.getDate())) i--; return i>=0?i+' anos':''; }

function renderPacientes(){
  const q = norm(S.pacBusca);
  const lista = S.pacientes.filter(p=>!q || norm(p.nome).includes(q) || digits(p.telefone).includes(digits(q)) && digits(q) || digits(p.cpf).includes(digits(q)) && digits(q))
    .sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR'));
  const p = S.pacientes.find(x=>x.id===S.selPac);
  let det = `<div class="card"><div class="empty" style="padding:60px 20px">${S.pacientes.length?'Selecione um paciente para ver o portal.':'Nenhum paciente cadastrado ainda. Clique em “Novo paciente” para começar.'}</div></div>`;
  if(p){
    const t = todayISO();
    const cs = consultasDo(p).sort((a,b)=>(a.data+a.hora).localeCompare(b.data+b.hora));
    const prox = cs.filter(a=>a.data>=t && !['cancelado','concluido','faltou'].includes(a.status));
    const hist = cs.filter(a=>!prox.includes(a)).reverse();
    const fl = finDo(p);
    const pend = fl.filter(l=>l.status!=='pago');
    const pr = S.prontuarios[p.id] || {};
    const notas = (pr.notas||[]).slice().sort((a,b)=>String(b.data).localeCompare(String(a.data)));
    det = `<div class="card"><div class="bd">
      <div class="phead"><div style="display:flex;gap:14px;align-items:center"><div class="av">${esc(initials(p.nome))}</div><div><h2 style="margin:0;font-size:19px">${esc(p.nome)}</h2><div style="color:var(--muted);margin-top:2px">${esc([idade(p.nascimento),p.convenio].filter(Boolean).join(' · ')||'Paciente')}</div></div></div>
        <div class="tools"><button class="btn sm" data-copiar="${esc(p.id)}">Copiar resumo</button><button class="btn sm" data-novarec="${esc(p.id)}">Receita</button><button class="btn sm" data-novoorc="${esc(p.id)}">Orçamento</button><button class="btn sm" data-editpac="${esc(p.id)}">Editar</button><button class="btn sm primary" data-new="${t}" data-pac="${esc(p.id)}">${ICON.plus}Agendar</button></div></div>
      <div class="dl-info">
        <div><span>Telefone</span><b>${esc(p.telefone||'—')}</b></div>
        <div><span>E-mail</span><b>${esc(p.email||'—')}</b></div>
        <div><span>CPF</span><b>${esc(p.cpf||'—')}</b></div>
        <div><span>Nascimento</span><b>${fmtData(p.nascimento)}</b></div>
        <div><span>Endereço</span><b>${esc(p.endereco||'—')}</b></div>
        <div><span>Alergias / alertas</span><b style="${p.alergias?'color:var(--red)':''}">${esc(p.alergias||'Nenhum')}</b></div>
      </div></div></div>
    <div class="grid2" style="margin-top:16px">
      <div class="card"><div class="hd"><h3>Próximas consultas</h3></div><div class="bd">${prox.map(a=>`<div class="row" style="cursor:pointer" data-ap="${esc(a.id)}"><div><b>${fmtData(a.data)} às ${esc(a.hora)}</b><div class="m">${esc([a.procedimento,a.profissional].filter(Boolean).join(' · '))}</div></div><span class="st st-${esc(a.status)}">${esc(STATUS[a.status]||'')}</span></div>`).join('')||'<div class="empty">Nenhuma consulta futura.</div>'}</div></div>
      ${MODO==='gestao'&&S.isAdmin?`<div class="card"><div class="hd"><h3>Financeiro</h3><button class="btn sm" data-newfin data-pac="${esc(p.id)}">${ICON.plus}Lançamento</button></div><div class="bd">
        <div class="row"><span class="m">Em aberto</span><b style="color:${pend.length?'var(--red)':'inherit'}">${BRL(pend.reduce((s,l)=>s+(+l.valor||0),0))}</b></div>
        <div class="row"><span class="m">Total pago</span><b>${BRL(fl.filter(l=>l.status==='pago').reduce((s,l)=>s+(+l.valor||0),0))}</b></div>
        ${pend.slice(0,8).map(l=>`<div class="row"><div>${esc(l.descricao||'—')}<div class="m">Vence ${fmtData(l.vencimento)} · <span class="st st-${finStatus(l)}">${BRL(l.valor)}</span></div></div><span style="white-space:nowrap">${finBotoes(l)}</span></div>`).join('')}${pend.length>8?`<div class="m" style="color:var(--muted);font-size:12px;padding-top:6px">+ ${pend.length-8} lançamento(s) — veja todos no Financeiro.</div>`:''}
      </div></div>`:''}
      <div class="card"><div class="hd"><h3>Prontuário</h3><button class="btn sm" data-abrirpront="${esc(p.id)}">Abrir prontuário</button></div><div class="bd">
        ${notas.slice(0,3).map(n=>`<div class="evo"><div class="d">${fmtData(n.data)}${n.dente?' · dente '+esc(n.dente):''}</div><p>${esc(n.texto)}</p></div>`).join('')||'<div class="empty">Nenhuma anotação clínica.</div>'}
      </div></div>
      <div class="card"><div class="hd"><h3>Histórico de consultas</h3></div><div class="bd">${hist.slice(0,8).map(a=>`<div class="row"><div>${fmtData(a.data)} · ${esc(a.hora)}<div class="m">${esc(a.procedimento||'')}</div></div><span class="st st-${esc(a.status||'agendado')}">${esc(STATUS[a.status]||'')}</span></div>`).join('')||'<div class="empty">Sem histórico.</div>'}</div></div>
    </div>
    ${p.obs?`<div class="card" style="margin-top:16px"><div class="hd"><h3>Observações</h3></div><div class="bd" style="white-space:pre-wrap">${esc(p.obs)}</div></div>`:''}`;
  }
  $('#main').innerHTML = `
    <div class="ph"><div><h2>Portal do paciente</h2><div class="sub">${S.pacientes.length} ${S.pacientes.length===1?'paciente cadastrado':'pacientes cadastrados'}</div></div>
      <div class="tools"><button class="btn primary" data-newpac>${ICON.plus}Novo paciente</button></div></div>
    <div class="split">
      <div class="card"><div class="bd" style="padding:10px"><input class="inp" id="pacBusca" style="width:100%" placeholder="Buscar por nome, telefone ou CPF" value="${esc(S.pacBusca)}"></div>
        <div class="plist">${lista.map(x=>`<div class="pi ${x.id===S.selPac?'on':''}" data-selpac="${esc(x.id)}"><div class="av">${esc(initials(x.nome))}</div><div style="min-width:0"><div class="nm">${esc(x.nome)}</div><div class="m">${esc(x.telefone||'')}</div></div></div>`).join('') || `<div class="empty">${S.pacientes.length?'Nenhum resultado.':'Sem pacientes.'}</div>`}</div></div>
      <div>${det}</div>
    </div>`;
}

function openPaciente(id){
  const p = id ? S.pacientes.find(x=>x.id===id) : {};
  const body = `<form id="fPac" class="fg">
    <label class="f full">Nome completo<input name="nome" required value="${esc(p.nome)}"></label>
    <label class="f">Telefone / WhatsApp<input name="telefone" value="${esc(p.telefone)}"></label>
    <label class="f">E-mail<input type="email" name="email" value="${esc(p.email)}"></label>
    <label class="f">CPF<input name="cpf" value="${esc(p.cpf)}"></label>
    <label class="f">Data de nascimento<input type="date" name="nascimento" value="${esc(p.nascimento)}"></label>
    <label class="f">Convênio<input name="convenio" value="${esc(p.convenio)}" placeholder="Particular"></label>
    <label class="f">Alergias / alertas<input name="alergias" value="${esc(p.alergias)}"></label>
    <label class="f full">Endereço<input name="endereco" value="${esc(p.endereco)}"></label>
    <label class="f full">Observações<textarea name="obs">${esc(p.obs)}</textarea></label></form>`;
  const m = openModal(id?'Editar paciente':'Novo paciente', body, `${id&&S.isAdmin?'<button class="btn danger" data-del>Excluir</button>':''}<div class="r"><button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Salvar</button></div>`);
  const f = m.querySelector('#fPac');
  const save = async()=>{
    if(!f.reportValidity()) return;
    const ref = id ? COL.pacientes().doc(id) : COL.pacientes().doc();
    const doc = {...(id?stripId(p):{criadoEm:new Date().toISOString(), criadoPor:S.email}), ...formData(f), atualizadoPor:S.email};
    closeModal();
    if(await write('adm', ref, doc)){ S.selPac = ref.id; toast(id?'Paciente atualizado.':'Paciente cadastrado.'); if(route()!=='pacientes') go('pacientes'); else render(); }
  };
  f.addEventListener('submit', e=>{e.preventDefault(); save();});
  m.querySelector('[data-save]').onclick = save;
  m.querySelector('[data-del]')?.addEventListener('click', async()=>{
    if(!await confirmBox(`Excluir o cadastro de ${p.nome}? O prontuário e os lançamentos financeiros também serão apagados (guarde uma cópia: o prontuário deve ser mantido conforme as normas do CFO). Consultas na agenda permanecem.`)) return;
    const ok = await write('adm', COL.pacientes().doc(id), null);
    if(ok){
      await write('adm', COL.prontuarios().doc(id), null);
      for(const l of finDo(p)) await write('adm', COL.fin().doc(l.id), null);
      S.selPac=null; toast('Paciente excluído.'); render();
    }
  });
}

async function copiarResumo(id){
  const p = S.pacientes.find(x=>x.id===id); if(!p) return;
  const t = todayISO();
  const prox = consultasDo(p).filter(a=>a.data>=t && !['cancelado','concluido','faltou'].includes(a.status)).sort((a,b)=>(a.data+a.hora).localeCompare(b.data+b.hora));
  const pend = finDo(p).filter(l=>l.status!=='pago');
  const txt = [`Olá, ${p.nome.split(' ')[0]}!`, '',
    prox.length ? 'Suas próximas consultas:\n' + prox.map(a=>`• ${fmtData(a.data)} às ${a.hora}${a.procedimento?' — '+a.procedimento:''}`).join('\n') : 'Você não tem consultas agendadas no momento.',
    pend.length ? '\nPagamentos em aberto:\n' + pend.map(l=>`• ${l.descricao||'Tratamento'}: ${BRL(l.valor)} (vence ${fmtData(l.vencimento)})`).join('\n') : '',
    '\nQualquer dúvida, estamos à disposição.'].join('\n');
  try{ await navigator.clipboard.writeText(txt); toast('Resumo copiado — cole no WhatsApp ou e-mail do paciente.'); }
  catch(_){ openModal('Resumo do paciente', `<textarea style="width:100%;min-height:200px;border:1px solid var(--line);border-radius:9px;padding:10px" readonly>${esc(txt)}</textarea>`); }
}

/* ============ PRONTUÁRIO ============ */
function toothSvg(st){
  const c = (DENTE[st]||DENTE.higido).c;
  const x = st==='extraido' ? '<path d="M6 6l12 16M18 6 6 22" stroke="#64748b" stroke-width="2"/>' : '';
  return `<svg viewBox="0 0 24 28"><path d="${TOOTH_PATH}" fill="${c}" stroke="#94a3b8" stroke-width="1.2"/>${x}</svg>`;
}
function renderProntuario(){
  const lista = S.pacientes.slice().sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR'));
  const p = S.pacientes.find(x=>x.id===S.selPac);
  let content = `<div class="card"><div class="empty" style="padding:60px 20px">${S.pacientes.length?'Selecione um paciente para abrir o prontuário.':'Cadastre um paciente no Portal do paciente para iniciar o prontuário.'}</div></div>`;
  if(p) assinarPaciente(p.id);
  if(p && S.prontAba==='imagens') content = prontAbasHtml(p) + renderImagensPac(p);
  else if(p && S.prontAba==='termos') content = prontAbasHtml(p) + renderTermosPac(p);
  else if(p){
    const pr = S.prontuarios[p.id] || {};
    const dentes = pr.dentes || {};
    const arch = (rows, up) => `<div class="arch">${rows.map(h=>`<div class="half">${h.map(n=>`<button class="tooth ${up?'up':''} ${String(S.selDente)===String(n)?'sel':''}" data-dente="${n}" title="Dente ${n}: ${esc((DENTE[dentes[n]]||DENTE.higido).l)}">${up?`<small>${n}</small>${toothSvg(dentes[n])}`:`${toothSvg(dentes[n])}<small>${n}</small>`}</button>`).join('')}</div>`).join('')}</div>`;
    const cont = {}; Object.values(dentes).forEach(s=>cont[s]=(cont[s]||0)+1);
    const notas = (pr.notas||[]).slice().sort((a,b)=>String(b.data).localeCompare(String(a.data)) || String(b.criadoEm).localeCompare(String(a.criadoEm)));
    const sd = S.selDente;
    content = prontAbasHtml(p) + `
      ${p.alergias?`<div class="note"><b>Alerta:</b> ${esc(p.alergias)}</div>`:''}
      <div class="card"><div class="hd"><h3>Odontograma</h3><span style="color:var(--muted);font-size:12px">${sd?`Dente <b>${sd}</b> selecionado — escolha a condição abaixo`:'Clique em um dente para marcar a condição'}</span></div>
        <div class="bd"><div class="odo">${arch(ARCADA_SUP,true)}${arch(ARCADA_INF,false)}</div>
        <div class="legend" style="margin-top:14px">${Object.entries(DENTE).map(([k,d])=>`<button class="lg ${sd && (dentes[sd]||'higido')===k?'on':''}" data-marca="${k}" ${sd?'':'disabled style="cursor:default"'}><i style="background:${d.c}"></i>${d.l}${cont[k]&&k!=='higido'?` (${cont[k]})`:''}</button>`).join('')}</div></div></div>
      <div class="card" style="margin-top:16px"><div class="hd"><h3>Evolução clínica</h3></div><div class="bd">
        <form id="fNota" class="fg" style="margin-bottom:16px">
          <label class="f">Data<input type="date" name="data" id="notaData" data-keep value="${todayISO()}" required></label>
          <label class="f">Dente (opcional)<input name="dente" id="notaDente" data-keep value="${esc(sd||'')}" placeholder="Ex.: 36"></label>
          <div class="full" style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">
            <label class="f" style="flex:1;min-width:220px">Modelo<select id="notaModelo"><option value="">— Escrever do zero —</option>${listaModelos().map(m=>`<option value="${esc(m.id)}" ${S.notaTipo===m.id?'selected':''}>${esc(m.nome)}</option>`).join('')}</select></label>
            <button type="button" class="btn" data-modelos>Gerenciar modelos</button>
          </div>
          <label class="f full">Anotação<textarea name="texto" id="notaTexto" data-keep required placeholder="Escolha um modelo acima ou escreva: procedimento realizado, achados clínicos, orientações…"></textarea></label>
          <div class="full" style="display:flex;justify-content:flex-end"><button class="btn primary">Adicionar anotação</button></div>
        </form>
        ${notas.map(n=>`<div class="evo"><div class="d" style="display:flex;gap:4px;align-items:center;flex-wrap:wrap">${fmtData(n.data)}${n.dente?' · dente '+esc(n.dente):''}${n.autor?' · por '+esc(n.autor):''}${n.tipo?` <span class="tag">${esc(n.tipo)}</span>`:''}${n.editadoEm?` <span class="m" style="color:var(--muted);font-size:11px" title="Editado por ${esc(n.editadoPor||'')}">· editado em ${fmtDataHora(n.editadoEm)}</span>`:''}<span style="margin-left:auto;white-space:nowrap"><button class="btn ghost sm" data-editnota="${esc(n.id)}" style="padding:0 4px;color:var(--muted)">editar</button><button class="btn ghost sm" data-printnota="${esc(n.id)}" style="padding:0 4px;color:var(--muted)">imprimir</button>${S.isAdmin?`<button class="btn ghost sm" data-delnota="${esc(n.id)}" style="padding:0 4px;color:var(--muted)">excluir</button>`:''}</span></div><p>${esc(n.texto)}</p></div>`).join('') || '<div class="empty">Nenhuma anotação ainda.</div>'}
      </div></div>`;
  }
  $('#main').innerHTML = `
    <div class="ph"><div><h2>Prontuário</h2><div class="sub">${p?esc(p.nome)+(idade(p.nascimento)?' · '+idade(p.nascimento):''):'Odontograma e evolução clínica'}</div></div>
      <div class="tools"><select class="inp" id="prontPac" style="min-width:240px"><option value="">Selecione o paciente…</option>${lista.map(x=>`<option value="${esc(x.id)}" ${x.id===S.selPac?'selected':''}>${esc(x.nome)}</option>`).join('')}</select>
      ${p?`<button class="btn" data-verportal="${esc(p.id)}">Ver no portal</button>`:''}</div></div>
    ${content}`;
}
function prontDoc(pid){ const pr = S.prontuarios[pid] || {}; return {dentes:{...(pr.dentes||{})}, notas:[...(pr.notas||[])]}; }
async function salvarPront(pid, doc){
  doc.atualizadoEm = new Date().toISOString(); doc.atualizadoPor = S.email;
  S.prontuarios[pid] = {...doc}; render();  // otimista
  await write('adm', COL.prontuarios().doc(pid), doc);
}

/* ============ FINANCEIRO ============ */
function renderFinanceiro(){
  const mes = S.finMes;
  const noMes = l => String(l.vencimento||'').startsWith(mes) || String(l.pagoEm||'').startsWith(mes);
  const base = S.fin.filter(l => !mes || noMes(l));
  const lista = base.filter(l => S.finStatus==='todos' || finStatus(l)===S.finStatus)
    .sort((a,b)=>String(a.vencimento).localeCompare(String(b.vencimento)));
  const recebido = S.fin.filter(l=>l.status==='pago' && (!mes || String(l.pagoEm||'').startsWith(mes))).reduce((s,l)=>s+(+l.valor||0),0);
  const pendente = base.filter(l=>finStatus(l)==='pendente').reduce((s,l)=>s+(+l.valor||0),0);
  const vencido = S.fin.filter(l=>finStatus(l)==='vencido').reduce((s,l)=>s+(+l.valor||0),0);
  const [y,m] = mes.split('-').map(Number);
  $('#main').innerHTML = `
    <div class="ph"><div><h2>Financeiro</h2><div class="sub">${mes?`${MESES[m-1]} de ${y}`:'Todos os períodos'}</div></div>
      <div class="tools">
        <input type="month" class="inp" id="finMes" value="${esc(mes)}">
        <select class="inp" id="finStatus">${[['todos','Todos'],['pendente','Pendentes'],['vencido','Vencidos'],['pago','Pagos']].map(([k,l])=>`<option value="${k}" ${S.finStatus===k?'selected':''}>${l}</option>`).join('')}</select>
        <button class="btn primary" data-newfin>${ICON.plus}Nova cobrança</button></div></div>
    <div class="kpis">
      <div class="kpi"><div class="l">Recebido no período</div><div class="v green">${BRL(recebido)}</div></div>
      <div class="kpi"><div class="l">A receber no período</div><div class="v">${BRL(pendente)}</div></div>
      <div class="kpi"><div class="l">Vencido (total)</div><div class="v ${vencido?'red':''}">${BRL(vencido)}</div></div>
    </div>
    <div class="card"><div class="tbl-wrap"><table>
      <thead><tr><th>Paciente</th><th>Descrição</th><th>Vencimento</th><th>Forma</th><th>Status</th><th class="num">Valor</th><th></th></tr></thead>
      <tbody>${lista.map(l=>{ const s=finStatus(l); return `<tr>
        <td><b>${esc(l.paciente||'—')}</b></td><td>${esc(l.descricao||'')}</td><td>${fmtData(l.vencimento)}</td><td>${esc(l.forma||'—')}</td>
        <td><span class="st st-${s}">${{pago:'Pago',pendente:'Pendente',vencido:'Vencido'}[s]}</span>${s==='pago'&&l.pagoEm?`<div class="m" style="font-size:11px;color:var(--muted)">em ${fmtData(l.pagoEm)}</div>`:''}</td>
        <td class="num"><b>${BRL(l.valor)}</b></td>
        <td style="white-space:nowrap;text-align:right">${finBotoes(l)}</td></tr>`; }).join('')
        || `<tr><td colspan="7"><div class="empty">${S.fin.length?'Nenhum lançamento neste filtro.':'Nenhum lançamento ainda. Clique em “Nova cobrança”.'}</div></td></tr>`}</tbody>
    </table></div></div>`;
}
function openFin(id, pacId){
  const l = id ? S.fin.find(x=>x.id===id) : {pacienteId:pacId||'', status:'pendente', vencimento:todayISO()};
  const pacs = S.pacientes.slice().sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR'));
  const body = `<form id="fFin" class="fg">
    <label class="f full">Paciente<select name="pacienteId" required><option value="">Selecione…</option>${pacs.map(p=>`<option value="${esc(p.id)}" ${p.id===l.pacienteId?'selected':''}>${esc(p.nome)}</option>`).join('')}</select></label>
    <label class="f full">Descrição<input name="descricao" required value="${esc(l.descricao)}" placeholder="Ex.: Restauração dente 36 — parcela 1/3"></label>
    <label class="f">Valor (R$)<input type="number" name="valor" step="0.01" min="0" required value="${esc(l.valor)}"></label>
    <label class="f">Vencimento<input type="date" name="vencimento" required value="${esc(l.vencimento)}"></label>
    <label class="f">Forma de pagamento<select name="forma">${['','Pix','Dinheiro','Cartão de crédito','Cartão de débito','Boleto','Convênio'].map(f=>`<option ${l.forma===f?'selected':''}>${f}</option>`).join('')}</select></label>
    <label class="f">Status<select name="status"><option value="pendente" ${l.status!=='pago'?'selected':''}>Pendente</option><option value="pago" ${l.status==='pago'?'selected':''}>Pago</option></select></label>
    <label class="f">Pago em<input type="date" name="pagoEm" value="${esc(l.pagoEm||'')}"></label>
    <label class="f">Parcelas (novas cobranças)<input type="number" name="parcelas" min="1" max="24" value="1" ${id?'disabled':''}></label>
  </form>`;
  if(!pacs.length){ openModal('Nova cobrança', '<p style="margin:0">Cadastre um paciente antes de lançar cobranças.</p>', '<div class="r"><button class="btn" data-close>Fechar</button><button class="btn primary" data-goNewPac>Novo paciente</button></div>'); $('#modal [data-goNewPac]').onclick=()=>openPaciente(); return; }
  const grupo = id ? parcelasDe(l) : [];
  const m = openModal(id?'Editar lançamento':'Nova cobrança', body, `${id?'<button class="btn danger" data-del>Excluir</button>':''}${grupo.length>1?`<button class="btn" data-delparc>Excluir parcelas (${grupo.length})</button>`:''}<div class="r"><button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Salvar</button></div>`);
  const f = m.querySelector('#fFin');
  const save = async()=>{
    if(!f.reportValidity()) return;
    const o = formData(f); const n = Math.max(1, Math.min(24, Number(o.parcelas)||1)); delete o.parcelas;
    const pac = S.pacientes.find(p=>p.id===o.pacienteId);
    o.paciente = pac ? pac.nome : ''; o.valor = Math.round(Number(o.valor)*100)/100;
    if(o.status==='pago' && !o.pagoEm) o.pagoEm = todayISO();
    if(o.status!=='pago') o.pagoEm = '';
    closeModal();
    if(id){ if(await write('adm', COL.fin().doc(id), {...stripId(l), ...o})) toast('Lançamento atualizado.'); return; }
    const v0 = parseISO(o.vencimento);
    let ok = true; const gid = n>1 ? 'g'+Date.now().toString(36)+Math.random().toString(36).slice(2,5) : '';
    for(let i=0;i<n;i++){
      const venc = new Date(v0.getFullYear(), v0.getMonth()+i, v0.getDate());
      const doc = {...o, vencimento: iso(venc), descricao: n>1 ? `${o.descricao} — ${i+1}/${n}` : o.descricao, criadoEm:new Date().toISOString(), ...(gid?{grupo:gid}:{})};
      if(i>0){ doc.status='pendente'; doc.pagoEm=''; }
      ok = (await write('adm', COL.fin().doc(), doc)) && ok;
    }
    if(ok) toast(n>1?`${n} parcelas lançadas.`:'Cobrança lançada.');
  };
  f.addEventListener('submit', e=>{e.preventDefault(); save();});
  m.querySelector('[data-save]').onclick = save;
  m.querySelector('[data-del]')?.addEventListener('click', async()=>{
    if(!await confirmBox(`Excluir o lançamento “${l.descricao}” de ${BRL(l.valor)}?`)) return;
    if(await write('adm', COL.fin().doc(id), null)) toast('Lançamento excluído.');
  });
  m.querySelector('[data-delparc]')?.addEventListener('click', ()=>excluirParcelas(id));
}
/* parcelas do mesmo lançamento: pelo campo "grupo" ou, nos antigos, pela descrição "… — 1/3" */
function finGrupo(l){
  if(l.grupo) return 'g:'+l.grupo;
  const mt = String(l.descricao||'').match(/^(.*) — (\d+)\/(\d+)$/);
  return mt && Number(mt[3])>1 ? 'd:'+(l.pacienteId||l.paciente)+'|'+mt[1]+'|'+mt[3] : null;
}
function parcelasDe(l){
  const g = finGrupo(l); if(!g) return [l];
  return S.fin.filter(x=>finGrupo(x)===g).sort((a,b)=>String(a.vencimento).localeCompare(String(b.vencimento)));
}
function finBotoes(l){
  const s = finStatus(l);
  return `${s!=='pago'?`<button class="btn sm" data-pagar="${esc(l.id)}">Receber</button> `:''}<button class="btn sm ghost" data-editfin="${esc(l.id)}">Editar</button><button class="btn sm ghost danger" data-delfin="${esc(l.id)}" title="Excluir lançamento" aria-label="Excluir lançamento">${ICON.trash}</button>`;
}
async function excluirLancamento(id){
  const l = S.fin.find(x=>x.id===id); if(!l) return;
  const grupo = parcelasDe(l);
  if(grupo.length>1) return excluirParcelas(id);
  if(!await confirmBox(`Excluir o lançamento “${l.descricao}” de ${BRL(l.valor)}${l.status==='pago'?' (já recebido)':''}?`)) return;
  if(await write('adm', COL.fin().doc(id), null)) toast('Lançamento excluído.');
}
function excluirParcelas(id){
  const l = S.fin.find(x=>x.id===id); if(!l) return;
  const grupo = parcelasDe(l);
  const m = openModal('Excluir parcelas', `<p style="margin:0 0 10px;line-height:1.5"><b>${esc(l.paciente||'')}</b> — marque as parcelas que deseja excluir. As já recebidas ficam desmarcadas para não apagar o histórico de pagamento por engano.</p>
    <div class="parc-l">${grupo.map(x=>{ const st=finStatus(x); return `<label class="parc"><input type="checkbox" value="${esc(x.id)}" ${st!=='pago'?'checked':''}><span class="pd">${esc(x.descricao||'')}<small>Vence ${fmtData(x.vencimento)}</small></span><span class="st st-${st}">${{pago:'Pago',pendente:'Pendente',vencido:'Vencido'}[st]}</span><b>${BRL(x.valor)}</b></label>`; }).join('')}</div>
    <div class="parc-tot" id="parcTot"></div>`,
    `<button class="btn ghost" data-parctodas>Marcar todas</button><div class="r"><button class="btn" data-close>Cancelar</button><button class="btn danger" data-save>Excluir selecionadas</button></div>`);
  const sel = () => [...m.querySelectorAll('.parc input:checked')].map(i=>i.value);
  const tot = () => { const ids=sel(); const v=grupo.filter(x=>ids.includes(x.id)).reduce((s,x)=>s+(+x.valor||0),0); m.querySelector('#parcTot').textContent = ids.length ? `${ids.length} de ${grupo.length} parcela(s) selecionada(s) · ${BRL(v)}` : 'Nenhuma parcela selecionada.'; };
  m.querySelector('.parc-l').addEventListener('change', tot); tot();
  m.querySelector('[data-parctodas]').onclick = ()=>{ m.querySelectorAll('.parc input').forEach(i=>i.checked=true); tot(); };
  m.querySelector('[data-save]').onclick = async()=>{
    const ids = sel(); if(!ids.length) return toast('Marque pelo menos uma parcela.');
    const pagas = grupo.filter(x=>ids.includes(x.id) && x.status==='pago').length;
    if(!await confirmBox(`Excluir ${ids.length} parcela(s)${pagas?` — incluindo ${pagas} já recebida(s)`:''}? Essa ação não pode ser desfeita.`)) return excluirParcelas(id);
    let ok = 0; for(const pid of ids){ if(await write('adm', COL.fin().doc(pid), null)) ok++; }
    toast(ok===ids.length ? `${ok} parcela(s) excluída(s).` : `${ok} de ${ids.length} parcela(s) excluída(s). Tente de novo as restantes.`);
  };
}
function openPagar(id){
  const l = S.fin.find(x=>x.id===id); if(!l) return;
  const m = openModal('Registrar recebimento', `<p style="margin:0 0 12px"><b>${esc(l.paciente)}</b> — ${esc(l.descricao)} · <b>${BRL(l.valor)}</b></p><form id="fPag" class="fg">
    <label class="f">Data do recebimento<input type="date" name="pagoEm" required value="${todayISO()}"></label>
    <label class="f">Forma<select name="forma">${['Pix','Dinheiro','Cartão de crédito','Cartão de débito','Boleto','Convênio'].map(f=>`<option ${l.forma===f?'selected':''}>${f}</option>`).join('')}</select></label></form>`,
    `<div class="r"><button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Confirmar</button></div>`);
  m.querySelector('[data-save]').onclick = async()=>{
    const f=m.querySelector('#fPag'); if(!f.reportValidity()) return;
    const o=formData(f); closeModal();
    if(await write('adm', COL.fin().doc(id), {...stripId(l), ...o, status:'pago'})) toast('Recebimento registrado.');
  };
}

/* ============ events ============ */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-editnota],[data-prontaba],[data-anxfiltro],[data-anxver],[data-anxbaixar],[data-anxdel],[data-termonovo],[data-termover],[data-termodel],[data-termomodelos],[data-agdia],[data-delfin],[data-novatar],[data-tarchk],[data-tared],[data-tarfiltro],[data-recnova],[data-recadd],[data-recrm],[data-recfav],[data-favadd],[data-favdel],[data-recprint],[data-recsave],[data-recprint2],[data-recusar],[data-recopen],[data-recdel],[data-novarec],[data-addproc],[data-orcrm],[data-tabedit],[data-reajuste],[data-novoproc],[data-ocultaproc],[data-restauratabela],[data-restproc],[data-restallocultos],[data-resetvrpo],[data-orcprint],[data-orccsv],[data-orccopy],[data-orcsave],[data-orcnovo],[data-orccob],[data-orcopen],[data-orcprint2],[data-orcdel],[data-novoorc],[data-modelos],[data-editmodelo],[data-novomodelo],[data-ocultamodelo],[data-restauramodelo],[data-printnota],[data-novoacesso],[data-editacesso],[data-togacesso],[data-resetacesso],[data-delacesso],[data-act],[data-go],[data-new],[data-ap],[data-agnav],[data-agview],[data-newpac],[data-selpac],[data-editpac],[data-copiar],[data-abrirpront],[data-verportal],[data-dente],[data-marca],[data-delnota],[data-newfin],[data-editfin],[data-pagar]');
  if(!el) return;
  const d = el.dataset;
  if(d.act==='abrir' || d.act==='entrar') return go(ROUTES[MODO][0]);
  if(d.act==='sair') return sair();
  if(d.act==='esqueci') return esqueci();
  if(d.go) return go(ROUTES[MODO].includes(d.go) ? d.go : ROUTES[MODO][0]);
  if(d.prontaba){ S.prontAba=d.prontaba; return render(); }
  if(d.anxfiltro!==undefined){ S.anxFiltro=d.anxfiltro; return render(); }
  if(d.anxver) return verAnexo(d.anxver);
  if(d.anxbaixar) return baixarAnexo(d.anxbaixar);
  if(d.anxdel){ closeModal(); return excluirAnexo(d.anxdel); }
  if(d.termonovo!==undefined) return novoTermo(S.selPac);
  if(d.termover) return verTermo(d.termover);
  if(d.termodel) return excluirTermo(d.termodel);
  if(d.termomodelos!==undefined) return abrirTermosModelos();
  if(d.agdia){ S.agDate=d.agdia; S.agView='dia'; return render(); }
  if(d.delfin) return excluirLancamento(d.delfin);
  if(d.novatar!==undefined) return openTarefa();
  if(d.tarchk) return tarAlternar(d.tarchk);
  if(d.tared) return openTarefa(d.tared);
  if(d.tarfiltro){ S.tarFiltro=d.tarfiltro; return render(); }
  if(d.recnova!==undefined){ if(!S.rec.id && S.rec.itens.some(i=>i.med) && !await confirmBox('Começar uma nova receita? O que não foi salvo será perdido.', 'Nova receita')) return; S.rec=recNova(); recSalvarRascunho(); return render(); }
  if(d.recadd!==undefined){ S.rec.itens.push(recItem()); recSalvarRascunho(); render(); document.getElementById('ri-m-'+(S.rec.itens.length-1))?.focus(); return; }
  if(d.recrm!==undefined){ S.rec.itens.splice(Number(d.recrm),1); if(!S.rec.itens.length) S.rec.itens.push(recItem()); recSalvarRascunho(); return render(); }
  if(d.recfav!==undefined) return favSalvar(Number(d.recfav));
  if(d.favadd) return favAdicionar(d.favadd);
  if(d.favdel){ const f=S.favMed.find(x=>x.id===d.favdel); if(f && await confirmBox(`Remover “${f.med}” dos favoritos?`, 'Remover') && await write('clinica', COL.favmed().doc(f.id), null)) toast('Removido dos favoritos.'); return; }
  if(d.recsave!==undefined) return recSalvar();
  if(d.recprint!==undefined){ const x = await recSalvar(); if(x) recImprimir(x); return; }
  if(d.recprint2){ const x=S.receitas.find(y=>y.id===d.recprint2); if(x) recImprimir(x); return; }
  if(d.recusar){ const x=S.receitas.find(y=>y.id===d.recusar); if(x) recAbrir(x, true); return; }
  if(d.recopen){ const x=S.receitas.find(y=>y.id===d.recopen); if(x) recAbrir(x, false); return; }
  if(d.recdel){ const x=S.receitas.find(y=>y.id===d.recdel); if(!x) return; if(!await confirmBox(`Excluir a receita de ${x.paciente} (${fmtData(x.data)})?`)) return; if(await write('clinica', COL.receitas().doc(x.id), null)){ if(S.rec.id===x.id){ S.rec=recNova(); recSalvarRascunho(); } toast('Receita excluída.'); } return; }
  if(d.novarec){ const p=S.pacientes.find(x=>x.id===d.novarec); S.rec={...recNova(), paciente:p?p.nome:'', pacienteId:p?p.id:'', endereco:p&&p.endereco||''}; recSalvarRascunho(); return go('receituario'); }
  if(d.addproc) return orcAddProc(d.addproc);
  if(d.orcrm!==undefined){ S.orc.itens.splice(Number(d.orcrm),1); orcSalvarRascunho(); return render(); }
  if(d.tabedit!==undefined){ S.tabEdit=!S.tabEdit; return render(); }
  if(d.reajuste!==undefined) return abrirReajuste();
  if(d.novoproc!==undefined) return novoProc();
  if(d.ocultaproc) return ocultarProc(d.ocultaproc);
  if(d.restauratabela!==undefined) return restaurarTabela();
  if(d.restproc) return mostrarProc(d.restproc);
  if(d.restallocultos!==undefined) return mostrarTodosProc();
  if(d.resetvrpo!==undefined) return resetarVRPO();
  if(d.orcprint!==undefined) return orcImprimir(S.orc);
  if(d.orccsv!==undefined){ if(!S.orc.itens.length) return toast('Adicione pelo menos um procedimento.'); return baixarArquivo(`orcamento-${slug(S.orc.paciente)}-${S.orc.data}.csv`, orcCSV(S.orc), 'text/csv;charset=utf-8'); }
  if(d.orccopy!==undefined){ if(!S.orc.itens.length) return toast('Adicione pelo menos um procedimento.'); const txt=orcTexto(S.orc); try{ await navigator.clipboard.writeText(txt); toast('Texto copiado — cole no WhatsApp ou e-mail.'); }catch(_){ openModal('Texto do orçamento', `<textarea style="width:100%;min-height:240px;border:1px solid var(--line);border-radius:9px;padding:10px" readonly>${esc(txt)}</textarea>`); } return; }
  if(d.orcsave!==undefined) return orcSalvar();
  if(d.orcnovo!==undefined){ if(S.orc.itens.length && !S.orc.id && !await confirmBox('Limpar o orçamento atual? Os itens não salvos serão perdidos.', 'Limpar')) return; S.orc=orcNovo(); orcSalvarRascunho(); return render(); }
  if(d.orccob!==undefined){
    if(!orcValidar(S.orc)) return;
    const r = orcResolverPaciente(S.orc);
    if(!r.pacienteId) return toast('Cadastre o paciente no Portal do paciente antes de gerar a cobrança.');
    const t = orcTotais(S.orc);
    openFin(null, r.pacienteId);
    const f=$('#fFin'); if(f){ f.descricao.value = 'Orçamento '+(S.orc.numero||'')+' — '+S.orc.itens.length+' procedimento(s)'; f.valor.value = t.total.toFixed(2); }
    return;
  }
  if(d.orcopen){ const o=S.orcamentos.find(x=>x.id===d.orcopen); if(o){ S.orc={...orcNovo(), ...o, id:o.id}; orcSalvarRascunho(); render(); window.scrollTo({top:0,behavior:'smooth'}); } return; }
  if(d.orcprint2){ const o=S.orcamentos.find(x=>x.id===d.orcprint2); if(o) orcImprimir({...orcNovo(), ...o}); return; }
  if(d.orcdel){ const o=S.orcamentos.find(x=>x.id===d.orcdel); if(!o) return; if(!await confirmBox(`Excluir o orçamento ${o.numero||''} de ${o.paciente}?`)) return; if(await write('clinica', COL.orcamentos().doc(o.id), null)){ if(S.orc.id===o.id){ S.orc=orcNovo(); orcSalvarRascunho(); } toast('Orçamento excluído.'); } return; }
  if(d.novoorc){ const p=S.pacientes.find(x=>x.id===d.novoorc); S.orc={...orcNovo(), paciente:p?p.nome:''}; orcSalvarRascunho(); return go('orcamento'); }
  if(d.modelos!==undefined) return openModelos();
  if(d.novomodelo!==undefined) return openModeloEdit();
  if(d.editmodelo) return openModeloEdit(d.editmodelo);
  if(d.ocultamodelo) return ocultarModelo(d.ocultamodelo);
  if(d.restauramodelo) return restaurarModelo(d.restauramodelo);
  if(d.printnota) return imprimirNota(d.printnota);
  if(d.editnota) return editarNota(d.editnota);
  if(d.novoacesso!==undefined) return openAcesso();
  if(d.editacesso) return openAcesso(d.editacesso);
  if(d.togacesso) return toggleAcesso(d.togacesso);
  if(d.resetacesso) return resetAcesso(d.resetacesso);
  if(d.delacesso) return delAcesso(d.delacesso);
  if(d.new!==undefined && !el.closest('#modal')){
    if(S.readOnly) return toast('Agenda em modo de leitura.');
    openAppt(null, d.new);
    if(d.pac){ const p=S.pacientes.find(x=>x.id===d.pac); if(p){ const f=$('#fAp'); f.paciente.value=p.nome; f.telefone.value=p.telefone||''; } }
    return;
  }
  if(d.ap) return openAppt(d.ap);
  if(d.agnav!==undefined){ const n=Number(d.agnav); if(n===0) S.agDate = todayISO(); else if(S.agView==='mes'){ const b=parseISO(S.agDate); S.agDate = iso(new Date(b.getFullYear(), b.getMonth()+n, 1)); } else S.agDate = iso(addDays(parseISO(S.agDate), n*(S.agView==='dia'?1:7))); return render(); }
  if(d.agview){ S.agView=d.agview; return render(); }
  if(d.newpac!==undefined) return openPaciente();
  if(d.selpac){ S.selPac=d.selpac; return render(); }
  if(d.editpac) return openPaciente(d.editpac);
  if(d.copiar) return copiarResumo(d.copiar);
  if(d.abrirpront){ S.selPac=d.abrirpront; S.selDente=null; return go('prontuario'); }
  if(d.verportal){ S.selPac=d.verportal; return go('pacientes'); }
  if(d.dente){ S.selDente = String(S.selDente)===d.dente ? null : d.dente; return render(); }
  if(d.marca && S.selDente && S.selPac){
    const doc = prontDoc(S.selPac);
    if(d.marca==='higido') delete doc.dentes[S.selDente]; else doc.dentes[S.selDente]=d.marca;
    return salvarPront(S.selPac, doc);
  }
  if(d.delnota){
    if(!await confirmBox('Excluir esta anotação do prontuário?')) return;
    const doc = prontDoc(S.selPac); doc.notas = doc.notas.filter(n=>n.id!==d.delnota);
    return salvarPront(S.selPac, doc);
  }
  if(d.newfin!==undefined) return openFin(null, d.pac);
  if(d.editfin) return openFin(d.editfin);
  if(d.pagar) return openPagar(d.pagar);
});
document.addEventListener('input', e => {
  if(e.target.id==='pacBusca'){ S.pacBusca=e.target.value; render(); }
  const t=e.target;
  if(t.id==='tarBusca'){ S.tarBusca=t.value; clearTimeout(S._tb); S._tb=setTimeout(()=>{ const pos=t.selectionStart; render(); const x=$('#tarBusca'); if(x){ x.focus(); try{x.setSelectionRange(pos,pos);}catch(_){} } }, 250); return; }
  if(t.id==='favBusca'){ S.favBusca=t.value; const l=$('#favLista'); if(l) l.innerHTML=favRows(); return; }
  if(t.dataset && t.dataset.ri!==undefined){ const it=S.rec.itens[Number(t.dataset.ri)]; if(it){ it[t.dataset.f]=t.value; recSalvarRascunho(); } return; }
  const camposRec = {recPac:'paciente', recData:'data', recEnd:'endereco', recObs:'obs'};
  if(camposRec[t.id]){ S.rec[camposRec[t.id]] = t.value; if(t.id==='recPac') recAtualizarPaciente(); recSalvarRascunho(); return; }
  if(t.id==='tabBusca'){ S.tabBusca=t.value; const b=$('#tabBody'); if(b) b.innerHTML=tabelaRows(); return; }
  if(t.dataset && t.dataset.oi!==undefined){ const it=S.orc.itens[Number(t.dataset.oi)]; if(it){ it[t.dataset.f] = t.dataset.f==='dente' ? t.value : (Number(t.value)||0); orcSalvarRascunho(); orcAtualizarTotais(); } return; }
  const campos = {orcPac:'paciente', orcData:'data', orcVal:'validade', orcDesc:'desc', orcCond:'condicoes', orcObs:'obs'};
  if(campos[t.id]){ S.orc[campos[t.id]] = t.value; orcSalvarRascunho(); orcAtualizarTotais(); }
});
document.addEventListener('change', e => {
  const t=e.target;
  if(t.id==='agDate' && t.value){ S.agDate=t.value; render(); }
  if(t.id==='agProf'){ S.agProf=t.value; render(); }
  if(t.id==='notaModelo') return inserirModelo(t.value);
  if(t.id==='prontPac'){ S.selPac=t.value||null; S.selDente=null; S.anxFiltro=''; render(); }
  if(t.id==='finMes'){ S.finMes=t.value; render(); }
  if(t.id==='finStatus'){ S.finStatus=t.value; render(); }
  if(t.id==='anxFile' || t.id==='anxCam'){ const fl=[...t.files]; t.value=''; return anexarArquivos(fl, S.selPac); }
  if(t.id==='termoFile'){ const fl=[...t.files]; t.value=''; return anexarArquivos(fl, S.selPac, 'termo'); }
  if(t.id==='tarResp'){ S.tarResp=t.value; return render(); }
  if(t.id==='recTipo'){ S.rec.tipo=t.value; recSalvarRascunho(); return render(); }
  if(t.id==='recReg'){ S.rec.registrar=t.checked; recSalvarRascunho(); return; }
  if(t.dataset && t.dataset.ri!==undefined && t.tagName==='SELECT'){ const it=S.rec.itens[Number(t.dataset.ri)]; if(it){ it[t.dataset.f]=t.value; recSalvarRascunho(); } return; }
  if(t.id==='tabCat'){ S.tabCat=t.value; const b=$('#tabBody'); if(b) b.innerHTML=tabelaRows(); }
  if(t.id==='orcDescTipo'){ S.orc.descTipo=t.value; orcSalvarRascunho(); orcAtualizarTotais(); }
  if(t.dataset && t.dataset.precoid) return setPreco(t.dataset.precoid, t.value);
  if(t.dataset && t.dataset.orcstatus){ const o=S.orcamentos.find(x=>x.id===t.dataset.orcstatus); if(o) write('clinica', COL.orcamentos().doc(o.id), {...stripId(o), status:t.value, atualizadoPor:S.email, atualizadoEm:new Date().toISOString()}).then(ok=>ok&&toast('Status atualizado.')); }
});
document.addEventListener('submit', e => {
  if(e.target.id==='fLogin'){ e.preventDefault(); return entrar(e.target); }
  if(e.target.id==='fTarRapida'){ e.preventDefault(); return tarRapida(e.target); }
  if(e.target.id==='fNota'){
    e.preventDefault();
    const o = formData(e.target); if(!o.texto) return;
    const doc = prontDoc(S.selPac);
    doc.notas.push({id:'n'+Date.now().toString(36)+Math.random().toString(36).slice(2,6), data:o.data, dente:o.dente, texto:o.texto, tipo:(listaModelos(true).find(m=>m.id===S.notaTipo)||{}).nome||'', autor:S.email, criadoEm:new Date().toISOString()});
    e.target.reset(); S.notaTipo=''; ['notaTexto','notaDente','notaModelo'].forEach(i=>{const x=document.getElementById(i); if(x) x.value='';});
    salvarPront(S.selPac, doc);
    toast('Anotação adicionada.');
  }
});
async function entrar(f){
  const o = formData(f), err = $('#loginErr');
  try{ await S.fb.signInWithEmailAndPassword(S.auth, o.email, o.senha); }
  catch(e){ err.classList.remove('hidden'); err.textContent = /invalid|wrong|not-found|credential/.test(e.code||'') ? 'E-mail ou senha incorretos.' : (e.code==='auth/too-many-requests' ? 'Muitas tentativas. Aguarde alguns minutos.' : 'Não foi possível entrar agora.'); }
}
async function esqueci(){
  const email = ($('#lgEmail')?.value||'').trim(), err = $('#loginErr');
  if(!email){ err.classList.remove('hidden'); err.textContent='Digite seu e-mail e clique de novo em “Esqueci a senha”.'; return; }
  try{ await S.fb.sendPasswordResetEmail(S.auth, email); toast('Se o e-mail estiver cadastrado, enviamos um link de redefinição para '+email+'.'); }catch(_){ toast('Não foi possível enviar o e-mail.'); }
}
async function sair(){ try{ await S.fb.signOut(S.auth); }catch(_){} try{ localStorage.removeItem(ORC_DRAFT); localStorage.removeItem(REC_DRAFT); }catch(_){} S.orc = orcNovo(); S.rec = recNova(); go('inicio'); toast('Você saiu.'); }
$('#btnSair').addEventListener('click', sair);

/* ============ MODELOS DE PRONTUÁRIO ============ */
function listaModelos(incluirOcultos){
  const out = {};
  MODELOS_PADRAO.forEach(m=>out[m.id] = {...m, padrao:true});
  Object.entries(S.modelosDb).forEach(([id,m])=>out[id] = {...(out[id]||{}), ...m, id, padrao:!!out[id], alterado:!!out[id]});
  return Object.values(out).filter(m=>incluirOcultos || !m.oculto)
    .sort((a,b)=>(a.ordem||999)-(b.ordem||999) || String(a.nome).localeCompare(String(b.nome),'pt-BR'));
}
function dataExtenso(s){ const d = s ? parseISO(s) : new Date(); return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`; }
function preencherModelo(txt){
  const p = S.pacientes.find(x=>x.id===S.selPac) || {};
  const data = $('#notaData')?.value || todayISO();
  const dente = $('#notaDente')?.value || S.selDente || '';
  const v = { ...camposDocumento(p, {data, dente, dentes:dente}), dente:dente||'___' };
  return String(txt||'').replace(/\{\{(\w+)\}\}/g, (m,k)=> k in v ? v[k] : m);
}
async function inserirModelo(id){
  const ta = $('#notaTexto');
  if(!id){ S.notaTipo=''; return; }
  const m = listaModelos(true).find(x=>x.id===id); if(!m || !ta) return;
  if(ta.value.trim() && !await confirmBox('Substituir o texto que já está na anotação pelo modelo “'+m.nome+'”?', 'Substituir')){
    const sel=$('#notaModelo'); if(sel) sel.value=S.notaTipo; return;
  }
  S.notaTipo = id;
  const alvo = $('#notaTexto'); alvo.value = preencherModelo(m.texto);
  alvo.focus(); const pos = alvo.value.indexOf('___'); if(pos>=0) alvo.setSelectionRange(pos,pos+3);
}
function openModelos(){
  const l = listaModelos(true);
  const body = `<p style="margin:0 0 12px;color:var(--muted)">Os modelos valem para toda a equipe. Edite o texto como preferir; os campos entre chaves são preenchidos automaticamente.</p>
    ${l.map(m=>`<div class="row"><div><b style="${m.oculto?'color:var(--muted);text-decoration:line-through':''}">${esc(m.nome)}</b>
      <div class="m">${m.padrao?(m.alterado?'Modelo padrão (editado)':'Modelo padrão'):'Criado pela clínica'}${m.oculto?' · oculto':''}</div></div>
      <div style="white-space:nowrap"><button class="btn sm ghost" data-editmodelo="${esc(m.id)}">Editar</button>
      ${m.padrao&&m.alterado&&!m.oculto?`<button class="btn sm ghost" data-restauramodelo="${esc(m.id)}">Restaurar</button>`:''}
      <button class="btn sm" data-ocultamodelo="${esc(m.id)}">${m.oculto?'Mostrar':'Ocultar'}</button></div></div>`).join('')}`;
  openModal('Modelos de prontuário', body, `<div class="r"><button class="btn" data-close>Fechar</button><button class="btn primary" data-novomodelo>${ICON.plus}Novo modelo</button></div>`);
}
function openModeloEdit(id){
  const m = id ? listaModelos(true).find(x=>x.id===id) : {nome:'', texto:''};
  if(id && !m) return;
  const body = `<form id="fMod" class="fg">
    <label class="f full">Nome do modelo<input name="nome" required value="${esc(m.nome)}" placeholder="Ex.: Raspagem subgengival"></label>
    <label class="f full">Texto<textarea name="texto" required style="min-height:320px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px">${esc(m.texto)}</textarea></label>
    <div class="full" style="color:var(--muted);font-size:12px;line-height:1.6">Campos automáticos: ${CAMPOS_AJUDA} <code>{{dente}}</code>. Use <code>___</code> para lacunas: o cursor vai direto para a primeira.</div>
  </form>`;
  const mm = openModal(id?'Editar modelo':'Novo modelo', body, `<button class="btn" data-modelos>Voltar</button><div class="r"><button class="btn primary" data-save>Salvar modelo</button></div>`);
  const f = mm.querySelector('#fMod');
  const salvar = async()=>{
    if(!f.reportValidity()) return;
    const o = formData(f);
    const ref = id ? COL.modelos().doc(id) : COL.modelos().doc();
    const atual = id ? (S.modelosDb[id]||{}) : {};
    const doc = {...atual, nome:o.nome, texto:o.texto, oculto:false, ordem: m.ordem || (100+listaModelos(true).length), atualizadoPor:S.email, atualizadoEm:new Date().toISOString()};
    S.modelosDb = {...S.modelosDb, [ref.id]:doc};
    openModelos();
    if(await write('clinica', ref, doc)) toast('Modelo salvo.');
  };
  f.addEventListener('submit', e=>{e.preventDefault(); salvar();});
  mm.querySelector('[data-save]').onclick = salvar;
}
async function ocultarModelo(id){
  const m = listaModelos(true).find(x=>x.id===id); if(!m) return;
  const doc = {...(S.modelosDb[id]||{}), ...(S.modelosDb[id]?{}:{nome:m.nome, texto:m.texto, ordem:m.ordem}), oculto:!m.oculto, atualizadoPor:S.email, atualizadoEm:new Date().toISOString()};
  S.modelosDb = {...S.modelosDb, [id]:doc};
  openModelos();
  await write('clinica', COL.modelos().doc(id), doc);
}
async function restaurarModelo(id){
  const p = MODELOS_PADRAO.find(x=>x.id===id); if(!p) return;
  if(!await confirmBox('Voltar o modelo “'+p.nome+'” ao texto original? As alterações feitas nele serão perdidas.', 'Restaurar')) return openModelos();
  const doc = {nome:p.nome, texto:p.texto, ordem:p.ordem, oculto:false, atualizadoPor:S.email, atualizadoEm:new Date().toISOString()};
  S.modelosDb = {...S.modelosDb, [id]:doc};
  openModelos();
  if(await write('clinica', COL.modelos().doc(id), doc)) toast('Modelo restaurado.');
}
function editarNota(id){
  const pid = S.selPac;
  const n = ((S.prontuarios[pid]||{}).notas||[]).find(x=>x.id===id); if(!n) return;
  const m = openModal('Editar anotação'+(n.tipo?' — '+n.tipo:''), `<form id="fEditNota" class="fg">
      <label class="f">Data<input type="date" name="data" value="${esc(n.data||todayISO())}" required></label>
      <label class="f">Dente (opcional)<input name="dente" value="${esc(n.dente||'')}"></label>
      <label class="f full">Texto<textarea name="texto" required style="min-height:320px;font-size:13.5px;line-height:1.55">${esc(n.texto)}</textarea></label>
      <div class="full" style="color:var(--muted);font-size:12px">A versão anterior fica guardada no histórico da anotação.${n.historico&&n.historico.length?` Esta anotação já foi editada ${n.historico.length} vez(es).`:''}</div>
    </form>`, `<div class="r"><button class="btn" data-close>Cancelar</button><button class="btn" data-save>Salvar</button><button class="btn primary" data-saveprint>Salvar e imprimir</button></div>`);
  m.querySelector('.mbox').classList.add('wide');
  const salvar = async imprimir=>{
    const f = m.querySelector('#fEditNota'); if(!f.reportValidity()) return;
    const o = formData(f);
    const doc = prontDoc(pid);
    const ix = doc.notas.findIndex(x=>x.id===id); if(ix<0){ closeModal(); return toast('Anotação não encontrada.'); }
    const atual = doc.notas[ix];
    if(o.texto===atual.texto && o.data===atual.data && (o.dente||'')===(atual.dente||'')){ closeModal(); if(imprimir) imprimirNota(id); return; }
    const agora = new Date().toISOString();
    const hist = (atual.historico||[]).concat([{texto:atual.texto, data:atual.data, dente:atual.dente||'', ateEm:agora, por:atual.editadoPor||atual.autor||''}]).slice(-10);
    doc.notas[ix] = {...atual, texto:o.texto, data:o.data, dente:o.dente||'', editadoEm:agora, editadoPor:S.email, historico:hist};
    closeModal();
    await salvarPront(pid, doc);
    toast('Anotação atualizada.');
    if(imprimir) imprimirNota(id);
  };
  m.querySelector('[data-save]').onclick = ()=>salvar(false);
  m.querySelector('[data-saveprint]').onclick = ()=>salvar(true);
}
function imprimirNota(id){
  const p = S.pacientes.find(x=>x.id===S.selPac) || {};
  const n = ((S.prontuarios[S.selPac]||{}).notas||[]).find(x=>x.id===id); if(!n) return;
  let area = document.getElementById('printArea');
  if(!area){ area = document.createElement('div'); area.id = 'printArea'; document.body.appendChild(area); }
  const contato = contatoCabecalho();
  area.innerHTML = `<div class="pa-head"><div class="pa-nome">${esc(CLINICA.nome||'Clínica Odontológica')}</div>${contato?`<div class="pa-ct">${esc(contato)}</div>`:''}</div>
    <div class="pa-meta">Paciente: <b>${esc(p.nome||'')}</b>${p.nascimento?' · '+esc(idade(p.nascimento)):''} · ${fmtData(n.data)}${n.dente?' · dente '+esc(n.dente):''}</div>
    <div class="pa-txt">${esc(n.texto)}</div>
    <div class="pa-ass"><div class="pa-linha"></div>${esc(CLINICA.dentista||'Cirurgião(ã)-dentista')}${CLINICA.cro?'<br>CRO '+esc(CLINICA.cro):''}</div>`;
  setTimeout(()=>imprimirArea(), 50);
}

/* ============ ORÇAMENTOS E TABELA DE PREÇOS ============ */
const ORC_DRAFT = 'odontogest-orcamento-rascunho';
const orcNovo = () => ({ id:null, numero:'', pacienteId:'', paciente:'', data:todayISO(), validade:30, itens:[], descTipo:'%', desc:0, condicoes:'', obs:'', status:'aberto' });
const ORC_STATUS = { aberto:'Em aberto', aprovado:'Aprovado', recusado:'Recusado' };
function orcSalvarRascunho(){ try{ localStorage.setItem(ORC_DRAFT, JSON.stringify(S.orc)); }catch(_){} }
function orcCarregarRascunho(){ try{ const v = JSON.parse(localStorage.getItem(ORC_DRAFT)||'null'); if(v && Array.isArray(v.itens)) return {...orcNovo(), ...v}; }catch(_){} return orcNovo(); }
S.orc = orcCarregarRascunho();

function listaPrecos(incluirOcultos){
  const ov = (S.tabelaDb && S.tabelaDb.itens) || {};
  const out = TABELA_PADRAO.map(p => ({...p, ...(ov[p.id]||{}), id:p.id, padrao:true, valorPadrao:p.valor, alterado:!!ov[p.id] && ov[p.id].valor!==undefined && ov[p.id].valor!==p.valor}));
  Object.entries(ov).forEach(([id,v]) => { if(v && v.custom) out.push({cod:'', ...v, id}); });
  return out.filter(p => incluirOcultos || !p.oculto);
}
function categoriasPrecos(){
  const cats = [...CATEGORIAS];
  listaPrecos(true).forEach(p => { if(p.cat && !cats.includes(p.cat)) cats.push(p.cat); });
  return cats;
}
function orcTotais(o){
  const sub = (o.itens||[]).reduce((s,i)=>s + (Number(i.qtd)||0)*(Number(i.valor)||0), 0);
  const dv = Number(o.desc)||0;
  const desc = Math.min(sub, o.descTipo==='%' ? sub*dv/100 : dv);
  return { sub: Math.round(sub*100)/100, desc: Math.round(desc*100)/100, total: Math.round((sub-desc)*100)/100 };
}
function orcValidadeAte(o){ return o.data ? iso(addDays(parseISO(o.data), Number(o.validade)||0)) : ''; }
function orcNumero(o){ return o.numero || ('ORC-' + String(o.data||todayISO()).replace(/-/g,'') + '-' + Math.random().toString(36).slice(2,6).toUpperCase()); }

function tabelaRows(){
  const q = norm(S.tabBusca);
  const edit = S.tabEdit && S.isAdmin;
  const lista = listaPrecos(false).filter(p => (!S.tabCat || p.cat===S.tabCat) && (!q || norm(p.desc).includes(q) || String(p.cod).includes(q)));
  if(!lista.length) return `<tr><td colspan="4"><div class="empty">Nenhum procedimento encontrado.</div></td></tr>`;
  let cat = null, html = '';
  for(const p of lista){
    if(p.cat !== cat && !S.tabCat){ cat = p.cat; html += `<tr class="tcat"><td colspan="4">${esc(cat)}</td></tr>`; }
    html += `<tr class="${p.oculto?'oculto':''}">
      <td class="cod">${esc(p.cod||'—')}</td>
      <td>${esc(p.desc)}${p.custom?' <span class="tag">clínica</span>':''}${edit&&p.alterado?` <span class="m" title="Valor de referência VRPO">ref. ${BRL(p.valorPadrao)}</span>`:''}</td>
      <td class="num">${edit
        ? `<input type="number" class="inp preco" min="0" step="0.01" value="${Number(p.valor).toFixed(2)}" data-precoid="${esc(p.id)}">`
        : `<b>${BRL(p.valor)}</b>`}</td>
      <td style="text-align:right;white-space:nowrap">${edit
        ? `<button class="btn sm ghost" data-ocultaproc="${esc(p.id)}">Ocultar</button>`
        : `<button class="btn sm" data-addproc="${esc(p.id)}">${ICON.plus}</button>`}</td></tr>`;
  }
  return html;
}

function orcItensHtml(){
  const o = S.orc;
  if(!o.itens.length) return `<div class="empty" style="padding:18px 6px">Clique em <b>+</b> nos procedimentos da tabela para montar o orçamento.</div>`;
  return `<table class="orc-it"><thead><tr><th>Procedimento</th><th>Dente/região</th><th>Qtd</th><th class="num">Valor</th><th class="num">Total</th><th></th></tr></thead><tbody>${o.itens.map((i,ix)=>`
    <tr><td>${esc(i.desc)}</td>
      <td><input class="inp" style="width:62px" id="oi-d-${ix}" data-oi="${ix}" data-f="dente" value="${esc(i.dente||'')}" placeholder="Ex.: 36"></td>
      <td><input class="inp" style="width:44px" type="number" min="1" step="1" id="oi-q-${ix}" data-oi="${ix}" data-f="qtd" value="${esc(i.qtd)}"></td>
      <td class="num"><input class="inp" style="width:80px;text-align:right" type="number" min="0" step="0.01" id="oi-v-${ix}" data-oi="${ix}" data-f="valor" value="${Number(i.valor).toFixed(2)}"></td>
      <td class="num" id="oi-t-${ix}"><b>${BRL((Number(i.qtd)||0)*(Number(i.valor)||0))}</b></td>
      <td><button class="btn sm ghost" data-orcrm="${ix}" title="Remover">${ICON.x}</button></td></tr>`).join('')}</tbody></table>`;
}

function renderOrcamento(){
  const o = S.orc, t = orcTotais(o);
  const cats = categoriasPrecos();
  const adm = S.isAdmin;
  const salvos = S.orcamentos.slice().sort((a,b)=>String(b.data+b.criadoEm).localeCompare(String(a.data+a.criadoEm)));
  $('#main').innerHTML = `
    <div class="ph"><div><h2>Orçamentos</h2><div class="sub">Tabela de procedimentos (referência: ${esc(TABELA_FONTE)}) e montagem de orçamentos</div></div>
      <div class="tools">${adm?`<button class="btn ${S.tabEdit?'primary':''}" data-tabedit>${S.tabEdit?'Concluir edição':'Editar preços'}</button>${S.tabEdit?`<button class="btn" data-reajuste>Reajustar %</button><button class="btn" data-novoproc>${ICON.plus}Novo procedimento</button><button class="btn ghost" data-restauratabela>Restaurar tabela${(()=>{const n=listaPrecos(true).filter(p=>p.oculto).length; return n?` (${n} oculto${n>1?'s':''})`:'';})()}</button>`:''}`:''}</div></div>
    ${S.tabEdit&&adm?`<div class="note info">Modo de edição: altere o valor e clique fora do campo para salvar. Os valores da VRPO 2016 estão desatualizados — use <b>Reajustar %</b> para corrigir a tabela inteira de uma vez.</div>`:''}
    <div class="orc-grid">
      <div class="card"><div class="bd" style="padding:10px;display:flex;gap:8px;flex-wrap:wrap">
          <input class="inp" id="tabBusca" style="flex:1;min-width:180px" placeholder="Buscar procedimento ou código" value="${esc(S.tabBusca)}">
          <select class="inp" id="tabCat"><option value="">Todas as categorias</option>${cats.map(c=>`<option ${c===S.tabCat?'selected':''}>${esc(c)}</option>`).join('')}</select>
        </div>
        <div class="tbl-wrap tab-precos"><table><thead><tr><th>Cód.</th><th>Procedimento</th><th class="num">Valor</th><th></th></tr></thead><tbody id="tabBody">${tabelaRows()}</tbody></table></div>
      </div>
      <div class="card orc-card"><div class="hd"><h3>${o.id?'Orçamento '+esc(o.numero||''):'Novo orçamento'}</h3><button class="btn sm ghost" data-orcnovo>Limpar</button></div><div class="bd">
        <div class="fg">
          <label class="f full">Paciente<input id="orcPac" list="dlPacOrc" value="${esc(o.paciente)}" placeholder="Nome do paciente" autocomplete="off"></label>
          <datalist id="dlPacOrc">${S.pacientes.map(p=>`<option value="${esc(p.nome)}">`).join('')}</datalist>
          <label class="f">Data<input type="date" id="orcData" value="${esc(o.data)}"></label>
          <label class="f">Validade (dias)<input type="number" min="1" id="orcVal" value="${esc(o.validade)}"></label>
        </div>
        <div style="margin:14px 0 6px">${orcItensHtml()}</div>
        <div class="orc-tot">
          <div class="row"><span class="m">Subtotal</span><b id="orcSub">${BRL(t.sub)}</b></div>
          <div class="row"><span class="m" style="display:flex;gap:6px;align-items:center">Desconto
            <select class="inp" id="orcDescTipo" style="padding:3px 6px"><option value="%" ${o.descTipo==='%'?'selected':''}>%</option><option value="R$" ${o.descTipo==='R$'?'selected':''}>R$</option></select>
            <input class="inp" id="orcDesc" type="number" min="0" step="0.01" style="width:90px;padding:3px 6px" value="${esc(o.desc||0)}"></span><b id="orcDescV" style="color:var(--red)">− ${BRL(t.desc)}</b></div>
          <div class="row total"><span>Total</span><b id="orcTot">${BRL(t.total)}</b></div>
        </div>
        <div class="fg" style="margin-top:12px">
          <label class="f full">Condições de pagamento<textarea id="orcCond" style="min-height:56px" placeholder="Ex.: à vista no Pix com 5% de desconto ou em até 10x no cartão">${esc(o.condicoes)}</textarea></label>
          <label class="f full">Observações<textarea id="orcObs" style="min-height:56px">${esc(o.obs)}</textarea></label>
        </div>
        <div class="orc-acoes">
          <button class="btn primary" data-orcprint>Imprimir / PDF</button>
          <button class="btn" data-orccsv>Baixar planilha</button>
          <button class="btn" data-orccopy>Copiar texto</button>
          <button class="btn" data-orcsave>${o.id?'Salvar alterações':'Salvar orçamento'}</button>
          ${MODO==='gestao'&&adm?`<button class="btn" data-orccob>Gerar cobrança</button>`:''}
        </div>
      </div></div>
    </div>
    <div class="card" style="margin-top:16px"><div class="hd"><h3>Orçamentos salvos</h3><span class="m" style="color:var(--muted);font-size:12px">${salvos.length} no total</span></div>
      <div class="tbl-wrap"><table><thead><tr><th>Nº</th><th>Data</th><th>Paciente</th><th class="num">Total</th><th>Status</th><th></th></tr></thead><tbody>
      ${salvos.map(s=>`<tr><td>${esc(s.numero||'—')}</td><td>${fmtData(s.data)}</td><td><b>${esc(s.paciente||'—')}</b></td><td class="num"><b>${BRL(s.total)}</b></td>
        <td><select class="inp" data-orcstatus="${esc(s.id)}" style="padding:3px 6px">${Object.entries(ORC_STATUS).map(([k,l])=>`<option value="${k}" ${s.status===k?'selected':''}>${l}</option>`).join('')}</select></td>
        <td style="text-align:right;white-space:nowrap"><button class="btn sm ghost" data-orcopen="${esc(s.id)}">Abrir</button><button class="btn sm ghost" data-orcprint2="${esc(s.id)}">Imprimir</button>${adm?`<button class="btn sm ghost danger" data-orcdel="${esc(s.id)}">Excluir</button>`:''}</td></tr>`).join('')
        || `<tr><td colspan="6"><div class="empty">Nenhum orçamento salvo ainda.</div></td></tr>`}
      </tbody></table></div></div>`;
}

function orcAtualizarTotais(){
  const t = orcTotais(S.orc);
  const set = (id,v) => { const el = document.getElementById(id); if(el) el.textContent = v; };
  set('orcSub', BRL(t.sub)); set('orcDescV', '− '+BRL(t.desc)); set('orcTot', BRL(t.total));
  S.orc.itens.forEach((i,ix)=>{ const el=document.getElementById('oi-t-'+ix); if(el) el.innerHTML = '<b>'+BRL((Number(i.qtd)||0)*(Number(i.valor)||0))+'</b>'; });
}
function orcAddProc(id){
  const p = listaPrecos(true).find(x=>x.id===id); if(!p) return;
  S.orc.itens.push({ pid:p.id, cod:p.cod||'', desc:p.desc, dente:'', qtd:1, valor:Number(p.valor)||0 });
  orcSalvarRascunho(); render(); toast('Adicionado: '+p.desc);
}
function orcResolverPaciente(o){
  const p = S.pacientes.find(x=>norm(x.nome)===norm(o.paciente));
  return p ? {pacienteId:p.id, paciente:p.nome} : {pacienteId:'', paciente:o.paciente};
}
function orcDoc(o){
  const t = orcTotais(o);
  return { ...orcResolverPaciente(o), numero: o.numero || orcNumero(o), data:o.data, validade:Number(o.validade)||30,
    itens: o.itens.map(i=>({pid:i.pid||'', cod:i.cod||'', desc:i.desc, dente:i.dente||'', qtd:Number(i.qtd)||1, valor:Number(i.valor)||0})),
    descTipo:o.descTipo, desc:Number(o.desc)||0, subtotal:t.sub, descontoValor:t.desc, total:t.total,
    condicoes:o.condicoes||'', obs:o.obs||'', status:o.status||'aberto' };
}
function orcValidar(o){
  if(!o.itens.length){ toast('Adicione pelo menos um procedimento.'); return false; }
  if(!String(o.paciente||'').trim()){ toast('Informe o nome do paciente.'); $('#orcPac')?.focus(); return false; }
  return true;
}
async function orcSalvar(){
  const o = S.orc; if(!orcValidar(o)) return null;
  const ref = o.id ? COL.orcamentos().doc(o.id) : COL.orcamentos().doc();
  const atual = o.id ? (S.orcamentos.find(x=>x.id===o.id)||{}) : {};
  const doc = {...stripId(atual), ...orcDoc(o), atualizadoPor:S.email, atualizadoEm:new Date().toISOString(), ...(o.id?{}:{criadoPor:S.email, criadoEm:new Date().toISOString()})};
  if(await write('clinica', ref, doc)){ S.orc = {...S.orc, id:ref.id, numero:doc.numero}; orcSalvarRascunho(); render(); toast('Orçamento salvo.'); return ref.id; }
  return null;
}
function orcTexto(o){
  const t = orcTotais(o);
  return [`*${CLINICA.nome||'Orçamento odontológico'}*`, `Orçamento para ${o.paciente||'—'} — ${fmtData(o.data)}`, '',
    ...o.itens.map(i=>`• ${i.desc}${i.dente?' (dente/região '+i.dente+')':''} — ${i.qtd} x ${BRL(i.valor)} = ${BRL((Number(i.qtd)||0)*(Number(i.valor)||0))}`), '',
    `Subtotal: ${BRL(t.sub)}`, t.desc?`Desconto: − ${BRL(t.desc)}`:'', `*Total: ${BRL(t.total)}*`,
    o.condicoes?`\nCondições: ${o.condicoes}`:'', `Válido até ${fmtData(orcValidadeAte(o))}.`, o.obs?`\n${o.obs}`:''].filter(x=>x!=='').join('\n');
}
function orcCSV(o){
  const t = orcTotais(o);
  const n = v => (Math.round((Number(v)||0)*100)/100).toFixed(2).replace('.',',');
  const q = s => '"' + String(s??'').replace(/"/g,'""') + '"';
  const linhas = [
    [q(CLINICA.nome||'Orçamento')], [q('Paciente'), q(o.paciente)], [q('Data'), q(fmtData(o.data))], [q('Válido até'), q(fmtData(orcValidadeAte(o)))], [],
    [q('Código'), q('Procedimento'), q('Dente/região'), q('Qtd'), q('Valor unitário (R$)'), q('Total (R$)')],
    ...o.itens.map(i=>[q(i.cod), q(i.desc), q(i.dente), i.qtd, n(i.valor), n((Number(i.qtd)||0)*(Number(i.valor)||0))]),
    [], ['', '', '', '', q('Subtotal'), n(t.sub)], ['', '', '', '', q('Desconto'), n(t.desc)], ['', '', '', '', q('Total'), n(t.total)],
    [], [q('Condições'), q(o.condicoes)], [q('Observações'), q(o.obs)]
  ];
  return '﻿' + linhas.map(l=>l.join(';')).join('\r\n');
}
function baixarArquivo(nome, conteudo, tipo){
  const url = URL.createObjectURL(new Blob([conteudo], {type:tipo}));
  const a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 1000);
}
function slug(s){ return norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'paciente'; }
function orcImprimir(o){
  if(!o.itens.length){ toast('Adicione pelo menos um procedimento.'); return; }
  const t = orcTotais(o);
  let area = document.getElementById('printArea');
  if(!area){ area = document.createElement('div'); area.id = 'printArea'; document.body.appendChild(area); }
  const contato = contatoCabecalho();
  area.innerHTML = `<div class="pa-head"><div class="pa-nome">${esc(CLINICA.nome||'Clínica Odontológica')}</div>${contato?`<div class="pa-ct">${esc(contato)}</div>`:''}</div>
    <div class="pa-titulo">ORÇAMENTO ${o.numero?esc(o.numero):''}</div>
    <div class="pa-meta">Paciente: <b>${esc(o.paciente||'')}</b> · Data: ${fmtData(o.data)} · Válido até ${fmtData(orcValidadeAte(o))}</div>
    <table class="pa-tab"><thead><tr><th>Procedimento</th><th>Dente/região</th><th>Qtd</th><th class="num">Valor unit.</th><th class="num">Total</th></tr></thead><tbody>
      ${o.itens.map(i=>`<tr><td>${esc(i.desc)}</td><td>${esc(i.dente||'—')}</td><td>${esc(i.qtd)}</td><td class="num">${BRL(i.valor)}</td><td class="num">${BRL((Number(i.qtd)||0)*(Number(i.valor)||0))}</td></tr>`).join('')}
    </tbody><tfoot>
      <tr><td colspan="4" class="num">Subtotal</td><td class="num">${BRL(t.sub)}</td></tr>
      ${t.desc?`<tr><td colspan="4" class="num">Desconto${o.descTipo==='%'?' ('+esc(o.desc)+'%)':''}</td><td class="num">− ${BRL(t.desc)}</td></tr>`:''}
      <tr class="pa-total"><td colspan="4" class="num">Total</td><td class="num">${BRL(t.total)}</td></tr>
    </tfoot></table>
    ${o.condicoes?`<div class="pa-bloco"><b>Condições de pagamento:</b> ${esc(o.condicoes)}</div>`:''}
    ${o.obs?`<div class="pa-bloco"><b>Observações:</b> ${esc(o.obs)}</div>`:''}
    <div class="pa-assin2">
      <div><div class="pa-linha"></div>${esc(CLINICA.dentista||'Cirurgião(ã)-dentista')}${CLINICA.cro?'<br>CRO '+esc(CLINICA.cro):''}</div>
      <div><div class="pa-linha"></div>De acordo — ${esc(o.paciente||'Paciente')}</div>
    </div>`;
  document.body.classList.add('print-orc');
  setTimeout(()=>{ imprimirArea(); setTimeout(()=>document.body.classList.remove('print-orc'), 500); }, 50);
}

/* edição da tabela (somente administradora) */
function tabelaOverrides(){ return {...((S.tabelaDb && S.tabelaDb.itens)||{})}; }
async function tabelaSalvar(itens, msg){
  const doc = { itens, atualizadoPor:S.email, atualizadoEm:new Date().toISOString() };
  S.tabelaDb = doc; render();
  if(await write('clinica', COL.tabela().doc('precos'), doc) && msg) toast(msg);
}
function setPreco(id, valor){
  const v = Math.round((Number(valor)||0)*100)/100;
  const itens = tabelaOverrides(); const p = TABELA_PADRAO.find(x=>x.id===id);
  const atual = itens[id] || {};
  if(p && v===p.valor && !atual.oculto && !atual.custom){ delete itens[id]; }
  else itens[id] = {...atual, valor:v};
  tabelaSalvar(itens, 'Preço atualizado.');
}
function ocultarProc(id){
  const itens = tabelaOverrides(); const atual = itens[id] || {};
  itens[id] = {...atual, oculto:true};
  tabelaSalvar(itens, 'Procedimento retirado da lista. Para trazer de volta, use Restaurar tabela.');
}
function semOculto(itens, id){
  const {oculto, ...resto} = itens[id] || {};
  if(Object.keys(resto).length) itens[id] = resto; else delete itens[id];
}
async function mostrarProc(id){
  const itens = tabelaOverrides(); semOculto(itens, id);
  await tabelaSalvar(itens, 'Procedimento restaurado na tabela.');
  if(listaPrecos(true).some(p=>p.oculto)) restaurarTabela(); else closeModal();
}
async function mostrarTodosProc(){
  const itens = tabelaOverrides();
  listaPrecos(true).filter(p=>p.oculto).forEach(p=>semOculto(itens, p.id));
  closeModal(); await tabelaSalvar(itens, 'Todos os procedimentos ocultos voltaram para a tabela.');
}
function abrirReajuste(){
  const m = openModal('Reajustar tabela', `<p style="margin:0 0 12px;line-height:1.55">Aplica um percentual sobre os preços de todos os procedimentos${S.tabCat?` da categoria <b>${esc(S.tabCat)}</b>`:''}. Ex.: para atualizar a VRPO 2016, informe o índice de correção acumulado.</p>
    <form id="fReaj" class="fg"><label class="f">Percentual (%)<input type="number" step="0.01" name="pct" required placeholder="Ex.: 55"></label>
    <label class="f">Base do cálculo<select name="base"><option value="atual">Preços atuais</option><option value="vrpo">Valores originais da VRPO 2016</option></select></label></form>`,
    `<div class="r"><button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Aplicar</button></div>`);
  m.querySelector('[data-save]').onclick = async()=>{
    const f = m.querySelector('#fReaj'); if(!f.reportValidity()) return;
    const o = formData(f); const fator = 1 + (Number(o.pct)||0)/100;
    const alvo = listaPrecos(true).filter(p => !S.tabCat || p.cat===S.tabCat);
    if(!await confirmBox(`Aplicar ${o.pct}% sobre ${alvo.length} procedimentos (base: ${o.base==='vrpo'?'VRPO 2016':'preços atuais'})?`, 'Aplicar')) return;
    const itens = tabelaOverrides();
    alvo.forEach(p => { const base = o.base==='vrpo' && p.padrao ? p.valorPadrao : Number(p.valor)||0; itens[p.id] = {...(itens[p.id]||{}), valor: Math.round(base*fator*100)/100}; });
    tabelaSalvar(itens, 'Tabela reajustada.');
  };
}
function novoProc(){
  const m = openModal('Novo procedimento', `<form id="fProc" class="fg">
    <label class="f full">Descrição<input name="desc" required placeholder="Ex.: Lente de contato dental em porcelana (por elemento)"></label>
    <label class="f">Categoria<input name="cat" list="dlCats" required value="${esc(S.tabCat||'')}"></label>
    <datalist id="dlCats">${categoriasPrecos().map(c=>`<option value="${esc(c)}">`).join('')}</datalist>
    <label class="f">Valor (R$)<input type="number" step="0.01" min="0" name="valor" required></label></form>`,
    `<div class="r"><button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Adicionar</button></div>`);
  const salvar = ()=>{
    const f = m.querySelector('#fProc'); if(!f.reportValidity()) return;
    const o = formData(f); const itens = tabelaOverrides();
    itens['c'+Date.now().toString(36)] = { custom:true, cat:o.cat, desc:o.desc, valor:Math.round(Number(o.valor)*100)/100 };
    closeModal(); tabelaSalvar(itens, 'Procedimento adicionado à tabela.');
  };
  m.querySelector('[data-save]').onclick = salvar;
  m.querySelector('#fProc').addEventListener('submit', e=>{ e.preventDefault(); salvar(); });
}
function restaurarTabela(){
  const ocultos = listaPrecos(true).filter(p=>p.oculto).sort((a,b)=>String(a.desc).localeCompare(String(b.desc),'pt-BR'));
  const corpo = ocultos.length
    ? `<p style="margin:0 0 10px;color:var(--muted);font-size:13px">${ocultos.length} procedimento${ocultos.length>1?'s':''} oculto${ocultos.length>1?'s':''}. Clique em <b>Restaurar</b> para devolver à tabela.</p>
      <div class="tbl-wrap" style="max-height:55vh;overflow:auto"><table><tbody>${ocultos.map(p=>`<tr>
        <td class="m" style="color:var(--muted);font-size:12px;width:52px">${esc(p.cod||'—')}</td>
        <td>${esc(p.desc)}<div style="color:var(--muted);font-size:11.5px">${esc(p.cat||'')}</div></td>
        <td class="num" style="white-space:nowrap">${BRL(p.valor)}</td>
        <td style="text-align:right"><button class="btn sm primary" data-restproc="${esc(p.id)}">Restaurar</button></td></tr>`).join('')}</tbody></table></div>`
    : `<div class="empty" style="padding:18px 6px">Nenhum procedimento oculto no momento.</div>`;
  openModal('Restaurar tabela', corpo,
    `<button class="btn ghost danger" data-resetvrpo title="Volta todos os preços e itens ao original">Voltar à VRPO original</button><div class="r"><button class="btn" data-close>Fechar</button>${ocultos.length>1?'<button class="btn primary" data-restallocultos>Restaurar todos</button>':''}</div>`);
}
async function resetarVRPO(){
  if(!await confirmBox('Voltar todos os preços aos valores originais da VRPO 2016? Procedimentos criados pela clínica também serão removidos.', 'Restaurar')) return;
  tabelaSalvar({}, 'Tabela restaurada para a VRPO 2016.');
}

/* Impressão: cabeçalho da clínica (telefone e Instagram) na primeira folha; endereço e
   "Página X de Y" no rodapé de todas as folhas, desenhados pelo próprio documento.
   A margem de baixo é pequena demais para o rodapé do navegador (onde ele põe o link do site). */
function contatoCabecalho(){
  const ig = CLINICA.instagram ? 'Instagram ' + (String(CLINICA.instagram).startsWith('@') ? CLINICA.instagram : '@'+CLINICA.instagram) : '';
  return [CLINICA.telefone, ig].filter(Boolean).join(' · ');
}
function imprimirArea(){
  const area = document.getElementById('printArea'); if(!area) return window.print();
  if(!area.querySelector('.rx-pag') && !area.querySelector(':scope > table.pa-pg')){
    area.innerHTML = `<table class="pa-pg"><tbody><tr><td>${area.innerHTML}</td></tr></tbody><tfoot><tr><td><div class="pa-sp"></div></td></tr></tfoot></table>`;
  }
  const css = s => '"' + String(s||'').replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,' ') + '"';
  const end = [CLINICA.nome, CLINICA.endereco].filter(Boolean).join(' · ');
  let st = document.getElementById('printPage');
  if(!st){ st = document.createElement('style'); st.id = 'printPage'; document.head.appendChild(st); }
  st.textContent = `@page{ @bottom-left{ content:${css(end)}; font:7.5pt Arial,sans-serif; color:#444; vertical-align:top; padding-top:1mm } @bottom-right{ content:"Página " counter(page) " de " counter(pages); font:7.5pt Arial,sans-serif; color:#444; vertical-align:top; padding-top:1mm } }`;
  const titulo = document.title; document.title = CLINICA.nome || 'Clínica';
  window.print();
  setTimeout(()=>{ document.title = titulo; }, 800);
}
/* ============ PRONTUÁRIO: IMAGENS, TERMOS E ASSINATURA ============ */
const ANX_CAT = { intraoral:'Foto intraoral', extraoral:'Foto extraoral', periapical:'Radiografia periapical', panoramica:'Radiografia panorâmica', interproximal:'Radiografia interproximal', tomografia:'Tomografia', exame:'Exame / laudo', termo:'Termo assinado (papel)', outro:'Outro' };
const ANX_CHUNK = 900000;            // caracteres por pedaço (limite de 1 MB por documento no Firestore)
const ANX_MAX_PDF = 6*1024*1024;     // PDFs até 6 MB
S.pacSubs = { pid:null, un:[] }; S.anexos = []; S.termos = []; S.termosModelosDb = {};
S.prontAba = 'evolucao'; S.anxFiltro = '';
function assinarPaciente(pid){
  if(S.pacSubs.pid === pid) return;
  S.pacSubs.un.forEach(f=>{ try{f()}catch(_){} });
  S.pacSubs = { pid:null, un:[] }; S.anexos = []; S.termos = [];
  if(!pid || !S.db || !S.role) return;
  S.pacSubs.pid = pid;
  S.pacSubs.un.push(COL.anexos().where('pacienteId', pid).onSnapshot(s=>{ S.anexos = s.docs.map(d=>({id:d.id, ...d.data()})); render(); }, ()=>{}));
  S.pacSubs.un.push(COL.termos().where('pacienteId', pid).onSnapshot(s=>{ S.termos = s.docs.map(d=>({id:d.id, ...d.data()})); render(); }, ()=>{}));
}
function listaTermosModelos(incluirOcultos){
  const out = {};
  TERMOS_PADRAO.forEach(m=>out[m.id] = {...m, padrao:true});
  Object.entries(S.termosModelosDb).forEach(([id,m])=>out[id] = {...(out[id]||{}), ...m, id, padrao:!!out[id], alterado:!!out[id]});
  return Object.values(out).filter(m=>incluirOcultos || !m.oculto).sort((a,b)=>(a.ordem||999)-(b.ordem||999) || String(a.nome).localeCompare(String(b.nome),'pt-BR'));
}
function prontAbasHtml(p){
  const nA = S.anexos.filter(a=>a.categoria!=='termo').length, nT = S.termos.length + S.anexos.filter(a=>a.categoria==='termo').length;
  return `<div class="seg pront-abas">${[['evolucao','Odontograma e evolução',''],['imagens','Imagens e exames',nA],['termos','Termos e assinaturas',nT]].map(([k,l,n])=>`<button class="${S.prontAba===k?'on':''}" data-prontaba="${k}">${l}${n?` <span class="cnt2">${n}</span>`:''}</button>`).join('')}</div>`;
}
/* ---------- imagens e exames ---------- */
function anxThumb(a){
  return `<div class="anx" data-anxver="${esc(a.id)}" title="${esc(a.titulo||ANX_CAT[a.categoria]||'')}">
    <div class="anx-img">${a.thumb?`<img src="${a.thumb}" alt="">`:`<div class="anx-pdf">PDF</div>`}</div>
    <div class="anx-t">${esc(a.titulo || ANX_CAT[a.categoria] || 'Anexo')}</div>
    <div class="anx-m">${fmtData(a.data)}${a.dente?' · '+esc(a.dente):''}</div></div>`;
}
function renderImagensPac(p){
  const lista = S.anexos.filter(a=>a.categoria!=='termo' && (!S.anxFiltro || a.categoria===S.anxFiltro)).sort((a,b)=>String(b.data+b.criadoEm).localeCompare(String(a.data+a.criadoEm)));
  const cats = [...new Set(S.anexos.filter(a=>a.categoria!=='termo').map(a=>a.categoria))];
  return `<div class="card"><div class="hd"><h3>Imagens e exames</h3><div class="tools">
      <label class="btn primary">${ICON.plus}Anexar arquivos<input type="file" id="anxFile" accept="image/*,application/pdf" multiple hidden></label>
      <label class="btn">📷 Tirar foto<input type="file" id="anxCam" accept="image/*" capture="environment" hidden></label></div></div>
    <div class="bd">
      ${cats.length>1?`<div class="chips"><button class="${!S.anxFiltro?'on':''}" data-anxfiltro="">Todos</button>${cats.map(c=>`<button class="${S.anxFiltro===c?'on':''}" data-anxfiltro="${c}">${esc(ANX_CAT[c]||c)}</button>`).join('')}</div>`:''}
      ${lista.length?`<div class="anx-grid">${lista.map(anxThumb).join('')}</div>`:`<div class="empty" style="padding:30px 10px">Nenhuma imagem ainda. Anexe fotos, radiografias, tomografias e laudos (imagens ou PDF).<br><span style="font-size:12px">No tablet ou celular, “Tirar foto” abre a câmera.</span></div>`}
    </div></div>`;
}
function lerArquivo(file, comoDataURL){
  return new Promise((ok,err)=>{ const r = new FileReader(); r.onload = ()=>ok(r.result); r.onerror = ()=>err(r.error); comoDataURL ? r.readAsDataURL(file) : r.readAsArrayBuffer(file); });
}
async function carregarImagem(src){ return new Promise((ok,err)=>{ const i = new Image(); i.onload=()=>ok(i); i.onerror=err; i.src=src; }); }
function canvasJPEG(img, max, q){
  const k = Math.min(1, max/Math.max(img.naturalWidth||img.width, img.naturalHeight||img.height));
  const c = document.createElement('canvas'); c.width = Math.round((img.naturalWidth||img.width)*k); c.height = Math.round((img.naturalHeight||img.height)*k);
  const x = c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); x.drawImage(img,0,0,c.width,c.height);
  return {url:c.toDataURL('image/jpeg', q), w:c.width, h:c.height};
}
async function prepararArquivo(file){
  if(file.type==='application/pdf'){
    if(file.size > ANX_MAX_PDF) throw new Error(`“${file.name}” tem ${(file.size/1048576).toFixed(1)} MB — o limite para PDF é 6 MB.`);
    const url = await lerArquivo(file, true);
    return { mime:'application/pdf', dados:url, thumb:'', w:0, h:0, bytes:file.size };
  }
  if(!/^image\//.test(file.type)) throw new Error(`“${file.name}” não é imagem nem PDF.`);
  const src = await lerArquivo(file, true);
  const img = await carregarImagem(src);
  let full = canvasJPEG(img, 2400, .88);
  if(full.url.length > ANX_CHUNK*4) full = canvasJPEG(img, 1800, .8);
  const th = canvasJPEG(img, 320, .7);
  return { mime:'image/jpeg', dados:full.url, thumb:th.url, w:full.w, h:full.h, bytes:Math.round(full.url.length*.75) };
}
function anexarArquivos(files, pid, categoriaInicial){
  files = [...files]; if(!files.length) return;
  const p = S.pacientes.find(x=>x.id===pid); if(!p) return;
  const termo = categoriaInicial==='termo';
  const m = openModal(termo?'Anexar termo assinado':'Anexar '+(files.length>1?files.length+' arquivos':'arquivo'), `
    <div class="anx-prev">${files.map(f=>`<div class="ap">${/^image\//.test(f.type)?`<img data-prev="${esc(f.name)}" alt="">`:'<div class="anx-pdf">PDF</div>'}<span>${esc(f.name)}</span></div>`).join('')}</div>
    <form id="fAnx" class="fg" autocomplete="off">
      <label class="f">Tipo<select name="categoria">${Object.entries(ANX_CAT).map(([k,l])=>`<option value="${k}" ${k===(categoriaInicial||'intraoral')?'selected':''}>${l}</option>`).join('')}</select></label>
      <label class="f">Data<input type="date" name="data" value="${todayISO()}" required></label>
      <label class="f">${termo?'Nome do termo':'Título (opcional)'}<input name="titulo" ${termo?'required placeholder="Ex.: Termo de consentimento — exodontia"':'placeholder="Ex.: Inicial, pós-operatório…"'}></label>
      <label class="f">Dente / região (opcional)<input name="dente" placeholder="Ex.: 36 ou arcada superior"></label>
      <label class="f full">Observações (opcional)<textarea name="obs" style="min-height:52px"></textarea></label>
    </form>
    <div id="anxProg" class="anx-prog"></div>`,
    `<div class="r"><button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Salvar no prontuário</button></div>`);
  files.forEach(f=>{ if(/^image\//.test(f.type)){ const u = URL.createObjectURL(f); const el = [...m.querySelectorAll('img[data-prev]')].find(i=>i.dataset.prev===f.name && !i.src); if(el){ el.src = u; el.onload=()=>URL.revokeObjectURL(u); } } });
  m.querySelector('[data-save]').onclick = async()=>{
    const f = m.querySelector('#fAnx'); if(!f.reportValidity()) return;
    const o = formData(f);
    const btn = m.querySelector('[data-save]'); btn.disabled = true; m.querySelector('[data-close]').disabled = true;
    const prog = m.querySelector('#anxProg');
    let ok = 0, erros = [];
    for(let i=0; i<files.length; i++){
      prog.textContent = `Enviando ${i+1} de ${files.length}… não feche esta janela.`;
      try{
        const a = await prepararArquivo(files[i]);
        const ref = COL.anexos().doc();
        const partes = Math.ceil(a.dados.length / ANX_CHUNK);
        let falhou = false;
        for(let k=0; k<partes; k++){
          if(!await write('clinica', COL.anexosBin().doc(ref.id+'_'+k), {anexoId:ref.id, pacienteId:pid, i:k, d:a.dados.slice(k*ANX_CHUNK,(k+1)*ANX_CHUNK)})){ falhou = true; break; }
        }
        if(falhou){ erros.push(files[i].name); continue; }
        const meta = { pacienteId:pid, paciente:p.nome, categoria:o.categoria, data:o.data, titulo:(o.titulo||'') + (files.length>1 && o.titulo?` (${i+1})`:''), dente:o.dente||'', obs:o.obs||'',
          nome:files[i].name, mime:a.mime, w:a.w, h:a.h, bytes:a.bytes, partes, thumb:a.thumb, criadoPor:S.email, criadoEm:new Date().toISOString() };
        if(await write('clinica', ref, meta)) ok++; else erros.push(files[i].name);
      }catch(e){ erros.push(e && e.message ? e.message : files[i].name); }
    }
    closeModal();
    toast(erros.length ? `${ok} enviado(s). Não foi possível enviar: ${erros.join('; ')}` : `${ok} arquivo(s) salvo(s) no prontuário.`);
  };
}
async function anexoDados(a){
  if(S.anxCache && S.anxCache[a.id]) return S.anxCache[a.id];
  const partes = [];
  for(let k=0; k<(a.partes||1); k++){ const d = await COL.anexosBin().doc(a.id+'_'+k).get(); if(!d.exists) throw new Error('parte '+k+' ausente'); partes.push(d.data().d); }
  const url = partes.join('');
  S.anxCache = S.anxCache || {}; S.anxCache[a.id] = url;
  return url;
}
function dataURLparaBlob(u){ const [h,b] = u.split(','); const mime = h.match(/:(.*?);/)[1]; const bin = atob(b); const arr = new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i); return new Blob([arr],{type:mime}); }
async function verAnexo(id){
  const a = S.anexos.find(x=>x.id===id); if(!a) return;
  const irmaos = S.anexos.filter(x=>x.categoria===a.categoria || (a.categoria!=='termo' && x.categoria!=='termo' && !S.anxFiltro)).sort((x,y)=>String(y.data+y.criadoEm).localeCompare(String(x.data+x.criadoEm)));
  const ix = irmaos.findIndex(x=>x.id===id);
  const m = openModal(a.titulo || ANX_CAT[a.categoria] || 'Anexo', `<div class="viewer" id="anxView"><div class="empty">Carregando…</div></div>
    <div class="vw-info"><b>${esc(ANX_CAT[a.categoria]||'')}</b> · ${fmtData(a.data)}${a.dente?' · Dente/região: '+esc(a.dente):''}${a.obs?`<div>${esc(a.obs)}</div>`:''}<div class="m">Enviado por ${esc(a.criadoPor||'')} em ${fmtDataHora(a.criadoEm)}</div></div>`,
    `${irmaos.length>1?`<div class="vw-nav"><button class="btn sm" data-anxver="${esc(irmaos[(ix-1+irmaos.length)%irmaos.length].id)}">‹</button><span>${ix+1}/${irmaos.length}</span><button class="btn sm" data-anxver="${esc(irmaos[(ix+1)%irmaos.length].id)}">›</button></div>`:''}
     ${S.isAdmin?`<button class="btn danger" data-anxdel="${esc(a.id)}">Excluir</button>`:''}<div class="r"><button class="btn" data-anxbaixar="${esc(a.id)}">Baixar</button><button class="btn" data-close>Fechar</button></div>`);
  m.querySelector('.mbox').classList.add('wide');
  try{
    const url = await anexoDados(a);
    const box = m.querySelector('#anxView'); if(!box) return;
    if(a.mime==='application/pdf'){ const bu = URL.createObjectURL(dataURLparaBlob(url)); box.innerHTML = `<iframe src="${bu}" title="PDF"></iframe><a class="btn sm" href="${bu}" target="_blank" rel="noopener" style="margin-top:8px">Abrir PDF em nova aba</a>`; return; }
    box.innerHTML = `<div class="vw-img"><img id="vwImg" src="${url}" alt=""></div>
      <div class="vw-ctl"><label>Brilho <input type="range" min="50" max="200" value="100" data-vw="b"></label><label>Contraste <input type="range" min="50" max="250" value="100" data-vw="c"></label>
        <label class="chk" style="margin:0"><input type="checkbox" data-vw="i"> Inverter</label><button class="btn sm" data-vwzoom>Tamanho real</button><button class="btn sm ghost" data-vwreset>Restaurar</button></div>`;
    const img = box.querySelector('#vwImg');
    const ap = ()=>{ const b=box.querySelector('[data-vw=b]').value, c=box.querySelector('[data-vw=c]').value, i=box.querySelector('[data-vw=i]').checked; img.style.filter = `brightness(${b}%) contrast(${c}%)${i?' invert(1)':''}`; };
    box.querySelectorAll('[data-vw]').forEach(el=>el.addEventListener('input', ap));
    box.querySelector('[data-vwzoom]').onclick = e=>{ box.querySelector('.vw-img').classList.toggle('real'); e.target.textContent = box.querySelector('.vw-img').classList.contains('real') ? 'Ajustar à tela' : 'Tamanho real'; };
    box.querySelector('[data-vwreset]').onclick = ()=>{ box.querySelector('[data-vw=b]').value=100; box.querySelector('[data-vw=c]').value=100; box.querySelector('[data-vw=i]').checked=false; ap(); };
  }catch(e){ const box = m.querySelector('#anxView'); if(box) box.innerHTML = `<div class="empty">Não foi possível carregar o arquivo. Verifique a internet e tente de novo.</div>`; }
}
async function baixarAnexo(id){
  const a = S.anexos.find(x=>x.id===id); if(!a) return;
  try{ const url = await anexoDados(a); const ext = a.mime==='application/pdf'?'pdf':'jpg';
    const nome = `${slug(a.paciente)}-${slug(ANX_CAT[a.categoria]||'anexo')}-${a.data}.${ext}`;
    const bu = URL.createObjectURL(dataURLparaBlob(url)); const l = document.createElement('a'); l.href = bu; l.download = nome; document.body.appendChild(l); l.click(); setTimeout(()=>{URL.revokeObjectURL(bu); l.remove();}, 1500);
  }catch(_){ toast('Não foi possível baixar o arquivo.'); }
}
async function excluirAnexo(id){
  const a = S.anexos.find(x=>x.id===id); if(!a) return;
  if(!await confirmBox(`Excluir “${a.titulo || ANX_CAT[a.categoria]}” de ${fmtData(a.data)}? O arquivo será apagado do prontuário.`)) return;
  if(!await write('clinica', COL.anexos().doc(a.id), null)) return;
  for(let k=0; k<(a.partes||1); k++) await write('clinica', COL.anexosBin().doc(a.id+'_'+k), null);
  if(S.anxCache) delete S.anxCache[a.id];
  toast('Arquivo excluído.');
}
/* ---------- termos e assinatura ---------- */
function renderTermosPac(p){
  const assinados = S.termos.map(t=>({...t, _tipo:'dig', _ord:t.assinadoEm||t.criadoEm}));
  const papel = S.anexos.filter(a=>a.categoria==='termo').map(a=>({...a, _tipo:'papel', _ord:(a.data||'')+'T'+(a.criadoEm||'')}));
  const lista = assinados.concat(papel).sort((a,b)=>String(b._ord).localeCompare(String(a._ord)));
  return `<div class="card"><div class="hd"><h3>Termos de consentimento e documentos assinados</h3><div class="tools">
      <button class="btn primary" data-termonovo>✍ Novo termo para assinar</button>
      <label class="btn">${ICON.plus}Anexar termo em papel<input type="file" id="termoFile" accept="image/*,application/pdf" multiple hidden></label>
      ${S.isAdmin?`<button class="btn ghost" data-termomodelos>Modelos de termo</button>`:''}</div></div>
    <div class="bd">${lista.length ? lista.map(t => t._tipo==='dig' ? `
      <div class="termo"><div class="termo-ic ok">✍</div><div class="termo-b"><b>${esc(t.titulo)}</b>
        <div class="m">Assinado no tablet por <b>${esc(t.assinante||'')}</b>${t.relacao&&t.relacao!=='Paciente'?' ('+esc(t.relacao)+')':''} em ${fmtDataHora(t.assinadoEm)} · código ${esc(String(t.hash||'').slice(0,12).toUpperCase())}</div></div>
        <div class="termo-a"><button class="btn sm" data-termover="${esc(t.id)}">Ver / imprimir</button>${S.isAdmin?`<button class="btn sm ghost danger" data-termodel="${esc(t.id)}" title="Excluir">${ICON.trash}</button>`:''}</div></div>` : `
      <div class="termo"><div class="termo-ic">${t.thumb?`<img src="${t.thumb}" alt="">`:'PDF'}</div><div class="termo-b"><b>${esc(t.titulo||'Termo assinado')}</b>
        <div class="m">Termo em papel digitalizado · ${fmtData(t.data)} · enviado por ${esc(t.criadoPor||'')}</div></div>
        <div class="termo-a"><button class="btn sm" data-anxver="${esc(t.id)}">Ver</button></div></div>`).join('')
      : `<div class="empty" style="padding:30px 10px">Nenhum termo ainda.<br><span style="font-size:12px">Use <b>Novo termo para assinar</b> para o paciente assinar no tablet, ou <b>Anexar termo em papel</b> para guardar a foto/PDF de um termo assinado à mão.</span></div>`}
    </div></div>`;
}
/* Campos automáticos dos modelos: dados do paciente (cadastro), da dentista e da clínica.
   O que não estiver cadastrado vira uma lacuna "____" para completar à mão ou editar. */
function camposDocumento(p, o){
  p = p || {}; o = o || {};
  const lac = n => '_'.repeat(n||12);
  const resp = o.relacao && o.relacao!=='Paciente' && o.assinante;
  return {
    paciente: p.nome || lac(), cpf: p.cpf || '___.___.___-__', nascimento: p.nascimento ? fmtData(p.nascimento) : '___/___/______',
    idade: idade(p.nascimento) || lac(3), endereco: p.endereco || lac(30), telefone: p.telefone || lac(14), email: p.email || lac(16),
    convenio: p.convenio || 'Particular',
    procedimento: o.procedimento || lac(), dentes: o.dentes || lac(4), dente: o.dente || o.dentes || lac(4),
    assinante: o.assinante || p.nome || lac(), assinante_cpf: o.doc || (resp ? '___.___.___-__' : (p.cpf || '___.___.___-__')),
    representacao: resp ? `, neste ato representado(a) por seu(sua) responsável legal ${o.assinante}${o.doc?', CPF '+o.doc:''}` : '',
    clinica: CLINICA.nome || 'clínica', endereco_clinica: CLINICA.endereco || lac(30), telefone_clinica: CLINICA.telefone || lac(14),
    dentista: CLINICA.dentista || lac(), cro: CLINICA.cro || lac(6), cidade: CLINICA.cidade || lac(),
    data: fmtData(o.data || todayISO()), data_extenso: dataExtenso(o.data || todayISO())
  };
}
const CAMPOS_AJUDA = '<code>{{paciente}}</code> <code>{{cpf}}</code> <code>{{nascimento}}</code> <code>{{idade}}</code> <code>{{endereco}}</code> <code>{{telefone}}</code> <code>{{email}}</code> <code>{{convenio}}</code> <code>{{procedimento}}</code> <code>{{dentes}}</code> <code>{{assinante}}</code> <code>{{assinante_cpf}}</code> <code>{{representacao}}</code> <code>{{dentista}}</code> <code>{{cro}}</code> <code>{{clinica}}</code> <code>{{endereco_clinica}}</code> <code>{{telefone_clinica}}</code> <code>{{cidade}}</code> <code>{{data}}</code> <code>{{data_extenso}}</code>';
function preencherTermo(txt, p, o){
  const v = camposDocumento(p, o);
  return String(txt||'').replace(/\{\{(\w+)\}\}/g, (m,k)=> k in v ? v[k] : m);
}
function novoTermo(pid){
  const p = S.pacientes.find(x=>x.id===pid); if(!p) return;
  const mods = listaTermosModelos();
  const menor = (()=>{ const n = parseISO(p.nascimento||''); if(!p.nascimento || isNaN(n)) return false; const d=new Date(); let a=d.getFullYear()-n.getFullYear(); if(d<new Date(d.getFullYear(), n.getMonth(), n.getDate())) a--; return a<18; })();
  const m = openModal('Novo termo para assinar', `<form id="fTermo" class="fg" autocomplete="off">
      <label class="f full">Modelo<select name="modelo">${mods.map(x=>`<option value="${esc(x.id)}">${esc(x.nome)}</option>`).join('')}<option value="">— Texto livre —</option></select></label>
      <label class="f">Procedimento(s)<input name="procedimento" placeholder="Ex.: Exodontia do 38"></label>
      <label class="f">Dente(s) / região<input name="dentes" placeholder="Ex.: 38"></label>
      <label class="f full">Texto do termo <span style="font-weight:500;color:var(--muted)">(já preenchido com os dados do paciente e da Dra. — pode editar livremente)</span><textarea name="texto" id="termoTexto" style="min-height:300px;font-size:13px;line-height:1.5"></textarea></label>
      <div class="full" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12px;color:var(--muted);margin-top:-6px"><span id="termoAuto">✓ Atualiza sozinho ao mudar procedimento, dentes ou quem assina. Ao editar o texto, suas alterações são mantidas.</span><button type="button" class="btn sm ghost" id="termoRefazer">Refazer a partir do modelo</button>${!p.cpf||!p.endereco||!p.nascimento?`<span style="color:#b45309">Cadastro incompleto (${[!p.cpf&&'CPF',!p.nascimento&&'nascimento',!p.endereco&&'endereço'].filter(Boolean).join(', ')}): esses campos saem em branco “____”.</span>`:''}</div>
      <label class="f">Quem vai assinar<select name="relacao"><option ${menor?'':'selected'}>Paciente</option><option ${menor?'selected':''}>Responsável legal</option></select></label>
      <label class="f">Nome de quem assina<input name="assinante" required value="${esc(menor?'':p.nome)}"></label>
      <label class="f">CPF de quem assina<input name="doc" value="${esc(menor?'':(p.cpf||''))}" placeholder="Opcional, recomendado"></label>
      <label class="chk full" style="margin-top:4px"><input type="checkbox" name="prof" checked> Depois do paciente, coletar também a assinatura do(a) profissional</label>
      ${menor?`<div class="note full" style="margin:0">Paciente menor de idade: quem assina é o responsável legal.</div>`:''}
    </form>`, `<div class="r"><button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Coletar assinatura ✍</button></div>`);
  m.querySelector('.mbox').classList.add('wide');
  const f = m.querySelector('#fTermo');
  const dadosForm = ()=>({procedimento:f.procedimento.value, dentes:f.dentes.value, relacao:f.relacao.value, assinante:f.assinante.value, doc:f.doc.value});
  const atualizar = ()=>{ const md = mods.find(x=>x.id===f.modelo.value); f.texto.value = md ? preencherTermo(md.texto, p, dadosForm()) : (f.texto.value && !f.texto.dataset.auto ? f.texto.value : ''); f.texto.dataset.auto = md?'1':''; m.querySelector('#termoAuto').style.display = md && f.texto.dataset.auto==='1' ? '' : 'none'; };
  f.modelo.addEventListener('change', atualizar);
  ['procedimento','dentes','assinante','doc'].forEach(n=>f[n].addEventListener('input', ()=>{ if(f.texto.dataset.auto==='1') atualizar(); }));
  m.querySelector('#termoRefazer').onclick = ()=>{ if(f.texto.dataset.auto!=='1' && !window.confirm('Refazer o texto a partir do modelo? As edições feitas à mão serão perdidas.')) return; f.texto.dataset.auto='1'; atualizar(); };
  f.texto.addEventListener('input', ()=>{ f.texto.dataset.auto = ''; m.querySelector('#termoAuto').style.display='none'; });
  f.relacao.addEventListener('change', ()=>{ if(f.relacao.value==='Paciente'){ f.assinante.value = p.nome; f.doc.value = p.cpf||''; } else { f.assinante.value=''; f.doc.value=''; f.assinante.focus(); } if(f.texto.dataset.auto==='1') atualizar(); });
  atualizar();
  m.querySelector('[data-save]').onclick = async()=>{
    if(!f.reportValidity()) return;
    const o = formData(f); o.prof = f.prof.checked;
    if(!String(o.texto||'').trim()) return toast('O termo está sem texto.');
    const md = mods.find(x=>x.id===o.modelo);
    const titulo = md ? md.nome : (String(o.texto).trim().split('\n')[0].slice(0,80) || 'Termo');
    closeModal();
    const ass = await coletarAssinatura({ titulo, texto:o.texto, nome:o.assinante, papel:o.relacao==='Paciente'?'Paciente':'Responsável legal' });
    if(!ass) return toast('Assinatura cancelada. Nada foi salvo.');
    let assProf = null;
    if(o.prof) assProf = await coletarAssinatura({ titulo, texto:'', nome:CLINICA.dentista||'Profissional', papel:'Profissional', pular:true });
    const assinadoEm = new Date().toISOString();
    const base = { pacienteId:pid, paciente:p.nome, modelo:o.modelo||'', titulo, texto:o.texto, relacao:o.relacao, assinante:o.assinante, doc:o.doc||'', assinadoEm };
    const hash = await sha256(JSON.stringify(base) + '|' + ass);
    const doc = { ...base, assinatura:ass, assinaturaProf:assProf||'', profissional:assProf?(CLINICA.dentista||''):'', hash, coletadoPor:S.email, dispositivo:navigator.userAgent.slice(0,160), criadoEm:assinadoEm };
    const ref = COL.termos().doc();
    if(await write('clinica', ref, doc)){ toast('Termo assinado e salvo no prontuário.'); verTermo(ref.id, {...doc, id:ref.id}); }
  };
}
async function sha256(txt){ const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''); }
/* Quadro de assinatura em tela cheia (dedo ou caneta). Resolve com a imagem PNG ou null. */
function coletarAssinatura({titulo, texto, nome, papel, pular}){
  return new Promise(resolve=>{
    const ov = document.createElement('div'); ov.className = 'sig-ov';
    ov.innerHTML = `<div class="sig-box">
      <div class="sig-hd"><div><b>${esc(titulo)}</b><div class="m">Assinatura: ${esc(papel)} — ${esc(nome)}</div></div><button class="btn ghost" data-sx>Cancelar</button></div>
      ${texto?`<div class="sig-txt">${esc(texto)}</div><label class="chk sig-li"><input type="checkbox" id="sigLi"> Li e estou de acordo com o termo acima</label>`:''}
      <div class="sig-area"><canvas></canvas><div class="sig-linha"></div><div class="sig-ph">Assine aqui com o dedo ou a caneta</div></div>
      <div class="sig-ft"><span class="m">${esc(nome)}</span><div class="r">${pular?'<button class="btn" data-sp>Pular</button>':''}<button class="btn" data-sl>Limpar</button><button class="btn primary" data-sok disabled>Confirmar assinatura</button></div></div>
    </div>`;
    document.body.appendChild(ov); document.body.classList.add('sig-on');
    const cv = ov.querySelector('canvas'), area = ov.querySelector('.sig-area'), ok = ov.querySelector('[data-sok]'), li = ov.querySelector('#sigLi');
    const ctx = cv.getContext('2d'); let tracos = 0, desenhando = false, ult = null;
    const dim = ()=>{ const r = area.getBoundingClientRect(), dpr = window.devicePixelRatio||1; const img = tracos ? cv.toDataURL() : null;
      cv.width = r.width*dpr; cv.height = r.height*dpr; cv.style.width = r.width+'px'; cv.style.height = r.height+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='#0b1f4d';
      if(img){ const i=new Image(); i.onload=()=>ctx.drawImage(i,0,0,r.width,r.height); i.src=img; } };
    dim(); window.addEventListener('resize', dim);
    const pos = e=>{ const r = cv.getBoundingClientRect(); return {x:e.clientX-r.left, y:e.clientY-r.top, p:e.pressure||.5}; };
    const pode = ()=>{ ok.disabled = !(tracos>0 && (!li || li.checked)); };
    li && li.addEventListener('change', pode);
    cv.addEventListener('pointerdown', e=>{ e.preventDefault(); cv.setPointerCapture(e.pointerId); desenhando = true; ult = pos(e); ov.querySelector('.sig-ph').style.display='none'; ctx.beginPath(); ctx.arc(ult.x, ult.y, 1.2, 0, Math.PI*2); ctx.fillStyle='#0b1f4d'; ctx.fill(); });
    cv.addEventListener('pointermove', e=>{ if(!desenhando) return; e.preventDefault(); const pt = pos(e);
      ctx.lineWidth = e.pointerType==='pen' ? 1.2+pt.p*2.6 : 2.6; ctx.beginPath(); ctx.moveTo(ult.x, ult.y);
      const mx=(ult.x+pt.x)/2, my=(ult.y+pt.y)/2; ctx.quadraticCurveTo(ult.x, ult.y, mx, my); ctx.lineTo(pt.x, pt.y); ctx.stroke(); ult = pt; });
    const fim = ()=>{ if(desenhando){ desenhando=false; tracos++; pode(); } };
    cv.addEventListener('pointerup', fim); cv.addEventListener('pointercancel', fim); cv.addEventListener('pointerleave', fim);
    const fechar = v=>{ window.removeEventListener('resize', dim); ov.remove(); document.body.classList.remove('sig-on'); resolve(v); };
    ov.querySelector('[data-sx]').onclick = ()=>fechar(null);
    ov.querySelector('[data-sp]') && (ov.querySelector('[data-sp]').onclick = ()=>fechar(null));
    ov.querySelector('[data-sl]').onclick = ()=>{ ctx.clearRect(0,0,cv.width,cv.height); tracos=0; pode(); ov.querySelector('.sig-ph').style.display=''; };
    ok.onclick = ()=>{
      // recorta as bordas em branco e devolve PNG transparente
      const w=cv.width, h=cv.height, d=ctx.getImageData(0,0,w,h).data; let x0=w,y0=h,x1=0,y1=0;
      for(let y=0;y<h;y+=2) for(let x=0;x<w;x+=2){ if(d[(y*w+x)*4+3]>10){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; } }
      const pad=12; x0=Math.max(0,x0-pad); y0=Math.max(0,y0-pad); x1=Math.min(w,x1+pad); y1=Math.min(h,y1+pad);
      const k = Math.min(1, 900/(x1-x0)); const o = document.createElement('canvas'); o.width=Math.max(1,Math.round((x1-x0)*k)); o.height=Math.max(1,Math.round((y1-y0)*k));
      o.getContext('2d').drawImage(cv, x0,y0,x1-x0,y1-y0, 0,0,o.width,o.height);
      fechar(o.toDataURL('image/png'));
    };
  });
}
function verTermo(id, dado){
  const t = dado || S.termos.find(x=>x.id===id); if(!t) return;
  const m = openModal(t.titulo, `<div class="termo-doc">${termoHtml(t)}</div>`,
    `<div class="r"><button class="btn" data-close>Fechar</button><button class="btn primary" data-termoprint="${esc(t.id)}">Imprimir / PDF</button></div>`);
  m.querySelector('.mbox').classList.add('wide');
  m.querySelector('[data-termoprint]').onclick = ()=>imprimirTermo(t);
}
function termoHtml(t){
  return `<div class="td-texto">${esc(t.texto)}</div>
    <div class="td-ass">
      <div><img src="${t.assinatura}" alt="Assinatura"><div class="pa-linha"></div><b>${esc(t.assinante)}</b><br>${esc(t.relacao||'Paciente')}${t.doc?' · CPF '+esc(t.doc):''}${t.relacao&&t.relacao!=='Paciente'?'<br>Paciente: '+esc(t.paciente):''}</div>
      <div>${t.assinaturaProf?`<img src="${t.assinaturaProf}" alt="Assinatura do profissional">`:'<div style="height:70px"></div>'}<div class="pa-linha"></div><b>${esc(t.profissional||CLINICA.dentista||'Profissional')}</b><br>${CLINICA.cro?'CRO '+esc(CLINICA.cro):'Cirurgião(ã)-dentista'}</div>
    </div>
    <div class="td-reg">Documento assinado eletronicamente em ${fmtDataHora(t.assinadoEm)} por ${esc(t.assinante)}${t.doc?' (CPF '+esc(t.doc)+')':''}, coletado por ${esc(t.coletadoPor||'')} no sistema OdontoGest. Código de verificação (SHA-256): ${esc(String(t.hash||'').toUpperCase())}</div>`;
}
function imprimirTermo(t){
  let area = document.getElementById('printArea');
  if(!area){ area = document.createElement('div'); area.id = 'printArea'; document.body.appendChild(area); }
  const contato = contatoCabecalho();
  area.innerHTML = `<div class="pa-head"><div class="pa-nome">${esc(CLINICA.nome||'Clínica Odontológica')}</div>${contato?`<div class="pa-ct">${esc(contato)}</div>`:''}</div><div class="termo-doc">${termoHtml(t)}</div>`;
  document.body.classList.add('print-termo');
  setTimeout(()=>{ imprimirArea(); setTimeout(()=>document.body.classList.remove('print-termo'), 500); }, 80);
}
async function excluirTermo(id){
  const t = S.termos.find(x=>x.id===id); if(!t) return;
  if(!await confirmBox(`Excluir o termo “${t.titulo}” assinado por ${t.assinante} em ${fmtDataHora(t.assinadoEm)}? Essa ação não pode ser desfeita.`)) return;
  if(await write('clinica', COL.termos().doc(id), null)) toast('Termo excluído.');
}
function abrirTermosModelos(){
  const l = listaTermosModelos(true);
  const m = openModal('Modelos de termo', `<p style="margin:0 0 10px;color:var(--muted);font-size:13px;line-height:1.5">Os modelos que vêm no sistema são um ponto de partida — revise o texto com a responsável técnica. Ao gerar o termo, estes campos são trocados pelos dados do paciente, da Dra. e da clínica: ${CAMPOS_AJUDA}.</p>
    <div class="parc-l">${l.map(x=>`<div class="parc" style="cursor:default"><span class="pd"><b>${esc(x.nome)}</b><small>${x.oculto?'Oculto':x.alterado?'Editado pela clínica':x.padrao?'Modelo do sistema':'Criado pela clínica'}</small></span><button class="btn sm" data-tmedit="${esc(x.id)}">Editar</button><button class="btn sm ghost" data-tmoc="${esc(x.id)}">${x.oculto?'Mostrar':'Ocultar'}</button></div>`).join('')}</div>`,
    `<button class="btn" data-tmnovo>${ICON.plus}Novo modelo</button><div class="r"><button class="btn" data-close>Fechar</button></div>`);
  m.querySelector('[data-tmnovo]').onclick = ()=>editarTermoModelo(null);
  m.querySelectorAll('[data-tmedit]').forEach(b=>b.onclick=()=>editarTermoModelo(b.dataset.tmedit));
  m.querySelectorAll('[data-tmoc]').forEach(b=>b.onclick=async()=>{ const x = l.find(y=>y.id===b.dataset.tmoc); const atual = S.termosModelosDb[x.id]||{};
    if(await write('clinica', COL.termosModelos().doc(x.id), {...atual, ...(x.padrao?{}:{nome:x.nome, texto:x.texto, ordem:x.ordem||99}), oculto:!x.oculto})){ S.termosModelosDb[x.id] = {...atual, oculto:!x.oculto}; abrirTermosModelos(); } });
}
function editarTermoModelo(id){
  const x = id ? listaTermosModelos(true).find(y=>y.id===id) : {nome:'', texto:'', ordem:99};
  const m = openModal(id?'Editar modelo de termo':'Novo modelo de termo', `<form id="fTM" class="fg"><label class="f full">Nome<input name="nome" required value="${esc(x.nome)}"></label>
    <label class="f full">Texto<textarea name="texto" required style="min-height:340px;font-size:13px;line-height:1.5">${esc(x.texto)}</textarea></label></form>`,
    `${id && x.padrao && x.alterado?'<button class="btn ghost" data-tmrest>Voltar ao texto original</button>':''}<div class="r"><button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Salvar</button></div>`);
  m.querySelector('.mbox').classList.add('wide');
  m.querySelector('[data-save]').onclick = async()=>{ const f = m.querySelector('#fTM'); if(!f.reportValidity()) return; const o = formData(f);
    const tid = id || ('tc'+Date.now().toString(36)); const doc = {...(S.termosModelosDb[tid]||{}), nome:o.nome, texto:o.texto, ordem:x.ordem||99, oculto:!!x.oculto};
    if(await write('clinica', COL.termosModelos().doc(tid), doc)){ S.termosModelosDb[tid] = doc; toast('Modelo salvo.'); abrirTermosModelos(); } };
  m.querySelector('[data-tmrest]') && (m.querySelector('[data-tmrest]').onclick = async()=>{ if(await write('clinica', COL.termosModelos().doc(id), null)){ delete S.termosModelosDb[id]; toast('Modelo restaurado.'); abrirTermosModelos(); } });
}

/* ============ TAREFAS ============ */
const TAR_PRIO = { alta:'Alta', normal:'Normal', baixa:'Baixa' };
function tarStatus(t){ if(t.feita) return 'feita'; if(!t.prazo) return 'semprazo'; const h=todayISO(); return t.prazo<h?'atrasada':t.prazo===h?'hoje':'proxima'; }
function tarPendentes(){ return S.tarefas.filter(t=>!t.feita && (!t.prazo || t.prazo<=todayISO())).length; }
function fmtDataHora(s){ try{ return new Date(s).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}); }catch(_){ return ''; } }
function responsaveis(){
  const s = new Set();
  if(CLINICA.dentista) s.add(CLINICA.dentista);
  S.acessos.forEach(a=>{ if(a.nome && a.papel!=='sync' && a.ativo!==false) s.add(a.nome); });
  S.tarefas.forEach(t=>{ if(t.responsavel) s.add(t.responsavel); });
  s.add('Recepção');
  return [...s];
}
function tarItem(t){
  const st = tarStatus(t);
  const meta = [
    t.prazo ? `<span class="${st==='atrasada'?'atr':''}">${st==='hoje'?'Hoje':st==='atrasada'?'Venceu '+fmtData(t.prazo):'Prazo '+fmtData(t.prazo)}</span>` : '',
    t.responsavel ? 'Resp.: '+esc(t.responsavel) : '',
    t.paciente ? 'Paciente: '+esc(t.paciente) : '',
    t.feita && t.feitaPor ? 'Concluída por '+esc(t.feitaPor)+(t.feitaEm?' em '+fmtDataHora(t.feitaEm):'') : ''
  ].filter(Boolean).join(' · ');
  return `<div class="tar ${t.feita?'feita':''} p-${esc(t.prioridade||'normal')}">
    <button class="tar-chk" data-tarchk="${esc(t.id)}" title="${t.feita?'Reabrir tarefa':'Marcar como concluída'}" aria-label="${t.feita?'Reabrir':'Concluir'}">${t.feita?'<svg class="i" viewBox="0 0 24 24"><path d="M5 12.5 10 17l9-10"/></svg>':''}</button>
    <div class="tar-b" data-tared="${esc(t.id)}">
      <div class="tar-t">${t.prioridade==='alta'&&!t.feita?'<span class="tag alta">Urgente</span> ':''}${esc(t.titulo)}</div>
      ${t.descricao?`<div class="tar-d">${esc(t.descricao)}</div>`:''}
      ${meta?`<div class="tar-m">${meta}</div>`:''}
    </div></div>`;
}
function renderTarefas(){
  const f = S.tarFiltro, q = norm(S.tarBusca);
  const ordemP = {alta:0,normal:1,baixa:2};
  const lista = S.tarefas.filter(t => (f==='todas' || (f==='feitas') === !!t.feita)
      && (!S.tarResp || t.responsavel===S.tarResp)
      && (!q || norm([t.titulo,t.descricao,t.paciente,t.responsavel].join(' ')).includes(q)))
    .sort((a,b)=> String(a.prazo||'9999').localeCompare(String(b.prazo||'9999')) || (ordemP[a.prioridade]??1)-(ordemP[b.prioridade]??1) || String(a.criadoEm||'').localeCompare(String(b.criadoEm||'')));
  const feitas = lista.filter(t=>t.feita).sort((a,b)=>String(b.feitaEm||'').localeCompare(String(a.feitaEm||'')));
  const grupos = [['atrasada','Atrasadas'],['hoje','Para hoje'],['proxima','Próximas'],['semprazo','Sem prazo']];
  let html = grupos.map(([k,l])=>{ const it = lista.filter(t=>tarStatus(t)===k); return it.length ? `<div class="tar-g ${k}"><div class="tar-gh">${l}<span>${it.length}</span></div>${it.map(tarItem).join('')}</div>` : ''; }).join('');
  if(feitas.length) html += `<div class="tar-g feita"><div class="tar-gh">Concluídas<span>${feitas.length}</span></div>${feitas.slice(0, f==='feitas'?500:30).map(tarItem).join('')}</div>`;
  const abertas = S.tarefas.filter(t=>!t.feita), atr = abertas.filter(t=>tarStatus(t)==='atrasada').length, hj = abertas.filter(t=>tarStatus(t)==='hoje').length;
  const resp = responsaveis();
  $('#main').innerHTML = `
    <div class="ph"><div><h2>Tarefas</h2><div class="sub">Afazeres da equipe: ligações, retornos, pedidos de material, conferências</div></div>
      <div class="tools"><button class="btn primary" data-novatar>${ICON.plus}Nova tarefa</button></div></div>
    <div class="kpis">
      <div class="kpi"><div class="l">Em aberto</div><div class="v">${abertas.length}</div></div>
      <div class="kpi"><div class="l">Para hoje</div><div class="v">${hj}</div></div>
      <div class="kpi"><div class="l">Atrasadas</div><div class="v ${atr?'red':''}">${atr}</div></div>
    </div>
    <form class="tar-add" id="fTarRapida" autocomplete="off"><input class="inp" name="titulo" placeholder="Adicionar tarefa rápida e apertar Enter… (ex.: Ligar para confirmar consultas de amanhã)" maxlength="200"><button class="btn" type="submit">${ICON.plus}Adicionar</button></form>
    <div class="card"><div class="bd" style="padding:10px 12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;border-bottom:1px solid var(--line)">
        <div class="seg">${[['abertas','Em aberto'],['feitas','Concluídas'],['todas','Todas']].map(([k,l])=>`<button class="${f===k?'on':''}" data-tarfiltro="${k}">${l}</button>`).join('')}</div>
        <select class="inp" id="tarResp"><option value="">Todos os responsáveis</option>${resp.map(r=>`<option ${r===S.tarResp?'selected':''}>${esc(r)}</option>`).join('')}</select>
        <input class="inp" id="tarBusca" data-keep placeholder="Buscar" value="${esc(S.tarBusca)}" style="flex:1;min-width:150px">
      </div>
      <div class="bd" id="tarLista">${html || `<div class="empty">${f==='feitas'?'Nenhuma tarefa concluída.':'Nenhuma tarefa em aberto. 🎉'}</div>`}</div>
    </div>`;
}
function openTarefa(id){
  const t = id ? S.tarefas.find(x=>x.id===id) : {prioridade:'normal', prazo:todayISO()};
  if(id && !t) return;
  const resp = responsaveis();
  const body = `<form id="fTar" class="fg" autocomplete="off">
    <label class="f full">Tarefa<input name="titulo" required maxlength="200" value="${esc(t.titulo)}" placeholder="Ex.: Ligar para o laboratório sobre a prótese da Maria"></label>
    <label class="f full">Detalhes<textarea name="descricao" style="min-height:64px">${esc(t.descricao)}</textarea></label>
    <label class="f">Prazo<input type="date" name="prazo" value="${esc(t.prazo||'')}"></label>
    <label class="f">Prioridade<select name="prioridade">${Object.entries(TAR_PRIO).map(([k,l])=>`<option value="${k}" ${(t.prioridade||'normal')===k?'selected':''}>${l}</option>`).join('')}</select></label>
    <label class="f">Responsável<input name="responsavel" list="dlResp" value="${esc(t.responsavel||'')}" placeholder="Quem vai fazer"></label>
    <datalist id="dlResp">${resp.map(r=>`<option value="${esc(r)}">`).join('')}</datalist>
    <label class="f">Paciente (opcional)<input name="paciente" list="dlPacTar" value="${esc(t.paciente||'')}"></label>
    <datalist id="dlPacTar">${S.pacientes.map(p=>`<option value="${esc(p.nome)}">`).join('')}</datalist>
    ${t.criadoPor?`<div class="full" style="color:var(--muted);font-size:12px">Criada por ${esc(t.criadoPor)}${t.criadoEm?' em '+fmtDataHora(t.criadoEm):''}</div>`:''}
  </form>`;
  const m = openModal(id?'Editar tarefa':'Nova tarefa', body, `${id?'<button class="btn danger" data-del>Excluir</button>':''}<div class="r"><button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Salvar</button></div>`);
  const f = m.querySelector('#fTar');
  const salvar = async()=>{
    if(!f.reportValidity()) return;
    const o = formData(f);
    const pac = S.pacientes.find(p=>norm(p.nome)===norm(o.paciente));
    const agora = new Date().toISOString();
    const doc = {...(id?stripId(t):{criadoPor:S.email, criadoEm:agora, feita:false}), ...o, pacienteId: pac?pac.id:'', atualizadoPor:S.email, atualizadoEm:agora};
    closeModal();
    if(await write('clinica', id?COL.tarefas().doc(id):COL.tarefas().doc(), doc)) toast(id?'Tarefa atualizada.':'Tarefa criada.');
  };
  m.querySelector('[data-save]').onclick = salvar;
  f.addEventListener('submit', e=>{ e.preventDefault(); salvar(); });
  m.querySelector('[data-del]')?.addEventListener('click', async()=>{
    if(!await confirmBox(`Excluir a tarefa “${t.titulo}”?`)) return;
    if(await write('clinica', COL.tarefas().doc(id), null)) toast('Tarefa excluída.');
  });
  setTimeout(()=>f.titulo.focus(), 30);
}
async function tarAlternar(id){
  const t = S.tarefas.find(x=>x.id===id); if(!t) return;
  const feita = !t.feita, agora = new Date().toISOString();
  const doc = {...stripId(t), feita, feitaPor: feita?S.email:'', feitaEm: feita?agora:'', atualizadoPor:S.email, atualizadoEm:agora};
  S.tarefas = S.tarefas.map(x=>x.id===id?{...doc,id}:x); render();
  if(await write('clinica', COL.tarefas().doc(id), doc)) toast(feita?'Tarefa concluída.':'Tarefa reaberta.');
}
async function tarRapida(form){
  const titulo = (form.titulo.value||'').trim(); if(!titulo) return;
  const agora = new Date().toISOString();
  form.titulo.value = '';
  if(await write('clinica', COL.tarefas().doc(), {titulo, descricao:'', prazo:'', prioridade:'normal', responsavel:'', paciente:'', pacienteId:'', feita:false, criadoPor:S.email, criadoEm:agora, atualizadoPor:S.email, atualizadoEm:agora})) toast('Tarefa adicionada.');
}

/* ============ RECEITUÁRIO ============ */
const REC_DRAFT = 'odontogest-receita-rascunho';
const REC_TIPO = { simples:'Receita simples', antimicrobiano:'Antimicrobiano (2 vias)', controle:'Controle especial (2 vias)' };
const REC_USO = ['Uso oral','Uso tópico','Uso sublingual','Uso local (bochecho)','Uso externo'];
const recItem = () => ({ uso:'Uso oral', med:'', qtd:'', pos:'' });
const recNova = () => ({ id:null, pacienteId:'', paciente:'', endereco:'', data:todayISO(), tipo:'simples', itens:[recItem()], obs:'', registrar:true });
function recSalvarRascunho(){ try{ localStorage.setItem(REC_DRAFT, JSON.stringify(S.rec)); }catch(_){} }
function recCarregar(){ try{ const v=JSON.parse(localStorage.getItem(REC_DRAFT)||'null'); if(v && Array.isArray(v.itens)) return {...recNova(), ...v}; }catch(_){} return recNova(); }
S.rec = recCarregar();
function recPaciente(){ return S.pacientes.find(p=>norm(p.nome)===norm(S.rec.paciente)); }
function recItensHtml(){
  const r = S.rec;
  return r.itens.map((it,ix)=>`<div class="rx-ed">
      <div class="rx-n">${ix+1}</div>
      <div class="rx-c">
        <div class="rx-l1"><select class="inp" data-ri="${ix}" data-f="uso" id="ri-u-${ix}">${REC_USO.concat(REC_USO.includes(it.uso)?[]:[it.uso]).map(u=>`<option ${u===it.uso?'selected':''}>${esc(u)}</option>`).join('')}</select>
          <input class="inp" data-ri="${ix}" data-f="med" id="ri-m-${ix}" value="${esc(it.med)}" placeholder="Medicamento e concentração (ex.: Amoxicilina 500 mg cápsula)" style="flex:1;min-width:180px">
          <input class="inp" data-ri="${ix}" data-f="qtd" id="ri-q-${ix}" value="${esc(it.qtd)}" placeholder="Quantidade" style="width:130px"></div>
        <textarea class="inp" data-ri="${ix}" data-f="pos" id="ri-p-${ix}" placeholder="Posologia (ex.: tomar 1 cápsula de 8 em 8 horas por 7 dias)">${esc(it.pos)}</textarea>
      </div>
      <div class="rx-a"><button class="btn sm ghost" data-recfav="${ix}" title="Salvar nos favoritos">★</button>${r.itens.length>1?`<button class="btn sm ghost" data-recrm="${ix}" title="Remover">${ICON.x}</button>`:''}</div>
    </div>`).join('');
}
function favRows(){
  const q = norm(S.favBusca);
  const l = S.favMed.filter(f=>!q || norm(f.med+' '+f.pos).includes(q)).sort((a,b)=>String(a.med).localeCompare(String(b.med),'pt-BR'));
  if(!S.favMed.length) return `<div class="empty" style="padding:14px 6px">Nenhum favorito ainda. Preencha um medicamento e clique em <b>★</b> para salvar e reutilizar nas próximas receitas.</div>`;
  return l.map(f=>`<div class="fav"><div class="fav-b" data-favadd="${esc(f.id)}" title="Adicionar à receita"><b>${esc(f.med)}</b>${f.qtd?` <span class="m">— ${esc(f.qtd)}</span>`:''}<div class="m">${esc(f.uso||'')}${f.pos?' · '+esc(f.pos):''}</div></div><button class="btn sm ghost" data-favdel="${esc(f.id)}" title="Remover dos favoritos">${ICON.x}</button></div>`).join('') || '<div class="empty" style="padding:14px 6px">Nada encontrado.</div>';
}
function renderReceituario(){
  const r = S.rec, p = recPaciente();
  const hist = S.receitas.slice().sort((a,b)=>String(b.data+b.criadoEm).localeCompare(String(a.data+a.criadoEm)));
  $('#main').innerHTML = `
    <div class="ph"><div><h2>Receituário</h2><div class="sub">Monte, imprima e guarde as receitas dos pacientes</div></div>
      <div class="tools"><button class="btn ghost" data-recnova>Nova receita</button></div></div>
    <div class="orc-grid">
      <div class="card"><div class="hd"><h3>${r.id?'Receita salva — '+fmtData(r.data):'Nova receita'}</h3></div><div class="bd">
        <div class="fg">
          <label class="f full">Paciente<input id="recPac" list="dlPacRec" value="${esc(r.paciente)}" placeholder="Nome do paciente" autocomplete="off"></label>
          <datalist id="dlPacRec">${S.pacientes.map(x=>`<option value="${esc(x.nome)}">`).join('')}</datalist>
          <div class="full" id="recAlerta">${recAlertaHtml(p)}</div>
          <label class="f">Data<input type="date" id="recData" value="${esc(r.data)}"></label>
          <label class="f">Tipo de receituário<select id="recTipo">${Object.entries(REC_TIPO).map(([k,l])=>`<option value="${k}" ${r.tipo===k?'selected':''}>${l}</option>`).join('')}</select></label>
          <label class="f full">Endereço do paciente ${r.tipo==='controle'?'<span style="color:var(--red)">(obrigatório no controle especial)</span>':'(opcional)'}<input id="recEnd" value="${esc(r.endereco)}" placeholder="Rua, número, bairro, cidade/UF"></label>
        </div>
        <div class="rx-tit">Medicamentos</div>
        <div id="recItens">${recItensHtml()}</div>
        <button class="btn sm" data-recadd style="margin-top:8px">${ICON.plus}Adicionar medicamento</button>
        <label class="f full" style="margin-top:14px">Orientações ao paciente (opcional)<textarea id="recObs" style="min-height:56px" placeholder="Ex.: Em caso de reação alérgica, suspenda o uso e procure atendimento.">${esc(r.obs)}</textarea></label>
        <label class="chk"><input type="checkbox" id="recReg" ${r.registrar?'checked':''}> Registrar no prontuário do paciente ao salvar</label>
        ${r.tipo!=='simples'?`<div class="note info" style="margin:12px 0 0">${r.tipo==='controle'?'Receituário de controle especial: sai em <b>2 vias</b> (1ª retida na farmácia, 2ª do paciente), com identificação do emitente, do comprador e do fornecedor.':'Antimicrobiano: sai em <b>2 vias</b> — a farmácia retém a 1ª via. A receita vale por 10 dias.'}</div>`:''}
        <div class="orc-acoes">
          <button class="btn primary" data-recprint>Salvar e imprimir</button>
          <button class="btn" data-recsave>${r.id?'Salvar alterações':'Salvar'}</button>
        </div>
      </div></div>
      <div>
        <div class="card"><div class="hd"><h3>Medicamentos favoritos</h3><span class="m" style="color:var(--muted);font-size:12px">clique para adicionar</span></div>
          <div class="bd" style="padding:10px 12px"><input class="inp" id="favBusca" data-keep placeholder="Buscar favorito" value="${esc(S.favBusca)}" style="width:100%;margin-bottom:8px"><div id="favLista" class="fav-l">${favRows()}</div></div></div>
      </div>
    </div>
    <div class="card" style="margin-top:16px"><div class="hd"><h3>Receitas emitidas</h3><span class="m" style="color:var(--muted);font-size:12px">${hist.length} no total</span></div>
      <div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Paciente</th><th>Tipo</th><th>Medicamentos</th><th></th></tr></thead><tbody>
      ${hist.map(x=>`<tr><td>${fmtData(x.data)}</td><td><b>${esc(x.paciente)}</b></td><td>${esc(REC_TIPO[x.tipo]||'')}</td><td style="max-width:320px">${esc((x.itens||[]).map(i=>i.med).filter(Boolean).join('; '))}</td>
        <td style="text-align:right;white-space:nowrap"><button class="btn sm ghost" data-recprint2="${esc(x.id)}">Imprimir</button><button class="btn sm ghost" data-recusar="${esc(x.id)}" title="Abrir uma nova receita com os mesmos medicamentos">Repetir</button><button class="btn sm ghost" data-recopen="${esc(x.id)}">Abrir</button>${S.isAdmin?`<button class="btn sm ghost danger" data-recdel="${esc(x.id)}">Excluir</button>`:''}</td></tr>`).join('')
        || `<tr><td colspan="5"><div class="empty">Nenhuma receita salva ainda.</div></td></tr>`}
      </tbody></table></div></div>`;
}
function recAlertaHtml(p){
  if(!p) return S.rec.paciente ? `<div class="m" style="color:var(--muted);font-size:12px">Paciente não cadastrado — a receita será salva só com o nome.</div>` : '';
  const id = [idade(p.nascimento), p.cpf?'CPF '+p.cpf:'' ].filter(Boolean).join(' · ');
  return `${id?`<div class="m" style="color:var(--muted);font-size:12px">${esc(id)}</div>`:''}${p.alergias?`<div class="alerta">⚠ Alergias / alertas: <b>${esc(p.alergias)}</b></div>`:''}`;
}
function recAtualizarPaciente(){
  const p = recPaciente();
  if(p){ S.rec.pacienteId = p.id; if(!S.rec.endereco && p.endereco){ S.rec.endereco = p.endereco; const e=$('#recEnd'); if(e) e.value = p.endereco; } }
  else S.rec.pacienteId = '';
  const a=$('#recAlerta'); if(a) a.innerHTML = recAlertaHtml(p);
}
function recValidar(r){
  const itens = r.itens.filter(i=>i.med.trim());
  if(!String(r.paciente||'').trim()){ toast('Informe o paciente.'); $('#recPac')?.focus(); return null; }
  if(!itens.length){ toast('Inclua pelo menos um medicamento.'); return null; }
  if(itens.some(i=>!i.pos.trim())){ toast('Preencha a posologia de todos os medicamentos.'); return null; }
  if(r.tipo==='controle' && !String(r.endereco||'').trim()){ toast('No controle especial, o endereço do paciente é obrigatório.'); $('#recEnd')?.focus(); return null; }
  return itens;
}
function recTexto(r){
  return ['RECEITA — '+(REC_TIPO[r.tipo]||''), ...r.itens.filter(i=>i.med).map((i,ix)=>`${ix+1}. ${i.med}${i.qtd?' — '+i.qtd:''} (${i.uso})\n   ${i.pos}`), r.obs?'\nOrientações: '+r.obs:''].filter(Boolean).join('\n');
}
async function recSalvar(){
  const r = S.rec; const itens = recValidar(r); if(!itens) return null;
  recAtualizarPaciente();
  const agora = new Date().toISOString();
  const ref = r.id ? COL.receitas().doc(r.id) : COL.receitas().doc();
  const atual = r.id ? (S.receitas.find(x=>x.id===r.id)||{}) : {};
  const doc = {...stripId(atual), pacienteId:r.pacienteId||'', paciente:r.paciente.trim(), endereco:r.endereco||'', data:r.data, tipo:r.tipo, itens, obs:r.obs||'',
    atualizadoPor:S.email, atualizadoEm:agora, ...(r.id?{}:{emitidaPor:S.email, criadoEm:agora})};
  if(!await write('clinica', ref, doc)) return null;
  if(!r.id && r.registrar && r.pacienteId){
    const pd = prontDoc(r.pacienteId);
    pd.notas.push({id:'n'+Date.now().toString(36)+Math.random().toString(36).slice(2,6), data:r.data, dente:'', texto:recTexto({...r, itens}), tipo:'Receita', autor:S.email, criadoEm:agora});
    salvarPront(r.pacienteId, pd);
  }
  S.rec = {...S.rec, id:ref.id, itens}; recSalvarRascunho(); render();
  toast(r.id?'Receita atualizada.':'Receita salva'+(r.registrar&&r.pacienteId?' e registrada no prontuário.':'.'));
  return {...doc, id:ref.id};
}
function recImprimir(r){
  let area = document.getElementById('printArea');
  if(!area){ area = document.createElement('div'); area.id = 'printArea'; document.body.appendChild(area); }
  const contato = contatoCabecalho();
  const titulo = r.tipo==='controle' ? 'RECEITUÁRIO DE CONTROLE ESPECIAL' : 'RECEITUÁRIO';
  const vias = r.tipo==='simples' ? [''] : ['1ª via — Farmácia','2ª via — Paciente'];
  let n = 0, uso = null, corpo = '';
  (r.itens||[]).filter(i=>i.med).forEach(i=>{
    if(i.uso!==uso){ uso = i.uso; corpo += `<div class="rx-uso">${esc(uso)}</div>`; }
    n++; corpo += `<div class="rx-it"><div class="rx-lin"><span>${n}. <b>${esc(i.med)}</b></span><span class="rx-dots"></span><span>${esc(i.qtd||'')}</span></div><div class="rx-pos">${esc(i.pos)}</div></div>`;
  });
  const pag = via => `<div class="rx-pag">
    <div class="pa-head"><div class="pa-nome">${esc(CLINICA.nome||'Clínica Odontológica')}</div>${contato?`<div class="pa-ct">${esc(contato)}</div>`:''}</div>
    <div class="pa-titulo">${titulo}</div>${via?`<div class="rx-via">${via}</div>`:''}
    ${r.tipo==='controle'?`<table class="rx-box"><tr><th colspan="2">Identificação do emitente</th></tr>
      <tr><td>Nome: <b>${esc(CLINICA.dentista||'')}</b></td><td>CRO: <b>${esc(CLINICA.cro||'')}</b></td></tr>
      <tr><td colspan="2">Endereço: ${esc(CLINICA.endereco||'')}</td></tr>
      <tr><td>Cidade: ${esc(CLINICA.cidade||'')}</td><td>Telefone: ${esc(CLINICA.telefone||'')}</td></tr></table>`:''}
    <div class="rx-pac">Paciente: <b>${esc(r.paciente)}</b>${r.endereco?`<br>Endereço: ${esc(r.endereco)}`:''}</div>
    <div class="rx-corpo">${corpo}</div>
    ${r.obs?`<div class="pa-bloco"><b>Orientações:</b> ${esc(r.obs)}</div>`:''}
    <div class="rx-data">${esc(CLINICA.cidade||'')}${CLINICA.cidade?', ':''}${dataExtenso(r.data)}.</div>
    <div class="pa-ass"><div class="pa-linha"></div>${esc(CLINICA.dentista||'Cirurgião(ã)-dentista')}${CLINICA.cro?'<br>CRO '+esc(CLINICA.cro):''}</div>
    ${r.tipo==='controle'?`<div class="rx-cf"><div><b>Identificação do comprador</b><br>Nome: ______________________________<br>RG: ____________ Órgão emissor: ______<br>Endereço: ____________________________<br>Cidade: ______________ UF: ____<br>Telefone: ____________________</div>
      <div><b>Identificação do fornecedor</b><br><br><br>______________________________<br>Assinatura do farmacêutico<br>Data: ____/____/______</div></div>`:''}
  </div>`;
  area.innerHTML = vias.map(pag).join('');
  document.body.classList.add('print-rx');
  setTimeout(()=>{ imprimirArea(); setTimeout(()=>document.body.classList.remove('print-rx'), 500); }, 50);
}
function recAbrir(x, novo){
  S.rec = {...recNova(), ...x, itens:(x.itens||[]).map(i=>({...recItem(), ...i})), registrar: novo ? true : false};
  if(novo){ S.rec.id = null; S.rec.data = todayISO(); }
  if(!S.rec.itens.length) S.rec.itens = [recItem()];
  recSalvarRascunho(); render(); window.scrollTo({top:0,behavior:'smooth'});
}
async function favSalvar(ix){
  const it = S.rec.itens[ix]; if(!it || !it.med.trim()) return toast('Preencha o medicamento antes de salvar nos favoritos.');
  if(S.favMed.some(f=>norm(f.med)===norm(it.med) && norm(f.pos)===norm(it.pos))) return toast('Esse medicamento já está nos favoritos.');
  if(await write('clinica', COL.favmed().doc(), {uso:it.uso, med:it.med.trim(), qtd:it.qtd.trim(), pos:it.pos.trim(), criadoPor:S.email, criadoEm:new Date().toISOString()})) toast('Salvo nos favoritos.');
}
function favAdicionar(id){
  const f = S.favMed.find(x=>x.id===id); if(!f) return;
  const novo = {uso:f.uso||'Uso oral', med:f.med||'', qtd:f.qtd||'', pos:f.pos||''};
  const vazio = S.rec.itens.findIndex(i=>!i.med.trim() && !i.pos.trim());
  if(vazio>=0) S.rec.itens[vazio] = novo; else S.rec.itens.push(novo);
  recSalvarRascunho(); render(); toast('Adicionado: '+f.med);
}

/* ============ ACESSOS (gestão) ============ */
function renderAcessos(){
  const lista = S.acessos.slice().sort((a,b)=>String(a.nome||a.id).localeCompare(String(b.nome||b.id),'pt-BR'));
  const fixas = DONAS.map(em=>`<tr><td><b>Proprietária</b></td><td>${esc(em)}</td><td>Administradora</td><td><span class="st st-pago">Ativo</span></td><td style="color:var(--muted);font-size:12px;text-align:right">fixa no sistema</td></tr>`).join('');
  const linhas = lista.filter(u=>!DONAS.includes(u.id)).map(u=>{
    const eu = u.id===S.email;
    return `<tr><td><b>${esc(u.nome||'—')}</b></td><td>${esc(u.id)}</td><td>${esc(PAPEL[u.papel]||u.papel)}</td>
      <td><span class="st ${u.ativo===false?'st-vencido':'st-pago'}">${u.ativo===false?'Suspenso':'Ativo'}</span></td>
      <td style="white-space:nowrap;text-align:right">
        <button class="btn sm ghost" data-editacesso="${esc(u.id)}">Editar</button>
        ${u.papel!=='sync'?`<button class="btn sm ghost" data-resetacesso="${esc(u.id)}">Redefinir senha</button>`:''}
        ${eu?'':`<button class="btn sm" data-togacesso="${esc(u.id)}">${u.ativo===false?'Reativar':'Suspender'}</button>
        <button class="btn sm ghost danger" data-delacesso="${esc(u.id)}">Remover</button>`}</td></tr>`;
  }).join('');
  $('#main').innerHTML = `
    <div class="ph"><div><h2>Acessos</h2><div class="sub">Quem pode entrar na plataforma e o que cada um vê</div></div>
      <div class="tools"><button class="btn primary" data-novoacesso>${ICON.plus}Novo acesso</button></div></div>
    <div class="note info"><b>Recepção:</b> agenda, pacientes e prontuário (link da recepção). <b>Administradora:</b> tudo, incluindo financeiro e acessos (link da gestão). <b>Sincronização Google Agenda:</b> conta técnica, só lê a agenda — usada pelo script de integração.</div>
    <div class="card"><div class="tbl-wrap"><table>
      <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Status</th><th></th></tr></thead>
      <tbody>${fixas}${linhas || ''}</tbody></table>
      ${linhas?'':'<div class="empty">Nenhum acesso criado ainda. Clique em “Novo acesso” para criar o login da recepção.</div>'}</div></div>`;
}

function openAcesso(id){
  const u = id ? S.acessos.find(x=>x.id===id) : {papel:'recepcao', ativo:true};
  if(id && !u) return;
  const body = `<form id="fAc" class="fg">
    <label class="f full">Nome<input name="nome" required value="${esc(u.nome)}" placeholder="Ex.: Juliana (recepção)"></label>
    <label class="f full">E-mail de login<input type="email" name="email" required value="${esc(id||'')}" ${id?'disabled':''}></label>
    <label class="f full">Papel<select name="papel">${Object.entries(PAPEL).map(([k,l])=>`<option value="${k}" ${u.papel===k?'selected':''}>${l}</option>`).join('')}</select></label>
    ${id?'':`<label class="f full">Senha provisória (mínimo 6 caracteres)<input type="text" name="senha" required minlength="6" autocomplete="off"></label>
    <div class="full" style="color:var(--muted);font-size:12px">Passe a senha para a pessoa. Ela pode trocar depois em “Esqueci a senha”. Se o e-mail já tiver login, a pessoa continua usando a senha que já tem.</div>`}
    <div class="full warn hidden" id="acErr"></div></form>`;
  const m = openModal(id?'Editar acesso':'Novo acesso', body, `<div class="r"><button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>${id?'Salvar':'Criar acesso'}</button></div>`);
  const f = m.querySelector('#fAc'), err = m.querySelector('#acErr');
  const salvar = async()=>{
    if(!f.reportValidity()) return;
    const o = formData(f);
    const email = (id || o.email).toLowerCase();
    if(DONAS.includes(email)){ err.classList.remove('hidden'); err.textContent='Este é o e-mail da proprietária, que já tem acesso total.'; return; }
    if(id === S.email && o.papel !== 'admin'){ err.classList.remove('hidden'); err.textContent='Você não pode tirar o seu próprio acesso de administradora.'; return; }
    let aviso = '';
    if(!id){
      const btn = m.querySelector('[data-save]'); btn.disabled = true; btn.textContent = 'Criando…';
      try{
        if(!S.authCadastro){ const sec = S.fbApp.initializeApp(FIREBASE_CONFIG, 'cadastro'); S.authCadastro = S.fb.getAuth(sec); }
        await S.fb.createUserWithEmailAndPassword(S.authCadastro, email, o.senha);
        await S.fb.signOut(S.authCadastro);
      }catch(e){
        if(e.code==='auth/email-already-in-use') aviso = ' Esse e-mail já tinha login: a pessoa usa a senha que já tem.';
        else{ btn.disabled=false; btn.textContent='Criar acesso'; err.classList.remove('hidden');
          err.textContent = e.code==='auth/weak-password' ? 'Senha fraca: use pelo menos 6 caracteres.' : e.code==='auth/invalid-email' ? 'E-mail inválido.' : e.code==='auth/operation-not-allowed' ? 'Ative o login por E-mail/senha no Firebase (Authentication).' : 'Não foi possível criar o login ('+(e.code||'erro')+').';
          return; }
      }
    }
    const doc = {...(id?stripId(u):{criadoEm:new Date().toISOString(), criadoPor:S.email, ativo:true}), nome:o.nome, papel:o.papel, email, atualizadoEm:new Date().toISOString()};
    closeModal();
    if(await write('adm', COL.acessos().doc(email), doc)) toast(id ? 'Acesso atualizado.' : 'Acesso criado para '+email+'.'+aviso);
  };
  f.addEventListener('submit', e=>{e.preventDefault(); salvar();});
  m.querySelector('[data-save]').onclick = salvar;
}
async function toggleAcesso(id){
  const u = S.acessos.find(x=>x.id===id); if(!u) return;
  const suspender = u.ativo !== false;
  if(suspender && !await confirmBox(`Suspender o acesso de ${u.nome||id}? A pessoa perde o acesso na hora.`, 'Suspender')) return;
  if(await write('adm', COL.acessos().doc(id), {...stripId(u), ativo:!suspender, atualizadoEm:new Date().toISOString()})) toast(suspender?'Acesso suspenso.':'Acesso reativado.');
}
async function resetAcesso(id){
  try{ await S.fb.sendPasswordResetEmail(S.auth, id); toast('Link de redefinição de senha enviado para '+id+'.'); }
  catch(_){ toast('Não foi possível enviar o e-mail de redefinição.'); }
}
async function delAcesso(id){
  const u = S.acessos.find(x=>x.id===id); if(!u) return;
  if(!await confirmBox(`Remover o acesso de ${u.nome||id}? A pessoa não consegue mais entrar. Para liberar de novo, crie o acesso outra vez.`, 'Remover')) return;
  if(await write('adm', COL.acessos().doc(id), null)) toast('Acesso removido.');
}

/* ============ boot (Firebase) ============ */
let dataSubs = [];
function pararDados(){ dataSubs.forEach(f=>{ try{f()}catch(_){} }); dataSubs=[]; S.agenda=[]; S.pacientes=[]; S.prontuarios={}; S.fin=[]; S.acessos=[]; S.modelosDb={}; S.tabelaDb={}; S.orcamentos=[]; S.tarefas=[]; S.receitas=[]; S.favMed=[]; S.termosModelosDb={}; assinarPaciente(null); S.anxCache={}; }
function aplicarPapel(role){
  if(role === S.role && (dataSubs.length || !role)) { render(); return; }
  pararDados(); S.role = role; S.sync = 'wait';
  if(role==='admin' || role==='recepcao'){
    const timer = setTimeout(()=>{ if(S.sync==='wait'){ S.sync='err'; render(); } }, 10000);
    const sub = (col, fn) => dataSubs.push(col.onSnapshot(snap=>{ fn(snap); render(); }, ()=>{ S.sync='err'; render(); }));
    sub(COL.agenda(), s=>{ S.agenda = s.docs.map(d=>({id:d.id, ...d.data()})); if(!s.metadata.fromCache){ S.sync='ok'; clearTimeout(timer); } });
    sub(COL.pacientes(), s=>{ S.pacientes = s.docs.map(d=>({id:d.id, ...d.data()})); });
    sub(COL.prontuarios(), s=>{ const o={}; s.docs.forEach(d=>o[d.id]=d.data()); S.prontuarios=o; });
    sub(COL.modelos(), s=>{ const o={}; s.docs.forEach(d=>o[d.id]=d.data()); S.modelosDb=o; });
    sub(COL.orcamentos(), s=>{ S.orcamentos = s.docs.map(d=>({id:d.id, ...d.data()})); });
    sub(COL.tarefas(), s=>{ S.tarefas = s.docs.map(d=>({id:d.id, ...d.data()})); });
    sub(COL.receitas(), s=>{ S.receitas = s.docs.map(d=>({id:d.id, ...d.data()})); });
    sub(COL.favmed(), s=>{ S.favMed = s.docs.map(d=>({id:d.id, ...d.data()})); });
    sub(COL.termosModelos(), s=>{ S.termosModelosDb = Object.fromEntries(s.docs.map(d=>[d.id, d.data()])); });
    dataSubs.push(COL.tabela().doc('precos').onSnapshot(d=>{ S.tabelaDb = d.exists ? (d.data()||{}) : {}; render(); }, ()=>{}));
    if(role==='admin'){
      sub(COL.fin(), s=>{ S.fin = s.docs.map(d=>({id:d.id, ...d.data()})); });
      sub(COL.acessos(), s=>{ S.acessos = s.docs.map(d=>({id:d.id, ...d.data()})); });
    }
  }
  render();
}

render();
(async function boot(){
  const configurado = FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && !String(FIREBASE_CONFIG.apiKey).includes('COLE');
  if(!configurado){ S.noDb=true; render(); toast('Configure o arquivo firebase-config.js (veja o LEIA-ME).'); return; }
  let app, fs, au;
  try{
    [app, fs, au] = await Promise.all([import(FB+'firebase-app.js'), import(FB+'firebase-firestore.js'), import(FB+'firebase-auth.js')]);
  }catch(_){ S.noDb=true; render(); return; }
  const fApp = app.initializeApp(FIREBASE_CONFIG);
  const fdb = fs.initializeFirestore(fApp, {ignoreUndefinedProperties:true});
  S.auth = au.getAuth(fApp); S.fb = au; S.fbApp = app;
  const wrapSnap = s => ({ docs: s.docs.map(d=>({id:d.id, data:()=>d.data()})), metadata:{fromCache:s.metadata.fromCache} });
  S.db = { collection(path){
    const c = fs.collection(fdb, path);
    return { path,
      doc(id){ const r = id ? fs.doc(c, id) : fs.doc(c);
        return { id:r.id, path:r.path, set:d=>fs.setDoc(r,d), delete:()=>fs.deleteDoc(r),
          get:async()=>{ const s = await fs.getDoc(r); return {exists:s.exists(), data:()=>s.data()}; },
          onSnapshot:(next, err)=>fs.onSnapshot(r, s=>next({exists:s.exists(), data:()=>s.data()}), err) }; },
      where(campo, valor){ const q = fs.query(c, fs.where(campo, '==', valor)); return { onSnapshot:(next, err)=>fs.onSnapshot(q, s=>next(wrapSnap(s)), err) }; },
      onSnapshot(next, err){ return fs.onSnapshot(c, s=>next(wrapSnap(s)), err); }
    };
  }};

  let unsubAcesso = null;
  au.onAuthStateChanged(S.auth, u=>{
    if(unsubAcesso){ unsubAcesso(); unsubAcesso=null; }
    S.uid = u ? u.uid : null; S.email = u ? String(u.email||'').toLowerCase() : '';
    S.authReady = true;
    if(!u){ aplicarPapel(null); return; }
    if(DONAS.includes(S.email)){ aplicarPapel('admin'); return; }
    // papel definido pela administradora em "Acessos" — vale em tempo real (suspender tira o acesso na hora)
    unsubAcesso = COL.acessos().doc(S.email).onSnapshot(d=>{
      const v = d.exists ? d.data() : null;
      aplicarPapel(v && v.ativo!==false && ['admin','recepcao','sync'].includes(v.papel) ? v.papel : null);
    }, ()=>aplicarPapel(null));
  });
})();
