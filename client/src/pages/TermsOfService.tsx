import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle, Scale, UserX, Calendar } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <FileText className="w-16 h-16 mx-auto mb-4 text-blue-400" />
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-slate-400">Please read these terms carefully before using our services</p>
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
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                By accessing or using Strategic Services Savers ("the Platform"), including our websites, 
                mobile applications, and AI assistant Rachel, you agree to be bound by these Terms of Service.
              </p>
              <p>
                If you do not agree to these terms, please do not use our services.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">2. Description of Services</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>Strategic Services Savers provides:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Contractor-customer matching services</li>
                <li>Storm damage assessment and claims guidance</li>
                <li>AI-powered assistance via Rachel</li>
                <li>Weather monitoring and alerts</li>
                <li>Lead generation and management tools</li>
                <li>Payment processing services</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-amber-900/30 border-amber-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-300">
                <AlertTriangle className="w-5 h-5" />
                3. No Guarantee of Results
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p className="font-semibold text-amber-200">
                IMPORTANT: We do not guarantee any specific outcomes or results.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Weather predictions and storm forecasts are probabilistic and may not be accurate</li>
                <li>Revenue estimates and job projections are estimates only, not guarantees</li>
                <li>Insurance claim outcomes depend on many factors outside our control</li>
                <li>Contractor availability and quality may vary</li>
                <li>AI-generated analysis and recommendations are for informational purposes only</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">4. User Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>You are responsible for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Providing accurate and truthful information</li>
                <li>Verifying critical information (evacuation orders, emergency alerts) through official sources</li>
                <li>Making your own business and financial decisions</li>
                <li>Consulting licensed professionals (attorneys, public adjusters) for legal advice</li>
                <li>Maintaining the security of your account credentials</li>
                <li>Complying with all applicable laws and regulations</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Scale className="w-5 h-5 text-blue-400" />
                5. Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, STRATEGIC SERVICES SAVERS SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, revenue, data, or business opportunities</li>
                <li>Damages arising from reliance on weather predictions or storm forecasts</li>
                <li>Decisions made based on AI recommendations from Rachel</li>
                <li>Actions or inactions of contractors connected through our platform</li>
                <li>Insurance claim denials or reduced settlements</li>
              </ul>
              <p className="mt-4 text-sm">
                Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">6. Dispute Resolution</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                Any disputes arising from these Terms or use of our services shall be resolved through:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li><strong>Informal Resolution:</strong> Contact us first at strategicservicesavers@gmail.com</li>
                <li><strong>Mediation:</strong> If informal resolution fails, parties agree to mediation</li>
                <li><strong>Arbitration:</strong> Binding arbitration under the rules of the American Arbitration Association</li>
              </ol>
              <p className="mt-4 text-sm text-slate-400">
                You agree to waive any right to a jury trial or to participate in a class action lawsuit.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">7. Acceptable Use Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use the platform for any illegal purpose</li>
                <li>Impersonate others or provide false information</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the platform's operation or other users' access</li>
                <li>Scrape, harvest, or collect data without authorization</li>
                <li>Use automated bots or scripts without permission</li>
                <li>Violate any intellectual property rights</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <UserX className="w-5 h-5 text-red-400" />
                8. Termination
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>
                We reserve the right to suspend or terminate your account at any time, with or without cause, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violation of these Terms of Service</li>
                <li>Fraudulent or illegal activity</li>
                <li>Non-payment of subscription fees</li>
                <li>Abusive behavior toward staff or other users</li>
              </ul>
              <p className="mt-4">
                You may terminate your account at any time by contacting support.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">9. Modifications to Terms</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <p>
                We may update these Terms of Service from time to time. We will notify you of material changes 
                via email or through the platform. Continued use after changes constitutes acceptance of the new terms.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">10. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <p>For questions about these Terms:</p>
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
