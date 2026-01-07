import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { FileText, Save, RefreshCw, Info } from 'lucide-react';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export function WelcomeTemplates() {
  const { toast } = useToast();
  const [selectedState, setSelectedState] = useState('FL');
  const [welcomeText, setWelcomeText] = useState('');

  // Fetch template for selected state
  const { data, refetch } = useQuery({
    queryKey: ['/api/admin/legal/welcome', selectedState],
    enabled: !!selectedState,
  });

  // Update welcome text when data changes
  useEffect(() => {
    if (data && typeof data === 'object' && 'welcome_text' in data) {
      setWelcomeText((data as { welcome_text: string }).welcome_text || '');
    }
  }, [data]);

  // Refetch when state changes
  useEffect(() => {
    refetch();
  }, [selectedState, refetch]);

  // Save template mutation
  const saveTemplate = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/legal/welcome', {
        method: 'POST',
        body: JSON.stringify({
          state: selectedState,
          welcome_text: welcomeText
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Template Saved',
        description: `Welcome template for ${selectedState} has been saved successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/legal/welcome', selectedState] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Save Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Per-State Welcome / Rights Letter
          </h1>
          <p className="text-slate-400">
            Customize welcome letters with state-specific information for first-time job state assignments
          </p>
        </div>

        {/* State Selector & Controls */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="w-5 h-5" />
              Template Editor
            </CardTitle>
            <CardDescription className="text-slate-400">
              Select a state and customize the welcome letter template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-300 font-medium min-w-[60px]">State:</label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-32 bg-slate-900 border-slate-600 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                data-testid="button-load-template"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Load
              </Button>
              <Button
                onClick={() => saveTemplate.mutate()}
                disabled={saveTemplate.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-save-template"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveTemplate.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* HTML Editor */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">HTML Content</CardTitle>
            <CardDescription className="text-slate-400">
              Enter HTML content for the welcome letter (supports formatting, lists, links, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={welcomeText}
              onChange={(e) => setWelcomeText(e.target.value)}
              placeholder="<p>Welcome to our disaster recovery service...</p>"
              className="bg-slate-900 border-slate-600 text-slate-200 font-mono text-sm min-h-[400px]"
              data-testid="textarea-welcome-html"
            />
          </CardContent>
        </Card>

        {/* Info Box */}
        <Alert className="bg-blue-500/10 border-blue-500/50">
          <Info className="w-4 h-4" />
          <AlertDescription className="text-blue-300">
            <strong>How it works:</strong> When a job's state is set for the first time, the system
            automatically generates a welcome/rights letter using this template. If blank, the system
            falls back to the state boilerplate or a generic welcome message.
          </AlertDescription>
        </Alert>
      </div>
      <ModuleAIAssistant 
        moduleName="Welcome Templates"
        moduleContext="State-specific welcome letter templates for disaster victims. Evelyn can help you customize HTML content, explain template variables, understand state-specific legal requirements, and manage automated letter generation."
      />
    </div>
  );
}
