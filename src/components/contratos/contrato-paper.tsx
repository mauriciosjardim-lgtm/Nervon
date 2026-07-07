// Renderiza o contrato em estilo "documento" a partir do HTML do motor.
// O HTML vem do banco (rendered_html) e pode ter sido adulterado via API —
// SEMPRE passa pelo sanitizador de allowlist antes de ir pro DOM.

import { useMemo } from "react";
import { sanitizeContractHtml } from "@/lib/sanitize-contract";

export function ContratoPaper({
  titulo, numero, html,
}: {
  titulo: string;
  numero?: number | null;
  html: string;
}) {
  const safeHtml = useMemo(() => sanitizeContractHtml(html), [html]);
  return (
    <div className="mx-auto max-w-[820px] rounded-2xl border border-border bg-[#fafaf8] px-8 py-10 text-[#1a1a1a] shadow-xl md:px-14 md:py-14">
      <div className="mb-8 text-center">
        <h1 className="font-display text-xl font-bold uppercase tracking-wide">{titulo}</h1>
        {numero != null && (
          <p className="mt-1 text-xs text-neutral-500">Contrato nº {String(numero).padStart(4, "0")}</p>
        )}
      </div>
      <div
        className="mh-contrato text-[13.5px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
      <style>{`
        .mh-contrato .mh-clause { break-inside: avoid; margin-bottom: 18px; }
        .mh-contrato h3 { font-weight: 700; font-size: 12.5px; margin: 0 0 8px; letter-spacing: .03em; color: #111; }
        .mh-contrato .mh-sub { margin: 0 0 6px; text-align: justify; padding-left: 1.9em; text-indent: -1.9em; }
        .mh-contrato .mh-num { font-weight: 600; display: inline-block; min-width: 1.7em; }
        .mh-contrato .mh-sign { margin: 0; white-space: pre-wrap; }
      `}</style>
    </div>
  );
}
