import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  BookOpen, 
  ClipboardList, 
  Calendar,
  Users,
  CheckCircle2, 
  Loader2,
  Play,
  Clock,
  Target,
  ArrowRight,
  Download,
  FileText,
  Zap,
  AlertCircle,
  ListChecks
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PlaybookPhase {
  name: string;
  duration: string;
  tasks: {
    id: string;
    title: string;
    description: string;
    owner: string;
    priority: 'high' | 'medium' | 'low';
    dependencies: string[];
    deliverables: string[];
    estimatedHours: number;
    completed?: boolean;
  }[];
  milestone: string;
  successCriteria: string[];
}

interface Playbook {
  id: string;
  title: string;
  objective: string;
  totalDuration: string;
  phases: PlaybookPhase[];
  sops: { title: string; steps: string[]; tips: string[] }[];
  riskMitigation: { risk: string; mitigation: string; owner: string }[];
  kpis: { metric: string; target: string; measurementMethod: string }[];
  createdAt: string;
}

export default function ImplementationPlaybooks() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('generator');
  const [formData, setFormData] = useState({
    projectType: '',
    businessContext: '',
    teamSize: '',
    timeline: '',
    constraints: '',
    objectives: ''
  });
  
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const generateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/playbooks/generate', data);
      return response.json();
    },
    onSuccess: (data) => {
      setPlaybook(data);
      setActiveTab('playbook');
      toast({
        title: "Playbook Generated",
        description: "Your implementation playbook has been created successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate playbook. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectType || !formData.objectives) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the project type and objectives.",
        variant: "destructive"
      });
      return;
    }
    generateMutation.mutate(formData);
  };

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const calculateProgress = () => {
    if (!playbook) return 0;
    const totalTasks = playbook.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks.size / totalTasks) * 100);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Implementation Playbooks</h1>
            <p className="text-slate-400">AI-generated execution plans, schedules, and SOPs</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="generator" className="data-[state=active]:bg-emerald-600">
              <Zap className="h-4 w-4 mr-2" />
              Generate Playbook
            </TabsTrigger>
            <TabsTrigger 
              value="playbook" 
              className={`data-[state=active]:bg-emerald-600 ${!playbook ? 'opacity-50' : ''}`}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Execution Plan
            </TabsTrigger>
            <TabsTrigger 
              value="sops" 
              className={`data-[state=active]:bg-emerald-600 ${!playbook ? 'opacity-50' : ''}`}
            >
              <FileText className="h-4 w-4 mr-2" />
              SOPs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="mt-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-emerald-400" />
                      Project Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Project Type *</label>
                      <Select 
                        value={formData.projectType} 
                        onValueChange={(v) => setFormData(f => ({ ...f, projectType: v }))}
                      >
                        <SelectTrigger className="bg-slate-700/50 border-slate-600" data-testid="select-project-type">
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="crm_implementation">CRM Implementation</SelectItem>
                          <SelectItem value="digital_transformation">Digital Transformation</SelectItem>
                          <SelectItem value="process_automation">Process Automation</SelectItem>
                          <SelectItem value="team_expansion">Team Expansion</SelectItem>
                          <SelectItem value="new_service_launch">New Service Launch</SelectItem>
                          <SelectItem value="customer_experience">Customer Experience Improvement</SelectItem>
                          <SelectItem value="operations_optimization">Operations Optimization</SelectItem>
                          <SelectItem value="marketing_campaign">Marketing Campaign</SelectItem>
                          <SelectItem value="compliance_initiative">Compliance Initiative</SelectItem>
                          <SelectItem value="custom">Custom Project</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Objectives *</label>
                      <Textarea
                        placeholder="What are the main objectives of this project?"
                        value={formData.objectives}
                        onChange={(e) => setFormData(f => ({ ...f, objectives: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600 min-h-[100px]"
                        data-testid="textarea-objectives"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Business Context</label>
                      <Textarea
                        placeholder="Describe your business situation and why this project is needed"
                        value={formData.businessContext}
                        onChange={(e) => setFormData(f => ({ ...f, businessContext: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600 min-h-[80px]"
                        data-testid="textarea-context"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-emerald-400" />
                      Resources & Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Team Size</label>
                      <Select 
                        value={formData.teamSize}
                        onValueChange={(v) => setFormData(f => ({ ...f, teamSize: v }))}
                      >
                        <SelectTrigger className="bg-slate-700/50 border-slate-600">
                          <SelectValue placeholder="Select team size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solo">Solo / 1 person</SelectItem>
                          <SelectItem value="small">Small team (2-5)</SelectItem>
                          <SelectItem value="medium">Medium team (6-15)</SelectItem>
                          <SelectItem value="large">Large team (15+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Target Timeline</label>
                      <Select
                        value={formData.timeline}
                        onValueChange={(v) => setFormData(f => ({ ...f, timeline: v }))}
                      >
                        <SelectTrigger className="bg-slate-700/50 border-slate-600">
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2_weeks">2 weeks</SelectItem>
                          <SelectItem value="1_month">1 month</SelectItem>
                          <SelectItem value="3_months">3 months</SelectItem>
                          <SelectItem value="6_months">6 months</SelectItem>
                          <SelectItem value="1_year">1 year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Constraints & Limitations</label>
                      <Textarea
                        placeholder="Any budget constraints, resource limitations, or other considerations?"
                        value={formData.constraints}
                        onChange={(e) => setFormData(f => ({ ...f, constraints: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600 min-h-[80px]"
                        data-testid="textarea-constraints"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 flex justify-end">
                <Button 
                  type="submit" 
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  disabled={generateMutation.isPending}
                  data-testid="button-generate-playbook"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating Playbook...
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-5 w-5 mr-2" />
                      Generate Implementation Playbook
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="playbook" className="mt-6">
            {playbook && (
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-500/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{playbook.title}</CardTitle>
                        <CardDescription className="mt-1">{playbook.objective}</CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Total Duration</p>
                        <p className="text-lg font-semibold text-emerald-400">{playbook.totalDuration}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-400">Overall Progress</span>
                        <span className="text-emerald-400 font-medium">{calculateProgress()}%</span>
                      </div>
                      <Progress value={calculateProgress()} className="h-2" />
                    </div>
                  </CardHeader>
                </Card>

                <Accordion type="multiple" className="space-y-4">
                  {playbook.phases.map((phase, phaseIndex) => (
                    <AccordionItem 
                      key={phaseIndex} 
                      value={`phase-${phaseIndex}`}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-700/30">
                        <div className="flex items-center gap-4 w-full">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                            {phaseIndex + 1}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-white">{phase.name}</p>
                            <p className="text-sm text-slate-400">{phase.duration} • {phase.tasks.length} tasks</p>
                          </div>
                          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                            {phase.milestone}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <div className="space-y-3 mt-2">
                          {phase.tasks.map((task) => (
                            <div 
                              key={task.id}
                              className={`bg-slate-700/30 rounded-lg p-4 transition-all ${
                                completedTasks.has(task.id) ? 'opacity-60' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={completedTasks.has(task.id)}
                                  onCheckedChange={() => toggleTask(task.id)}
                                  className="mt-1"
                                  data-testid={`checkbox-task-${task.id}`}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`font-medium ${completedTasks.has(task.id) ? 'line-through text-slate-500' : 'text-white'}`}>
                                      {task.title}
                                    </span>
                                    <Badge className={getPriorityColor(task.priority)}>
                                      {task.priority}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-slate-400">{task.description}</p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {task.owner}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {task.estimatedHours}h
                                    </span>
                                  </div>
                                  {task.deliverables.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {task.deliverables.map((d, i) => (
                                        <Badge key={i} variant="outline" className="text-xs text-slate-400">
                                          {d}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-700">
                          <p className="text-sm text-slate-400 mb-2">Success Criteria:</p>
                          <ul className="space-y-1">
                            {phase.successCriteria.map((criteria, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                {criteria}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-yellow-400">
                      <AlertCircle className="h-5 w-5" />
                      Risk Mitigation Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {playbook.riskMitigation.map((item, i) => (
                        <div key={i} className="bg-slate-700/30 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-red-400">{item.risk}</p>
                              <p className="text-sm text-slate-400 mt-1">{item.mitigation}</p>
                            </div>
                            <Badge variant="outline" className="text-slate-400">
                              {item.owner}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-400">
                      <Target className="h-5 w-5" />
                      Key Performance Indicators
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {playbook.kpis.map((kpi, i) => (
                        <div key={i} className="bg-slate-700/30 rounded-lg p-4">
                          <p className="font-medium text-white">{kpi.metric}</p>
                          <p className="text-lg text-emerald-400 mt-1">{kpi.target}</p>
                          <p className="text-xs text-slate-500 mt-2">Measured by: {kpi.measurementMethod}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center gap-4">
                  <Button variant="outline" className="border-slate-600">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Play className="h-4 w-4 mr-2" />
                    Start Execution
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sops" className="mt-6">
            {playbook && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {playbook.sops.map((sop, i) => (
                    <Card key={i} className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ListChecks className="h-5 w-5 text-emerald-400" />
                          {sop.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ol className="space-y-2 list-decimal list-inside">
                          {sop.steps.map((step, j) => (
                            <li key={j} className="text-sm text-slate-300">{step}</li>
                          ))}
                        </ol>
                        {sop.tips.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-700">
                            <p className="text-sm font-medium text-yellow-400 mb-2">Pro Tips:</p>
                            <ul className="space-y-1">
                              {sop.tips.map((tip, j) => (
                                <li key={j} className="text-xs text-slate-400 flex items-start gap-2">
                                  <Zap className="h-3 w-3 mt-0.5 text-yellow-400" />
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
