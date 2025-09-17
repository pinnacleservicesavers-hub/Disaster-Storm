import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, Trash2, Edit, Eye, Copy, Settings, Save, Play,
  Phone, PhoneCall, PhoneIncoming, PhoneOutgoing,
  BarChart3, TrendingUp, Clock, MapPin, User,
  Volume2, VolumeX, Download, Upload, Filter,
  Search, RefreshCw, Calendar, Timer, Star,
  AlertTriangle, CheckCircle, XCircle, Hash,
  Headphones, Mic, MicOff, PlayCircle, PauseCircle,
  SkipForward, SkipBack, RotateCcw, ExternalLink,
  Globe, Building, Target, DollarSign, Users,
  Activity, Zap, Bell, Mail, MessageSquare
} from 'lucide-react';
import { FadeIn, SlideIn, ScaleIn, HoverLift } from '@/components/ui/animations';

interface CallTrackingNumber {
  id: string;
  phoneNumber: string;
  displayNumber: string;
  description: string;
  forwardTo: string;
  source: string;
  campaign?: string;
  isActive: boolean;
  whisperMessage?: string;
  recordCalls: boolean;
  voicemailEnabled: boolean;
  businessHours: {
    enabled: boolean;
    timezone: string;
    schedule: { [key: string]: { start: string; end: string; enabled: boolean } };
  };
  analytics: {
    totalCalls: number;
    answeredCalls: number;
    missedCalls: number;
    avgDuration: number; // seconds
    conversionRate: number;
    leadValue: number;
    totalRevenue: number;
  };
  createdAt: Date;
}

interface CallRecord {
  id: string;
  trackingNumberId: string;
  fromNumber: string;
  toNumber: string;
  duration: number; // seconds
  status: 'answered' | 'missed' | 'voicemail' | 'busy' | 'failed';
  timestamp: Date;
  recordingUrl?: string;
  transcript?: string;
  leadStatus: 'new' | 'qualified' | 'converted' | 'lost';
  tags: string[];
  notes?: string;
  followUpRequired: boolean;
  estimatedValue?: number;
  location?: {
    city: string;
    state: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
}

interface CallAnalytics {
  period: 'today' | 'week' | 'month' | 'quarter' | 'year';
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  averageDuration: number;
  conversionRate: number;
  costPerLead: number;
  revenue: number;
  qualifiedLeads: number;
  callsByHour: { hour: number; count: number }[];
  callsBySource: { source: string; count: number; revenue: number }[];
  topPerformingNumbers: CallTrackingNumber[];
}

export default function CallTrackingManager() {
  const [selectedNumber, setSelectedNumber] = useState<CallTrackingNumber | null>(null);
  const [activeTab, setActiveTab] = useState<'numbers' | 'calls' | 'analytics' | 'settings'>('numbers');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [editingNumber, setEditingNumber] = useState<CallTrackingNumber | null>(null);
  const [playingRecord, setPlayingRecord] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  // Mock tracking numbers
  const [trackingNumbers] = useState<CallTrackingNumber[]>([
    {
      id: 'TN001',
      phoneNumber: '+15551234567',
      displayNumber: '(555) 123-4567',
      description: 'Main Storm Damage Hotline',
      forwardTo: '+15559876543',
      source: 'Website Header',
      campaign: 'Emergency Storm Repairs',
      isActive: true,
      whisperMessage: 'Storm damage emergency call',
      recordCalls: true,
      voicemailEnabled: true,
      businessHours: {
        enabled: false, // 24/7 for emergencies
        timezone: 'America/New_York',
        schedule: {
          monday: { start: '00:00', end: '23:59', enabled: true },
          tuesday: { start: '00:00', end: '23:59', enabled: true },
          wednesday: { start: '00:00', end: '23:59', enabled: true },
          thursday: { start: '00:00', end: '23:59', enabled: true },
          friday: { start: '00:00', end: '23:59', enabled: true },
          saturday: { start: '00:00', end: '23:59', enabled: true },
          sunday: { start: '00:00', end: '23:59', enabled: true }
        }
      },
      analytics: {
        totalCalls: 456,
        answeredCalls: 387,
        missedCalls: 69,
        avgDuration: 245,
        conversionRate: 73.2,
        leadValue: 2850,
        totalRevenue: 876540
      },
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'TN002',
      phoneNumber: '+15551234568',
      displayNumber: '(555) 123-4568',
      description: 'Roofing Estimates Line',
      forwardTo: '+15559876544',
      source: 'Google Ads - Roofing',
      campaign: 'Roofing Lead Generation',
      isActive: true,
      whisperMessage: 'Roofing estimate inquiry',
      recordCalls: true,
      voicemailEnabled: true,
      businessHours: {
        enabled: true,
        timezone: 'America/New_York',
        schedule: {
          monday: { start: '08:00', end: '18:00', enabled: true },
          tuesday: { start: '08:00', end: '18:00', enabled: true },
          wednesday: { start: '08:00', end: '18:00', enabled: true },
          thursday: { start: '08:00', end: '18:00', enabled: true },
          friday: { start: '08:00', end: '18:00', enabled: true },
          saturday: { start: '09:00', end: '16:00', enabled: true },
          sunday: { start: '12:00', end: '16:00', enabled: false }
        }
      },
      analytics: {
        totalCalls: 234,
        answeredCalls: 198,
        missedCalls: 36,
        avgDuration: 312,
        conversionRate: 82.5,
        leadValue: 3200,
        totalRevenue: 524800
      },
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'TN003',
      phoneNumber: '+15551234569',
      displayNumber: '(555) 123-4569',
      description: 'Tree Service Emergency',
      forwardTo: '+15559876545',
      source: 'Facebook Ads - Tree Removal',
      campaign: 'Emergency Tree Removal',
      isActive: true,
      whisperMessage: 'Emergency tree removal call',
      recordCalls: true,
      voicemailEnabled: true,
      businessHours: {
        enabled: false, // 24/7 for emergencies
        timezone: 'America/New_York',
        schedule: {
          monday: { start: '00:00', end: '23:59', enabled: true },
          tuesday: { start: '00:00', end: '23:59', enabled: true },
          wednesday: { start: '00:00', end: '23:59', enabled: true },
          thursday: { start: '00:00', end: '23:59', enabled: true },
          friday: { start: '00:00', end: '23:59', enabled: true },
          saturday: { start: '00:00', end: '23:59', enabled: true },
          sunday: { start: '00:00', end: '23:59', enabled: true }
        }
      },
      analytics: {
        totalCalls: 123,
        answeredCalls: 108,
        missedCalls: 15,
        avgDuration: 189,
        conversionRate: 91.2,
        leadValue: 1850,
        totalRevenue: 186420
      },
      createdAt: new Date('2024-01-01')
    }
  ]);

  // Mock call records
  const [callRecords] = useState<CallRecord[]>([
    {
      id: 'CR001',
      trackingNumberId: 'TN001',
      fromNumber: '+15554567890',
      toNumber: '+15551234567',
      duration: 387,
      status: 'answered',
      timestamp: new Date('2024-01-15 14:30:00'),
      recordingUrl: '/recordings/cr001.mp3',
      transcript: 'Caller: Hi, I have severe roof damage from the storm last night...',
      leadStatus: 'qualified',
      tags: ['emergency', 'roofing', 'insurance-claim'],
      notes: 'High priority lead - multiple properties damaged, insurance claim confirmed',
      followUpRequired: true,
      estimatedValue: 15000,
      location: {
        city: 'Tampa',
        state: 'FL',
        country: 'US',
        coordinates: { lat: 27.9506, lng: -82.4572 }
      }
    },
    {
      id: 'CR002',
      trackingNumberId: 'TN002',
      fromNumber: '+15554567891',
      toNumber: '+15551234568',
      duration: 234,
      status: 'answered',
      timestamp: new Date('2024-01-15 13:15:00'),
      recordingUrl: '/recordings/cr002.mp3',
      transcript: 'Caller: I need a quote for roof repair, some shingles came off...',
      leadStatus: 'new',
      tags: ['roofing', 'estimate', 'non-emergency'],
      followUpRequired: false,
      estimatedValue: 5200,
      location: {
        city: 'Orlando',
        state: 'FL',
        country: 'US'
      }
    },
    {
      id: 'CR003',
      trackingNumberId: 'TN001',
      fromNumber: '+15554567892',
      toNumber: '+15551234567',
      duration: 0,
      status: 'missed',
      timestamp: new Date('2024-01-15 12:45:00'),
      leadStatus: 'new',
      tags: ['missed-call'],
      followUpRequired: true,
      location: {
        city: 'Jacksonville',
        state: 'FL',
        country: 'US'
      }
    }
  ]);

  const addTrackingNumber = useCallback(() => {
    const newNumber: CallTrackingNumber = {
      id: `TN${Date.now()}`,
      phoneNumber: '',
      displayNumber: '',
      description: '',
      forwardTo: '',
      source: '',
      isActive: true,
      recordCalls: true,
      voicemailEnabled: true,
      businessHours: {
        enabled: true,
        timezone: 'America/New_York',
        schedule: {
          monday: { start: '09:00', end: '17:00', enabled: true },
          tuesday: { start: '09:00', end: '17:00', enabled: true },
          wednesday: { start: '09:00', end: '17:00', enabled: true },
          thursday: { start: '09:00', end: '17:00', enabled: true },
          friday: { start: '09:00', end: '17:00', enabled: true },
          saturday: { start: '10:00', end: '14:00', enabled: false },
          sunday: { start: '10:00', end: '14:00', enabled: false }
        }
      },
      analytics: {
        totalCalls: 0,
        answeredCalls: 0,
        missedCalls: 0,
        avgDuration: 0,
        conversionRate: 0,
        leadValue: 0,
        totalRevenue: 0
      },
      createdAt: new Date()
    };
    setEditingNumber(newNumber);
  }, []);

  const saveTrackingNumber = useCallback((number: CallTrackingNumber) => {
    console.log('Saving tracking number:', number);
    setEditingNumber(null);
  }, []);

  const deleteTrackingNumber = useCallback((numberId: string) => {
    console.log('Deleting tracking number:', numberId);
  }, []);

  const toggleRecordingPlayback = useCallback((recordId: string) => {
    if (playingRecord === recordId) {
      setPlayingRecord(null);
    } else {
      setPlayingRecord(recordId);
      // In a real app, this would control audio playback
      setTimeout(() => setPlayingRecord(null), 3000); // Auto-stop after 3s for demo
    }
  }, [playingRecord]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Call Tracking</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Track, record, and analyze inbound calls to optimize lead conversion</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" data-testid="button-view-mode">
            <Eye className="w-4 h-4 mr-2" />
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={addTrackingNumber} data-testid="button-add-number">
            <Plus className="w-4 h-4 mr-2" />
            Add Number
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="numbers" data-testid="tab-numbers">Tracking Numbers</TabsTrigger>
          <TabsTrigger value="calls" data-testid="tab-calls">Call Log</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="numbers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trackingNumbers.map((number) => (
              <motion.div
                key={number.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="cursor-pointer"
                onClick={() => setSelectedNumber(number)}
                data-testid={`card-number-${number.id}`}
              >
                <Card className="h-full border-2 hover:border-blue-300 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-mono">{number.displayNumber}</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{number.description}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge variant={number.isActive ? "default" : "secondary"}>
                          {number.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {!number.businessHours.enabled && (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            24/7
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Source</span>
                        <span className="text-sm font-medium">{number.source}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Calls</span>
                        <span className="font-semibold text-blue-600">{number.analytics.totalCalls}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Answer Rate</span>
                        <span className="font-semibold text-green-600">
                          {((number.analytics.answeredCalls / number.analytics.totalCalls) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</span>
                        <span className="font-semibold text-purple-600">
                          {formatDuration(number.analytics.avgDuration)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Conversion</span>
                        <span className="font-semibold text-orange-600">{number.analytics.conversionRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                        <span className="font-semibold text-green-600">
                          ${(number.analytics.totalRevenue / 1000).toFixed(0)}k
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calls" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Calls</CardTitle>
                <div className="flex items-center space-x-2">
                  <Input placeholder="Search calls..." className="w-64" data-testid="input-search-calls" />
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Calls</SelectItem>
                      <SelectItem value="answered">Answered</SelectItem>
                      <SelectItem value="missed">Missed</SelectItem>
                      <SelectItem value="voicemail">Voicemail</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" data-testid="button-export-calls">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {callRecords.map((call) => {
                  const trackingNumber = trackingNumbers.find(n => n.id === call.trackingNumberId);
                  return (
                    <motion.div
                      key={call.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      data-testid={`call-record-${call.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant={
                              call.status === 'answered' ? 'default' : 
                              call.status === 'missed' ? 'destructive' : 'secondary'
                            }>
                              {call.status}
                            </Badge>
                            <Badge variant={
                              call.leadStatus === 'qualified' ? 'default' :
                              call.leadStatus === 'converted' ? 'default' :
                              call.leadStatus === 'lost' ? 'destructive' : 'secondary'
                            }>
                              {call.leadStatus}
                            </Badge>
                            {call.followUpRequired && (
                              <Badge variant="outline" className="text-orange-600 border-orange-300">
                                <Bell className="w-3 h-3 mr-1" />
                                Follow-up
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {formatPhoneNumber(call.fromNumber)}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                → {trackingNumber?.displayNumber}
                              </p>
                              {call.location && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  <MapPin className="w-3 h-3 inline mr-1" />
                                  {call.location.city}, {call.location.state}
                                </p>
                              )}
                            </div>

                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                              <p className="font-medium">{formatDuration(call.duration)}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {call.timestamp.toLocaleTimeString()}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Source</p>
                              <p className="font-medium">{trackingNumber?.source}</p>
                              {call.estimatedValue && (
                                <p className="text-sm text-green-600">
                                  <DollarSign className="w-3 h-3 inline mr-1" />
                                  ${call.estimatedValue.toLocaleString()}
                                </p>
                              )}
                            </div>

                            <div>
                              {call.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {call.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {call.notes && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                              <strong>Notes:</strong> {call.notes}
                            </div>
                          )}

                          {call.transcript && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                              <strong>Transcript:</strong> {call.transcript.substring(0, 100)}...
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {call.recordingUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRecordingPlayback(call.id)}
                              data-testid={`button-play-${call.id}`}
                            >
                              {playingRecord === call.id ? (
                                <PauseCircle className="w-4 h-4" />
                              ) : (
                                <PlayCircle className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCall(call)}
                            data-testid={`button-details-${call.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-callback-${call.id}`}
                          >
                            <PhoneCall className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Calls</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 mt-2">
                  {trackingNumbers.reduce((sum, num) => sum + num.analytics.totalCalls, 0)}
                </div>
                <div className="text-xs text-gray-600 mt-1">This month</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Answer Rate</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  {(
                    (trackingNumbers.reduce((sum, num) => sum + num.analytics.answeredCalls, 0) /
                    trackingNumbers.reduce((sum, num) => sum + num.analytics.totalCalls, 0)) * 100
                  ).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600 mt-1">vs. 84.2% last month</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Avg Duration</span>
                </div>
                <div className="text-2xl font-bold text-purple-600 mt-2">
                  {formatDuration(
                    Math.round(
                      trackingNumbers.reduce((sum, num) => sum + num.analytics.avgDuration, 0) /
                      trackingNumbers.length
                    )
                  )}
                </div>
                <div className="text-xs text-gray-600 mt-1">+15s vs. last month</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Revenue</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  ${(trackingNumbers.reduce((sum, num) => sum + num.analytics.totalRevenue, 0) / 1000).toFixed(0)}k
                </div>
                <div className="text-xs text-gray-600 mt-1">+23% vs. last month</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Numbers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trackingNumbers
                    .sort((a, b) => b.analytics.totalRevenue - a.analytics.totalRevenue)
                    .slice(0, 3)
                    .map((number, index) => (
                      <div key={number.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{number.displayNumber}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{number.source}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            ${(number.analytics.totalRevenue / 1000).toFixed(0)}k
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {number.analytics.totalCalls} calls
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Call Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from(new Set(trackingNumbers.map(n => n.source)))
                    .map(source => {
                      const numbers = trackingNumbers.filter(n => n.source === source);
                      const totalCalls = numbers.reduce((sum, n) => sum + n.analytics.totalCalls, 0);
                      const totalRevenue = numbers.reduce((sum, n) => sum + n.analytics.totalRevenue, 0);
                      return { source, totalCalls, totalRevenue };
                    })
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .map(({ source, totalCalls, totalRevenue }) => (
                      <div key={source} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <div>
                          <div className="font-medium">{source}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{totalCalls} calls</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            ${(totalRevenue / 1000).toFixed(0)}k
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            ${Math.round(totalRevenue / totalCalls)} per call
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Call Tracking Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="global-recording">Global Call Recording</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Record all calls by default</p>
                    </div>
                    <Switch id="global-recording" data-testid="switch-global-recording" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="transcription">Auto Transcription</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Generate call transcripts</p>
                    </div>
                    <Switch id="transcription" data-testid="switch-transcription" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="lead-scoring">AI Lead Scoring</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Automatically score lead quality</p>
                    </div>
                    <Switch id="lead-scoring" data-testid="switch-lead-scoring" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="default-forward">Default Forward Number</Label>
                    <Input
                      id="default-forward"
                      placeholder="+1 (555) 123-4567"
                      data-testid="input-default-forward"
                    />
                  </div>

                  <div>
                    <Label htmlFor="whisper-message">Default Whisper Message</Label>
                    <Input
                      id="whisper-message"
                      placeholder="Lead call from website"
                      data-testid="input-whisper-message"
                    />
                  </div>

                  <div>
                    <Label htmlFor="voicemail-greeting">Voicemail Greeting</Label>
                    <Textarea
                      id="voicemail-greeting"
                      placeholder="Thank you for calling. Please leave a message..."
                      rows={3}
                      data-testid="textarea-voicemail-greeting"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tracking Number Editor Modal */}
      {editingNumber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingNumber.id.startsWith('TN') && editingNumber.phoneNumber ? 'Edit' : 'Add'} Tracking Number
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone-number">Phone Number</Label>
                  <Input
                    id="phone-number"
                    value={editingNumber.phoneNumber}
                    placeholder="+1 (555) 123-4567"
                    data-testid="input-phone-number"
                  />
                </div>

                <div>
                  <Label htmlFor="forward-to">Forward To</Label>
                  <Input
                    id="forward-to"
                    value={editingNumber.forwardTo}
                    placeholder="+1 (555) 987-6543"
                    data-testid="input-forward-to"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="number-description">Description</Label>
                <Input
                  id="number-description"
                  value={editingNumber.description}
                  placeholder="Brief description of this number's purpose"
                  data-testid="input-number-description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source">Source/Campaign</Label>
                  <Input
                    id="source"
                    value={editingNumber.source}
                    placeholder="Google Ads, Website, Facebook, etc."
                    data-testid="input-source"
                  />
                </div>

                <div>
                  <Label htmlFor="whisper">Whisper Message</Label>
                  <Input
                    id="whisper"
                    value={editingNumber.whisperMessage || ''}
                    placeholder="Message played to answerer"
                    data-testid="input-whisper"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={editingNumber.isActive}
                    data-testid="switch-number-active"
                  />
                  <Label htmlFor="active">Active</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="record"
                    checked={editingNumber.recordCalls}
                    data-testid="switch-record-calls"
                  />
                  <Label htmlFor="record">Record Calls</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="voicemail"
                    checked={editingNumber.voicemailEnabled}
                    data-testid="switch-voicemail"
                  />
                  <Label htmlFor="voicemail">Voicemail</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingNumber(null)}
                  data-testid="button-cancel-number"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => saveTrackingNumber(editingNumber)}
                  data-testid="button-save-number"
                >
                  Save Number
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Call Details Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Call Details</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedCall(null)}
                  data-testid="button-close-call-details"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-4">Call Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">From:</span>
                      <span className="font-medium">{formatPhoneNumber(selectedCall.fromNumber)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">To:</span>
                      <span className="font-medium">{formatPhoneNumber(selectedCall.toNumber)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{formatDuration(selectedCall.duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={selectedCall.status === 'answered' ? 'default' : 'destructive'}>
                        {selectedCall.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lead Status:</span>
                      <Badge variant={selectedCall.leadStatus === 'qualified' ? 'default' : 'secondary'}>
                        {selectedCall.leadStatus}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Location & Value</h3>
                  <div className="space-y-3">
                    {selectedCall.location && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">
                          {selectedCall.location.city}, {selectedCall.location.state}
                        </span>
                      </div>
                    )}
                    {selectedCall.estimatedValue && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Est. Value:</span>
                        <span className="font-medium text-green-600">
                          ${selectedCall.estimatedValue.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Follow-up:</span>
                      <Badge variant={selectedCall.followUpRequired ? 'destructive' : 'secondary'}>
                        {selectedCall.followUpRequired ? 'Required' : 'Not Required'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {selectedCall.transcript && (
                <div>
                  <h3 className="font-medium mb-4">Call Transcript</h3>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm">{selectedCall.transcript}</p>
                  </div>
                </div>
              )}

              {selectedCall.notes && (
                <div>
                  <h3 className="font-medium mb-4">Notes</h3>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm">{selectedCall.notes}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" data-testid="button-edit-call">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Notes
                </Button>
                <Button data-testid="button-callback">
                  <PhoneCall className="w-4 h-4 mr-2" />
                  Call Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}