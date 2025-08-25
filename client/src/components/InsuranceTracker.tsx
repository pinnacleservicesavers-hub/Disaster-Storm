import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInsuranceCompanies } from "@/hooks/useInsuranceData";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function InsuranceTracker() {
  const { translate } = useLanguage();
  const { data: companies, isLoading } = useInsuranceCompanies();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  if (isLoading) {
    return (
      <Card data-testid="card-insurance-tracker">
        <CardHeader>
          <CardTitle>{translate('insurance_payout_tracker')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-shimmer h-64 rounded-lg"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-insurance-tracker">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-xl font-semibold text-gray-900">
          {translate('insurance_payout_tracker')}
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Compare payout rates across carriers
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="text-left py-3 text-sm font-medium text-gray-700">
                  Insurance Company
                </th>
                <th className="text-center py-3 text-sm font-medium text-gray-700">
                  {translate('avg_payout')}
                </th>
                <th className="text-center py-3 text-sm font-medium text-gray-700">
                  {translate('claims_count')}
                </th>
                <th className="text-center py-3 text-sm font-medium text-gray-700">
                  {translate('success_rate_short')}
                </th>
                <th className="text-center py-3 text-sm font-medium text-gray-700">
                  {translate('trend')}
                </th>
              </tr>
            </thead>
            <tbody>
              {companies?.map((company, index) => (
                <tr key={company.id} className="hover:bg-gray-50" data-testid={`insurance-row-${index}`}>
                  <td className="py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {company.code}
                        </span>
                      </div>
                      <span className="ml-3 font-medium" data-testid={`company-name-${index}`}>
                        {company.name}
                      </span>
                    </div>
                  </td>
                  <td className="text-center py-4 font-medium" data-testid={`avg-payout-${index}`}>
                    {formatCurrency(company.avgPayout)}
                  </td>
                  <td className="text-center py-4 text-gray-600" data-testid={`claims-count-${index}`}>
                    {company.totalClaims}
                  </td>
                  <td className="text-center py-4">
                    <Badge 
                      variant={company.successRate >= 90 ? "default" : "secondary"}
                      className={
                        company.successRate >= 90 
                          ? "bg-green-100 text-green-800" 
                          : company.successRate >= 85 
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }
                      data-testid={`success-rate-${index}`}
                    >
                      {formatPercentage(company.successRate)}
                    </Badge>
                  </td>
                  <td className="text-center py-4">
                    <div className="flex items-center justify-center">
                      {company.payoutTrend >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                      )}
                      <span 
                        className={`text-sm font-medium ${
                          company.payoutTrend >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                        data-testid={`trend-${index}`}
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
  );
}
