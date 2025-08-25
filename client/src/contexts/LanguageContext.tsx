import { createContext, useContext, useState, useEffect } from "react";

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  translate: (key: string) => string;
  translations: Record<string, Record<string, string>>;
}

const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    weather_radar: "Weather Radar",
    claims_management: "Claims Management",
    market_comparables: "Market Comparables",
    data_warehouse: "Data Warehouse",
    legal_compliance: "Legal Compliance",
    drone_integration: "Drone Integration",
    ai_assistant: "AI Assistant",
    field_reports: "Field Reports",
    settings: "Settings",
    
    // Dashboard
    storm_operations_dashboard: "Storm Operations Dashboard",
    dashboard_subtitle: "Real-time storm tracking, claims management, and market intelligence",
    new_claim: "New Claim",
    export_report: "Export Report",
    active_claims: "Active Claims",
    total_payouts: "Total Payouts",
    storm_alerts: "Storm Alerts",
    success_rate: "Success Rate",
    
    // Weather
    live_weather_radar: "Live Weather Radar",
    weather_alerts: "Weather Alerts",
    last_updated: "Last Updated",
    view_full_radar: "View Full Radar",
    
    // Claims
    insurance_payout_tracker: "Insurance Company Payout Tracker",
    avg_payout: "Avg Payout",
    claims_count: "Claims",
    success_rate_short: "Success Rate",
    trend: "Trend",
    
    // Legal
    legal_compliance_tracker: "Legal Compliance",
    lien_deadlines: "Multi-state lien deadlines",
    compliant: "Compliant",
    action_needed: "Action needed",
    days_left: "days left",
    view_all_states: "View All States",
    
    // Field Reports
    field_reports_title: "Field Reports",
    crews_active: "Crews Active",
    urgent: "Urgent",
    high_priority: "High Priority",
    normal_priority: "Normal Priority",
    low_priority: "Low Priority",
    review: "Review",
    prioritize: "Prioritize",
    
    // Drone
    live_drone_footage: "Live Drone Footage",
    recording: "Recording",
    connected_operators: "Connected Operators",
    manage_sources: "Manage Sources",
    save_clip: "Save Clip",
    
    // AI Assistant
    ai_assistant_title: "AI Assistant",
    ai_subtitle: "Bilingual support • Market analysis • Legal guidance",
    generate_letter: "Generate Letter",
    run_analysis: "Run Analysis",
    get_guidance: "Get Guidance",
    claim_letters: "Claim Letters",
    market_analysis: "Market Analysis",
    legal_guidance: "Legal Guidance",
    
    // Common
    loading: "Loading...",
    error: "Error",
    refresh: "Refresh",
    view_details: "View Details",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    create: "Create",
    update: "Update",
  },
  es: {
    // Navigation
    dashboard: "Panel de Control",
    weather_radar: "Radar Meteorológico",
    claims_management: "Gestión de Reclamos",
    market_comparables: "Comparables de Mercado",
    data_warehouse: "Almacén de Datos",
    legal_compliance: "Cumplimiento Legal",
    drone_integration: "Integración de Drones",
    ai_assistant: "Asistente IA",
    field_reports: "Reportes de Campo",
    settings: "Configuración",
    
    // Dashboard
    storm_operations_dashboard: "Panel de Operaciones de Tormentas",
    dashboard_subtitle: "Seguimiento de tormentas en tiempo real, gestión de reclamos e inteligencia de mercado",
    new_claim: "Nuevo Reclamo",
    export_report: "Exportar Informe",
    active_claims: "Reclamos Activos",
    total_payouts: "Pagos Totales",
    storm_alerts: "Alertas de Tormenta",
    success_rate: "Tasa de Éxito",
    
    // Weather
    live_weather_radar: "Radar Meteorológico en Vivo",
    weather_alerts: "Alertas Meteorológicas",
    last_updated: "Última Actualización",
    view_full_radar: "Ver Radar Completo",
    
    // Claims
    insurance_payout_tracker: "Rastreador de Pagos de Seguros",
    avg_payout: "Pago Promedio",
    claims_count: "Reclamos",
    success_rate_short: "Tasa de Éxito",
    trend: "Tendencia",
    
    // Legal
    legal_compliance_tracker: "Cumplimiento Legal",
    lien_deadlines: "Fechas límite de gravámenes multiestado",
    compliant: "Conforme",
    action_needed: "Acción requerida",
    days_left: "días restantes",
    view_all_states: "Ver Todos los Estados",
    
    // Field Reports
    field_reports_title: "Reportes de Campo",
    crews_active: "Equipos Activos",
    urgent: "Urgente",
    high_priority: "Alta Prioridad",
    normal_priority: "Prioridad Normal",
    low_priority: "Baja Prioridad",
    review: "Revisar",
    prioritize: "Priorizar",
    
    // Drone
    live_drone_footage: "Transmisión de Drones en Vivo",
    recording: "Grabando",
    connected_operators: "Operadores Conectados",
    manage_sources: "Gestionar Fuentes",
    save_clip: "Guardar Clip",
    
    // AI Assistant
    ai_assistant_title: "Asistente IA",
    ai_subtitle: "Soporte bilingüe • Análisis de mercado • Orientación legal",
    generate_letter: "Generar Carta",
    run_analysis: "Ejecutar Análisis",
    get_guidance: "Obtener Orientación",
    claim_letters: "Cartas de Reclamo",
    market_analysis: "Análisis de Mercado",
    legal_guidance: "Orientación Legal",
    
    // Common
    loading: "Cargando...",
    error: "Error",
    refresh: "Actualizar",
    view_details: "Ver Detalles",
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    create: "Crear",
    update: "Actualizar",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    return localStorage.getItem('stormlead-language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('stormlead-language', currentLanguage);
  }, [currentLanguage]);

  const setLanguage = (lang: string) => {
    setCurrentLanguage(lang);
  };

  const translate = (key: string): string => {
    return translations[currentLanguage as keyof typeof translations]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      setLanguage,
      translate,
      translations
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
