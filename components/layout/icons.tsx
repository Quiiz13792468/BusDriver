export function BusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 3h12a2 2 0 0 1 2 2v10.5a2.5 2.5 0 0 1-2.5 2.5H17v2a1 1 0 1 1-2 0v-2H9v2a1 1 0 1 1-2 0v-2H6.5A2.5 2.5 0 0 1 4 15.5V5a2 2 0 0 1 2-2Zm0 2v7h12V5H6Zm.5 9a1.5 1.5 0 1 0 0 3h.01a1.5 1.5 0 1 0 0-3Zm11 0a1.5 1.5 0 1 0 0 3h.01a1.5 1.5 0 1 0 0-3Z"
        fill="currentColor"
      />
      <rect x="7" y="6" width="10" height="4" rx="1" fill="currentColor" opacity="0.15" />
    </svg>
  );
}
