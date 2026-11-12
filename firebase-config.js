// ============================================================
//  CONFIGURAÇÃO DO ODONTOGEST
//  1) Cole abaixo o "firebaseConfig" que o Firebase mostra ao
//     registrar o app da Web (passo 5 do LEIA-ME).
//  2) Coloque o e-mail da PROPRIETÁRIA da clínica em ADMIN_EMAILS.
//     Esse MESMO e-mail precisa estar no arquivo firestore.rules.
//     As demais pessoas (recepção etc.) são cadastradas pela própria
//     administradora, na tela "Acessos" do painel da gestão.
//  3) Preencha CLINICA com os dados que vão nas impressões.
// ============================================================

export const FIREBASE_CONFIG = {
  apiKey: "COLE_AQUI_A_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000"
};

// Dados que aparecem no cabeçalho das impressões (receita, atestado,
// orientações) e preenchem os campos {{cidade}}, {{dentista}} e {{cro}} dos modelos.
export const CLINICA = {
  nome: "Marinho Odontologia & Estética",
  endereco: "Rua Exemplo, 123 — Centro",
  telefone: "(61) 90000-0000",
  cidade: "Brasília/DF",
  dentista: "Dra. Nome Sobrenome",
  cro: "DF-00000"
};

// Proprietária: acesso total e permanente (não pode ser removida pela tela de Acessos).
export const ADMIN_EMAILS = [
  "email.da.dentista@gmail.com"
];
