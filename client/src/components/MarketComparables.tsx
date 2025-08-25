import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Lightbulb, Bot, ChevronRight } from "lucide-react";

export default function MarketComparables() {
  const { translate } = useLanguage();

  return (
    <Card data-testid="card-market-comparables">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900">
            AI {translate('market_comparables')}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-primary" />
            <Badge variant="secondary" className="text-primary bg-primary/10">
              AI Powered
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">Tree Removal Claims</span>
              <Badge className="bg-green-100 text-green-800">
                +15% negotiation success
              </Badge>
            </div>
            <div className="text-sm text-gray-600 mb-3">
              Similar claims in your area averaged 23% higher payouts
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <span className="text-gray-500">Your avg:</span>
                <span className="ml-1 font-medium" data-testid="your-avg-payout">$4,200</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500">Market avg:</span>
                <span className="ml-1 font-medium text-green-600" data-testid="market-avg-payout">$5,160</span>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Lightbulb className="text-white w-4 h-4" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">AI Recommendation</h4>
                <p className="text-sm text-gray-700 mb-3" data-testid="ai-recommendation">
                  State Farm has paid 18% more for similar crane-assisted tree removals in the last 60 days. 
                  Reference claims #SF-2024-1247, #SF-2024-1389.
                </p>
                <Button 
                  className="bg-primary text-white hover:bg-primary-dark"
                  size="sm"
                  data-testid="button-generate-letter"
                >
                  {translate('generate_letter')}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-gray-500" data-testid="comparable-count">
              Based on 1,247 similar claims
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary-dark"
              data-testid="button-view-details"
            >
              {translate('view_details')} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
