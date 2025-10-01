import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface ClaimLetter {
  subject: string;
  body: string;
  supportingData: string[];
  tone: "professional" | "assertive" | "diplomatic";
}

export interface MarketAnalysis {
  averagePayout: number;
  comparableData: ComparableData[];
  recommendation: string;
  confidenceLevel: number;
}

export interface ComparableData {
  claimId: string;
  insuranceCompany: string;
  payout: number;
  similarity: number;
  location: string;
  date: Date;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

export interface ImageAnalysis {
  damageDescription: string;
  severity: "minor" | "moderate" | "severe" | "catastrophic";
  estimatedCost: number;
  recommendations: string[];
  confidence: number;
}

export class AIService {
  async generateClaimLetter(params: {
    claimNumber: string;
    insuranceCompany: string;
    claimType: string;
    requestedAmount: number;
    marketData: any[];
    tone?: "professional" | "assertive" | "diplomatic";
    language?: string;
  }): Promise<ClaimLetter> {
    try {
      const prompt = `Generate a professional claim dispute letter with the following details:
      
      Claim Number: ${params.claimNumber}
      Insurance Company: ${params.insuranceCompany}
      Claim Type: ${params.claimType}
      Requested Amount: $${params.requestedAmount}
      Tone: ${params.tone || "professional"}
      
      Market Data: ${JSON.stringify(params.marketData)}
      
      Include specific references to similar claims and market rates. Format as JSON with 'subject', 'body', 'supportingData' (array), and 'tone' fields.`;

      const response = await openai.responses.create({
        model: "gpt-5",
        input: [
          {
            role: "system",
            content: "You are an expert insurance claim adjuster and legal writer specializing in construction and storm damage claims. Generate professional dispute letters with strong supporting evidence. Return only valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const result = JSON.parse(response.output_text || "{}");
      
      return {
        subject: result.subject || "Claim Dispute - Additional Compensation Request",
        body: result.body || "Professional letter content would be generated here.",
        supportingData: result.supportingData || [],
        tone: params.tone || "professional"
      };
    } catch (error) {
      console.error('Error generating claim letter:', error);
      throw new Error('Failed to generate claim letter');
    }
  }

  async analyzeMarketComparables(params: {
    claimType: string;
    region: string;
    damageAmount: number;
    insuranceCompany: string;
    historicalData: any[];
  }): Promise<MarketAnalysis> {
    try {
      const prompt = `Analyze market comparables for insurance claims with these parameters:
      
      Claim Type: ${params.claimType}
      Region: ${params.region}
      Damage Amount: $${params.damageAmount}
      Insurance Company: ${params.insuranceCompany}
      
      Historical Data: ${JSON.stringify(params.historicalData)}
      
      Provide analysis in JSON format with 'averagePayout', 'comparableData' (array), 'recommendation', and 'confidenceLevel' (0-1).`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert insurance market analyst. Analyze claim data to provide accurate market comparables and recommendations for claim negotiations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        averagePayout: result.averagePayout || params.damageAmount,
        comparableData: result.comparableData || [],
        recommendation: result.recommendation || "Insufficient data for analysis",
        confidenceLevel: result.confidenceLevel || 0.5
      };
    } catch (error) {
      console.error('Error analyzing market comparables:', error);
      throw new Error('Failed to analyze market data');
    }
  }

  async translateText(text: string, targetLanguage: string = "es"): Promise<TranslationResult> {
    try {
      const prompt = `Translate the following text to ${targetLanguage === "es" ? "Spanish" : "English"}, maintaining professional insurance/construction terminology:
      
      Text: ${text}
      
      Respond in JSON format with 'originalText', 'translatedText', 'sourceLanguage', 'targetLanguage', and 'confidence' (0-1).`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional translator specializing in insurance and construction industry terminology. Provide accurate, contextually appropriate translations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        originalText: text,
        translatedText: result.translatedText || text,
        sourceLanguage: result.sourceLanguage || "en",
        targetLanguage: targetLanguage,
        confidence: result.confidence || 0.8
      };
    } catch (error) {
      console.error('Error translating text:', error);
      throw new Error('Failed to translate text');
    }
  }

  async analyzeDamageImage(imageBase64: string): Promise<ImageAnalysis> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert property damage assessor. Analyze images for insurance claims and provide detailed, objective assessments suitable for claim documentation."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this damage image and provide a detailed assessment in JSON format with 'damageDescription', 'severity' (minor/moderate/severe/catastrophic), 'estimatedCost', 'recommendations' (array), and 'confidence' (0-1)."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        damageDescription: result.damageDescription || "Damage assessment could not be completed",
        severity: result.severity || "moderate",
        estimatedCost: result.estimatedCost || 0,
        recommendations: result.recommendations || [],
        confidence: result.confidence || 0.7
      };
    } catch (error) {
      console.error('Error analyzing damage image:', error);
      throw new Error('Failed to analyze damage image');
    }
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<{ text: string; duration: number }> {
    try {
      // Create a temporary file-like object from buffer
      const audioFile = new File([audioBuffer], "audio.mp3", { type: "audio/mpeg" });
      
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1"
      });

      return {
        text: transcription.text,
        duration: 0 // Duration would need to be calculated separately
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  async generateScopeNotes(params: {
    damageType: string;
    location: string;
    treeSpecies?: string;
    dbh?: number;
    craneNeeded?: boolean;
    accessNotes?: string;
  }): Promise<string> {
    try {
      const prompt = `Generate professional Xactimate scope notes for:
      
      Damage Type: ${params.damageType}
      Location: ${params.location}
      Tree Species: ${params.treeSpecies || "Unknown"}
      DBH: ${params.dbh || "Not specified"} inches
      Crane Required: ${params.craneNeeded ? "Yes" : "No"}
      Access Notes: ${params.accessNotes || "Standard access"}
      
      Format as professional scope notes suitable for Xactimate entry.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert Xactimate estimator specializing in storm damage and tree removal. Generate professional, detailed scope notes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4
      });

      return response.choices[0].message.content || "Scope notes could not be generated";
    } catch (error) {
      console.error('Error generating scope notes:', error);
      throw new Error('Failed to generate scope notes');
    }
  }
}

export const aiService = new AIService();
