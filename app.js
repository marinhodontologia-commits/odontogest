import * as CFG from './firebase-config.js';
import { MODELOS_PADRAO } from './modelos.js';
const { FIREBASE_CONFIG, ADMIN_EMAILS } = CFG;
const CLINICA = CFG.CLINICA || {};
const MODO = document.body.dataset.modo === 'gestao' ? 'gestao' : 'recepcao';
const ROUTES = { recepcao:['agenda','pacientes','prontuario'], gestao:['visao','agenda','pacientes','prontuario','financeiro','acessos'] };
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
  acessos:'<svg class="i" viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="m10.85 12.15 8.65-8.65M18 5l2 2M15 8l2 2"/></svg>',
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
  agenda:[], pacientes:[], prontuarios:{}, fin:[], acessos:[], modelosDb:{}, notaTipo:'',
  agView: (window.innerWidth < 700 ? 'dia' : 'semana'), agDate: todayISO(), agProf:'',
  pacBusca:'', selPac:null, selDente:null, finStatus:'todos', finMes: todayISO().slice(0,7)
};
const COL = {
  agenda: () => S.db.collection('agenda'),
  pacientes: () => S.db.collection('clinica/dados/pacientes'),
  prontuarios: () => S.db.collection('clinica/dados/prontuarios'),
  fin: () => S.db.collection('adm/dados/financeiro'),
  acessos: () => S.db.collection('acessos'),
  modelos: () => S.db.collection('clinica/dados/modelos')
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
  ({agenda:renderAgenda, visao:renderVisao, pacientes:renderPacientes, prontuario:renderProntuario, financeiro:renderFinanceiro, acessos:renderAcessos})[r]();
  Object.entries(keep).forEach(([id,v])=>{ const el=document.getElementById(id); if(el && !el.value) el.value=v; });
  if(aid){ const el=document.getElementById(aid); if(el){ el.focus(); try{ if(sel!=null) el.setSelectionRange(sel,sel);}catch(_){} } }
}

function renderShell(r){
  const link=(k,l)=>`<a href="#${k}" class="${r===k?'on':''}">${ICON[k]}${l}</a>`;
  let side = '';
  if(r && MODO==='gestao') side = `${link('visao','Visão geral')}${link('agenda','Agenda')}<div class="sep">Clínica</div>${link('pacientes','Portal do paciente')}${link('prontuario','Prontuário')}<div class="sep">Administração</div>${link('financeiro','Financeiro')}${link('acessos','Acessos')}`;
  else if(r) side = `${link('agenda','Agenda')}${link('pacientes','Pacientes')}${link('prontuario','Prontuário')}`;
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

function renderAgenda(){
  const days = agendaDays();
  const d0=days[0], d1=days[days.length-1];
  const title = S.agView==='dia'
    ? `${DIAS[d0.getDay()]}, ${d0.getDate()} de ${MESES[d0.getMonth()]}`
    : `${d0.getDate()} ${d0.getMonth()!==d1.getMonth()?'de '+MESES[d0.getMonth()]+' ':''}a ${d1.getDate()} de ${MESES[d1.getMonth()]} de ${d1.getFullYear()}`;
  const profs = profissionais();
  const t = todayISO();
  const cols = days.map(d=>{
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
        <div class="seg"><button data-agview="dia" class="${S.agView==='dia'?'on':''}">Dia</button><button data-agview="semana" class="${S.agView==='semana'?'on':''}">Semana</button></div>
        <input type="date" class="inp" id="agDate" value="${esc(S.agDate)}">
        <select class="inp" id="agProf"><option value="">Todos os profissionais</option>${profs.map(p=>`<option ${p===S.agProf?'selected':''}>${esc(p)}</option>`).join('')}</select>
        ${S.readOnly?'':`<button class="btn primary" data-new="${esc(S.agDate)}">${ICON.plus}Nova consulta</button>`}
      </div></div>
    <div class="week ${S.agView==='dia'?'one':''}">${cols}</div>`;
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
        <div class="tools"><button class="btn sm" data-copiar="${esc(p.id)}">Copiar resumo</button><button class="btn sm" data-editpac="${esc(p.id)}">Editar</button><button class="btn sm primary" data-new="${t}" data-pac="${esc(p.id)}">${ICON.plus}Agendar</button></div></div>
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
        ${pend.slice(0,5).map(l=>`<div class="row"><div>${esc(l.descricao||'—')}<div class="m">Vence ${fmtData(l.vencimento)}</div></div><span class="st st-${finStatus(l)}">${BRL(l.valor)}</span></div>`).join('')}
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
  if(p){
    const pr = S.prontuarios[p.id] || {};
    const dentes = pr.dentes || {};
    const arch = (rows, up) => `<div class="arch">${rows.map(h=>`<div class="half">${h.map(n=>`<button class="tooth ${up?'up':''} ${String(S.selDente)===String(n)?'sel':''}" data-dente="${n}" title="Dente ${n}: ${esc((DENTE[dentes[n]]||DENTE.higido).l)}">${up?`<small>${n}</small>${toothSvg(dentes[n])}`:`${toothSvg(dentes[n])}<small>${n}</small>`}</button>`).join('')}</div>`).join('')}</div>`;
    const cont = {}; Object.values(dentes).forEach(s=>cont[s]=(cont[s]||0)+1);
    const notas = (pr.notas||[]).slice().sort((a,b)=>String(b.data).localeCompare(String(a.data)) || String(b.criadoEm).localeCompare(String(a.criadoEm)));
    const sd = S.selDente;
    content = `
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
        ${notas.map(n=>`<div class="evo"><div class="d" style="display:flex;gap:4px;align-items:center;flex-wrap:wrap">${fmtData(n.data)}${n.dente?' · dente '+esc(n.dente):''}${n.autor?' · por '+esc(n.autor):''}${n.tipo?` <span class="tag">${esc(n.tipo)}</span>`:''}<span style="margin-left:auto;white-space:nowrap"><button class="btn ghost sm" data-printnota="${esc(n.id)}" style="padding:0 4px;color:var(--muted)">imprimir</button>${S.isAdmin?`<button class="btn ghost sm" data-delnota="${esc(n.id)}" style="padding:0 4px;color:var(--muted)">excluir</button>`:''}</span></div><p>${esc(n.texto)}</p></div>`).join('') || '<div class="empty">Nenhuma anotação ainda.</div>'}
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
        <td style="white-space:nowrap;text-align:right">${s!=='pago'?`<button class="btn sm" data-pagar="${esc(l.id)}">Receber</button> `:''}<button class="btn sm ghost" data-editfin="${esc(l.id)}">Editar</button></td></tr>`; }).join('')
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
  const m = openModal(id?'Editar lançamento':'Nova cobrança', body, `${id?'<button class="btn danger" data-del>Excluir</button>':''}<div class="r"><button class="btn" data-close>Cancelar</button><button class="btn primary" data-save>Salvar</button></div>`);
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
    let ok = true;
    for(let i=0;i<n;i++){
      const venc = new Date(v0.getFullYear(), v0.getMonth()+i, v0.getDate());
      const doc = {...o, vencimento: iso(venc), descricao: n>1 ? `${o.descricao} — ${i+1}/${n}` : o.descricao, criadoEm:new Date().toISOString()};
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
  const el = e.target.closest('[data-modelos],[data-editmodelo],[data-novomodelo],[data-ocultamodelo],[data-restauramodelo],[data-printnota],[data-novoacesso],[data-editacesso],[data-togacesso],[data-resetacesso],[data-delacesso],[data-act],[data-go],[data-new],[data-ap],[data-agnav],[data-agview],[data-newpac],[data-selpac],[data-editpac],[data-copiar],[data-abrirpront],[data-verportal],[data-dente],[data-marca],[data-delnota],[data-newfin],[data-editfin],[data-pagar]');
  if(!el) return;
  const d = el.dataset;
  if(d.act==='abrir' || d.act==='entrar') return go(ROUTES[MODO][0]);
  if(d.act==='sair') return sair();
  if(d.act==='esqueci') return esqueci();
  if(d.go) return go(ROUTES[MODO].includes(d.go) ? d.go : ROUTES[MODO][0]);
  if(d.modelos!==undefined) return openModelos();
  if(d.novomodelo!==undefined) return openModeloEdit();
  if(d.editmodelo) return openModeloEdit(d.editmodelo);
  if(d.ocultamodelo) return ocultarModelo(d.ocultamodelo);
  if(d.restauramodelo) return restaurarModelo(d.restauramodelo);
  if(d.printnota) return imprimirNota(d.printnota);
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
  if(d.agnav!==undefined){ const n=Number(d.agnav); S.agDate = n===0 ? todayISO() : iso(addDays(parseISO(S.agDate), n*(S.agView==='dia'?1:7))); return render(); }
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
});
document.addEventListener('change', e => {
  const t=e.target;
  if(t.id==='agDate' && t.value){ S.agDate=t.value; render(); }
  if(t.id==='agProf'){ S.agProf=t.value; render(); }
  if(t.id==='notaModelo') return inserirModelo(t.value);
  if(t.id==='prontPac'){ S.selPac=t.value||null; S.selDente=null; render(); }
  if(t.id==='finMes'){ S.finMes=t.value; render(); }
  if(t.id==='finStatus'){ S.finStatus=t.value; render(); }
});
document.addEventListener('submit', e => {
  if(e.target.id==='fLogin'){ e.preventDefault(); return entrar(e.target); }
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
async function sair(){ try{ await S.fb.signOut(S.auth); }catch(_){} go('inicio'); toast('Você saiu.'); }
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
  const v = { paciente:p.nome||'__________', idade:idade(p.nascimento)||'___', data:fmtData(data), data_extenso:dataExtenso(data),
    dente:dente||'___', cidade:CLINICA.cidade||'__________', dentista:CLINICA.dentista||'__________', cro:CLINICA.cro||'______' };
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
    <div class="full" style="color:var(--muted);font-size:12px;line-height:1.6">Campos automáticos: <code>{{paciente}}</code> <code>{{idade}}</code> <code>{{data}}</code> <code>{{data_extenso}}</code> <code>{{dente}}</code> <code>{{cidade}}</code> <code>{{dentista}}</code> <code>{{cro}}</code>. Use <code>___</code> para lacunas: o cursor vai direto para a primeira.</div>
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
function imprimirNota(id){
  const p = S.pacientes.find(x=>x.id===S.selPac) || {};
  const n = ((S.prontuarios[S.selPac]||{}).notas||[]).find(x=>x.id===id); if(!n) return;
  let area = document.getElementById('printArea');
  if(!area){ area = document.createElement('div'); area.id = 'printArea'; document.body.appendChild(area); }
  const contato = [CLINICA.endereco, CLINICA.telefone].filter(Boolean).join(' · ');
  area.innerHTML = `<div class="pa-head"><div class="pa-nome">${esc(CLINICA.nome||'Clínica Odontológica')}</div>${contato?`<div class="pa-ct">${esc(contato)}</div>`:''}</div>
    <div class="pa-meta">Paciente: <b>${esc(p.nome||'')}</b>${p.nascimento?' · '+esc(idade(p.nascimento)):''} · ${fmtData(n.data)}${n.dente?' · dente '+esc(n.dente):''}</div>
    <div class="pa-txt">${esc(n.texto)}</div>
    <div class="pa-ass"><div class="pa-linha"></div>${esc(CLINICA.dentista||'Cirurgião(ã)-dentista')}${CLINICA.cro?'<br>CRO '+esc(CLINICA.cro):''}</div>`;
  setTimeout(()=>window.print(), 50);
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
function pararDados(){ dataSubs.forEach(f=>{ try{f()}catch(_){} }); dataSubs=[]; S.agenda=[]; S.pacientes=[]; S.prontuarios={}; S.fin=[]; S.acessos=[]; S.modelosDb={}; }
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
          onSnapshot:(next, err)=>fs.onSnapshot(r, s=>next({exists:s.exists(), data:()=>s.data()}), err) }; },
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
