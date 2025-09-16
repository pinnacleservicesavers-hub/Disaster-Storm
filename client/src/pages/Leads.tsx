import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, MapPin, Phone, Mail, Users, Wrench, Home, Car, Trees, Zap, AlertTriangle } from 'lucide-react';

export default function Leads() {
  const [filter, setFilter] = useState('all');

  // Sample leads data (will be replaced with real AI-generated leads)
  const sampleLeads = [
    {
      id: 'L001',
      type: 'tree_on_house',
      address: '123 Oak Street, Tampa, FL 33602',
      ownerName: 'Sarah Johnson',
      phone: '(813) 555-0123',
      email: 'sarah.johnson@email.com',
      damageDescription: 'Large oak tree fallen on main roof section',
      coverageType: 'Coverage A - Dwelling',
      estimatedValue: '$15,000',
      priority: 'urgent',
      contractorsNeeded: ['Tree Services', 'Roofing', 'General Contractor'],
      aiConfidence: 94,
      images: 3,
      timestamp: '2024-01-15 14:30:00',
      status: 'active'
    },
    {
      id: 'L002', 
      type: 'tree_on_car',
      address: '456 Pine Drive, Orlando, FL 32801',
      ownerName: 'Michael Chen',
      phone: '(407) 555-0456',
      email: 'mike.chen@email.com',
      damageDescription: 'Tree branch damaged vehicle in driveway',
      coverageType: 'Coverage B - Personal Property',
      estimatedValue: '$8,500',
      priority: 'high',
      contractorsNeeded: ['Tree Services', 'Auto Body'],
      aiConfidence: 89,
      images: 2,
      timestamp: '2024-01-15 13:45:00',
      status: 'active'
    },
    {
      id: 'L003',
      type: 'tree_blocking_road',
      address: 'Maple Avenue & 5th Street, Jacksonville, FL 32205',
      ownerName: 'City of Jacksonville',
      phone: '(904) 555-0789',
      email: 'emergency@coj.net',
      damageDescription: 'Large tree blocking major intersection',
      coverageType: 'Municipal - Emergency Access',
      estimatedValue: '$12,000',
      priority: 'emergency',
      contractorsNeeded: ['Tree Services', 'Traffic Management', 'Cleanup Crew'],
      aiConfidence: 97,
      images: 4,
      timestamp: '2024-01-15 15:15:00',
      status: 'active'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'emergency': return 'bg-red-600 text-white';
      case 'urgent': return 'bg-orange-500 text-white'; 
      case 'high': return 'bg-yellow-500 text-black';
      default: return 'bg-green-500 text-white';
    }
  };

  const getDamageIcon = (type: string) => {
    switch(type) {
      case 'tree_on_house': return <Home className="w-4 h-4" />;
      case 'tree_on_car': return <Car className="w-4 h-4" />;
      case 'tree_blocking_road': return <AlertTriangle className="w-4 h-4" />;
      default: return <Trees className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="title-leads">
          🎯 Damage Leads - AI Detection System
        </h1>
        <p className="text-gray-600">
          AI-powered damage detection from live footage with property owner information and contractor assignments
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active-leads">23</div>
            <p className="text-xs text-gray-500">+5 in last hour</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="stat-urgent-leads">8</div>
            <p className="text-xs text-gray-500">Requires immediate attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">AI Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-ai-confidence">92%</div>
            <p className="text-xs text-gray-500">Average accuracy</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Potential Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600" data-testid="stat-potential-revenue">$425K</div>
            <p className="text-xs text-gray-500">Total estimated value</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-4 mb-6">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All Leads
        </Button>
        <Button 
          variant={filter === 'urgent' ? 'default' : 'outline'}
          onClick={() => setFilter('urgent')}
        >
          Urgent
        </Button>
        <Button 
          variant={filter === 'tree' ? 'default' : 'outline'}
          onClick={() => setFilter('tree')}
        >
          Tree Damage
        </Button>
        <Button 
          variant={filter === 'unassigned' ? 'default' : 'outline'}
          onClick={() => setFilter('unassigned')}
        >
          Unassigned
        </Button>
      </div>

      {/* Leads List */}
      <div className="space-y-6">
        {sampleLeads.map((lead) => (
          <Card key={lead.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getDamageIcon(lead.type)}
                    <CardTitle className="text-lg">
                      Lead #{lead.id} - {lead.damageDescription}
                    </CardTitle>
                  </div>
                  <Badge className={getPriorityColor(lead.priority)}>
                    {lead.priority.toUpperCase()}
                  </Badge>
                  <Badge variant="secondary">
                    {lead.aiConfidence}% AI Confidence
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {lead.timestamp}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Property Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Property Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Address:</strong> {lead.address}</div>
                    <div><strong>Owner:</strong> {lead.ownerName}</div>
                    <div><strong>Phone:</strong> {lead.phone}</div>
                    <div><strong>Email:</strong> {lead.email}</div>
                    <div><strong>Coverage:</strong> {lead.coverageType}</div>
                    <div><strong>Est. Value:</strong> {lead.estimatedValue}</div>
                  </div>
                </div>

                {/* Contractor Needs */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Contractors Needed
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {lead.contractorsNeeded.map((contractor, index) => (
                      <Badge key={index} variant="outline" className="flex items-center">
                        <Wrench className="w-3 h-3 mr-1" />
                        {contractor}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Images:</strong> {lead.images} available
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button className="w-full" size="sm">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Owner
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <Target className="w-4 h-4 mr-2" />
                      Assign Contractors
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <Zap className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Processing Status */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-green-800">🤖 AI Detection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700">
                AI system is actively monitoring live footage from traffic cameras, drone feeds, 
                and social media uploads. New leads are automatically processed and assigned to contractors.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">ACTIVE</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}