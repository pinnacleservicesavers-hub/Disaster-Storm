const NEON = {
  yellow: '#eaff00',
  blue: '#00c2ff',
};

interface BadgeProps {
  tone: 'yellow' | 'blue';
  children: React.ReactNode;
}

export function Badge({ tone, children }: BadgeProps) {
  const styles = {
    yellow: `bg-[${NEON.yellow}]/15 text-[${NEON.yellow}] ring-[${NEON.yellow}]/30`,
    blue: `bg-[${NEON.blue}]/15 text-[${NEON.blue}] ring-[${NEON.blue}]/30`,
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 backdrop-blur ${styles[tone]} whitespace-nowrap`}>
      {children}
    </span>
  );
}
