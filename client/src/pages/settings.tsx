import { useState, useEffect } from "react";
import TopNavigation from "@/components/TopNavigation";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon,
  User,
  Bell,
  CloudRain,
  Key,
  Shield,
  Globe,
  Database,
  Download,
  Upload,
  Mail,
  Phone,
  MapPin,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react";

export default function Settings() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const { translate, currentLanguage, setLanguage } = useLanguage();
  const { toast } = useToast();

  // Settings state
  const [userSettings, setUserSettings] = useState({
    name: "John Doe",
    email: "john.doe@stormleadmaster.com",
    phone: "+1 (555) 123-4567",
    company: "Storm Response Services LLC",
    address: "123 Main St, Atlanta, GA 30309",
    timezone: "America/New_York"
  });

  const [notificationSettings, setNotificationSettings] = useState({
    weatherAlerts: true,
    claimUpdates: true,
    fieldReports: true,
    paymentNotifications: true,
    systemMaintenance: false,
    marketingEmails: false,
    smsNotifications: true,
    pushNotifications: true,
    emailDigest: "daily"
  });

  const [weatherSettings, setWeatherSettings] = useState({
    alertRadius: "50",
    severityLevels: {
      extreme: true,
      severe: true,
      moderate: true,
      minor: false
    },
    autoRefreshInterval: "2",
    coverageStates: ["GA", "FL", "AL", "SC", "NC", "TN"]
  });

  const [apiSettings, setApiSettings] = useState({
    openaiKey: "",
    nwsApiKey: "",
    spcApiKey: "",
    locationiqKey: "",
    stripeSecret: "",
    twilioSid: "",
    twilioToken: "",
    dropboxSignKey: "",
    smartyAuthId: "",
    attomApiKey: "",
    melissaApiKey: ""
  });

  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    backupFrequency: "weekly",
    dataRetention: "2",
    debugMode: false,
    analyticsTracking: true,
    crashReporting: true,
    performanceMonitoring: true
  });

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Saved",
        description: "Your settings have been successfully updated.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Data Export Complete",
        description: "Your data has been exported successfully.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestApiConnection = async (service: string) => {
    setIsLoading(true);
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: `${service} Connection Test`,
        description: "API connection successful!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${service}. Please check your API key.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="pt-16 flex">
        <Sidebar collapsed={sidebarCollapsed} />
        
        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-280'
        }`}>
          <div className="p-6">
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center space-x-3">
                  <SettingsIcon className="w-8 h-8 text-primary" />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900" data-testid="settings-title">
                      {translate('settings')}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Configure your StormLead Master platform
                    </p>
                  </div>
                </div>
                <div className="mt-4 lg:mt-0 flex space-x-3">
                  <Button 
                    variant="outline"
                    onClick={handleExportData}
                    disabled={isLoading}
                    data-testid="button-export-data"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                    data-testid="button-save-settings"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>

            {/* Settings Tabs */}
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="profile" data-testid="tab-profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="notifications" data-testid="tab-notifications">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="weather" data-testid="tab-weather">
                  <CloudRain className="w-4 h-4 mr-2" />
                  Weather
                </TabsTrigger>
                <TabsTrigger value="integrations" data-testid="tab-integrations">
                  <Key className="w-4 h-4 mr-2" />
                  Integrations
                </TabsTrigger>
                <TabsTrigger value="system" data-testid="tab-system">
                  <Database className="w-4 h-4 mr-2" />
                  System
                </TabsTrigger>
                <TabsTrigger value="security" data-testid="tab-security">
                  <Shield className="w-4 h-4 mr-2" />
                  Security
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <Card data-testid="card-profile-settings">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                        <Input
                          value={userSettings.name}
                          onChange={(e) => setUserSettings(prev => ({ ...prev, name: e.target.value }))}
                          data-testid="input-user-name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <Input
                          type="email"
                          value={userSettings.email}
                          onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
                          data-testid="input-user-email"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Phone Number</label>
                        <Input
                          value={userSettings.phone}
                          onChange={(e) => setUserSettings(prev => ({ ...prev, phone: e.target.value }))}
                          data-testid="input-user-phone"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Company</label>
                        <Input
                          value={userSettings.company}
                          onChange={(e) => setUserSettings(prev => ({ ...prev, company: e.target.value }))}
                          data-testid="input-user-company"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Business Address</label>
                      <Textarea
                        value={userSettings.address}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, address: e.target.value }))}
                        rows={3}
                        data-testid="textarea-user-address"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Timezone</label>
                      <select
                        value={userSettings.timezone}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        data-testid="select-timezone"
                      >
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      </select>
                    </div>

                    {/* Language Preferences */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Language Preference</label>
                      <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1 w-fit">
                        <Button
                          variant={currentLanguage === 'en' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setLanguage('en')}
                          data-testid="button-lang-en"
                        >
                          English
                        </Button>
                        <Button
                          variant={currentLanguage === 'es' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setLanguage('es')}
                          data-testid="button-lang-es"
                        >
                          Español
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <Card data-testid="card-notification-settings">
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Weather Alerts</h4>
                          <p className="text-sm text-gray-600">Receive notifications for weather warnings and watches</p>
                        </div>
                        <Switch
                          checked={notificationSettings.weatherAlerts}
                          onCheckedChange={(checked) => 
                            setNotificationSettings(prev => ({ ...prev, weatherAlerts: checked }))
                          }
                          data-testid="switch-weather-alerts"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Claim Updates</h4>
                          <p className="text-sm text-gray-600">Get notified when claims are updated or settled</p>
                        </div>
                        <Switch
                          checked={notificationSettings.claimUpdates}
                          onCheckedChange={(checked) => 
                            setNotificationSettings(prev => ({ ...prev, claimUpdates: checked }))
                          }
                          data-testid="switch-claim-updates"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Field Reports</h4>
                          <p className="text-sm text-gray-600">Notifications from field crews and urgent reports</p>
                        </div>
                        <Switch
                          checked={notificationSettings.fieldReports}
                          onCheckedChange={(checked) => 
                            setNotificationSettings(prev => ({ ...prev, fieldReports: checked }))
                          }
                          data-testid="switch-field-reports"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Payment Notifications</h4>
                          <p className="text-sm text-gray-600">Alerts for successful payments and failed transactions</p>
                        </div>
                        <Switch
                          checked={notificationSettings.paymentNotifications}
                          onCheckedChange={(checked) => 
                            setNotificationSettings(prev => ({ ...prev, paymentNotifications: checked }))
                          }
                          data-testid="switch-payment-notifications"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">SMS Notifications</h4>
                          <p className="text-sm text-gray-600">Receive important updates via text message</p>
                        </div>
                        <Switch
                          checked={notificationSettings.smsNotifications}
                          onCheckedChange={(checked) => 
                            setNotificationSettings(prev => ({ ...prev, smsNotifications: checked }))
                          }
                          data-testid="switch-sms-notifications"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Email Digest Frequency</label>
                      <select
                        value={notificationSettings.emailDigest}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailDigest: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        data-testid="select-email-digest"
                      >
                        <option value="none">No digest emails</option>
                        <option value="daily">Daily digest</option>
                        <option value="weekly">Weekly digest</option>
                        <option value="monthly">Monthly digest</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="weather" className="space-y-6">
                <Card data-testid="card-weather-settings">
                  <CardHeader>
                    <CardTitle>Weather Alert Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Alert Radius (miles)</label>
                        <Input
                          type="number"
                          value={weatherSettings.alertRadius}
                          onChange={(e) => setWeatherSettings(prev => ({ ...prev, alertRadius: e.target.value }))}
                          data-testid="input-alert-radius"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Refresh Interval (minutes)</label>
                        <select
                          value={weatherSettings.autoRefreshInterval}
                          onChange={(e) => setWeatherSettings(prev => ({ ...prev, autoRefreshInterval: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          data-testid="select-refresh-interval"
                        >
                          <option value="1">1 minute</option>
                          <option value="2">2 minutes</option>
                          <option value="5">5 minutes</option>
                          <option value="10">10 minutes</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Alert Severity Levels</h4>
                      {Object.entries(weatherSettings.severityLevels).map(([level, enabled]) => (
                        <div key={level} className="flex items-center justify-between">
                          <div>
                            <span className="font-medium capitalize">{level}</span>
                            <p className="text-sm text-gray-600">
                              {level === 'extreme' && 'Life-threatening weather conditions'}
                              {level === 'severe' && 'Dangerous weather conditions'}
                              {level === 'moderate' && 'Potentially hazardous conditions'}
                              {level === 'minor' && 'Minor weather advisories'}
                            </p>
                          </div>
                          <Switch
                            checked={enabled}
                            onCheckedChange={(checked) => 
                              setWeatherSettings(prev => ({
                                ...prev,
                                severityLevels: { ...prev.severityLevels, [level]: checked }
                              }))
                            }
                            data-testid={`switch-severity-${level}`}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Coverage States</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['GA', 'FL', 'AL', 'SC', 'NC', 'TN', 'TX', 'LA', 'MS'].map(state => (
                          <label key={state} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={weatherSettings.coverageStates.includes(state)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setWeatherSettings(prev => ({
                                    ...prev,
                                    coverageStates: [...prev.coverageStates, state]
                                  }));
                                } else {
                                  setWeatherSettings(prev => ({
                                    ...prev,
                                    coverageStates: prev.coverageStates.filter(s => s !== state)
                                  }));
                                }
                              }}
                              className="rounded border-gray-300"
                              data-testid={`checkbox-state-${state}`}
                            />
                            <span className="text-sm">{state}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integrations" className="space-y-6">
                <Card data-testid="card-api-integrations">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>API Integrations</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowApiKeys(!showApiKeys)}
                        data-testid="button-toggle-api-keys"
                      >
                        {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showApiKeys ? 'Hide' : 'Show'} Keys
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* OpenAI Integration */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">OpenAI API (GPT-4o)</h4>
                        <Badge className="bg-green-100 text-green-800">Connected</Badge>
                      </div>
                      <Input
                        type={showApiKeys ? "text" : "password"}
                        placeholder="sk-..."
                        value={apiSettings.openaiKey}
                        onChange={(e) => setApiSettings(prev => ({ ...prev, openaiKey: e.target.value }))}
                        data-testid="input-openai-key"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestApiConnection('OpenAI')}
                        disabled={isLoading}
                        data-testid="button-test-openai"
                      >
                        Test Connection
                      </Button>
                    </div>

                    {/* Stripe Integration */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Stripe Payments</h4>
                        <Badge className="bg-green-100 text-green-800">Connected</Badge>
                      </div>
                      <Input
                        type={showApiKeys ? "text" : "password"}
                        placeholder="sk_live_... or sk_test_..."
                        value={apiSettings.stripeSecret}
                        onChange={(e) => setApiSettings(prev => ({ ...prev, stripeSecret: e.target.value }))}
                        data-testid="input-stripe-key"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestApiConnection('Stripe')}
                        disabled={isLoading}
                        data-testid="button-test-stripe"
                      >
                        Test Connection
                      </Button>
                    </div>

                    {/* Twilio Integration */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Twilio SMS/Voice</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type={showApiKeys ? "text" : "password"}
                          placeholder="Account SID"
                          value={apiSettings.twilioSid}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, twilioSid: e.target.value }))}
                          data-testid="input-twilio-sid"
                        />
                        <Input
                          type={showApiKeys ? "text" : "password"}
                          placeholder="Auth Token"
                          value={apiSettings.twilioToken}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, twilioToken: e.target.value }))}
                          data-testid="input-twilio-token"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestApiConnection('Twilio')}
                        disabled={isLoading}
                        data-testid="button-test-twilio"
                      >
                        Test Connection
                      </Button>
                    </div>

                    {/* Property Lookup APIs */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Property Lookup Services</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          type={showApiKeys ? "text" : "password"}
                          placeholder="ATTOM API Key"
                          value={apiSettings.attomApiKey}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, attomApiKey: e.target.value }))}
                          data-testid="input-attom-key"
                        />
                        <Input
                          type={showApiKeys ? "text" : "password"}
                          placeholder="LocationIQ API Key"
                          value={apiSettings.locationiqKey}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, locationiqKey: e.target.value }))}
                          data-testid="input-locationiq-key"
                        />
                      </div>
                    </div>

                    {/* Weather APIs */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Weather Services</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          type={showApiKeys ? "text" : "password"}
                          placeholder="NWS API Key (Optional)"
                          value={apiSettings.nwsApiKey}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, nwsApiKey: e.target.value }))}
                          data-testid="input-nws-key"
                        />
                        <Input
                          type={showApiKeys ? "text" : "password"}
                          placeholder="SPC API Key (Optional)"
                          value={apiSettings.spcApiKey}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, spcApiKey: e.target.value }))}
                          data-testid="input-spc-key"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="system" className="space-y-6">
                <Card data-testid="card-system-settings">
                  <CardHeader>
                    <CardTitle>System Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Automatic Backups</h4>
                          <p className="text-sm text-gray-600">Automatically backup your data and settings</p>
                        </div>
                        <Switch
                          checked={systemSettings.autoBackup}
                          onCheckedChange={(checked) => 
                            setSystemSettings(prev => ({ ...prev, autoBackup: checked }))
                          }
                          data-testid="switch-auto-backup"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Debug Mode</h4>
                          <p className="text-sm text-gray-600">Enable detailed logging for troubleshooting</p>
                        </div>
                        <Switch
                          checked={systemSettings.debugMode}
                          onCheckedChange={(checked) => 
                            setSystemSettings(prev => ({ ...prev, debugMode: checked }))
                          }
                          data-testid="switch-debug-mode"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Performance Monitoring</h4>
                          <p className="text-sm text-gray-600">Monitor system performance and usage</p>
                        </div>
                        <Switch
                          checked={systemSettings.performanceMonitoring}
                          onCheckedChange={(checked) => 
                            setSystemSettings(prev => ({ ...prev, performanceMonitoring: checked }))
                          }
                          data-testid="switch-performance-monitoring"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Backup Frequency</label>
                        <select
                          value={systemSettings.backupFrequency}
                          onChange={(e) => setSystemSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          data-testid="select-backup-frequency"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Data Retention (years)</label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={systemSettings.dataRetention}
                          onChange={(e) => setSystemSettings(prev => ({ ...prev, dataRetention: e.target.value }))}
                          data-testid="input-data-retention"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Data Management */}
                <Card data-testid="card-data-management">
                  <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium">Export Data</h4>
                        <p className="text-sm text-gray-600">Export all your data in JSON or CSV format</p>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" data-testid="button-export-json">
                            <Download className="w-4 h-4 mr-2" />
                            Export JSON
                          </Button>
                          <Button variant="outline" size="sm" data-testid="button-export-csv">
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium">Import Data</h4>
                        <p className="text-sm text-gray-600">Import data from backup files</p>
                        <Button variant="outline" size="sm" data-testid="button-import-data">
                          <Upload className="w-4 h-4 mr-2" />
                          Import Data
                        </Button>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                        <div>
                          <h4 className="font-medium text-yellow-800">Data Backup Recommended</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Regular backups ensure your data is safe. Last backup: 3 days ago
                          </p>
                          <Button size="sm" className="mt-2 bg-yellow-600 hover:bg-yellow-700" data-testid="button-backup-now">
                            Backup Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card data-testid="card-security-settings">
                  <CardHeader>
                    <CardTitle>Security & Privacy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Password & Authentication</h4>
                      
                      <Button variant="outline" data-testid="button-change-password">
                        <Shield className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Privacy Settings</h4>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Analytics Tracking</h4>
                          <p className="text-sm text-gray-600">Help improve the platform by sharing usage data</p>
                        </div>
                        <Switch
                          checked={systemSettings.analyticsTracking}
                          onCheckedChange={(checked) => 
                            setSystemSettings(prev => ({ ...prev, analyticsTracking: checked }))
                          }
                          data-testid="switch-analytics-tracking"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Crash Reporting</h4>
                          <p className="text-sm text-gray-600">Automatically send crash reports to help fix issues</p>
                        </div>
                        <Switch
                          checked={systemSettings.crashReporting}
                          onCheckedChange={(checked) => 
                            setSystemSettings(prev => ({ ...prev, crashReporting: checked }))
                          }
                          data-testid="switch-crash-reporting"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Session Management</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Active Sessions</p>
                            <p className="text-xs text-gray-500">2 active sessions detected</p>
                          </div>
                          <Button variant="outline" size="sm" data-testid="button-manage-sessions">
                            Manage Sessions
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
                        <div>
                          <h4 className="font-medium text-red-800">Danger Zone</h4>
                          <p className="text-sm text-red-700 mt-1">
                            Irreversible actions that will permanently affect your account
                          </p>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="mt-2"
                            data-testid="button-delete-account"
                          >
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
