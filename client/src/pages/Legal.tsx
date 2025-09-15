import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scale, Plus, Search, Settings, AlertTriangle } from 'lucide-react';

export default function Legal() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
          Legal Compliance
        </h1>
        <p className="text-gray-600 mt-2">
          Manage legal compliance, contracts, liens, and regulatory requirements
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-contracts">1,847</div>
            <p className="text-xs text-gray-500">Currently binding</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Liens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-liens">124</div>
            <p className="text-xs text-gray-500">Requiring action</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Compliance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-compliance-rate">98.7%</div>
            <p className="text-xs text-gray-500">All jurisdictions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Legal Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-legal-alerts">7</div>
            <p className="text-xs text-gray-500">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <Button data-testid="button-new-contract">
          <Plus className="w-4 h-4 mr-2" />
          New Contract
        </Button>
        <Button variant="outline" data-testid="button-search-legal">
          <Search className="w-4 h-4 mr-2" />
          Search Documents
        </Button>
        <Button variant="outline" data-testid="button-legal-settings">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scale className="w-5 h-5 mr-2" />
              Legal Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">Contract Management</h4>
              <p className="text-sm text-blue-700">Automated contract generation, e-signature workflows, and renewal tracking</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900">Lien Processing</h4>
              <p className="text-sm text-green-700">State-specific lien filing, deadline tracking, and automated notifications</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900">Compliance Monitoring</h4>
              <p className="text-sm text-purple-700">Multi-state regulatory compliance tracking and documentation</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-900">Document Vault</h4>
              <p className="text-sm text-orange-700">Secure legal document storage with version control and audit trails</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Urgent Legal Matters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm text-red-900">Florida Lien Deadline</h4>
                <span className="text-xs text-red-600">3 days</span>
              </div>
              <p className="text-sm text-red-700">Johnson Project - $45,000 lien filing due</p>
            </div>
            <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm text-yellow-900">Contract Renewal</h4>
                <span className="text-xs text-yellow-600">7 days</span>
              </div>
              <p className="text-sm text-yellow-700">ABC Insurance - Master service agreement</p>
            </div>
            <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm text-orange-900">License Renewal</h4>
                <span className="text-xs text-orange-600">14 days</span>
              </div>
              <p className="text-sm text-orange-700">Texas Contractor License #TX123456</p>
            </div>
            <Button variant="outline" className="w-full" data-testid="button-view-all-alerts">
              View All Legal Alerts
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}