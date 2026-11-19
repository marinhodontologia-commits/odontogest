// Modelos de termos de consentimento que já vêm no OdontoGest.
// São um PONTO DE PARTIDA: revise o texto com a responsável técnica da clínica
// antes de usar. A administradora pode editar, ocultar ou criar modelos pelo
// próprio app (Prontuário › Termos › Modelos de termo).
//
// Campos automáticos:
//   paciente: {{paciente}} {{cpf}} {{nascimento}} {{idade}} {{endereco}} {{telefone}} {{email}} {{convenio}}
//   termo: {{procedimento}} {{dentes}} {{assinante}} {{assinante_cpf}} {{representacao}}
//   dentista/clínica: {{dentista}} {{cro}} {{clinica}} {{endereco_clinica}} {{telefone_clinica}} {{cidade}} {{data}} {{data_extenso}}

export const TERMOS_PADRAO = [
  { id:'t-geral', ordem:1, nome:'Consentimento para tratamento odontológico', texto:
`TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO
TRATAMENTO ODONTOLÓGICO

Eu, {{paciente}}, CPF {{cpf}}, nascido(a) em {{nascimento}}, residente em {{endereco}}, telefone {{telefone}}{{representacao}}, declaro que fui informado(a) de forma clara pelo(a) {{dentista}} (CRO {{cro}}), da {{clinica}}, sobre o tratamento proposto:

Procedimento(s): {{procedimento}}
Dente(s)/região: {{dentes}}

Declaro que me foram explicados os objetivos do tratamento, as alternativas existentes (inclusive a de não realizar o tratamento), os benefícios esperados, os possíveis riscos e desconfortos (como sensibilidade, dor, edema, sangramento e reações à anestesia local), o tempo estimado e os cuidados que devo ter durante e após o tratamento.

Estou ciente de que a Odontologia não é uma ciência exata e que o resultado depende também da resposta do meu organismo e do cumprimento das orientações recebidas, como comparecer às consultas, manter a higiene bucal e seguir as prescrições.

Informei com veracidade meu histórico de saúde, medicamentos em uso e alergias, e me comprometo a comunicar qualquer alteração.

Tive a oportunidade de fazer perguntas, que foram respondidas de forma satisfatória. Sei que posso revogar este consentimento a qualquer momento antes da realização do procedimento.

Autorizo a realização do tratamento descrito acima.

{{cidade}}, {{data_extenso}}.` },

  { id:'t-cirurgia', ordem:2, nome:'Exodontia / cirurgia oral', texto:
`TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO
EXODONTIA / CIRURGIA ORAL

Eu, {{paciente}}, CPF {{cpf}}, nascido(a) em {{nascimento}}, residente em {{endereco}}, telefone {{telefone}}{{representacao}}, autorizo o(a) {{dentista}} (CRO {{cro}}), da {{clinica}}, a realizar o seguinte procedimento cirúrgico:

Procedimento: {{procedimento}}
Dente(s)/região: {{dentes}}

Fui informado(a) de que o procedimento é realizado com anestesia local e de que podem ocorrer, entre outros: dor, inchaço, hematoma, sangramento, limitação de abertura de boca, alveolite (infecção do local), comunicação buco-sinusal (em dentes superiores) e alteração temporária ou, raramente, permanente da sensibilidade de lábio, queixo ou língua (parestesia), especialmente em dentes inclusos ou próximos a nervos.

Comprometo-me a seguir as orientações pós-operatórias recebidas, tomar a medicação prescrita, não fumar nem ingerir bebidas alcoólicas no período indicado e comparecer ao retorno para remoção de pontos e avaliação.

Declaro que informei corretamente meu histórico de saúde, uso de medicamentos (em especial anticoagulantes) e alergias.

Tive a oportunidade de esclarecer minhas dúvidas e autorizo a realização do procedimento.

{{cidade}}, {{data_extenso}}.` },

  { id:'t-endo', ordem:3, nome:'Tratamento endodôntico (canal)', texto:
`TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO
TRATAMENTO ENDODÔNTICO (CANAL)

Eu, {{paciente}}, CPF {{cpf}}, nascido(a) em {{nascimento}}, residente em {{endereco}}, telefone {{telefone}}{{representacao}}, autorizo o(a) {{dentista}} (CRO {{cro}}), da {{clinica}}, a realizar tratamento endodôntico no(s) dente(s) {{dentes}}.

Fui informado(a) de que o tratamento pode exigir mais de uma sessão; de que pode haver dor ou desconforto entre as sessões; de que, em alguns casos, pode ocorrer fratura de instrumento, perfuração, calcificação ou anatomia que impeça a conclusão, sendo necessário encaminhamento, cirurgia complementar ou extração; e de que, após o canal, o dente precisa ser restaurado definitivamente (restauração, pino e/ou coroa) para não fraturar.

Estou ciente de que a restauração definitiva não está incluída neste procedimento, salvo quando informado no orçamento.

Tive a oportunidade de esclarecer minhas dúvidas e autorizo a realização do tratamento.

{{cidade}}, {{data_extenso}}.` },

  { id:'t-clareamento', ordem:4, nome:'Clareamento dental', texto:
`TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO
CLAREAMENTO DENTAL

Eu, {{paciente}}, CPF {{cpf}}, nascido(a) em {{nascimento}}, residente em {{endereco}}, telefone {{telefone}}{{representacao}}, autorizo o(a) {{dentista}} (CRO {{cro}}), da {{clinica}}, a realizar clareamento dental pela técnica: {{procedimento}}.

Fui informado(a) de que o resultado varia de pessoa para pessoa e não pode ser garantido em tons exatos; de que restaurações, coroas e facetas existentes não clareiam e podem precisar ser trocadas depois; de que é comum ocorrer sensibilidade dentária e irritação gengival temporárias; e de que devo seguir as orientações de uso da moldeira e de dieta durante o tratamento.

Estou ciente de que gestantes e lactantes não devem realizar o procedimento e declaro não estar nessas condições.

Tive a oportunidade de esclarecer minhas dúvidas e autorizo a realização do tratamento.

{{cidade}}, {{data_extenso}}.` },

  { id:'t-implante', ordem:5, nome:'Implante dentário', texto:
`TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO
IMPLANTE DENTÁRIO

Eu, {{paciente}}, CPF {{cpf}}, nascido(a) em {{nascimento}}, residente em {{endereco}}, telefone {{telefone}}{{representacao}}, autorizo o(a) {{dentista}} (CRO {{cro}}), da {{clinica}}, a realizar a instalação de implante(s) dentário(s) na(s) região(ões): {{dentes}}.
Procedimento(s): {{procedimento}}

Fui informado(a) de que o tratamento envolve cirurgia sob anestesia local e um período de cicatrização antes da prótese; de que podem ocorrer dor, inchaço, hematoma, infecção, alteração de sensibilidade e, em alguns casos, a não integração do implante ao osso, sendo necessária sua remoção e nova tentativa; e de que pode ser preciso enxerto ósseo ou outros procedimentos complementares.

Estou ciente de que fumo, diabetes descontrolado, falta de higiene e falta de retornos aumentam o risco de perda do implante, e me comprometo a seguir as orientações e a fazer as manutenções periódicas.

Tive a oportunidade de esclarecer minhas dúvidas e autorizo a realização do tratamento.

{{cidade}}, {{data_extenso}}.` },

  { id:'t-plano', ordem:6, nome:'Aprovação do plano de tratamento e orçamento', texto:
`APROVAÇÃO DO PLANO DE TRATAMENTO E ORÇAMENTO

Eu, {{paciente}}, CPF {{cpf}}, nascido(a) em {{nascimento}}, residente em {{endereco}}, telefone {{telefone}}{{representacao}}, declaro que recebi e compreendi o plano de tratamento e o orçamento apresentados pelo(a) {{dentista}} (CRO {{cro}}) da {{clinica}}:

{{procedimento}}

Estou ciente das condições de pagamento, de que o plano pode precisar de ajustes caso surjam situações não previstas no exame inicial (que serão informadas e orçadas previamente) e de que o abandono do tratamento pode comprometer os resultados.

Aprovo o plano de tratamento e o orçamento acima.

{{cidade}}, {{data_extenso}}.` },

  { id:'t-imagem', ordem:7, nome:'Autorização de uso de imagem', texto:
`AUTORIZAÇÃO DE USO DE IMAGEM

Eu, {{paciente}}, CPF {{cpf}}, nascido(a) em {{nascimento}}, residente em {{endereco}}, telefone {{telefone}}{{representacao}}, autorizo a {{clinica}} a registrar fotografias e imagens do meu tratamento odontológico e a utilizá-las:

( ) apenas no meu prontuário e para fins clínicos
( ) em publicações científicas e aulas, sem identificação do meu rosto
( ) nas redes sociais e materiais de divulgação da clínica, sem identificação do meu rosto
( ) nas redes sociais e materiais de divulgação da clínica, inclusive com o meu rosto

A autorização é gratuita e pode ser revogada a qualquer momento, por escrito, sem efeito sobre o material já publicado até a data da revogação. Meus dados serão tratados conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).

{{cidade}}, {{data_extenso}}.` },

  { id:'t-recusa', ordem:8, nome:'Recusa de tratamento', texto:
`TERMO DE RECUSA DE TRATAMENTO

Eu, {{paciente}}, CPF {{cpf}}, nascido(a) em {{nascimento}}, residente em {{endereco}}, telefone {{telefone}}{{representacao}}, declaro que fui orientado(a) pelo(a) {{dentista}} (CRO {{cro}}), da {{clinica}}, sobre a necessidade do seguinte tratamento:

{{procedimento}} — dente(s)/região: {{dentes}}

e sobre os riscos de não realizá-lo, como dor, infecção, perda do dente e agravamento do quadro.

Mesmo assim, por decisão própria, opto por NÃO realizar o tratamento neste momento, isentando o(a) profissional e a clínica das consequências desta decisão.

{{cidade}}, {{data_extenso}}.` }
];
