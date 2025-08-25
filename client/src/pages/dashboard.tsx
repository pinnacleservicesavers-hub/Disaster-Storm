import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import TopNavigation from "@/components/TopNavigation";
import Sidebar from "@/components/Sidebar";
import WeatherRadar from "@/components/WeatherRadar";
import InsuranceTracker from "@/components/InsuranceTracker";
import LegalCompliance from "@/components/LegalCompliance";
import DroneViewer from "@/components/DroneViewer";
import MarketComparables from "@/components/MarketComparables";
import FieldReports from "@/components/FieldReports";
import AIAssistant from "@/components/AIAssistant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { 
  Plus, 
  FileText, 
  ClipboardList, 
  DollarSign, 
  AlertTriangle, 
  Trophy,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface DashboardSummary {
  activeClaims: number;
  totalPayouts: number;
  stormAlerts: number;
  successRate: number;
  urgentReports: number;
  lastUpdated: string;
}

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { currentLanguage, translate } = useLanguage();
  const { isConnected } = useWebSocket();

  const { data: summary, isLoading: summaryLoading } = useQuery<DashboardSummary>({
    queryKey: ["/api/dashboard/summary"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="pt-16 flex">
        <Sidebar collapsed={sidebarCollapsed} />
        
        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-280'
        }`}>
          <div className="p-6">
            {/* Dashboard Header */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900" data-testid="dashboard-title">
                    {translate('storm_operations_dashboard')}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {translate('dashboard_subtitle')}
                  </p>
                  {isConnected && (
                    <div className="flex items-center mt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-500">Live updates enabled</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 lg:mt-0 flex space-x-3">
                  <Button className="bg-orange-500 hover:bg-orange-600" data-testid="button-new-claim">
                    <Plus className="w-4 h-4 mr-2" />
                    {translate('new_claim')}
                  </Button>
                  <Button data-testid="button-export-report">
                    <FileText className="w-4 h-4 mr-2" />
                    {translate('export_report')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card data-testid="card-active-claims">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {translate('active_claims')}
                      </p>
                      <p className="text-3xl font-bold text-gray-900" data-testid="text-active-claims-count">
                        {summaryLoading ? '...' : summary?.activeClaims || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ClipboardList className="text-blue-600 w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600 text-sm font-medium">+12%</span>
                    <span className="text-gray-500 text-sm ml-2">vs last week</span>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-total-payouts">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {translate('total_payouts')}
                      </p>
                      <p className="text-3xl font-bold text-gray-900" data-testid="text-total-payouts">
                        {summaryLoading ? '...' : formatCurrency(summary?.totalPayouts || 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="text-green-600 w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600 text-sm font-medium">+8.5%</span>
                    <span className="text-gray-500 text-sm ml-2">vs last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-storm-alerts">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {translate('storm_alerts')}
                      </p>
                      <p className="text-3xl font-bold text-yellow-600" data-testid="text-storm-alerts-count">
                        {summaryLoading ? '...' : summary?.stormAlerts || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="text-yellow-600 w-6 h-6 animate-pulse" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-yellow-600 text-sm font-medium">2 Tornado</span>
                    <span className="text-gray-500 text-sm ml-2">1 Severe T-Storm</span>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-success-rate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {translate('success_rate')}
                      </p>
                      <p className="text-3xl font-bold text-gray-900" data-testid="text-success-rate">
                        {summaryLoading ? '...' : formatPercentage(summary?.successRate || 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Trophy className="text-green-600 w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600 text-sm font-medium">+2.1%</span>
                    <span className="text-gray-500 text-sm ml-2">this quarter</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <WeatherRadar />
              <MarketComparables />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2">
                <InsuranceTracker />
              </div>
              <LegalCompliance />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <DroneViewer />
              <FieldReports />
            </div>

            {/* AI Assistant Section */}
            <AIAssistant />
          </div>
        </main>
      </div>
    </div>
  );
}
