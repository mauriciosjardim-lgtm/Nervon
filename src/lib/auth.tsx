import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import type { Session, User } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { resetProjetosStore } from "./hooks/useProjetos";
import { resetFinanceiroStore } from "./hooks/useFinanceiro";
import { resetAgendaStore } from "./hooks/useAgenda";
import { resetComercialStore } from "./hooks/useComercial";
import { clearEmpresaId } from "./empresaId";

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
  signUp: (email: string, password: string, nome: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshEmpresa: () => Promise<void>;
}

const Ctx = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null, user: null, usuario: null, empresa: null, loading: true,
  });

  const loadPerfil = async (userId: string) => {
    const { data: usuario } = await supabase
      .from("usuarios").select("*").eq("id", userId).single();
    if (!usuario) return null;
    const { data: empresa } = await supabase
      .from("empresas").select("*").eq("id", usuario.empresa_id).single();
    return { usuario, empresa };
  };

  const refreshEmpresa = async () => {
    if (!state.user) return;
    const perfil = await loadPerfil(state.user.id);
    if (perfil) setState(s => ({ ...s, ...perfil }));
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const perfil = await loadPerfil(session.user.id);
        setState({ session, user: session.user, loading: false, ...(perfil ?? { usuario: null, empresa: null }) });
      } else {
        setState({ session: null, user: null, usuario: null, empresa: null, loading: false });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const perfil = await loadPerfil(session.user.id);
        setState({ session, user: session.user, loading: false, ...(perfil ?? { usuario: null, empresa: null }) });
      } else {
        setState({ session: null, user: null, usuario: null, empresa: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { nome },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error || !data.user) return { error: error?.message ?? "Erro ao criar conta" };
    return { error: null };
  };

  const signOut = async () => {
    resetProjetosStore();
    resetFinanceiroStore();
    resetAgendaStore();
    resetComercialStore();
    clearEmpresaId();
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ ...state, signIn, signUp, signInWithGoogle, signOut, refreshEmpresa }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
