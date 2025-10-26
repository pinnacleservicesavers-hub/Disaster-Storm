import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ModuleTheme } from '@shared/moduleThemes';
import { getModuleBackground } from '@shared/moduleBackgrounds';

interface ModuleHeroProps {
  theme: ModuleTheme;
  children?: ReactNode;
  customHeight?: string;
}

export function ModuleHero({ theme, children, customHeight = '400px' }: ModuleHeroProps) {
  const animationVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.8 }
    },
    slide: {
      initial: { opacity: 0, y: 40 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
    },
    zoom: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
    },
    parallax: {
      initial: { opacity: 0, scale: 1.1 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 1.2, ease: [0.4, 0, 0.2, 1] }
    }
  };

  const animation = animationVariants[theme.heroAnimation] || animationVariants.fade;
  const background = getModuleBackground(theme.id);

  return (
    <motion.div
      className="module-hero relative overflow-hidden rounded-2xl mb-8"
      style={{ minHeight: customHeight }}
      {...animation}
    >
      {/* Background Image/Gradient */}
      <div
        className="module-hero-background absolute inset-0"
        style={{
          backgroundImage: background ? `url('${background.url}')` : `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Gradient Overlay */}
      <div
        className="module-hero-overlay absolute inset-0"
        style={{
          background: theme.gradientOverlay
        }}
      />
      
      {/* Content */}
      <div className="module-hero-content relative z-10 flex flex-col justify-center items-start h-full px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-4xl"
        >
          <h1 
            className={`text-5xl md:text-6xl lg:text-7xl font-${theme.headingWeight} text-shadow-xl mb-4`}
            style={{ color: theme.textColor }}
          >
            {theme.title}
          </h1>
          <p 
            className="text-xl md:text-2xl text-shadow-lg opacity-90 max-w-2xl"
            style={{ color: theme.textColor }}
          >
            {theme.description}
          </p>
        </motion.div>
        
        {children && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-8 w-full"
          >
            {children}
          </motion.div>
        )}
      </div>
      
      {/* Accent Line */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ 
          background: `linear-gradient(90deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%)`
        }}
      />
    </motion.div>
  );
}

interface ModuleCardProps {
  children: ReactNode;
  theme: ModuleTheme;
  className?: string;
}

export function ModuleCard({ children, theme, className = '' }: ModuleCardProps) {
  return (
    <motion.div
      className={`glass-card-pro rounded-xl p-6 ${className}`}
      style={{
        background: theme.glassEffect 
          ? `rgba(255, 255, 255, ${theme.cardOpacity})`
          : 'rgba(255, 255, 255, 0.95)',
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
