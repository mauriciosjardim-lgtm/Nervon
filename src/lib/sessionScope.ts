// Registro central de descarte de sessão (E5).
// Cada store/cache com estado por-empresa registra aqui seu disposer no
// momento em que o módulo é importado. No logout ou troca de sessão,
// disposeSessionScope() derruba TUDO de uma vez: dados, caches e canais
// Realtime — nada da conta anterior sobrevive para a próxima.
type Disposer = () => void;

const disposers = new Set<Disposer>();

export function registerSessionDisposer(d: Disposer) {
  disposers.add(d);
}

export function disposeSessionScope() {
  for (const d of disposers) {
    try {
      d();
    } catch (err) {
      console.error("[sessionScope] disposer falhou:", err);
    }
  }
}
