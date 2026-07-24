import { supabase } from "@/lib/supabase";
import { getEmpresaId } from "@/lib/empresaId";
import type { Database } from "@/lib/database.types";

type ProjectUpdate = Database["public"]["Tables"]["projetos"]["Update"];
type PortalReviewRow = Database["public"]["Tables"]["portal_review_versions"]["Row"];

export type ClientReviewStatus =
  | "draft"
  | "pending"
  | "changes_requested"
  | "approved"
  | "archived";

export interface ClientReview {
  id: string;
  empresaId: string;
  projectId: string;
  deliverableId?: string;
  threadId: string;
  versionNumber: number;
  versionLabel: string;
  title: string;
  contentCycle?: string;
  driveUrl: string;
  driveFileId?: string;
  embedUrl?: string;
  message?: string;
  status: ClientReviewStatus;
  kind: "review" | "delivery";
  dueAt?: string;
  publishedAt?: string;
  decidedAt?: string;
  clientName?: string;
  clientFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientPortalAccess {
  clientId: string;
  enabled: boolean;
  token: string | null;
  lastAccessAt: string | null;
  welcomeMessage: string | null;
}

export function normalizeClientAssetUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export async function saveProjectClientPortalState(input: {
  projectId: string;
  clientId: string;
  visible?: boolean;
  phase: string;
  progress?: number;
  update?: string;
  nextMilestone?: string;
  coverUrl?: string;
}): Promise<void> {
  const payload: ProjectUpdate = {
    cliente_id: input.clientId,
    portal_visible: input.visible ?? true,
    portal_phase: input.phase,
    portal_updated_at: new Date().toISOString(),
  };
  if (input.progress !== undefined) payload.portal_progress = input.progress;
  if (input.update !== undefined) payload.portal_update = input.update.trim() || null;
  if (input.nextMilestone !== undefined)
    payload.portal_next_milestone = input.nextMilestone.trim() || null;
  if (input.coverUrl !== undefined) payload.portal_cover_url = input.coverUrl.trim() || null;

  const { data, error } = await supabase
    .from("projetos")
    .update(payload)
    .eq("id", input.projectId)
    .select("id,cliente_id,portal_visible")
    .maybeSingle();

  if (error) throw error;
  if (
    !data?.id ||
    data.cliente_id !== input.clientId ||
    Boolean(data.portal_visible) !== (input.visible ?? true)
  ) {
    throw new Error("O projeto não foi vinculado corretamente ao portal deste cliente");
  }
}

export function extractGoogleDriveFileId(url: string): string | null {
  const value = normalizeClientAssetUrl(url);
  if (!value) return null;
  const patterns = [
    /drive\.google\.com\/file\/d\/([^/?#]+)/i,
    /drive\.google\.com\/open\?id=([^&#]+)/i,
    /drive\.google\.com\/uc\?(?:[^#]*&)?id=([^&#]+)/i,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }
  return null;
}

export function getReviewEmbedUrl(url: string): string | null {
  const safeUrl = normalizeClientAssetUrl(url);
  if (!safeUrl) return null;
  const fileId = extractGoogleDriveFileId(safeUrl);
  if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`;
  if (/^https?:\/\/player\.vimeo\.com\/video\//i.test(safeUrl)) return safeUrl;
  const vimeo = safeUrl.match(/vimeo\.com\/(\d+)/i);
  if (vimeo?.[1]) return `https://player.vimeo.com/video/${vimeo[1]}`;
  const youtube = safeUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&#/]+)/i,
  );
  if (youtube?.[1]) return `https://www.youtube.com/embed/${youtube[1]}`;
  return null;
}

function rowToReview(row: PortalReviewRow): ClientReview {
  const driveUrl = normalizeClientAssetUrl(row.drive_url) ?? "";
  const embedUrl = row.embed_url ? normalizeClientAssetUrl(row.embed_url) : null;
  return {
    id: row.id,
    empresaId: row.empresa_id,
    projectId: row.projeto_id,
    deliverableId: row.entregavel_id ?? undefined,
    threadId: row.thread_id,
    versionNumber: row.version_number,
    versionLabel: row.version_label,
    title: row.title,
    contentCycle: row.content_cycle ?? undefined,
    driveUrl,
    driveFileId: row.drive_file_id ?? undefined,
    embedUrl: embedUrl ?? undefined,
    message: row.message ?? undefined,
    status: row.status,
    kind: row.kind === "delivery" ? "delivery" : "review",
    dueAt: row.due_at ?? undefined,
    publishedAt: row.published_at ?? undefined,
    decidedAt: row.decided_at ?? undefined,
    clientName: row.client_name ?? undefined,
    clientFeedback: row.client_feedback ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listClientReviews(projectId?: string): Promise<ClientReview[]> {
  let query = supabase
    .from("portal_review_versions")
    .select("*")
    .order("created_at", { ascending: false });
  if (projectId) query = query.eq("projeto_id", projectId);
  const { data, error } = await query;
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw error;
  }
  return (data ?? []).map(rowToReview);
}

export async function publishClientReview(input: {
  projectId: string;
  title: string;
  contentCycle: string;
  versionLabel: string;
  driveUrl: string;
  message?: string;
  dueAt?: string;
  threadId?: string;
}): Promise<ClientReview> {
  const contentCycle = input.contentCycle.trim();
  if (!contentCycle) {
    throw new Error("Informe o ciclo ou a competência do material");
  }
  const driveUrl = normalizeClientAssetUrl(input.driveUrl);
  if (!driveUrl) {
    throw new Error("Informe um link válido começando com http:// ou https://");
  }
  const empresaId = await getEmpresaId();
  const existing = input.threadId
    ? await listClientReviews(input.projectId).then((items) =>
        items.filter((item) => item.threadId === input.threadId),
      )
    : [];
  const versionNumber =
    existing.length > 0 ? Math.max(...existing.map((item) => item.versionNumber)) + 1 : 1;
  const driveFileId = extractGoogleDriveFileId(driveUrl);
  const embedUrl = getReviewEmbedUrl(driveUrl);
  const threadId = input.threadId ?? crypto.randomUUID();

  const { data, error } = await supabase
    .from("portal_review_versions")
    .insert({
      empresa_id: empresaId,
      projeto_id: input.projectId,
      thread_id: threadId,
      version_number: versionNumber,
      version_label: input.versionLabel.trim() || `V${versionNumber}`,
      title: input.title.trim(),
      content_cycle: contentCycle,
      drive_url: driveUrl,
      drive_file_id: driveFileId,
      embed_url: embedUrl,
      message: input.message?.trim() || null,
      status: "pending",
      kind: "review",
      due_at: input.dueAt || null,
      published_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return rowToReview(data);
}

export async function publishClientDelivery(input: {
  projectId: string;
  title: string;
  contentCycle: string;
  driveUrl: string;
  message?: string;
}): Promise<ClientReview> {
  const contentCycle = input.contentCycle.trim();
  if (!contentCycle) {
    throw new Error("Informe o ciclo ou a competência da entrega");
  }
  const driveUrl = normalizeClientAssetUrl(input.driveUrl);
  if (!driveUrl) {
    throw new Error("Informe um link válido começando com http:// ou https://");
  }
  const empresaId = await getEmpresaId();
  const driveFileId = extractGoogleDriveFileId(driveUrl);
  const embedUrl = getReviewEmbedUrl(driveUrl);

  const { data, error } = await supabase
    .from("portal_review_versions")
    .insert({
      empresa_id: empresaId,
      projeto_id: input.projectId,
      thread_id: crypto.randomUUID(),
      version_number: 1,
      version_label: "Final",
      title: input.title.trim(),
      content_cycle: contentCycle,
      drive_url: driveUrl,
      drive_file_id: driveFileId,
      embed_url: embedUrl,
      message: input.message?.trim() || null,
      status: "approved",
      kind: "delivery",
      published_at: new Date().toISOString(),
      decided_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return rowToReview(data);
}

export async function archiveClientReview(id: string): Promise<void> {
  const { error } = await supabase
    .from("portal_review_versions")
    .update({ status: "archived" })
    .eq("id", id);
  if (error) throw error;
}

export async function removeClientReview(id: string): Promise<void> {
  const { error } = await supabase.from("portal_review_versions").delete().eq("id", id);
  if (error) throw error;
}

export async function updateClientReviewMetadata(input: {
  id: string;
  title: string;
  contentCycle: string;
  versionLabel: string;
  message?: string;
  dueAt?: string;
}): Promise<ClientReview> {
  const title = input.title.trim();
  const contentCycle = input.contentCycle.trim();
  if (!title) throw new Error("Informe o título do material");
  if (!contentCycle) throw new Error("Informe o ciclo ou a competência do material");

  const { data, error } = await supabase
    .from("portal_review_versions")
    .update({
      title,
      content_cycle: contentCycle,
      version_label: input.versionLabel.trim() || "V1",
      message: input.message?.trim() || null,
      due_at: input.dueAt || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .select()
    .single();
  if (error) throw error;
  return rowToReview(data);
}

export async function getClientPortalAccess(clientId?: string): Promise<ClientPortalAccess | null> {
  if (!clientId) return null;
  const { data, error } = await supabase
    .from("clientes_comercial")
    .select("id,portal_enabled,portal_token,portal_last_access_at,portal_welcome_message")
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    clientId: data.id,
    enabled: Boolean(data.portal_enabled),
    token: data.portal_token,
    lastAccessAt: data.portal_last_access_at,
    welcomeMessage: data.portal_welcome_message,
  };
}

export async function configureMakersMembers(input: {
  clientId: string;
  enabled: boolean;
  welcomeMessage?: string;
  rotateToken?: boolean;
}): Promise<string> {
  const { data, error } = await supabase.rpc("configurar_makers_members", {
    p_cliente_id: input.clientId,
    p_enabled: input.enabled,
    p_welcome_message: input.welcomeMessage?.trim() || null,
    p_rotate_token: input.rotateToken ?? false,
  });
  if (error) throw error;
  return data as string;
}
