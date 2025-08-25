import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLegalCompliance } from "@/hooks/useLegalData";

export default function LegalCompliance() {
  const { translate } = useLanguage();
  const { complianceStatus, urgentCount, warningCount } = useLegalCompliance();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'action_needed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string, daysRemaining: number) => {
    if (status === 'action_needed') {
      return translate('action_needed');
    }
    if (status === 'warning') {
      return `${Math.abs(daysRemaining)} ${translate('days_left')}`;
    }
    return translate('compliant');
  };

  return (
    <Card data-testid="card-legal-compliance">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-xl font-semibold text-gray-900">
          {translate('legal_compliance_tracker')}
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          {translate('lien_deadlines')}
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          {complianceStatus.slice(0, 3).map((item, index) => (
            <div 
              key={item.state} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              data-testid={`compliance-item-${index}`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {item.state}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-sm" data-testid={`state-name-${index}`}>
                    {item.state === 'GA' ? 'Georgia' : 
                     item.state === 'FL' ? 'Florida' : 
                     item.state === 'TX' ? 'Texas' : 
                     item.state === 'AL' ? 'Alabama' : 
                     item.state === 'SC' ? 'South Carolina' : item.state}
                  </div>
                  <div className="text-xs text-gray-500" data-testid={`deadline-info-${index}`}>
                    {item.rule.lienFilingDeadline}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  className={getStatusColor(item.status)}
                  data-testid={`status-badge-${index}`}
                >
                  {getStatusText(item.status, item.daysRemaining)}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 text-sm">
              {urgentCount > 0 && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-red-600 font-medium" data-testid="urgent-count">
                    {urgentCount} Urgent
                  </span>
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-yellow-600 font-medium" data-testid="warning-count">
                    {warningCount} Warning
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            className="w-full bg-primary text-white hover:bg-primary-dark"
            data-testid="button-view-all-states"
          >
            {translate('view_all_states')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
