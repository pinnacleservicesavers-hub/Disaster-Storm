import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  LayoutDashboard,
  CloudRain,
  ClipboardList,
  TrendingUp,
  Database,
  Scale,
  Plane,
  Bot,
  Smartphone,
  Settings
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
}

const navigationItems = [
  { href: "/", icon: LayoutDashboard, labelKey: "dashboard", testId: "nav-dashboard" },
  { href: "/weather", icon: CloudRain, labelKey: "weather_radar", testId: "nav-weather" },
  { href: "/claims", icon: ClipboardList, labelKey: "claims_management", testId: "nav-claims" },
  { href: "/market-comparables", icon: TrendingUp, labelKey: "market_comparables", testId: "nav-market" },
  { href: "/data-warehouse", icon: Database, labelKey: "data_warehouse", testId: "nav-data" },
  { href: "/legal-compliance", icon: Scale, labelKey: "legal_compliance", testId: "nav-legal" },
  { href: "/drone-integration", icon: Plane, labelKey: "drone_integration", testId: "nav-drone" },
  { href: "/ai-assistant", icon: Bot, labelKey: "ai_assistant", testId: "nav-ai" },
  { href: "/field-reports", icon: Smartphone, labelKey: "field_reports", testId: "nav-field" },
  { href: "/settings", icon: Settings, labelKey: "settings", testId: "nav-settings" },
];

export default function Sidebar({ collapsed }: SidebarProps) {
  const [location] = useLocation();
  const { translate } = useLanguage();

  return (
    <aside 
      className={cn(
        "bg-white shadow-sm border-r border-gray-200 fixed left-0 top-16 bottom-0 z-40 overflow-hidden transition-all duration-300",
        collapsed ? "w-16" : "w-280"
      )}
    >
      <div className="p-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <div key={item.href} className="sidebar-item-wrapper">
              <Link
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                data-testid={item.testId}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="ml-3 sidebar-text">
                    {translate(item.labelKey)}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
