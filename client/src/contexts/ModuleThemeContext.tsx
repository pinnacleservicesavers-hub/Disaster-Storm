import { createContext, useContext, useState, ReactNode } from 'react';
import { ModuleTheme, MODULE_THEMES } from '@shared/moduleThemes';

interface ModuleThemeContextType {
  currentTheme: ModuleTheme | null;
  setModuleTheme: (moduleId: string) => void;
  getTheme: (moduleId: string) => ModuleTheme | undefined;
}

const ModuleThemeContext = createContext<ModuleThemeContextType | undefined>(undefined);

export function ModuleThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ModuleTheme | null>(null);

  const setModuleTheme = (moduleId: string) => {
    const theme = MODULE_THEMES[moduleId];
    if (theme) {
      setCurrentTheme(theme);
    }
  };

  const getTheme = (moduleId: string) => {
    return MODULE_THEMES[moduleId];
  };

  return (
    <ModuleThemeContext.Provider value={{ currentTheme, setModuleTheme, getTheme }}>
      {children}
    </ModuleThemeContext.Provider>
  );
}

export function useModuleTheme() {
  const context = useContext(ModuleThemeContext);
  if (!context) {
    throw new Error('useModuleTheme must be used within ModuleThemeProvider');
  }
  return context;
}
