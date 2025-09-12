import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { homeowners } from '@shared/schema';
import { 
  Home, 
  Camera, 
  FileText, 
  Users, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Phone,
  Mail,
  User,
  LogOut,
  Plus,
  CheckCircle,
  AlertCircle,
  Wrench,
  Cloud,
  Zap,
  Shield
} from 'lucide-react';

type VictimUser = typeof homeowners.$inferSelect;

export default function VictimDashboard() {
  const [user, setUser] = useState<VictimUser | null>(null);

  // Fetch weather alerts for user's area
  const { data: weatherAlerts } = useQuery({
    queryKey: ['weather-alerts', user?.state],
    queryFn: async () => {
      if (!user?.state) return [];
      const response = await fetch(`/api/weather/alerts?state=${user.state}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.alerts || [];
    },
    enabled: !!user?.state
  });

  // Fetch storm hot zones for user's area
  const { data: hotZones } = useQuery({
    queryKey: ['hot-zones', user?.state],
    queryFn: async () => {
      if (!user?.state) return [];
      const response = await fetch(`/api/storm-hot-zones?state=${user.state}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.hotZones || [];
    },
    enabled: !!user?.state
  });

  // Fetch FEMA incidents for user's area
  const { data: femaIncidents } = useQuery({
    queryKey: ['fema-incidents', user?.state],
    queryFn: async () => {
      if (!user?.state) return [];
      const response = await fetch(`/api/fema/incidents?state=${user.state}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.incidents || [];
    },
    enabled: !!user?.state
  });

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('victimUser');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Redirect to login if no user data
      window.location.href = '/victim/login';
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('victimUser');
    window.location.href = '/victim/login';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const userInitials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="min-h-screen bg-gray-50">
      <title>Victim Dashboard - StormLead Master</title>
      <meta name="description" content="Storm victim dashboard for reporting damage, tracking requests, and connecting with contractors" />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Home className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Storm Victim Portal</h1>
                <p className="text-sm text-gray-600">Emergency Assistance & Damage Reporting</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                  {userInitials}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900" data-testid="text-username">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Emergency Alert */}
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Emergency Notice:</strong> If you're in immediate danger or have urgent safety concerns, 
            call 911 immediately. This portal is for property damage reporting and contractor assistance.
          </AlertDescription>
        </Alert>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/victim/report-damage">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Report Damage</h3>
                <p className="text-sm text-gray-600">Upload photos and document property damage</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/victim/request-help">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wrench className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Request Help</h3>
                <p className="text-sm text-gray-600">Find contractors for repairs and restoration</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/victim/my-requests">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">My Requests</h3>
                <p className="text-sm text-gray-600">Track your service requests and status</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/victim/contractors">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Find Contractors</h3>
                <p className="text-sm text-gray-600">Browse verified contractors in your area</p>
              </CardContent>
            </Link>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="w-5 h-5 mr-2" />
                  Property Information
                </CardTitle>
                <CardDescription>
                  Your registered property details for damage reporting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900" data-testid="text-property-address">
                      {user.propertyAddress}
                    </p>
                    <p className="text-sm text-gray-600">
                      {user.city}, {user.state} {user.zipCode}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Home className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Property Type</p>
                    <Badge variant="secondary" className="mt-1">
                      {user.propertyType.charAt(0).toUpperCase() + user.propertyType.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Link href="/victim/profile">
                    <Button variant="outline" size="sm" data-testid="button-edit-profile">
                      <User className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent activity yet</p>
                  <p className="text-sm mt-2">Start by reporting damage or requesting help</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm" data-testid="text-phone">{user.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm" data-testid="text-email">{user.email}</span>
                </div>
              </CardContent>
            </Card>

            {/* Weather Alert */}
            <Card className={`${
              weatherAlerts && weatherAlerts.length > 0 
                ? 'bg-red-50 border-red-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <CardHeader>
                <CardTitle className={`text-lg flex items-center ${
                  weatherAlerts && weatherAlerts.length > 0 
                    ? 'text-red-800' 
                    : 'text-yellow-800'
                }`}>
                  {weatherAlerts && weatherAlerts.length > 0 ? (
                    <AlertTriangle className="w-5 h-5 mr-2" />
                  ) : (
                    <Cloud className="w-5 h-5 mr-2" />
                  )}
                  {weatherAlerts && weatherAlerts.length > 0 ? 'Active Weather Alerts' : 'Weather Monitoring'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weatherAlerts && weatherAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {weatherAlerts.slice(0, 2).map((alert: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border border-red-200">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-red-100 text-red-800 border-0">
                            {alert.severity || 'Alert'}
                          </Badge>
                          <span className="text-xs text-red-600">
                            {alert.areas ? alert.areas.slice(0, 2).join(', ') : user?.state}
                          </span>
                        </div>
                        <p className="text-sm text-red-700 font-medium">{alert.title || alert.event}</p>
                        {alert.description && (
                          <p className="text-xs text-red-600 mt-1 line-clamp-2">{alert.description}</p>
                        )}
                      </div>
                    ))}
                    {weatherAlerts.length > 2 && (
                      <p className="text-xs text-red-600">
                        +{weatherAlerts.length - 2} more alerts
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-yellow-700">
                    No active weather alerts for your area. Monitor conditions and stay prepared.
                  </p>
                )}
                <Link href="/weather">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={`mt-3 ${
                      weatherAlerts && weatherAlerts.length > 0
                        ? 'border-red-300 text-red-700 hover:bg-red-100'
                        : 'border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                    }`}
                  >
                    View Weather Center
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Storm Hot Zones */}
            {hotZones && hotZones.length > 0 && (
              <Card className="bg-orange-50 border-orange-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-orange-800">
                    <Zap className="w-5 h-5 mr-2" />
                    Storm Hot Zones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {hotZones.slice(0, 3).map((zone: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-orange-200">
                        <div>
                          <p className="text-sm font-medium text-orange-900">{zone.county || zone.name}</p>
                          <p className="text-xs text-orange-700">Risk Level: {zone.riskLevel || zone.severity}</p>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800 border-0 text-xs">
                          {zone.type || 'Storm Risk'}
                        </Badge>
                      </div>
                    ))}
                    {hotZones.length > 3 && (
                      <p className="text-xs text-orange-600">
                        +{hotZones.length - 3} more zones
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-orange-700 mt-3">
                    High-risk areas for storm activity in your region
                  </p>
                </CardContent>
              </Card>
            )}

            {/* FEMA Incidents */}
            {femaIncidents && femaIncidents.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-blue-800">
                    <Shield className="w-5 h-5 mr-2" />
                    FEMA Incidents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {femaIncidents.slice(0, 2).map((incident: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-blue-100 text-blue-800 border-0">
                            {incident.incidentType || 'Disaster'}
                          </Badge>
                          <span className="text-xs text-blue-600">
                            {incident.declaredDate ? new Date(incident.declaredDate).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <p className="text-sm text-blue-700 font-medium">{incident.title || incident.incidentDescription}</p>
                        <p className="text-xs text-blue-600 mt-1">{incident.designatedArea || user?.state}</p>
                      </div>
                    ))}
                    {femaIncidents.length > 2 && (
                      <p className="text-xs text-blue-600">
                        +{femaIncidents.length - 2} more incidents
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-blue-700 mt-3">
                    Federal disaster declarations and emergency incidents
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Emergency Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium">Emergency Services</p>
                  <p className="text-red-600 font-bold">911</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Poison Control</p>
                  <p className="text-blue-600">1-800-222-1222</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Red Cross</p>
                  <p className="text-blue-600">1-800-733-2767</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}