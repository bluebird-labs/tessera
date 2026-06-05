export function PrismLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="2" y="2" width="12" height="12" rx="2" fill="#5b6bff" />
      <rect x="18" y="2" width="12" height="12" rx="2" fill="#ff4d8c" />
      <rect x="2" y="18" width="12" height="12" rx="2" fill="#22d3ee" />
      <rect x="18" y="18" width="12" height="12" rx="2" fill="#a3e635" />
    </svg>
  );
}
