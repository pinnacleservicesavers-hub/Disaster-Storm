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
  FormInput, Type, Mail, Phone, CheckSquare, Square,
  Radio, List, Upload, PenTool, Calendar, Star,
  ArrowRight, ArrowDown, Move, GripVertical, Link2,
  Sparkles, Users, TrendingUp, BarChart3, Clock,
  Gauge, ThumbsUp, ThumbsDown, Hash, ChevronRight,
  ToggleLeft, Lightbulb, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { FadeIn, SlideIn, ScaleIn, HoverLift } from '@/components/ui/animations';

interface ConditionalLogic {
  condition: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  targetQuestionId: string;
  value: string;
  action: 'show' | 'hide' | 'skip_to';
  skipToQuestionId?: string;
}

interface SurveyQuestion {
  id: string;
  questionText: string;
  questionType: 'multiple_choice' | 'single_choice' | 'text' | 'rating' | 'yes_no' | 'slider' | 'matrix' | 'ranking';
  questionOrder: number;
  isRequired: boolean;
  helpText?: string;
  options?: string[];
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    minValue?: number;
    maxValue?: number;
  };
  conditionalLogic?: ConditionalLogic[];
  // Rating/Slider specific
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: string[];
  // Matrix specific
  rowOptions?: string[];
  columnOptions?: string[];
}

interface Survey {
  id: string;
  name: string;
  description: string;
  allowMultipleResponses: boolean;
  showProgressBar: boolean;
  randomizeQuestions: boolean;
  thankyouMessage: string;
  redirectUrl?: string;
  questions: SurveyQuestion[];
  responses: number;
  completionRate: number;
  avgTimeToComplete?: number;
}

export default function SurveyBuilder() {
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [viewMode, setViewMode] = useState<'builder' | 'preview' | 'analytics' | 'settings'>('builder');
  const [draggedQuestion, setDraggedQuestion] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);
  const [showLogicBuilder, setShowLogicBuilder] = useState(false);

  // Mock survey data
  const [surveys] = useState<Survey[]>([
    {
      id: 'SURVEY001',
      name: 'Storm Damage Severity Assessment',
      description: 'Smart survey to qualify damage leads and route to appropriate contractors',
      allowMultipleResponses: false,
      showProgressBar: true,
      randomizeQuestions: false,
      thankyouMessage: 'Thank you! We will contact you within 1 hour based on your responses.',
      redirectUrl: '/booking',
      responses: 156,
      completionRate: 89.2,
      avgTimeToComplete: 4.5,
      questions: [
        {
          id: 'Q001',
          questionText: 'What type of property was damaged?',
          questionType: 'single_choice',
          questionOrder: 1,
          isRequired: true,
          options: ['Residential Home', 'Commercial Building', 'Multi-family Property', 'Other'],
          conditionalLogic: [{
            condition: 'equals',
            targetQuestionId: 'Q001',
            value: 'Commercial Building',
            action: 'skip_to',
            skipToQuestionId: 'Q005'
          }]
        },
        {
          id: 'Q002',
          questionText: 'How would you rate the severity of the damage?',
          questionType: 'rating',
          questionOrder: 2,
          isRequired: true,
          scaleMin: 1,
          scaleMax: 10,
          scaleLabels: ['Minor', 'Severe'],
          helpText: '1 = Minor cosmetic damage, 10 = Major structural damage',
          conditionalLogic: [{
            condition: 'greater_than',
            targetQuestionId: 'Q002',
            value: '7',
            action: 'show',
            skipToQuestionId: 'Q007'
          }]
        },
        {
          id: 'Q003',
          questionText: 'Which areas of your property were affected? (Select all that apply)',
          questionType: 'multiple_choice',
          questionOrder: 3,
          isRequired: true,
          options: ['Roof', 'Siding', 'Windows', 'Foundation', 'Landscape', 'Driveway', 'Fence', 'HVAC System']
        },
        {
          id: 'Q004',
          questionText: 'Is this an insurance claim?',
          questionType: 'yes_no',
          questionOrder: 4,
          isRequired: true,
          conditionalLogic: [{
            condition: 'equals',
            targetQuestionId: 'Q004',
            value: 'yes',
            action: 'show',
            skipToQuestionId: 'Q006'
          }]
        },
        {
          id: 'Q005',
          questionText: 'Please describe the damage in detail:',
          questionType: 'text',
          questionOrder: 5,
          isRequired: true,
          validationRules: {
            minLength: 20,
            maxLength: 500
          },
          helpText: 'Detailed descriptions help us prioritize your case and assign the right contractor'
        }
      ]
    },
    {
      id: 'SURVEY002',
      name: 'Contractor Service Satisfaction',
      description: 'Post-job satisfaction survey to gather feedback and identify upsell opportunities',
      allowMultipleResponses: false,
      showProgressBar: true,
      randomizeQuestions: false,
      thankyouMessage: 'Thank you for your feedback! We appreciate your business.',
      responses: 89,
      completionRate: 95.1,
      avgTimeToComplete: 3.2,
      questions: [
        {
          id: 'Q101',
          questionText: 'How satisfied were you with our services?',
          questionType: 'rating',
          questionOrder: 1,
          isRequired: true,
          scaleMin: 1,
          scaleMax: 5,
          scaleLabels: ['Very Dissatisfied', 'Very Satisfied']
        },
        {
          id: 'Q102',
          questionText: 'Would you recommend us to friends and family?',
          questionType: 'yes_no',
          questionOrder: 2,
          isRequired: true
        },
        {
          id: 'Q103',
          questionText: 'What other services might you need in the future?',
          questionType: 'multiple_choice',
          questionOrder: 3,
          isRequired: false,
          options: ['Roofing Maintenance', 'Gutter Cleaning', 'Tree Trimming', 'General Repairs', 'HVAC Service']
        }
      ]
    }
  ]);

  const questionTypes = [
    { 
      type: 'single_choice', 
      label: 'Single Choice', 
      icon: Radio, 
      description: 'Select one option from a list',
      useCase: 'Property type, service level, etc.'
    },
    { 
      type: 'multiple_choice', 
      label: 'Multiple Choice', 
      icon: CheckSquare, 
      description: 'Select multiple options',
      useCase: 'Damaged areas, services needed'
    },
    { 
      type: 'text', 
      label: 'Text Input', 
      icon: Type, 
      description: 'Free-form text response',
      useCase: 'Damage description, comments'
    },
    { 
      type: 'rating', 
      label: 'Rating Scale', 
      icon: Star, 
      description: 'Numeric rating scale',
      useCase: 'Severity, satisfaction scores'
    },
    { 
      type: 'yes_no', 
      label: 'Yes/No', 
      icon: ToggleLeft, 
      description: 'Simple binary choice',
      useCase: 'Insurance claim, emergency'
    },
    { 
      type: 'slider', 
      label: 'Slider', 
      icon: Gauge, 
      description: 'Numeric slider input',
      useCase: 'Budget range, priority level'
    },
    { 
      type: 'matrix', 
      label: 'Matrix', 
      icon: Hash, 
      description: 'Grid of questions and ratings',
      useCase: 'Service quality ratings'
    },
    { 
      type: 'ranking', 
      label: 'Ranking', 
      icon: List, 
      description: 'Order items by preference',
      useCase: 'Priority ranking of repairs'
    }
  ];

  const addQuestion = useCallback(() => {
    if (!selectedSurvey) return;
    
    const newQuestion: SurveyQuestion = {
      id: `Q${Date.now()}`,
      questionText: 'New Question',
      questionType: 'single_choice',
      questionOrder: selectedSurvey.questions.length + 1,
      isRequired: true,
      options: ['Option 1', 'Option 2']
    };
    
    setEditingQuestion(newQuestion);
  }, [selectedSurvey]);

  const saveQuestion = useCallback((question: SurveyQuestion) => {
    if (!selectedSurvey) return;
    
    const updatedQuestions = selectedSurvey.questions.some(q => q.id === question.id)
      ? selectedSurvey.questions.map(q => q.id === question.id ? question : q)
      : [...selectedSurvey.questions, question];
    
    setEditingQuestion(null);
    console.log('Question saved:', question);
  }, [selectedSurvey]);

  const deleteQuestion = useCallback((questionId: string) => {
    if (!selectedSurvey) return;
    console.log('Deleting question:', questionId);
  }, [selectedSurvey]);

  const duplicateQuestion = useCallback((question: SurveyQuestion) => {
    const duplicate = {
      ...question,
      id: `Q${Date.now()}`,
      questionText: `${question.questionText} (Copy)`,
      questionOrder: selectedSurvey?.questions.length ? selectedSurvey.questions.length + 1 : 1
    };
    setEditingQuestion(duplicate);
  }, [selectedSurvey]);

  if (!selectedSurvey) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Survey Builder</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Create intelligent surveys with conditional logic to qualify leads</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-create-survey">
            <Plus className="w-4 h-4 mr-2" />
            Create Survey
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <motion.div
              key={survey.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="cursor-pointer"
              onClick={() => setSelectedSurvey(survey)}
              data-testid={`card-survey-${survey.id}`}
            >
              <Card className="h-full border-2 hover:border-blue-300 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold">{survey.name}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{survey.description}</p>
                    </div>
                    <Badge variant={survey.responses > 100 ? "default" : "secondary"}>
                      {survey.questions.length} questions
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Responses</span>
                      <span className="font-semibold text-blue-600">{survey.responses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</span>
                      <span className="font-semibold text-green-600">{survey.completionRate}%</span>
                    </div>
                    {survey.avgTimeToComplete && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Time</span>
                        <span className="font-semibold text-purple-600">{survey.avgTimeToComplete}m</span>
                      </div>
                    )}
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
            onClick={() => setSelectedSurvey(null)}
            className="text-gray-600 hover:text-gray-900"
            data-testid="button-back-surveys"
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Back to Surveys
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedSurvey.name}</h1>
            <p className="text-gray-600 dark:text-gray-300">{selectedSurvey.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" data-testid="button-save-survey">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-preview-survey">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="builder" data-testid="tab-builder">Builder</TabsTrigger>
          <TabsTrigger value="preview" data-testid="tab-preview">Preview</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Question Library */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Question Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {questionTypes.map((type) => (
                    <motion.div
                      key={type.type}
                      drag
                      dragSnapToOrigin={true}
                      whileDrag={{ scale: 0.95, rotate: 2 }}
                      className="p-3 border rounded-lg cursor-grab active:cursor-grabbing hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      data-testid={`drag-question-${type.type}`}
                    >
                      <div className="flex items-center space-x-2">
                        <type.icon className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-sm">{type.label}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{type.description}</p>
                      <Badge variant="outline" className="text-xs mt-1">{type.useCase}</Badge>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                    Smart Logic
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowLogicBuilder(true)}
                    data-testid="button-logic-builder"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Add Conditional Logic
                  </Button>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Show/hide questions based on previous answers to create dynamic surveys
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Question Editor */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Survey Questions</CardTitle>
                    <Button onClick={addQuestion} size="sm" data-testid="button-add-question">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedSurvey.questions.map((question, index) => (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border rounded-lg p-4 space-y-3"
                        data-testid={`question-item-${question.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline">Q{question.questionOrder}</Badge>
                              <Badge variant={question.isRequired ? "default" : "secondary"}>
                                {question.isRequired ? 'Required' : 'Optional'}
                              </Badge>
                              <Badge variant="outline">{question.questionType.replace('_', ' ')}</Badge>
                              {question.conditionalLogic && question.conditionalLogic.length > 0 && (
                                <Badge variant="outline" className="text-purple-600 border-purple-300">
                                  <Zap className="w-3 h-3 mr-1" />
                                  Smart Logic
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-white">{question.questionText}</h3>
                            {question.helpText && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{question.helpText}</p>
                            )}
                            {question.options && (
                              <div className="mt-2 space-y-1">
                                {question.options.map((option, optIndex) => (
                                  <div key={optIndex} className="text-sm text-gray-600 dark:text-gray-400">
                                    • {option}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingQuestion(question)}
                              data-testid={`button-edit-${question.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => duplicateQuestion(question)}
                              data-testid={`button-duplicate-${question.id}`}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteQuestion(question.id)}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-delete-${question.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {selectedSurvey.questions.length === 0 && (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <FormInput className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No questions yet. Drag a question type from the left to get started.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Responses</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {selectedSurvey.responses.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  {selectedSurvey.completionRate}%
                </div>
              </CardContent>
            </Card>

            {selectedSurvey.avgTimeToComplete && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Time</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600 mt-2">
                    {selectedSurvey.avgTimeToComplete}m
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Questions</span>
                </div>
                <div className="text-2xl font-bold text-orange-600 mt-2">
                  {selectedSurvey.questions.length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Survey Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="survey-name">Survey Name</Label>
                    <Input
                      id="survey-name"
                      value={selectedSurvey.name}
                      placeholder="Enter survey name"
                      data-testid="input-survey-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="survey-description">Description</Label>
                    <Textarea
                      id="survey-description"
                      value={selectedSurvey.description}
                      placeholder="Enter survey description"
                      data-testid="textarea-survey-description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="thankyou-message">Thank You Message</Label>
                    <Textarea
                      id="thankyou-message"
                      value={selectedSurvey.thankyouMessage}
                      placeholder="Message shown after completion"
                      data-testid="textarea-thankyou-message"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="multiple-responses">Allow Multiple Responses</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Allow users to submit multiple times</p>
                    </div>
                    <Switch
                      id="multiple-responses"
                      checked={selectedSurvey.allowMultipleResponses}
                      data-testid="switch-multiple-responses"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="progress-bar">Show Progress Bar</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Display completion progress</p>
                    </div>
                    <Switch
                      id="progress-bar"
                      checked={selectedSurvey.showProgressBar}
                      data-testid="switch-progress-bar"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="randomize-questions">Randomize Questions</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Show questions in random order</p>
                    </div>
                    <Switch
                      id="randomize-questions"
                      checked={selectedSurvey.randomizeQuestions}
                      data-testid="switch-randomize-questions"
                    />
                  </div>

                  <div>
                    <Label htmlFor="redirect-url">Redirect URL (Optional)</Label>
                    <Input
                      id="redirect-url"
                      value={selectedSurvey.redirectUrl || ''}
                      placeholder="https://example.com/thank-you"
                      data-testid="input-redirect-url"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Redirect users after completing the survey
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Question Editor Modal would go here */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="question-text">Question Text</Label>
                <Input
                  id="question-text"
                  value={editingQuestion.questionText}
                  placeholder="Enter your question"
                  data-testid="input-question-text"
                />
              </div>

              <div>
                <Label htmlFor="question-type">Question Type</Label>
                <Select value={editingQuestion.questionType} data-testid="select-question-type">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes.map((type) => (
                      <SelectItem key={type.type} value={type.type}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="required"
                  checked={editingQuestion.isRequired}
                  data-testid="switch-question-required"
                />
                <Label htmlFor="required">Required Question</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingQuestion(null)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => saveQuestion(editingQuestion)}
                  data-testid="button-save-question"
                >
                  Save Question
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}