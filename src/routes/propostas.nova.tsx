import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Film, CalendarDays, Mic2, Camera, Scissors, Plus, Aperture, PartyPopper } from "lucide-react";
import { criarProposta } from "@/lib/propostas";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/propostas/nova")({ component: EscolherProposta });

const tipos = [
  { id:"institucional", titulo:"Vídeo Institucional", texto:"Conte a história, os diferenciais e a essência de uma marca.", icon:Film, ativo:true },
  { id:"mensal", titulo:"Conteúdo Mensal", texto:"Apresente planos recorrentes para redes sociais.", icon:CalendarDays, ativo:true },
  { id:"podcast", titulo:"Podcast", texto:"Captação, edição e publicação de episódios.", icon:Mic2, ativo:true },
  { id:"evento", titulo:"Evento", texto:"Equipe, cobertura e entregas para eventos corporativos, sociais ou shows.", icon:PartyPopper, ativo:true },
  { id:"captacao", titulo:"Captação", texto:"Equipe e estrutura para uma diária de produção.", icon:Camera, ativo:true },
  { id:"edicao", titulo:"Edição", texto:"Pós-produção, motion, cor e versões finais.", icon:Scissors, ativo:true },
  { id:"fotografia", titulo:"Fotografia", texto:"Ensaio ou cobertura fotográfica com direção de arte.", icon:Aperture, ativo:true },
  { id:"custom", titulo:"Projeto Personalizado", texto:"Monte uma proposta totalmente do zero.", icon:Plus, ativo:true },
];

function EscolherProposta(){
  const navigate=useNavigate(); const [criando,setCriando]=useState("");
  const iniciar=async(tipo:string)=>{setCriando(tipo);try{const p=await criarProposta();navigate({to:"/propostas/$id",params:{id:p.id},search:{tipo} as never})}catch(e:any){toast.error(e.message);setCriando("")}};
  return <div className="mx-auto max-w-6xl px-5 py-8 md:px-8"><Link to="/propostas" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5"/>Voltar</Link><header className="mb-10 mt-8 text-center"><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-primary">Propostas que vendem o projeto</p><h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">O que você quer apresentar hoje?</h1><p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Escolha um formato e o MakersHub prepara a estrutura certa, com a linguagem de quem vive produção audiovisual.</p></header><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tipos.map(t=><button key={t.id} disabled={!t.ativo||!!criando} onClick={()=>iniciar(t.id)} className={`group relative min-h-48 rounded-2xl border p-6 text-left transition ${t.ativo?"border-border/60 bg-surface-1/50 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_12px_40px_-18px_var(--primary)]":"cursor-not-allowed border-dashed border-border/40 bg-surface-1/20 opacity-45"}`}><span className={`grid size-12 place-items-center rounded-xl ${t.ativo?"bg-primary/10 text-primary ring-1 ring-primary/20":"bg-surface-2 text-muted-foreground"}`}><t.icon className="size-5"/></span><h2 className="mt-5 font-display text-lg font-semibold">{t.titulo}</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.texto}</p><span className="absolute bottom-5 right-5 text-[10px] font-semibold uppercase tracking-wider text-primary">{criando===t.id?"Preparando…":t.ativo?"Começar →":"Em breve"}</span></button>)}</div></div>
}
