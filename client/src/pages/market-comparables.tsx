import { useState } from "react";
import TopNavigation from "@/components/TopNavigation";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInsuranceAnalytics } from "@/hooks/useInsuranceData";
import { TrendingUp, TrendingDown, BarChart3, Bot, Lightbulb } from "lucide-react";

export default function MarketComparables() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { translate } = useLanguage();
  const analytics = useInsuranceAnalytics();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
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
            <div className="mb-8">
              <div className="flex items-center space-x-3">
                <Bot className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900" data-testid="market-page-title">
                    AI {translate('market_comparables')}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    AI-powered market analysis and claim benchmarking
                  </p>
                </div>
              </div>
            </div>

            {/* Market Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card data-testid="card-market-average">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Market Average Payout</p>
                      <p className="text-3xl font-bold text-gray-900" data-testid="market-avg-value">
                        {formatCurrency(analytics.payoutTrends.reduce((sum, p) => sum + p.avgPayout, 0) / Math.max(analytics.payoutTrends.length, 1))}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="text-blue-600 w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600 text-sm font-medium">+12.3%</span>
                    <span className="text-gray-500 text-sm ml-2">vs last quarter</span>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-ai-recommendations">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">AI Recommendations</p>
                      <p className="text-3xl font-bold text-gray-900" data-testid="ai-recommendations-count">
                        247
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Lightbulb className="text-purple-600 w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-purple-600 text-sm font-medium">94% accuracy</span>
                    <span className="text-gray-500 text-sm ml-2">in negotiations</span>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-success-impact">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Success Impact</p>
                      <p className="text-3xl font-bold text-gray-900" data-testid="success-impact-value">
                        +18.5%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-green-600 w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-green-600 text-sm font-medium">Higher payouts</span>
                    <span className="text-gray-500 text-sm ml-2">with AI assistance</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Companies */}
            <Card className="mb-8" data-testid="card-top-performers">
              <CardHeader>
                <CardTitle>Top Performing Insurance Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topPerformers.map((company, index) => (
                    <div 
                      key={company.id} 
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      data-testid={`top-performer-${index}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {company.code}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium" data-testid={`performer-name-${index}`}>
                            {company.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {company.totalClaims} claims processed
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg" data-testid={`performer-avg-${index}`}>
                          {formatCurrency(company.avgPayout)}
                        </div>
                        <div className="flex items-center">
                          <Badge className="bg-green-100 text-green-800">
                            {company.successRate}% success rate
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card data-testid="card-ai-insights">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-primary" />
                  AI Market Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="text-white w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Tree Removal Premium Rates</h4>
                        <p className="text-sm text-gray-700 mb-3">
                          GEICO has been paying 23% above market average for crane-assisted tree removals in the Southeast region. 
                          Consider highlighting crane requirements and access challenges in your estimates.
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">
                            High confidence
                          </Badge>
                          <span className="text-sm text-gray-500">Based on 89 similar claims</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="text-white w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Allstate Payout Reduction</h4>
                        <p className="text-sm text-gray-700 mb-3">
                          Allstate has reduced average payouts by 8% over the last quarter. Consider providing more detailed 
                          documentation and before/after photos for claims with this carrier.
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-orange-100 text-orange-800">
                            Medium confidence
                          </Badge>
                          <span className="text-sm text-gray-500">Based on 34 recent claims</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="text-white w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Regional Market Trends</h4>
                        <p className="text-sm text-gray-700 mb-3">
                          Storm damage claims in Georgia are averaging 15% higher payouts than neighboring states. 
                          Leverage this data in negotiations for out-of-state adjusters.
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-blue-100 text-blue-800">
                            High confidence
                          </Badge>
                          <span className="text-sm text-gray-500">Based on 156 regional claims</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
