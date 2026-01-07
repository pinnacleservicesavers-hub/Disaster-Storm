import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { insertServiceRequestSchema } from '@shared/schema';
import { 
  Wrench, 
  ArrowLeft, 
  AlertTriangle, 
  Home, 
  MapPin,
  Clock,
  DollarSign,
  Users
} from 'lucide-react';
import { z } from 'zod';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

// Create service request form schema
const serviceRequestFormSchema = z.object({
  serviceType: z.enum(['roofing', 'siding', 'windows', 'flooding', 'electrical', 'tree_removal', 'general_contractor']),
  urgency: z.enum(['immediate', 'urgent', 'normal', 'when_convenient']),
  description: z.string().min(10, 'Please provide a detailed description (minimum 10 characters)'),
  estimatedScope: z.enum(['small', 'medium', 'large', 'full_restoration']).optional(),
  budgetRange: z.enum(['under_5k', '5k_15k', '15k_50k', 'over_50k', 'insurance_covered']).optional(),
  preferredTimeframe: z.enum(['asap', 'within_week', 'within_month', 'flexible']).optional(),
  maxDistance: z.string().optional(),
  allowContactOutsideHours: z.boolean().optional(),
  damageReportId: z.string().optional()
});

type ServiceRequestForm = z.infer<typeof serviceRequestFormSchema>;

export default function ServiceRequest() {
  const [user, setUser] = useState<any>(null);
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

  const form = useForm<ServiceRequestForm>({
    resolver: zodResolver(serviceRequestFormSchema),
    defaultValues: {
      serviceType: 'general_contractor',
      urgency: 'normal',
      description: '',
      estimatedScope: 'medium',
      budgetRange: 'insurance_covered',
      preferredTimeframe: 'within_week',
      maxDistance: '25',
      allowContactOutsideHours: false
    }
  });

  const createServiceRequestMutation = useMutation({
    mutationFn: async (data: ServiceRequestForm) => {
      const response = await apiRequest('/api/victim/service-requests', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          homeownerId: user.id,
          maxDistance: data.maxDistance ? Number(data.maxDistance) : 25
        })
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Service Request Submitted",
        description: "Your service request has been submitted. We'll match you with qualified contractors soon."
      });
      window.location.href = '/victim/dashboard';
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Failed to submit service request"
      });
    }
  });

  const onSubmit = (data: ServiceRequestForm) => {
    createServiceRequestMutation.mutate(data);
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
      <title>Request Help - Storm Victim Portal</title>
      <meta name="description" content="Request contractor assistance for storm damage repairs and property restoration services" />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/victim/dashboard">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Request Contractor Help</h1>
                <p className="text-sm text-gray-600">Find qualified contractors for your repair needs</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Alert */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>How it works:</strong> Tell us what kind of help you need, and we'll connect you with 
            verified, licensed contractors in your area who specialize in storm damage restoration.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wrench className="w-6 h-6 mr-2" />
              Service Request Details
            </CardTitle>
            <CardDescription>
              Describe the type of work you need done and your preferences for finding contractors.
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
                      <p className="text-sm text-gray-500 mt-1">Property Type: {user.propertyType}</p>
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Service Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type of Service Needed *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-service-type">
                                <SelectValue placeholder="Select service type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="roofing">Roofing Repair/Replacement</SelectItem>
                              <SelectItem value="siding">Siding Repair</SelectItem>
                              <SelectItem value="windows">Window Repair/Replacement</SelectItem>
                              <SelectItem value="flooding">Water Damage/Flooding</SelectItem>
                              <SelectItem value="electrical">Electrical Work</SelectItem>
                              <SelectItem value="tree_removal">Tree Removal</SelectItem>
                              <SelectItem value="general_contractor">General Contractor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="urgency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Urgency Level *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-urgency">
                                <SelectValue placeholder="Select urgency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="immediate">Immediate (Emergency)</SelectItem>
                              <SelectItem value="urgent">Urgent (Within 24 hours)</SelectItem>
                              <SelectItem value="normal">Normal (Within a few days)</SelectItem>
                              <SelectItem value="when_convenient">When Convenient</SelectItem>
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
                            placeholder="Describe the work that needs to be done, any special requirements, access considerations, or other important details..."
                            data-testid="textarea-description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Project Scope & Budget */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Project Scope & Budget
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="estimatedScope"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Project Scope</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-scope">
                                <SelectValue placeholder="Select project scope" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="small">Small (Minor repairs)</SelectItem>
                              <SelectItem value="medium">Medium (Moderate repairs)</SelectItem>
                              <SelectItem value="large">Large (Major renovation)</SelectItem>
                              <SelectItem value="full_restoration">Full Restoration</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budgetRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Range</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-budget">
                                <SelectValue placeholder="Select budget range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="under_5k">Under $5,000</SelectItem>
                              <SelectItem value="5k_15k">$5,000 - $15,000</SelectItem>
                              <SelectItem value="15k_50k">$15,000 - $50,000</SelectItem>
                              <SelectItem value="over_50k">Over $50,000</SelectItem>
                              <SelectItem value="insurance_covered">Insurance Covered</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="preferredTimeframe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Timeframe</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-timeframe">
                              <SelectValue placeholder="Select timeframe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="asap">ASAP</SelectItem>
                            <SelectItem value="within_week">Within a Week</SelectItem>
                            <SelectItem value="within_month">Within a Month</SelectItem>
                            <SelectItem value="flexible">Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contractor Preferences */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Contractor Preferences
                  </h3>

                  <FormField
                    control={form.control}
                    name="maxDistance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Distance (miles)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="5"
                            max="100"
                            placeholder="25"
                            data-testid="input-max-distance"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500">
                          Maximum distance you're willing to have contractors travel to your property
                        </p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowContactOutsideHours"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="mt-1"
                            data-testid="checkbox-contact-hours"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Allow contact outside business hours
                          </FormLabel>
                          <p className="text-xs text-gray-500">
                            Contractors can contact you evenings and weekends if urgent
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createServiceRequestMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createServiceRequestMutation.isPending ? "Submitting..." : "Submit Service Request"}
                  </Button>
                  
                  <Link href="/victim/dashboard">
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
      <ModuleAIAssistant 
        moduleName="Service Request"
        moduleContext="Submit service requests for storm damage repairs. Evelyn can help you select the right service type, assess urgency levels, estimate scope and budget, and connect you with qualified contractors for your specific needs."
      />
    </div>
  );
}