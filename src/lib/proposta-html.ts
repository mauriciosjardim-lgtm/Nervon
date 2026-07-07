import templateOriginal from "@/assets/proposta-publica-template.html?raw";

/**
 * Fonte única da proposta: o template aprovado.
 * Prévia, link público e download offline passam sempre por esta função.
 */
export function gerarHtmlProposta(snapshot: Record<string, any>): string {
  const dados = JSON.stringify(snapshot).replace(/</g, "\\u003c");

  return templateOriginal
    // O seletor existe apenas no arquivo de demonstração, nunca na proposta real.
    .replace(
      "</head>",
      `<style>.seletor-acento{display:none!important}</style></head>`,
    )
    // Fontes externas impediriam que o arquivo fosse realmente offline.
    // As famílias já possuem fallbacks seguros no CSS original.
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.(?:googleapis|gstatic)\.com"[^>]*>\s*/g, "")
    .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/g, "")
    // O objeto de exemplo continua no template como documentação visual, porém
    // a chamada final recebe exclusivamente o snapshot congelado.
    .replace(
      "renderProposta(dadosTemplateVazio);",
      `renderProposta(${dados});`,
    );
}

export function baixarHtmlProposta(snapshot: Record<string, any>) {
  const blob = new Blob([gerarHtmlProposta(snapshot)], {
    type: "text/html;charset=utf-8",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const cliente = String(snapshot.cliente_nome || "cliente")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  link.download = `proposta-${cliente}-${snapshot.ano || new Date().getFullYear()}.html`;
  link.click();
  URL.revokeObjectURL(link.href);
}
