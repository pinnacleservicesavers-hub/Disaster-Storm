import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Trash2, Edit, Eye, Copy, Settings, Save, Zap,
  FormInput, Type, Mail, Phone, CheckSquare, Square,
  Radio, List, Upload, PenTool, Calendar,
  ArrowRight, ArrowDown, Move, GripVertical, Link2,
  Sparkles, Users, TrendingUp, BarChart3, Clock
} from 'lucide-react';
import { FadeIn, SlideIn, ScaleIn, HoverLift } from '@/components/ui/animations';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

interface FormField {
  id: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: 'text' | 'email' | 'phone' | 'select' | 'radio' | 'checkbox' | 'file' | 'signature' | 'textarea' | 'number' | 'date';
  fieldOrder: number;
  isRequired: boolean;
  placeholder?: string;
  helpText?: string;
  fieldOptions?: string[];
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  conditionalLogic?: {
    showIf?: string;
    hideIf?: string;
    value?: string;
  };
}

interface Form {
  id: string;
  name: string;
  description: string;
  allowMultipleSubmissions: boolean;
  requiresApproval: boolean;
  sendConfirmationEmail: boolean;
  confirmationEmailTemplate: string;
  webhookUrl?: string;
  fields: FormField[];
  submissions: number;
  conversionRate: number;
  lastSubmission?: string;
}

export default function FormBuilder() {
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [viewMode, setViewMode] = useState<'builder' | 'preview' | 'settings'>('builder');
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Mock form data
  const [forms] = useState<Form[]>([
    {
      id: 'FORM001',
      name: 'Storm Damage Assessment Form',
      description: 'Comprehensive form to gather property damage information',
      allowMultipleSubmissions: false,
      requiresApproval: true,
      sendConfirmationEmail: true,
      confirmationEmailTemplate: 'Thank you for submitting your damage assessment. We will contact you within 2 hours.',
      webhookUrl: 'https://api.example.com/webhook',
      submissions: 234,
      conversionRate: 78.5,
      lastSubmission: '2024-01-15 16:30:00',
      fields: [
        {
          id: 'F001',
          fieldName: 'property_owner_name',
          fieldLabel: 'Property Owner Name',
          fieldType: 'text',
          fieldOrder: 1,
          isRequired: true,
          placeholder: 'Enter your full name',
          helpText: 'Please provide the legal property owner name'
        },
        {
          id: 'F002',
          fieldName: 'contact_email',
          fieldLabel: 'Email Address',
          fieldType: 'email',
          fieldOrder: 2,
          isRequired: true,
          placeholder: 'your@email.com',
          validationRules: {
            pattern: '^[^@]+@[^@]+\\.[^@]+$'
          }
        },
        {
          id: 'F003',
          fieldName: 'phone_number',
          fieldLabel: 'Phone Number',
          fieldType: 'phone',
          fieldOrder: 3,
          isRequired: true,
          placeholder: '(555) 123-4567',
          helpText: 'We will contact you at this number for urgent updates'
        },
        {
          id: 'F004',
          fieldName: 'property_address',
          fieldLabel: 'Property Address',
          fieldType: 'textarea',
          fieldOrder: 4,
          isRequired: true,
          placeholder: 'Full street address including city, state, and ZIP',
          validationRules: {
            minLength: 10,
            maxLength: 200
          }
        },
        {
          id: 'F005',
          fieldName: 'damage_type',
          fieldLabel: 'Primary Damage Type',
          fieldType: 'select',
          fieldOrder: 5,
          isRequired: true,
          fieldOptions: [
            'Roof Damage',
            'Flooding',
            'Wind Damage',
            'Tree Fall',
            'Hail Damage',
            'Structural Damage',
            'Other'
          ]
        },
        {
          id: 'F006',
          fieldName: 'damage_photos',
          fieldLabel: 'Damage Photos',
          fieldType: 'file',
          fieldOrder: 6,
          isRequired: false,
          helpText: 'Upload up to 10 photos showing the damage (max 5MB each)'
        },
        {
          id: 'F007',
          fieldName: 'insurance_company',
          fieldLabel: 'Insurance Company',
          fieldType: 'text',
          fieldOrder: 7,
          isRequired: true,
          placeholder: 'State Farm, Allstate, etc.'
        },
        {
          id: 'F008',
          fieldName: 'emergency_contact',
          fieldLabel: 'Emergency Contact Needed',
          fieldType: 'radio',
          fieldOrder: 8,
          isRequired: true,
          fieldOptions: [
            'Yes - Immediate assistance required',
            'No - Can wait for regular business hours'
          ]
        }
      ]
    },
    {
      id: 'FORM002',
      name: 'Quick Lead Capture',
      description: 'Simple form for basic lead information',
      allowMultipleSubmissions: true,
      requiresApproval: false,
      sendConfirmationEmail: true,
      confirmationEmailTemplate: 'Thanks for your interest! We will be in touch soon.',
      submissions: 89,
      conversionRate: 92.1,
      lastSubmission: '2024-01-15 14:45:00',
      fields: [
        {
          id: 'F101',
          fieldName: 'name',
          fieldLabel: 'Full Name',
          fieldType: 'text',
          fieldOrder: 1,
          isRequired: true,
          placeholder: 'Your name'
        },
        {
          id: 'F102',
          fieldName: 'email',
          fieldLabel: 'Email',
          fieldType: 'email',
          fieldOrder: 2,
          isRequired: true,
          placeholder: 'your@email.com'
        },
        {
          id: 'F103',
          fieldName: 'service_needed',
          fieldLabel: 'Service Needed',
          fieldType: 'checkbox',
          fieldOrder: 3,
          isRequired: true,
          fieldOptions: [
            'Roofing',
            'Water Damage',
            'General Contractor',
            'Tree Removal',
            'Emergency Repairs'
          ]
        }
      ]
    }
  ]);

  const fieldTypes = [
    { type: 'text', label: 'Text Field', icon: Type, description: 'Single line text input' },
    { type: 'textarea', label: 'Text Area', icon: FormInput, description: 'Multi-line text input' },
    { type: 'email', label: 'Email', icon: Mail, description: 'Email address input' },
    { type: 'phone', label: 'Phone', icon: Phone, description: 'Phone number input' },
    { type: 'number', label: 'Number', icon: Type, description: 'Numeric input' },
    { type: 'date', label: 'Date', icon: Calendar, description: 'Date picker' },
    { type: 'select', label: 'Dropdown', icon: List, description: 'Single selection dropdown' },
    { type: 'radio', label: 'Radio Buttons', icon: Radio, description: 'Single choice radio buttons' },
    { type: 'checkbox', label: 'Checkboxes', icon: CheckSquare, description: 'Multiple choice checkboxes' },
    { type: 'file', label: 'File Upload', icon: Upload, description: 'File upload field' },
    { type: 'signature', label: 'Signature', icon: PenTool, description: 'Digital signature pad' }
  ];

  const getFieldIcon = (type: FormField['fieldType']) => {
    const fieldType = fieldTypes.find(ft => ft.type === type);
    return fieldType ? fieldType.icon : Type;
  };

  const createNewForm = () => {
    setIsCreating(true);
    console.log('Creating new form');
  };

  const addField = (fieldType: FormField['fieldType']) => {
    if (!selectedForm) return;
    
    const newField: FormField = {
      id: `F${Date.now()}`,
      fieldName: `field_${selectedForm.fields.length + 1}`,
      fieldLabel: `New ${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field`,
      fieldType,
      fieldOrder: selectedForm.fields.length + 1,
      isRequired: false,
      placeholder: `Enter ${fieldType}...`
    };

    if (fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') {
      newField.fieldOptions = ['Option 1', 'Option 2', 'Option 3'];
    }

    console.log('Adding field:', newField);
  };

  const deleteField = (fieldId: string) => {
    console.log('Deleting field:', fieldId);
  };

  const editField = (field: FormField) => {
    console.log('Editing field:', field);
  };

  const duplicateField = (field: FormField) => {
    console.log('Duplicating field:', field);
  };

  const handleDragStart = (fieldId: string) => {
    setDraggedField(fieldId);
  };

  const handleDragEnd = () => {
    setDraggedField(null);
  };

  const handleDrop = useCallback((targetFieldId: string) => {
    if (!draggedField || draggedField === targetFieldId) return;
    console.log(`Moving field ${draggedField} to position of ${targetFieldId}`);
    handleDragEnd();
  }, [draggedField]);

  const saveForm = () => {
    console.log('Saving form:', selectedForm);
  };

  return (
    <div className="space-y-6" data-testid="form-builder">
      {/* Header */}
      <FadeIn>
        <div className="relative overflow-hidden bg-gradient-to-r from-green-900 via-emerald-900 to-teal-900 dark:from-green-800 dark:via-emerald-800 dark:to-teal-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <ScaleIn>
                  <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <FormInput className="h-8 w-8 text-emerald-400" />
                  </div>
                </ScaleIn>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Form Builder
                  </h1>
                  <p className="text-emerald-200">
                    Create intelligent forms with conditional logic and automated workflows
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  onClick={createNewForm}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-create-form"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Form
                </Button>
                <Button
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  data-testid="button-form-templates"
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
                  <FormInput className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white" data-testid="text-total-forms">
                    {forms.length}
                  </div>
                  <div className="text-xs text-emerald-200">Active Forms</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <Users className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white" data-testid="text-total-submissions">
                    {forms.reduce((sum, f) => sum + f.submissions, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-emerald-200">Total Submissions</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-5 w-5 text-orange-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white" data-testid="text-avg-conversion">
                    {(forms.reduce((sum, f) => sum + f.conversionRate, 0) / forms.length).toFixed(1)}%
                  </div>
                  <div className="text-xs text-emerald-200">Avg Conversion</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <Sparkles className="h-5 w-5 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white" data-testid="text-active-workflows">
                    {forms.filter(f => f.webhookUrl).length}
                  </div>
                  <div className="text-xs text-emerald-200">Connected Workflows</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-12 gap-6">
        {/* Forms List */}
        <div className="col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FormInput className="h-5 w-5 mr-2" />
                Your Forms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {forms.map((form) => (
                <motion.div
                  key={form.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all ${
                      selectedForm?.id === form.id 
                        ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedForm(form)}
                    data-testid={`card-form-${form.id}`}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate mb-2">{form.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {form.description}
                      </p>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Fields:</span>
                          <span className="font-medium" data-testid={`text-fields-${form.id}`}>
                            {form.fields.length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Submissions:</span>
                          <span className="font-medium" data-testid={`text-submissions-${form.id}`}>
                            {form.submissions}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Conversion:</span>
                          <span className="font-medium text-green-600" data-testid={`text-form-conversion-${form.id}`}>
                            {form.conversionRate}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 mt-3 pt-3 border-t">
                        <Badge variant={form.requiresApproval ? 'secondary' : 'outline'} className="text-xs">
                          {form.requiresApproval ? 'Moderated' : 'Auto-Submit'}
                        </Badge>
                        {form.webhookUrl && (
                          <Badge variant="outline" className="text-xs">
                            <Link2 className="h-2 w-2 mr-1" />
                            Connected
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Field Types Palette */}
        <div className="col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Field Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {fieldTypes.map((fieldType) => (
                  <motion.div
                    key={fieldType.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => addField(fieldType.type as FormField['fieldType'])}
                      disabled={!selectedForm}
                      data-testid={`button-add-${fieldType.type}`}
                    >
                      <fieldType.icon className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <div className="font-medium text-sm">{fieldType.label}</div>
                        <div className="text-xs text-gray-500">{fieldType.description}</div>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Builder */}
        <div className="col-span-7">
          {selectedForm ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <FormInput className="h-5 w-5 mr-2" />
                    {selectedForm.name}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'builder' | 'preview' | 'settings')}>
                      <TabsList>
                        <TabsTrigger value="builder" data-testid="tab-builder">Builder</TabsTrigger>
                        <TabsTrigger value="preview" data-testid="tab-preview">Preview</TabsTrigger>
                        <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Button
                      onClick={saveForm}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-save-form"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
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
                      data-testid="form-fields-container"
                    >
                      {selectedForm.fields.length === 0 ? (
                        <div className="text-center py-12">
                          <FormInput className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                            No Fields Yet
                          </h3>
                          <p className="text-sm text-gray-500 mb-4">
                            Add fields from the palette to start building your form
                          </p>
                        </div>
                      ) : (
                        selectedForm.fields
                          .sort((a, b) => a.fieldOrder - b.fieldOrder)
                          .map((field, index) => {
                            const FieldIcon = getFieldIcon(field.fieldType);
                            
                            return (
                              <motion.div
                                key={field.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                draggable
                                onDragStart={() => handleDragStart(field.id)}
                                onDragEnd={handleDragEnd}
                                onDrop={() => handleDrop(field.id)}
                                onDragOver={(e) => e.preventDefault()}
                                className={`group ${draggedField === field.id ? 'opacity-50' : ''}`}
                              >
                                <Card className="hover:shadow-md transition-shadow" data-testid={`field-${field.id}`}>
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3 flex-1">
                                        <div className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                                          <GripVertical className="h-4 w-4 text-gray-400" />
                                        </div>
                                        
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400">
                                          <FieldIcon className="h-4 w-4" />
                                        </div>
                                        
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2">
                                            <h4 className="font-medium">{field.fieldLabel}</h4>
                                            {field.isRequired && (
                                              <Badge variant="destructive" className="text-xs">Required</Badge>
                                            )}
                                          </div>
                                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                            {field.fieldType.replace('_', ' ')} Field
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => editField(field)}
                                          data-testid={`button-edit-field-${field.id}`}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => duplicateField(field)}
                                          data-testid={`button-duplicate-field-${field.id}`}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => deleteField(field.id)}
                                          data-testid={`button-delete-field-${field.id}`}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {field.placeholder && (
                                      <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                                        <span className="text-gray-500">Placeholder: </span>
                                        <span className="italic">"{field.placeholder}"</span>
                                      </div>
                                    )}
                                    
                                    {field.fieldOptions && field.fieldOptions.length > 0 && (
                                      <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                        <div className="text-sm text-gray-500 mb-1">Options:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {field.fieldOptions.map((option, idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs">
                                              {option}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {field.helpText && (
                                      <div className="mt-2 text-xs text-gray-500 italic">
                                        Help: {field.helpText}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </motion.div>
                            );
                          })
                      )}
                    </motion.div>
                  ) : viewMode === 'preview' ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                      data-testid="form-preview"
                    >
                      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border">
                        <h2 className="text-2xl font-bold mb-4">{selectedForm.name}</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">{selectedForm.description}</p>
                        
                        <div className="space-y-4">
                          {selectedForm.fields
                            .sort((a, b) => a.fieldOrder - b.fieldOrder)
                            .map((field) => (
                              <div key={field.id} className="space-y-2">
                                <Label className="flex items-center">
                                  {field.fieldLabel}
                                  {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                                
                                {field.fieldType === 'textarea' ? (
                                  <textarea placeholder={field.placeholder} disabled className="w-full p-2 border rounded resize-none" />
                                ) : field.fieldType === 'select' ? (
                                  <Select disabled>
                                    <SelectTrigger>
                                      <SelectValue placeholder={field.placeholder || 'Select an option'} />
                                    </SelectTrigger>
                                  </Select>
                                ) : field.fieldType === 'radio' && field.fieldOptions ? (
                                  <div className="space-y-2">
                                    {field.fieldOptions.map((option, idx) => (
                                      <div key={idx} className="flex items-center space-x-2">
                                        <input type="radio" disabled />
                                        <Label>{option}</Label>
                                      </div>
                                    ))}
                                  </div>
                                ) : field.fieldType === 'checkbox' && field.fieldOptions ? (
                                  <div className="space-y-2">
                                    {field.fieldOptions.map((option, idx) => (
                                      <div key={idx} className="flex items-center space-x-2">
                                        <input type="checkbox" disabled />
                                        <Label>{option}</Label>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <Input 
                                    type={field.fieldType === 'email' ? 'email' : field.fieldType === 'phone' ? 'tel' : 'text'} 
                                    placeholder={field.placeholder} 
                                    disabled 
                                  />
                                )}
                                
                                {field.helpText && (
                                  <p className="text-sm text-gray-500">{field.helpText}</p>
                                )}
                              </div>
                            ))}
                        </div>
                        
                        <Button className="mt-6" disabled>Submit Form</Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                      data-testid="form-settings"
                    >
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Form Settings</h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Allow Multiple Submissions</Label>
                              <p className="text-sm text-gray-500">Allow users to submit this form multiple times</p>
                            </div>
                            <input type="checkbox" checked={selectedForm.allowMultipleSubmissions} readOnly className="toggle" />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Requires Approval</Label>
                              <p className="text-sm text-gray-500">Review submissions before processing</p>
                            </div>
                            <input type="checkbox" checked={selectedForm.requiresApproval} readOnly className="toggle" />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Send Confirmation Email</Label>
                              <p className="text-sm text-gray-500">Send email to user after submission</p>
                            </div>
                            <input type="checkbox" checked={selectedForm.sendConfirmationEmail} readOnly className="toggle" />
                          </div>
                        </div>
                        
                        {selectedForm.sendConfirmationEmail && (
                          <div className="space-y-2">
                            <Label>Confirmation Email Template</Label>
                            <textarea
                              value={selectedForm.confirmationEmailTemplate}
                              placeholder="Enter confirmation email message..."
                              className="w-full p-2 border rounded resize-none min-h-[100px]"
                              rows={4}
                            />
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label>Webhook URL (Optional)</Label>
                          <Input
                            type="url"
                            value={selectedForm.webhookUrl || ''}
                            placeholder="https://your-website.com/webhook"
                          />
                          <p className="text-sm text-gray-500">
                            Send form submissions to an external webhook
                          </p>
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
                <FormInput className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Select a Form
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Choose a form from the list to start building or editing
                </p>
                <Button
                  onClick={createNewForm}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-create-first-form"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Form
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <ModuleAIAssistant 
        moduleName="Form Builder"
        moduleContext="Dynamic form creation and management tool. Evelyn can guide you through building custom forms, adding fields with validation rules, configuring conditional logic, setting up webhooks, and analyzing form submission data and conversion rates."
      />
    </div>
  );
}