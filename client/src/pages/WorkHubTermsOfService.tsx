import { Link } from 'react-router-dom';
import { ChevronRight, Shield, FileText, Scale, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function WorkHubTermsOfService() {
  const lastUpdated = "December 18, 2024";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <Link to="/workhub" className="hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <span>Terms of Service</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-10 h-10 text-purple-400" />
            <div>
              <h1 className="text-3xl font-bold">Terms of Service</h1>
              <p className="text-slate-400">Strategic Service Savers & SmartBid™</p>
            </div>
          </div>
          <p className="mt-4 text-slate-300">Last Updated: {lastUpdated}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              1. Platform Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p><strong>Strategic Service Savers</strong> is a marketplace and scheduling platform that connects homeowners with independent contractors. Our proprietary <strong>SmartBid™</strong> AI technology qualifies service requests, schedules estimates, and facilitates communication between parties.</p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300 m-0">
                <strong>Important:</strong> Strategic Service Savers is NOT a contractor, does NOT perform any services, and does NOT guarantee any work performed by contractors on this platform.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              2. User Types & Responsibilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Homeowners / Service Requesters</h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                <li>May use the platform FREE of charge to request service estimates</li>
                <li>Agree to provide accurate information about their service needs</li>
                <li>Understand that all pricing and work quality are solely determined by independent contractors</li>
                <li>Are responsible for verifying contractor credentials before hiring</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold mb-2">Contractors / Service Providers</h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                <li>Must maintain valid licenses, insurance, and certifications as required by law</li>
                <li>Are independent businesses, NOT employees of Strategic Service Savers</li>
                <li>Must subscribe to SmartBid™ to receive qualified estimate requests</li>
                <li>Are solely responsible for the quality, pricing, and completion of all work</li>
                <li>Agree to honest, transparent pricing and professional conduct</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-600" />
              3. SmartBid™ AI System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              SmartBid™ is our AI-powered qualification and scheduling engine. By using SmartBid™, you acknowledge:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400">
              <li><strong>AI Estimates Are Informational Only:</strong> Price ranges shown by SmartBid™ are based on market data and are NOT quotes. Actual pricing is determined solely by contractors.</li>
              <li><strong>Matching is Data-Driven:</strong> Contractor matching is based on objective criteria including service area, availability, license status, and subscription tier.</li>
              <li><strong>Scheduling is Controlled:</strong> SmartBid™ coordinates appointment times to prevent overlap. Contractors and homeowners must honor scheduled times.</li>
              <li><strong>Neutrality:</strong> We do not favor specific contractors. Paid subscription grants access to the platform—not preferential treatment in matching.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              4. Disclaimers & Limitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">No Warranty</h4>
              <p className="text-sm text-red-700 dark:text-red-400">
                Strategic Service Savers provides this platform "AS IS" without warranties of any kind. We do NOT guarantee contractor availability, work quality, pricing accuracy, or project outcomes.
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">Limitation of Liability</h4>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Strategic Service Savers is not liable for any damages, losses, or disputes arising from services provided by contractors. All disputes should be resolved directly between homeowners and contractors.
              </p>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Independent Contractor Relationship</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                All contractors on this platform are independent businesses. They are NOT employees, agents, or representatives of Strategic Service Savers. We do not control their pricing, methods, schedules, or work quality.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              5. Subscription & Payment Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Contractor access to SmartBid™ requires an active subscription:
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-center">
                <h4 className="font-bold text-lg">Starter</h4>
                <p className="text-2xl font-bold text-purple-600">$79<span className="text-sm font-normal">/mo</span></p>
                <p className="text-sm text-slate-500">Limited SmartBid™ estimates</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg text-center border-2 border-purple-500">
                <h4 className="font-bold text-lg">Pro</h4>
                <p className="text-2xl font-bold text-purple-600">$129<span className="text-sm font-normal">/mo</span></p>
                <p className="text-sm text-slate-500">Unlimited SmartBid™ estimates</p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-center">
                <h4 className="font-bold text-lg">Elite</h4>
                <p className="text-2xl font-bold text-purple-600">$199<span className="text-sm font-normal">/mo</span></p>
                <p className="text-sm text-slate-500">Priority placement + scheduling</p>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Non-Profit Exception</h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Verified 501(c)(3) non-profit organizations receive FREE access to all SmartBid™ features. Verification requires valid tax-exempt documentation.
              </p>
            </div>

            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400 text-sm">
              <li>Subscriptions are billed monthly and auto-renew unless cancelled</li>
              <li>No refunds for partial months</li>
              <li>Prices subject to change with 30-day notice</li>
              <li>Subscription grants platform access only—not guaranteed leads or revenue</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <p className="text-center text-slate-500 dark:text-slate-400">
              By using Strategic Service Savers and SmartBid™, you agree to these Terms of Service.
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <Link to="/workhub/privacy">
                <Button variant="outline" data-testid="link-privacy">Privacy Policy</Button>
              </Link>
              <Link to="/workhub">
                <Button className="bg-purple-600 hover:bg-purple-700" data-testid="button-back-workhub">
                  Back to WorkHub
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
