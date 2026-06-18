// MakersHub — Central de Recursos
// Templates inteligentes com variáveis {{cliente}}, {{valor}}, etc.

import { useSyncExternalStore } from "react";
import { FileText, FileSignature, ClipboardList, ListChecks, Clapperboard, MessageSquare, FolderOpen, type LucideIcon } from "lucide-react";

export type CategoriaRecurso =
  | "propostas" | "contratos" | "briefings" | "checklists" | "roteiros" | "mensagens" | "arquivos";

export const CATEGORIAS: Record<CategoriaRecurso, { label: string; descricao: string }> = {
  propostas:  { label: "Propostas",  descricao: "Modelos prontos para fechar mais rápido." },
  contratos:  { label: "Contratos",  descricao: "Cláusulas e modelos jurídicos." },
  briefings:  { label: "Briefings",  descricao: "Roteiros de descoberta de projeto." },
  checklists: { label: "Checklists", descricao: "Passo-a-passo de produção e entrega." },
  roteiros:   { label: "Roteiros",   descricao: "Roteiros de vídeo, podcast e reels." },
  mensagens:  { label: "Mensagens",  descricao: "Templates de WhatsApp e e-mail." },
  arquivos:   { label: "Arquivos",   descricao: "Anexos, PDFs e mídias da produtora." },
};

export const CATEGORIA_ICONS: Record<CategoriaRecurso, LucideIcon> = {
  propostas:  FileText,
  contratos:  FileSignature,
  briefings:  ClipboardList,
  checklists: ListChecks,
  roteiros:   Clapperboard,
  mensagens:  MessageSquare,
  arquivos:   FolderOpen,
};

export interface Recurso {
  id: string;
  categoria: CategoriaRecurso;
  titulo: string;
  descricao?: string;
  conteudo: string;
  favorito: boolean;
  compartilhado: boolean;
  atualizadoEm: string;
}

export const VARIAVEIS_DISPONIVEIS = [
  "cliente", "empresa", "valor", "prazo", "responsavel", "cidade",
  "data", "projeto", "entregaveis",
] as const;

export type VariavelDados = Partial<Record<typeof VARIAVEIS_DISPONIVEIS[number], string>>;

export const VARIAVEIS_EXEMPLO: VariavelDados = {
  cliente: "Marina Costa",
  empresa: "Nova Marca Bebidas",
  valor: "R$ 48.000",
  prazo: "30 dias",
  responsavel: "Você",
  cidade: "São Paulo, SP",
  data: new Date().toLocaleDateString("pt-BR"),
  projeto: "Campanha Verão",
  entregaveis: "8 reels + 4 carrosséis",
};

export function aplicarVariaveis(conteudo: string, dados: VariavelDados): string {
  return conteudo.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const v = dados[key as keyof VariavelDados];
    return v !== undefined ? String(v) : `{{${key}}}`;
  });
}

export function extrairVariaveis(conteudo: string): string[] {
  const matches = conteudo.match(/\{\{\s*(\w+)\s*\}\}/g) || [];
  return Array.from(new Set(matches.map(m => m.replace(/[{}\s]/g, ""))));
}

const now = new Date();
const d = (offset: number) => {
  const x = new Date(now); x.setDate(x.getDate() + offset);
  return x.toISOString();
};

let recursos: Recurso[] = [
  {
    id: "r1", categoria: "propostas", titulo: "Proposta — Vídeo Institucional",
    descricao: "Modelo enxuto para fechamento em 1 reunião.",
    conteudo: `Olá {{cliente}},

Segue a proposta para o projeto **{{projeto}}** da {{empresa}}.

Escopo: {{entregaveis}}
Prazo de entrega: {{prazo}}
Investimento: {{valor}}

Qualquer dúvida estou à disposição.
— {{responsavel}}`,
    favorito: true, compartilhado: false, atualizadoEm: d(-3),
  },
  {
    id: "r2", categoria: "propostas", titulo: "Proposta — Conteúdo Mensal",
    conteudo: `Olá {{cliente}}!

Proposta de plano mensal de conteúdo para {{empresa}}:

• 12 reels + 4 carrosséis por mês
• 2 diárias de captação
• 3 dias úteis para revisões

Investimento mensal: {{valor}}
Início: {{data}}

— {{responsavel}}`,
    favorito: false, compartilhado: true, atualizadoEm: d(-10),
  },
  {
    id: "r3", categoria: "contratos", titulo: "Contrato — Prestação de Serviços Audiovisuais",
    conteudo: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS AUDIOVISUAIS

CONTRATANTE: {{empresa}}, representada por {{cliente}}, com sede em {{cidade}}.
CONTRATADA: [Sua Produtora].

OBJETO: produção do projeto "{{projeto}}".
PRAZO: {{prazo}} a partir da assinatura.
VALOR: {{valor}}, dividido em 3 parcelas.

Local e data: {{cidade}}, {{data}}.`,
    favorito: true, compartilhado: false, atualizadoEm: d(-15),
  },
  {
    id: "r4", categoria: "contratos", titulo: "Cláusula de uso de imagem",
    conteudo: `O(A) participante {{cliente}} autoriza, em caráter gratuito e por tempo indeterminado, o uso de sua imagem e voz nas peças produzidas no âmbito do projeto {{projeto}}, podendo ser veiculadas em qualquer mídia digital, impressa ou audiovisual.`,
    favorito: false, compartilhado: false, atualizadoEm: d(-22),
  },
  {
    id: "r5", categoria: "briefings", titulo: "Briefing — Vídeo Institucional",
    conteudo: `1. Quem é a {{empresa}}?
2. Qual o objetivo deste vídeo?
3. Para qual público se destina?
4. Quais são os 3 diferenciais principais?
5. Existe referência visual?
6. Onde será veiculado?
7. Prazo desejado: {{prazo}}
8. Outras observações:`,
    favorito: true, compartilhado: false, atualizadoEm: d(-5),
  },
  {
    id: "r6", categoria: "briefings", titulo: "Briefing — Conteúdo para redes",
    conteudo: `• Persona principal
• Tom de voz da marca
• Frequência de postagens
• Pilares de conteúdo
• Concorrentes referência
• Hashtags estratégicas
• Métricas de sucesso`,
    favorito: false, compartilhado: false, atualizadoEm: d(-8),
  },
  {
    id: "r7", categoria: "checklists", titulo: "Checklist — Dia de captação",
    conteudo: `[ ] Bateria das câmeras carregadas
[ ] Cartões SD formatados
[ ] Microfone + pilhas reservas
[ ] Lentes limpas
[ ] Iluminação testada
[ ] Tripé e gimbal
[ ] Backup de HD
[ ] Roteiro impresso
[ ] Confirmação com {{cliente}}
[ ] Endereço: {{cidade}}`,
    favorito: true, compartilhado: false, atualizadoEm: d(-2),
  },
  {
    id: "r8", categoria: "checklists", titulo: "Checklist — Entrega final",
    conteudo: `[ ] Vídeo aprovado pelo cliente
[ ] Cores finais aplicadas
[ ] Áudio masterizado (-14 LUFS)
[ ] Versão horizontal (16:9)
[ ] Versão vertical (9:16)
[ ] Versão quadrada (1:1)
[ ] Thumbnails
[ ] Upload no drive
[ ] Link enviado ao cliente
[ ] NF emitida`,
    favorito: false, compartilhado: true, atualizadoEm: d(-12),
  },
  {
    id: "r9", categoria: "roteiros", titulo: "Roteiro — Reel 30s",
    conteudo: `GANCHO (0-3s): pergunta provocativa
PROBLEMA (3-10s): dor do público
SOLUÇÃO (10-22s): apresentar a {{empresa}}
CTA (22-30s): "Saiba mais no link da bio"

Trilha: upbeat, royalty-free
Edição: cortes secos, on-beat`,
    favorito: false, compartilhado: false, atualizadoEm: d(-6),
  },
  {
    id: "r10", categoria: "roteiros", titulo: "Roteiro — Vídeo institucional 90s",
    conteudo: `ATO 1 — Quem somos (0-25s)
ATO 2 — O que fazemos (25-55s)
ATO 3 — Resultado para o cliente (55-80s)
CTA — Convite ao contato (80-90s)`,
    favorito: false, compartilhado: false, atualizadoEm: d(-18),
  },
  {
    id: "r11", categoria: "mensagens", titulo: "WhatsApp — Primeiro contato",
    conteudo: `Oi {{cliente}}, tudo bem? Sou {{responsavel}}, da [Sua Produtora] 🎬

Vi seu projeto e acredito que posso ajudar a {{empresa}} com isso. Topa uma call de 15min essa semana pra entender melhor?`,
    favorito: true, compartilhado: false, atualizadoEm: d(-1),
  },
  {
    id: "r12", categoria: "mensagens", titulo: "E-mail — Envio de proposta",
    conteudo: `Assunto: Proposta {{projeto}} — {{empresa}}

Olá {{cliente}},

Conforme combinado, segue em anexo a proposta para o projeto {{projeto}}, no valor de {{valor}}, com prazo de {{prazo}}.

Fico à disposição para alinhar os próximos passos.

Abraço,
{{responsavel}}`,
    favorito: false, compartilhado: false, atualizadoEm: d(-9),
  },
  {
    id: "r13", categoria: "mensagens", titulo: "WhatsApp — Follow-up suave",
    conteudo: `Oi {{cliente}}, beleza?
Passando pra saber se conseguiu dar uma olhada na proposta que te enviei. Qualquer dúvida me chama por aqui 🙌`,
    favorito: false, compartilhado: false, atualizadoEm: d(-7),
  },
  {
    id: "r14", categoria: "arquivos", titulo: "Apresentação institucional 2026",
    descricao: "PDF da produtora com cases e equipe.",
    conteudo: "https://drive.google.com/file/d/example-apresentacao",
    favorito: false, compartilhado: true, atualizadoEm: d(-30),
  },
  {
    id: "r15", categoria: "arquivos", titulo: "Logo + Brand Guide",
    descricao: "Pasta com versões da marca, cores e tipografia.",
    conteudo: "https://drive.google.com/drive/folders/example-brand",
    favorito: true, compartilhado: false, atualizadoEm: d(-40),
  },
];

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const emit = () => listeners.forEach(l => l());
const snapshot = () => recursos;

export const useBiblioteca = () => useSyncExternalStore(subscribe, snapshot, snapshot);

export const bibliotecaActions = {
  criar(input: Omit<Recurso, "id" | "atualizadoEm" | "favorito" | "compartilhado"> & Partial<Pick<Recurso, "favorito" | "compartilhado">>) {
    const novo: Recurso = {
      id: `r-${Date.now()}`,
      favorito: false, compartilhado: false,
      ...input,
      atualizadoEm: new Date().toISOString(),
    };
    recursos = [novo, ...recursos];
    emit();
    return novo;
  },
  atualizar(id: string, patch: Partial<Recurso>) {
    recursos = recursos.map(r => r.id === id ? { ...r, ...patch, atualizadoEm: new Date().toISOString() } : r);
    emit();
  },
  remover(id: string) {
    recursos = recursos.filter(r => r.id !== id);
    emit();
  },
  duplicar(id: string) {
    const orig = recursos.find(r => r.id === id);
    if (!orig) return;
    const novo: Recurso = { ...orig, id: `r-${Date.now()}`, titulo: `${orig.titulo} (cópia)`, favorito: false, atualizadoEm: new Date().toISOString() };
    recursos = [novo, ...recursos];
    emit();
    return novo;
  },
  toggleFavorito(id: string) {
    recursos = recursos.map(r => r.id === id ? { ...r, favorito: !r.favorito } : r);
    emit();
  },
  toggleCompartilhado(id: string) {
    recursos = recursos.map(r => r.id === id ? { ...r, compartilhado: !r.compartilhado } : r);
    emit();
  },
};

export const listarPorCategoria = (cat: CategoriaRecurso) => recursos.filter(r => r.categoria === cat);
export const listarFavoritos = () => recursos.filter(r => r.favorito);
export const listarCompartilhados = () => recursos.filter(r => r.compartilhado);
export const buscar = (termo: string) => {
  const t = termo.toLowerCase().trim();
  if (!t) return [];
  return recursos.filter(r => r.titulo.toLowerCase().includes(t) || (r.descricao?.toLowerCase().includes(t)) || r.conteudo.toLowerCase().includes(t));
};
