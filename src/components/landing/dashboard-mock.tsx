// Mock visual do dashboard usado na landing (/) e na página de vendas (/lp).
// Fica em arquivo próprio para o /lp não puxar a landing-page inteira pro
// bundle inicial (a landing é carregada sob demanda pelo __root e /home).
export function DashboardMock() {
  return (
    <div className="relative mx-auto mt-16 max-w-6xl md:mt-20">
      <div className="absolute inset-x-10 -top-10 h-40 rounded-full bg-[#90F826]/25 blur-[100px]" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <div className="overflow-hidden rounded-xl bg-[#101015]">
          {/* fake window chrome */}
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
            <div className="size-2.5 rounded-full bg-white/15" />
            <div className="size-2.5 rounded-full bg-white/15" />
            <div className="size-2.5 rounded-full bg-white/15" />
            <div className="ml-3 h-5 flex-1 rounded-md bg-white/[0.04]" />
          </div>

          <div className="grid grid-cols-12 gap-3 p-4">
            {/* sidebar */}
            <div className="col-span-2 hidden flex-col gap-2 md:flex">
              {["Dashboard","Comercial","Projetos","Agenda","Financeiro","Biblioteca"].map((l, i) => (
                <div key={l} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${i===0?"bg-[#90F826]/15 text-[#c8ff8a]":"text-white/45"}`}>
                  <div className={`size-1.5 rounded-full ${i===0?"bg-[#90F826]":"bg-white/30"}`} />
                  {l}
                </div>
              ))}
            </div>
            {/* main */}
            <div className="col-span-12 md:col-span-10">
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Boa tarde, Marina.</div>
                  <div className="text-[11px] text-white/40">Workspace · Estúdio Praia Filmes</div>
                </div>
                <div className="hidden text-[11px] text-white/45 md:block">Junho · 2026</div>
              </div>

              {/* kpis */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { l: "Faturado", v: "R$ 184.200", d: "+12%" },
                  { l: "Em produção", v: "8 projetos", d: "3 entregas" },
                  { l: "Pipeline", v: "R$ 312.000", d: "11 leads" },
                  { l: "A receber", v: "R$ 92.400", d: "30 dias" },
                ].map(k => (
                  <div key={k.l} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <div className="text-[10px] uppercase tracking-wider text-white/40">{k.l}</div>
                    <div className="mt-1 font-display text-base font-semibold text-white">{k.v}</div>
                    <div className="mt-0.5 text-[10px] text-[#90F826]">{k.d}</div>
                  </div>
                ))}
              </div>

              {/* chart + funnel */}
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 md:col-span-2">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-[11px] font-medium text-white/70">Receita do mês</div>
                    <div className="text-[10px] text-white/40">vs anterior</div>
                  </div>
                  <svg viewBox="0 0 320 100" className="h-24 w-full">
                    <defs>
                      <linearGradient id="mh-chart-grad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#90F826" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#90F826" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,80 L40,72 L80,60 L120,68 L160,48 L200,55 L240,30 L280,38 L320,18 L320,100 L0,100 Z" fill="url(#mh-chart-grad)" />
                    <path d="M0,80 L40,72 L80,60 L120,68 L160,48 L200,55 L240,30 L280,38 L320,18" fill="none" stroke="#90F826" strokeWidth="1.5" />
                  </svg>
                </div>
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="mb-2 text-[11px] font-medium text-white/70">Funil comercial</div>
                  <div className="space-y-1.5">
                    {[
                      { l: "Novos", w: "92%" },
                      { l: "Qualificados", w: "70%" },
                      { l: "Proposta", w: "48%" },
                      { l: "Fechados", w: "28%" },
                    ].map(s => (
                      <div key={s.l}>
                        <div className="flex justify-between text-[10px] text-white/50">
                          <span>{s.l}</span><span>{s.w}</span>
                        </div>
                        <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                          <div className="h-full rounded-full bg-[#90F826]" style={{ width: s.w }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
