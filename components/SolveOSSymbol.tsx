interface SolveOSSymbolProps {
  active?: boolean;
  className?: string;
  decorative?: boolean;
}

export default function SolveOSSymbol({
  active = false,
  className = '',
  decorative = true
}: SolveOSSymbolProps) {
  return (
    <span
      className={`solveos-symbol ${className}`}
      aria-hidden={decorative}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'SolveOS decision core'}
    >
      <span className="logo-core-halo" />
      <span className="logo-core-shell">
        <span className={`decision-core-symbol logo-core-ring ${active ? 'animate-active-core' : 'animate-breathing-core'}`}>
          <span className="logo-core-dot" />
          <span className="logo-core-orbit" />
        </span>
      </span>
    </span>
  );
}
