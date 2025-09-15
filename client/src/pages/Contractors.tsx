import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Search, Settings } from 'lucide-react';

export default function Contractors() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
          Contractor Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your contractor network, qualifications, and assignments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Contractors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-contractors">247</div>
            <p className="text-xs text-gray-500">+12 this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Available Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-available-contractors">89</div>
            <p className="text-xs text-gray-500">Ready for dispatch</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">On Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-assigned-contractors">158</div>
            <p className="text-xs text-gray-500">Across 23 states</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-contractors">34</div>
            <p className="text-xs text-gray-500">Awaiting verification</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <Button data-testid="button-add-contractor">
          <Plus className="w-4 h-4 mr-2" />
          Add Contractor
        </Button>
        <Button variant="outline" data-testid="button-search-contractors">
          <Search className="w-4 h-4 mr-2" />
          Search Contractors
        </Button>
        <Button variant="outline" data-testid="button-contractor-settings">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Contractor Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">Contractor Database</h4>
              <p className="text-sm text-blue-700">Comprehensive contractor profiles with certifications, specialties, and performance history</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900">Skills & Certifications</h4>
              <p className="text-sm text-green-700">Track contractor qualifications, licenses, insurance, and specialty certifications</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900">Performance Tracking</h4>
              <p className="text-sm text-purple-700">Monitor job completion rates, quality scores, and customer satisfaction</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-900">Availability Management</h4>
              <p className="text-sm text-orange-700">Real-time contractor availability and capacity planning</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" data-testid="button-bulk-message">
              Send Bulk Message to Contractors
            </Button>
            <Button variant="outline" className="w-full justify-start" data-testid="button-export-list">
              Export Contractor List
            </Button>
            <Button variant="outline" className="w-full justify-start" data-testid="button-performance-report">
              Generate Performance Report
            </Button>
            <Button variant="outline" className="w-full justify-start" data-testid="button-certification-alerts">
              View Certification Expiry Alerts
            </Button>
            <Button variant="outline" className="w-full justify-start" data-testid="button-payment-processing">
              Process Payments
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}