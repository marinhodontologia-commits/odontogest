/**
 * OdontoGest → Asaas (boleto / Pix)
 * ------------------------------------------------------------------
 * Ponte segura entre o app e o Asaas. A chave de API do Asaas fica
 * guardada SÓ aqui (Propriedades do script), nunca no app.
 *
 * Instalação (uma vez):
 *  1. Em script.google.com, crie um projeto "OdontoGest Asaas" e cole este arquivo.
 *  2. Configurações do projeto › Propriedades do script › adicione:
 *       ASAAS_API_KEY  = a chave gerada no Asaas (Integrações › Chaves de API)
 *       ASAAS_AMBIENTE = producao   (ou sandbox, para testes)
 *  3. Implantar › Nova implantação › Tipo "App da Web"
 *       Executar como: Eu  ·  Quem pode acessar: Qualquer pessoa
 *  4. Copie a URL do app da Web (termina em /exec) e cole em
 *     ASAAS_URL no firebase-config.js do OdontoGest.
 *
 * Só quem está logado no app como ADMINISTRADORA consegue usar esta ponte:
 * cada pedido traz o token de login do Firebase, que é conferido aqui.
 */

const CFG = {
  PROJECT_ID: 'odontogest-marinho',
  FIREBASE_API_KEY: 'AIzaSyBvPFSaVzrwKggq__mnURoTo5YpvmSs5Zg',   // chave pública do app (firebase-config.js)
  PROPRIETARIA: ['marinhodontologia@gmail.com'],
  APP: 'OdontoGest/1.0 (Marinho Odontologia)'
};

// ----------------------------- entrada -----------------------------

function doPost(e) {
  let r;
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const email = conferirAdmin_(req.idToken);
    const acoes = { teste: teste_, cobrar: cobrar_, status: status_, cancelar: cancelar_, receberEmDinheiro: receberEmDinheiro_ };
    if (!acoes[req.acao]) throw erro_('Ação desconhecida.');
    r = { ok: true, ...acoes[req.acao](req, email) };
  } catch (err) {
    r = { ok: false, erro: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, servico: 'OdontoGest Asaas', ambiente: ambiente_() }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ----------------------------- ações -----------------------------

/** Confere a chave: devolve o nome da conta e o saldo. */
function teste_() {
  const conta = asaas_('get', '/myAccount/commercialInfo');
  const saldo = asaas_('get', '/finance/balance');
  return { ambiente: ambiente_(), conta: conta.companyName || conta.name || '', saldo: saldo.balance };
}

/**
 * Cria (ou reaproveita) a cobrança de um lançamento.
 * req: { lancamentoId, valor, vencimento:'AAAA-MM-DD', descricao, tipo:'BOLETO'|'PIX'|'UNDEFINED',
 *        cliente:{ nome, cpf, email, telefone, cep, endereco, numero } }
 */
function cobrar_(req) {
  const c = req.cliente || {};
  const cpf = String(c.cpf || '').replace(/\D/g, '');
  if (!c.nome) throw erro_('Paciente sem nome.');
  if (cpf.length !== 11 && cpf.length !== 14) throw erro_('CPF do paciente inválido ou não preenchido.');
  const valor = Math.round(Number(req.valor) * 100) / 100;
  if (!(valor >= 5)) throw erro_('O Asaas só emite cobranças a partir de R$ 5,00.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(req.vencimento || ''))) throw erro_('Vencimento inválido.');
  if (!req.lancamentoId) throw erro_('Lançamento sem identificação.');

  // Já existe cobrança ativa para este lançamento? Reaproveita (evita boleto em dobro).
  const ja = asaas_('get', '/payments?externalReference=' + encodeURIComponent(req.lancamentoId) + '&limit=10').data || [];
  const ativa = ja.find(p => !p.deleted && ['PENDING', 'OVERDUE', 'RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].indexOf(p.status) >= 0);
  if (ativa) return { cobranca: resumo_(ativa), reaproveitada: true };

  const cliente = clienteAsaas_(cpf, c);
  const hoje = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd');
  const p = asaas_('post', '/payments', {
    customer: cliente,
    billingType: ['BOLETO', 'PIX', 'UNDEFINED'].indexOf(req.tipo) >= 0 ? req.tipo : 'BOLETO',
    value: valor,
    dueDate: req.vencimento < hoje ? hoje : req.vencimento,
    description: String(req.descricao || 'Tratamento odontológico').slice(0, 500),
    externalReference: req.lancamentoId,
    postalService: false
  });
  return { cobranca: resumo_(p) };
}

/** Situação de várias cobranças. req: { ids:[ 'pay_...' ] } */
function status_(req) {
  const ids = (req.ids || []).slice(0, 60);
  const out = {};
  ids.forEach(id => {
    try { out[id] = resumo_(asaas_('get', '/payments/' + encodeURIComponent(id))); }
    catch (e) { out[id] = { erro: String(e.message || e) }; }
  });
  return { cobrancas: out };
}

/** Cancela (exclui) uma cobrança ainda não paga. req: { id:'pay_...' } */
function cancelar_(req) {
  if (!req.id) throw erro_('Cobrança não informada.');
  const r = asaas_('delete', '/payments/' + encodeURIComponent(req.id));
  return { cancelada: !!r.deleted };
}

/** Dá baixa no Asaas quando o pagamento foi feito direto na clínica. req: { id, data:'AAAA-MM-DD', valor } */
function receberEmDinheiro_(req) {
  if (!req.id) throw erro_('Cobrança não informada.');
  const p = asaas_('post', '/payments/' + encodeURIComponent(req.id) + '/receiveInCash',
    { paymentDate: req.data, value: Number(req.valor), notifyCustomer: false });
  return { cobranca: resumo_(p) };
}

// ----------------------------- auxiliares -----------------------------

function clienteAsaas_(cpf, c) {
  const achados = asaas_('get', '/customers?cpfCnpj=' + cpf + '&limit=1').data || [];
  const dados = {
    name: String(c.nome).slice(0, 100),
    cpfCnpj: cpf,
    email: c.email || undefined,
    mobilePhone: String(c.telefone || '').replace(/\D/g, '').slice(-11) || undefined,
    postalCode: String(c.cep || '').replace(/\D/g, '') || undefined,
    address: c.endereco || undefined,
    addressNumber: c.numero || undefined,
    externalReference: c.pacienteId || undefined,
    notificationDisabled: false
  };
  Object.keys(dados).forEach(k => dados[k] === undefined && delete dados[k]);
  if (achados.length) {
    const id = achados[0].id;
    try { asaas_('put', '/customers/' + id, dados); } catch (e) { /* atualização é opcional */ }
    return id;
  }
  return asaas_('post', '/customers', dados).id;
}

function resumo_(p) {
  return {
    id: p.id, status: p.status, valor: p.value, liquido: p.netValue, vencimento: p.dueDate,
    pagoEm: p.clientPaymentDate || p.paymentDate || p.confirmedDate || '',
    tipo: p.billingType, link: p.invoiceUrl || '', boleto: p.bankSlipUrl || '',
    numero: p.invoiceNumber || '', excluida: !!p.deleted
  };
}

function ambiente_() {
  return (PropertiesService.getScriptProperties().getProperty('ASAAS_AMBIENTE') || 'producao').toLowerCase();
}

function asaas_(metodo, caminho, corpo) {
  const chave = PropertiesService.getScriptProperties().getProperty('ASAAS_API_KEY');
  if (!chave) throw erro_('Chave do Asaas não configurada no script (ASAAS_API_KEY).');
  const base = ambiente_() === 'sandbox' ? 'https://api-sandbox.asaas.com/v3' : 'https://api.asaas.com/v3';
  const resp = UrlFetchApp.fetch(base + caminho, {
    method: metodo, muteHttpExceptions: true, contentType: 'application/json',
    headers: { access_token: chave.trim(), 'User-Agent': CFG.APP },
    payload: corpo ? JSON.stringify(corpo) : undefined
  });
  const cod = resp.getResponseCode();
  let json = {};
  try { json = JSON.parse(resp.getContentText() || '{}'); } catch (e) { /* resposta sem JSON */ }
  if (cod === 401) throw erro_('O Asaas recusou a chave de API (confira ASAAS_API_KEY e ASAAS_AMBIENTE).');
  if (cod >= 400) {
    const msg = (json.errors || []).map(x => x.description).join(' ') || ('HTTP ' + cod);
    throw erro_('Asaas: ' + msg);
  }
  return json;
}

/** Valida o token de login do app e exige papel de administradora. Devolve o e-mail. */
function conferirAdmin_(idToken) {
  if (!idToken) throw erro_('Faça login no OdontoGest novamente.');
  const look = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + CFG.FIREBASE_API_KEY, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify({ idToken: idToken })
  });
  if (look.getResponseCode() !== 200) throw erro_('Sessão expirada. Saia e entre de novo no OdontoGest.');
  const u = (JSON.parse(look.getContentText()).users || [])[0];
  const email = String(u && u.email || '').toLowerCase();
  if (!email) throw erro_('Sessão inválida.');
  if (CFG.PROPRIETARIA.indexOf(email) >= 0) return email;
  const url = 'https://firestore.googleapis.com/v1/projects/' + CFG.PROJECT_ID + '/databases/(default)/documents/acessos/' + encodeURIComponent(email);
  const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + idToken } });
  if (r.getResponseCode() === 200) {
    const f = JSON.parse(r.getContentText()).fields || {};
    if (f.ativo && f.ativo.booleanValue && f.papel && f.papel.stringValue === 'admin') return email;
  }
  throw erro_('Somente a administração pode emitir cobranças.');
}

function erro_(m) { return new Error(m); }
