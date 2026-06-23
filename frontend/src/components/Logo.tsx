export function Logo({ className = '', light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={`font-bold tracking-tight ${className}`}>
      <span className={light ? 'text-white' : 'text-brand'}>Certifi</span>
      <span className="text-brand-accent">Campus</span>
    </span>
  );
}
