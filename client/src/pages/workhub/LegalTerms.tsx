import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Shield, Scale, AlertTriangle, CheckCircle, 
  Volume2, VolumeX, ChevronDown, ChevronUp, Download, Heart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const legalDocuments = {
  termsOfService: {
    title: "Terms of Service",
    version: "1.0",
    effectiveDate: "January 1, 2025",
    summary: "The rules that govern your use of the WorkHub platform",
    clauses: [
      {
        id: "eligibility",
        title: "1. Eligibility & Account Registration",
        content: `By creating an account on WorkHub, you represent that:

• You are at least 18 years of age
• You have the legal authority to enter into this agreement
• For Contractors: You hold all required licenses, permits, and insurance for your trade in your operating jurisdiction
• All information provided during registration is accurate and current
• You will maintain the confidentiality of your account credentials

WorkHub reserves the right to verify contractor credentials and may suspend accounts pending verification.`,
        isCritical: true
      },
      {
        id: "services",
        title: "2. Platform Services",
        content: `WorkHub provides:

• Lead generation and matching services connecting Customers with Contractors
• AI-powered tools including ScopeSnap (photo analysis), PriceWhisperer (estimates), CloseBot (automated communications)
• Payment processing through third-party providers (Stripe)
• Review collection and reputation management tools
• Scheduling and project management features

WorkHub is a marketplace platform. We do not employ Contractors, guarantee work quality, or assume liability for work performed.`,
        isCritical: false
      },
      {
        id: "fees",
        title: "3. Fees & Payment",
        content: `**Subscription Fees:**
• Subscription plans are billed monthly or annually as selected
• Fees are non-refundable except as required by law
• We may modify pricing with 30 days notice

**Transaction Fees:**
• Payment processing: 2.9% + $0.30 per transaction
• Contractor payouts processed within 2-3 business days
• Chargebacks may result in account review

**Free Tier Limitations:**
• 5 leads per month maximum
• Basic feature access only
• Subject to change with notice`,
        isCritical: true
      },
      {
        id: "ai-disclosure",
        title: "4. AI Services Disclosure",
        content: `**CloseBot AI:**
• CloseBot makes automated phone calls on behalf of Contractors
• Calls are clearly identified as automated/AI-assisted when required by law
• Call recordings are stored for quality assurance
• Contractors are responsible for ensuring call content complies with local laws

**PriceWhisperer Estimates:**
• AI-generated estimates are for informational purposes only
• Estimates are based on industry benchmarks and regional data
• Actual prices may vary based on site conditions
• Contractors must provide their own professional estimates for binding quotes

**ScopeSnap Analysis:**
• AI photo analysis is an assistive tool, not a professional inspection
• Results should be verified by qualified professionals
• WorkHub is not liable for missed issues or incorrect assessments`,
        isCritical: true
      },
      {
        id: "liability",
        title: "5. Limitation of Liability",
        content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW:

• WorkHub's total liability shall not exceed the fees paid in the 12 months preceding the claim
• WorkHub is not liable for contractor work quality, timeliness, or conduct
• WorkHub is not liable for customer payment defaults or disputes
• WorkHub is not liable for third-party service interruptions (Stripe, Twilio, etc.)
• WorkHub provides no warranty of fitness for any particular purpose

CONTRACTORS AND CUSTOMERS AGREE TO HOLD WORKHUB HARMLESS FROM CLAIMS ARISING FROM:
• Work performed or not performed
• Property damage or personal injury
• Payment disputes between parties
• Misrepresentations by either party`,
        isCritical: true
      },
      {
        id: "disputes",
        title: "6. Dispute Resolution",
        content: `**Between Users:**
• WorkHub may facilitate but does not arbitrate disputes
• MediaVault photos serve as documentation but not proof
• Users are encouraged to resolve disputes directly

**With WorkHub:**
• Disputes shall be resolved through binding arbitration
• Arbitration conducted under AAA Commercial Rules
• Class action waiver applies
• Small claims court option preserved for qualifying claims

**Governing Law:**
• These terms are governed by the laws of the State of Delaware
• Venue for any legal proceedings: Wilmington, Delaware`,
        isCritical: true
      },
      {
        id: "termination",
        title: "7. Account Termination",
        content: `**By User:**
• Cancel anytime through account settings
• No refunds for partial billing periods
• Data retention per Privacy Policy

**By WorkHub:**
• Immediate termination for Terms violations
• 30-day notice for account closure without cause
• Fraudulent activity may result in immediate ban

**Post-Termination:**
• Outstanding payments remain due
• License to use platform content terminates
• Contractor reviews remain on platform`,
        isCritical: false
      }
    ]
  },
  contractorAgreement: {
    title: "Contractor Agreement",
    version: "1.0",
    effectiveDate: "January 1, 2025",
    summary: "Additional terms for contractors using WorkHub",
    clauses: [
      {
        id: "licensing",
        title: "1. Licensing & Insurance Requirements",
        content: `By registering as a Contractor, you certify:

• You hold all required state and local licenses for your trade
• Your licenses are current and in good standing
• You maintain general liability insurance (minimum $1M per occurrence)
• You maintain workers' compensation insurance where required
• You will promptly update WorkHub if any credentials expire or are revoked

WorkHub may verify credentials through third-party services and suspend accounts for non-compliance.`,
        isCritical: true
      },
      {
        id: "lead-handling",
        title: "2. Lead Handling & Response",
        content: `**Response Requirements:**
• Respond to leads within 4 hours during business hours
• Provide accurate estimates within 48 hours
• Honor quoted prices for the validity period stated

**Prohibited Practices:**
• Soliciting customers off-platform to avoid fees
• Providing intentionally low estimates to win jobs
• Subcontracting without disclosure
• Collecting customer payment directly to circumvent platform

Violations may result in account suspension and forfeiture of pending payouts.`,
        isCritical: true
      },
      {
        id: "quality-standards",
        title: "3. Quality Standards & Conduct",
        content: `Contractors agree to:

• Perform all work in a professional, workmanlike manner
• Comply with all applicable building codes and regulations
• Obtain required permits when necessary
• Arrive on time or communicate delays promptly
• Leave work sites clean and safe
• Address customer concerns within 48 hours

**FairnessScore Impact:**
Your FairnessScore reflects performance across these metrics and affects your visibility in search results.`,
        isCritical: false
      },
      {
        id: "payment-terms",
        title: "4. Payment Terms",
        content: `**Receiving Payment:**
• Customer payments are held in escrow until job completion
• Contractor payout initiated upon customer confirmation
• Standard payout: 2-3 business days via Stripe Connect
• Express payout available for additional fee

**Disputes:**
• Disputed payments are held pending resolution
• WorkHub may require photo documentation (MediaVault)
• Repeated disputes may affect account standing

**Chargebacks:**
• Chargebacks deducted from future payouts
• Excessive chargebacks may result in account review`,
        isCritical: true
      },
      {
        id: "ai-authorization",
        title: "5. AI Services Authorization",
        content: `By enabling CloseBot or other AI services, you authorize WorkHub to:

• Make automated phone calls on your behalf
• Send SMS messages using your business identity
• Use your business name, logo, and information in communications
• Record calls for quality assurance and training
• Generate estimates based on your pricing parameters

**Contractor Responsibilities:**
• Ensure AI communications comply with local regulations
• Maintain accurate business information
• Review and approve script templates
• Monitor AI performance and provide feedback`,
        isCritical: true
      },
      {
        id: "indemnification",
        title: "6. Indemnification",
        content: `Contractor agrees to indemnify, defend, and hold harmless WorkHub from:

• Claims arising from work performed or failure to perform
• Property damage or personal injury claims
• Licensing or insurance lapses
• Misrepresentations to customers
• Violations of applicable laws or regulations
• Intellectual property infringement

This indemnification survives account termination.`,
        isCritical: true
      }
    ]
  },
  privacyPolicy: {
    title: "Privacy Policy",
    version: "1.0",
    effectiveDate: "January 1, 2025",
    summary: "How we collect, use, and protect your information",
    clauses: [
      {
        id: "collection",
        title: "1. Information We Collect",
        content: `**Account Information:**
• Name, email, phone number, address
• Business information (for Contractors)
• Payment information (processed by Stripe)

**Usage Information:**
• Log data, device information, IP address
• Feature usage and interaction patterns
• Communication preferences

**Project Information:**
• Photos, videos, descriptions
• Estimates, invoices, contracts
• Reviews and ratings

**AI Processing:**
• Voice recordings from CloseBot calls
• Photo analysis data from ScopeSnap
• Generated estimates and recommendations`,
        isCritical: false
      },
      {
        id: "use",
        title: "2. How We Use Information",
        content: `We use collected information to:

• Provide and improve platform services
• Match customers with appropriate contractors
• Process payments and manage accounts
• Train and improve AI models
• Send service communications and updates
• Prevent fraud and ensure platform security
• Comply with legal obligations

We do NOT sell your personal information to third parties.`,
        isCritical: false
      },
      {
        id: "sharing",
        title: "3. Information Sharing",
        content: `We may share information with:

**Between Users:**
• Customer information shared with matched Contractors
• Contractor profiles visible to searching Customers
• Reviews publicly displayed on profiles

**Service Providers:**
• Payment processors (Stripe)
• Communication services (Twilio)
• Cloud hosting (AWS, GCP)
• Analytics providers

**Legal Requirements:**
• Court orders or legal process
• Government agency requests
• Fraud prevention`,
        isCritical: true
      },
      {
        id: "rights",
        title: "4. Your Rights",
        content: `You have the right to:

• Access your personal information
• Correct inaccurate information
• Delete your account and associated data
• Export your data in portable format
• Opt out of marketing communications
• Opt out of AI training (may limit features)

**California Residents (CCPA):**
Additional rights under the California Consumer Privacy Act apply.

**To exercise rights:** Contact privacy@workhub.com`,
        isCritical: false
      }
    ]
  }
};

export default function LegalTerms() {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasPlayedWelcome = useRef(false);
  const voiceEnabledRef = useRef(true);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const voiceMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/closebot/chat", {
        message,
        history: [],
        context: { leadName: "contractor", companyName: "your company", trade: "legal_terms" },
        enableVoice: true,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (!voiceEnabledRef.current) return;
      if (data.audioUrl && audioRef.current) {
        setIsPlaying(true);
        audioRef.current.src = data.audioUrl;
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    },
  });

  useEffect(() => {
    if (!hasPlayedWelcome.current) {
      hasPlayedWelcome.current = true;
      voiceMutation.mutate("Give a brief, warm 1-sentence welcome to the Legal Terms page. You're Rachel, walking them through the Terms of Service, Contractor Agreement, and Privacy Policy. Keep it super short and natural.");
    }
  }, []);

  const toggleVoice = () => {
    const newEnabled = !isVoiceEnabled;
    setIsVoiceEnabled(newEnabled);
    voiceEnabledRef.current = newEnabled;
    if (!newEnabled) {
      stopAudio();
    } else {
      voiceMutation.mutate("Say a quick, natural 1-sentence overview of the legal documents — Terms of Service, Contractor Agreement, and Privacy Policy all in one place. Keep it warm and conversational.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <audio ref={audioRef} className="hidden" />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex justify-between items-start mb-8">
          <Link to="/workhub" className="text-blue-300 hover:text-white transition-colors">
            &larr; Back to WorkHub
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVoice}
            className="text-white/70 hover:text-white"
            data-testid="button-toggle-voice"
          >
            {isPlaying ? <Volume2 className="w-5 h-5 animate-pulse" /> : isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>

        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-500/20 text-blue-200 border-blue-400/30">
            <Shield className="w-4 h-4 mr-1" />
            Legal Center
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Terms & Legal Documents
          </h1>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto">
            Transparent policies that protect contractors and customers
          </p>
        </div>

        <Tabs defaultValue="terms" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20 w-full justify-start">
            <TabsTrigger value="terms" className="data-[state=active]:bg-blue-500">
              <FileText className="w-4 h-4 mr-2" />
              Terms of Service
            </TabsTrigger>
            <TabsTrigger value="contractor" className="data-[state=active]:bg-blue-500">
              <Scale className="w-4 h-4 mr-2" />
              Contractor Agreement
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-blue-500">
              <Shield className="w-4 h-4 mr-2" />
              Privacy Policy
            </TabsTrigger>
          </TabsList>

          {Object.entries(legalDocuments).map(([key, doc]) => (
            <TabsContent key={key} value={key === 'termsOfService' ? 'terms' : key === 'contractorAgreement' ? 'contractor' : 'privacy'}>
              <Card className="bg-white/5 border-white/10 mb-6">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl text-white">{doc.title}</CardTitle>
                      <CardDescription className="text-blue-200 mt-2">
                        {doc.summary}
                      </CardDescription>
                      <div className="flex gap-4 mt-3 text-sm text-blue-300/70">
                        <span>Version: {doc.version}</span>
                        <span>Effective: {doc.effectiveDate}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-blue-400/30 text-blue-200">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              <Accordion type="single" collapsible className="space-y-3">
                {doc.clauses.map((clause) => (
                  <AccordionItem 
                    key={clause.id} 
                    value={clause.id}
                    className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
                  >
                    <AccordionTrigger className="px-6 py-4 hover:bg-white/5">
                      <div className="flex items-center gap-3">
                        {clause.isCritical && (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        )}
                        <span className="text-white text-left">{clause.title}</span>
                        {clause.isCritical && (
                          <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/30 text-xs">
                            Critical
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <div className="prose prose-invert prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-blue-100/90 text-sm leading-relaxed">
                          {clause.content}
                        </pre>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-12 bg-amber-500/10 border border-amber-400/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Important Notice</h3>
              <p className="text-amber-200/80 text-sm">
                These documents constitute a legally binding agreement. By using WorkHub, you acknowledge 
                that you have read, understood, and agree to be bound by these terms. If you do not agree, 
                please do not use our services. We recommend consulting with a legal professional if you 
                have questions about your rights and obligations.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-blue-300/60 text-sm">
          <p>Questions about our legal terms?</p>
          <p>Contact: <a href="mailto:legal@workhub.com" className="text-blue-300 hover:underline">legal@workhub.com</a></p>
        </div>
      </div>
    </div>
  );
}