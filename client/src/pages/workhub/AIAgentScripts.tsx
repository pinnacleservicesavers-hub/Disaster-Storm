import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, MessageSquare, Mail, Clock, CheckCircle, AlertCircle,
  Volume2, VolumeX, Play, Pause, Copy, Edit, Sparkles, Bot, Brain,
  Heart, Users, Zap, Shield, Target, TrendingUp, Gift, Star
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const agentScripts = {
  closebot: {
    title: "CloseBot AI Sales Scripts",
    description: "Psychology-enhanced voice scripts that convert leads into customers",
    scripts: [
      {
        id: 'initial-followup',
        name: 'Initial Follow-Up Call (Psychology-Enhanced)',
        category: 'opening',
        timing: '2-4 hours after estimate',
        psychologyUsed: ['Reciprocity', 'Social Proof', 'Scarcity'],
        script: `Hi, this is Evelyn calling from {contractor_name}. 

I'm reaching out because you recently requested an estimate for {service_type} work at your property.

[RECIPROCITY - Give value first]
Before we talk about anything else, I wanted to share a quick tip - with the weather we've been having, a lot of homeowners are seeing {related_issue}. Just something to keep an eye on, whether you go with us or not.

[PAUSE FOR RESPONSE]

So your estimate came in at {estimate_amount} for {scope_summary}. 

[SOCIAL PROOF]
Actually, we just finished a similar project for a homeowner on {nearby_street} last week - they were really happy with how it turned out.

Is there anything about the scope or pricing you'd like me to clarify?

[IF NO QUESTIONS - ASSUMPTIVE CLOSE + SCARCITY]
Perfect! I'm looking at the schedule and we have a really good crew with an opening on {next_available}. They're one of our best teams and get requested a lot. Should I put you down for that spot?`,
        variables: ['contractor_name', 'service_type', 'related_issue', 'estimate_amount', 'scope_summary', 'nearby_street', 'next_available', 'higher_price', 'issue'],
        objectionResponses: {
          'too_expensive': "[FEEL-FELT-FOUND + ANCHORING] I totally understand how you feel. A lot of our customers felt the same way at first. What they found was that the quality of materials and our warranty actually saved them money long-term. For a project like this, some contractors charge up to {higher_price} - we're at {estimate_amount} because of our efficiency. Is there a specific part of the work you'd like to prioritize first?",
          'need_more_quotes': "[SOCIAL PROOF + LOSS AVERSION] That's completely reasonable. What I can tell you is that about 8 out of 10 homeowners in your area end up choosing the option we recommended. I'd hate for you to lose this scheduling slot while you shop around - can I tentatively hold it for you while you decide? I'll send over some before-and-after photos from similar jobs.",
          'not_ready': "[COMMITMENT + CONSISTENCY] I understand. You mentioned the {issue} needs to be addressed eventually, right? Every month this waits, the situation can get a little worse. When do you think you'll be ready? I'll set a reminder and make sure we have availability.",
          'bad_timing': "[LIKING] No problem at all - I totally get it. Life gets crazy sometimes. When would be a better time for me to call back? I'll make a note and we can pick up right where we left off."
        }
      },
      {
        id: 'second-followup',
        name: 'Second Follow-Up (Day 2) - Psychology-Enhanced',
        category: 'follow_up',
        timing: '48 hours after initial call',
        psychologyUsed: ['Loss Aversion', 'FOMO', 'Commitment & Consistency'],
        script: `Hi {customer_name}, this is Evelyn from {contractor_name} again.

[LIKING - Personal touch]
I hope I'm not catching you at a bad time! 

I'm following up on the estimate we sent for your {service_type} project.

I know you mentioned you were {previous_objection}, and I totally understand - these decisions shouldn't be rushed.

[PAUSE FOR RESPONSE]

[LOSS AVERSION + FOMO]
I wanted to give you a heads up - our material costs are going up about 12% next month, and I'd hate for your price to jump. If you book by end of week, I can lock in the current pricing for you.

[COMMITMENT & CONSISTENCY]
You mentioned quality was important to you, right? If I can show you we deliver exactly that, would you be open to moving forward?

[CHOICE CLOSE]
We have openings on {available_date_1} or {available_date_2} - which would work better for your schedule?`,
        variables: ['customer_name', 'contractor_name', 'service_type', 'previous_objection', 'available_date_1', 'available_date_2', 'certification', 'higher_price', 'current_price', 'future_price'],
        objectionResponses: {
          'still_thinking': "[SOCIAL PROOF + AUTHORITY] I totally get it - it's a big decision. Can I share what really convinced other homeowners? We're actually certified by {certification}, and 9 out of 10 customers rate us 5 stars. Would seeing some of those reviews help?",
          'went_with_competitor': "[LIKING + FUTURE COMMITMENT] I appreciate you letting me know - that takes guts to be direct. If anything changes or you need work in the future, we'd absolutely love the chance to earn your business. Can I check in with you in a few months?",
          'price_concern': "[ANCHORING + LOSS AVERSION] I hear you completely. Just so you know, the national average for this kind of work runs about {higher_price}. We're coming in lower because of our crew efficiency. But here's the thing - if we wait, the damage spreads and what's a {current_price} fix now could be {future_price} by next season."
        }
      },
      {
        id: 'third-followup',
        name: 'Third Follow-Up (Day 5) - Last Chance',
        category: 'follow_up',
        timing: '5 days after initial contact',
        psychologyUsed: ['Scarcity', 'FOMO', 'Loss Aversion'],
        script: `Hi {customer_name}, this is Evelyn from {contractor_name}.

[LIKING]
I know you're probably busy, so I'll keep this quick.

[SCARCITY + FOMO]
I'm calling because we're about to release next month's schedule, and I've been holding a spot for you. Once we release it, these slots fill up within a day or two - especially with {season} coming up.

[LOSS AVERSION]
I'd really hate for you to have to wait another 3-4 weeks if this is something you need done soon.

[SUMMARY CLOSE]
So just to recap - you'd be getting {scope_summary}, our {warranty_length} warranty, and I can include {bonus_offer} at no extra charge if you confirm today.

[CHOICE CLOSE]
What do you say - should I lock that in for you? Tuesday or Thursday work better?`,
        variables: ['customer_name', 'contractor_name', 'season', 'scope_summary', 'warranty_length', 'bonus_offer'],
        objectionResponses: {
          'definitely_not_interested': "[LIKING + GRACE] I completely respect that, {customer_name}. Thank you for your time. If anything changes down the road, we'd love to hear from you.",
          'need_spouse_approval': "[COMMITMENT] Totally understand - big decisions should be made together. Would it help if I sent over a simple summary they can review? What's the best email?",
          'budget_issue': "[EMPATHY + PHASING] I really appreciate your honesty. We do have customers who break projects into phases - tackle the most urgent part now and the rest later. Would something like that work for your situation?"
        }
      },
      {
        id: 'appointment-confirmation',
        name: 'Appointment Confirmation (Psychology-Enhanced)',
        category: 'scheduling',
        timing: '24 hours before appointment',
        psychologyUsed: ['Commitment & Consistency', 'Authority'],
        script: `Hi {customer_name}, this is Evelyn from {contractor_name}.

[EXCITEMENT + LIKING]
I'm so excited to call you today!

[AUTHORITY]
I'm confirming your appointment for tomorrow, {appointment_date} at {appointment_time}. {technician_name} will be arriving - they're one of our most experienced team members with over {tech_experience} years in the field.

[COMMITMENT & CONSISTENCY]
You made a great decision going with us. Just a few quick things to make sure everything goes smoothly:
- Please make sure the work area is accessible
- Our team will call when they're about 30 minutes away
- The estimated duration is {estimated_duration}

[EMOTIONAL TRIGGER - Peace of Mind]
After tomorrow, you won't have to worry about this again for years.

Is there anything you need from us before tomorrow?

[PAUSE]

Perfect! We'll see you tomorrow. Have a great day, {customer_name}!`,
        variables: ['customer_name', 'contractor_name', 'appointment_date', 'appointment_time', 'technician_name', 'tech_experience', 'service_type', 'estimated_duration'],
        objectionResponses: {
          'reschedule': "[LIKING + FLEXIBILITY] No problem at all - life happens! Let me check our availability. [SCARCITY] I want to get you rescheduled quickly so you don't have to wait too long. What day works better for you?",
          'questions': "[AUTHORITY] Great question! Let me get you the answer on that - we want you to feel completely confident going in."
        }
      },
      {
        id: 'win-back-call',
        name: 'Win-Back Call (Lost Lead)',
        category: 'reengagement',
        timing: '30 days after going cold',
        psychologyUsed: ['Reciprocity', 'Social Proof', 'Fresh Start'],
        script: `Hi {customer_name}, this is Evelyn from {contractor_name}.

[LIKING + HONESTY]
I hope you remember me - we chatted about your {service_type} project about a month ago. I know we didn't connect on timing back then, and I'm not calling to pressure you.

[RECIPROCITY]
I actually wanted to share something helpful - we've been seeing a lot of {seasonal_issue} in your area lately, and I thought of you.

[PAUSE FOR RESPONSE]

[SOCIAL PROOF]
Since we last spoke, we've completed about {recent_job_count} similar projects in your neighborhood. Your neighbor on {nearby_street} actually just finished theirs.

[SOFT ASK]
Is the {original_issue} still something on your to-do list? If so, I'd love to get you a fresh quote - no obligation. Things change, and I want to make sure we're still the right fit.

[CHOICE CLOSE]
Would you prefer I email over an updated estimate, or would a quick call work better?`,
        variables: ['customer_name', 'contractor_name', 'service_type', 'seasonal_issue', 'recent_job_count', 'nearby_street', 'original_issue'],
        objectionResponses: {
          'already_fixed': "[LIKING + FUTURE] That's great to hear! Glad you got it taken care of. If anything else comes up, I hope you'll think of us.",
          'went_with_competitor': "[GRACE + FUTURE] I appreciate you being upfront. If the work ever needs any touch-ups or you have another project, we'd love a chance to earn your business.",
          'still_not_ready': "[COMMITMENT] I understand completely. When do you think might be a better time? I'll set a reminder and make sure to save your info."
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
  },
  salesPsychology: {
    title: "Sales Psychology Techniques",
    description: "Proven psychological principles that increase conversion rates",
    cialdiniPrinciples: [
      {
        name: "Reciprocity",
        icon: "Gift",
        description: "People feel obligated to return favors. Give value first before asking for the sale.",
        scripts: [
          "I went ahead and put together a few tips for maintaining your {service_type} - no charge. Just wanted to help out.",
          "Before we talk numbers, let me share something most contractors won't tell you about {issue}...",
          "I noticed a few extra things while I was there - I jotted them down for you to keep, whether you hire us or not."
        ],
        usage: "Use early in the conversation to create goodwill and obligation."
      },
      {
        name: "Social Proof",
        icon: "Users",
        description: "People follow what others do. Mention neighbors, reviews, and similar successful projects.",
        scripts: [
          "Actually, we just finished a similar {service_type} job for your neighbor on {street_name} - they were thrilled with how it turned out.",
          "About 8 out of 10 homeowners in your area end up choosing the {recommended_option} - it just makes the most sense for this climate.",
          "I can send you some before-and-after photos from a project we did last month that's almost identical to yours."
        ],
        usage: "Use when customer seems hesitant or unsure about the decision."
      },
      {
        name: "Scarcity",
        icon: "Zap",
        description: "Limited availability increases perceived value. Create urgency without being pushy.",
        scripts: [
          "I should mention - we only have two slots left this month, and they tend to fill up fast with the season coming.",
          "This pricing is locked in until the end of the week. After that, material costs are going up about 12%.",
          "We're running a crew efficiency special right now, but once we're booked out, it goes back to regular pricing."
        ],
        usage: "Use when customer is interested but delaying the decision."
      },
      {
        name: "Authority",
        icon: "Shield",
        description: "People trust experts. Establish credibility through expertise and credentials.",
        scripts: [
          "I've been doing {service_type} work for 15 years now, and I can tell you this is exactly what we see in homes built in the {decade}.",
          "We're actually certified by {certification_body}, which means we follow manufacturer specifications exactly.",
          "Let me explain what I'm seeing here from a technical standpoint - this will help you understand why I'm recommending what I'm recommending."
        ],
        usage: "Use when customer questions the quality or approach."
      },
      {
        name: "Liking",
        icon: "Heart",
        description: "People buy from people they like. Build genuine rapport and find common ground.",
        scripts: [
          "Oh, you're a {sports_team} fan? Me too! That game last week was something else.",
          "I love what you've done with the {feature} - my wife has been wanting to do something similar at our place.",
          "You know, I totally get it. I'm the same way - I research everything before I make a decision too."
        ],
        usage: "Use throughout the conversation to build connection."
      },
      {
        name: "Commitment & Consistency",
        icon: "Target",
        description: "Small yeses lead to big yeses. Get micro-commitments before the final ask.",
        scripts: [
          "So we agree the {issue} needs to be addressed before winter, right?",
          "It sounds like quality matters more to you than just going with the cheapest option - is that fair?",
          "You mentioned you want this done right the first time. So if I can show you a solution that does exactly that, you'd be open to moving forward?"
        ],
        usage: "Use to build towards the close with progressive commitment."
      }
    ],
    additionalTechniques: [
      {
        name: "Loss Aversion",
        description: "People fear losing more than they desire gaining. Frame around what they'll miss.",
        scripts: [
          "The thing is, every month this waits, the damage spreads a little more. What's a $2,000 fix today could be $8,000 by spring.",
          "I'd hate for you to lose your warranty coverage because the issue wasn't addressed in time.",
          "If we don't get ahead of this now, you might be looking at a full replacement instead of just a repair."
        ]
      },
      {
        name: "Anchoring",
        description: "The first number shapes all future comparisons. Set expectations strategically.",
        scripts: [
          "For a project like this, you might expect to pay anywhere from $8,000 to $15,000. We're coming in at $6,500 because of our efficiency.",
          "Some contractors charge upwards of $200 an hour for this kind of work. Our flat rate actually saves you about 40%.",
          "The national average for {service_type} runs about {higher_price}. Our estimate at {actual_price} reflects our lower overhead."
        ]
      },
      {
        name: "FOMO (Fear of Missing Out)",
        description: "Create urgency through exclusive opportunities and time-sensitive benefits.",
        scripts: [
          "We're offering a 10% discount to neighbors in your area this month - it's how we keep our marketing costs down.",
          "If you book today, I can lock in this crew for you. They're our best team and they get requested a lot.",
          "This is actually the last week we can guarantee completion before the holidays."
        ]
      }
    ],
    closingTechniques: [
      {
        name: "Assumptive Close",
        description: "Assume the sale and move directly to logistics.",
        scripts: [
          "So I'll put you down for Tuesday morning. Does 8 AM or 9 AM work better for your schedule?",
          "Great, let me get the paperwork started. What email should I send the contract to?",
          "Perfect. I'll have the crew there first thing Monday. You'll get a confirmation text tonight."
        ]
      },
      {
        name: "Choice Close",
        description: "Give options that all lead to a sale. Let them choose how, not if.",
        scripts: [
          "Would you prefer to start with the full project, or would you rather break it into two phases?",
          "We can do Tuesday or Thursday this week - which works better for you?",
          "Do you want to pay the deposit by card today, or would you rather do a bank transfer tomorrow?"
        ]
      },
      {
        name: "Summary Close",
        description: "Recap all the value and benefits before asking for the decision.",
        scripts: [
          "So just to recap - you're getting the full {service_type} with our 5-year warranty, priority scheduling, and we're including the {bonus} at no extra charge. Ready to lock that in?",
          "Alright, so we're looking at {scope}, done by {timeline}, with financing available. What questions do you have before we get started?",
          "To sum it up: professional installation, licensed and insured crew, and a satisfaction guarantee. The only thing left is picking your start date."
        ]
      },
      {
        name: "Feel-Felt-Found",
        description: "Handle emotional objections with empathy and social proof.",
        scripts: [
          "I totally understand how you feel. A lot of our customers felt the same way at first. What they found was that investing upfront actually saved them money in the long run.",
          "I get it - that's a completely normal reaction. Other homeowners have felt exactly the same. What they found after working with us was that the peace of mind was worth every penny.",
          "You're not alone in feeling that way. Most people we work with felt hesitant at first. What they found was that our team made the whole process painless."
        ]
      }
    ],
    objectionFramework: {
      title: "Psychology-Enhanced Objection Handling",
      description: "A four-step framework for turning objections into opportunities",
      steps: [
        {
          step: 1,
          name: "Acknowledge",
          description: "Validate their concern genuinely. Never dismiss or minimize.",
          example: "I completely understand - that's a valid concern and I appreciate you sharing it."
        },
        {
          step: 2,
          name: "Probe",
          description: "Ask questions to understand the real underlying issue.",
          example: "Help me understand a bit more - is it the total cost, or is there a specific part that feels too high?"
        },
        {
          step: 3,
          name: "Address",
          description: "Respond with value, not pressure. Use psychology techniques appropriately.",
          example: "What I can tell you is that 3 of your neighbors have done this exact project with us, and not one of them had any issues. In fact, Mrs. Johnson just referred us to her sister."
        },
        {
          step: 4,
          name: "Close",
          description: "Always end with a clear next step. Guide them forward.",
          example: "So with that in mind, should we go ahead and get you on the schedule for next week?"
        }
      ]
    },
    emotionalTriggers: [
      { trigger: "Pride", script: "Your home is going to be the nicest on the block when we're done." },
      { trigger: "Protection", script: "This will keep your family safe and your investment protected for years." },
      { trigger: "Peace of Mind", script: "Once this is done, you won't have to think about it again for at least a decade." },
      { trigger: "Status", script: "This is the same solution we installed for some of the nicest homes in {neighborhood}." },
      { trigger: "Control", script: "You'll have complete visibility into every step of the process." }
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
            <TabsTrigger value="psychology" className="data-[state=active]:bg-purple-500" data-testid="tab-psychology">
              <Brain className="w-4 h-4 mr-2" />
              Sales Psychology
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
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-emerald-300 border-emerald-400/30">
                          {script.category}
                        </Badge>
                        <span className="text-sm text-emerald-200/70 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {script.timing}
                        </span>
                      </div>
                      {'psychologyUsed' in script && script.psychologyUsed && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Brain className="w-3 h-3 text-purple-400" />
                          {(script.psychologyUsed as string[]).map((technique) => (
                            <Badge key={technique} className="bg-purple-500/20 text-purple-200 border-purple-400/30 text-xs">
                              {technique}
                            </Badge>
                          ))}
                        </div>
                      )}
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

          <TabsContent value="psychology" className="space-y-6" data-testid="tabcontent-psychology">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  {agentScripts.salesPsychology.title}
                </CardTitle>
                <CardDescription className="text-purple-200">
                  {agentScripts.salesPsychology.description}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Cialdini's 6 Principles of Persuasion</CardTitle>
                <CardDescription className="text-purple-200">
                  The psychology behind why people say yes
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                {agentScripts.salesPsychology.cialdiniPrinciples.map((principle) => {
                  const IconComponent = 
                    principle.icon === "Gift" ? Gift :
                    principle.icon === "Users" ? Users :
                    principle.icon === "Zap" ? Zap :
                    principle.icon === "Shield" ? Shield :
                    principle.icon === "Heart" ? Heart :
                    Target;
                  return (
                    <div key={principle.name} className="bg-gradient-to-br from-purple-900/30 to-black/30 rounded-lg p-4 border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="w-5 h-5 text-purple-400" />
                        <h4 className="text-lg font-semibold text-white">{principle.name}</h4>
                      </div>
                      <p className="text-purple-100 text-sm mb-3">{principle.description}</p>
                      <div className="space-y-2">
                        {principle.scripts.map((script, idx) => (
                          <div key={idx} className="bg-black/30 rounded p-2 text-sm">
                            <p className="text-emerald-100 italic">"{script}"</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                        <span className="text-xs text-amber-200">{principle.usage}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  Additional Persuasion Techniques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {agentScripts.salesPsychology.additionalTechniques.map((technique) => (
                  <div key={technique.name} className="bg-gradient-to-r from-amber-900/20 to-black/30 rounded-lg p-4 border border-amber-500/20">
                    <h4 className="text-lg font-semibold text-white mb-2">{technique.name}</h4>
                    <p className="text-amber-100 text-sm mb-3">{technique.description}</p>
                    <div className="space-y-2">
                      {technique.scripts.map((script, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Star className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-emerald-100 text-sm italic">"{script}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  Closing Techniques
                </CardTitle>
                <CardDescription className="text-green-200">
                  Proven methods to seal the deal
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                {agentScripts.salesPsychology.closingTechniques.map((technique) => (
                  <div key={technique.name} className="bg-gradient-to-br from-green-900/30 to-black/30 rounded-lg p-4 border border-green-500/20">
                    <h4 className="text-lg font-semibold text-white mb-2">{technique.name}</h4>
                    <p className="text-green-100 text-sm mb-3">{technique.description}</p>
                    <div className="space-y-2">
                      {technique.scripts.map((script, idx) => (
                        <div key={idx} className="bg-black/30 rounded p-2">
                          <p className="text-emerald-100 text-sm italic">"{script}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  {agentScripts.salesPsychology.objectionFramework.title}
                </CardTitle>
                <CardDescription className="text-blue-200">
                  {agentScripts.salesPsychology.objectionFramework.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  {agentScripts.salesPsychology.objectionFramework.steps.map((step) => (
                    <div key={step.step} className="bg-gradient-to-b from-blue-900/30 to-black/30 rounded-lg p-4 border border-blue-500/20 text-center">
                      <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl font-bold text-blue-300">{step.step}</span>
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2">{step.name}</h4>
                      <p className="text-blue-100 text-sm mb-3">{step.description}</p>
                      <div className="bg-black/30 rounded p-2">
                        <p className="text-emerald-100 text-xs italic">"{step.example}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-400" />
                  Emotional Triggers
                </CardTitle>
                <CardDescription className="text-pink-200">
                  Tap into the emotions that drive buying decisions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-5 gap-3">
                  {agentScripts.salesPsychology.emotionalTriggers.map((item) => (
                    <div key={item.trigger} className="bg-gradient-to-br from-pink-900/30 to-black/30 rounded-lg p-3 border border-pink-500/20">
                      <h4 className="font-semibold text-white mb-2">{item.trigger}</h4>
                      <p className="text-emerald-100 text-xs italic">"{item.script}"</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
