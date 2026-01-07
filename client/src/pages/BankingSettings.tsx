import { BankingSettings as BankingSettingsComponent } from '@/components/BankingSettings';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

export default function BankingSettingsPage() {
  const userId = localStorage.getItem('userId') || 'demo-user';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/contractors">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" data-testid="link-back-contractors">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Portal
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Banking Settings</h1>
                  <p className="text-blue-100 mt-1">Manage your payment information securely</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BankingSettingsComponent userId={userId} />
      </div>

      {/* Footer Help Text */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-3">Why We Need Your Banking Information</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Direct Deposits:</strong> Receive payments directly to your bank account when jobs are marked as paid.
            </p>
            <p>
              <strong>Faster Payments:</strong> No waiting for checks in the mail - funds are transferred electronically.
            </p>
            <p>
              <strong>Secure Processing:</strong> All banking information is encrypted and complies with PCI security standards.
            </p>
            <p>
              <strong>Verification:</strong> Your routing and account numbers are validated to prevent payment errors.
            </p>
          </div>
        </div>
      </div>
      <ModuleAIAssistant 
        moduleName="Banking Settings"
        moduleContext="Secure bank account configuration for direct deposit payments. Evelyn can help you set up routing and account numbers, explain payment verification, and ensure secure transactions for contractor payments."
      />
    </div>
  );
}
