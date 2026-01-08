import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Building,
  Users,
  DollarSign,
  BarChart3,
  Lightbulb,
  FileText,
  ArrowRight,
  Zap
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AssessmentResult {
  id: string;
  businessName: string;
  industry: string;
  overallScore: number;
  gaps: { area: string; severity: 'high' | 'medium' | 'low'; description: string; impact: string }[];
  strengths: { area: string; description: string }[];
  priorities: { rank: number; action: string; timeframe: string; expectedImpact: string }[];
  recommendations: { category: string; recommendation: string; effort: 'low' | 'medium' | 'high'; roi: string }[];
  metrics: { 
    operationalEfficiency: number;
    customerSatisfaction: number;
    financialHealth: number;
    growthPotential: number;
    riskExposure: number;
  };
  aiInsights: string;
  createdAt: string;
}

export default function BusinessAssessment() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('intake');
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    employeeCount: '',
    annualRevenue: '',
    yearsInBusiness: '',
    currentChallenges: '',
    goals: '',
    existingTools: '',
    painPoints: ''
  });
  
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);

  const assessmentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/business-assessment/analyze', data);
      return response.json();
    },
    onSuccess: (data) => {
      setAssessmentResult(data);
      setActiveTab('results');
      toast({
        title: "Assessment Complete",
        description: "Your business assessment has been generated successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Assessment Failed",
        description: error.message || "Failed to generate assessment. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName || !formData.industry) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the business name and industry.",
        variant: "destructive"
      });
      return;
    }
    assessmentMutation.mutate(formData);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'high': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Business Assessment</h1>
            <p className="text-slate-400">AI-powered business diagnosis - Like having Deloitte consultants on demand</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="intake" className="data-[state=active]:bg-purple-600">
              <FileText className="h-4 w-4 mr-2" />
              Business Intake
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-purple-600" disabled={!assessmentResult}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Assessment Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="intake" className="mt-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5 text-purple-400" />
                      Business Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Business Name *</label>
                      <Input
                        placeholder="e.g., ABC Roofing Services"
                        value={formData.businessName}
                        onChange={(e) => setFormData(f => ({ ...f, businessName: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600"
                        data-testid="input-business-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Industry *</label>
                      <Select 
                        value={formData.industry} 
                        onValueChange={(v) => setFormData(f => ({ ...f, industry: v }))}
                      >
                        <SelectTrigger className="bg-slate-700/50 border-slate-600" data-testid="select-industry">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="roofing">Roofing</SelectItem>
                          <SelectItem value="hvac">HVAC</SelectItem>
                          <SelectItem value="plumbing">Plumbing</SelectItem>
                          <SelectItem value="electrical">Electrical</SelectItem>
                          <SelectItem value="general_contractor">General Contractor</SelectItem>
                          <SelectItem value="tree_service">Tree Service</SelectItem>
                          <SelectItem value="painting">Painting</SelectItem>
                          <SelectItem value="landscaping">Landscaping</SelectItem>
                          <SelectItem value="cleaning">Cleaning Services</SelectItem>
                          <SelectItem value="restoration">Restoration</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-400 mb-1 block">Employee Count</label>
                        <Select 
                          value={formData.employeeCount}
                          onValueChange={(v) => setFormData(f => ({ ...f, employeeCount: v }))}
                        >
                          <SelectTrigger className="bg-slate-700/50 border-slate-600">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-5">1-5 employees</SelectItem>
                            <SelectItem value="6-15">6-15 employees</SelectItem>
                            <SelectItem value="16-50">16-50 employees</SelectItem>
                            <SelectItem value="51-100">51-100 employees</SelectItem>
                            <SelectItem value="100+">100+ employees</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400 mb-1 block">Years in Business</label>
                        <Select
                          value={formData.yearsInBusiness}
                          onValueChange={(v) => setFormData(f => ({ ...f, yearsInBusiness: v }))}
                        >
                          <SelectTrigger className="bg-slate-700/50 border-slate-600">
                            <SelectValue placeholder="Select years" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0-1">Less than 1 year</SelectItem>
                            <SelectItem value="1-3">1-3 years</SelectItem>
                            <SelectItem value="3-5">3-5 years</SelectItem>
                            <SelectItem value="5-10">5-10 years</SelectItem>
                            <SelectItem value="10+">10+ years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Annual Revenue Range</label>
                      <Select
                        value={formData.annualRevenue}
                        onValueChange={(v) => setFormData(f => ({ ...f, annualRevenue: v }))}
                      >
                        <SelectTrigger className="bg-slate-700/50 border-slate-600">
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-100k">Under $100K</SelectItem>
                          <SelectItem value="100k-500k">$100K - $500K</SelectItem>
                          <SelectItem value="500k-1m">$500K - $1M</SelectItem>
                          <SelectItem value="1m-5m">$1M - $5M</SelectItem>
                          <SelectItem value="5m+">$5M+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-400" />
                      Goals & Challenges
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Current Challenges</label>
                      <Textarea
                        placeholder="What are the biggest challenges your business faces today?"
                        value={formData.currentChallenges}
                        onChange={(e) => setFormData(f => ({ ...f, currentChallenges: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600 min-h-[80px]"
                        data-testid="textarea-challenges"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Business Goals</label>
                      <Textarea
                        placeholder="What are your main business goals for the next 12 months?"
                        value={formData.goals}
                        onChange={(e) => setFormData(f => ({ ...f, goals: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600 min-h-[80px]"
                        data-testid="textarea-goals"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Pain Points</label>
                      <Textarea
                        placeholder="What processes or areas cause the most frustration?"
                        value={formData.painPoints}
                        onChange={(e) => setFormData(f => ({ ...f, painPoints: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600 min-h-[80px]"
                        data-testid="textarea-pain-points"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Current Tools & Systems</label>
                      <Input
                        placeholder="e.g., QuickBooks, Excel, Paper-based, etc."
                        value={formData.existingTools}
                        onChange={(e) => setFormData(f => ({ ...f, existingTools: e.target.value }))}
                        className="bg-slate-700/50 border-slate-600"
                        data-testid="input-tools"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 flex justify-end">
                <Button 
                  type="submit" 
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  disabled={assessmentMutation.isPending}
                  data-testid="button-analyze"
                >
                  {assessmentMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analyzing Business...
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5 mr-2" />
                      Generate AI Assessment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            {assessmentResult && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Card className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border-purple-500/30 md:col-span-2">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-sm mb-2">Overall Business Score</p>
                        <p className={`text-6xl font-bold ${getScoreColor(assessmentResult.overallScore)}`}>
                          {assessmentResult.overallScore}
                        </p>
                        <p className="text-slate-400 text-sm mt-2">out of 100</p>
                      </div>
                    </CardContent>
                  </Card>

                  {Object.entries(assessmentResult.metrics).map(([key, value]) => (
                    <Card key={key} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="pt-6">
                        <p className="text-slate-400 text-xs mb-1 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <div className="flex items-end gap-2">
                          <p className={`text-2xl font-bold ${getScoreColor(value)}`}>{value}</p>
                          <p className="text-slate-500 text-sm mb-1">/100</p>
                        </div>
                        <Progress value={value} className="mt-2 h-1" />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-red-400">
                        <AlertTriangle className="h-5 w-5" />
                        Identified Gaps
                      </CardTitle>
                      <CardDescription>Areas requiring attention</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {assessmentResult.gaps.map((gap, i) => (
                        <div key={i} className="bg-slate-700/30 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-white">{gap.area}</span>
                            <Badge className={getSeverityColor(gap.severity)}>
                              {gap.severity} priority
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400">{gap.description}</p>
                          <p className="text-xs text-red-400 mt-2">Impact: {gap.impact}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        Current Strengths
                      </CardTitle>
                      <CardDescription>What's working well</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {assessmentResult.strengths.map((strength, i) => (
                        <div key={i} className="bg-slate-700/30 rounded-lg p-4">
                          <span className="font-medium text-white">{strength.area}</span>
                          <p className="text-sm text-slate-400 mt-1">{strength.description}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-yellow-400">
                      <Target className="h-5 w-5" />
                      Priority Action Plan
                    </CardTitle>
                    <CardDescription>Recommended next steps in order of priority</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {assessmentResult.priorities.map((priority, i) => (
                        <div key={i} className="flex items-start gap-4 bg-slate-700/30 rounded-lg p-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold">
                            {priority.rank}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">{priority.action}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="text-slate-400">
                                <span className="text-slate-500">Timeframe:</span> {priority.timeframe}
                              </span>
                              <span className="text-green-400">
                                <span className="text-slate-500">Expected Impact:</span> {priority.expectedImpact}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-slate-500" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-400">
                      <Lightbulb className="h-5 w-5" />
                      Strategic Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {assessmentResult.recommendations.map((rec, i) => (
                        <div key={i} className="bg-slate-700/30 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                              {rec.category}
                            </Badge>
                            <Badge className={getEffortColor(rec.effort)}>
                              {rec.effort} effort
                            </Badge>
                          </div>
                          <p className="text-white text-sm">{rec.recommendation}</p>
                          <p className="text-xs text-green-400 mt-2">ROI: {rec.roi}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-400" />
                      AI Insights Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                      {assessmentResult.aiInsights}
                    </p>
                  </CardContent>
                </Card>

                <div className="flex justify-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('intake')}
                    className="border-slate-600"
                  >
                    New Assessment
                  </Button>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Generate Playbook
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
