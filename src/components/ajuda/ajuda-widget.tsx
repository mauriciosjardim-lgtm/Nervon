import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { buscarFaq, FAQ, type FaqItem } from "@/lib/ajuda/faq";
import { MessageQuestion, CloseCircle, Send2, ArrowRight2, MagicStar } from "iconsax-react";

interface Msg {
  from: "user" | "bot";
  texto?: string;
  item?: FaqItem;
  relacionados?: FaqItem[];
  semResposta?: boolean;
}

// perguntas iniciais sugeridas (ids da FAQ)
const SUGESTOES_INICIAIS = ["criar-contrato", "convidar-membro", "criar-projeto", "dados-empresa-contrato"];

export function AjudaWidget() {
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, aberto]);

  const responder = (pergunta: string) => {
    const texto = pergunta.trim();
    if (!texto) return;
    const matches = buscarFaq(texto);
    const userMsg: Msg = { from: "user", texto };
    let botMsg: Msg;
    if (matches.length === 0) {
      botMsg = { from: "bot", semResposta: true, relacionados: SUGESTOES_INICIAIS.map(id => FAQ.find(f => f.id === id)!).filter(Boolean) };
    } else {
      botMsg = { from: "bot", item: matches[0].item, relacionados: matches.slice(1).map(m => m.item) };
    }
    setMsgs(m => [...m, userMsg, botMsg]);
    setInput("");
  };

  const enviar = (e: React.FormEvent) => { e.preventDefault(); responder(input); };

  const sugestoesIniciais = SUGESTOES_INICIAIS.map(id => FAQ.find(f => f.id === id)!).filter(Boolean);

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setAberto(v => !v)}
        aria-label="Ajuda"
        className="fixed bottom-5 right-5 z-50 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105 hover:bg-primary-glow"
      >
        {aberto
          ? <CloseCircle size={22} color="currentColor" variant="Linear" />
          : <MessageQuestion size={22} color="currentColor" variant="Bold" />}
      </button>

      {/* Painel */}
      {aberto && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[min(560px,75vh)] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-surface-1 shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-border/60 bg-surface-2/40 px-4 py-3">
            <div className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <MessageQuestion size={16} color="currentColor" variant="Bold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">Tira-dúvidas</p>
              <p className="text-[11px] text-muted-foreground">Respostas na hora sobre o MakersHub</p>
            </div>
            <button onClick={() => setAberto(false)} className="text-muted-foreground transition hover:text-foreground">
              <CloseCircle size={18} color="currentColor" variant="Linear" />
            </button>
          </div>

          {/* Thread */}
          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {msgs.length === 0 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <BotAvatar />
                  <div className="rounded-2xl rounded-tl-sm bg-surface-2 px-3 py-2 text-[13px]">
                    Oi! 👋 Sou o tira-dúvidas do MakersHub. Pergunte qualquer coisa sobre como usar o sistema, ou escolha um tópico:
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-9">
                  {sugestoesIniciais.map(s => (
                    <Chip key={s.id} onClick={() => responder(s.pergunta)}>{s.pergunta}</Chip>
                  ))}
                </div>
              </div>
            )}

            {msgs.map((m, i) => m.from === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-[13px] text-primary-foreground">{m.texto}</div>
              </div>
            ) : (
              <div key={i} className="flex gap-2">
                <BotAvatar />
                <div className="min-w-0 flex-1 space-y-2">
                  {m.semResposta ? (
                    <div className="rounded-2xl rounded-tl-sm bg-surface-2 px-3 py-2 text-[13px]">
                      Não encontrei uma resposta exata pra isso. Talvez um destes ajude:
                    </div>
                  ) : m.item && (
                    <div className="rounded-2xl rounded-tl-sm bg-surface-2 px-3 py-2 text-[13px] leading-relaxed">
                      {m.item.resposta.split("\n").map((p, j) => <p key={j} className={j > 0 ? "mt-1.5" : ""}>{p}</p>)}
                      {m.item.rota && (
                        <button
                          onClick={() => { navigate({ to: m.item!.rota as any }); setAberto(false); }}
                          className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-1 text-[11px] font-medium text-primary transition hover:bg-primary/25"
                        >
                          {m.item.rotaLabel ?? "Abrir"} <ArrowRight2 size={12} color="currentColor" variant="Linear" />
                        </button>
                      )}
                    </div>
                  )}
                  {m.relacionados && m.relacionados.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.relacionados.map(r => (
                        <Chip key={r.id} onClick={() => responder(r.pergunta)}>{r.pergunta}</Chip>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={fimRef} />
          </div>

          {/* Input */}
          <form onSubmit={enviar} className="flex items-center gap-2 border-t border-border/60 bg-surface-2/30 px-3 py-2.5">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Escreva sua dúvida…"
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface-1 px-3 py-2 text-[13px] outline-none transition focus:border-primary/40"
            />
            <button type="submit" disabled={!input.trim()}
              className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:bg-primary-glow disabled:opacity-40">
              <Send2 size={16} color="currentColor" variant="Bold" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function BotAvatar() {
  return (
    <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
      <MagicStar size={13} color="currentColor" variant="Bold" />
    </div>
  );
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("rounded-full border border-border/70 bg-surface-1 px-2.5 py-1 text-left text-[11px] text-foreground/80",
        "transition hover:border-primary/40 hover:text-foreground")}>
      {children}
    </button>
  );
}
