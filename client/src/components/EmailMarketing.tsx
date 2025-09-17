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
  Plus, Trash2, Edit, Eye, Copy, Settings, Save, Send,
  Mail, MailOpen, MailCheck, MailX, Users, Clock,
  TrendingUp, BarChart3, Target, Zap, Calendar,
  PlayCircle, PauseCircle, StopCircle, RefreshCw,
  Download, Upload, Filter, Search, Image,
  Bold, Italic, Underline, Link2, List, Quote,
  Palette, Type, Layout, Smartphone, Monitor,
  Star, ThumbsUp, ThumbsDown, AlertTriangle,
  CheckCircle, XCircle, Timer, DollarSign,
  Activity, Bell, Sparkles, Globe, Building, X
} from 'lucide-react';
import { FadeIn, SlideIn, ScaleIn, HoverLift } from '@/components/ui/animations';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  previewText: string;
  htmlContent: string;
  textContent: string;
  thumbnailUrl?: string;
  category: 'welcome' | 'nurture' | 'promotion' | 'transactional' | 'follow_up';
  isActive: boolean;
  createdAt: Date;
  lastModified: Date;
}

interface EmailCampaign {
  id: string;
  name: string;
  description: string;
  type: 'broadcast' | 'drip' | 'automation' | 'ab_test';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  templateId: string;
  audienceSegments: string[];
  schedule: {
    sendDate?: Date;
    sendTime?: string;
    timezone: string;
    sendImmediately: boolean;
  };
  dripSettings?: {
    sequence: Array<{
      templateId: string;
      delayDays: number;
      delayHours: number;
      conditions?: string[];
    }>;
    triggerEvent: 'signup' | 'purchase' | 'page_visit' | 'form_submit' | 'tag_added';
  };
  abTestSettings?: {
    testType: 'subject' | 'content' | 'send_time';
    variantA: any;
    variantB: any;
    testPercentage: number;
    winnerCriteria: 'open_rate' | 'click_rate' | 'conversion_rate';
  };
  analytics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
    bounced: number;
    revenue: number;
    conversions: number;
  };
  targeting: {
    includeSegments: string[];
    excludeSegments: string[];
    filters: Array<{
      field: string;
      operator: string;
      value: string;
    }>;
  };
  createdAt: Date;
}

interface EmailContact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tags: string[];
  segments: string[];
  source: string;
  subscribeDate: Date;
  lastEmailDate?: Date;
  status: 'subscribed' | 'unsubscribed' | 'bounced' | 'complained';
  engagement: {
    emailsOpened: number;
    emailsClicked: number;
    lastOpenDate?: Date;
    averageOpenRate: number;
  };
  customFields: { [key: string]: any };
}

export default function EmailMarketing() {
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'contacts' | 'analytics'>('campaigns');
  const [viewMode, setViewMode] = useState<'builder' | 'preview' | 'settings'>('builder');
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Mock email templates
  const [templates] = useState<EmailTemplate[]>([
    {
      id: 'TPL001',
      name: 'Storm Damage Assessment Welcome',
      subject: 'Your Storm Damage Assessment - Next Steps',
      previewText: 'Thank you for submitting your storm damage information. Here\'s what happens next...',
      htmlContent: '<h1>Thank you for contacting us!</h1><p>We have received your storm damage assessment and one of our certified contractors will contact you within 2 hours.</p>',
      textContent: 'Thank you for contacting us! We have received your storm damage assessment and one of our certified contractors will contact you within 2 hours.',
      category: 'welcome',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      lastModified: new Date('2024-01-15')
    },
    {
      id: 'TPL002',
      name: 'Emergency Response Follow-up',
      subject: 'Emergency Storm Repair - Status Update',
      previewText: 'Here\'s an update on your emergency storm repair request...',
      htmlContent: '<h1>Emergency Repair Update</h1><p>Our emergency response team has been dispatched to your location. Expected arrival: {{arrival_time}}</p>',
      textContent: 'Emergency Repair Update: Our emergency response team has been dispatched to your location. Expected arrival: {{arrival_time}}',
      category: 'transactional',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      lastModified: new Date('2024-01-15')
    },
    {
      id: 'TPL003',
      name: 'Seasonal Maintenance Reminder',
      subject: 'Prepare Your Property for Storm Season',
      previewText: 'Storm season is approaching. Here are essential maintenance tips to protect your property...',
      htmlContent: '<h1>Storm Season Preparation</h1><p>Storm season is just around the corner. Schedule your pre-storm inspection today to avoid costly damage.</p>',
      textContent: 'Storm season is just around the corner. Schedule your pre-storm inspection today to avoid costly damage.',
      category: 'nurture',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      lastModified: new Date('2024-01-15')
    }
  ]);

  // Mock campaigns
  const [campaigns] = useState<EmailCampaign[]>([
    {
      id: 'CAM001',
      name: 'Emergency Storm Response Sequence',
      description: 'Automated follow-up sequence for emergency storm damage leads',
      type: 'drip',
      status: 'sending',
      templateId: 'TPL001',
      audienceSegments: ['emergency-leads', 'storm-damage'],
      schedule: {
        timezone: 'America/New_York',
        sendImmediately: false
      },
      dripSettings: {
        triggerEvent: 'form_submit',
        sequence: [
          { templateId: 'TPL001', delayDays: 0, delayHours: 0 },
          { templateId: 'TPL002', delayDays: 0, delayHours: 2 },
          { templateId: 'TPL003', delayDays: 1, delayHours: 0 }
        ]
      },
      analytics: {
        sent: 1247,
        delivered: 1198,
        opened: 756,
        clicked: 234,
        unsubscribed: 12,
        bounced: 49,
        revenue: 456789,
        conversions: 89
      },
      targeting: {
        includeSegments: ['emergency-leads'],
        excludeSegments: ['unsubscribed'],
        filters: []
      },
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'CAM002',
      name: 'Seasonal Maintenance Campaign',
      description: 'Quarterly maintenance reminders and service promotions',
      type: 'broadcast',
      status: 'scheduled',
      templateId: 'TPL003',
      audienceSegments: ['existing-customers', 'maintenance-list'],
      schedule: {
        sendDate: new Date('2024-02-01'),
        sendTime: '09:00',
        timezone: 'America/New_York',
        sendImmediately: false
      },
      analytics: {
        sent: 5634,
        delivered: 5456,
        opened: 2789,
        clicked: 567,
        unsubscribed: 23,
        bounced: 178,
        revenue: 234567,
        conversions: 145
      },
      targeting: {
        includeSegments: ['existing-customers'],
        excludeSegments: ['recent-service'],
        filters: []
      },
      createdAt: new Date('2024-01-01')
    }
  ]);

  // Mock contacts
  const [contacts] = useState<EmailContact[]>([
    {
      id: 'CON001',
      email: 'john.smith@email.com',
      firstName: 'John',
      lastName: 'Smith',
      tags: ['storm-damage', 'roofing', 'high-value'],
      segments: ['emergency-leads', 'insurance-claims'],
      source: 'Storm Damage Form',
      subscribeDate: new Date('2024-01-15'),
      lastEmailDate: new Date('2024-01-16'),
      status: 'subscribed',
      engagement: {
        emailsOpened: 8,
        emailsClicked: 3,
        lastOpenDate: new Date('2024-01-16'),
        averageOpenRate: 85.2
      },
      customFields: {
        propertyType: 'Residential',
        damageType: 'Roof',
        insuranceClaim: 'Yes'
      }
    },
    {
      id: 'CON002',
      email: 'sarah.johnson@email.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      tags: ['tree-removal', 'maintenance'],
      segments: ['existing-customers', 'maintenance-list'],
      source: 'Website Contact Form',
      subscribeDate: new Date('2024-01-10'),
      status: 'subscribed',
      engagement: {
        emailsOpened: 12,
        emailsClicked: 6,
        lastOpenDate: new Date('2024-01-14'),
        averageOpenRate: 92.3
      },
      customFields: {
        propertyType: 'Commercial',
        serviceHistory: 'Tree Trimming, Gutter Cleaning'
      }
    }
  ]);

  const addCampaign = useCallback(() => {
    const newCampaign: EmailCampaign = {
      id: `CAM${Date.now()}`,
      name: 'New Campaign',
      description: '',
      type: 'broadcast',
      status: 'draft',
      templateId: templates[0]?.id || '',
      audienceSegments: [],
      schedule: {
        timezone: 'America/New_York',
        sendImmediately: false
      },
      analytics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        unsubscribed: 0,
        bounced: 0,
        revenue: 0,
        conversions: 0
      },
      targeting: {
        includeSegments: [],
        excludeSegments: [],
        filters: []
      },
      createdAt: new Date()
    };
    setEditingCampaign(newCampaign);
  }, [templates]);

  const addTemplate = useCallback(() => {
    const newTemplate: EmailTemplate = {
      id: `TPL${Date.now()}`,
      name: 'New Template',
      subject: '',
      previewText: '',
      htmlContent: '',
      textContent: '',
      category: 'nurture',
      isActive: true,
      createdAt: new Date(),
      lastModified: new Date()
    };
    setEditingTemplate(newTemplate);
    setShowEditor(true);
  }, []);

  const saveCampaign = useCallback((campaign: EmailCampaign) => {
    console.log('Saving campaign:', campaign);
    setEditingCampaign(null);
  }, []);

  const saveTemplate = useCallback((template: EmailTemplate) => {
    console.log('Saving template:', template);
    setEditingTemplate(null);
    setShowEditor(false);
  }, []);

  const deleteCampaign = useCallback((campaignId: string) => {
    console.log('Deleting campaign:', campaignId);
  }, []);

  const deleteTemplate = useCallback((templateId: string) => {
    console.log('Deleting template:', templateId);
  }, []);

  if (!activeTab) {
    setActiveTab('campaigns');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Marketing</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Create and send targeted email campaigns to nurture leads and customers</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" data-testid="button-import-contacts">
            <Upload className="w-4 h-4 mr-2" />
            Import Contacts
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={addCampaign} data-testid="button-create-campaign">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">Templates</TabsTrigger>
          <TabsTrigger value="contacts" data-testid="tab-contacts">Contacts</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
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
                        <Badge variant={
                          campaign.status === 'sending' ? 'default' :
                          campaign.status === 'scheduled' ? 'secondary' :
                          campaign.status === 'sent' ? 'outline' : 'secondary'
                        }>
                          {campaign.status}
                        </Badge>
                        <Badge variant="outline">
                          {campaign.type}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Sent</span>
                        <span className="font-semibold text-blue-600">{campaign.analytics.sent.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Open Rate</span>
                        <span className="font-semibold text-green-600">
                          {campaign.analytics.sent > 0 ? ((campaign.analytics.opened / campaign.analytics.sent) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Click Rate</span>
                        <span className="font-semibold text-purple-600">
                          {campaign.analytics.sent > 0 ? ((campaign.analytics.clicked / campaign.analytics.sent) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                        <span className="font-semibold text-green-600">
                          ${(campaign.analytics.revenue / 1000).toFixed(0)}k
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Email Templates</h2>
            <Button onClick={addTemplate} data-testid="button-add-template">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="cursor-pointer"
                data-testid={`card-template-${template.id}`}
              >
                <Card className="h-full border-2 hover:border-blue-300 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold">{template.name}</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{template.subject}</p>
                      </div>
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded border flex items-center justify-center">
                        <Mail className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">{template.category}</Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {template.lastModified.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTemplate(template);
                            setShowEditor(true);
                          }}
                          data-testid={`button-edit-template-${template.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-preview-template-${template.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-duplicate-template-${template.id}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-delete-template-${template.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Email Contacts</CardTitle>
                <div className="flex items-center space-x-2">
                  <Input placeholder="Search contacts..." className="w-64" data-testid="input-search-contacts" />
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Contacts</SelectItem>
                      <SelectItem value="subscribed">Subscribed</SelectItem>
                      <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                      <SelectItem value="bounced">Bounced</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" data-testid="button-export-contacts">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium">Contact</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Segments</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Engagement</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Source</th>
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
                            <div className="text-sm text-gray-600 dark:text-gray-400">{contact.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {contact.segments.map((segment) => (
                              <Badge key={segment} variant="outline" className="text-xs">
                                {segment}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={
                            contact.status === 'subscribed' ? 'default' : 
                            contact.status === 'unsubscribed' ? 'destructive' : 'secondary'
                          }>
                            {contact.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div>{contact.engagement.averageOpenRate.toFixed(1)}% open rate</div>
                            <div className="text-gray-600">{contact.engagement.emailsOpened} opens</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{contact.source}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" data-testid={`button-edit-contact-${contact.id}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" data-testid={`button-email-contact-${contact.id}`}>
                              <Mail className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Sent</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 mt-2">
                  {campaigns.reduce((sum, camp) => sum + camp.analytics.sent, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MailOpen className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Open Rate</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  {campaigns.length > 0 ? (
                    (campaigns.reduce((sum, camp) => sum + camp.analytics.opened, 0) /
                    campaigns.reduce((sum, camp) => sum + camp.analytics.sent, 0) * 100).toFixed(1)
                  ) : 0}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Click Rate</span>
                </div>
                <div className="text-2xl font-bold text-purple-600 mt-2">
                  {campaigns.length > 0 ? (
                    (campaigns.reduce((sum, camp) => sum + camp.analytics.clicked, 0) /
                    campaigns.reduce((sum, camp) => sum + camp.analytics.sent, 0) * 100).toFixed(1)
                  ) : 0}%
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
                  ${(campaigns.reduce((sum, camp) => sum + camp.analytics.revenue, 0) / 1000).toFixed(0)}k
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Campaign Editor Modal */}
      {editingCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingCampaign.id.startsWith('CAM') && campaigns.find(c => c.id === editingCampaign.id) ? 'Edit' : 'Create'} Campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    <Input
                      id="campaign-name"
                      value={editingCampaign.name}
                      onChange={(e) => setEditingCampaign(prev => prev ? {...prev, name: e.target.value} : null)}
                      placeholder="Enter campaign name"
                      data-testid="input-campaign-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="campaign-description">Description</Label>
                    <Textarea
                      id="campaign-description"
                      value={editingCampaign.description}
                      onChange={(e) => setEditingCampaign(prev => prev ? {...prev, description: e.target.value} : null)}
                      placeholder="Enter campaign description"
                      data-testid="textarea-campaign-description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="campaign-type">Campaign Type</Label>
                    <Select 
                      value={editingCampaign.type} 
                      onValueChange={(value) => setEditingCampaign(prev => prev ? {...prev, type: value as any} : null)}
                      data-testid="select-campaign-type"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="broadcast">Broadcast</SelectItem>
                        <SelectItem value="drip">Drip Sequence</SelectItem>
                        <SelectItem value="automation">Automation</SelectItem>
                        <SelectItem value="ab_test">A/B Test</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template-select">Email Template</Label>
                    <Select 
                      value={editingCampaign.templateId}
                      onValueChange={(value) => setEditingCampaign(prev => prev ? {...prev, templateId: value} : null)}
                      data-testid="select-template"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="send-date">Send Date</Label>
                    <Input
                      id="send-date"
                      type="date"
                      value={editingCampaign.schedule.sendDate?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setEditingCampaign(prev => prev ? {
                        ...prev, 
                        schedule: {...prev.schedule, sendDate: new Date(e.target.value)}
                      } : null)}
                      data-testid="input-send-date"
                    />
                  </div>

                  <div>
                    <Label htmlFor="send-time">Send Time</Label>
                    <Input
                      id="send-time"
                      type="time"
                      value={editingCampaign.schedule.sendTime || ''}
                      onChange={(e) => setEditingCampaign(prev => prev ? {
                        ...prev, 
                        schedule: {...prev.schedule, sendTime: e.target.value}
                      } : null)}
                      data-testid="input-send-time"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingCampaign(null)}
                  data-testid="button-cancel-campaign"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => editingCampaign && saveCampaign(editingCampaign)}
                  data-testid="button-save-campaign"
                >
                  Save Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Template Editor Modal */}
      {showEditor && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Email Template Editor</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setShowEditor(false)}
                  data-testid="button-close-editor"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate(prev => prev ? {...prev, name: e.target.value} : null)}
                      placeholder="Enter template name"
                      data-testid="input-template-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email-subject">Subject Line</Label>
                    <Input
                      id="email-subject"
                      value={editingTemplate.subject}
                      onChange={(e) => setEditingTemplate(prev => prev ? {...prev, subject: e.target.value} : null)}
                      placeholder="Enter email subject"
                      data-testid="input-email-subject"
                    />
                  </div>

                  <div>
                    <Label htmlFor="preview-text">Preview Text</Label>
                    <Input
                      id="preview-text"
                      value={editingTemplate.previewText}
                      onChange={(e) => setEditingTemplate(prev => prev ? {...prev, previewText: e.target.value} : null)}
                      placeholder="Preview text shown in inbox"
                      data-testid="input-preview-text"
                    />
                  </div>

                  <div>
                    <Label htmlFor="template-category">Category</Label>
                    <Select 
                      value={editingTemplate.category}
                      onValueChange={(value) => setEditingTemplate(prev => prev ? {...prev, category: value as any} : null)}
                      data-testid="select-template-category"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="welcome">Welcome</SelectItem>
                        <SelectItem value="nurture">Nurture</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                        <SelectItem value="transactional">Transactional</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="html-content">HTML Content</Label>
                    <Textarea
                      id="html-content"
                      value={editingTemplate.htmlContent}
                      onChange={(e) => setEditingTemplate(prev => prev ? {...prev, htmlContent: e.target.value} : null)}
                      placeholder="Enter HTML email content"
                      rows={8}
                      data-testid="textarea-html-content"
                    />
                  </div>

                  <div>
                    <Label htmlFor="text-content">Text Content</Label>
                    <Textarea
                      id="text-content"
                      value={editingTemplate.textContent}
                      onChange={(e) => setEditingTemplate(prev => prev ? {...prev, textContent: e.target.value} : null)}
                      placeholder="Enter plain text version"
                      rows={4}
                      data-testid="textarea-text-content"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditor(false)}
                  data-testid="button-cancel-template"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => editingTemplate && saveTemplate(editingTemplate)}
                  data-testid="button-save-template"
                >
                  Save Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}