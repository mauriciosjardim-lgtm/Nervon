/** Logo do Google Agenda (Google Calendar) — versão simplificada e reconhecível. */
export function GoogleCalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Google Agenda">
      <rect x="4" y="5" width="16" height="15" rx="2.5" fill="#fff" stroke="#DADCE0" strokeWidth="0.5" />
      <rect x="4" y="5" width="16" height="3.5" rx="2.5" fill="#4285F4" />
      <rect x="4" y="6.5" width="16" height="2" fill="#4285F4" />
      <text x="12" y="16.4" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="7" fontWeight="700" fill="#1A73E8">31</text>
    </svg>
  );
}
