export type ProjetoComCliente = {
  clienteId?: string | null;
  cliente: string;
};

export type ClienteIdentificavel = {
  id: string;
  nome: string;
};

export function normalizeClientName(value: string): string {
  return value.trim().toLocaleLowerCase("pt-BR");
}

/**
 * `clienteId` é a identidade canônica. O nome só serve como compatibilidade
 * para projetos antigos que ainda não foram vinculados ao cadastro do CRM.
 */
export function projectBelongsToClient(
  project: ProjetoComCliente,
  client: ClienteIdentificavel,
): boolean {
  if (project.clienteId) return project.clienteId === client.id;
  return normalizeClientName(project.cliente) === normalizeClientName(client.nome);
}

export function findProjectClient<T extends ClienteIdentificavel>(
  project: ProjetoComCliente,
  clients: T[],
): T | undefined {
  if (project.clienteId) return clients.find((client) => client.id === project.clienteId);
  return clients.find(
    (client) => normalizeClientName(client.nome) === normalizeClientName(project.cliente),
  );
}
