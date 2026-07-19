import { supabase } from "@/lib/supabase";

export interface PortalClientUser {
  id: string;
  clientId: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  lastAccessAt: string | null;
  createdAt: string;
}

function mapUser(row: any): PortalClientUser {
  return {
    id: row.id,
    clientId: row.cliente_id,
    name: row.nome,
    email: row.email,
    status: row.status,
    lastAccessAt: row.last_access_at,
    createdAt: row.created_at,
  };
}

export async function listPortalClientUsers(clientId: string): Promise<PortalClientUser[]> {
  const { data, error } = await (supabase as any)
    .from("portal_client_users")
    .select("*")
    .eq("cliente_id", clientId)
    .order("created_at", { ascending: true });
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw error;
  }
  return (data ?? []).map(mapUser);
}

async function authenticatedRequest(method: "POST" | "PATCH", body: unknown) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Sessão expirada");

  const response = await fetch("/api/portal/usuarios", {
    method,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Não foi possível atualizar o acesso");
  return result;
}

export async function createPortalClientUser(input: {
  clientId: string;
  name: string;
  email: string;
  password: string;
}) {
  return authenticatedRequest("POST", input);
}

export async function setPortalClientUserStatus(
  userId: string,
  status: "active" | "inactive",
) {
  return authenticatedRequest("PATCH", { userId, status });
}

