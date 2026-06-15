import * as React from "react";
import { Input } from "./input";
import { maskPhone } from "@/lib/format";

type Props = Omit<React.ComponentProps<typeof Input>, "onChange" | "type"> & {
  /** Recebe o telefone já mascarado: "(51) 99999-8888". */
  onValueChange: (value: string) => void;
};

/** Input de telefone BR com máscara ao vivo. */
export const PhoneInput = React.forwardRef<HTMLInputElement, Props>(
  ({ value, onValueChange, placeholder = "(51) 99999-8888", ...props }, ref) => {
    return (
      <Input
        ref={ref}
        inputMode="tel"
        placeholder={placeholder}
        value={typeof value === "string" ? maskPhone(value) : value}
        onChange={(e) => onValueChange(maskPhone(e.target.value))}
        {...props}
      />
    );
  },
);
PhoneInput.displayName = "PhoneInput";
