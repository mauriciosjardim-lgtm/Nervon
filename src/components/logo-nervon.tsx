/**
 * Marca provisória do Nervon — "N" com contraformas em folha.
 * SVG self-contained (cores fixas) para ficar idêntico em qualquer tema/tamanho.
 */
export function LogoNervon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Nervon">
      <rect width="100" height="100" rx="24" fill="oklch(0.85 0.23 130)" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="#0a0a0a"
        d="
          M26 17 H74 V83 H26 Z
          M45 17 C62 20 64 31 60 58 C52 41 47 29 45 17 Z
          M55 83 C38 80 36 69 40 42 C48 59 53 71 55 83 Z
        "
      />
    </svg>
  );
}
