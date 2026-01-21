import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, Mail, Calendar } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 mx-auto mb-4 text-blue-400" />
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-slate-400">Your privacy matters to us</p>
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
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="w-5 h-5 text-blue-400" />
                What Data We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>We collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Account Information:</strong> Name, email address, phone number, business name</li>
                <li><strong>Location Data:</strong> Address, ZIP code, and geographic coordinates for service matching</li>
                <li><strong>Property Information:</strong> Property details, photos, and damage documentation</li>
                <li><strong>Communication Records:</strong> Call logs, text messages, and email correspondence</li>
                <li><strong>Payment Information:</strong> Billing details processed securely through Stripe</li>
                <li><strong>Usage Data:</strong> How you interact with our platform and services</li>
                <li><strong>Device Information:</strong> IP address, browser type, and device identifiers</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Eye className="w-5 h-5 text-green-400" />
                Why We Collect It
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>To provide and improve our contractor matching and storm response services</li>
                <li>To process claims and connect you with qualified contractors</li>
                <li>To send important service notifications and updates</li>
                <li>To communicate via our AI assistant, Rachel</li>
                <li>To process payments and manage subscriptions</li>
                <li>To comply with legal obligations</li>
                <li>To analyze and improve our platform's performance</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Lock className="w-5 h-5 text-yellow-400" />
                How We Store & Protect Your Data
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                <li><strong>Secure Infrastructure:</strong> Hosted on enterprise-grade cloud infrastructure</li>
                <li><strong>Access Controls:</strong> Role-based access with multi-factor authentication</li>
                <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
                <li><strong>Data Minimization:</strong> We only collect what's necessary for our services</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>We may share data with the following trusted partners to provide our services:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Stripe:</strong> Payment processing</li>
                <li><strong>Twilio:</strong> SMS and voice communications</li>
                <li><strong>ElevenLabs:</strong> AI voice synthesis for Rachel</li>
                <li><strong>SendGrid:</strong> Email delivery</li>
                <li><strong>Google Maps:</strong> Location and mapping services</li>
                <li><strong>NOAA/NWS:</strong> Weather data (public data, no personal info shared)</li>
              </ul>
              <p className="mt-4 text-sm text-slate-400">
                Each third-party service has their own privacy policy. We encourage you to review them.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Cookies & Tracking</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Keep you logged in securely</li>
                <li>Remember your preferences</li>
                <li>Analyze platform usage and improve performance</li>
                <li>Provide personalized experiences</li>
              </ul>
              <p className="mt-4">You can manage cookie preferences in your browser settings.</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-4">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</li>
                <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Mail className="w-5 h-5 text-purple-400" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              <p>For privacy-related questions or to exercise your rights:</p>
              <p className="mt-2">
                <strong>Email:</strong> strategicservicesavers@gmail.com<br />
                <strong>Phone:</strong> +1 (877) 378-5143
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
