export function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

export function SchoolIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10l9-5 9 5-9 5-9-5Z" fill="currentColor" opacity="0.15"/>
      <path d="M3 10l9-5 9 5-9 5-9-5Zm2 3v5h14v-5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

export function RouteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="6" r="2" fill="currentColor"/>
      <circle cx="18" cy="18" r="2" fill="currentColor"/>
      <path d="M8 6h3a5 5 0 0 1 5 5v1a5 5 0 0 0 5 5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

export function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M16 9h4v6h-4a3 3 0 1 1 0-6Z" fill="currentColor" opacity="0.15"/>
      <circle cx="14" cy="12" r="1" fill="currentColor"/>
    </svg>
  );
}

export function BoardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M7 9h10M7 12h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 4h7a2 2 0 0 1 2 2v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 18v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 12h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="m17 8 4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 20h7a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
