import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { insertHomeownerSchema, type InsertHomeowner } from '@shared/schema';
import { UserPlus, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

// Create registration schema that properly extends insertHomeownerSchema with password confirmation
// Remove server-generated fields (passwordHash) and fix numeric field types
const registrationSchema = z.object({
  // Personal Information - required fields
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  
  // Property Information - required fields
  propertyAddress: z.string().min(1, 'Property address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(5, 'ZIP code is required'),
  propertyType: z.enum(['residential', 'commercial']),
  
  // Location - optional numeric fields (use coerce to match backend schema exactly)
  latitude: z.coerce.number().nullable().optional(),
  longitude: z.coerce.number().nullable().optional(),
  
  // Property Details - optional fields
  squareFootage: z.coerce.number().nullable().optional(),
  yearBuilt: z.coerce.number().int().nullable().optional(),
  
  // Insurance Information - optional fields
  insuranceCarrier: z.string().nullable().optional(),
  policyNumber: z.string().nullable().optional(),
  
  // Contact Preferences - fields with defaults matching backend schema
  preferredContactMethod: z.string().default('phone'),
  languagePreference: z.string().default('en'),
  
  // Emergency Status - field with default matching backend schema
  hasActiveEmergency: z.boolean().default(false),
  
  // Account Security - exclude passwordHash (server-generated), isVerified, verificationToken
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function VictimRegister() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      propertyAddress: '',
      city: '',
      state: '',
      zipCode: '',
      propertyType: 'residential',
      password: '',
      confirmPassword: '',
      latitude: undefined,
      longitude: undefined,
      squareFootage: undefined,
      yearBuilt: undefined,
      insuranceCarrier: '',
      policyNumber: '',
      preferredContactMethod: 'phone',
      languagePreference: 'en',
      hasActiveEmergency: false
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationForm) => {
      // Remove client-only fields (password, confirmPassword) and construct InsertHomeowner payload
      const { confirmPassword, password, ...formData } = data;
      
      // Construct payload as InsertHomeowner type - only fields that match backend schema
      const homeownerPayload: Partial<InsertHomeowner> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        propertyAddress: formData.propertyAddress,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        propertyType: formData.propertyType,
        latitude: formData.latitude ?? null,
        longitude: formData.longitude ?? null,
        squareFootage: formData.squareFootage ?? null,
        yearBuilt: formData.yearBuilt ?? null,
        insuranceCarrier: formData.insuranceCarrier || null,
        policyNumber: formData.policyNumber || null,
        preferredContactMethod: formData.preferredContactMethod,
        languagePreference: formData.languagePreference,
        hasActiveEmergency: formData.hasActiveEmergency,
        passwordHash: password, // Backend expects passwordHash field
        isVerified: false // Server-controlled default
      };

      const response = await apiRequest('/api/victim/register', {
        method: 'POST',
        body: JSON.stringify(homeownerPayload)
      });
      return { registrationResponse: response, email: formData.email, password };
    },
    onSuccess: async (data) => {
      // Auto-login after successful registration
      try {
        const loginResponse = await apiRequest('/api/victim/login', {
          method: 'POST',
          body: JSON.stringify({ 
            email: data.email, 
            password: data.password 
          })
        });

        // Store user data
        localStorage.setItem('victimUser', JSON.stringify(loginResponse.homeowner));

        toast({
          title: "Welcome!",
          description: "Your account has been created and you're now logged in."
        });

        // Redirect to dashboard
        window.location.href = '/victim/dashboard';
      } catch (loginError) {
        // If auto-login fails, redirect to login page
        toast({
          title: "Registration Successful",
          description: "Your account has been created. Please login to continue."
        });
        window.location.href = '/victim/login';
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Failed to create account"
      });
    }
  });

  const onSubmit = (data: RegistrationForm) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <title>Register - Storm Victim Portal</title>
      <meta name="description" content="Register for the Storm Victim Portal to report damage and request emergency assistance from verified contractors" />
      
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Create Your Storm Victim Account
            </CardTitle>
            <CardDescription className="text-gray-600">
              Register to report property damage and request contractor assistance
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your first name"
                              data-testid="input-firstname"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your last name"
                              data-testid="input-lastname"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              data-testid="input-email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="(555) 123-4567"
                              data-testid="input-phone"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Property Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Property Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="propertyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Address *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your property address"
                            data-testid="input-address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="City"
                              data-testid="input-city"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="State"
                              data-testid="input-state"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="12345"
                              data-testid="input-zipcode"
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
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-property-type">
                              <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="residential">Residential</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Account Security */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Account Security</h3>
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a secure password"
                              data-testid="input-password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              data-testid="input-confirm-password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              data-testid="button-toggle-confirm-password"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={registerMutation.isPending}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 space-y-4">
              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/victim/login">
                  <Button variant="link" className="p-0 h-auto font-semibold text-blue-600" data-testid="link-login">
                    Sign In Here
                  </Button>
                </Link>
              </div>

              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Your information is secure.</strong> We use industry-standard encryption 
                  to protect your personal and property information.
                </AlertDescription>
              </Alert>

              <Alert className="bg-orange-50 border-orange-200">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Emergency?</strong> If you're in immediate danger, call 911 first. 
                  This portal is for reporting property damage and requesting contractor assistance.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
      <ModuleAIAssistant 
        moduleName="Victim Registration"
        moduleContext="New homeowner account registration for storm damage reporting. Evelyn can guide you through the registration process, explain required information, help with property details, and answer questions about data privacy and next steps."
      />
    </div>
  );
}