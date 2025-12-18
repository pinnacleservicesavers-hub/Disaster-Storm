import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, MessageSquare, Mail, Clock, CheckCircle, AlertCircle,
  Volume2, VolumeX, Play, Pause, Copy, Edit, Sparkles, Bot
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const agentScripts = {
  closebot: {
    title: "CloseBot AI Sales Scripts",
    description: "Human-sounding voice scripts for automated follow-up calls",
    scripts: [
      {
        id: 'initial-followup',
        name: 'Initial Follow-Up Call',
        category: 'opening',
        timing: '2-4 hours after estimate',
        script: `Hi, this is Rachel calling from {contractor_name}. 

I'm reaching out because you recently requested an estimate for {service_type} work at your property.

I wanted to make sure you received the estimate and see if you have any questions I can help answer.

[PAUSE FOR RESPONSE]

Great! So the estimate came in at {estimate_amount} for {scope_summary}. 

Is there anything about the scope or pricing you'd like me to clarify?

[IF QUESTIONS]: Let me address that for you...
[IF NO QUESTIONS]: Perfect! Would you like me to go ahead and get you scheduled? I'm showing availability as soon as {next_available}.`,
        variables: ['contractor_name', 'service_type', 'estimate_amount', 'scope_summary', 'next_available'],
        objectionResponses: {
          'too_expensive': "I understand budget is important. Let me ask - is there a specific part of the work you'd like to prioritize first? We can often phase projects to work within different budgets.",
          'need_more_quotes': "That's completely reasonable. I'd just mention that our estimate is already competitively priced and includes a satisfaction guarantee. Would you like me to send you our reviews from similar jobs?",
          'not_ready': "No problem at all. When do you think you'll be ready to move forward? I can set a reminder to follow up at a better time.",
          'bad_timing': "I understand. What would be a better time for me to call back?"
        }
      },
      {
        id: 'second-followup',
        name: 'Second Follow-Up (Day 2)',
        category: 'follow_up',
        timing: '48 hours after initial call',
        script: `Hi {customer_name}, this is Rachel from {contractor_name} again.

I'm following up on the estimate we sent for your {service_type} project.

I know you mentioned you were {previous_objection}, and I wanted to check in to see if anything has changed.

[PAUSE FOR RESPONSE]

We do have an opening coming up on {available_date}, and I'd hate for you to miss out on that spot.

What would help you feel more confident about moving forward?`,
        variables: ['customer_name', 'contractor_name', 'service_type', 'previous_objection', 'available_date'],
        objectionResponses: {
          'still_thinking': "I totally get it. These decisions take time. Can I share what some of our recent customers said about working with us?",
          'went_with_competitor': "I appreciate you letting me know. If anything changes or you need work in the future, we'd love the opportunity to serve you.",
          'price_concern': "I hear you. Would it help if I asked about any current promotions we might be able to apply?"
        }
      },
      {
        id: 'appointment-confirmation',
        name: 'Appointment Confirmation',
        category: 'scheduling',
        timing: '24 hours before appointment',
        script: `Hi {customer_name}, this is Rachel from {contractor_name}.

I'm calling to confirm your appointment for tomorrow, {appointment_date} at {appointment_time}.

{technician_name} will be arriving to complete your {service_type} work.

Just a few quick things:
- Please make sure the work area is accessible
- Our team will call when they're about 30 minutes away
- The estimated duration is {estimated_duration}

Is there anything you need from us before tomorrow?

[PAUSE]

Perfect! We'll see you tomorrow. Have a great day!`,
        variables: ['customer_name', 'contractor_name', 'appointment_date', 'appointment_time', 'technician_name', 'service_type', 'estimated_duration'],
        objectionResponses: {
          'reschedule': "No problem at all. Let me check our availability. What day works better for you?",
          'questions': "Great question! Let me get you the answer on that..."
        }
      }
    ]
  },
  reviewRequest: {
    title: "ReviewRocket Scripts",
    description: "Automated review request messages",
    scripts: [
      {
        id: 'review-sms',
        name: 'SMS Review Request',
        category: 'review',
        timing: 'Same day as job completion',
        script: `Hi {customer_name}! Thanks for choosing {contractor_name} for your {service_type} work today. 

We hope everything looks great! 🏠

Would you mind taking 30 seconds to leave us a quick review? It really helps other homeowners find quality contractors.

{review_link}

Thanks so much!
- The {contractor_name} Team`,
        variables: ['customer_name', 'contractor_name', 'service_type', 'review_link'],
        objectionResponses: {}
      },
      {
        id: 'review-email',
        name: 'Email Review Request',
        category: 'review',
        timing: '2-3 days after completion',
        script: `Subject: How did we do, {customer_name}?

Hi {customer_name},

Thank you for trusting {contractor_name} with your {service_type} project!

We take pride in every job we complete, and your feedback helps us improve and helps other homeowners make informed decisions.

Would you take a moment to share your experience?

⭐ Leave a Review: {review_link}

Your honest feedback means the world to us. If there's anything we could have done better, please reply to this email - we'd love to make it right.

Thanks again for your business!

Warm regards,
{contractor_name}
{contractor_phone}`,
        variables: ['customer_name', 'contractor_name', 'service_type', 'review_link', 'contractor_phone'],
        objectionResponses: {}
      }
    ]
  },
  voiceInstructions: {
    title: "Voice & Tone Guidelines",
    description: "How CloseBot should sound",
    guidelines: [
      {
        aspect: "Tone",
        instruction: "Warm, friendly, professional. Like a helpful neighbor who happens to be in the business.",
        examples: ["Instead of: 'I am calling regarding your estimate inquiry.' Say: 'Hey, I'm following up on that estimate you asked about!'"]
      },
      {
        aspect: "Pace",
        instruction: "Natural conversational speed. Not too fast (seems pushy), not too slow (seems unsure).",
        examples: ["Pause after questions to let customer respond", "Speed up slightly when building excitement about scheduling"]
      },
      {
        aspect: "Empathy",
        instruction: "Acknowledge customer concerns before addressing them. Make them feel heard.",
        examples: ["'I totally understand that's a big investment...'", "'That's a great question, a lot of customers ask that...'"]
      },
      {
        aspect: "Confidence",
        instruction: "Speak with certainty about the work quality and value. Avoid hedging language.",
        examples: ["Instead of: 'We might be able to...' Say: 'We can definitely...'", "Instead of: 'I think the price is fair.' Say: 'The price reflects our quality guarantee.'"]
      },
      {
        aspect: "Closing",
        instruction: "Always end with a clear next step. Never leave the conversation open-ended.",
        examples: ["'So should I put you down for Tuesday or Thursday?'", "'I'll send that over right now and call you tomorrow to confirm.'"]
      }
    ]
  }
};

function getBestFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const preferredVoices = ['Samantha', 'Zira', 'Jenny', 'Google US English Female', 'Microsoft Zira'];
  for (const name of preferredVoices) {
    const voice = voices.find(v => v.name.includes(name));
    if (voice) return voice;
  }
  return voices.find(v => v.lang.startsWith('en')) || voices[0];
}

export default function AIAgentScripts() {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hasSpoken, setHasSpoken] = useState(false);
  const [playingScript, setPlayingScript] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!voiceEnabled || hasSpoken) return;
    
    const speak = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) return;
      
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        "Hey! ... So glad you're here. ... " +
        "This is where you can see all the scripts I use when I'm making calls for you. ... " +
        "I've been doing this for a while now, ... " +
        "and honestly? ... These scripts really work. ... " +
        "They sound natural, ... they handle objections smoothly, ... " +
        "and they get people to book appointments. ... " +
        "Click play on any script if you wanna hear how it sounds!"
      );
      
      const voice = getBestFemaleVoice(voices);
      if (voice) utterance.voice = voice;
      utterance.pitch = 1.0;
      utterance.rate = 0.9;
      
      speechSynthesis.speak(utterance);
      setHasSpoken(true);
    };

    if (speechSynthesis.getVoices().length > 0) {
      speak();
    } else {
      speechSynthesis.onvoiceschanged = speak;
    }

    return () => speechSynthesis.cancel();
  }, [voiceEnabled, hasSpoken]);

  const toggleVoice = () => {
    if (voiceEnabled) speechSynthesis.cancel();
    setVoiceEnabled(!voiceEnabled);
    setHasSpoken(false);
  };

  const playScript = (scriptId: string, text: string) => {
    if (playingScript === scriptId) {
      speechSynthesis.cancel();
      setPlayingScript(null);
      return;
    }

    speechSynthesis.cancel();
    const voices = speechSynthesis.getVoices();
    const cleanText = text.replace(/\{[^}]+\}/g, 'customer name').replace(/\[.*?\]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voice = getBestFemaleVoice(voices);
    if (voice) utterance.voice = voice;
    utterance.pitch = 1.0;
    utterance.rate = 0.88;
    
    utterance.onend = () => setPlayingScript(null);
    speechSynthesis.speak(utterance);
    setPlayingScript(scriptId);
  };

  const copyScript = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Script copied to clipboard"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-start mb-8">
          <Link to="/workhub" className="text-emerald-300 hover:text-white transition-colors">
            &larr; Back to WorkHub
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVoice}
            className="text-white/70 hover:text-white"
            data-testid="button-toggle-voice"
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>

        <div className="text-center mb-12">
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-200 border-emerald-400/30">
            <Bot className="w-4 h-4 mr-1" />
            AI Agent Library
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI Agent Scripts
          </h1>
          <p className="text-xl text-emerald-200 max-w-2xl mx-auto">
            Proven conversation scripts that convert leads into customers
          </p>
        </div>

        <Tabs defaultValue="closebot" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="closebot" className="data-[state=active]:bg-emerald-500">
              <Phone className="w-4 h-4 mr-2" />
              CloseBot Calls
            </TabsTrigger>
            <TabsTrigger value="review" className="data-[state=active]:bg-emerald-500">
              <MessageSquare className="w-4 h-4 mr-2" />
              Review Requests
            </TabsTrigger>
            <TabsTrigger value="guidelines" className="data-[state=active]:bg-emerald-500">
              <Sparkles className="w-4 h-4 mr-2" />
              Voice Guidelines
            </TabsTrigger>
          </TabsList>

          <TabsContent value="closebot" className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-emerald-400" />
                  {agentScripts.closebot.title}
                </CardTitle>
                <CardDescription className="text-emerald-200">
                  {agentScripts.closebot.description}
                </CardDescription>
              </CardHeader>
            </Card>

            {agentScripts.closebot.scripts.map((script) => (
              <Card key={script.id} className="bg-white/5 border-white/10" data-testid={`card-script-${script.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-white">{script.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-emerald-300 border-emerald-400/30">
                          {script.category}
                        </Badge>
                        <span className="text-sm text-emerald-200/70 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {script.timing}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => playScript(script.id, script.script)}
                        className="text-white/70 hover:text-white"
                        data-testid={`button-play-${script.id}`}
                      >
                        {playingScript === script.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyScript(script.script)}
                        className="text-white/70 hover:text-white"
                        data-testid={`button-copy-${script.id}`}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-black/30 rounded-lg p-4 text-sm text-emerald-100 whitespace-pre-wrap font-mono overflow-x-auto">
                    {script.script}
                  </pre>

                  {script.variables.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-white mb-2">Variables:</h4>
                      <div className="flex flex-wrap gap-2">
                        {script.variables.map((v) => (
                          <Badge key={v} variant="secondary" className="bg-emerald-500/20 text-emerald-200">
                            {`{${v}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(script.objectionResponses).length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-white mb-2">Objection Handling:</h4>
                      <div className="space-y-2">
                        {Object.entries(script.objectionResponses).map(([key, response]) => (
                          <div key={key} className="bg-black/20 rounded p-3">
                            <span className="text-amber-400 text-sm font-medium capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <p className="text-emerald-100 text-sm mt-1">{response}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="review" className="space-y-6">
            {agentScripts.reviewRequest.scripts.map((script) => (
              <Card key={script.id} className="bg-white/5 border-white/10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-white">{script.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-emerald-300 border-emerald-400/30">
                          {script.category}
                        </Badge>
                        <span className="text-sm text-emerald-200/70 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {script.timing}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyScript(script.script)}
                      className="text-white/70 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-black/30 rounded-lg p-4 text-sm text-emerald-100 whitespace-pre-wrap font-mono">
                    {script.script}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="guidelines" className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  {agentScripts.voiceInstructions.title}
                </CardTitle>
                <CardDescription className="text-emerald-200">
                  {agentScripts.voiceInstructions.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {agentScripts.voiceInstructions.guidelines.map((guideline) => (
                  <div key={guideline.aspect} className="bg-black/20 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">{guideline.aspect}</h4>
                    <p className="text-emerald-100 mb-3">{guideline.instruction}</p>
                    <div className="space-y-2">
                      {guideline.examples.map((example, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-emerald-200/80">{example}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
