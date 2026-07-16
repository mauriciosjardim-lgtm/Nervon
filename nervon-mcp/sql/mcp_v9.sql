-- MakersHub MCP v9 — workspace operacional de Projetos

create or replace function public._mcp_recalcular_progresso(p_empresa uuid, p_projeto uuid)
returns int language plpgsql security definer set search_path = public as $$
declare v_fases text[]; v_progresso int;
begin
  select fases into v_fases from public.projetos where id=p_projeto and empresa_id=p_empresa;
  if v_fases is null then return 0; end if;
  select coalesce(round(avg(case
    when concluida or status='concluida' then 100
    when array_position(v_fases,status) is null then 0
    else ((array_position(v_fases,status)-1)::numeric / greatest(cardinality(v_fases)-1,1)) * 100
  end)),0)::int into v_progresso
  from public.tarefas where projeto_id=p_projeto and empresa_id=p_empresa;
  update public.projetos set progresso=v_progresso where id=p_projeto and empresa_id=p_empresa;
  return v_progresso;
end $$;

create or replace function public.mcp_obter_projeto(p_token_hash text, p_projeto_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_empresa uuid; v_result jsonb;
begin
  v_empresa:=public._mcp_empresa(p_token_hash);
  if v_empresa is null then return jsonb_build_object('ok',false,'erro','Token inválido ou revogado.'); end if;
  select jsonb_build_object(
    'id',p.id,'nome',p.nome,'cliente',p.cliente,'descricao',p.descricao,'fase',p.fase,
    'progresso',public._mcp_recalcular_progresso(v_empresa,p.id),'fases',p.fases,'equipe',p.equipe,
    'data_inicio',p.data_inicio,'data_entrega',p.data_entrega,'cor',p.cor,'notas',p.notas,
    'tarefas',(select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'titulo',t.titulo,'descricao',t.descricao,'etapa',t.status,'concluida',t.concluida,'responsavel',t.responsavel,'prazo',t.prazo,'prioridade',t.prioridade,'link',t.link) order by t.prazo nulls last,t.criado_em),'[]'::jsonb) from public.tarefas t where t.projeto_id=p.id and t.empresa_id=v_empresa),
    'marcos',(select coalesce(jsonb_agg(to_jsonb(m) - 'empresa_id' - 'projeto_id' order by m.data),'[]'::jsonb) from public.marcos m where m.projeto_id=p.id and m.empresa_id=v_empresa),
    'entregaveis',(select coalesce(jsonb_agg(to_jsonb(e) - 'empresa_id' - 'projeto_id' order by e.criado_em),'[]'::jsonb) from public.entregaveis e where e.projeto_id=p.id and e.empresa_id=v_empresa)
  ) into v_result from public.projetos p where p.id=p_projeto_id and p.empresa_id=v_empresa;
  if v_result is null then return jsonb_build_object('ok',false,'erro','Projeto não encontrado nesta empresa.'); end if;
  return jsonb_build_object('ok',true,'projeto',v_result);
end $$;

create or replace function public.mcp_criar_tarefa_projeto(
  p_token_hash text,p_projeto_id uuid,p_titulo text,p_etapa text default null,
  p_responsavel text default 'Agente IA',p_prazo timestamptz default null,
  p_prioridade text default 'media',p_descricao text default null,p_link text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_empresa uuid; v_id uuid; v_fases text[]; v_etapa text; v_progresso int;
begin
  v_empresa:=public._mcp_empresa(p_token_hash);
  if v_empresa is null then return jsonb_build_object('ok',false,'erro','Token inválido ou revogado.'); end if;
  select fases into v_fases from public.projetos where id=p_projeto_id and empresa_id=v_empresa;
  if v_fases is null then return jsonb_build_object('ok',false,'erro','Projeto não encontrado nesta empresa.'); end if;
  v_etapa:=coalesce(p_etapa,v_fases[1]);
  if not (v_etapa=any(v_fases)) then return jsonb_build_object('ok',false,'erro','Etapa inválida para este projeto.','etapas_disponiveis',v_fases); end if;
  if p_prioridade not in ('baixa','media','alta','urgente') then return jsonb_build_object('ok',false,'erro','Prioridade inválida.'); end if;
  insert into public.tarefas(empresa_id,projeto_id,titulo,descricao,status,concluida,responsavel,prazo,prioridade,link)
  values(v_empresa,p_projeto_id,trim(p_titulo),p_descricao,v_etapa,false,coalesce(nullif(trim(p_responsavel),''),'Agente IA'),p_prazo,p_prioridade,p_link)
  returning id into v_id;
  v_progresso:=public._mcp_recalcular_progresso(v_empresa,p_projeto_id);
  return jsonb_build_object('ok',true,'tarefa_id',v_id,'projeto_id',p_projeto_id,'titulo',trim(p_titulo),'etapa',v_etapa,'progresso_projeto',v_progresso);
end $$;

create or replace function public.mcp_listar_tarefas_projeto(p_token_hash text,p_projeto_id uuid default null,p_etapa text default null,p_apenas_pendentes boolean default false)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_empresa uuid; v_result jsonb;
begin
  v_empresa:=public._mcp_empresa(p_token_hash);
  if v_empresa is null then return jsonb_build_object('ok',false,'erro','Token inválido ou revogado.'); end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'projeto_id',p.id,'projeto',p.nome,'cliente',p.cliente,'cor',p.cor,'titulo',t.titulo,'descricao',t.descricao,'etapa',t.status,'concluida',t.concluida,'responsavel',t.responsavel,'prazo',t.prazo,'prioridade',t.prioridade,'link',t.link) order by t.prazo nulls last,t.criado_em),'[]'::jsonb)
  into v_result from public.tarefas t join public.projetos p on p.id=t.projeto_id
  where t.empresa_id=v_empresa and (p_projeto_id is null or t.projeto_id=p_projeto_id) and (p_etapa is null or t.status=p_etapa) and (not p_apenas_pendentes or not t.concluida);
  return jsonb_build_object('ok',true,'tarefas',v_result);
end $$;

create or replace function public.mcp_atualizar_tarefa_projeto(
  p_token_hash text,p_tarefa_id uuid,p_titulo text default null,p_etapa text default null,
  p_concluida boolean default null,p_responsavel text default null,p_prazo timestamptz default null,
  p_prioridade text default null,p_descricao text default null,p_link text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_empresa uuid; v_projeto uuid; v_fases text[]; v_ok int; v_progresso int;
begin
  v_empresa:=public._mcp_empresa(p_token_hash);
  if v_empresa is null then return jsonb_build_object('ok',false,'erro','Token inválido ou revogado.'); end if;
  select t.projeto_id,p.fases into v_projeto,v_fases from public.tarefas t join public.projetos p on p.id=t.projeto_id where t.id=p_tarefa_id and t.empresa_id=v_empresa;
  if v_projeto is null then return jsonb_build_object('ok',false,'erro','Tarefa não encontrada nesta empresa.'); end if;
  if p_etapa is not null and not (p_etapa=any(v_fases)) then return jsonb_build_object('ok',false,'erro','Etapa inválida para este projeto.','etapas_disponiveis',v_fases); end if;
  if p_prioridade is not null and p_prioridade not in ('baixa','media','alta','urgente') then return jsonb_build_object('ok',false,'erro','Prioridade inválida.'); end if;
  update public.tarefas set
    titulo=coalesce(p_titulo,titulo),status=case when p_concluida=true then 'concluida' else coalesce(p_etapa,status) end,
    concluida=case when p_etapa='concluida' then true else coalesce(p_concluida,concluida) end,
    responsavel=coalesce(p_responsavel,responsavel),prazo=coalesce(p_prazo,prazo),prioridade=coalesce(p_prioridade,prioridade),
    descricao=coalesce(p_descricao,descricao),link=coalesce(p_link,link)
  where id=p_tarefa_id and empresa_id=v_empresa;
  get diagnostics v_ok=row_count;
  v_progresso:=public._mcp_recalcular_progresso(v_empresa,v_projeto);
  return jsonb_build_object('ok',v_ok=1,'tarefa_id',p_tarefa_id,'projeto_id',v_projeto,'progresso_projeto',v_progresso);
end $$;

create or replace function public.mcp_concluir_tarefa_projeto(p_token_hash text,p_tarefa_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  return public.mcp_atualizar_tarefa_projeto(p_token_hash,p_tarefa_id,null,null,true,null,null,null,null,null);
end $$;

grant execute on function public.mcp_obter_projeto(text,uuid) to anon,authenticated;
grant execute on function public.mcp_criar_tarefa_projeto(text,uuid,text,text,text,timestamptz,text,text,text) to anon,authenticated;
grant execute on function public.mcp_listar_tarefas_projeto(text,uuid,text,boolean) to anon,authenticated;
grant execute on function public.mcp_atualizar_tarefa_projeto(text,uuid,text,text,boolean,text,timestamptz,text,text,text) to anon,authenticated;
grant execute on function public.mcp_concluir_tarefa_projeto(text,uuid) to anon,authenticated;
revoke execute on function public._mcp_recalcular_progresso(uuid,uuid) from anon,authenticated;
