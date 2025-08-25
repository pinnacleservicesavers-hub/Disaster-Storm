import { aiService } from './ai.js';

export interface Translation {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  context: string;
}

export interface BilingualContent {
  english: string;
  spanish: string;
  context: string;
}

export class TranslationService {
  private supportedLanguages = ['en', 'es'];
  private industryTerms: Map<string, Map<string, string>> = new Map();

  constructor() {
    this.initializeIndustryTerms();
  }

  private initializeIndustryTerms() {
    // Initialize construction/insurance industry terminology
    const enToEs = new Map([
      ['claim', 'reclamo'],
      ['deductible', 'deducible'],
      ['adjuster', 'ajustador'],
      ['estimate', 'estimación'],
      ['damage', 'daño'],
      ['liability', 'responsabilidad'],
      ['contractor', 'contratista'],
      ['tree removal', 'remoción de árboles'],
      ['storm damage', 'daño por tormenta'],
      ['insurance company', 'compañía de seguros'],
      ['policy', 'póliza'],
      ['coverage', 'cobertura'],
      ['roof damage', 'daño del techo'],
      ['emergency services', 'servicios de emergencia'],
      ['crane access', 'acceso de grúa'],
      ['debris removal', 'remoción de escombros'],
      ['tarp installation', 'instalación de lona'],
      ['water damage', 'daño por agua'],
      ['wind damage', 'daño por viento'],
      ['hail damage', 'daño por granizo']
    ]);

    this.industryTerms.set('en-es', enToEs);

    // Reverse mapping for Spanish to English
    const esToEn = new Map();
    enToEs.forEach((spanish, english) => {
      esToEn.set(spanish, english);
    });
    this.industryTerms.set('es-en', esToEn);
  }

  async translateText(
    text: string, 
    targetLanguage: string, 
    context: string = 'general'
  ): Promise<Translation> {
    try {
      // Detect source language
      const sourceLanguage = await this.detectLanguage(text);
      
      if (sourceLanguage === targetLanguage) {
        return {
          originalText: text,
          translatedText: text,
          sourceLanguage,
          targetLanguage,
          confidence: 1.0,
          context
        };
      }

      // Use AI service for translation with industry context
      const aiResult = await aiService.translateText(text, targetLanguage);
      
      // Post-process with industry terminology
      const enhancedTranslation = this.enhanceWithIndustryTerms(
        aiResult.translatedText,
        sourceLanguage,
        targetLanguage
      );

      return {
        originalText: text,
        translatedText: enhancedTranslation,
        sourceLanguage,
        targetLanguage,
        confidence: aiResult.confidence,
        context
      };
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Failed to translate text');
    }
  }

  async translateClaimContent(content: {
    title: string;
    description: string;
    notes?: string;
  }, targetLanguage: string): Promise<{
    title: string;
    description: string;
    notes?: string;
  }> {
    try {
      const titleTranslation = await this.translateText(content.title, targetLanguage, 'claim_title');
      const descriptionTranslation = await this.translateText(content.description, targetLanguage, 'claim_description');
      
      let notesTranslation;
      if (content.notes) {
        notesTranslation = await this.translateText(content.notes, targetLanguage, 'claim_notes');
      }

      return {
        title: titleTranslation.translatedText,
        description: descriptionTranslation.translatedText,
        notes: notesTranslation?.translatedText
      };
    } catch (error) {
      console.error('Error translating claim content:', error);
      throw new Error('Failed to translate claim content');
    }
  }

  async getBilingualContent(englishText: string, context: string = 'general'): Promise<BilingualContent> {
    try {
      const spanishTranslation = await this.translateText(englishText, 'es', context);
      
      return {
        english: englishText,
        spanish: spanishTranslation.translatedText,
        context
      };
    } catch (error) {
      console.error('Error creating bilingual content:', error);
      return {
        english: englishText,
        spanish: englishText, // Fallback to original text
        context
      };
    }
  }

  async translateFieldReport(report: any, targetLanguage: string): Promise<any> {
    try {
      const translatedReport = { ...report };
      
      if (report.description) {
        const descTranslation = await this.translateText(report.description, targetLanguage, 'field_report');
        translatedReport.description = descTranslation.translatedText;
      }

      if (report.damageAssessment) {
        const assessmentTranslation = await this.translateText(report.damageAssessment, targetLanguage, 'damage_assessment');
        translatedReport.damageAssessment = assessmentTranslation.translatedText;
      }

      if (report.safetyNotes) {
        const safetyTranslation = await this.translateText(report.safetyNotes, targetLanguage, 'safety_notes');
        translatedReport.safetyNotes = safetyTranslation.translatedText;
      }

      return translatedReport;
    } catch (error) {
      console.error('Error translating field report:', error);
      return report; // Return original on error
    }
  }

  private async detectLanguage(text: string): Promise<string> {
    // Simple language detection - in production would use a proper language detection service
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'una', 'está', 'muy', 'todo', 'pero', 'más', 'hacer', 'ser', 'como', 'tener', 'daño', 'reclamo', 'seguros'];
    
    const words = text.toLowerCase().split(/\s+/);
    const spanishWordCount = words.filter(word => spanishWords.includes(word)).length;
    
    return spanishWordCount > words.length * 0.3 ? 'es' : 'en';
  }

  private enhanceWithIndustryTerms(
    translatedText: string, 
    sourceLanguage: string, 
    targetLanguage: string
  ): string {
    const termMapKey = `${sourceLanguage}-${targetLanguage}`;
    const termMap = this.industryTerms.get(termMapKey);
    
    if (!termMap) return translatedText;

    let enhancedText = translatedText;
    
    // Apply industry-specific terminology
    termMap.forEach((targetTerm, sourceTerm) => {
      const regex = new RegExp(`\\b${sourceTerm}\\b`, 'gi');
      enhancedText = enhancedText.replace(regex, targetTerm);
    });

    return enhancedText;
  }

  getSupportedLanguages(): string[] {
    return [...this.supportedLanguages];
  }

  async getPreTranslatedPhrases(context: string = 'general'): Promise<Record<string, BilingualContent>> {
    // Common phrases used in the application
    const phrases = {
      'new_claim': 'New Claim',
      'export_report': 'Export Report',
      'active_claims': 'Active Claims',
      'total_payouts': 'Total Payouts',
      'storm_alerts': 'Storm Alerts',
      'success_rate': 'Success Rate',
      'live_weather_radar': 'Live Weather Radar',
      'market_comparables': 'AI Market Comparables',
      'insurance_payout_tracker': 'Insurance Company Payout Tracker',
      'legal_compliance': 'Legal Compliance',
      'live_drone_footage': 'Live Drone Footage',
      'field_reports': 'Field Reports',
      'urgent_priority': 'Urgent',
      'high_priority': 'High Priority',
      'normal_priority': 'Normal Priority',
      'low_priority': 'Low Priority'
    };

    const bilingualPhrases: Record<string, BilingualContent> = {};
    
    for (const [key, englishText] of Object.entries(phrases)) {
      bilingualPhrases[key] = await this.getBilingualContent(englishText, context);
    }

    return bilingualPhrases;
  }
}

export const translationService = new TranslationService();
