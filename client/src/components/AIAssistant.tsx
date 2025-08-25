import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Bot, FileText, BarChart3, Scale, Globe } from "lucide-react";

export default function AIAssistant() {
  const { translate, currentLanguage, setLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateLetter = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleGetGuidance = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="mt-8 bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg text-white" data-testid="card-ai-assistant">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{translate('ai_assistant_title')}</h2>
              <p className="text-blue-100">{translate('ai_subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(currentLanguage === 'en' ? 'es' : 'en')}
              className="bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 text-white hover:bg-opacity-20"
              data-testid="button-toggle-language"
            >
              <Globe className="w-4 h-4 mr-2" />
              {currentLanguage === 'en' ? 'Español' : 'English'}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20">
            <CardContent className="p-4">
              <div className="flex items-center mb-3">
                <FileText className="w-5 h-5 mr-3" />
                <h3 className="font-semibold text-white">{translate('claim_letters')}</h3>
              </div>
              <p className="text-sm text-blue-100 mb-4">
                Generate professional dispute letters with market data
              </p>
              <Button
                onClick={handleGenerateLetter}
                disabled={isLoading}
                className="bg-white text-primary hover:bg-gray-100 font-medium w-full"
                data-testid="button-generate-claim-letter"
              >
                {isLoading ? 'Generating...' : translate('generate_letter')}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20">
            <CardContent className="p-4">
              <div className="flex items-center mb-3">
                <BarChart3 className="w-5 h-5 mr-3" />
                <h3 className="font-semibold text-white">{translate('market_analysis')}</h3>
              </div>
              <p className="text-sm text-blue-100 mb-4">
                Compare rates across carriers and regions
              </p>
              <Button
                onClick={handleRunAnalysis}
                disabled={isLoading}
                className="bg-white text-primary hover:bg-gray-100 font-medium w-full"
                data-testid="button-run-market-analysis"
              >
                {isLoading ? 'Analyzing...' : translate('run_analysis')}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20">
            <CardContent className="p-4">
              <div className="flex items-center mb-3">
                <Scale className="w-5 h-5 mr-3" />
                <h3 className="font-semibold text-white">{translate('legal_guidance')}</h3>
              </div>
              <p className="text-sm text-blue-100 mb-4">
                State-specific lien and compliance assistance
              </p>
              <Button
                onClick={handleGetGuidance}
                disabled={isLoading}
                className="bg-white text-primary hover:bg-gray-100 font-medium w-full"
                data-testid="button-get-legal-guidance"
              >
                {isLoading ? 'Analyzing...' : translate('get_guidance')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* AI Status Indicator */}
        <div className="mt-6 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-sm text-blue-100">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>AI Assistant Ready • OpenAI GPT-4o Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
