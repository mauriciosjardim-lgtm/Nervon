import { createFileRoute } from "@tanstack/react-router";
import { comercial, useComercial, getEmpresa } from "@/lib/hooks/useComercial";
import { Input } from "@/components/ui/input";
import { Edit3, Mail, Phone, Star } from "lucide-react";

export const Route = createFileRoute("/comercial/contatos")({
  component: ContatosPage,
});

function ContatosPage() {
  const contatos = useComercial(s => s.contatos);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-1/40">
      <table className="w-full text-sm">
        <thead className="bg-surface-2/60 text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <Th>Contato</Th><Th>Empresa</Th><Th>Cargo</Th><Th>E-mail</Th><Th>Telefone</Th>
          </tr>
        </thead>
        <tbody>
          {contatos.map(c => {
            const e = getEmpresa(c.empresaId);
            return (
              <tr key={c.id} className="border-t border-border/60 transition hover:bg-surface-2/40">
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-2">
                    <ContactField
                      value={c.nome}
                      className="font-medium"
                      onSave={(nome) => comercial.updateContato(c.id, { nome })}
                    />
                    {c.principal && <Star className="size-3 fill-primary text-primary" />}
                  </div>
                </td>
                <td className="px-4 py-3 align-top text-muted-foreground">{e?.nome}</td>
                <td className="px-4 py-3 align-top">
                  <ContactField value={c.cargo} onSave={(cargo) => comercial.updateContato(c.id, { cargo })} />
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-1.5">
                    <Mail className="size-3 shrink-0 text-primary" />
                    <ContactField value={c.email} type="email" onSave={(email) => comercial.updateContato(c.id, { email })} />
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-1.5">
                    <Phone className="size-3 shrink-0 text-primary" />
                    <ContactField value={c.telefone} type="tel" onSave={(telefone) => comercial.updateContato(c.id, { telefone })} />
                  </div>
                </td>
              </tr>
            );
          })}
          {contatos.length === 0 && (
            <tr><td colSpan={5} className="p-10 text-center text-sm text-muted-foreground">Nenhum contato ainda. Eles aparecem aqui automaticamente quando você cadastra leads.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => <th className="px-4 py-2.5 text-left font-semibold">{children}</th>;

function ContactField({
  value,
  onSave,
  type = "text",
  className,
}: {
  value: string;
  onSave: (value: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <div className="group relative inline-flex items-center">
      <Input
        type={type}
        defaultValue={value}
        onBlur={(event) => {
          const nextValue = event.currentTarget.value.trim();
          if (nextValue !== value) onSave(nextValue || "—");
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        className={`h-8 min-w-[140px] border-border/60 bg-surface-2/30 px-2 pr-7 text-xs shadow-none hover:border-primary/50 focus-visible:border-primary focus-visible:ring-primary/30 ${className ?? ""}`}
      />
      <Edit3 className="pointer-events-none absolute right-2 size-3 text-primary opacity-70 transition group-focus-within:opacity-100" />
    </div>
  );
}
