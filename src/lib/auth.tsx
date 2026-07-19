import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import type { Session, User } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { disposeSessionScope } from "./sessionScope";
import { setSessionHintCookie, clearSessionHintCookie } from "./sessionHint";

type Empresa = Database["public"]["Tables"]["empresas"]["Row"];
type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];

interface AuthState {
  session: Session | null;
  user: User | null;
  usuario: Usuario | null;
  empresa: Empresa | null;
  loading: boolean;
}

interface AuthContext extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    nome: string,
    meta?: { whatsapp?: string; tipo?: string },
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshEmpresa: () => Promise<void>;
}

const Ctx = createContext<AuthContext | null>(null);

// Promise compartilhada (fora do componente) que apenas OBTÉM a sessão
// persistida. Dedupa chamadas concorrentes inclusive no remount do StrictMode
// — o resultado é aplicado por cada instância, com guard próprio de
// mounted/epoch, então nenhuma Promise fica presa ao setState de instância
// desmontada. Invalidada quando a sessão persistida muda (login/logout).
let persistedSessionPromise: Promise<Session | null> | null = null;

function getPersistedSession(): Promise<Session | null> {
  if (!persistedSessionPromise) {
    persistedSessionPromise = supabase.auth
      .getSession()
      .then(({ data }) => data.session)
      .catch((err) => {
        persistedSessionPromise = null; // permite retry num bootstrap futuro
        throw err;
      });
  }
  return persistedSessionPromise;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    usuario: null,
    empresa: null,
    loading: true,
  });

  // epoch/generation guard: cada mudança de sessão bumpa o epoch; respostas
  // assíncronas antigas (perfil/getSession de uma sessão anterior) são descartadas.
  const epochRef = useRef(0);
  // instância montada? nenhuma resposta assíncrona pode chamar setState após unmount
  const mountedRef = useRef(false);
  // failsafe corrente (spinner nunca trava pra sempre)
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // timers pendentes agendados pelo onAuthStateChange (cancelados no cleanup)
  const pendingTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  // Supabase pode emitir SIGNED_IN novamente ao retomar uma aba suspensa
  // (especialmente no Safari). Mantém a identidade corrente fora do closure
  // inicial do effect para distinguir retomada de uma troca real de sessão.
  const activeUserIdRef = useRef<string | null>(null);

  const loadPerfil = async (userId: string) => {
    const { data: usuario } = await supabase.from("usuarios").select("*").eq("id", userId).single();
    if (!usuario) return null;
    const { data: empresa } = await supabase
      .from("empresas")
      .select("*")
      .eq("id", usuario.empresa_id)
      .single();
    return { usuario, empresa };
  };

  const refreshEmpresa = async () => {
    if (!state.user) return;
    const epoch = epochRef.current;
    const perfil = await loadPerfil(state.user.id);
    if (perfil && mountedRef.current && epoch === epochRef.current) {
      setState((s) => ({ ...s, ...perfil }));
    }
  };

  // Aplica uma sessão (ou ausência dela) ao estado, carregando o perfil fora
  // da pilha do evento de auth. Só escreve se a instância ainda estiver
  // montada e o epoch ainda for o corrente.
  const applySession = async (session: Session | null, epoch: number) => {
    if (!mountedRef.current || epoch !== epochRef.current) return;
    if (session?.user) {
      // Sessões de clientes usam outro storage. Remove qualquer sessão antiga
      // que tenha sido gravada no cliente principal antes dessa separação.
      if (
        session.user.app_metadata?.account_type === "client_portal" ||
        session.user.user_metadata?.account_type === "client_portal"
      ) {
        clearSessionHintCookie();
        await supabase.auth.signOut({ scope: "local" });
        if (mountedRef.current && epoch === epochRef.current) {
          setState({
            session: null,
            user: null,
            usuario: null,
            empresa: null,
            loading: false,
          });
        }
        return;
      }
      let perfil: Awaited<ReturnType<typeof loadPerfil>> = null;
      try {
        perfil = await loadPerfil(session.user.id);
      } catch (err) {
        console.error("[auth] falha ao carregar perfil:", err);
      }
      if (!mountedRef.current || epoch !== epochRef.current) return; // resposta antiga/unmount
      setSessionHintCookie(); // sessão confirmada → cria/renova a dica pro SSR
      activeUserIdRef.current = session.user.id;
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
      setState({
        session,
        user: session.user,
        loading: false,
        ...(perfil ?? { usuario: null, empresa: null }),
      });
    } else {
      activeUserIdRef.current = null;
      clearSessionHintCookie(); // sem sessão (logout/expirada) → remove a dica
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
      setState({ session: null, user: null, usuario: null, empresa: null, loading: false });
    }
  };

  // Bootstrap idempotente: a OBTENÇÃO da sessão é deduplicada globalmente
  // (getPersistedSession); a APLICAÇÃO é por instância, protegida por
  // mounted/epoch — sobrevive ao remount do StrictMode sem prender Promise
  // ao setState de uma instância desmontada.
  const bootstrapSession = (): Promise<void> => {
    const epoch = ++epochRef.current;
    return getPersistedSession()
      .then((session) => applySession(session, epoch))
      .catch((err) => {
        console.error("[auth] bootstrapSession:", err);
        if (!mountedRef.current || epoch !== epochRef.current) return;
        if (fallbackRef.current) clearTimeout(fallbackRef.current);
        setState((s) => (s.loading ? { ...s, loading: false } : s));
      });
  };

  useEffect(() => {
    mountedRef.current = true;

    // failsafe: nunca deixa o spinner travado pra sempre
    fallbackRef.current = setTimeout(() => {
      setState((s) => (s.loading ? { ...s, loading: false } : s));
    }, 8000);

    void bootstrapSession();

    // IMPORTANTE: o callback NÃO pode ser async nem await métodos do supabase.
    // O supabase-js segura um lock (navigator.locks) enquanto o callback roda;
    // qualquer query aguardada aqui chama getSession() -> mesmo lock -> deadlock.
    // Só registra a sessão e agenda o processamento fora da pilha do evento.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // refresh de token: só atualiza o token, mantém o perfil já carregado
      if (event === "TOKEN_REFRESHED") {
        if (session) {
          activeUserIdRef.current = session.user.id;
          setSessionHintCookie(); // renova a dica (escrita síncrona, sem await)
          setState((s) => ({ ...s, session, user: session.user }));
        }
        return;
      }
      // ignora eventos sem mudança real de usuário
      if (event === "INITIAL_SESSION") return; // já tratado pelo bootstrapSession

      // Ao voltar para uma aba, o Supabase pode repetir SIGNED_IN para o mesmo
      // usuário. Isso é retomada, não login: atualiza apenas o token e preserva
      // stores/canais já carregados. Antes, disposeSessionScope zerava o cockpit.
      if (event === "SIGNED_IN" && session?.user.id === activeUserIdRef.current) {
        setSessionHintCookie();
        setState((s) => ({ ...s, session, user: session.user }));
        return;
      }

      // Troca de sessão (login/logout/recovery): derruba TODOS os stores,
      // caches e canais Realtime da sessão anterior — síncrono, sem await
      // (removeChannel não é aguardado e não toca no lock de auth).
      disposeSessionScope();
      persistedSessionPromise = null; // sessão persistida mudou: invalida o cache do bootstrap
      const epoch = ++epochRef.current; // invalida respostas em voo da sessão anterior
      const timer = setTimeout(() => {
        pendingTimersRef.current.delete(timer);
        void applySession(session, epoch);
      }, 0);
      pendingTimersRef.current.add(timer);
    });

    return () => {
      mountedRef.current = false;
      epochRef.current++; // inutiliza qualquer resposta em voo desta instância
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
      for (const timer of pendingTimersRef.current) clearTimeout(timer);
      pendingTimersRef.current.clear();
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // O evento onAuthStateChange aplica a sessão de forma assíncrona. Gravar a
    // dica já no retorno do login garante que uma navegação/reload imediato da
    // raiz seja renderizado como dashboard, não como landing pública.
    if (!error) setSessionHintCookie();
    return { error: error?.message ?? null };
  };

  const signUp = async (
    email: string,
    password: string,
    nome: string,
    meta?: { whatsapp?: string; tipo?: string },
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome, ...meta },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error || !data.user) return { error: error?.message ?? "Erro ao criar conta" };
    return { error: null };
  };

  const signOut = async () => {
    try {
      // Primeiro derruba a sessão no Supabase; só DEPOIS descarta os stores.
      // (Na ordem antiga, hooks montados podiam re-inicializar os stores com
      // dados do usuário que estava saindo, durante o await.)
      await supabase.auth.signOut();
    } finally {
      // limpeza garantida mesmo se o signOut falhar (rede): invalida respostas
      // em voo, o cache do bootstrap, a dica de sessão, derruba a sessão local
      // e descarta TODOS os stores/caches/canais da sessão anterior.
      clearSessionHintCookie();
      activeUserIdRef.current = null;
      persistedSessionPromise = null;
      epochRef.current++;
      disposeSessionScope();
      if (mountedRef.current) {
        setState({ session: null, user: null, usuario: null, empresa: null, loading: false });
      }
    }
  };

  return (
    <Ctx.Provider value={{ ...state, signIn, signUp, signOut, refreshEmpresa }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
