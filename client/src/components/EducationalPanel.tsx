import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Zap, 
  Wind, 
  Eye, 
  Waves, 
  CloudRain,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';

interface EducationalExplanation {
  concept: string;
  simpleExplanation: string;
  whyItMatters: string;
  whatToWatch: string;
  insiderTips: string[];
  realWorldExample: string;
}

interface EducationalPanelProps {
  stormContext?: any;
}

export default function EducationalPanel({ stormContext }: EducationalPanelProps) {
  const [selectedConcept, setSelectedConcept] = useState<string>('tripwires');
  const [customQuestion, setCustomQuestion] = useState('');
  const [expandedConcept, setExpandedConcept] = useState<string | null>(null);

  const concepts = [
    { id: 'tripwires', name: 'Tripwires', icon: Zap, color: 'text-yellow-500' },
    { id: 'lightning burst', name: 'Lightning Burst', icon: Zap, color: 'text-blue-500' },
    { id: 'outflow tail', name: 'Outflow Tail', icon: Wind, color: 'text-cyan-500' },
    { id: 'eddy', name: 'Eddy (Warm Ocean)', icon: Waves, color: 'text-orange-500' },
    { id: 'eye wall', name: 'Eye Wall', icon: Eye, color: 'text-red-500' },
    { id: 'wind shear', name: 'Wind Shear', icon: Wind, color: 'text-purple-500' },
    { id: 'sea surface temperature', name: 'Sea Surface Temp', icon: Waves, color: 'text-teal-500' }
  ];

  // Query for educational explanations
  const { data: explanation, isLoading } = useQuery({
    queryKey: ['/api/grok/explain-concept', selectedConcept],
    queryFn: async () => {
      const res = await apiRequest(`/api/grok/explain-concept`, {
        method: 'POST',
        body: JSON.stringify({ concept: selectedConcept }),
        headers: { 'Content-Type': 'application/json' }
      });
      return res.explanation as EducationalExplanation;
    },
    enabled: !!selectedConcept
  });

  // Mutation for asking custom questions
  const askQuestionMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await apiRequest(`/api/grok/ask-question`, {
        method: 'POST',
        body: JSON.stringify({ 
          question, 
          context: stormContext || {} 
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      return res.answer;
    }
  });

  const handleAskQuestion = () => {
    if (customQuestion.trim()) {
      askQuestionMutation.mutate(customQuestion);
      setCustomQuestion('');
    }
  };

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          Storm Intelligence Education
        </CardTitle>
        <CardDescription>
          Learn what professionals watch and why it matters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="concepts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="concepts" data-testid="tab-concepts">
              <BookOpen className="h-4 w-4 mr-2" />
              Key Concepts
            </TabsTrigger>
            <TabsTrigger value="ask" data-testid="tab-ask-grok">
              <MessageSquare className="h-4 w-4 mr-2" />
              Ask Grok
            </TabsTrigger>
          </TabsList>

          <TabsContent value="concepts" className="space-y-4">
            {/* Concept Selection */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {concepts.map((concept) => (
                <Button
                  key={concept.id}
                  variant={selectedConcept === concept.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedConcept(concept.id)}
                  className="justify-start"
                  data-testid={`button-concept-${concept.id}`}
                >
                  <concept.icon className={`h-4 w-4 mr-2 ${concept.color}`} />
                  <span className="text-xs">{concept.name}</span>
                </Button>
              ))}
            </div>

            {/* Explanation Display */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8"
                >
                  <Sparkles className="h-8 w-8 mx-auto mb-2 animate-spin text-blue-600" />
                  <p className="text-sm text-muted-foreground">Grok is explaining...</p>
                </motion.div>
              ) : explanation ? (
                <motion.div
                  key={selectedConcept}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <ScrollArea className="h-[400px] pr-4">
                    {/* Simple Explanation */}
                    <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                      <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        What is {explanation.concept}?
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {explanation.simpleExplanation}
                      </p>
                    </div>

                    {/* Why It Matters */}
                    <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border-2 border-amber-200 dark:border-amber-800">
                      <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-amber-600" />
                        Why This Matters
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {explanation.whyItMatters}
                      </p>
                    </div>

                    {/* What to Watch */}
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-200 dark:border-green-800">
                      <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Eye className="h-5 w-5 text-green-600" />
                        What to Watch For
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {explanation.whatToWatch}
                      </p>
                    </div>

                    {/* Insider Tips */}
                    <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                      <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        Insider Tips (What Pros Know)
                      </h4>
                      <ul className="space-y-2">
                        {explanation.insiderTips.map((tip, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-purple-600 font-bold mt-0.5">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Real World Example */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <CloudRain className="h-5 w-5 text-blue-600" />
                        Real-World Example
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {explanation.realWorldExample}
                      </p>
                    </div>
                  </ScrollArea>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="ask" className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg border-2">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-purple-600" />
                Ask Grok Anything About Storms
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Get expert answers about weather patterns, storm behavior, or meteorology concepts
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Why do hurricanes weaken over land?"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                  data-testid="input-ask-grok"
                />
                <Button 
                  onClick={handleAskQuestion}
                  disabled={askQuestionMutation.isPending || !customQuestion.trim()}
                  data-testid="button-ask-grok"
                >
                  {askQuestionMutation.isPending ? (
                    <Sparkles className="h-4 w-4 animate-spin" />
                  ) : (
                    'Ask'
                  )}
                </Button>
              </div>
            </div>

            {/* Answer Display */}
            {askQuestionMutation.data && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-green-200 dark:border-green-800"
              >
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-600" />
                  Grok's Answer
                </h4>
                <ScrollArea className="h-[300px]">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {askQuestionMutation.data}
                  </p>
                </ScrollArea>
              </motion.div>
            )}

            {/* Suggested Questions */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Suggested Questions:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "What is rapid intensification?",
                  "How do you predict landfall location?",
                  "What makes a Category 5 hurricane?",
                  "Why is the eye wall dangerous?"
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomQuestion(suggestion);
                      askQuestionMutation.mutate(suggestion);
                    }}
                    className="text-xs"
                    data-testid={`button-suggested-${suggestion.slice(0, 20)}`}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
