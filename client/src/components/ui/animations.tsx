import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Fade in animation
export const FadeIn = ({ 
  children, 
  delay = 0, 
  duration = 0.5,
  className 
}: { 
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

// Slide in from direction
export const SlideIn = ({ 
  children, 
  direction = 'left',
  delay = 0,
  duration = 0.5,
  className 
}: { 
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
}) => {
  const directionMap = {
    left: { x: -50, y: 0 },
    right: { x: 50, y: 0 },
    up: { x: 0, y: -50 },
    down: { x: 0, y: 50 }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay, duration, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Scale animation
export const ScaleIn = ({ 
  children, 
  delay = 0,
  duration = 0.5,
  className 
}: { 
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

// Hover lift effect
export const HoverLift = ({ 
  children, 
  lift = 8,
  className 
}: { 
  children: ReactNode;
  lift?: number;
  className?: string;
}) => (
  <motion.div
    whileHover={{ 
      y: -lift,
      transition: { duration: 0.2 }
    }}
    whileTap={{ scale: 0.98 }}
    className={cn("cursor-pointer", className)}
  >
    {children}
  </motion.div>
);

// Pulse animation for alerts
export const PulseAlert = ({ 
  children,
  intensity = 'normal',
  className 
}: { 
  children: ReactNode;
  intensity?: 'subtle' | 'normal' | 'strong';
  className?: string;
}) => {
  const intensityMap = {
    subtle: { scale: [1, 1.02, 1] },
    normal: { scale: [1, 1.05, 1] },
    strong: { scale: [1, 1.08, 1] }
  };

  return (
    <motion.div
      animate={intensityMap[intensity]}
      transition={{ 
        duration: 2, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Stagger children animation
export const StaggerContainer = ({ 
  children, 
  staggerDelay = 0.1,
  className 
}: { 
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay
        }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Stagger child item
export const StaggerItem = ({ 
  children, 
  className 
}: { 
  children: ReactNode;
  className?: string;
}) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Loading spinner
export const LoadingSpinner = ({ 
  size = 'normal',
  className 
}: {
  size?: 'small' | 'normal' | 'large';
  className?: string;
}) => {
  const sizeMap = {
    small: 'w-4 h-4',
    normal: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn(
        sizeMap[size],
        "border-2 border-primary border-t-transparent rounded-full",
        className
      )}
    />
  );
};

// Progress bar with animation
export const AnimatedProgress = ({ 
  value, 
  max = 100,
  className,
  showLabel = false,
  label = ''
}: {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
}) => {
  const percentage = Math.min(100, (value / max) * 100);
  
  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-2">
          <span>{label}</span>
          <span>{value}/{max}</span>
        </div>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-primary rounded-full"
        />
      </div>
    </div>
  );
};

// Number counter animation
export const CountUp = ({ 
  end, 
  duration = 2,
  prefix = '',
  suffix = '',
  className 
}: {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) => {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration }}
      >
        {prefix}{end}{suffix}
      </motion.span>
    </motion.span>
  );
};

// Slide up panel
export const SlideUpPanel = ({ 
  children, 
  isOpen, 
  onClose,
  className 
}: {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className={cn(
            "fixed bottom-0 left-0 right-0 bg-background rounded-t-lg p-6 z-50",
            className
          )}
        >
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// Weather effect animations
export const RainEffect = ({ intensity = 'normal' }: { intensity?: 'light' | 'normal' | 'heavy' }) => {
  const drops = intensity === 'light' ? 50 : intensity === 'normal' ? 100 : 150;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {Array.from({ length: drops }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            y: -10, 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            opacity: 0.3 + Math.random() * 0.7
          }}
          animate={{ 
            y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 10,
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000) - 50
          }}
          transition={{
            duration: 1 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "linear"
          }}
          className="absolute w-px h-4 bg-blue-400 opacity-60"
          style={{
            left: Math.random() * 100 + '%'
          }}
        />
      ))}
    </div>
  );
};

// Lightning flash effect
export const LightningFlash = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ 
      opacity: [0, 1, 0, 1, 0],
      backgroundColor: ["transparent", "rgba(255, 255, 255, 0.8)", "transparent", "rgba(255, 255, 255, 0.6)", "transparent"]
    }}
    transition={{ 
      duration: 0.3,
      times: [0, 0.1, 0.2, 0.25, 1],
      repeat: Infinity,
      repeatDelay: 3 + Math.random() * 5
    }}
    className="fixed inset-0 pointer-events-none z-10"
  />
);