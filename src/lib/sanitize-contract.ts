import { Parser } from "htmlparser2";

// Sanitizador do HTML de contratos (rendered_html vem do banco e pode ter sido
// adulterado via API por um usuário malicioso — XSS armazenado).
//
// Estratégia: allowlist estrita sobre um parser HTML real (htmlparser2 — sem
// regex caseira, compatível com SSR/Workers/navegador). Só sobrevive o que o
// motor de contratos realmente produz:
//   - elementos: section, h3, p, span, br
//   - atributo:  class, apenas com as classes do motor
// Todo o resto é removido: script/style/iframe/object/embed/svg/form (com o
// conteúdo), atributos on*, style inline, href/src (javascript: incluso),
// data-* e qualquer outro atributo.

const ALLOWED_TAGS = new Set(["section", "h3", "p", "span", "br"]);
const VOID_TAGS = new Set(["br"]);
const ALLOWED_CLASSES = new Set(["mh-clause", "mh-sign", "mh-sub", "mh-num"]);
// Elementos perigosos: descartados JUNTO com todo o conteúdo interno.
const DROP_WITH_CHILDREN = new Set([
  "script", "style", "iframe", "object", "embed", "svg", "form",
  "noscript", "template", "math", "head", "title", "link", "meta", "base",
]);

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function sanitizeContractHtml(html: string): string {
  if (!html) return "";

  let out = "";
  // >0 = dentro de subárvore descartada (script etc.); conta profundidade
  let dropping = 0;

  const parser = new Parser(
    {
      onopentag(name, attrs) {
        const tag = name.toLowerCase();
        if (dropping > 0) { dropping++; return; }
        if (DROP_WITH_CHILDREN.has(tag)) { dropping = 1; return; }
        // Tag fora da allowlist (div, a, img, b…): remove a tag, mantém os
        // filhos sanitizados (unwrap) — preserva texto benigno do motor.
        if (!ALLOWED_TAGS.has(tag)) return;

        // Único atributo permitido: class, filtrado pela allowlist de classes.
        const classes = (attrs["class"] ?? "")
          .split(/\s+/)
          .filter((c) => ALLOWED_CLASSES.has(c));
        const classAttr = classes.length ? ` class="${classes.join(" ")}"` : "";
        out += VOID_TAGS.has(tag) ? `<${tag}${classAttr}/>` : `<${tag}${classAttr}>`;
      },
      ontext(text) {
        if (dropping > 0) return;
        out += escapeHtml(text);
      },
      onclosetag(name) {
        const tag = name.toLowerCase();
        if (dropping > 0) { dropping--; return; }
        if (ALLOWED_TAGS.has(tag) && !VOID_TAGS.has(tag)) out += `</${tag}>`;
      },
      // comentários, CDATA, processing instructions: descartados por omissão
    },
    { decodeEntities: true },
  );

  parser.write(html);
  parser.end();
  return out;
}
