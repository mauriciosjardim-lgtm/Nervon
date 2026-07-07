import { describe, expect, test } from "bun:test";
import { sanitizeContractHtml } from "./sanitize-contract";

// Rode com: bun test src/lib/sanitize-contract.test.ts

describe("sanitizeContractHtml — payloads maliciosos", () => {
  test("remove <script> com o conteúdo", () => {
    const out = sanitizeContractHtml('<p>ok</p><script>alert("xss")</script>');
    expect(out).toBe("<p>ok</p>");
    expect(out).not.toContain("script");
    expect(out).not.toContain("alert");
  });

  test("remove img com onerror (tag fora da allowlist + atributo on*)", () => {
    const out = sanitizeContractHtml('<p>a<img src="x" onerror="alert(1)">b</p>');
    expect(out).toBe("<p>ab</p>");
    expect(out).not.toContain("onerror");
    expect(out).not.toContain("img");
  });

  test("remove svg com onload e todo o conteúdo interno", () => {
    const out = sanitizeContractHtml('<svg onload="alert(1)"><circle/></svg><p>ok</p>');
    expect(out).toBe("<p>ok</p>");
    expect(out).not.toContain("svg");
    expect(out).not.toContain("onload");
  });

  test("remove links javascript: (a é unwrapped, href some)", () => {
    const out = sanitizeContractHtml('<p><a href="javascript:alert(1)">clique</a></p>');
    expect(out).toBe("<p>clique</p>");
    expect(out).not.toContain("javascript:");
    expect(out).not.toContain("href");
  });

  test("remove iframe/object/embed/form/style com conteúdo", () => {
    const out = sanitizeContractHtml(
      '<iframe src="//evil"></iframe><object data="x"></object><embed src="x">' +
      '<form action="//evil"><input name="q"></form><style>*{display:none}</style><p>ok</p>',
    );
    expect(out).toBe("<p>ok</p>");
  });

  test("remove atributos on*, style inline e data-* de tags permitidas", () => {
    const out = sanitizeContractHtml(
      '<p onclick="alert(1)" style="background:url(javascript:x)" data-evil="1" id="x">t</p>',
    );
    expect(out).toBe("<p>t</p>");
  });

  test("filtra classes fora da allowlist do motor", () => {
    const out = sanitizeContractHtml('<p class="mh-sub evil-class">t</p><span class="hack">s</span>');
    expect(out).toBe('<p class="mh-sub">t</p><span>s</span>');
  });

  test("escapa texto com caracteres especiais (sem reinterpretar como HTML)", () => {
    const out = sanitizeContractHtml("<p>a &lt;b&gt; & \"c\"</p>");
    expect(out).toBe("<p>a &lt;b&gt; &amp; &quot;c&quot;</p>");
  });

  test("payload aninhado: script dentro de section permitida", () => {
    const out = sanitizeContractHtml("<section><script><p>fake</p></script><p>real</p></section>");
    expect(out).toBe("<section><p>real</p></section>");
  });
});

describe("sanitizeContractHtml — HTML normal do motor é preservado", () => {
  test("estrutura típica de cláusula do engine", () => {
    const engine =
      '<section class="mh-clause"><h3>CLÁUSULA 1 — DO OBJETO</h3>' +
      '<p class="mh-sub"><span class="mh-num">1.1</span> O presente contrato tem por objeto…</p>' +
      '<p class="mh-sub"><span class="mh-num">1.2</span> Valor: R$ 5.000,00.</p></section>' +
      '<section class="mh-clause"><p class="mh-sign">___________________\nCONTRATANTE</p></section>';
    expect(sanitizeContractHtml(engine)).toBe(engine);
  });

  test("br é preservado", () => {
    expect(sanitizeContractHtml("<p>linha 1<br>linha 2</p>")).toBe("<p>linha 1<br/>linha 2</p>");
  });

  test("entrada vazia", () => {
    expect(sanitizeContractHtml("")).toBe("");
  });
});
