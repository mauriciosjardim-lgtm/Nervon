-- Contratos v2 — dados da empresa (emitente/CONTRATADA) + subcláusulas

-- 1. Dados da empresa para emissão de contratos
alter table empresas
  add column if not exists razao_social text,
  add column if not exists cnpj         text,
  add column if not exists endereco     text,
  add column if not exists cidade       text,
  add column if not exists estado       text,
  add column if not exists cep          text;

-- 2. Enriquece cláusulas com subitens (parágrafos separados por chr(10))
update contract_clauses set body =
  'A CONTRATADA executará os serviços descritos, entregando {{QUANTIDADE_ENTREGAVEIS}} entregável(is), conforme especificação acordada entre as partes.' || chr(10) ||
  'Atividades não previstas neste escopo serão objeto de aditivo contratual, com revisão de prazo e valor.'
  where slug = 'escopo_entregaveis';

update contract_clauses set body =
  'Executar os serviços contratados com zelo, técnica e qualidade profissional, cumprindo os prazos pactuados.' || chr(10) ||
  'Comunicar à CONTRATANTE eventuais fatos que impeçam ou alterem a execução, mantendo-a informada sobre o andamento dos trabalhos.'
  where slug = 'obrigacoes_contratada';

update contract_clauses set body =
  'Fornecer, em tempo hábil, as informações, materiais e aprovações necessárias à execução dos serviços.' || chr(10) ||
  'Efetuar os pagamentos nas datas e condições acordadas, sob pena de suspensão dos trabalhos.'
  where slug = 'obrigacoes_contratante';

update contract_clauses set body =
  'Pela prestação dos serviços, a CONTRATANTE pagará à CONTRATADA o valor total de {{VALOR_TOTAL}}, por meio de {{FORMA_PAGAMENTO}}.' || chr(10) ||
  'O atraso no pagamento sujeitará a CONTRATANTE a multa de 2% (dois por cento) e juros de 1% (um por cento) ao mês sobre o valor em aberto.'
  where slug = 'pagamento';
