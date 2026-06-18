export const COR_PRESETS = [
  { label: "Verde Limão", value: "oklch(0.88 0.22 130)", classe: "bg-[oklch(0.88_0.22_130)]" },
  { label: "Azul",        value: "oklch(0.65 0.2 250)",  classe: "bg-[oklch(0.65_0.2_250)]"  },
  { label: "Roxo",        value: "oklch(0.65 0.22 295)", classe: "bg-[oklch(0.65_0.22_295)]" },
  { label: "Rosa",        value: "oklch(0.7 0.2 345)",   classe: "bg-[oklch(0.7_0.2_345)]"   },
  { label: "Laranja",     value: "oklch(0.75 0.18 50)",  classe: "bg-[oklch(0.75_0.18_50)]"  },
  { label: "Ciano",       value: "oklch(0.75 0.15 200)", classe: "bg-[oklch(0.75_0.15_200)]" },
  { label: "Vermelho",    value: "oklch(0.65 0.22 25)",  classe: "bg-[oklch(0.65_0.22_25)]"  },
  { label: "Amarelo",     value: "oklch(0.88 0.17 90)",  classe: "bg-[oklch(0.88_0.17_90)]"  },
  { label: "Branco",      value: "oklch(0.97 0.005 260)",classe: "bg-[oklch(0.97_0.005_260)]"},
];

export function applyBrandColor(color: string) {
  const root = document.documentElement;
  const withAlpha = color.replace(/\)$/, " / 0.5)");
  root.style.setProperty("--primary", color);
  root.style.setProperty("--sidebar-primary", color);
  root.style.setProperty("--primary-glow", color);
  root.style.setProperty("--ring", withAlpha);
  root.style.setProperty("--sidebar-ring", withAlpha);
}
