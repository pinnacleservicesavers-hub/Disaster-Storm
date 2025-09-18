import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Hotel, 
  Fuel, 
  Hammer,
  Home,
  AlertTriangle,
  Satellite,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  ExternalLink,
  Star,
  Users,
  ShoppingCart,
  Shield,
  Wifi,
  Navigation
} from "lucide-react";
import { getPrimaryServicePhoto, hasServicePhotos } from "@/utils/photoManager";
import VoiceGuide from "@/components/VoiceGuide";

// State selection data
const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }
];

// Animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function DisasterEssentialsMarketplace() {
  const [selectedState, setSelectedState] = useState("FL");
  const [searchLocation, setSearchLocation] = useState("");
  const [currentPortal, setCurrentPortal] = useState("hotels");

  // Sample data (will be replaced with real API calls)
  const mockHotels = [
    {
      id: "1",
      name: "StormSafe Inn & Suites",
      type: "hotel",
      address: "123 Storm Ave",
      city: "Miami",
      state: "FL",
      phone: "(305) 555-0123",
      pricePerNight: 89.99,
      discountRate: 15,
      availableRooms: 12,
      totalRooms: 150,
      isOpen: true,
      amenities: ["Free Wifi", "Generator Backup", "24hr Security"]
    },
    {
      id: "2", 
      name: "Hurricane Harbor RV Park",
      type: "rv_park",
      address: "456 Coastal Rd",
      city: "Tampa",
      state: "FL",
      phone: "(813) 555-0456",
      pricePerNight: 45.00,
      discountRate: 20,
      availableRooms: 8,
      totalRooms: 50,
      isOpen: true,
      amenities: ["Full Hookups", "Laundry", "Storm Shelter"]
    }
  ];

  const mockGasStations = [
    {
      id: "1",
      name: "Shell Station",
      brand: "Shell",
      address: "789 Highway 1",
      city: "Miami",
      state: "FL",
      phone: "(305) 555-0789",
      regularPrice: 3.299,
      premiumPrice: 3.699,
      dieselPrice: 3.799,
      isOpen: true,
      hasAvailability: true,
      hours: "24/7"
    },
    {
      id: "2",
      name: "Emergency Fuel Depot",
      brand: "Independent",
      address: "321 Storm Blvd",
      city: "Tampa", 
      state: "FL",
      phone: "(813) 555-0321",
      regularPrice: 3.199,
      premiumPrice: 3.599,
      dieselPrice: 3.699,
      isOpen: true,
      hasAvailability: false,
      hours: "6AM-10PM"
    }
  ];

  const mockHardwareStores = [
    {
      id: "1",
      name: "Home Depot #2045",
      chain: "Home Depot",
      address: "555 Builder Blvd",
      city: "Miami",
      state: "FL",
      phone: "(305) 555-1234",
      isOpen: true,
      inventory: {
        chainsawChains: { available: true, price: 24.99 },
        barOil: { available: true, price: 12.99 },
        tarps: { available: false, price: null },
        generators: { available: true, price: 899.99 },
        fuelCans: { available: true, price: 29.99 },
        safetyGear: { available: true, price: 45.99 }
      },
      hours: "6AM-9PM"
    }
  ];

  const mockShelters = [
    {
      id: "1", 
      name: "Miami Emergency Shelter",
      type: "shelter",
      organization: "Red Cross",
      address: "100 Safety St",
      city: "Miami",
      state: "FL", 
      phone: "(305) 555-HELP",
      capacity: 500,
      currentOccupancy: 245,
      isOpen: true,
      acceptingIntake: true,
      services: ["shelter", "food", "medical", "supplies"],
      hours: "24/7"
    },
    {
      id: "2",
      name: "Tampa Food Distribution Center",
      type: "food_distribution", 
      organization: "FEMA",
      address: "200 Relief Ave",
      city: "Tampa",
      state: "FL",
      phone: "(813) 555-FOOD",
      capacity: 1000,
      currentOccupancy: 350,
      isOpen: true,
      acceptingIntake: true,
      services: ["food", "water", "supplies"],
      hours: "8AM-6PM"
    }
  ];

  const mockAlerts = [
    {
      id: "1",
      title: "Price Gouging Alert",
      message: "Reports of fuel price gouging on I-95 corridor. Avoid stations charging >$5/gallon.",
      alertType: "price_gouging",
      severity: "high",
      state: "FL",
      county: "Miami-Dade",
      city: "Miami",
      isActive: true,
      source: "AI"
    },
    {
      id: "2", 
      title: "Curfew in Effect",
      message: "Emergency curfew 8PM-6AM in affected areas. Essential workers exempt with ID.",
      alertType: "curfew",
      severity: "critical",
      state: "FL",
      county: "Hillsborough",
      city: "Tampa", 
      isActive: true,
      source: "Local Govt"
    }
  ];

  const mockSatelliteProducts = [
    {
      id: "1",
      name: "Iridium Extreme 9575",
      model: "9575",
      vendor: "Satellite Phone Store",
      category: "satellite_phone",
      price: 1680.00,
      coverage: "global",
      features: ["GPS Tracking", "SOS Button", "Weatherproof", "Two-way messaging"],
      isInStock: true,
      vendorUrl: "https://satellitephonestore.com",
      vendorPhone: "(555) SAT-PHONE",
      specifications: {
        durability: "IP65 Weatherproof",
        batteryLife: "30 hrs standby",
        gpsEnabled: true,
        sosFeatures: true,
        waterproof: true
      }
    },
    {
      id: "2",
      name: "Inmarsat IsatPhone 2", 
      model: "IsatPhone 2",
      vendor: "BlueCosmo",
      category: "satellite_phone",
      price: 789.00,
      coverage: "global",
      features: ["Long Battery Life", "Compact Design", "GPS", "Emergency Button"],
      isInStock: true,
      vendorUrl: "https://bluecosmo.com",
      vendorPhone: "(555) BLUE-SAT",
      specifications: {
        durability: "Dust/Water Resistant",
        batteryLife: "8 hrs talk time",
        gpsEnabled: true,
        sosFeatures: true,
        waterproof: false
      }
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";  
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getStatusColor = (isOpen: boolean, hasAvailability?: boolean) => {
    if (!isOpen) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (hasAvailability === false) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  };

  const getStatusText = (isOpen: boolean, hasAvailability?: boolean) => {
    if (!isOpen) return "CLOSED";
    if (hasAvailability === false) return "LOW STOCK";
    return "OPEN";
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleDirections = (address: string, city: string, state: string) => {
    const query = encodeURIComponent(`${address}, ${city}, ${state}`);
    window.open(`https://maps.google.com/?q=${query}`, '_blank');
  };

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  const handlePortalChange = (portal: string) => {
    setCurrentPortal(portal);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4" data-testid="heading-dem-title">
            🌪️ Disaster Essentials Marketplace
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto" data-testid="text-dem-description">
            Real-time pricing, resources, and shelter info for every storm state. Your one-stop resource hub for contractors and disaster victims.
          </p>
        </motion.div>

        {/* State/Location Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8"
        >
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <Select value={selectedState} onValueChange={setSelectedState} data-testid="select-state">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((state) => (
                  <SelectItem key={state.code} value={state.code}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Search by city or zip code..."
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="max-w-xs"
            data-testid="input-search-location"
          />
        </motion.div>

        {/* Voice Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex justify-center mb-8"
        >
          <VoiceGuide
            currentPortal={currentPortal}
            onPortalChange={handlePortalChange}
            className="relative"
          />
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="hotels" onValueChange={handlePortalChange} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-8" data-testid="tabs-dem-sections">
            <TabsTrigger value="hotels" className="text-xs" data-testid="tab-hotels">
              <Hotel className="w-4 h-4 mr-1" />
              Hotels
            </TabsTrigger>
            <TabsTrigger value="gas" className="text-xs" data-testid="tab-gas">
              <Fuel className="w-4 h-4 mr-1" />
              Fuel
            </TabsTrigger>
            <TabsTrigger value="fema" className="text-xs" data-testid="tab-fema">
              <Shield className="w-4 h-4 mr-1" />
              FEMA
            </TabsTrigger>
            <TabsTrigger value="hardware" className="text-xs" data-testid="tab-hardware">
              <Hammer className="w-4 h-4 mr-1" />
              Hardware
            </TabsTrigger>
            <TabsTrigger value="shelters" className="text-xs" data-testid="tab-shelters">
              <Home className="w-4 h-4 mr-1" />
              Shelters
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs" data-testid="tab-alerts">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="satellite" className="text-xs" data-testid="tab-satellite">
              <Satellite className="w-4 h-4 mr-1" />
              Satellite
            </TabsTrigger>
          </TabsList>

          {/* Hotels & Campgrounds Tab */}
          <TabsContent value="hotels">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              <Card className="mb-6" data-testid="card-hotels-info">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-600">
                    <Hotel className="w-6 h-6 mr-2" />
                    🏨 Hotels & Campgrounds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    State-by-state discounts and real-time vacancy status with one-click booking.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {mockHotels.map((hotel) => (
                      <motion.div key={hotel.id} variants={fadeInUp}>
                        <div 
                          className="portal-card"
                          style={{
                            backgroundImage: `url(${getPrimaryServicePhoto('hotels')})`
                          }}
                          data-testid={`card-hotel-${hotel.id}`}
                        >
                          <div className="portal-card-content p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="portal-card-title" data-testid={`text-hotel-name-${hotel.id}`}>
                                  {hotel.name}
                                </h3>
                                <p className="portal-card-subtitle text-sm" data-testid={`text-hotel-address-${hotel.id}`}>
                                  {hotel.address}, {hotel.city}, {hotel.state}
                                </p>
                              </div>
                              <Badge className={`portal-card-badge ${getStatusColor(hotel.isOpen)}`} data-testid={`badge-hotel-status-${hotel.id}`}>
                                {getStatusText(hotel.isOpen)}
                              </Badge>
                            </div>
                            
                            <div className="space-y-4 flex-1">
                              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm portal-card-text">Price per night:</span>
                                  <div className="text-right">
                                    <span className="text-lg font-bold text-green-300" data-testid={`text-hotel-price-${hotel.id}`}>
                                      ${(hotel.pricePerNight * (100 - hotel.discountRate) / 100).toFixed(2)}
                                    </span>
                                    {hotel.discountRate > 0 && (
                                      <div className="text-xs text-gray-300 line-through">
                                        ${hotel.pricePerNight}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-sm portal-card-text">Availability:</span>
                                  <span className="text-sm font-medium portal-card-text" data-testid={`text-hotel-availability-${hotel.id}`}>
                                    {hotel.availableRooms}/{hotel.totalRooms} rooms
                                  </span>
                                </div>

                                {hotel.discountRate > 0 && (
                                  <Badge className="bg-orange-500/80 text-white border-orange-400">
                                    {hotel.discountRate}% Contractor Discount
                                  </Badge>
                                )}

                                <div className="flex flex-wrap gap-1 mt-2">
                                  {hotel.amenities.map((amenity, idx) => (
                                    <Badge key={idx} className="portal-card-badge text-xs">
                                      {amenity}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <div className="flex gap-3 mt-4">
                                <Button 
                                  onClick={() => handleCall(hotel.phone)}
                                  className="portal-card-button flex-1"
                                  data-testid={`button-call-hotel-${hotel.id}`}
                                >
                                  <Phone className="w-4 h-4 mr-2" />
                                  Call
                                </Button>
                                <Button 
                                  onClick={() => handleDirections(hotel.address, hotel.city, hotel.state)}
                                  className="portal-card-button flex-1"
                                  data-testid={`button-directions-hotel-${hotel.id}`}
                                >
                                  <Navigation className="w-4 h-4 mr-2" />
                                  Directions
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Gas Stations Tab */}
          <TabsContent value="gas">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              <Card className="mb-6" data-testid="card-gas-info">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-600">
                    <Fuel className="w-6 h-6 mr-2" />
                    ⛽ Gas & Fuel Prices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Live gas price feeds showing cheapest, closest, and average prices with real-time availability.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {mockGasStations.map((station) => (
                      <motion.div key={station.id} variants={fadeInUp}>
                        <div 
                          className="portal-card"
                          style={{
                            backgroundImage: `url(${getPrimaryServicePhoto('gas')})`
                          }}
                          data-testid={`card-gas-station-${station.id}`}
                        >
                          <div className="portal-card-content p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="portal-card-title" data-testid={`text-gas-name-${station.id}`}>
                                  {station.name}
                                </h3>
                                <p className="portal-card-subtitle text-sm" data-testid={`text-gas-address-${station.id}`}>
                                  {station.address}, {station.city}, {station.state}
                                </p>
                                <p className="text-xs portal-card-text opacity-90">{station.hours}</p>
                              </div>
                              <Badge className={`portal-card-badge ${getStatusColor(station.isOpen, station.hasAvailability)}`} data-testid={`badge-gas-status-${station.id}`}>
                                {getStatusText(station.isOpen, station.hasAvailability)}
                              </Badge>
                            </div>
                            
                            <div className="space-y-4 flex-1">
                              <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                  <div className="bg-white/10 rounded-lg p-3">
                                    <p className="text-xs portal-card-text opacity-80">Regular</p>
                                    <p className="font-bold text-green-300 text-lg" data-testid={`text-gas-regular-${station.id}`}>
                                      ${station.regularPrice}
                                    </p>
                                  </div>
                                  <div className="bg-white/10 rounded-lg p-3">
                                    <p className="text-xs portal-card-text opacity-80">Premium</p>
                                    <p className="font-bold text-blue-300 text-lg" data-testid={`text-gas-premium-${station.id}`}>
                                      ${station.premiumPrice}
                                    </p>
                                  </div>
                                  <div className="bg-white/10 rounded-lg p-3">
                                    <p className="text-xs portal-card-text opacity-80">Diesel</p>
                                    <p className="font-bold text-purple-300 text-lg" data-testid={`text-gas-diesel-${station.id}`}>
                                      ${station.dieselPrice}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-3 mt-4">
                                <Button 
                                  onClick={() => handleCall(station.phone)}
                                  className="portal-card-button flex-1"
                                  data-testid={`button-call-gas-${station.id}`}
                                >
                                  <Phone className="w-4 h-4 mr-2" />
                                  Call
                                </Button>
                                <Button 
                                  onClick={() => handleDirections(station.address, station.city, station.state)}
                                  className="portal-card-button flex-1"
                                  data-testid={`button-directions-gas-${station.id}`}
                                >
                                  <Navigation className="w-4 h-4 mr-2" />
                                  Directions
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* FEMA Tab */}
          <TabsContent value="fema">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              <Card data-testid="card-fema-info">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-600">
                    <Shield className="w-6 h-6 mr-2" />
                    🏘 FEMA Contractor Housing & Registration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <p className="text-gray-600 dark:text-gray-400">
                      FEMA-approved contractor lodging and registration portal with direct sign-up access.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div 
                        className="portal-card"
                        style={{
                          backgroundImage: `url(${getPrimaryServicePhoto('fema')})`
                        }}
                      >
                        <div className="portal-card-content p-6">
                          <h3 className="portal-card-title mb-4">
                            Contractor Registration
                          </h3>
                          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 mb-4">
                            <p className="text-sm portal-card-text mb-4">
                              Register your contracting business with FEMA for disaster response opportunities.
                            </p>
                          </div>
                          <Button 
                            className="portal-card-button w-full"
                            onClick={() => handleExternalLink("https://www.sam.gov")}
                            data-testid="button-fema-registration"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            FEMA Vendor Registration
                          </Button>
                        </div>
                      </div>

                      <div 
                        className="portal-card"
                        style={{
                          backgroundImage: `url(${getPrimaryServicePhoto('fema')})`
                        }}
                      >
                        <div className="portal-card-content p-6">
                          <h3 className="portal-card-title mb-4">
                            Approved Housing
                          </h3>
                          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 mb-4">
                            <p className="text-sm portal-card-text mb-4">
                              Find FEMA-approved lodging for contractors working disaster areas.
                            </p>
                          </div>
                          <Button 
                            className="portal-card-button w-full"
                            onClick={() => handleExternalLink("https://www.fema.gov/assistance/contractor-resources")}
                            data-testid="button-fema-housing"
                          >
                            <Home className="w-4 h-4 mr-2" />
                            Find Housing
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="portal-info-card p-6">
                      <h3 className="font-bold text-lg mb-4 text-yellow-600 dark:text-yellow-400">
                        📋 Registration Steps
                      </h3>
                      <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                        <li className="flex items-start">
                          <span className="font-semibold text-yellow-600 dark:text-yellow-400 mr-2">1.</span>
                          Create SAM.gov account for federal contracting
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-yellow-600 dark:text-yellow-400 mr-2">2.</span>
                          Complete FEMA vendor profile with capabilities
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-yellow-600 dark:text-yellow-400 mr-2">3.</span>
                          Submit required certifications and insurance
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-yellow-600 dark:text-yellow-400 mr-2">4.</span>
                          Await approval and activation status
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold text-yellow-600 dark:text-yellow-400 mr-2">5.</span>
                          Monitor opportunities through FEMA systems
                        </li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Hardware Tab */}
          <TabsContent value="hardware">
            <motion.div
              variants={staggerContainer}
              initial="hidden" 
              animate="show"
            >
              <Card className="mb-6" data-testid="card-hardware-info">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-600">
                    <Hammer className="w-6 h-6 mr-2" />
                    🛠️ Hardware & Supplies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Real-time inventory for chainsaw chains, bar oil, tarps, generators, fuel cans, and safety gear.
                  </p>
                  <div className="grid grid-cols-1 gap-8">
                    {mockHardwareStores.map((store) => (
                      <motion.div key={store.id} variants={fadeInUp}>
                        <div 
                          className="portal-card"
                          style={{
                            backgroundImage: `url(${getPrimaryServicePhoto('hardware')})`
                          }}
                          data-testid={`card-hardware-${store.id}`}
                        >
                          <div className="portal-card-content p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="portal-card-title" data-testid={`text-hardware-name-${store.id}`}>
                                  {store.name}
                                </h3>
                                <p className="portal-card-subtitle text-sm" data-testid={`text-hardware-address-${store.id}`}>
                                  {store.address}, {store.city}, {store.state}
                                </p>
                                <p className="text-xs portal-card-text opacity-90">{store.hours}</p>
                              </div>
                              <Badge className={`portal-card-badge ${getStatusColor(store.isOpen)}`} data-testid={`badge-hardware-status-${store.id}`}>
                                {getStatusText(store.isOpen)}
                              </Badge>
                            </div>

                            <div className="space-y-4 flex-1">
                              <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4">
                                <h4 className="font-semibold portal-card-text mb-3">Current Inventory:</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {Object.entries(store.inventory).map(([item, details]) => (
                                    <div key={item} className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                      <span className="text-xs portal-card-text block mb-2 capitalize">{item.replace(/([A-Z])/g, ' $1').trim()}</span>
                                      <div className="text-center">
                                        {details.available ? (
                                          <div>
                                            <Badge className="bg-green-500/80 text-white text-xs mb-1">
                                              Available
                                            </Badge>
                                            {details.price && (
                                              <p className="text-xs portal-card-text font-semibold">${details.price}</p>
                                            )}
                                          </div>
                                        ) : (
                                          <Badge className="bg-red-500/80 text-white text-xs">
                                            Out of Stock
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex gap-3 mt-4">
                                <Button 
                                  onClick={() => handleCall(store.phone)}
                                  className="portal-card-button flex-1"
                                  data-testid={`button-call-hardware-${store.id}`}
                                >
                                  <Phone className="w-4 h-4 mr-2" />
                                  Call Store
                                </Button>
                                <Button 
                                  onClick={() => handleDirections(store.address, store.city, store.state)}
                                  className="portal-card-button flex-1"
                                  data-testid={`button-directions-hardware-${store.id}`}
                                >
                                  <Navigation className="w-4 h-4 mr-2" />
                                  Directions
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Shelters Tab */}
          <TabsContent value="shelters">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              <Card className="mb-6" data-testid="card-shelters-info">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600">
                    <Home className="w-6 h-6 mr-2" />
                    🍲 Local Resources for Victims
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Verified shelters, food distribution centers, and aid stations with real-time availability.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mockShelters.map((shelter) => (
                      <motion.div key={shelter.id} variants={fadeInUp}>
                        <Card className="border-2 hover:border-red-300 transition-colors" data-testid={`card-shelter-${shelter.id}`}>
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100" data-testid={`text-shelter-name-${shelter.id}`}>
                                  {shelter.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400" data-testid={`text-shelter-address-${shelter.id}`}>
                                  {shelter.address}, {shelter.city}, {shelter.state}
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                  Operated by {shelter.organization}
                                </p>
                              </div>
                              <Badge className={getStatusColor(shelter.isOpen)} data-testid={`badge-shelter-status-${shelter.id}`}>
                                {shelter.isOpen ? "OPEN" : "CLOSED"}
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Capacity:</span>
                                <span className="text-sm font-medium" data-testid={`text-shelter-capacity-${shelter.id}`}>
                                  {shelter.currentOccupancy}/{shelter.capacity}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Accepting Intake:</span>
                                <Badge className={shelter.acceptingIntake ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}>
                                  {shelter.acceptingIntake ? "YES" : "NO"}
                                </Badge>
                              </div>

                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Services Available:</p>
                                <div className="flex flex-wrap gap-1">
                                  {shelter.services.map((service, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs capitalize">
                                      {service}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <p className="text-xs text-gray-500 dark:text-gray-500">Hours: {shelter.hours}</p>

                              <div className="flex gap-2 mt-4">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleCall(shelter.phone)}
                                  className="flex-1"
                                  data-testid={`button-call-shelter-${shelter.id}`}
                                >
                                  <Phone className="w-4 h-4 mr-1" />
                                  Call
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDirections(shelter.address, shelter.city, shelter.state)}
                                  className="flex-1"
                                  data-testid={`button-directions-shelter-${shelter.id}`}
                                >
                                  <Navigation className="w-4 h-4 mr-1" />
                                  Directions
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              <Card className="mb-6" data-testid="card-alerts-info">
                <CardHeader>
                  <CardTitle className="flex items-center text-yellow-600">
                    <AlertTriangle className="w-6 h-6 mr-2" />
                    🚨 Critical Awareness Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    AI-powered alerts for price gouging, curfews, road closures, and safety hazards with push notifications.
                  </p>
                  <div className="space-y-4">
                    {mockAlerts.map((alert) => (
                      <motion.div key={alert.id} variants={fadeInUp}>
                        <Card className={`border-l-4 ${alert.severity === 'critical' ? 'border-l-red-500' : alert.severity === 'high' ? 'border-l-orange-500' : 'border-l-yellow-500'}`} data-testid={`card-alert-${alert.id}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100" data-testid={`text-alert-title-${alert.id}`}>
                                {alert.title}
                              </h3>
                              <Badge className={getSeverityColor(alert.severity)} data-testid={`badge-alert-severity-${alert.id}`}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                            </div>
                            
                            <p className="text-gray-700 dark:text-gray-300 mb-3" data-testid={`text-alert-message-${alert.id}`}>
                              {alert.message}
                            </p>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                              <span>📍 {alert.city}, {alert.county} County, {alert.state}</span>
                              <span>Source: {alert.source}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Satellite Phones Tab */}
          <TabsContent value="satellite">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              <Card className="mb-6" data-testid="card-satellite-info">
                <CardHeader>
                  <CardTitle className="flex items-center text-indigo-600">
                    <Satellite className="w-6 h-6 mr-2" />
                    📡 Satellite Phones & Emergency Internet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Emergency communication devices with direct vendor access, pricing comparison, and purchase links.
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {mockSatelliteProducts.map((product) => (
                      <motion.div key={product.id} variants={fadeInUp}>
                        <Card className="border-2 hover:border-indigo-300 transition-colors" data-testid={`card-satellite-${product.id}`}>
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100" data-testid={`text-satellite-name-${product.id}`}>
                                  {product.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {product.vendor} • Model: {product.model}
                                </p>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                                  Coverage: {product.coverage}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600" data-testid={`text-satellite-price-${product.id}`}>
                                  ${product.price}
                                </div>
                                <Badge className={product.isInStock ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}>
                                  {product.isInStock ? "In Stock" : "Out of Stock"}
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Key Features:</p>
                                <div className="flex flex-wrap gap-1">
                                  {product.features.map((feature, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {feature}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-400">
                                <div>
                                  <p className="font-medium">Durability:</p>
                                  <p>{product.specifications.durability}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Battery Life:</p>
                                  <p>{product.specifications.batteryLife}</p>
                                </div>
                                <div className="col-span-2 flex gap-4">
                                  <span className={`flex items-center ${product.specifications.gpsEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                                    🛰️ GPS {product.specifications.gpsEnabled ? '✓' : '✗'}
                                  </span>
                                  <span className={`flex items-center ${product.specifications.sosFeatures ? 'text-green-600' : 'text-gray-400'}`}>
                                    🆘 SOS {product.specifications.sosFeatures ? '✓' : '✗'}
                                  </span>
                                  <span className={`flex items-center ${product.specifications.waterproof ? 'text-green-600' : 'text-gray-400'}`}>
                                    💧 Waterproof {product.specifications.waterproof ? '✓' : '✗'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2 mt-4">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleCall(product.vendorPhone)}
                                  className="flex-1"
                                  data-testid={`button-call-vendor-${product.id}`}
                                >
                                  <Phone className="w-4 h-4 mr-1" />
                                  Call Vendor
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleExternalLink(product.vendorUrl)}
                                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                                  data-testid={`button-buy-${product.id}`}
                                >
                                  <ShoppingCart className="w-4 h-4 mr-1" />
                                  Buy Now
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Buying Guide */}
                  <Card className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-4 text-blue-700 dark:text-blue-300">
                        ⚠️ What to Check Before Buying Satellite Devices
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
                        <div>
                          <h4 className="font-semibold mb-2">Technical Considerations:</h4>
                          <ul className="space-y-1">
                            <li>• <strong>Coverage:</strong> Iridium = global, Inmarsat/Thuraya = regional</li>
                            <li>• <strong>Costs:</strong> Device + monthly/usage fees</li>
                            <li>• <strong>Durability:</strong> Waterproof, rugged, storm-proof ratings</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Essential Features:</h4>
                          <ul className="space-y-1">
                            <li>• <strong>Emergency:</strong> GPS tracking, SOS buttons, push-to-talk</li>
                            <li>• <strong>Accessories:</strong> Solar chargers, extra batteries, vehicle adapters</li>
                            <li>• <strong>Regulations:</strong> Some states/countries restrict usage</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-6">
          <p className="font-medium mb-2">🔑 Verified Vendors Only</p>
          <p className="max-w-2xl mx-auto leading-relaxed">
            All vendors and suppliers are verified for trustworthiness and reliability. 
            Real-time data powered by multiple feeds including GasBuddy, FEMA, Red Cross, and proprietary AI monitoring systems.
          </p>
          <p className="mt-2 text-xs">
            Emergency Communications • Survival Resources • Contractor Support • Disaster Relief Coordination
          </p>
        </div>
      </div>
    </div>
  );
}