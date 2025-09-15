import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plane, Plus, Search, Settings, MapPin } from 'lucide-react';

export default function Drones() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
          Drone Operations
        </h1>
        <p className="text-gray-600 mt-2">
          Manage drone fleet, aerial inspections, and automated damage assessment
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Drones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-drones">24</div>
            <p className="text-xs text-gray-500">Currently deployed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Flights Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-flights-today">47</div>
            <p className="text-xs text-gray-500">+12 from yesterday</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Inspections Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-inspections-complete">312</div>
            <p className="text-xs text-gray-500">This week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Coverage Area</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-coverage-area">2,847</div>
            <p className="text-xs text-gray-500">sq miles</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <Button data-testid="button-deploy-drone">
          <Plus className="w-4 h-4 mr-2" />
          Deploy Drone
        </Button>
        <Button variant="outline" data-testid="button-flight-planner">
          <MapPin className="w-4 h-4 mr-2" />
          Flight Planner
        </Button>
        <Button variant="outline" data-testid="button-drone-settings">
          <Settings className="w-4 h-4 mr-2" />
          Fleet Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plane className="w-5 h-5 mr-2" />
              Drone Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">Automated Inspections</h4>
              <p className="text-sm text-blue-700">AI-powered roof and property damage assessment with high-resolution imaging</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900">Real-time Monitoring</h4>
              <p className="text-sm text-green-700">Live video feeds and GPS tracking for all active drone operations</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900">Weather Integration</h4>
              <p className="text-sm text-purple-700">Automatic flight path adjustments based on real-time weather conditions</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-900">Data Analytics</h4>
              <p className="text-sm text-orange-700">Machine learning analysis of aerial imagery for damage detection and reporting</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fleet Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium">Operational</span>
              <span className="text-lg font-bold text-green-700" data-testid="text-operational-drones">18</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium">Maintenance</span>
              <span className="text-lg font-bold text-yellow-700" data-testid="text-maintenance-drones">4</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium">Offline</span>
              <span className="text-lg font-bold text-red-700" data-testid="text-offline-drones">2</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Total Fleet</span>
              <span className="text-lg font-bold" data-testid="text-total-fleet">24</span>
            </div>
            <Button className="w-full mt-4" data-testid="button-fleet-report">
              Generate Fleet Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}