import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Search, Settings, Shield, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export default function ContractorManagement() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
          Contractor Management
        </h1>
        <p className="text-gray-600 mt-2">
          Administrative oversight and management of your contractor network, qualifications, and assignments
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
            <div className="text-2xl font-bold text-green-600" data-testid="text-available-contractors">89</div>
            <p className="text-xs text-gray-500">Ready for dispatch</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">On Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-assigned-contractors">158</div>
            <p className="text-xs text-gray-500">Across 23 states</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="text-pending-contractors">34</div>
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
        <Button variant="outline" data-testid="button-export-report">
          <TrendingUp className="w-4 h-4 mr-2" />
          Performance Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-600" />
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Insurance Up-to-Date</span>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">98%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">License Renewals</span>
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-amber-600 mr-1" />
                <span className="text-sm text-amber-600">3 Expiring</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Background Checks</span>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Avg. Completion Time</span>
              <span className="text-sm font-semibold">4.2 days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Customer Satisfaction</span>
              <span className="text-sm font-semibold">4.7/5.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">On-time Completion</span>
              <span className="text-sm font-semibold">94%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
              Alerts & Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-2 bg-amber-50 rounded border-l-4 border-amber-400">
              <p className="text-sm text-amber-800">3 licenses expire in 30 days</p>
            </div>
            <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
              <p className="text-sm text-blue-800">5 new contractor applications</p>
            </div>
            <div className="p-2 bg-green-50 rounded border-l-4 border-green-400">
              <p className="text-sm text-green-800">12 projects completed this week</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Administrative Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">Contractor Oversight</h4>
              <p className="text-sm text-blue-700">Monitor contractor activity, assignments, and performance across all regions</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900">Compliance Management</h4>
              <p className="text-sm text-green-700">Track certifications, insurance, licenses, and regulatory compliance requirements</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900">Assignment Control</h4>
              <p className="text-sm text-purple-700">Assign contractors to projects, manage capacity, and optimize resource allocation</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-900">Network Analytics</h4>
              <p className="text-sm text-orange-700">Analyze contractor network performance, identify top performers, and track trends</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Administrative Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" data-testid="button-approve-contractors">
              <CheckCircle className="w-4 h-4 mr-2" />
              Review & Approve New Contractors
            </Button>
            <Button variant="outline" className="w-full justify-start" data-testid="button-bulk-message">
              <Users className="w-4 h-4 mr-2" />
              Send Bulk Communications
            </Button>
            <Button variant="outline" className="w-full justify-start" data-testid="button-compliance-report">
              <Shield className="w-4 h-4 mr-2" />
              Generate Compliance Report
            </Button>
            <Button variant="outline" className="w-full justify-start" data-testid="button-performance-analytics">
              <TrendingUp className="w-4 h-4 mr-2" />
              View Performance Analytics
            </Button>
            <Button variant="outline" className="w-full justify-start" data-testid="button-payment-processing">
              <Settings className="w-4 h-4 mr-2" />
              Process Contractor Payments
            </Button>
            <Button variant="outline" className="w-full justify-start" data-testid="button-network-settings">
              <Settings className="w-4 h-4 mr-2" />
              Configure Network Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}