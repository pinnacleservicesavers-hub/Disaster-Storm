import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Search, Settings, DollarSign } from 'lucide-react';
import { XactimateComparables } from '@/components/XactimateComparables';

export default function Claims() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
          Claims Management
        </h1>
        <p className="text-gray-600 mt-2">
          Process insurance claims, track settlements, and manage documentation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Open Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-open-claims">1,247</div>
            <p className="text-xs text-gray-500">+87 this week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-claims">312</div>
            <p className="text-xs text-gray-500">Awaiting adjuster</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Approved Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-approved-claims">935</div>
            <p className="text-xs text-gray-500">Ready for work</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-claims-value">$12.4M</div>
            <p className="text-xs text-gray-500">This quarter</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <Button data-testid="button-new-claim">
          <Plus className="w-4 h-4 mr-2" />
          New Claim
        </Button>
        <Button variant="outline" data-testid="button-search-claims">
          <Search className="w-4 h-4 mr-2" />
          Search Claims
        </Button>
        <Button variant="outline" data-testid="button-claims-settings">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Claims Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">Automated Intake</h4>
              <p className="text-sm text-blue-700">AI-powered claim processing from photos, reports, and customer submissions</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900">Insurance Integration</h4>
              <p className="text-sm text-green-700">Direct API connections with major insurance carriers for seamless processing</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900">Document Management</h4>
              <p className="text-sm text-purple-700">Secure cloud storage for photos, estimates, contracts, and completion certificates</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-900">Settlement Tracking</h4>
              <p className="text-sm text-orange-700">Monitor payment status, supplement negotiations, and final settlements</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Pending Settlements</span>
              <span className="text-lg font-bold" data-testid="text-pending-settlements">$8.2M</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Supplements Requested</span>
              <span className="text-lg font-bold" data-testid="text-supplements">$1.8M</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Average Claim Value</span>
              <span className="text-lg font-bold" data-testid="text-avg-claim">$9,950</span>
            </div>
            <Button className="w-full mt-4" data-testid="button-financial-report">
              Generate Financial Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Xactimate Comparables Section */}
      <div className="mt-8">
        <XactimateComparables />
      </div>
    </div>
  );
}