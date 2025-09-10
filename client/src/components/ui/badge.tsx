import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  'data-testid'?: string;
}

export function Badge({ children, variant = 'default', className, 'data-testid': testId }: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium';
  
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    destructive: 'bg-red-100 text-red-800',
    outline: 'border border-gray-300 text-gray-700'
  };
  
  return (
    <span 
      className={cn(baseClasses, variantClasses[variant], className)}
      data-testid={testId}
    >
      {children}
    </span>
  );
}