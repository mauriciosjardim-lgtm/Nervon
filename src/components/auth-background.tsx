/**
 * Fundo animado para as telas de autenticação (login / onboarding).
 * CSS puro, sem JS de animação — usa a cor de marca (--primary) e
 * respeita prefers-reduced-motion. Fica atrás do conteúdo.
 */
export function AuthBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-background" aria-hidden>
      <style>{css}</style>

      {/* Grade sutil com fade radial nas bordas */}
      <div className="auth-grid absolute inset-0" />

      {/* Auroras que flutuam lentamente */}
      <div className="auth-orb auth-orb--a" />
      <div className="auth-orb auth-orb--b" />
      <div className="auth-orb auth-orb--c" />

      {/* Brilho conico girando devagar no centro */}
      <div className="auth-shimmer absolute left-1/2 top-1/2" />

      {/* Partículas subindo */}
      <div className="auth-dust">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>

      {/* Vinheta para escurecer as bordas e dar foco ao card */}
      <div className="absolute inset-0 [background:radial-gradient(120%_120%_at_50%_40%,transparent_40%,var(--background)_100%)]" />
    </div>
  );
}

const css = `
.auth-grid {
  background-image:
    linear-gradient(to right, color-mix(in oklch, var(--primary) 14%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--primary) 14%, transparent) 1px, transparent 1px);
  background-size: 46px 46px;
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 45%, #000 0%, transparent 75%);
  mask-image: radial-gradient(ellipse 70% 60% at 50% 45%, #000 0%, transparent 75%);
  opacity: 0.5;
}

.auth-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(90px);
  will-change: transform;
}
.auth-orb--a {
  width: 620px; height: 620px;
  top: -180px; left: 50%;
  margin-left: -310px;
  background: radial-gradient(circle at 50% 50%, color-mix(in oklch, var(--primary) 55%, transparent), transparent 70%);
  animation: auth-float-a 22s ease-in-out infinite;
}
.auth-orb--b {
  width: 460px; height: 460px;
  bottom: -140px; left: -120px;
  background: radial-gradient(circle at 50% 50%, oklch(0.7 0.18 230 / 0.45), transparent 70%);
  animation: auth-float-b 28s ease-in-out infinite;
}
.auth-orb--c {
  width: 420px; height: 420px;
  top: 20%; right: -120px;
  background: radial-gradient(circle at 50% 50%, oklch(0.72 0.2 320 / 0.35), transparent 70%);
  animation: auth-float-c 34s ease-in-out infinite;
}

.auth-shimmer {
  width: 900px; height: 900px;
  margin: -450px 0 0 -450px;
  border-radius: 9999px;
  opacity: 0.25;
  background: conic-gradient(from 0deg,
    transparent 0deg,
    color-mix(in oklch, var(--primary) 50%, transparent) 60deg,
    transparent 140deg,
    oklch(0.7 0.18 230 / 0.5) 220deg,
    transparent 300deg,
    transparent 360deg);
  -webkit-mask-image: radial-gradient(circle, transparent 30%, #000 55%, transparent 72%);
  mask-image: radial-gradient(circle, transparent 30%, #000 55%, transparent 72%);
  animation: auth-spin 40s linear infinite;
}

.auth-dust { position: absolute; inset: 0; }
.auth-dust span {
  position: absolute;
  bottom: -10px;
  left: calc((var(--i) * 7.1%) + 2%);
  width: 3px; height: 3px;
  border-radius: 9999px;
  background: color-mix(in oklch, var(--primary) 70%, white 10%);
  box-shadow: 0 0 8px 1px color-mix(in oklch, var(--primary) 60%, transparent);
  opacity: 0;
  animation: auth-rise linear infinite;
  animation-duration: calc(14s + (var(--i) * 1.3s));
  animation-delay: calc(var(--i) * -2.1s);
}

@keyframes auth-float-a {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(30px, 40px) scale(1.12); }
}
@keyframes auth-float-b {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(60px, -30px) scale(1.18); }
}
@keyframes auth-float-c {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(-50px, 30px) scale(1.1); }
}
@keyframes auth-spin {
  to { transform: rotate(360deg); }
}
@keyframes auth-rise {
  0%   { transform: translateY(0); opacity: 0; }
  10%  { opacity: 0.9; }
  90%  { opacity: 0.9; }
  100% { transform: translateY(-100vh); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .auth-orb, .auth-shimmer, .auth-dust span { animation: none; }
  .auth-dust { display: none; }
}
`;
