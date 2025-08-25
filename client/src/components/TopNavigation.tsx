import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { Menu, CloudLightning, AlertTriangle, ChevronDown } from "lucide-react";

interface TopNavigationProps {
  onSidebarToggle: () => void;
}

export default function TopNavigation({ onSidebarToggle }: TopNavigationProps) {
  const { currentLanguage, setLanguage, translate } = useLanguage();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { data: alerts } = useQuery({
    queryKey: ["/api/weather/alerts"],
    refetchInterval: 60000, // Refresh every minute
  });

  const activeAlerts = alerts?.filter((alert: any) => alert.isActive) || [];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSidebarToggle}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              data-testid="button-sidebar-toggle"
            >
              <Menu className="w-6 h-6" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <CloudLightning className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-blue-600">StormLead Master</span>
              <Badge variant="secondary" className="bg-orange-500 text-white text-xs font-medium">
                #1 Platform
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <Button
                variant={currentLanguage === 'en' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLanguage('en')}
                className="px-3 py-1 text-sm font-medium"
                data-testid="button-lang-en"
              >
                EN
              </Button>
              <Button
                variant={currentLanguage === 'es' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLanguage('es')}
                className="px-3 py-1 text-sm font-medium"
                data-testid="button-lang-es"
              >
                ES
              </Button>
            </div>
            
            {/* Weather Alert */}
            {activeAlerts.length > 0 && (
              <div className="flex items-center space-x-2 bg-yellow-500 text-white px-3 py-2 rounded-lg">
                <AlertTriangle className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium" data-testid="text-active-alerts">
                  {activeAlerts.length} Active Alerts
                </span>
              </div>
            )}
            
            {/* User Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3"
                data-testid="button-user-menu"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">JD</span>
                </div>
                <span className="text-sm font-medium">John Doe</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </Button>
              
              {/* User dropdown would be implemented here */}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
