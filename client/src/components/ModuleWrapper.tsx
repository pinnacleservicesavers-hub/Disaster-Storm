import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ModuleHero } from './ModuleHero';
import { getModuleTheme } from '@shared/moduleThemes';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from './ui/button';

interface ModuleWrapperProps {
  moduleId: string;
  children: ReactNode;
  showBackButton?: boolean;
  heroHeight?: string;
  heroChildren?: ReactNode;
}

/**
 * Universal wrapper that applies enterprise-grade design to any module
 * Automatically fetches theme, background, and applies professional styling
 */
export function ModuleWrapper({ 
  moduleId, 
  children, 
  showBackButton = true,
  heroHeight,
  heroChildren 
}: ModuleWrapperProps) {
  const theme = getModuleTheme(moduleId);

  if (!theme) {
    // Fallback if theme not found - render children without wrapper
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Back Button */}
      {showBackButton && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4"
        >
          <Link href="/dashboard">
            <Button 
              variant="ghost" 
              className="text-white/90 hover:text-white hover:bg-white/10"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Command Center
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Hero Section */}
      <div className="px-4 pb-4">
        <ModuleHero theme={theme} customHeight={heroHeight}>
          {heroChildren}
        </ModuleHero>
      </div>

      {/* Main Content with Theme Context */}
      <div 
        className="px-4 pb-8"
        style={{
          '--module-primary': theme.primaryColor,
          '--module-accent': theme.accentColor,
          '--module-text': theme.textColor,
        } as React.CSSProperties}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
