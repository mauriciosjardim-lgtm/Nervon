import { useEffect, useRef, useState } from "react";
import { Copy, TickCircle } from "iconsax-react";
import { checarPix } from "@/lib/api/asaas.functions";

type Charge = { id: string; brCode: string; brCodeBase64: string; expiresAt: string; invoiceUrl?: string; qrErro?: string | null };

const PAGO = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);
const MORTO = new Set(["OVERDUE", "REFUNDED", "DELETED", "CANCELLED"]);

// Mostra o QR Code Pix + copia-e-cola e fica consultando o status até pagar.
// Chama onPaid() uma única vez quando o pagamento é confirmado.
// Só mostramos o cronômetro quando a expiração está próxima (< 2h). O Asaas
// devolve uma validade longa, então nesse caso exibimos só "Aguardando".
const LIMITE_CONTADOR = 2 * 3600;

export function PixBox({ charge, onPaid }: { charge: Charge; onPaid: () => void }) {
  const expiraEm = new Date(charge.expiresAt).getTime();
  const segIniciais = Number.isFinite(expiraEm)
    ? Math.floor((expiraEm - Date.now()) / 1000)
    : NaN;
  const temContador = Number.isFinite(segIniciais) && segIniciais > 0 && segIniciais <= LIMITE_CONTADOR;

  const [copiado, setCopiado] = useState(false);
  const [restante, setRestante] = useState<number>(temContador ? segIniciais : 0);
  const [expirado, setExpirado] = useState(false);
  const pago = useRef(false);

  // Polling do status a cada 4s.
  useEffect(() => {
    let ativo = true;
    const tick = async () => {
      if (!ativo || pago.current) return;
      try {
        const { status } = await checarPix({ data: { id: charge.id } });
        if (PAGO.has(status) && !pago.current) {
          pago.current = true;
          onPaid();
        } else if (MORTO.has(status)) {
          setExpirado(true);
        }
      } catch {
        /* tenta de novo no próximo tick */
      }
    };
    const intervalo = setInterval(tick, 4000);
    tick();
    return () => { ativo = false; clearInterval(intervalo); };
  }, [charge.id]);

  // Contagem regressiva — só quando há prazo curto.
  useEffect(() => {
    if (!temContador) return;
    const t = setInterval(() => {
      const seg = Math.max(0, Math.floor((expiraEm - Date.now()) / 1000));
      setRestante(seg);
      if (seg === 0) setExpirado(true);
    }, 1000);
    return () => clearInterval(t);
  }, [temContador, expiraEm]);

  const copiar = async () => {
    await navigator.clipboard.writeText(charge.brCode);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const mm = String(Math.floor(restante / 60)).padStart(2, "0");
  const ss = String(restante % 60).padStart(2, "0");

  const semQr = !charge.brCodeBase64;

  return (
    <div className="flex flex-col items-center text-center">
      {semQr ? (
        // QR Code indisponível (ex.: conta Asaas sem chave Pix) → paga pela página segura
        <div className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-medium text-white">QR Code indisponível no momento</p>
          <p className="mt-1 text-xs text-white/45">Conclua o pagamento na página segura do Asaas:</p>
          {charge.invoiceUrl ? (
            <a
              href={charge.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#90F826] px-4 py-3 text-sm font-semibold text-[#0d0f0a] transition hover:opacity-90"
            >
              Abrir página de pagamento →
            </a>
          ) : (
            <p className="mt-3 text-xs text-red-400">Não foi possível gerar o link. Tente novamente.</p>
          )}
          <p className="mt-3 text-[11px] text-white/35">Esta tela libera seu acesso automaticamente assim que o pagamento for confirmado.</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-white p-3 shadow-lg">
            <img src={charge.brCodeBase64} alt="QR Code Pix" className="h-52 w-52" />
          </div>

          <p className="mt-5 text-sm font-medium text-white">Escaneie o QR Code com o app do seu banco</p>
          <p className="mt-1 text-xs text-white/45">ou use o Pix copia-e-cola abaixo</p>

          <button
            onClick={copiar}
            className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:bg-white/[0.07]"
          >
            <span className="truncate text-xs text-white/60">{charge.brCode}</span>
            <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#90F826]">
              {copiado ? <TickCircle size={15} color="#90F826" variant="Bold" /> : <Copy size={15} color="#90F826" variant="Linear" />}
              {copiado ? "Copiado" : "Copiar"}
            </span>
          </button>
        </>
      )}

      <div className="mt-5 flex items-center gap-2 text-xs text-white/50">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#90F826]/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#90F826]" />
        </span>
        {expirado
          ? "Pix expirado — gere um novo"
          : temContador
          ? `Aguardando pagamento · expira em ${mm}:${ss}`
          : "Aguardando pagamento…"}
      </div>
    </div>
  );
}
