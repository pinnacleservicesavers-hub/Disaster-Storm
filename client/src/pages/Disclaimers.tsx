import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Cloud, DollarSign, Scale, Shield, Bot, Calendar } from "lucide-react";

export default function Disclaimers() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-amber-400" />
          <h1 className="text-4xl font-bold mb-4">Important Disclaimers</h1>
          <p className="text-slate-400">Please read these disclaimers carefully</p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Effective Date: January 7, 2026
            </span>
            <span>|</span>
            <span>Last Updated: January 7, 2026</span>
            <span>|</span>
            <span>Version: v1.0</span>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="bg-red-900/30 border-red-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-300">
                <Cloud className="w-6 h-6" />
                Weather & Disaster Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <div className="bg-red-950/50 p-4 rounded-lg border border-red-800">
                <p className="font-bold text-red-200 mb-2">⚠️ CRITICAL SAFETY NOTICE</p>
                <p>
                  Weather predictions and storm forecasts provided by this platform are <strong>probabilistic estimates</strong>, 
                  not certainties. Actual weather conditions may differ significantly from predictions.
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Always use <strong>official emergency alerts</strong> from NOAA, NWS, and local authorities for evacuation decisions</li>
                <li>Storm paths, intensity, and timing can change rapidly without warning</li>
                <li>We are not responsible for injury, loss of life, or property damage resulting from reliance on our weather data</li>
                <li>Data sources (NOAA, NWS, FEMA) may experience delays or inaccuracies</li>
                <li>When in doubt, <strong>evacuate early</strong> and follow official guidance</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-amber-900/30 border-amber-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-300">
                <DollarSign className="w-6 h-6" />
                Financial & Revenue Estimate Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <div className="bg-amber-950/50 p-4 rounded-lg border border-amber-800">
                <p className="font-bold text-amber-200 mb-2">💰 FINANCIAL PROJECTIONS ARE ESTIMATES ONLY</p>
                <p>
                  All revenue estimates, job projections, and financial forecasts are for <strong>informational purposes only</strong> 
                  and do not constitute guarantees of earnings.
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Estimates are based on historical data, market averages, and AI analysis</li>
                <li>Actual earnings depend on many factors: labor costs, material prices, insurance approvals, market conditions, competition</li>
                <li>We make no promises or guarantees about contractor revenue or job profitability</li>
                <li>Past performance does not guarantee future results</li>
                <li>Consult a financial advisor for business decisions</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-purple-900/30 border-purple-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-300">
                <Scale className="w-6 h-6" />
                Legal Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <div className="bg-purple-950/50 p-4 rounded-lg border border-purple-800">
                <p className="font-bold text-purple-200 mb-2">⚖️ THIS IS NOT LEGAL ADVICE</p>
                <p>
                  Information provided by this platform, including our AI assistant Rachel, 
                  is for <strong>educational purposes only</strong> and does not constitute legal advice.
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Rachel provides general information, not legal counsel</li>
                <li>Laws vary significantly by state, county, and municipality</li>
                <li>Regulations change over time; information may become outdated</li>
                <li>Always consult a licensed attorney for legal matters</li>
                <li>Lien deadlines, permit requirements, and contractor licensing rules vary by jurisdiction</li>
                <li>We are not responsible for legal consequences of actions taken based on our information</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-blue-900/30 border-blue-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-300">
                <Shield className="w-6 h-6" />
                Claims & Insurance Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <div className="bg-blue-950/50 p-4 rounded-lg border border-blue-800">
                <p className="font-bold text-blue-200 mb-2">📋 EDUCATIONAL GUIDANCE, NOT REPRESENTATION</p>
                <p>
                  This platform provides educational guidance about insurance claims. 
                  We do not represent you in claim negotiations or act as a public adjuster (unless separately licensed).
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>We are <strong>not</strong> a licensed public adjuster (unless explicitly stated otherwise)</li>
                <li>Claim estimates are for reference only; actual settlements determined by your insurer</li>
                <li>Always verify claim requirements directly with your insurance company</li>
                <li>We cannot guarantee claim approval or settlement amounts</li>
                <li>Document all damage thoroughly with photos, videos, and written descriptions</li>
                <li>Consider hiring a licensed public adjuster for complex claims</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-cyan-900/30 border-cyan-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-300">
                <Bot className="w-6 h-6" />
                AI Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <div className="bg-cyan-950/50 p-4 rounded-lg border border-cyan-800">
                <p className="font-bold text-cyan-200 mb-2">🤖 AI-POWERED ASSISTANCE</p>
                <p>
                  You are interacting with <strong>Rachel</strong>, an AI assistant. 
                  Rachel uses artificial intelligence to analyze data and provide recommendations.
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Rachel is an AI, not a human representative</li>
                <li>AI responses are generated based on training data and may contain errors</li>
                <li>AI cannot replace professional judgment (legal, medical, financial)</li>
                <li>Calls may be recorded for quality assurance and training</li>
                <li>AI capabilities and accuracy improve over time but are not perfect</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Consent to Communications</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p className="font-semibold">TCPA Consent Notice</p>
              <p>
                By providing your phone number and using our services, you consent to receive:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Automated calls and text messages from Rachel (AI assistant)</li>
                <li>Service notifications and updates</li>
                <li>Storm alerts and contractor communications</li>
              </ul>
              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm">
                  <strong>Opt-Out:</strong> Reply STOP to any text message or say "opt out" during any call. 
                  You may also email strategicservicesavers@gmail.com to be removed from communications.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <p>Questions about these disclaimers?</p>
              <p className="mt-2">
                <strong>Email:</strong> strategicservicesavers@gmail.com<br />
                <strong>Phone:</strong> +1 (877) 378-5143<br />
                <strong>Website:</strong> strategicservicesavers.org
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>Strategic Services Savers | strategicservicesavers.org</p>
        </div>
      </div>
    </div>
  );
}
