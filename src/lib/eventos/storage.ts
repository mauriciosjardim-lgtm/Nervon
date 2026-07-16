import { useEffect, useState } from "react";
import type { EventoProducao } from "./types";

const KEY = "makershub:eventos-producao:v1";
const EVENT = "makershub:eventos-producao:change";

function populateConvencaoDemo(evento: EventoProducao): EventoProducao {
  if (evento.id !== "evento-convencao-2026" || (evento.programacao?.length ?? 0) > 0) return evento;
  const dayId = evento.dias[0]?.id ?? "d1";
  const today = new Date().toISOString().slice(0, 10);
  const existingTeam = evento.equipeMembros ?? [];
  const team = existingTeam.length
    ? existingTeam
    : [
        {
          id: "team-produtor",
          funcaoId: "producao",
          funcao: "Produção",
          nome: "Mauricio Jardim",
          vinculo: "equipe" as const,
          dias: [dayId],
          equipamentos: ["Rádio produção", "iPad operação"],
          telefone: "(51) 99999-1001",
          email: "mauricio@makershub.app.br",
          status: "confirmado" as const,
          escalas: [{ diaId: dayId, chamada: "08:00", fim: "21:30" }],
          transporte: true,
          alimentacao: true,
          equipamentoOrigem: "produtora" as const,
          observacoes: "Responsável pelo comando geral e contato com o cliente.",
        },
        {
          id: "team-video-palco",
          funcaoId: "videomaker",
          funcao: "Videomaker",
          nome: "Pedro Ramos",
          vinculo: "freelancer" as const,
          dias: [dayId],
          equipamentos: ["Sony FX3", "24-70mm", "Monopé"],
          status: "confirmado" as const,
          escalas: [{ diaId: dayId, chamada: "08:15", fim: "21:00" }],
          cache: 950,
          alimentacao: true,
          equipamentoOrigem: "proprio" as const,
        },
        {
          id: "team-video-roaming",
          funcaoId: "videomaker",
          funcao: "Videomaker roaming",
          nome: "Ana Costa",
          vinculo: "freelancer" as const,
          dias: [dayId],
          equipamentos: ["Sony A7S III", "Gimbal RS4", "Lapela"],
          status: "confirmado" as const,
          escalas: [{ diaId: dayId, chamada: "08:30", fim: "20:00" }],
          cache: 850,
          alimentacao: true,
          equipamentoOrigem: "proprio" as const,
        },
        {
          id: "team-editor",
          funcaoId: "editor_realtime",
          funcao: "Editor realtime",
          nome: "Gustavo Matos",
          vinculo: "freelancer" as const,
          dias: [dayId],
          equipamentos: ["MacBook Pro M3", "SSD 4 TB", "Leitor CFexpress"],
          status: "confirmado" as const,
          escalas: [{ diaId: dayId, chamada: "09:00", fim: "21:00" }],
          cache: 1100,
          alimentacao: true,
          equipamentoOrigem: "proprio" as const,
          observacoes: "Recebe cartões na ilha e libera os cortes após aprovação do cliente.",
        },
        {
          id: "team-foto",
          funcaoId: "fotografia",
          funcao: "Fotografia",
          nome: "Lucas Mendes",
          vinculo: "freelancer" as const,
          dias: [dayId],
          equipamentos: ["Canon R6 II", "70-200mm", "Flash"],
          status: "aguardando" as const,
          escalas: [{ diaId: dayId, chamada: "09:00", fim: "19:30" }],
          cache: 700,
          alimentacao: true,
          equipamentoOrigem: "proprio" as const,
        },
      ];
  const producer = team.find((member) => member.funcaoId === "producao")?.id ?? team[0]?.id;
  const editor =
    team.find((member) => member.funcaoId === "editor_realtime")?.id ?? team.at(-1)?.id;
  const operators = team
    .filter((member) => member.funcaoId !== "editor_realtime")
    .map((member) => member.id);
  const resp = (...ids: Array<string | undefined>) => ids.filter(Boolean) as string[];

  return {
    ...evento,
    status: "em_campo",
    dias: evento.dias.map((day, index) =>
      index === 0
        ? {
            ...day,
            data: today,
            inicio: "08:00",
            fim: "21:30",
            local: "Hotel Serra Azul — Gramado",
          }
        : day,
    ),
    equipeMembros: team,
    equipe: team.length,
    programacao: [
      {
        id: "mom-credenciamento",
        diaId: dayId,
        inicio: "08:30",
        fim: "09:30",
        titulo: "Credenciamento e ambientação",
        local: "Foyer",
        responsavelIds: resp(operators[1]),
        cobertura: "Movimento, detalhes de marca e chegada dos convidados.",
        status: "concluido",
        inicioReal: "08:32",
        fimReal: "09:28",
      },
      {
        id: "mom-abertura",
        diaId: dayId,
        inicio: "09:30",
        fim: "10:00",
        titulo: "Abertura oficial",
        local: "Palco principal",
        responsavelIds: resp(operators[0], operators[2]),
        cobertura: "Entrada da diretoria, plano geral e reação da plateia.",
        status: "concluido",
        inicioReal: "09:38",
        fimReal: "10:07",
      },
      {
        id: "mom-painel",
        diaId: dayId,
        inicio: "10:00",
        fim: "11:30",
        titulo: "Painel — Liderança que transforma",
        local: "Palco principal",
        responsavelIds: resp(operators[0], producer),
        cobertura: "Plano principal, apoio lateral e cortes de reação.",
        status: "concluido",
      },
      {
        id: "mom-entrevistas",
        diaId: dayId,
        inicio: "10:35",
        fim: "12:00",
        titulo: "Entrevistas com franqueados",
        local: "Lounge conteúdo",
        responsavelIds: resp(operators[1]),
        cobertura: "Depoimentos verticais e horizontais com identidade da convenção.",
        status: "concluido",
      },
      {
        id: "mom-almoco",
        diaId: dayId,
        inicio: "12:00",
        fim: "13:15",
        titulo: "Almoço e networking",
        local: "Salão Araucária",
        responsavelIds: resp(operators[1]),
        cobertura: "Planos leves de relacionamento e ativações de patrocinadores.",
        status: "concluido",
      },
      {
        id: "mom-premiacao-prep",
        diaId: dayId,
        inicio: "13:10",
        fim: "14:00",
        titulo: "Preparação da premiação",
        local: "Bastidores",
        responsavelIds: resp(producer, operators[2]),
        cobertura: "Conferir premiados, entradas, luz e posição da equipe.",
        status: "em_andamento",
        inicioReal: nowTimeForSeed(),
      },
      {
        id: "mom-patrocinador",
        diaId: dayId,
        inicio: "13:30",
        fim: "14:30",
        titulo: "Conteúdo patrocinador master",
        local: "Lounge conteúdo",
        responsavelIds: resp(operators[1]),
        cobertura: "Entrevista, aplicação de produto e quatro planos obrigatórios.",
        status: "atrasado",
        observacoes: "Cliente ainda valida o porta-voz.",
      },
      {
        id: "mom-premiacao",
        diaId: dayId,
        inicio: "14:00",
        fim: "15:30",
        titulo: "Premiação Top Franqueados",
        local: "Palco principal",
        responsavelIds: resp(operators[0], operators[2], producer),
        cobertura: "Entrada, troféu, abraço, foto oficial e reação da plateia.",
        status: "preparar",
      },
      {
        id: "mom-coletiva",
        diaId: dayId,
        inicio: "15:40",
        fim: "16:30",
        titulo: "Coletiva com diretoria",
        local: "Lounge conteúdo",
        responsavelIds: resp(operators[1]),
        cobertura: "Perguntas guiadas e respostas curtas para redes sociais.",
        status: "previsto",
      },
      {
        id: "mom-encerramento",
        diaId: dayId,
        inicio: "18:00",
        fim: "18:40",
        titulo: "Encerramento e anúncio 2027",
        local: "Palco principal",
        responsavelIds: resp(operators[0], operators[1], producer),
        cobertura: "Fala final, aplausos, reação e saída da diretoria.",
        status: "previsto",
      },
      {
        id: "mom-backup",
        diaId: dayId,
        inicio: "19:00",
        fim: "20:30",
        titulo: "Backup final e conferência",
        local: "Ilha realtime",
        responsavelIds: resp(editor, producer),
        cobertura: "Conferência de cartões, checksum e espelho dos discos.",
        status: "previsto",
      },
    ],
    realtimeItens: [
      {
        id: "rt-abertura",
        titulo: "Reel abertura da convenção",
        origemMembroId: operators[0],
        editorId: editor,
        momentoId: "mom-abertura",
        logPrevisto: "10:10",
        logConcluido: "10:18",
        prazo: "12:00",
        destino: "Instagram Reels",
        status: "publicado",
      },
      {
        id: "rt-lideranca",
        titulo: "Corte — Liderança que transforma",
        origemMembroId: operators[0],
        editorId: editor,
        momentoId: "mom-painel",
        logPrevisto: "11:40",
        logConcluido: "11:52",
        prazo: "14:30",
        destino: "Instagram + LinkedIn",
        status: "editando",
      },
      {
        id: "rt-franqueados",
        titulo: "Depoimentos Top Franqueados",
        origemMembroId: operators[1],
        editorId: editor,
        momentoId: "mom-entrevistas",
        logPrevisto: "12:10",
        prazo: "16:00",
        destino: "Stories",
        status: "pronto_editar",
      },
      {
        id: "rt-premiacao",
        titulo: "Same day da premiação",
        origemMembroId: operators[0],
        editorId: editor,
        momentoId: "mom-premiacao",
        logPrevisto: "15:40",
        prazo: "18:30",
        destino: "Instagram Reels",
        status: "aguardando_material",
      },
      {
        id: "rt-after",
        titulo: "Aftermovie teaser 30s",
        editorId: editor,
        momentoId: "mom-encerramento",
        logPrevisto: "18:50",
        prazo: "20:30",
        destino: "Telão + Instagram",
        status: "aguardando_material",
      },
    ],
    checklist: [
      {
        id: "ck-radio",
        titulo: "Testar rádios e grupos de comunicação",
        categoria: "equipamento",
        diaId: dayId,
        responsavelId: producer,
        prazo: "08:15",
        concluido: true,
      },
      {
        id: "ck-cartoes",
        titulo: "Identificar cartões por câmera e operador",
        categoria: "equipamento",
        diaId: dayId,
        responsavelId: editor,
        prazo: "08:30",
        concluido: true,
      },
      {
        id: "ck-lounge",
        titulo: "Validar luz e áudio do lounge",
        categoria: "preparacao",
        diaId: dayId,
        responsavelId: operators[1],
        prazo: "09:15",
        concluido: true,
      },
      {
        id: "ck-premiados",
        titulo: "Confirmar ordem e posição dos premiados",
        categoria: "execucao",
        diaId: dayId,
        responsavelId: producer,
        prazo: "13:40",
        concluido: false,
      },
      {
        id: "ck-foto",
        titulo: "Confirmar fotógrafo na lateral direita",
        categoria: "execucao",
        diaId: dayId,
        responsavelId: producer,
        prazo: "13:45",
        concluido: false,
      },
      {
        id: "ck-backup",
        titulo: "Conferir backup duplo antes da saída",
        categoria: "encerramento",
        diaId: dayId,
        responsavelId: editor,
        prazo: "20:30",
        concluido: false,
      },
    ],
    referencias: [
      { id: "ref-roteiro", titulo: "Roteiro mestre da convenção", url: "https://docs.google.com/" },
      {
        id: "ref-identidade",
        titulo: "Identidade visual e logos",
        url: "https://drive.google.com/",
      },
      { id: "ref-realtime", titulo: "Referência do same day", url: "https://vimeo.com/" },
    ],
    orientacoesGerais:
      "Prioridade absoluta para a premiação e entregas do patrocinador. Toda alteração de palco deve ser confirmada no rádio da produção.",
    tarefasConcluidas: 9,
    tarefasTotal: 19,
  };
}

function ensureConvencaoCapturePlans(evento: EventoProducao): EventoProducao {
  if (evento.id !== "evento-convencao-2026") return evento;

  const plans: Record<string, string[]> = {
    "mom-credenciamento": [
      "Logo e ambientação",
      "Chegada dos convidados",
      "Interações espontâneas",
    ],
    "mom-abertura": ["Entrada da diretoria", "Plano geral do palco", "Aplausos e reação final"],
    "mom-painel": ["Entrada do palestrante", "Plano geral do palco", "Reações da plateia"],
    "mom-entrevistas": ["Diretor comercial", "Top franqueada Sul", "Franqueado revelação"],
    "mom-almoco": ["Networking", "Ativações de marca", "Detalhes de produto"],
    "mom-premiacao-prep": ["Ordem dos premiados", "Posição da equipe", "Luz e áudio conferidos"],
    "mom-patrocinador": [
      "Logo e ambientação",
      "Interação com participantes",
      "Depoimento do patrocinador",
    ],
    "mom-premiacao": ["Entrada dos premiados", "Entrega dos troféus", "Abraços e reação"],
    "mom-coletiva": ["Perguntas guiadas", "Respostas curtas", "Planos verticais"],
    "mom-encerramento": ["Fala final", "Anúncio 2027", "Aplausos e saída"],
    "mom-backup": ["Cartões conferidos", "Backup principal", "Espelho validado"],
  };

  let changed = false;
  const programacao = (evento.programacao ?? []).map((moment) => {
    const plan = plans[moment.id];
    if (!plan || moment.captacaoItens?.length) return moment;
    changed = true;
    return {
      ...moment,
      captacaoItens: plan.map((titulo, index) => ({
        id: `${moment.id}-captacao-${index + 1}`,
        titulo,
        concluido:
          moment.status === "concluido" || (moment.status === "em_andamento" && index === 0),
      })),
    };
  });

  return changed ? { ...evento, programacao } : evento;
}

function nowTimeForSeed() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const seed: EventoProducao[] = [
  {
    id: "evento-summit-2026",
    nome: "Summit de Liderança 2026",
    cliente: "Atlas Group",
    tipo: "Corporativo",
    local: "Centro de Eventos — Porto Alegre",
    status: "confirmado",
    cor: "#90F826",
    descricao: "Cobertura completa, transmissão e conteúdo pós-evento.",
    dias: [
      { id: "d1", data: "2026-07-21", inicio: "07:00", fim: "19:00", local: "Auditório principal" },
      { id: "d2", data: "2026-07-22", inicio: "08:00", fim: "18:00", local: "Auditório principal" },
    ],
    equipe: 8,
    tarefasConcluidas: 18,
    tarefasTotal: 26,
    receitaPrevista: 28500,
    custosPrevistos: 11200,
    criadoEm: new Date().toISOString(),
  },
  {
    id: "evento-convencao-2026",
    nome: "Convenção Comercial",
    cliente: "Vibe Cosméticos",
    tipo: "Corporativo",
    local: "Hotel Serra Azul — Gramado",
    status: "planejamento",
    cor: "#B67AF5",
    descricao: "Captação multicâmera e pacote de entregas para redes sociais.",
    dias: [{ id: "d1", data: "2026-08-04", inicio: "09:00", fim: "21:00" }],
    equipe: 4,
    tarefasConcluidas: 5,
    tarefasTotal: 19,
    receitaPrevista: 14600,
    custosPrevistos: 5800,
    criadoEm: new Date().toISOString(),
  },
];

function read(): EventoProducao[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(KEY);
    const items: EventoProducao[] = raw ? JSON.parse(raw) : seed;
    const hydrated = items.map(populateConvencaoDemo).map(ensureConvencaoCapturePlans);
    if (JSON.stringify(hydrated) !== JSON.stringify(items))
      localStorage.setItem(KEY, JSON.stringify(hydrated));
    return hydrated;
  } catch {
    return seed;
  }
}

function write(items: EventoProducao[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function useEventosProducao() {
  const [eventos, setEventos] = useState<EventoProducao[]>(read);
  useEffect(() => {
    const sync = () => setEventos(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return eventos;
}

export const eventosProducaoActions = {
  criar(payload: Omit<EventoProducao, "id" | "criadoEm">) {
    const evento = { ...payload, id: crypto.randomUUID(), criadoEm: new Date().toISOString() };
    write([evento, ...read()]);
    return evento;
  },
  atualizar(id: string, patch: Partial<EventoProducao>) {
    write(read().map((evento) => (evento.id === id ? { ...evento, ...patch } : evento)));
  },
};
