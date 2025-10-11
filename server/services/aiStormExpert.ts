import OpenAI from 'openai';
import type { StormPrediction } from '@shared/schema';

export interface LightningBurstAnalysis {
  detected: boolean;
  burstIntensity: number;
  location: string;
  whatItMeans: string;
  whyItMatters: string;
  insiderKnowledge: string[];
  actionRequired: string;
  educationalDeepDive: string;
}

export interface TripwireStatus {
  id: number;
  name: string;
  active: boolean;
  status: 'green' | 'yellow' | 'orange' | 'red';
  whatToLookFor: string;
  whatItReallyMeans: string;
  currentReading: string;
  actionRequired: string;
  insiderTips: string[];
  educationalExplanation: string;
}

export interface AIStormPrediction {
  predictedLandfall: {
    location: string;
    coordinates: { lat: number; lng: number };
    confidence: number;
    timing: string;
    reasoning: string;
  };
  pathAnalysis: {
    currentTrack: string;
    expectedPath: string;
    wildcardScenarios: string[];
    steeringFactors: string[];
  };
  insiderSecrets: string[];
  educationalDeepDive: string;
}

export class AIStormExpertService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('🌪️ AI Storm Expert initialized - Educational meteorology analysis active');
  }

  /**
   * Analyze GLM lightning burst data and explain what pros know
   */
  async analyzeGLMLightningBurst(stormData: any): Promise<LightningBurstAnalysis> {
    const prompt = `You are a veteran hurricane forecaster teaching contractors the insider secrets of storm analysis.

Analyze this GLM (Geostationary Lightning Mapper) lightning data:
Storm: ${stormData.stormName}
Lightning Burst Detected: ${stormData.lightningBurst || 'Yes - inside eye-core'}
Intensity: ${stormData.burstIntensity || 'High'}
Location: ${stormData.location || 'Near eye wall'}

Explain in simple contractor terms:
1. What this lightning burst means (keep it simple)
2. Why this is CRITICAL and what will happen next
3. What MOST PEOPLE DON'T KNOW about eye-wall lightning bursts
4. The insider secret pros use to predict rapid intensification
5. What action contractors should take RIGHT NOW

Make it educational but urgent. Reveal the secrets meteorologists know but don't always share.

Return as JSON with keys: whatItMeans, whyItMatters, insiderKnowledge (array of 3-5 secrets), actionRequired, educationalDeepDive`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert hurricane forecaster who teaches contractors the insider secrets of meteorology. You explain complex weather phenomena in simple terms while revealing what professionals quietly watch. You are educational, clear, and reveal knowledge most people never learn.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');

    return {
      detected: true,
      burstIntensity: stormData.burstIntensity || 85,
      location: stormData.location || 'Eye-core',
      whatItMeans: analysis.whatItMeans || '',
      whyItMatters: analysis.whyItMatters || '',
      insiderKnowledge: analysis.insiderKnowledge || [],
      actionRequired: analysis.actionRequired || '',
      educationalDeepDive: analysis.educationalDeepDive || ''
    };
  }

  /**
   * Analyze all 7 tripwires with educational explanations
   */
  async analyzeTripwires(stormData: any): Promise<TripwireStatus[]> {
    const tripwireDefinitions = [
      {
        id: 1,
        name: 'Lightning Burst Inside Eye-Core',
        whatToLookFor: 'Lightning burst inside the eye-core (GOES GLM or lightning-density maps)',
        whatItReallyMeans: 'Strong inner-core convection forming → central pressure likely to drop 10–20 mb in 6–12 h'
      },
      {
        id: 2,
        name: 'Perfectly Round Eye on Satellite',
        whatToLookFor: 'Perfectly round, well-defined eye on visible/IR satellite',
        whatItReallyMeans: 'Storm structure tightening → likely rapid intensification'
      },
      {
        id: 3,
        name: 'Sea-Surface Height Anomaly',
        whatToLookFor: 'Sea-surface height anomaly > +0.25 m under track (warm-eddy signature)',
        whatItReallyMeans: 'Deep ocean heat → storm can sustain stronger winds'
      },
      {
        id: 4,
        name: 'Low Wind Shear with Clear Outflow',
        whatToLookFor: 'Shear < 10 kt with clear NE outflow tail on satellite upper-level winds',
        whatItReallyMeans: 'Storm "venting" efficiently → intensity jump likely'
      },
      {
        id: 5,
        name: 'Unexpected Westward Track',
        whatToLookFor: 'Track bends WNW instead of NW → N on official cone',
        whatItReallyMeans: 'Ridge holding stronger → storm tracks closer to Caribbean or Bahamas'
      },
      {
        id: 6,
        name: 'Heavy Outer-Band Rainfall',
        whatToLookFor: 'Outer-band rainfall > 2 in/hr on radar near affected areas',
        whatItReallyMeans: 'Moist inflow robust → heavy flooding risk'
      },
      {
        id: 7,
        name: 'Mid-Level Dry Air Intrusion',
        whatToLookFor: 'Mid-level dry air intrusion on water-vapor imagery',
        whatItReallyMeans: 'Dry air entering core → weakening trend'
      }
    ];

    const analyses: TripwireStatus[] = [];

    for (const tripwire of tripwireDefinitions) {
      const prompt = `You are teaching contractors about hurricane tripwire #${tripwire.id}: "${tripwire.name}"

What to look for: ${tripwire.whatToLookFor}
What it really means: ${tripwire.whatItReallyMeans}

Current storm data: ${JSON.stringify(stormData)}

Provide:
1. Is this tripwire currently ACTIVE? (true/false)
2. Current reading/status
3. Action required (GREEN/YELLOW/ORANGE/RED)
4. 3-5 INSIDER TIPS that most people don't know about this indicator
5. Educational explanation in simple contractor terms

Reveal the secrets professionals use. What do meteorologists quietly watch that the public doesn't know about?

Return as JSON with keys: active, currentReading, action, insiderTips (array), educationalExplanation`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert meteorologist teaching contractors insider knowledge about hurricane forecasting. Explain what professionals quietly watch and why it matters.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      analyses.push({
        id: tripwire.id,
        name: tripwire.name,
        active: analysis.active || false,
        status: this.determineStatus(analysis.action),
        whatToLookFor: tripwire.whatToLookFor,
        whatItReallyMeans: tripwire.whatItReallyMeans,
        currentReading: analysis.currentReading || 'Monitoring',
        actionRequired: analysis.action || 'MONITOR',
        insiderTips: analysis.insiderTips || [],
        educationalExplanation: analysis.educationalExplanation || ''
      });
    }

    return analyses;
  }

  /**
   * AI prediction of landfall location and path based on data
   */
  async predictLandfallAndPath(stormData: any): Promise<AIStormPrediction> {
    const prompt = `You are an expert hurricane forecaster making a landfall prediction based on real data.

Storm: ${stormData.stormName || 'Current Storm'}
Current Position: ${stormData.latitude}, ${stormData.longitude}
Movement: ${stormData.movementDirection} at ${stormData.movementSpeed} mph
Current Intensity: ${stormData.windSpeed} mph winds
Pressure: ${stormData.centralPressure} mb

Available Data:
- Sea surface temperatures: ${stormData.sst || 'Above normal'}
- Wind shear: ${stormData.windShear || 'Low'}
- Steering currents: ${stormData.steeringFlow || 'Ridge to north, trough approaching'}
- Model consensus: ${stormData.modelConsensus || 'Mixed'}

Provide YOUR AI PREDICTION:
1. Where will this storm make landfall? (specific location with coordinates)
2. When? (timing estimate)
3. What path will it take? (detailed)
4. What are the wildcard scenarios that could change everything?
5. What steering factors are most important?
6. What are 5-7 INSIDER SECRETS about hurricane track forecasting that most people don't know?
7. Educational deep dive: Teach contractors how YOU analyze this data

Be specific. Make a prediction. Explain your reasoning. Reveal professional secrets.

Return as JSON with keys: predictedLandfall (object with location, coordinates, confidence, timing, reasoning), pathAnalysis (object with currentTrack, expectedPath, wildcardScenarios array, steeringFactors array), insiderSecrets (array of 5-7), educationalDeepDive`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a veteran hurricane forecaster making landfall predictions. You analyze data like a pro and teach contractors the insider knowledge meteorologists use to predict storm paths. You make specific predictions and explain your reasoning clearly.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  /**
   * Continuous educational deep-dive analysis
   */
  async generateContinuousInsights(stormData: any, previousInsights: string[] = []): Promise<string[]> {
    const prompt = `You are teaching contractors deeper and deeper insights about hurricane ${stormData.stormName}.

Previous insights already shared: ${previousInsights.join('; ')}

Generate 5 NEW insider secrets and educational facts about:
- What professionals quietly watch
- Hidden indicators most people miss
- Advanced forecasting techniques
- Why certain data matters more than others
- Prediction tricks meteorologists use
- What the models won't tell you
- Real-world experience from major storms

Make each insight unique and reveal something most people DON'T KNOW. Go deeper each time.

Return as JSON with key: insights (array of 5 new educational points)`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a master hurricane forecaster revealing the deepest insider knowledge. Each insight should teach contractors something new that even weather enthusiasts might not know. You go progressively deeper with each analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.insights || [];
  }

  /**
   * Explain what's happening RIGHT NOW in simple terms
   */
  async explainCurrentSituation(stormData: any): Promise<string> {
    const prompt = `Explain what's happening RIGHT NOW with ${stormData.stormName} in simple contractor terms.

Current data:
${JSON.stringify(stormData, null, 2)}

Create a clear, urgent, educational explanation that:
1. Says what's happening right now
2. Explains why it matters
3. Reveals what pros are watching
4. Tells them what action to take
5. Teaches them something new

Keep it under 200 words but pack it with insider knowledge.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a hurricane expert giving contractors a real-time briefing. Be clear, urgent, and educational. Reveal insider knowledge.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    return response.choices[0].message.content || '';
  }

  private determineStatus(action: string): 'green' | 'yellow' | 'orange' | 'red' {
    const actionUpper = action.toUpperCase();
    if (actionUpper.includes('GO') || actionUpper.includes('RED')) return 'red';
    if (actionUpper.includes('CAUTION') || actionUpper.includes('ORANGE')) return 'orange';
    if (actionUpper.includes('PREPARE') || actionUpper.includes('YELLOW')) return 'yellow';
    return 'green';
  }
}

export const aiStormExpert = new AIStormExpertService();
