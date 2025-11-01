interface BadgeProps {
  tone: 'orange' | 'green' | 'blue' | 'sky';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ tone, children, className = '', style }: BadgeProps) {
  const styles = {
    orange: 'bg-orange-500/90 text-white',
    green: 'bg-emerald-500/90 text-white',
    blue: 'bg-blue-500/90 text-white',
    sky: 'bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/30'
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[tone]} ${className}`}
      style={style}
      data-testid={`badge-${tone}`}
    >
      {children}
    </span>
  );
}
