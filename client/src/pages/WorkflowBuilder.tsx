import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, Play, Pause, Edit, Trash2, Plus, Copy, Settings,
  Mail, MessageSquare, Phone, Clock, Tag, User, 
  ArrowDown, ArrowRight, GitBranch, Timer, CheckCircle,
  AlertTriangle, BarChart3, Users, TrendingUp, Activity,
  Bot, Bell, Filter, Workflow, Calendar, Target
} from 'lucide-react';
import { FadeIn, SlideIn, ScaleIn, HoverLift } from '@/components/ui/animations';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

interface WorkflowStep {
  id: string;
  stepName: string;
  stepType: 'email' | 'sms' | 'call' | 'wait' | 'condition' | 'tag_action';
  stepOrder: number;
  actionConfig: any;
  conditions?: any;
  delayAmount?: number;
  delayUnit?: 'minutes' | 'hours' | 'days';
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  triggerType: 'form_submit' | 'tag_added' | 'date_based' | 'behavior_based';
  triggerConditions: any;
  isActive: boolean;
  runOnWeekends: boolean;
  respectBusinessHours: boolean;
  totalEnrollments: number;
  completedRuns: number;
  currentlyActive: number;
  steps: WorkflowStep[];
}

export default function WorkflowBuilder() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [viewMode, setViewMode] = useState<'builder' | 'analytics' | 'settings'>('builder');
  const [isCreating, setIsCreating] = useState(false);

  // Mock workflow data
  const [workflows] = useState<Workflow[]>([
    {
      id: 'W001',
      name: 'New Lead Welcome Series',
      description: 'Automated welcome sequence for new storm damage leads',
      triggerType: 'form_submit',
      triggerConditions: { formId: 'storm_damage_form' },
      isActive: true,
      runOnWeekends: true,
      respectBusinessHours: false,
      totalEnrollments: 234,
      completedRuns: 187,
      currentlyActive: 47,
      steps: [
        {
          id: 'WS001',
          stepName: 'Immediate Confirmation Email',
          stepType: 'email',
          stepOrder: 1,
          actionConfig: {
            templateId: 'welcome_email',
            subject: 'We received your storm damage report',
            delay: 0
          }
        },
        {
          id: 'WS002',
          stepName: 'Wait 30 minutes',
          stepType: 'wait',
          stepOrder: 2,
          delayAmount: 30,
          delayUnit: 'minutes',
          actionConfig: {}
        },
        {
          id: 'WS003',
          stepName: 'Follow-up SMS',
          stepType: 'sms',
          stepOrder: 3,
          actionConfig: {
            message: 'Hi {firstName}, we received your storm damage report. A contractor will contact you within 2 hours.',
            respectBusinessHours: true
          }
        },
        {
          id: 'WS004',
          stepName: 'Check Response',
          stepType: 'condition',
          stepOrder: 4,
          conditions: {
            type: 'response_received',
            timeframe: 4,
            unit: 'hours'
          },
          actionConfig: {}
        },
        {
          id: 'WS005',
          stepName: 'Add Urgent Tag',
          stepType: 'tag_action',
          stepOrder: 5,
          actionConfig: {
            action: 'add',
            tags: ['urgent_follow_up', 'needs_call']
          },
          conditions: {
            ifPath: 'no_response'
          }
        }
      ]
    },
    {
      id: 'W002',
      name: 'Appointment Reminder Sequence',
      description: 'Automated reminders for scheduled appointments',
      triggerType: 'date_based',
      triggerConditions: { beforeAppointment: true },
      isActive: true,
      runOnWeekends: false,
      respectBusinessHours: true,
      totalEnrollments: 89,
      completedRuns: 82,
      currentlyActive: 7,
      steps: [
        {
          id: 'WS101',
          stepName: '24 Hour Email Reminder',
          stepType: 'email',
          stepOrder: 1,
          actionConfig: {
            templateId: 'appointment_reminder_24h',
            sendBefore: 24,
            unit: 'hours'
          }
        },
        {
          id: 'WS102',
          stepName: '2 Hour SMS Reminder',
          stepType: 'sms',
          stepOrder: 2,
          actionConfig: {
            message: 'Reminder: Your appointment with our contractor is in 2 hours. Reply CONFIRM to confirm.',
            sendBefore: 2,
            unit: 'hours'
          }
        }
      ]
    },
    {
      id: 'W003',
      name: 'Lost Lead Re-engagement',
      description: 'Re-engage leads that have gone cold',
      triggerType: 'behavior_based',
      triggerConditions: { noActivityDays: 7 },
      isActive: false,
      runOnWeekends: true,
      respectBusinessHours: true,
      totalEnrollments: 45,
      completedRuns: 23,
      currentlyActive: 0,
      steps: []
    }
  ]);

  const stepTypeIcons = {
    email: Mail,
    sms: MessageSquare,
    call: Phone,
    wait: Timer,
    condition: GitBranch,
    tag_action: Tag
  };

  const getStepTypeColor = (type: WorkflowStep['stepType']) => {
    const colors = {
      email: 'bg-blue-500',
      sms: 'bg-green-500',
      call: 'bg-orange-500',
      wait: 'bg-gray-500',
      condition: 'bg-purple-500',
      tag_action: 'bg-yellow-500'
    };
    return colors[type];
  };

  const getTriggerIcon = (type: Workflow['triggerType']) => {
    switch (type) {
      case 'form_submit': return Target;
      case 'tag_added': return Tag;
      case 'date_based': return Calendar;
      case 'behavior_based': return Activity;
      default: return Zap;
    }
  };

  const createNewWorkflow = () => {
    setIsCreating(true);
    console.log('Creating new workflow');
  };

  const addStep = () => {
    console.log('Adding new step to workflow');
  };

  const editStep = (step: WorkflowStep) => {
    console.log('Editing step:', step);
  };

  const deleteStep = (stepId: string) => {
    console.log('Deleting step:', stepId);
  };

  const toggleWorkflow = (workflowId: string) => {
    console.log('Toggling workflow:', workflowId);
  };

  const duplicateWorkflow = (workflowId: string) => {
    console.log('Duplicating workflow:', workflowId);
  };

  const testWorkflow = (workflowId: string) => {
    console.log('Testing workflow:', workflowId);
  };

  return (
    <div className="space-y-6" data-testid="workflow-builder">
      {/* Header */}
      <FadeIn>
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-pink-900 to-rose-900 dark:from-purple-800 dark:via-pink-800 dark:to-rose-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <ScaleIn>
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Workflow className="h-8 w-8 text-purple-400" />
                  </div>
                </ScaleIn>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Workflow Builder
                  </h1>
                  <p className="text-purple-200">
                    Create automated sequences to nurture leads and streamline communication
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  onClick={createNewWorkflow}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-create-workflow"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Workflow
                </Button>
                <Button
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  data-testid="button-workflow-templates"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <Workflow className="h-5 w-5 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white" data-testid="text-total-workflows">
                    {workflows.length}
                  </div>
                  <div className="text-xs text-purple-200">Total Workflows</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <Play className="h-5 w-5 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white" data-testid="text-active-workflows">
                    {workflows.filter(w => w.isActive).length}
                  </div>
                  <div className="text-xs text-purple-200">Active Workflows</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <Users className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white" data-testid="text-total-enrollments">
                    {workflows.reduce((sum, w) => sum + w.totalEnrollments, 0)}
                  </div>
                  <div className="text-xs text-purple-200">Total Enrollments</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-5 w-5 text-orange-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white" data-testid="text-completion-rate">
                    {Math.round(
                      workflows.reduce((sum, w) => sum + (w.completedRuns / w.totalEnrollments * 100 || 0), 0) / workflows.length
                    )}%
                  </div>
                  <div className="text-xs text-purple-200">Avg Completion Rate</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-12 gap-6">
        {/* Workflows List */}
        <div className="col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Workflow className="h-5 w-5 mr-2" />
                Your Workflows
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workflows.map((workflow) => {
                const TriggerIcon = getTriggerIcon(workflow.triggerType);
                
                return (
                  <motion.div
                    key={workflow.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all ${
                        selectedWorkflow?.id === workflow.id 
                          ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => setSelectedWorkflow(workflow)}
                      data-testid={`card-workflow-${workflow.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold truncate">{workflow.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={workflow.isActive ? 'default' : 'secondary'}
                              data-testid={`badge-status-${workflow.id}`}
                            >
                              {workflow.isActive ? (
                                <><Play className="h-2 w-2 mr-1" /> Active</>
                              ) : (
                                <><Pause className="h-2 w-2 mr-1" /> Paused</>
                              )}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {workflow.description}
                        </p>
                        
                        <div className="flex items-center space-x-2 mb-3">
                          <TriggerIcon className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-500 capitalize">
                            {workflow.triggerType.replace('_', ' ')} trigger
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Steps: </span>
                            <span className="font-medium" data-testid={`text-steps-${workflow.id}`}>
                              {workflow.steps.length}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Enrolled: </span>
                            <span className="font-medium" data-testid={`text-enrolled-${workflow.id}`}>
                              {workflow.totalEnrollments}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Completed: </span>
                            <span className="font-medium text-green-600" data-testid={`text-completed-${workflow.id}`}>
                              {workflow.completedRuns}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Active: </span>
                            <span className="font-medium text-blue-600" data-testid={`text-active-${workflow.id}`}>
                              {workflow.currentlyActive}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWorkflow(workflow.id);
                            }}
                            data-testid={`button-toggle-${workflow.id}`}
                          >
                            {workflow.isActive ? (
                              <><Pause className="h-3 w-3 mr-1" /> Pause</>
                            ) : (
                              <><Play className="h-3 w-3 mr-1" /> Start</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateWorkflow(workflow.id);
                            }}
                            data-testid={`button-duplicate-${workflow.id}`}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Duplicate
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              testWorkflow(workflow.id);
                            }}
                            data-testid={`button-test-${workflow.id}`}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Workflow Builder */}
        <div className="col-span-8">
          {selectedWorkflow ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Workflow className="h-5 w-5 mr-2" />
                    {selectedWorkflow.name}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'builder' | 'analytics' | 'settings')}>
                      <TabsList>
                        <TabsTrigger value="builder" data-testid="tab-builder">Builder</TabsTrigger>
                        <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
                        <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="max-h-96 overflow-y-auto">
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
                        <h3 className="text-lg font-semibold">Workflow Steps</h3>
                        <Button
                          onClick={addStep}
                          className="bg-purple-600 hover:bg-purple-700"
                          data-testid="button-add-step"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Step
                        </Button>
                      </div>

                      <div className="space-y-4" data-testid="workflow-steps-container">
                        {selectedWorkflow.steps.length === 0 ? (
                          <div className="text-center py-12">
                            <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                              No Steps Yet
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                              Add your first step to start building this workflow
                            </p>
                          </div>
                        ) : (
                          selectedWorkflow.steps
                            .sort((a, b) => a.stepOrder - b.stepOrder)
                            .map((step, index) => {
                              const StepIcon = stepTypeIcons[step.stepType];
                              
                              return (
                                <motion.div
                                  key={step.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <Card className="hover:shadow-md transition-shadow" data-testid={`workflow-step-${step.id}`}>
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                          <div className="flex items-center space-x-2">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium">
                                              {index + 1}
                                            </div>
                                            {index < selectedWorkflow.steps.length - 1 && (
                                              <ArrowDown className="h-4 w-4 text-gray-400" />
                                            )}
                                          </div>
                                          
                                          <div className={`p-2 rounded-lg ${getStepTypeColor(step.stepType)} text-white`}>
                                            <StepIcon className="h-4 w-4" />
                                          </div>
                                          
                                          <div className="flex-1">
                                            <h4 className="font-medium">{step.stepName}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                              {step.stepType.replace('_', ' ')} Step
                                            </p>
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
                                        </div>
                                      </div>
                                      
                                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        {step.stepType === 'email' && (
                                          <div>
                                            <div className="text-sm font-medium mb-1">Email Action</div>
                                            <div className="text-xs text-gray-600">
                                              Template: {step.actionConfig.templateId || 'Default'}
                                            </div>
                                            {step.actionConfig.subject && (
                                              <div className="text-xs text-gray-600">
                                                Subject: "{step.actionConfig.subject}"
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        
                                        {step.stepType === 'sms' && (
                                          <div>
                                            <div className="text-sm font-medium mb-1">SMS Message</div>
                                            <div className="text-xs text-gray-600 italic">
                                              "{step.actionConfig.message}"
                                            </div>
                                          </div>
                                        )}
                                        
                                        {step.stepType === 'wait' && step.delayAmount && (
                                          <div>
                                            <div className="text-sm font-medium mb-1">Wait Duration</div>
                                            <div className="flex items-center text-xs text-gray-600">
                                              <Timer className="h-3 w-3 mr-1" />
                                              {step.delayAmount} {step.delayUnit}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {step.stepType === 'condition' && (
                                          <div>
                                            <div className="text-sm font-medium mb-1">Condition Check</div>
                                            <div className="flex items-center text-xs text-gray-600">
                                              <GitBranch className="h-3 w-3 mr-1" />
                                              {step.conditions?.type || 'Custom condition'}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {step.stepType === 'tag_action' && (
                                          <div>
                                            <div className="text-sm font-medium mb-1">Tag Action</div>
                                            <div className="flex items-center space-x-1">
                                              {step.actionConfig.tags?.map((tag: string, idx: number) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                  {tag}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                  
                                  {step.stepType === 'condition' && index < selectedWorkflow.steps.length - 1 && (
                                    <div className="flex justify-center py-2">
                                      <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-1 text-xs text-green-600">
                                          <ArrowRight className="h-3 w-3" />
                                          <span>Yes</span>
                                        </div>
                                        <div className="flex items-center space-x-1 text-xs text-red-600">
                                          <ArrowRight className="h-3 w-3" />
                                          <span>No</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {step.stepType !== 'condition' && index < selectedWorkflow.steps.length - 1 && (
                                    <div className="flex justify-center py-2">
                                      <ArrowDown className="h-5 w-5 text-gray-400" />
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })
                        )}
                      </div>
                    </motion.div>
                  ) : viewMode === 'analytics' ? (
                    <motion.div
                      key="analytics"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                      data-testid="workflow-analytics"
                    >
                      <div className="grid grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold">{selectedWorkflow.totalEnrollments}</div>
                            <div className="text-sm text-gray-600">Total Enrollments</div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4 text-center">
                            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold">{selectedWorkflow.completedRuns}</div>
                            <div className="text-sm text-gray-600">Completed</div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4 text-center">
                            <Activity className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold">{selectedWorkflow.currentlyActive}</div>
                            <div className="text-sm text-gray-600">Currently Active</div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Workflow Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-center">
                              <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">Analytics chart would go here</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                      data-testid="workflow-settings"
                    >
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Workflow Settings</h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Active Workflow</Label>
                              <p className="text-sm text-gray-500">Enable or disable this workflow</p>
                            </div>
                            <Switch checked={selectedWorkflow.isActive} />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Run on Weekends</Label>
                              <p className="text-sm text-gray-500">Allow workflow to run on Saturday and Sunday</p>
                            </div>
                            <Switch checked={selectedWorkflow.runOnWeekends} />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Respect Business Hours</Label>
                              <p className="text-sm text-gray-500">Only send communications during business hours</p>
                            </div>
                            <Switch checked={selectedWorkflow.respectBusinessHours} />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Workflow Name</Label>
                          <Input value={selectedWorkflow.name} />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={selectedWorkflow.description}
                            placeholder="Describe what this workflow does..."
                            rows={3}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Trigger Type</Label>
                          <Select value={selectedWorkflow.triggerType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="form_submit">Form Submission</SelectItem>
                              <SelectItem value="tag_added">Tag Added</SelectItem>
                              <SelectItem value="date_based">Date Based</SelectItem>
                              <SelectItem value="behavior_based">Behavior Based</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Select a Workflow
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Choose a workflow from the list to start building or editing
                </p>
                <Button
                  onClick={createNewWorkflow}
                  className="bg-purple-600 hover:bg-purple-700"
                  data-testid="button-create-first-workflow"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Workflow
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <ModuleAIAssistant 
        moduleName="Workflow Builder"
        moduleContext="Automated marketing workflow creation tool. Evelyn can guide you through building email sequences, SMS campaigns, conditional logic, timing delays, tag-based triggers, and analyzing workflow performance and enrollment metrics."
      />
    </div>
  );
}