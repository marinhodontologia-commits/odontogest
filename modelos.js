// Modelos de prontuário que já vêm no OdontoGest.
// A clínica pode editar, ocultar ou criar novos pelo próprio app
// (Prontuário › Modelos). As alterações ficam salvas no banco de dados;
// este arquivo só define o ponto de partida.
//
// Campos automáticos (preenchidos ao inserir o modelo):
//   {{paciente}}  {{idade}}  {{data}}  {{data_extenso}}  {{dente}}  {{cidade}}  {{dentista}}  {{cro}}

export const MODELOS_PADRAO = [
  { id:'p-anamnese', ordem:1, nome:'Anamnese', texto:
`ANAMNESE
Queixa principal:
História da doença atual:

Histórico médico:
( ) Hipertensão   ( ) Diabetes   ( ) Cardiopatia   ( ) Distúrbio de coagulação
( ) Asma/bronquite   ( ) Hepatite   ( ) Gestante   ( ) Outros: ______
Alergias (medicamentos, anestésicos, látex):
Medicamentos em uso:
Cirurgias / internações anteriores:
Hábitos: ( ) Fumo   ( ) Álcool   ( ) Bruxismo   ( ) Respiração bucal
Última consulta odontológica:
Escovação: ___ vez(es) ao dia   Fio dental: ( ) Sim  ( ) Não
Pressão arterial: ___ x ___ mmHg

O(a) paciente declara que as informações acima são verdadeiras.` },

  { id:'p-exame', ordem:2, nome:'Exame clínico inicial', texto:
`EXAME CLÍNICO
Exame extraoral (ATM, linfonodos, assimetrias, lábios):

Exame intraoral:
• Tecidos moles (mucosa, língua, assoalho, palato):
• Gengiva / periodonto:
• Higiene oral: ( ) Boa  ( ) Regular  ( ) Deficiente
• Oclusão:

Alterações dentárias: ver odontograma.
Exames complementares: ( ) Panorâmica  ( ) Periapical  ( ) Interproximal  ( ) Tomografia
Hipótese diagnóstica:` },

  { id:'p-plano', ordem:3, nome:'Plano de tratamento', texto:
`PLANO DE TRATAMENTO
1.
2.
3.

Urgências / prioridades:
Alternativas apresentadas ao paciente:
Valor total: R$ ______ (ver Financeiro)

Plano apresentado e aprovado por {{paciente}} em {{data}}.` },

  { id:'p-profilaxia', ordem:4, nome:'Profilaxia / raspagem', texto:
`PROFILAXIA / RASPAGEM
Profilaxia com pasta profilática e taça de borracha.
Raspagem supragengival: ( ) Sim  ( ) Não   Regiões:
Aplicação tópica de flúor: ( ) Sim  ( ) Não
Sangramento à sondagem:
Orientação de higiene oral realizada.
Retorno sugerido em ___ meses.` },

  { id:'p-restauracao', ordem:5, nome:'Restauração', texto:
`RESTAURAÇÃO — dente {{dente}}
Face(s): ( ) O  ( ) M  ( ) D  ( ) V  ( ) L/P
Anestesia: ______   ( ) Sem anestesia
Isolamento: ( ) Absoluto  ( ) Relativo
Material: ( ) Resina composta — cor ___  ( ) Ionômero de vidro  ( ) Outro: ___
Proteção do complexo dentino-pulpar:
Ajuste oclusal e polimento realizados.
Intercorrências: nenhuma.` },

  { id:'p-endo', ordem:6, nome:'Endodontia (canal)', texto:
`ENDODONTIA — dente {{dente}} — sessão ___
Diagnóstico:
Anestesia:
Isolamento absoluto. Acesso coronário.
Canais localizados:
Odontometria (CRT):
Instrumentação:
Irrigação:
Medicação intracanal: ______   Obturação: ( ) Realizada  ( ) Próxima sessão
Selamento provisório:
Radiografia:` },

  { id:'p-exodontia', ordem:7, nome:'Exodontia (extração)', texto:
`EXODONTIA — dente {{dente}}
Indicação:
Anestesia: ______   Técnica: ______   Tubetes: ___
Técnica cirúrgica: ( ) Fórceps  ( ) Com retalho/osteotomia
Hemostasia: ( ) Compressão com gaze  ( ) Sutura — fio: ___
Intercorrências: nenhuma.
Orientações pós-operatórias entregues verbalmente e por escrito.
Retorno para remoção de sutura em ___/___.` },

  { id:'p-clareamento', ordem:8, nome:'Clareamento', texto:
`CLAREAMENTO DENTAL
Técnica: ( ) Consultório  ( ) Caseiro supervisionado
Cor inicial: ___   Cor atual: ___
Produto / concentração:
Sessão nº ___   Tempo de aplicação: ___
Sensibilidade: ( ) Não  ( ) Leve  ( ) Moderada  ( ) Intensa
Orientado a evitar alimentos e bebidas com corantes durante o tratamento.` },

  { id:'p-retorno', ordem:9, nome:'Retorno / controle', texto:
`RETORNO / CONTROLE
Queixas:
Avaliação:
Conduta:
Próximo retorno:` },

  { id:'p-prescricao', ordem:10, nome:'Prescrição (receita)', imprimir:true, texto:
`RECEITUÁRIO

Paciente: {{paciente}}

Uso ______

1. ______________________________________
   ______________________________________

2. ______________________________________
   ______________________________________

{{cidade}}, {{data_extenso}}.` },

  { id:'p-posop', ordem:11, nome:'Orientações pós-operatórias', imprimir:true, texto:
`ORIENTAÇÕES PÓS-OPERATÓRIAS — {{paciente}}

• Mantenha a gaze mordida por 30 minutos.
• Não bocheche, não cuspa e não use canudo nas primeiras 24 horas.
• Faça compressas de gelo no rosto (20 minutos, com intervalos) nas primeiras 24 a 48 horas.
• Prefira alimentos líquidos ou pastosos, frios ou em temperatura ambiente, nos 2 primeiros dias.
• Evite esforço físico, exposição ao sol, cigarro e bebidas alcoólicas.
• Escove os demais dentes normalmente, com cuidado na região operada.
• Tome os medicamentos exatamente como prescritos.
• Em caso de sangramento que não para, febre ou inchaço que aumenta após o 3º dia, entre em contato com a clínica.` },

  { id:'p-atestado', ordem:12, nome:'Atestado', imprimir:true, texto:
`ATESTADO

Atesto, para os devidos fins, que {{paciente}} esteve sob meus cuidados profissionais em {{data_extenso}}, das ___h___ às ___h___, para tratamento odontológico, ( ) devendo permanecer afastado(a) de suas atividades por ___ dia(s).

CID: ______ (somente com autorização do(a) paciente)

{{cidade}}, {{data_extenso}}.` }
];
