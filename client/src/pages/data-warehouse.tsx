import { useState } from "react";
import TopNavigation from "@/components/TopNavigation";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInsuranceCompanies, useClaims } from "@/hooks/useInsuranceData";
import { 
  Database, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Calendar,
  BarChart3,
  PieChart,
  Download
} from "lucide-react";

export default function DataWarehouse() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { translate } = useLanguage();

  const { data: companies } = useInsuranceCompanies();
  const { data: claims } = useClaims();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Calculate analytics
  const totalClaims = claims?.length || 0;
  const totalPayouts = claims?.reduce((sum, claim) => sum + (claim.paidAmount || 0), 0) || 0;
  const avgClaimValue = totalClaims > 0 ? totalPayouts / totalClaims : 0;
  const settledClaims = claims?.filter(claim => claim.status === 'settled').length || 0;
  const successRate = totalClaims > 0 ? (settledClaims / totalClaims) * 100 : 0;

  // Claims by insurance company
  const claimsByCompany = companies?.map(company => {
    const companyClaims = claims?.filter(claim => claim.insuranceCompany === company.name) || [];
    const companyPayouts = companyClaims.reduce((sum, claim) => sum + (claim.paidAmount || 0), 0);
    return {
      ...company,
      claimsCount: companyClaims.length,
      totalPayouts: companyPayouts,
      avgPayout: companyClaims.length > 0 ? companyPayouts / companyClaims.length : 0
    };
  }) || [];

  // Claims by damage type
  const damageTypes = claims?.reduce((acc, claim) => {
    acc[claim.damageType] = (acc[claim.damageType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Monthly trends (mock data for demonstration)
  const monthlyTrends = [
    { month: 'Jan', claims: 45, payouts: 275000 },
    { month: 'Feb', claims: 52, payouts: 320000 },
    { month: 'Mar', claims: 38, payouts: 285000 },
    { month: 'Apr', claims: 61, payouts: 410000 },
    { month: 'May', claims: 48, payouts: 335000 },
    { month: 'Jun', claims: 71, payouts: 485000 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="pt-16 flex">
        <Sidebar collapsed={sidebarCollapsed} />
        
        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-280'
        }`}>
          <div className="p-6">
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center space-x-3">
                  <Database className="w-8 h-8 text-primary" />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900" data-testid="data-warehouse-title">
                      {translate('data_warehouse')}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Comprehensive analytics and business intelligence
                    </p>
                  </div>
                </div>
                <div className="mt-4 lg:mt-0 flex space-x-3">
                  <Button variant="outline" data-testid="button-export-data">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                  <Button data-testid="button-generate-report">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </div>
            </div>

            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card data-testid="card-total-claims">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Claims</p>
                      <p className="text-3xl font-bold text-gray-900" data-testid="total-claims-count">
                        {totalClaims}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="text-blue-600 w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600 text-sm font-medium">+15%</span>
                    <span className="text-gray-500 text-sm ml-2">vs last quarter</span>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-total-payouts">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Payouts</p>
                      <p className="text-3xl font-bold text-gray-900" data-testid="total-payouts-amount">
                        {formatCurrency(totalPayouts)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="text-green-600 w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600 text-sm font-medium">+22%</span>
                    <span className="text-gray-500 text-sm ml-2">vs last quarter</span>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-avg-claim-value">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Claim Value</p>
                      <p className="text-3xl font-bold text-gray-900" data-testid="avg-claim-value">
                        {formatCurrency(avgClaimValue)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="text-purple-600 w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600 text-sm font-medium">+8%</span>
                    <span className="text-gray-500 text-sm ml-2">vs last quarter</span>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-success-rate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Success Rate</p>
                      <p className="text-3xl font-bold text-gray-900" data-testid="success-rate-percentage">
                        {formatPercentage(successRate)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-orange-600 w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600 text-sm font-medium">+3%</span>
                    <span className="text-gray-500 text-sm ml-2">vs last quarter</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Tabs */}
            <Tabs defaultValue="companies" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="companies" data-testid="tab-companies">
                  Insurance Companies
                </TabsTrigger>
                <TabsTrigger value="trends" data-testid="tab-trends">
                  Trends
                </TabsTrigger>
                <TabsTrigger value="damage-types" data-testid="tab-damage-types">
                  Damage Types
                </TabsTrigger>
                <TabsTrigger value="performance" data-testid="tab-performance">
                  Performance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="companies" className="space-y-6">
                <Card data-testid="card-company-analytics">
                  <CardHeader>
                    <CardTitle>Insurance Company Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Company</th>
                            <th>Total Claims</th>
                            <th>Total Payouts</th>
                            <th>Avg Payout</th>
                            <th>Success Rate</th>
                            <th>Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {claimsByCompany.map((company, index) => (
                            <tr key={company.id} data-testid={`company-row-${index}`}>
                              <td>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold text-sm">
                                      {company.code}
                                    </span>
                                  </div>
                                  <span className="font-medium">{company.name}</span>
                                </div>
                              </td>
                              <td data-testid={`company-claims-${index}`}>
                                {company.claimsCount}
                              </td>
                              <td data-testid={`company-payouts-${index}`}>
                                {formatCurrency(company.totalPayouts)}
                              </td>
                              <td data-testid={`company-avg-${index}`}>
                                {formatCurrency(company.avgPayout)}
                              </td>
                              <td>
                                <Badge 
                                  className={
                                    company.successRate >= 90 
                                      ? "bg-green-100 text-green-800" 
                                      : company.successRate >= 85 
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }
                                  data-testid={`company-success-${index}`}
                                >
                                  {formatPercentage(company.successRate)}
                                </Badge>
                              </td>
                              <td>
                                <div className="flex items-center">
                                  {company.payoutTrend >= 0 ? (
                                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                                  )}
                                  <span 
                                    className={`text-sm font-medium ${
                                      company.payoutTrend >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}
                                    data-testid={`company-trend-${index}`}
                                  >
                                    {company.payoutTrend >= 0 ? '+' : ''}{company.payoutTrend}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trends" className="space-y-6">
                <Card data-testid="card-monthly-trends">
                  <CardHeader>
                    <CardTitle>Monthly Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-4">Claims Volume</h4>
                        <div className="grid grid-cols-6 gap-4">
                          {monthlyTrends.map((month, index) => (
                            <div key={month.month} className="text-center" data-testid={`trend-month-${index}`}>
                              <div className="mb-2">
                                <div 
                                  className="bg-primary rounded-t-lg mx-auto"
                                  style={{ 
                                    height: `${(month.claims / 80) * 100}px`,
                                    width: '40px'
                                  }}
                                ></div>
                              </div>
                              <div className="text-sm font-medium">{month.claims}</div>
                              <div className="text-xs text-gray-500">{month.month}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-4">Payout Trends</h4>
                        <div className="grid grid-cols-6 gap-4">
                          {monthlyTrends.map((month, index) => (
                            <div key={month.month} className="text-center" data-testid={`payout-month-${index}`}>
                              <div className="mb-2">
                                <div 
                                  className="bg-green-500 rounded-t-lg mx-auto"
                                  style={{ 
                                    height: `${(month.payouts / 500000) * 100}px`,
                                    width: '40px'
                                  }}
                                ></div>
                              </div>
                              <div className="text-sm font-medium">{formatCurrency(month.payouts)}</div>
                              <div className="text-xs text-gray-500">{month.month}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="damage-types" className="space-y-6">
                <Card data-testid="card-damage-types">
                  <CardHeader>
                    <CardTitle>Claims by Damage Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {Object.entries(damageTypes).map(([type, count], index) => (
                          <div key={type} className="flex items-center justify-between" data-testid={`damage-type-${index}`}>
                            <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 bg-primary rounded-full"></div>
                              <span className="font-medium">{type}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{count}</div>
                              <div className="text-sm text-gray-500">
                                {formatPercentage((count / totalClaims) * 100)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <div className="w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center">
                          <PieChart className="w-16 h-16 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                <Card data-testid="card-performance-metrics">
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="text-center p-6 border border-gray-200 rounded-lg">
                        <div className="text-3xl font-bold text-primary mb-2">92.5%</div>
                        <div className="text-sm text-gray-600">Claim Processing Accuracy</div>
                      </div>
                      
                      <div className="text-center p-6 border border-gray-200 rounded-lg">
                        <div className="text-3xl font-bold text-green-600 mb-2">5.2 days</div>
                        <div className="text-sm text-gray-600">Avg Settlement Time</div>
                      </div>
                      
                      <div className="text-center p-6 border border-gray-200 rounded-lg">
                        <div className="text-3xl font-bold text-orange-600 mb-2">$18.5K</div>
                        <div className="text-sm text-gray-600">Revenue per Claim</div>
                      </div>
                      
                      <div className="text-center p-6 border border-gray-200 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600 mb-2">98.1%</div>
                        <div className="text-sm text-gray-600">Customer Satisfaction</div>
                      </div>
                      
                      <div className="text-center p-6 border border-gray-200 rounded-lg">
                        <div className="text-3xl font-bold text-purple-600 mb-2">15%</div>
                        <div className="text-sm text-gray-600">Cost Reduction</div>
                      </div>
                      
                      <div className="text-center p-6 border border-gray-200 rounded-lg">
                        <div className="text-3xl font-bold text-red-600 mb-2">2.1%</div>
                        <div className="text-sm text-gray-600">Dispute Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
