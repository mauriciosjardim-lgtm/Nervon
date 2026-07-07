-- Contratos v3 — cláusulas obrigatórias reescritas (texto jurídico real, subitens)

update contract_clauses set body =
  'De um lado, {{CONTRATADA_NOME}}, inscrita no CNPJ sob nº {{CONTRATADA_CNPJ}}, com sede em {{CONTRATADA_ENDERECO}}, doravante denominada CONTRATADA; e de outro lado, {{CLIENTE_NOME}}, portador(a) do documento {{CLIENTE_DOCUMENTO}}, com endereço em {{CLIENTE_ENDERECO}} e e-mail {{CLIENTE_EMAIL}}, doravante denominado(a) CONTRATANTE, têm entre si justo e contratado o presente instrumento, que se regerá pelas cláusulas seguintes.'
  where slug = 'qualificacao_partes';

update contract_clauses set body =
  'O presente contrato tem por objeto a prestação, pela CONTRATADA à CONTRATANTE, dos serviços de {{SERVICO_NOME}}, conforme escopo descrito: {{SERVICO_DESCRICAO}}.' || chr(10) ||
  'A prestação dos serviços não gera qualquer vínculo empregatício, societário ou de subordinação entre as partes, atuando a CONTRATADA com autonomia técnica e profissional.'
  where slug = 'objeto';

update contract_clauses set body =
  'A CONTRATADA executará os serviços descritos, entregando {{QUANTIDADE_ENTREGAVEIS}} entregável(is), conforme especificação previamente acordada entre as partes.' || chr(10) ||
  'Os entregáveis serão disponibilizados em formato digital, por meio de link ou plataforma indicada pela CONTRATADA, salvo acordo diverso.' || chr(10) ||
  'Quaisquer atividades, materiais ou demandas não previstos neste escopo serão objeto de aditivo contratual, com revisão de prazo e de valor.'
  where slug = 'escopo_entregaveis';

update contract_clauses set body =
  'Os serviços terão início em {{DATA_INICIO}}, com prazo estimado de entrega de {{PRAZO_ENTREGA}}. {{DATA_FIM}}' || chr(10) ||
  'Os prazos serão automaticamente prorrogados pelo período em que a CONTRATADA permanecer aguardando informações, materiais ou aprovações de responsabilidade da CONTRATANTE.' || chr(10) ||
  'Eventos de força maior ou caso fortuito, nos termos do art. 393 do Código Civil, suspendem a contagem dos prazos enquanto perdurarem.'
  where slug = 'prazo';

update contract_clauses set body =
  'Pela prestação dos serviços, a CONTRATANTE pagará à CONTRATADA o valor total de {{VALOR_TOTAL}}, por meio de {{FORMA_PAGAMENTO}}.' || chr(10) ||
  'Sobre o valor incidirão os tributos aplicáveis, com emissão de nota fiscal conforme a legislação vigente.' || chr(10) ||
  'O atraso no pagamento sujeitará a CONTRATANTE a multa de 2% (dois por cento) sobre o valor em aberto, juros de mora de 1% (um por cento) ao mês e correção monetária, sem prejuízo da suspensão dos serviços.'
  where slug = 'pagamento';

update contract_clauses set body =
  'Executar os serviços contratados com zelo, técnica e qualidade profissional, cumprindo os prazos pactuados.' || chr(10) ||
  'Manter a CONTRATANTE informada sobre o andamento dos trabalhos e comunicar prontamente fatos que impeçam ou alterem a execução.' || chr(10) ||
  'Observar a legislação aplicável e manter sigilo sobre as informações e materiais recebidos da CONTRATANTE.'
  where slug = 'obrigacoes_contratada';

update contract_clauses set body =
  'Fornecer, em tempo hábil, as informações, materiais, acessos e aprovações necessárias à execução dos serviços.' || chr(10) ||
  'Responsabilizar-se pela veracidade, legalidade e titularidade dos materiais e conteúdos fornecidos à CONTRATADA.' || chr(10) ||
  'Efetuar os pagamentos nas datas e condições acordadas, sob pena de suspensão dos trabalhos.'
  where slug = 'obrigacoes_contratante';

update contract_clauses set body =
  'O presente contrato poderá ser rescindido por qualquer das partes, imotivadamente, mediante notificação prévia por escrito com antecedência mínima de 15 (quinze) dias.' || chr(10) ||
  'A rescisão por descumprimento de cláusula poderá ocorrer de imediato, mediante notificação, caso a parte infratora não sane a falha no prazo de 5 (cinco) dias úteis.' || chr(10) ||
  'Em qualquer hipótese de rescisão, serão devidos os valores correspondentes aos serviços efetivamente executados até a data do encerramento.'
  where slug = 'rescisao';

update contract_clauses set body =
  'Fica eleito o foro da comarca de {{CIDADE_FORO}} para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.'
  where slug = 'foro';
