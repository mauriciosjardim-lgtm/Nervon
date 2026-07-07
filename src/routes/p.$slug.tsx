import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { gerarHtmlProposta } from "@/lib/proposta-html";
import { obterPropostaPublica } from "@/lib/propostas";
export const Route = createFileRoute("/p/$slug")({ ssr: false, component: PropostaPublica });
function PropostaPublica() {
  const { slug } = Route.useParams(); const [html, setHtml] = useState<string>(); const [erro, setErro] = useState(false);
  useEffect(() => { obterPropostaPublica(slug).then(d => d ? setHtml(gerarHtmlProposta(d)) : setErro(true)).catch(() => setErro(true)); }, [slug]);
  if (erro) return <div className="grid min-h-screen place-items-center bg-[#08090a] px-6 text-center text-white"><div><p className="text-6xl font-bold text-[#A3FF2B]">404</p><h1 className="mt-4 text-xl font-semibold">Proposta indisponível</h1><p className="mt-2 text-sm text-zinc-400">Este link não existe ou foi desativado.</p></div></div>;
  if (!html) return <div className="grid min-h-screen place-items-center bg-[#08090a]"><div className="size-6 animate-spin rounded-full border-2 border-[#A3FF2B] border-t-transparent"/></div>;
  return <iframe title="Proposta comercial" srcDoc={html} className="fixed inset-0 h-full w-full border-0 bg-[#08090a]"/>;
}
