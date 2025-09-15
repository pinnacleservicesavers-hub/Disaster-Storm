import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Plus, Search, Settings, Phone } from 'lucide-react';

export default function Customers() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
          Customer Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage customer relationships, communications, and service history
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-customers">15,847</div>
            <p className="text-xs text-gray-500">+342 this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-projects">1,234</div>
            <p className="text-xs text-gray-500">Currently in progress</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed-jobs">8,901</div>
            <p className="text-xs text-gray-500">This year</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Satisfaction Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-satisfaction-rate">96.8%</div>
            <p className="text-xs text-gray-500">5-star average</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <Button data-testid="button-add-customer">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
        <Button variant="outline" data-testid="button-search-customers">
          <Search className="w-4 h-4 mr-2" />
          Search Customers
        </Button>
        <Button variant="outline" data-testid="button-customer-settings">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Customer Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">Customer Profiles</h4>
              <p className="text-sm text-blue-700">Comprehensive customer information including property details, insurance info, and service history</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900">Communication Hub</h4>
              <p className="text-sm text-green-700">Centralized messaging, email tracking, and appointment scheduling</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900">Project Timeline</h4>
              <p className="text-sm text-purple-700">Visual project progress tracking with milestone notifications</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-900">Feedback System</h4>
              <p className="text-sm text-orange-700">Automated review requests and satisfaction surveys</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm">John Smith</h4>
                <span className="text-xs text-gray-500">2 min ago</span>
              </div>
              <p className="text-sm text-gray-600">New damage report submitted - Water damage in basement</p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm">Sarah Johnson</h4>
                <span className="text-xs text-gray-500">15 min ago</span>
              </div>
              <p className="text-sm text-gray-600">Project completed - 5-star review received</p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm">Mike Davis</h4>
                <span className="text-xs text-gray-500">1 hour ago</span>
              </div>
              <p className="text-sm text-gray-600">Payment received - $12,500 for roof restoration</p>
            </div>
            <Button variant="outline" className="w-full" data-testid="button-view-all-activity">
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}