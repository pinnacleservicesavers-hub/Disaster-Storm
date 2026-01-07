import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Phone, Mail, MapPin, DollarSign, FileText, Users } from 'lucide-react';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

interface Homeowner {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  propertyDamage: string;
  insuranceCompany: string;
  claimNumber: string;
  estimatedCost: string;
  coordinates?: { lat: number; lng: number };
}

export default function HomeownerContacts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [damageFilter, setDamageFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [insuranceFilter, setInsuranceFilter] = useState('all');

  // Fetch all homeowners
  const { data: homeowners = [], isLoading, error } = useQuery<Homeowner[]>({
    queryKey: ['/api/homeowners', searchQuery, damageFilter, cityFilter, insuranceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (damageFilter && damageFilter !== 'all') params.append('damageType', damageFilter);
      if (cityFilter) params.append('city', cityFilter);
      if (insuranceFilter && insuranceFilter !== 'all') params.append('insuranceCompany', insuranceFilter);
      
      const url = params.toString() 
        ? `/api/homeowners/search?${params.toString()}`
        : '/api/homeowners';
      
      const response = await fetch(url, {
        headers: {
          'x-user-id': 'contractor-001',
          'x-user-role': 'contractor',
          'x-username': 'contractor@demo.com'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch homeowner data');
      }
      
      return response.json();
    }
  });

  const clearFilters = () => {
    setSearchQuery('');
    setDamageFilter('all');
    setCityFilter('');
    setInsuranceFilter('all');
  };

  const damageTypes = [
    'roof damage', 'water damage', 'wind damage', 'flooding', 'hail damage',
    'tree damage', 'structural damage', 'storm surge', 'fire damage'
  ];

  const insuranceCompanies = [
    'State Farm', 'Allstate', 'USAA', 'Progressive', 'Farmers',
    'Liberty Mutual', 'Nationwide', 'Geico'
  ];

  const formatCost = (cost: string) => {
    return cost.replace('$', '').replace(',', '');
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <div className="text-lg font-semibold">Error loading homeowner data</div>
            </div>
            <p className="text-red-700 mt-2">Failed to load homeowner contact information. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
            Homeowner Contact Database
          </h1>
          <p className="text-gray-600 mt-2">
            Search and contact homeowners with property damage claims
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span data-testid="text-homeowner-count">{homeowners.length} homeowners</span>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search & Filter
          </CardTitle>
          <CardDescription>
            Find homeowners by name, address, damage type, or insurance company
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Name, address, or damage..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-query"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Damage Type</label>
              <Select value={damageFilter} onValueChange={setDamageFilter}>
                <SelectTrigger data-testid="select-damage-type">
                  <SelectValue placeholder="All damage types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All damage types</SelectItem>
                  {damageTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">City</label>
              <Input
                placeholder="Tampa, Miami, Orlando..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                data-testid="input-city-filter"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Insurance</label>
              <Select value={insuranceFilter} onValueChange={setInsuranceFilter}>
                <SelectTrigger data-testid="select-insurance-company">
                  <SelectValue placeholder="All companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All companies</SelectItem>
                  {insuranceCompanies.map(company => (
                    <SelectItem key={company} value={company}>{company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={clearFilters}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Homeowner Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homeowners.map((homeowner) => (
            <Card key={homeowner.id} className="hover:shadow-lg transition-shadow" data-testid={`card-homeowner-${homeowner.id}`}>
              <CardHeader>
                <CardTitle className="text-lg" data-testid={`text-homeowner-name-${homeowner.id}`}>
                  {homeowner.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span data-testid={`text-homeowner-address-${homeowner.id}`}>{homeowner.address}</span>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Contact Information */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <a 
                      href={`tel:${homeowner.phone}`} 
                      className="text-blue-600 hover:underline"
                      data-testid={`link-phone-${homeowner.id}`}
                    >
                      {homeowner.phone}
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-green-600" />
                    <a 
                      href={`mailto:${homeowner.email}`} 
                      className="text-green-600 hover:underline"
                      data-testid={`link-email-${homeowner.id}`}
                    >
                      {homeowner.email}
                    </a>
                  </div>
                </div>
                
                {/* Property Damage */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Property Damage:</label>
                  <p className="text-sm text-gray-600 mt-1" data-testid={`text-damage-${homeowner.id}`}>
                    {homeowner.propertyDamage}
                  </p>
                </div>
                
                {/* Insurance & Claim Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" data-testid={`badge-insurance-${homeowner.id}`}>
                      {homeowner.insuranceCompany}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span data-testid={`text-cost-${homeowner.id}`}>{homeowner.estimatedCost}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span data-testid={`text-claim-${homeowner.id}`}>{homeowner.claimNumber}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => window.open(`tel:${homeowner.phone}`, '_self')}
                    data-testid={`button-call-${homeowner.id}`}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => window.open(`mailto:${homeowner.email}?subject=Storm Damage Assessment - ${homeowner.address}`, '_blank')}
                    data-testid={`button-email-${homeowner.id}`}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && homeowners.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Users className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No homeowners found</h3>
            <p className="text-gray-600 mb-4">
              No homeowners match your current search criteria.
            </p>
            <Button onClick={clearFilters} variant="outline" data-testid="button-clear-no-results">
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      )}
      <ModuleAIAssistant 
        moduleName="Homeowner Contacts"
        moduleContext="Comprehensive homeowner directory for contractors. Evelyn can help you search for leads, filter by damage type and location, explain insurance claim information, and guide you through contacting potential clients."
      />
    </div>
  );
}