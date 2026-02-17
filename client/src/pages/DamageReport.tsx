import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { insertDamageReportSchema } from '@shared/schema';
import { 
  Camera, 
  Upload, 
  ArrowLeft, 
  AlertTriangle, 
  Home, 
  MapPin,
  FileImage,
  X
} from 'lucide-react';
import { z } from 'zod';
import { StateCitySelector, useStateCitySelector } from '@/components/StateCitySelector';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import ModuleVoiceGuide from '@/components/ModuleVoiceGuide';

// Create damage report form schema with required fields only
const damageReportFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Please provide a detailed description (minimum 10 characters)'),
  damageType: z.enum(['roof_damage', 'tree_removal', 'flooding', 'window_damage', 'structural', 'electrical', 'siding']),
  severity: z.enum(['emergency', 'urgent', 'moderate', 'minor']),
  damageLocation: z.string().optional(),
  addressOverride: z.string().optional(),
  weatherConditions: z.string().optional()
});

type DamageReportForm = z.infer<typeof damageReportFormSchema>;

export default function DamageReport() {
  const { selectedState, setSelectedState, selectedCity, setSelectedCity, availableCities } = useStateCitySelector('Florida', 'Miami');
  const [user, setUser] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  
  // Get user data from localStorage
  useState(() => {
    const userData = localStorage.getItem('victimUser');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      window.location.href = '/victim/login';
    }
  });

  const form = useForm<DamageReportForm>({
    resolver: zodResolver(damageReportFormSchema),
    defaultValues: {
      title: '',
      description: '',
      damageType: 'roof_damage',
      severity: 'moderate',
      damageLocation: '',
      addressOverride: '',
      weatherConditions: ''
    }
  });

  const createDamageReportMutation = useMutation({
    mutationFn: async (data: DamageReportForm) => {
      const formData = new FormData();
      
      // Add damage report data
      formData.append('data', JSON.stringify({
        ...data,
        homeownerId: user.id
      }));
      
      // Add files
      selectedFiles.forEach((file, index) => {
        formData.append(`files`, file);
      });

      const response = await fetch('/api/victim/damage-reports', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create damage report');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Damage Report Submitted",
        description: "Your damage report has been successfully submitted. We'll connect you with contractors soon."
      });
      window.location.href = '/victim/dashboard';
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Failed to submit damage report"
      });
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      if (!isValidType) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: `${file.name} is not a valid image or video file.`
        });
        return false;
      }
      if (!isValidSize) {
        toast({
          variant: "destructive", 
          title: "File Too Large",
          description: `${file.name} is larger than 10MB limit.`
        });
        return false;
      }
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: DamageReportForm) => {
    createDamageReportMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <title>Report Damage - Storm Victim Portal</title>
      <meta name="description" content="Report property damage with photos and details to connect with verified contractors for emergency repairs" />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link to="/victim/dashboard">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <StateCitySelector
                selectedState={selectedState}
                selectedCity={selectedCity}
                availableCities={availableCities}
                onStateChange={setSelectedState}
                onCityChange={setSelectedCity}
                variant="default"
                showAllStates={true}
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Report Property Damage</h1>
                <p className="text-sm text-gray-600">Document damage with photos and details</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Emergency Alert */}
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Safety First:</strong> If you're in immediate danger or have urgent safety concerns, 
            call 911 immediately. Only report damage if it's safe to do so.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="w-6 h-6 mr-2" />
              Damage Report Details
            </CardTitle>
            <CardDescription>
              Provide detailed information about the property damage. Include photos and videos to help contractors assess the situation.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Property Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Home className="w-5 h-5 mr-2" />
                    Property Information
                  </h3>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{user.propertyAddress}</p>
                      <p className="text-sm text-gray-600">{user.city}, {user.state} {user.zipCode}</p>
                    </div>
                  </div>
                </div>

                {/* Damage Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Damage Details</h3>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Damage Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Brief description of the damage (e.g., 'Tree fell on roof during storm')"
                            data-testid="input-title"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="damageType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type of Damage *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-damage-type">
                                <SelectValue placeholder="Select damage type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="roof_damage">Roof Damage</SelectItem>
                              <SelectItem value="tree_removal">Tree Removal</SelectItem>
                              <SelectItem value="flooding">Flooding</SelectItem>
                              <SelectItem value="window_damage">Window Damage</SelectItem>
                              <SelectItem value="structural">Structural Damage</SelectItem>
                              <SelectItem value="electrical">Electrical Issues</SelectItem>
                              <SelectItem value="siding">Siding Damage</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Severity Level *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-severity">
                                <SelectValue placeholder="Select severity" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="emergency">Emergency (Immediate safety risk)</SelectItem>
                              <SelectItem value="urgent">Urgent (Needs quick attention)</SelectItem>
                              <SelectItem value="moderate">Moderate (Can wait a few days)</SelectItem>
                              <SelectItem value="minor">Minor (Non-urgent repair)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detailed Description *</FormLabel>
                        <FormControl>
                          <textarea
                            className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Describe the damage in detail. Include what caused it, when it happened, and any safety concerns..."
                            data-testid="textarea-description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="damageLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specific Location</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., front yard, living room roof, garage"
                              data-testid="input-location"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weatherConditions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weather Conditions</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., high winds, heavy rain, hail"
                              data-testid="input-weather"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="addressOverride"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Different Address (if damage is at a different location)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Leave blank if damage is at your registered property"
                            data-testid="input-address-override"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Photos & Videos</h3>
                  <p className="text-sm text-gray-600">
                    Upload photos and videos of the damage. Good documentation helps contractors provide accurate estimates.
                  </p>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      data-testid="input-files"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900">Upload Photos & Videos</p>
                      <p className="text-sm text-gray-600 mt-2">
                        Drag and drop files here, or click to select files
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Supports JPG, PNG, MP4, MOV. Max 10MB per file.
                      </p>
                    </label>
                  </div>

                  {/* Selected Files */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900">Selected Files ({selectedFiles.length})</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                            <FileImage className="w-5 h-5 text-gray-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(1)} MB
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              data-testid={`button-remove-file-${index}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createDamageReportMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createDamageReportMutation.isPending ? "Submitting..." : "Submit Damage Report"}
                  </Button>
                  
                  <Link to="/victim/dashboard">
                    <Button type="button" variant="outline" data-testid="button-cancel">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      <ModuleAIAssistant moduleName="Damage Report" />
      <ModuleVoiceGuide moduleName="damage-report" />
    </div>
  );
}