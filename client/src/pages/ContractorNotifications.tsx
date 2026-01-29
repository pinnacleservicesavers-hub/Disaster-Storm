import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Bell, 
  BellRing, 
  Settings, 
  TreePine, 
  CloudLightning, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Trash2,
  RefreshCw,
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  Building,
  Filter,
  X
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  data?: string;
  actionUrl?: string;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

interface AlertPreferences {
  id?: string;
  contractorId: string;
  phone: string;
  email: string;
  states: string[];
  cities: string[];
  tradeTypes: string[];
  notifyBySms: boolean;
  notifyByEmail: boolean;
  notifyByPhone: boolean;
  notifyByPush: boolean;
  alertPriorities: string[];
  modules: string[];
  isActive: boolean;
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
];

const MODULES = [
  { id: 'tree_incidents', name: 'Tree Incidents', icon: TreePine },
  { id: 'storm_alerts', name: 'Storm Alerts', icon: CloudLightning },
  { id: 'damage_detection', name: 'Damage Detection', icon: AlertTriangle }
];

const TRADE_TYPES = [
  'tree_service', 'roofing', 'general_contractor', 'hvac', 'plumbing', 
  'electrical', 'restoration', 'landscaping', 'fencing', 'siding'
];

export default function ContractorNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'tree' | 'storm'>('all');
  
  const contractorId = 'contractor-001';

  const { data: notificationsData, isLoading, refetch } = useQuery<{ success: boolean; notifications: Notification[]; unreadCount: number }>({
    queryKey: ['/api/notifications'],
  });

  const { data: preferencesData } = useQuery<{ success: boolean; preferences: AlertPreferences | null }>({
    queryKey: ['/api/contractor-alert-preferences', contractorId],
    queryFn: async () => {
      const response = await fetch(`/api/contractor-alert-preferences/${contractorId}`);
      return response.json();
    }
  });

  const [preferences, setPreferences] = useState<AlertPreferences>({
    contractorId,
    phone: '',
    email: '',
    states: [],
    cities: [],
    tradeTypes: ['tree_service'],
    notifyBySms: true,
    notifyByEmail: true,
    notifyByPhone: false,
    notifyByPush: true,
    alertPriorities: ['immediate', 'high'],
    modules: ['tree_incidents'],
    isActive: true
  });

  const [cityInput, setCityInput] = useState('');

  // Load existing preferences from API
  useEffect(() => {
    if (preferencesData?.preferences) {
      const p = preferencesData.preferences;
      setPreferences({
        ...preferences,
        id: p.id,
        phone: p.phone || '',
        email: p.email || '',
        states: p.states || [],
        cities: p.cities || [],
        tradeTypes: p.tradeTypes || ['tree_service'],
        notifyBySms: p.notifyBySms ?? true,
        notifyByEmail: p.notifyByEmail ?? true,
        notifyByPhone: p.notifyByPhone ?? false,
        notifyByPush: p.notifyByPush ?? true,
        alertPriorities: p.alertPriorities || ['immediate', 'high'],
        modules: p.modules || ['tree_incidents'],
        isActive: p.isActive ?? true
      });
    }
  }, [preferencesData]);

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/notifications/mark-all-read', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({ title: 'All notifications marked as read' });
    }
  });

  const savePreferencesMutation = useMutation({
    mutationFn: async (prefs: AlertPreferences) => {
      return apiRequest('/api/contractor-alert-preferences', {
        method: 'POST',
        body: JSON.stringify(prefs)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractor-alert-preferences'] });
      toast({ title: 'Alert preferences saved', description: 'Your notification settings have been updated.' });
      setShowSettings(false);
    }
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'tree') return n.type === 'tree_incident';
    if (filter === 'storm') return n.type === 'storm_alert';
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'tree_incident': return <TreePine className="h-5 w-5 text-emerald-400" />;
      case 'storm_alert': return <CloudLightning className="h-5 w-5 text-blue-400" />;
      default: return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'immediate': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const toggleState = (stateCode: string) => {
    const newStates = preferences.states.includes(stateCode)
      ? preferences.states.filter(s => s !== stateCode)
      : [...preferences.states, stateCode];
    setPreferences({ ...preferences, states: newStates });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BellRing className="h-8 w-8 text-yellow-400" />
              My Notifications
            </h1>
            <p className="text-slate-400 mt-1">
              Real-time alerts for tree incidents, storms, and opportunities in your areas
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => setShowSettings(true)}
              className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Alert Settings
            </Button>
            <Button 
              onClick={() => refetch()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Unread Count Card */}
        {unreadCount > 0 && (
          <Card className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-yellow-600">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-500/20 p-3 rounded-full">
                  <Bell className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{unreadCount} Unread Notifications</div>
                  <div className="text-yellow-300">New alerts require your attention</div>
                </div>
              </div>
              <Button 
                onClick={() => markAllReadMutation.mutate()}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread' },
            { value: 'tree', label: 'Tree Incidents' },
            { value: 'storm', label: 'Storm Alerts' }
          ].map(f => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              onClick={() => setFilter(f.value as any)}
              className={filter === f.value 
                ? 'bg-blue-600' 
                : 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700'}
              size="sm"
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Notifications List */}
        <Card className="bg-slate-800/80 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Notifications ({filteredNotifications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-400">Loading notifications...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm mt-1">Configure your alert preferences to start receiving notifications</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all ${
                        notification.isRead 
                          ? 'bg-slate-700/30 border-slate-600' 
                          : 'bg-slate-700/70 border-blue-500/50 shadow-lg'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{notification.title}</span>
                            <Badge className={`${getPriorityColor(notification.priority)} text-white text-xs`}>
                              {notification.priority.toUpperCase()}
                            </Badge>
                            {!notification.isRead && (
                              <Badge className="bg-blue-500 text-xs">NEW</Badge>
                            )}
                          </div>
                          <p className="text-slate-300 text-sm mt-1">{notification.message}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            <span>{new Date(notification.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markReadMutation.mutate(notification.id)}
                              className="text-slate-400 hover:text-white"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {notification.actionUrl && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => window.location.href = notification.actionUrl!}
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Alert Preferences
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Contact Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Information
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Phone Number</Label>
                    <Input
                      placeholder="+1 555-123-4567"
                      value={preferences.phone}
                      onChange={(e) => setPreferences({ ...preferences, phone: e.target.value })}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email Address</Label>
                    <Input
                      type="email"
                      placeholder="contractor@email.com"
                      value={preferences.email}
                      onChange={(e) => setPreferences({ ...preferences, email: e.target.value })}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Channels */}
              <div className="space-y-4">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notification Channels
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-400" />
                      <span className="text-white">SMS Text Messages</span>
                    </div>
                    <Switch 
                      checked={preferences.notifyBySms}
                      onCheckedChange={(v) => setPreferences({ ...preferences, notifyBySms: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <span className="text-white">Email Alerts</span>
                    </div>
                    <Switch 
                      checked={preferences.notifyByEmail}
                      onCheckedChange={(v) => setPreferences({ ...preferences, notifyByEmail: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-purple-400" />
                      <span className="text-white">Phone Calls</span>
                    </div>
                    <Switch 
                      checked={preferences.notifyByPhone}
                      onCheckedChange={(v) => setPreferences({ ...preferences, notifyByPhone: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-yellow-400" />
                      <span className="text-white">In-App Push</span>
                    </div>
                    <Switch 
                      checked={preferences.notifyByPush}
                      onCheckedChange={(v) => setPreferences({ ...preferences, notifyByPush: v })}
                    />
                  </div>
                </div>
              </div>

              {/* States Selection */}
              <div className="space-y-4">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Service Areas (States)
                </h4>
                <p className="text-sm text-slate-400">Select the states where you want to receive alerts. Leave empty for all states.</p>
                <ScrollArea className="h-[200px] border border-slate-600 rounded-lg p-2">
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {US_STATES.map((state) => (
                      <div 
                        key={state.code}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                          preferences.states.includes(state.code) 
                            ? 'bg-emerald-600/30 border border-emerald-500' 
                            : 'bg-slate-800 hover:bg-slate-700'
                        }`}
                        onClick={() => toggleState(state.code)}
                      >
                        <Checkbox checked={preferences.states.includes(state.code)} />
                        <span className="text-white text-sm">{state.code}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {preferences.states.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {preferences.states.map(code => (
                      <Badge 
                        key={code} 
                        className="bg-emerald-600 cursor-pointer"
                        onClick={() => toggleState(code)}
                      >
                        {code} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Cities Selection */}
              <div className="space-y-4">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Service Areas (Cities)
                </h4>
                <p className="text-sm text-slate-400">Add specific cities to receive alerts for. Leave empty for all cities in selected states.</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter city name (e.g., Atlanta)"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && cityInput.trim()) {
                        if (!preferences.cities.includes(cityInput.trim())) {
                          setPreferences({ ...preferences, cities: [...preferences.cities, cityInput.trim()] });
                        }
                        setCityInput('');
                      }
                    }}
                    className="bg-slate-800 border-slate-600 text-white flex-1"
                  />
                  <Button
                    onClick={() => {
                      if (cityInput.trim() && !preferences.cities.includes(cityInput.trim())) {
                        setPreferences({ ...preferences, cities: [...preferences.cities, cityInput.trim()] });
                        setCityInput('');
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Add City
                  </Button>
                </div>
                {preferences.cities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {preferences.cities.map(city => (
                      <Badge 
                        key={city} 
                        className="bg-blue-600 cursor-pointer"
                        onClick={() => setPreferences({ 
                          ...preferences, 
                          cities: preferences.cities.filter(c => c !== city) 
                        })}
                      >
                        {city} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Alert Types */}
              <div className="space-y-4">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Alert Types
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  {MODULES.map((module) => {
                    const Icon = module.icon;
                    return (
                      <div 
                        key={module.id}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                          preferences.modules.includes(module.id) 
                            ? 'bg-blue-600/30 border-2 border-blue-500' 
                            : 'bg-slate-800 border-2 border-transparent hover:border-slate-600'
                        }`}
                        onClick={() => {
                          const newModules = preferences.modules.includes(module.id)
                            ? preferences.modules.filter(m => m !== module.id)
                            : [...preferences.modules, module.id];
                          setPreferences({ ...preferences, modules: newModules });
                        }}
                      >
                        <Icon className="h-6 w-6 text-white mb-2" />
                        <div className="text-white font-medium">{module.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Priority Levels */}
              <div className="space-y-4">
                <h4 className="font-semibold text-white">Alert Priority Levels</h4>
                <div className="flex gap-3">
                  {['immediate', 'high', 'medium', 'low'].map((priority) => (
                    <div 
                      key={priority}
                      className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
                        preferences.alertPriorities.includes(priority) 
                          ? 'bg-orange-600' 
                          : 'bg-slate-700'
                      }`}
                      onClick={() => {
                        const newPriorities = preferences.alertPriorities.includes(priority)
                          ? preferences.alertPriorities.filter(p => p !== priority)
                          : [...preferences.alertPriorities, priority];
                        setPreferences({ ...preferences, alertPriorities: newPriorities });
                      }}
                    >
                      <span className="text-white capitalize">{priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowSettings(false)} className="bg-slate-700 text-white">
                Cancel
              </Button>
              <Button 
                onClick={() => savePreferencesMutation.mutate(preferences)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Save Preferences
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
