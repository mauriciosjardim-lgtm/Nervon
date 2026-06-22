import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Wallet, Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { FinanceiroTabs } from "@/components/financeiro/financeiro-tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useCarteiras, useCarteiraAtiva, setCarteiraAtiva, carteirasActions,
  type Carteira,
} from "@/lib/hooks/useCarteiras";

export const Route = createFileRoute("/financeiro")({
  ssr: false,
  component: FinanceiroLayout,
});

const TIPO_LABEL: Record<Carteira["tipo"], string> = {
  pj: "Empresa (PJ)",
  pf: "Pessoal (PF)",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  outro: "Outro",
};

type ModalState =
  | { tipo: "nova" }
  | { tipo: "renomear"; carteira: Carteira }
  | { tipo: "excluir"; carteira: Carteira }
  | null;

function CarteiraSwitcher() {
  const { carteiras, loading } = useCarteiras();
  const ativa = useCarteiraAtiva();
  const [modal, setModal] = useState<ModalState>(null);

  // estados do formulário de criar/renomear
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<Carteira["tipo"]>("pj");
  const [salvando, setSalvando] = useState(false);

  const abrirNova = () => { setNome(""); setTipo("pj"); setModal({ tipo: "nova" }); };
  const abrirRenomear = (c: Carteira) => { setNome(c.nome); setModal({ tipo: "renomear", carteira: c }); };
  const abrirExcluir = (c: Carteira) => setModal({ tipo: "excluir", carteira: c });

  const criarCarteira = async () => {
    if (!nome.trim()) return;
    setSalvando(true);
    const id = await carteirasActions.add({ nome: nome.trim(), tipo });
    if (id) { setCarteiraAtiva(id); toast.success("Carteira criada."); }
    setSalvando(false);
    setModal(null);
  };

  const renomearCarteira = async () => {
    if (modal?.tipo !== "renomear" || !nome.trim()) return;
    setSalvando(true);
    await carteirasActions.rename(modal.carteira.id, nome.trim());
    toast.success("Carteira renomeada.");
    setSalvando(false);
    setModal(null);
  };

  const excluirCarteira = async () => {
    if (modal?.tipo !== "excluir") return;
    setSalvando(true);
    await carteirasActions.remove(modal.carteira.id);
    toast.success("Carteira excluída.");
    setSalvando(false);
    setModal(null);
  };

  if (loading) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Carteira
        </span>

        {/* Empresa (padrão) */}
        <button
          onClick={() => setCarteiraAtiva(null)}
          className={cn(
            "inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium transition",
            ativa === null
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-surface-2 hover:text-foreground",
          )}
        >
          Empresa
        </button>

        {/* Carteiras criadas */}
        {carteiras.map(c => (
          <div key={c.id} className="group relative inline-flex">
            <button
              onClick={() => setCarteiraAtiva(c.id)}
              className={cn(
                "inline-flex h-7 items-center rounded-full border pl-3 pr-1.5 text-xs font-medium transition",
                ativa === c.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-surface-2 hover:text-foreground",
              )}
            >
              {c.nome}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <span
                    onClick={e => e.stopPropagation()}
                    className={cn(
                      "ml-1.5 inline-flex size-4 items-center justify-center rounded-full transition",
                      ativa === c.id
                        ? "hover:bg-primary/20"
                        : "hover:bg-surface-3",
                    )}
                  >
                    <MoreHorizontal className="size-3" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuItem onClick={() => abrirRenomear(c)} className="gap-2">
                    <Pencil className="size-3.5 text-primary" /> Renomear
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => abrirExcluir(c)} className="gap-2 text-destructive focus:text-destructive">
                    <Trash2 className="size-3.5" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </button>
          </div>
        ))}

        {/* Nova carteira */}
        <button
          onClick={abrirNova}
          className="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-border px-3 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-primary"
        >
          <Plus className="size-3" />
          Nova carteira
        </button>
      </div>

      {/* Modal: nova carteira */}
      <Dialog open={modal?.tipo === "nova"} onOpenChange={v => { if (!v) setModal(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nova carteira</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Nome</Label>
              <Input
                value={nome} onChange={e => setNome(e.target.value)}
                placeholder="Ex.: Conta PJ, Poupança pessoal…"
                onKeyDown={e => { if (e.key === "Enter") criarCarteira(); }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={v => setTipo(v as Carteira["tipo"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TIPO_LABEL) as [Carteira["tipo"], string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={criarCarteira} disabled={salvando || !nome.trim()}>
              {salvando ? "Criando…" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: renomear */}
      <Dialog open={modal?.tipo === "renomear"} onOpenChange={v => { if (!v) setModal(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Renomear carteira</DialogTitle></DialogHeader>
          <div className="grid gap-1.5">
            <Label>Novo nome</Label>
            <Input
              value={nome} onChange={e => setNome(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") renomearCarteira(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={renomearCarteira} disabled={salvando || !nome.trim()}>
              {salvando ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: confirmar exclusão */}
      <Dialog open={modal?.tipo === "excluir"} onOpenChange={v => { if (!v) setModal(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir carteira</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que quer excluir <strong className="text-foreground">
              {modal?.tipo === "excluir" ? modal.carteira.nome : ""}
            </strong>? Os lançamentos vinculados a ela ficam sem carteira.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={excluirCarteira} disabled={salvando}>
              {salvando ? "Excluindo…" : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FinanceiroLayout() {
  return (
    <div className="flex flex-col gap-5 p-5 md:p-7">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Wallet className="size-3.5 text-primary" /> Financeiro
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">Controle Financeiro</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Faturamento, custos, margem e contas — tudo numa só tela.
          </p>
        </div>
      </header>
      <FinanceiroTabs />
      <CarteiraSwitcher />
      <Outlet />
    </div>
  );
}
