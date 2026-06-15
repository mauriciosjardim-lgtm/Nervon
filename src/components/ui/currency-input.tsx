import * as React from "react";
import { Input } from "./input";
import { formatBRL, maskCurrency } from "@/lib/format";

type Props = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  /** Valor numérico (ex.: 1500 = R$ 1.500,00). */
  value: number;
  /** Recebe o novo valor numérico já parseado. */
  onValueChange: (value: number) => void;
};

/**
 * Input de moeda com máscara ao vivo baseada em centavos.
 * Armazena o valor como número; exibe sempre "R$ 0.000,00".
 */
export const CurrencyInput = React.forwardRef<HTMLInputElement, Props>(
  ({ value, onValueChange, placeholder = "R$ 0,00", ...props }, ref) => {
    const [display, setDisplay] = React.useState(() => (value ? formatBRL(value, true) : ""));

    // Re-sincroniza quando o valor numérico muda por fora (ex.: abrir modal de edição).
    React.useEffect(() => {
      setDisplay((prev) => {
        const parsed = maskCurrency(prev).value;
        return parsed === value ? prev : value ? formatBRL(value, true) : "";
      });
    }, [value]);

    return (
      <Input
        ref={ref}
        inputMode="numeric"
        placeholder={placeholder}
        value={display}
        onChange={(e) => {
          const { display: d, value: v } = maskCurrency(e.target.value);
          setDisplay(d);
          onValueChange(v);
        }}
        {...props}
      />
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";
