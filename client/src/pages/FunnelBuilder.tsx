import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, Trash2, Edit, Eye, Play, Copy, Settings, Zap,
  ArrowDown, ArrowUp, MousePointer, FormInput, Calendar,
  MessageSquare, Video, CheckCircle, BarChart3, Palette,
  Monitor, Smartphone, Tablet, Target, TrendingUp, Users,
  Clock, DollarSign, ChevronRight, Layers, Move, Save
} from 'lucide-react';
import { FadeIn, SlideIn, ScaleIn, HoverLift } from '@/components/ui/animations';

interface FunnelStep {
  id: string;
  name: string;
  stepType: 'landing' | 'form' | 'survey' | 'calendar' | 'video' | 'thank_you';
  headline: string;
  subheadline?: string;
  bodyContent?: string;
  mediaUrl?: string;
  buttonText: string;
  autoAdvance: boolean;
  advanceDelay: number;
  views: number;
  completions: number;
  dropOffs: number;
}

interface Funnel {
  id: string;
  name: string;
  description: string;
  slug: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  theme: 'storm' | 'modern' | 'classic';
  primaryColor: string;
  views: number;
  uniqueVisitors: number;
  conversionRate: number;
  steps: FunnelStep[];
}

export default function FunnelBuilder() {
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [viewMode, setViewMode] = useState<'builder' | 'preview'>('builder');
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isCreating, setIsCreating] = useState(false);

  // Mock funnel data
  const [funnels] = useState<Funnel[]>([
    {
      id: 'F001',
      name: 'Storm Damage Lead Capture',
      description: 'Multi-step funnel to capture leads from storm damage victims',
      slug: 'storm-damage-leads',
      status: 'active',
      theme: 'storm',
      primaryColor: '#1e40af',
      views: 2847,
      uniqueVisitors: 1923,
      conversionRate: 23.5,
      steps: [
        {
          id: 'S001',
          name: 'Landing Page',
          stepType: 'landing',
          headline: 'Storm Damage? Get Professional Help Fast',
          subheadline: 'Licensed contractors ready to restore your property',
          bodyContent: 'Our network of trusted contractors specializes in storm damage repair...',
          buttonText: 'Get Free Assessment',
          autoAdvance: false,
          advanceDelay: 0,
          views: 2847,
          completions: 2156,
          dropOffs: 691
        },
        {
          id: 'S002',
          name: 'Contact Information',
          stepType: 'form',
          headline: 'Tell Us About Your Property',
          buttonText: 'Continue',
          autoAdvance: false,
          advanceDelay: 0,
          views: 2156,
          completions: 1847,
          dropOffs: 309
        },
        {
          id: 'S003',
          name: 'Schedule Assessment',
          stepType: 'calendar',
          headline: 'Book Your Free Assessment',
          buttonText: 'Confirm Appointment',
          autoAdvance: false,
          advanceDelay: 0,
          views: 1847,
          completions: 1234,
          dropOffs: 613
        },
        {
          id: 'S004',
          name: 'Thank You',
          stepType: 'thank_you',
          headline: 'Assessment Scheduled!',
          subheadline: 'A contractor will contact you within 30 minutes',
          buttonText: 'View Details',
          autoAdvance: true,
          advanceDelay: 10,
          views: 1234,
          completions: 1234,
          dropOffs: 0
        }
      ]
    },
    {
      id: 'F002',
      name: 'Roofing Services Funnel',
      description: 'Targeted funnel for roofing damage and repairs',
      slug: 'roofing-services',
      status: 'draft',
      theme: 'modern',
      primaryColor: '#059669',
      views: 0,
      uniqueVisitors: 0,
      conversionRate: 0,
      steps: []
    }
  ]);

  const stepTypeIcons = {
    landing: MousePointer,
    form: FormInput,
    survey: MessageSquare,
    calendar: Calendar,
    video: Video,
    thank_you: CheckCircle
  };

  const getStepTypeColor = (type: FunnelStep['stepType']) => {
    const colors = {
      landing: 'bg-blue-500',
      form: 'bg-green-500',
      survey: 'bg-purple-500',
      calendar: 'bg-orange-500',
      video: 'bg-red-500',
      thank_you: 'bg-emerald-500'
    };
    return colors[type];
  };

  const createNewFunnel = () => {
    setIsCreating(true);
    // Implementation for creating new funnel
  };

  const editStep = (step: FunnelStep) => {
    console.log('Editing step:', step);
    // Implementation for editing step
  };

  const addStep = () => {
    console.log('Adding new step');
    // Implementation for adding new step
  };

  const deleteStep = (stepId: string) => {
    console.log('Deleting step:', stepId);
    // Implementation for deleting step
  };

  const previewFunnel = () => {
    setViewMode('preview');
  };

  const publishFunnel = () => {
    console.log('Publishing funnel');
    // Implementation for publishing funnel
  };

  return (
    <div className="space-y-6" data-testid="funnel-builder">
      {/* Header */}
      <FadeIn>
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-blue-900 dark:from-indigo-800 dark:via-purple-800 dark:to-blue-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <ScaleIn>
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Target className="h-8 w-8 text-purple-400" />
                  </div>
                </ScaleIn>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Funnel Builder
                  </h1>
                  <p className="text-purple-200">
                    Create high-converting lead capture funnels with drag-and-drop simplicity
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  onClick={createNewFunnel}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-create-funnel"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Funnel
                </Button>
                <Button
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  data-testid="button-templates"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-5 w-5 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white" data-testid="text-total-funnels">
                    {funnels.length}
                  </div>
                  <div className="text-xs text-purple-200">Total Funnels</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <Users className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white" data-testid="text-total-visitors">
                    {funnels.reduce((sum, f) => sum + f.uniqueVisitors, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-purple-200">Unique Visitors</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-5 w-5 text-orange-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white" data-testid="text-avg-conversion">
                    {(funnels.reduce((sum, f) => sum + f.conversionRate, 0) / funnels.length).toFixed(1)}%
                  </div>
                  <div className="text-xs text-purple-200">Avg Conversion</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <Zap className="h-5 w-5 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white" data-testid="text-active-funnels">
                    {funnels.filter(f => f.status === 'active').length}
                  </div>
                  <div className="text-xs text-purple-200">Active Funnels</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-12 gap-6">
        {/* Funnels List */}
        <div className="col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Layers className="h-5 w-5 mr-2" />
                Your Funnels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {funnels.map((funnel) => (
                <motion.div
                  key={funnel.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all ${
                      selectedFunnel?.id === funnel.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedFunnel(funnel)}
                    data-testid={`card-funnel-${funnel.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold truncate">{funnel.name}</h3>
                        <Badge 
                          variant={funnel.status === 'active' ? 'default' : 'secondary'}
                          data-testid={`badge-status-${funnel.id}`}
                        >
                          {funnel.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {funnel.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Visitors: </span>
                          <span className="font-medium" data-testid={`text-visitors-${funnel.id}`}>
                            {funnel.uniqueVisitors.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Conv Rate: </span>
                          <span className="font-medium text-green-600" data-testid={`text-conversion-${funnel.id}`}>
                            {funnel.conversionRate}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Steps: </span>
                          <span className="font-medium" data-testid={`text-steps-${funnel.id}`}>
                            {funnel.steps.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Theme: </span>
                          <span className="font-medium capitalize" data-testid={`text-theme-${funnel.id}`}>
                            {funnel.theme}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            editStep(funnel.steps[0]);
                          }}
                          data-testid={`button-edit-${funnel.id}`}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            previewFunnel();
                          }}
                          data-testid={`button-preview-${funnel.id}`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            publishFunnel();
                          }}
                          data-testid={`button-publish-${funnel.id}`}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Publish
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Funnel Builder/Preview */}
        <div className="col-span-8">
          {selectedFunnel ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    {selectedFunnel.name}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'builder' | 'preview')}>
                      <TabsList>
                        <TabsTrigger value="builder" data-testid="tab-builder">Builder</TabsTrigger>
                        <TabsTrigger value="preview" data-testid="tab-preview">Preview</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    
                    {viewMode === 'preview' && (
                      <div className="flex items-center space-x-1 ml-4">
                        <Button
                          size="sm"
                          variant={devicePreview === 'desktop' ? 'default' : 'ghost'}
                          onClick={() => setDevicePreview('desktop')}
                          data-testid="button-preview-desktop"
                        >
                          <Monitor className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={devicePreview === 'tablet' ? 'default' : 'ghost'}
                          onClick={() => setDevicePreview('tablet')}
                          data-testid="button-preview-tablet"
                        >
                          <Tablet className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={devicePreview === 'mobile' ? 'default' : 'ghost'}
                          onClick={() => setDevicePreview('mobile')}
                          data-testid="button-preview-mobile"
                        >
                          <Smartphone className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <AnimatePresence mode="wait">
                  {viewMode === 'builder' ? (
                    <motion.div
                      key="builder"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Funnel Steps</h3>
                        <Button
                          onClick={addStep}
                          className="bg-blue-600 hover:bg-blue-700"
                          data-testid="button-add-step"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Step
                        </Button>
                      </div>

                      <div className="space-y-4" data-testid="steps-container">
                        {selectedFunnel.steps.map((step, index) => {
                          const StepIcon = stepTypeIcons[step.stepType];
                          
                          return (
                            <motion.div
                              key={step.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <Card className="hover:shadow-md transition-shadow" data-testid={`step-${step.id}`}>
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className="flex items-center space-x-2">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium">
                                          {index + 1}
                                        </div>
                                        <ArrowDown className="h-4 w-4 text-gray-400" />
                                      </div>
                                      
                                      <div className={`p-2 rounded-lg ${getStepTypeColor(step.stepType)} text-white`}>
                                        <StepIcon className="h-4 w-4" />
                                      </div>
                                      
                                      <div className="flex-1">
                                        <h4 className="font-medium">{step.name}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                          {step.stepType.replace('_', ' ')} Step
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4">
                                      <div className="text-right text-sm">
                                        <div className="font-medium" data-testid={`step-views-${step.id}`}>
                                          {step.views.toLocaleString()} views
                                        </div>
                                        <div className="text-gray-500" data-testid={`step-completion-${step.id}`}>
                                          {((step.completions / step.views) * 100).toFixed(1)}% completion
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center space-x-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => editStep(step)}
                                          data-testid={`button-edit-step-${step.id}`}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => deleteStep(step.id)}
                                          data-testid={`button-delete-step-${step.id}`}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          data-testid={`button-move-step-${step.id}`}
                                        >
                                          <Move className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <h5 className="font-medium mb-1">{step.headline}</h5>
                                    {step.subheadline && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        {step.subheadline}
                                      </p>
                                    )}
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                      <span>Button: "{step.buttonText}"</span>
                                      {step.autoAdvance && (
                                        <span className="flex items-center">
                                          <Clock className="h-3 w-3 mr-1" />
                                          Auto-advance in {step.advanceDelay}s
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                              
                              {index < selectedFunnel.steps.length - 1 && (
                                <div className="flex justify-center py-2">
                                  <ArrowDown className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"
                      data-testid="funnel-preview"
                    >
                      <div className="text-center">
                        <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Funnel Preview
                        </h3>
                        <p className="text-sm text-gray-500">
                          Preview mode for {devicePreview} devices
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Select a Funnel
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Choose a funnel from the list to start building or editing
                </p>
                <Button
                  onClick={createNewFunnel}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-create-first-funnel"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Funnel
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}