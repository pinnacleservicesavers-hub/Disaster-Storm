import { AlertTriangle, Info, Scale, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

interface LegalDisclaimerProps {
  type?: 'attorney' | 'insurance' | 'liability' | 'general' | 'ai' | 'lien';
  compact?: boolean;
  className?: string;
}

export function LegalDisclaimer({ type = 'general', compact = false, className = '' }: LegalDisclaimerProps) {
  const disclaimers = {
    attorney: {
      icon: Scale,
      title: 'Not Legal Advice',
      content: compact 
        ? 'This AI assistant is not an attorney and does not provide legal advice. For legal matters, please consult a licensed attorney in your jurisdiction.'
        : 'The information and guidance provided by this AI assistant is for informational purposes only and does not constitute legal advice. Disaster Direct and its AI systems are not law firms and do not provide legal representation. The AI assistant cannot replace the advice of a qualified, licensed attorney. If you need legal advice or representation, please consult with an attorney licensed to practice in your jurisdiction. Use of this system does not create an attorney-client relationship.',
      color: 'text-amber-600 dark:text-amber-500'
    },
    insurance: {
      icon: Shield,
      title: 'Insurance Claim Disclaimer',
      content: compact
        ? 'This system provides general insurance claim guidance. Disaster Direct makes no guarantees about claim outcomes or insurance company decisions.'
        : 'The insurance claim guidance provided by this system is based on general industry knowledge and does not guarantee specific outcomes. Insurance claim decisions are made solely by insurance companies and their adjusters. Disaster Direct, its contractors, and AI systems do not guarantee claim approvals, payment amounts, or processing timelines. Each insurance policy and claim is unique. Contractors are responsible for their own business decisions and compliance with applicable laws and regulations.',
      color: 'text-blue-600 dark:text-blue-500'
    },
    liability: {
      icon: AlertTriangle,
      title: 'Limitation of Liability',
      content: compact
        ? 'Use this platform at your own risk. Disaster Direct is not liable for damages, losses, or claim outcomes.'
        : 'Disaster Direct provides this platform and its services "AS IS" without warranties of any kind. By using this platform, you agree that Disaster Direct, its affiliates, contractors, and AI systems are not liable for any damages, losses, claims, or disputes arising from: (1) use or inability to use the platform; (2) insurance claim outcomes or denials; (3) contractor-client relationships; (4) business decisions made based on platform recommendations; (5) accuracy or reliability of AI-generated content; or (6) third-party actions including insurance companies. Users assume full responsibility for their business operations and legal compliance.',
      color: 'text-red-600 dark:text-red-500'
    },
    ai: {
      icon: Info,
      title: 'AI Assistant Disclaimer',
      content: compact
        ? 'AI-generated content may contain errors. Always verify important information and consult professionals for critical decisions.'
        : 'This system uses artificial intelligence to generate recommendations, correspondence, and analysis. While designed to be helpful, AI systems can make errors, misinterpret information, or provide incomplete guidance. All AI-generated content should be reviewed by qualified professionals before use in official communications, legal matters, or business decisions. The AI assistant provides suggestions based on patterns and data but cannot replace human judgment, professional expertise, or legal counsel. Disaster Direct is not responsible for consequences resulting from reliance on AI-generated content.',
      color: 'text-purple-600 dark:text-purple-500'
    },
    lien: {
      icon: Scale,
      title: 'Lien Filing Disclaimer',
      content: compact
        ? 'Lien filing is a legal process. This system provides guidance only. Consult an attorney to ensure compliance with state-specific lien laws.'
        : 'The lien filing assistance provided by this system is for informational purposes only and does not constitute legal advice. Lien laws vary significantly by state and jurisdiction, with specific requirements for timing, documentation, notices, and procedures. Improper lien filing can result in the loss of payment rights or legal liability. This AI assistant cannot guarantee that generated lien documents comply with all applicable laws in your jurisdiction. Disaster Direct strongly recommends consulting with a licensed attorney who specializes in construction law and mechanic\'s liens before filing any lien. Disaster Direct is not responsible for invalid liens, missed deadlines, or legal consequences from lien filings.',
      color: 'text-orange-600 dark:text-orange-500'
    },
    general: {
      icon: Info,
      title: 'General Disclaimer',
      content: compact
        ? 'This platform provides tools and information for disaster recovery professionals. Use responsibly and consult professionals for critical decisions.'
        : 'Disaster Direct provides technology tools to assist disaster recovery professionals. This platform does not provide professional services, legal advice, insurance advice, or financial advice. Users are solely responsible for their business operations, compliance with laws and regulations, quality of work, and client relationships. All information is provided for general guidance only and may not be applicable to your specific situation. Professional consultation is recommended for important business, legal, financial, or insurance matters.',
      color: 'text-gray-600 dark:text-gray-400'
    }
  };

  const disclaimer = disclaimers[type];
  const Icon = disclaimer.icon;

  if (compact) {
    return (
      <Alert className={`border-l-4 ${className}`} data-testid={`disclaimer-${type}-compact`}>
        <Icon className={`h-4 w-4 ${disclaimer.color}`} />
        <AlertDescription className="text-xs">
          <span className="font-semibold">{disclaimer.title}:</span> {disclaimer.content}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={`border-l-4 bg-muted/50 ${className}`} data-testid={`disclaimer-${type}-full`}>
      <CardContent className="pt-4">
        <div className="flex items-start space-x-3">
          <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${disclaimer.color}`} />
          <div className="flex-1 space-y-1">
            <h4 className={`text-sm font-semibold ${disclaimer.color}`}>
              {disclaimer.title}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {disclaimer.content}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AIDisclaimerBanner({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-purple-50 dark:bg-purple-950/20 border-l-4 border-purple-500 p-3 ${className}`} data-testid="ai-disclaimer-banner">
      <div className="flex items-start space-x-2">
        <Info className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-purple-900 dark:text-purple-100">
            <span className="font-semibold">AI-Generated Content:</span> This message was created by artificial intelligence. 
            Please verify important details with qualified professionals before taking action.
          </p>
        </div>
      </div>
    </div>
  );
}

export function AttorneyDisclaimerBanner({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-3 ${className}`} data-testid="attorney-disclaimer-banner">
      <div className="flex items-start space-x-2">
        <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-amber-900 dark:text-amber-100">
            <span className="font-semibold">Not Legal Advice:</span> This AI assistant is not an attorney. 
            For legal matters, consult a licensed attorney in your jurisdiction.
          </p>
        </div>
      </div>
    </div>
  );
}
