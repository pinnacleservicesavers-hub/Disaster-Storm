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
  Plus, Trash2, Edit, Eye, Copy, Settings, Save, Zap,
  MessageSquare, Smartphone, Hash, Send, Users, 
  TrendingUp, BarChart3, Clock, Target, AlertTriangle,
  PlayCircle, PauseCircle, StopCircle, Calendar,
  Download, Upload, Filter, Search, RefreshCw,
  QrCode, Link2, Share2, Megaphone, Bell,
  CheckCircle, XCircle, Timer, DollarSign, Star
} from 'lucide-react';
import { FadeIn, SlideIn, ScaleIn, HoverLift } from '@/components/ui/animations';

interface SmsKeyword {
  id: string;
  keyword: string;
  description: string;
  autoReply: string;
  phoneNumber: string;
  isActive: boolean;
  tags: string[];
  leadValue: number;
  createdAt: Date;
  responseCount: number;
  conversionRate: number;
}

interface SmsCampaign {
  id: string;
  name: string;
  description: string;
  type: 'opt_in' | 'broadcast' | 'drip' | 'nurture';
  status: 'draft' | 'active' | 'paused' | 'completed';
  keywords: SmsKeyword[];
  phoneNumbers: string[];
  autoReplies: {
    welcome: string;
    optOut: string;
    help: string;
    invalid: string;
  };
  schedule: {
    enabled: boolean;
    startDate?: Date;
    endDate?: Date;
    timezone: string;
    businessHoursOnly: boolean;
  };
  compliance: {
    doubleOptIn: boolean;
    optOutInstructions: boolean;
    companyName: string;
    termsUrl?: string;
  };
  analytics: {
    sent: number;
    delivered: number;
    replied: number;
    optOuts: number;
    conversions: number;
    revenue: number;
  };
  integrations: {
    crm: boolean;
    googleAds: boolean;
    facebookAds: boolean;
    email: boolean;
  };
}

interface SmsContact {
  id: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  tags: string[];
  source: string;
  optInKeyword: string;
  optInDate: Date;
  lastActivity: Date;
  totalMessages: number;
  status: 'active' | 'opted_out' | 'bounced';
}

export default function SmsOptInCampaigns() {
  const [selectedCampaign, setSelectedCampaign] = useState<SmsCampaign | null>(null);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'keywords' | 'contacts' | 'analytics'>('campaigns');
  const [viewMode, setViewMode] = useState<'builder' | 'preview' | 'settings'>('builder');
  const [editingKeyword, setEditingKeyword] = useState<SmsKeyword | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);

  // Mock campaign data
  const [campaigns] = useState<SmsCampaign[]>([
    {
      id: 'SMS001',
      name: 'Storm Damage Lead Generation',
      description: 'Capture leads through emergency storm damage keywords',
      type: 'opt_in',
      status: 'active',
      keywords: [
        {
          id: 'KW001',
          keyword: 'STORM',
          description: 'Emergency storm damage assistance',
          autoReply: 'Thanks for reaching out! We provide 24/7 emergency storm damage repairs. A local contractor will call you within 10 minutes. Reply STOP to opt out.',
          phoneNumber: '(555) 123-STORM',
          isActive: true,
          tags: ['emergency', 'storm', 'roofing'],
          leadValue: 2500,
          createdAt: new Date('2024-01-01'),
          responseCount: 234,
          conversionRate: 78.5
        },
        {
          id: 'KW002',
          keyword: 'ROOF',
          description: 'Roofing repairs and estimates',
          autoReply: 'Need roof repairs? We offer free inspections and work with all insurance companies. Text your address for a quick estimate. Reply STOP to opt out.',
          phoneNumber: '(555) 123-ROOF',
          isActive: true,
          tags: ['roofing', 'inspection', 'insurance'],
          leadValue: 1800,
          createdAt: new Date('2024-01-01'),
          responseCount: 156,
          conversionRate: 82.1
        },
        {
          id: 'KW003',
          keyword: 'TREE',
          description: 'Emergency tree removal',
          autoReply: 'Tree blocking your property? Our certified arborists provide emergency tree removal 24/7. Send a photo for priority service. Reply STOP to opt out.',
          phoneNumber: '(555) 123-TREE',
          isActive: true,
          tags: ['tree_removal', 'emergency', 'arborist'],
          leadValue: 1200,
          createdAt: new Date('2024-01-01'),
          responseCount: 89,
          conversionRate: 91.0
        }
      ],
      phoneNumbers: ['(555) 123-STORM', '(555) 123-ROOF', '(555) 123-TREE'],
      autoReplies: {
        welcome: 'Welcome! Thanks for joining our storm damage alert system. We\'ll notify you of severe weather and connect you with local contractors.',
        optOut: 'You have been removed from our SMS list. Reply START to re-subscribe. Thank you!',
        help: 'Text STORM for emergency repairs, ROOF for roofing, TREE for tree removal, or STOP to unsubscribe.',
        invalid: 'Sorry, we didn\'t understand your message. Text HELP for available commands or STOP to unsubscribe.'
      },
      schedule: {
        enabled: true,
        timezone: 'America/New_York',
        businessHoursOnly: false
      },
      compliance: {
        doubleOptIn: true,
        optOutInstructions: true,
        companyName: 'StormOps Contractor Network',
        termsUrl: 'https://stormops.com/terms'
      },
      analytics: {
        sent: 12547,
        delivered: 12234,
        replied: 3456,
        optOuts: 89,
        conversions: 567,
        revenue: 1234567
      },
      integrations: {
        crm: true,
        googleAds: true,
        facebookAds: true,
        email: true
      }
    },
    {
      id: 'SMS002',
      name: 'Home Maintenance Reminders',
      description: 'Seasonal maintenance reminders and service promotions',
      type: 'nurture',
      status: 'active',
      keywords: [
        {
          id: 'KW004',
          keyword: 'MAINTENANCE',
          description: 'Home maintenance reminders',
          autoReply: 'Stay ahead of home repairs! Get seasonal maintenance reminders and priority booking. We\'ll help keep your home in perfect condition year-round.',
          phoneNumber: '(555) 123-HOME',
          isActive: true,
          tags: ['maintenance', 'seasonal', 'preventive'],
          leadValue: 850,
          createdAt: new Date('2024-01-01'),
          responseCount: 456,
          conversionRate: 45.2
        }
      ],
      phoneNumbers: ['(555) 123-HOME'],
      autoReplies: {
        welcome: 'Welcome to our home maintenance program! We\'ll send you seasonal reminders and exclusive offers.',
        optOut: 'You\'ve been removed from maintenance reminders. Reply START to re-subscribe.',
        help: 'Text MAINTENANCE for reminders, INSPECT for inspections, or STOP to unsubscribe.',
        invalid: 'Please text HELP for commands or STOP to unsubscribe.'
      },
      schedule: {
        enabled: true,
        timezone: 'America/New_York',
        businessHoursOnly: true
      },
      compliance: {
        doubleOptIn: true,
        optOutInstructions: true,
        companyName: 'StormOps Contractor Network'
      },
      analytics: {
        sent: 8934,
        delivered: 8756,
        replied: 1234,
        optOuts: 23,
        conversions: 234,
        revenue: 345678
      },
      integrations: {
        crm: true,
        googleAds: false,
        facebookAds: false,
        email: true
      }
    }
  ]);

  // Mock contact data
  const [contacts] = useState<SmsContact[]>([
    {
      id: 'C001',
      phoneNumber: '+1234567890',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@email.com',
      tags: ['storm', 'roofing', 'high-value'],
      source: 'SMS Keyword: STORM',
      optInKeyword: 'STORM',
      optInDate: new Date('2024-01-15'),
      lastActivity: new Date('2024-01-16'),
      totalMessages: 5,
      status: 'active'
    },
    {
      id: 'C002',
      phoneNumber: '+1987654321',
      firstName: 'Sarah',
      lastName: 'Johnson',
      tags: ['tree_removal', 'emergency'],
      source: 'SMS Keyword: TREE',
      optInKeyword: 'TREE',
      optInDate: new Date('2024-01-14'),
      lastActivity: new Date('2024-01-15'),
      totalMessages: 3,
      status: 'active'
    }
  ]);

  const addKeyword = useCallback(() => {
    const newKeyword: SmsKeyword = {
      id: `KW${Date.now()}`,
      keyword: '',
      description: '',
      autoReply: '',
      phoneNumber: '',
      isActive: true,
      tags: [],
      leadValue: 0,
      createdAt: new Date(),
      responseCount: 0,
      conversionRate: 0
    };
    setEditingKeyword(newKeyword);
  }, []);

  const saveKeyword = useCallback((keyword: SmsKeyword) => {
    console.log('Saving keyword:', keyword);
    setEditingKeyword(null);
  }, []);

  const deleteKeyword = useCallback((keywordId: string) => {
    console.log('Deleting keyword:', keywordId);
  }, []);

  const generateQrCode = useCallback((keyword: string) => {
    setShowQrCode(true);
    console.log('Generating QR code for keyword:', keyword);
  }, []);

  if (!selectedCampaign) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SMS Opt-In Campaigns</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Create keyword-driven SMS campaigns to capture leads instantly</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-create-campaign">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="cursor-pointer"
              onClick={() => setSelectedCampaign(campaign)}
              data-testid={`card-campaign-${campaign.id}`}
            >
              <Card className="h-full border-2 hover:border-blue-300 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold">{campaign.name}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{campaign.description}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge variant={campaign.status === 'active' ? "default" : "secondary"}>
                        {campaign.status}
                      </Badge>
                      <Badge variant="outline">
                        {campaign.keywords.length} keywords
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Messages Sent</span>
                      <span className="font-semibold text-blue-600">{campaign.analytics.sent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Conversions</span>
                      <span className="font-semibold text-green-600">{campaign.analytics.conversions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                      <span className="font-semibold text-purple-600">${campaign.analytics.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Reply Rate</span>
                      <span className="font-semibold text-orange-600">
                        {((campaign.analytics.replied / campaign.analytics.sent) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedCampaign(null)}
            className="text-gray-600 hover:text-gray-900"
            data-testid="button-back-campaigns"
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Back to Campaigns
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedCampaign.name}</h1>
            <p className="text-gray-600 dark:text-gray-300">{selectedCampaign.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" data-testid="button-save-campaign">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button 
            variant={selectedCampaign.status === 'active' ? 'destructive' : 'default'}
            data-testid="button-toggle-campaign"
          >
            {selectedCampaign.status === 'active' ? (
              <>
                <PauseCircle className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">Keywords</TabsTrigger>
          <TabsTrigger value="contacts" data-testid="tab-contacts">Contacts</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>SMS Keywords</CardTitle>
                <Button onClick={addKeyword} size="sm" data-testid="button-add-keyword">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Keyword
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedCampaign.keywords.map((keyword) => (
                  <motion.div
                    key={keyword.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 space-y-3"
                    data-testid={`keyword-item-${keyword.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="default" className="font-mono text-lg">
                            #{keyword.keyword}
                          </Badge>
                          <Badge variant={keyword.isActive ? "default" : "secondary"}>
                            {keyword.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">
                            ${keyword.leadValue} avg value
                          </Badge>
                          <Badge variant="outline">
                            {keyword.conversionRate}% conversion
                          </Badge>
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">{keyword.description}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{keyword.phoneNumber}</p>
                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border-l-4 border-blue-500">
                          <p className="text-sm"><strong>Auto-Reply:</strong> {keyword.autoReply}</p>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>{keyword.responseCount} responses</span>
                          <span>•</span>
                          <span>Created {keyword.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => generateQrCode(keyword.keyword)}
                          data-testid={`button-qr-${keyword.id}`}
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingKeyword(keyword)}
                          data-testid={`button-edit-${keyword.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteKeyword(keyword.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-delete-${keyword.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {selectedCampaign.keywords.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No keywords yet. Add your first keyword to start capturing leads.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>SMS Contacts</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" data-testid="button-export-contacts">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-import-contacts">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Input placeholder="Search contacts..." className="flex-1" data-testid="input-search-contacts" />
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Contacts</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="opted_out">Opted Out</SelectItem>
                      <SelectItem value="bounced">Bounced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium">Contact</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Source</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Messages</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Last Activity</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((contact) => (
                        <tr key={contact.id} className="border-t" data-testid={`contact-row-${contact.id}`}>
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium">
                                {contact.firstName && contact.lastName 
                                  ? `${contact.firstName} ${contact.lastName}` 
                                  : 'Unknown Name'
                                }
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{contact.phoneNumber}</div>
                              {contact.email && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">{contact.email}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">{contact.source}</div>
                            <div className="flex items-center space-x-1 mt-1">
                              {contact.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={
                              contact.status === 'active' ? 'default' : 
                              contact.status === 'opted_out' ? 'destructive' : 'secondary'
                            }>
                              {contact.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">{contact.totalMessages}</td>
                          <td className="px-4 py-3 text-sm">{contact.lastActivity.toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" data-testid={`button-message-${contact.id}`}>
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`button-edit-contact-${contact.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Sent</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 mt-2">
                  {selectedCampaign.analytics.sent.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Delivered</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  {selectedCampaign.analytics.delivered.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {((selectedCampaign.analytics.delivered / selectedCampaign.analytics.sent) * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Replied</span>
                </div>
                <div className="text-2xl font-bold text-purple-600 mt-2">
                  {selectedCampaign.analytics.replied.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {((selectedCampaign.analytics.replied / selectedCampaign.analytics.sent) * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium">Opt Outs</span>
                </div>
                <div className="text-2xl font-bold text-red-600 mt-2">
                  {selectedCampaign.analytics.optOuts}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {((selectedCampaign.analytics.optOuts / selectedCampaign.analytics.sent) * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Conversions</span>
                </div>
                <div className="text-2xl font-bold text-orange-600 mt-2">
                  {selectedCampaign.analytics.conversions}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {((selectedCampaign.analytics.conversions / selectedCampaign.analytics.sent) * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Revenue</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  ${(selectedCampaign.analytics.revenue / 1000).toFixed(0)}k
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  ${(selectedCampaign.analytics.revenue / selectedCampaign.analytics.conversions).toFixed(0)} per conversion
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    value={selectedCampaign.name}
                    placeholder="Enter campaign name"
                    data-testid="input-campaign-name"
                  />
                </div>

                <div>
                  <Label htmlFor="campaign-description">Description</Label>
                  <Textarea
                    id="campaign-description"
                    value={selectedCampaign.description}
                    placeholder="Enter campaign description"
                    data-testid="textarea-campaign-description"
                  />
                </div>

                <div>
                  <Label htmlFor="campaign-type">Campaign Type</Label>
                  <Select value={selectedCampaign.type} data-testid="select-campaign-type">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="opt_in">Opt-In Keywords</SelectItem>
                      <SelectItem value="broadcast">Broadcast</SelectItem>
                      <SelectItem value="drip">Drip Campaign</SelectItem>
                      <SelectItem value="nurture">Lead Nurture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="double-opt-in">Double Opt-In</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Require confirmation text</p>
                  </div>
                  <Switch
                    id="double-opt-in"
                    checked={selectedCampaign.compliance.doubleOptIn}
                    data-testid="switch-double-opt-in"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="opt-out-instructions">Opt-Out Instructions</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Include STOP instructions</p>
                  </div>
                  <Switch
                    id="opt-out-instructions"
                    checked={selectedCampaign.compliance.optOutInstructions}
                    data-testid="switch-opt-out-instructions"
                  />
                </div>

                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={selectedCampaign.compliance.companyName}
                    placeholder="Enter company name"
                    data-testid="input-company-name"
                  />
                </div>

                <div>
                  <Label htmlFor="terms-url">Terms & Conditions URL</Label>
                  <Input
                    id="terms-url"
                    value={selectedCampaign.compliance.termsUrl || ''}
                    placeholder="https://example.com/terms"
                    data-testid="input-terms-url"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Keyword Editor Modal */}
      {editingKeyword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Keyword</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="keyword">Keyword</Label>
                <Input
                  id="keyword"
                  value={editingKeyword.keyword}
                  placeholder="Enter keyword (e.g., STORM)"
                  data-testid="input-keyword"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={editingKeyword.description}
                  placeholder="Brief description of this keyword"
                  data-testid="input-keyword-description"
                />
              </div>

              <div>
                <Label htmlFor="phone-number">Phone Number</Label>
                <Input
                  id="phone-number"
                  value={editingKeyword.phoneNumber}
                  placeholder="(555) 123-KEYWORD"
                  data-testid="input-keyword-phone"
                />
              </div>

              <div>
                <Label htmlFor="auto-reply">Auto-Reply Message</Label>
                <Textarea
                  id="auto-reply"
                  value={editingKeyword.autoReply}
                  placeholder="Automatic response when someone texts this keyword"
                  rows={4}
                  data-testid="textarea-auto-reply"
                />
              </div>

              <div>
                <Label htmlFor="lead-value">Average Lead Value ($)</Label>
                <Input
                  id="lead-value"
                  type="number"
                  value={editingKeyword.leadValue}
                  placeholder="0"
                  data-testid="input-lead-value"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={editingKeyword.isActive}
                  data-testid="switch-keyword-active"
                />
                <Label htmlFor="active">Active Keyword</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingKeyword(null)}
                  data-testid="button-cancel-keyword"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => saveKeyword(editingKeyword)}
                  data-testid="button-save-keyword"
                >
                  Save Keyword
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>QR Code for SMS Keyword</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg mx-auto flex items-center justify-center">
                <QrCode className="w-32 h-32 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Scan to text keyword to our SMS number
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowQrCode(false)}
                  data-testid="button-close-qr"
                >
                  Close
                </Button>
                <Button data-testid="button-download-qr">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}