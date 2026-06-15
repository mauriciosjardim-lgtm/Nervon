let _tipo: string | null = null;

export function setPendingCreate(tipo: string) { _tipo = tipo; }

export function consumeCreate(tipo: string): boolean {
  if (_tipo === tipo) { _tipo = null; return true; }
  return false;
}
