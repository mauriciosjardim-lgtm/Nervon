import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getEmpresaId } from "@/lib/empresaId";

export interface Carteira {
  id: string;
  nome: string;
  tipo: "pj" | "pf" | "dinheiro" | "cartao" | "outro";
}

// ─── store global ─────────────────────────────────────────────────────────────

let carteiras: Carteira[] = [];
let loadingCarteiras = true;
const cartListeners = new Set<() => void>();
const emitCart = () => cartListeners.forEach(fn => fn());
let cartInitialized = false;

async function initCarteiras() {
  if (cartInitialized) return;
  cartInitialized = true;
  const { data } = await supabase.from("carteiras").select("*").order("nome");
  carteiras = (data ?? []).map(r => ({ id: r.id, nome: r.nome, tipo: r.tipo as Carteira["tipo"] }));
  loadingCarteiras = false;
  emitCart();
}

export function resetCarteirasStore() {
  cartInitialized = false;
  carteiras = [];
  loadingCarteiras = true;
}

// ─── carteira ativa (seleção global) ─────────────────────────────────────────

let carteiraAtiva: string | null = null;
const carteiraAtivaListeners = new Set<() => void>();
const emitCarteiraAtiva = () => carteiraAtivaListeners.forEach(fn => fn());

export function getCarteiraAtiva() { return carteiraAtiva; }

export function setCarteiraAtiva(id: string | null) {
  carteiraAtiva = id;
  emitCarteiraAtiva();
}

export function subscribeCarteiraAtiva(fn: () => void): () => void {
  carteiraAtivaListeners.add(fn);
  return () => { carteiraAtivaListeners.delete(fn); };
}

// ─── hooks ───────────────────────────────────────────────────────────────────

export function useCarteiras() {
  const [snap, setSnap] = useState({ carteiras, loading: loadingCarteiras });
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) initCarteiras(); });
    const update = () => setSnap({ carteiras: [...carteiras], loading: loadingCarteiras });
    cartListeners.add(update);
    return () => { cartListeners.delete(update); };
  }, []);
  return snap;
}

export function useCarteiraAtiva() {
  const [id, setId] = useState<string | null>(getCarteiraAtiva);
  useEffect(() => {
    const update = () => setId(getCarteiraAtiva());
    carteiraAtivaListeners.add(update);
    return () => { carteiraAtivaListeners.delete(update); };
  }, []);
  return id;
}

// ─── actions ─────────────────────────────────────────────────────────────────

export const carteirasActions = {
  async add(input: { nome: string; tipo: Carteira["tipo"] }) {
    const empresa_id = await getEmpresaId();
    const { data, error } = await supabase
      .from("carteiras").insert({ empresa_id, ...input }).select().single();
    if (!error && data) {
      carteiras = [...carteiras, { id: data.id, nome: data.nome, tipo: data.tipo }];
      emitCart();
      return data.id as string;
    }
    return undefined;
  },

  async rename(id: string, nome: string) {
    await supabase.from("carteiras").update({ nome }).eq("id", id);
    carteiras = carteiras.map(c => c.id === id ? { ...c, nome } : c);
    emitCart();
  },

  async remove(id: string) {
    await supabase.from("carteiras").delete().eq("id", id);
    carteiras = carteiras.filter(c => c.id !== id);
    emitCart();
    if (carteiraAtiva === id) { carteiraAtiva = null; emitCarteiraAtiva(); }
  },
};
