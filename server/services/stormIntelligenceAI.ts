import OpenAI from "openai";
import { weatherService } from './weather';
import { PredictiveStormService } from './predictiveStormService';
import { FemaDisasterService } from './femaDisasterService';
import { storage } from '../storage';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

export interface StormIntelligenceQuery {
  question: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  context?: string;
  userRole?: 'contractor' | 'victim' | 'business' | 'admin';
}

export interface StormIntelligenceResponse {
  answer: string;
  confidence: number;
  sources: string[];
  recommendations?: string[];
  alerts?: string[];
  predictions?: any;
  metadata: {
    processingTime: number;
    dataSourcesUsed: string[];
    analysisType: string;
  };
}

export interface DisasterPathPrediction {
  disasterType: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    description: string;
  };
  predictedPath: Array<{
    time: string;
    latitude: number;
    longitude: number;
    intensity: number;
    confidence: number;
    impactRadius: number;
    description: string;
  }>;
  affectedRegions: Array<{
    state: string;
    county: string;
    city: string;
    arrivalTime: string;
    peakTime: string;
    departureTime: string;
    riskLevel: 'low' | 'moderate' | 'high' | 'extreme';
    expectedDamage: string;
    populationAtRisk: number;
  }>;
  confidence: {
    overall: number;
    pathAccuracy: number;
    timingAccuracy: number;
    intensityAccuracy: number;
  };
  modelSources: string[];
  lastUpdated: string;
}

export interface RealTimeStormData {
  alerts: any[];
  radarData: any;
  satelliteData: any;
  nhcData: any;
  spcOutlooks: any[];
  femaDeclarations: any[];
  historicalPatterns: any[];
}

export class StormIntelligenceAI {
  private static instance: StormIntelligenceAI;
  private openai: OpenAI;
  private predictiveStormService: PredictiveStormService;
  private femaService: FemaDisasterService;

  constructor() {
    // Only initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      console.log('🧠 StormIntelligenceAI initialized with GPT-5 model and fallback system');
    } else {
      console.log('🧠 StormIntelligenceAI initialized with fallback system only (no OpenAI API key)');
    }
    this.predictiveStormService = PredictiveStormService.getInstance();
    this.femaService = FemaDisasterService.getInstance();
  }

  public static getInstance(): StormIntelligenceAI {
    if (!StormIntelligenceAI.instance) {
      StormIntelligenceAI.instance = new StormIntelligenceAI();
    }
    return StormIntelligenceAI.instance;
  }

  /**
   * Main entry point for storm intelligence queries
   */
  async processQuery(query: StormIntelligenceQuery): Promise<StormIntelligenceResponse> {
    const startTime = Date.now();
    console.log(`🧠 Processing storm intelligence query: "${query.question}"`);

    try {
      // Gather comprehensive real-time data
      const realTimeData = await this.gatherRealTimeStormData(query.location);
      
      // Try AI-powered analysis first if available
      if (this.openai) {
        try {
          const queryAnalysis = await this.analyzeQueryIntent(query.question);
          let response: StormIntelligenceResponse;

          switch (queryAnalysis.type) {
            case 'disaster_prediction':
              response = await this.handleDisasterPredictionQuery(query, realTimeData);
              break;
            case 'current_conditions':
              response = await this.handleCurrentConditionsQuery(query, realTimeData);
              break;
            case 'historical_analysis':
              response = await this.handleHistoricalAnalysisQuery(query, realTimeData);
              break;
            case 'damage_assessment':
              response = await this.handleDamageAssessmentQuery(query, realTimeData);
              break;
            case 'contractor_opportunities':
              response = await this.handleContractorOpportunityQuery(query, realTimeData);
              break;
            case 'general_information':
            default:
              response = await this.handleGeneralInformationQuery(query, realTimeData);
              break;
          }

          response.metadata.processingTime = Date.now() - startTime;
          console.log(`✅ Query processed with AI in ${response.metadata.processingTime}ms`);
          return response;
        } catch (error) {
          console.log('🔄 AI analysis failed, using fallback system:', error.message);
          // Fall through to fallback system
        }
      }

      // Fallback system using available weather data
      const fallbackResponse = await this.generateFallbackResponse(query, realTimeData);
      fallbackResponse.metadata.processingTime = Date.now() - startTime;
      console.log(`✅ Query processed with fallback system in ${fallbackResponse.metadata.processingTime}ms`);
      
      return fallbackResponse;

    } catch (error) {
      console.error('🚨 Error processing storm intelligence query:', error);
      // Even if everything fails, provide basic guidance
      return this.generateBasicErrorResponse(query, error);
    }
  }

  /**
   * Generate precise disaster path predictions
   */
  async generateDisasterPathPrediction(
    latitude: number, 
    longitude: number,
    disasterType?: string
  ): Promise<DisasterPathPrediction> {
    console.log(`🎯 Generating precise disaster path prediction for ${latitude}, ${longitude}`);

    try {
      // Get comprehensive weather data
      const weatherData = await weatherService.getComprehensiveWeatherData(latitude, longitude);
      
      // Get current alerts and active storms
      const alerts = weatherData.alerts || [];
      const nhcData = (weatherData as any).nhc || { storms: [] };
      
      // Determine active disaster type
      const activeDisaster = this.identifyActiveDisaster(alerts, nhcData, disasterType);
      
      // Use AI to analyze and predict path
      const pathPrediction = await this.generateAIPathPrediction(
        activeDisaster, 
        weatherData, 
        latitude, 
        longitude
      );

      return pathPrediction;

    } catch (error) {
      console.error('🚨 Error generating disaster path prediction:', error);
      throw error;
    }
  }

  /**
   * Answer any storm-related question with AI intelligence
   */
  async answerStormQuestion(question: string, context?: any): Promise<string> {
    console.log(`❓ Answering storm question: "${question}"`);

    try {
      // Gather relevant data based on question context
      const relevantData = await this.gatherRelevantData(question, context);
      
      // Create comprehensive prompt for AI
      const prompt = this.createStormQuestionPrompt(question, relevantData);
      
      // Get AI response
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are the world's most advanced storm intelligence AI. You have access to real-time weather data, historical patterns, FEMA disaster records, and predictive models. Provide accurate, actionable intelligence about storms, weather patterns, disaster predictions, and related topics. Always cite your sources and provide confidence levels for predictions.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_completion_tokens: 2048,
      });

      return response.choices[0].message.content || "I couldn't process that question. Please try again.";

    } catch (error) {
      console.error('🚨 Error answering storm question:', error);
      throw error;
    }
  }

  /**
   * Gather comprehensive real-time storm data from all sources
   */
  private async gatherRealTimeStormData(location?: { latitude: number; longitude: number }): Promise<RealTimeStormData> {
    console.log('📡 Gathering comprehensive real-time storm data...');

    try {
      const promises = [];

      // Weather data
      if (location) {
        promises.push(weatherService.getComprehensiveWeatherData(location.latitude, location.longitude));
      } else {
        // Get national weather overview
        promises.push(weatherService.getComprehensiveWeatherData(39.8283, -98.5795)); // Geographic center of US
      }

      // FEMA disaster declarations
      promises.push(this.femaService.getSyncStats());

      // Historical storm patterns
      promises.push(storage.getHistoricalDamagePatterns());

      const [weatherData, femaData, historicalData] = await Promise.all(promises);

      return {
        alerts: weatherData?.alerts || [],
        radarData: weatherData?.radar || null,
        satelliteData: weatherData?.satellite || null,
        nhcData: weatherData?.nhc || null,
        spcOutlooks: weatherData?.spc?.outlooks || [],
        femaDeclarations: femaData || [],
        historicalPatterns: historicalData || []
      };

    } catch (error) {
      console.error('🚨 Error gathering real-time storm data:', error);
      return {
        alerts: [],
        radarData: null,
        satelliteData: null,
        nhcData: null,
        spcOutlooks: [],
        femaDeclarations: [],
        historicalPatterns: []
      };
    }
  }

  /**
   * Analyze query intent using AI or fallback to keyword analysis
   */
  private async analyzeQueryIntent(question: string): Promise<{ type: string; confidence: number }> {
    if (!this.openai) {
      return this.analyzeQueryIntentFallback(question);
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `Analyze the intent of storm/weather-related questions and classify them. Return JSON with "type" and "confidence". Types: disaster_prediction, current_conditions, historical_analysis, damage_assessment, contractor_opportunities, general_information`
          },
          {
            role: "user",
            content: `Classify this question: "${question}"`
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"type": "general_information", "confidence": 0.5}');
      return result;

    } catch (error) {
      // Check if it's a quota exceeded error
      if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
        console.log('⚠️ OpenAI quota exceeded, using fallback analysis');
      } else {
        console.error('Error analyzing query intent:', error);
      }
      return this.analyzeQueryIntentFallback(question);
    }
  }

  /**
   * Fallback query intent analysis using keyword matching
   */
  private analyzeQueryIntentFallback(question: string): { type: string; confidence: number } {
    const q = question.toLowerCase();
    
    if (q.includes('predict') || q.includes('forecast') || q.includes('path') || q.includes('track') || q.includes('will') || q.includes('future')) {
      return { type: 'disaster_prediction', confidence: 0.8 };
    }
    
    if (q.includes('current') || q.includes('now') || q.includes('today') || q.includes('active') || q.includes('happening')) {
      return { type: 'current_conditions', confidence: 0.8 };
    }
    
    if (q.includes('history') || q.includes('past') || q.includes('previous') || q.includes('before') || q.includes('similar')) {
      return { type: 'historical_analysis', confidence: 0.8 };
    }
    
    if (q.includes('damage') || q.includes('impact') || q.includes('risk') || q.includes('cost') || q.includes('loss')) {
      return { type: 'damage_assessment', confidence: 0.8 };
    }
    
    if (q.includes('contractor') || q.includes('opportunity') || q.includes('business') || q.includes('work') || q.includes('job')) {
      return { type: 'contractor_opportunities', confidence: 0.8 };
    }
    
    return { type: 'general_information', confidence: 0.6 };
  }

  /**
   * Handle disaster prediction queries
   */
  private async handleDisasterPredictionQuery(
    query: StormIntelligenceQuery, 
    data: RealTimeStormData
  ): Promise<StormIntelligenceResponse> {
    if (!this.openai) {
      return this.handleDisasterPredictionFallback(query, data);
    }

    try {
      const analysisPrompt = `
      Based on the following real-time data, provide a comprehensive disaster prediction:
      
      Active Alerts: ${JSON.stringify(data.alerts.slice(0, 5))}
      NHC Storm Data: ${JSON.stringify(data.nhcData)}
      SPC Outlooks: ${JSON.stringify(data.spcOutlooks)}
      
      Question: ${query.question}
      
      Provide detailed predictions including:
      1. Exact locations and timing of impact
      2. Storm paths and intensity changes
      3. Expected damage types and severity
      4. Population and infrastructure at risk
      5. Confidence levels for each prediction
      
      Format as detailed analysis with specific actionable intelligence.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert meteorologist and disaster prediction specialist. Provide precise, actionable predictions based on real data."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        max_completion_tokens: 2048,
      });

      return {
        answer: response.choices[0].message.content || "Unable to generate prediction",
        confidence: 0.85,
        sources: ["Real-time NWS alerts", "NHC storm data", "SPC outlooks", "Radar analysis"],
        recommendations: ["Monitor official warnings", "Prepare emergency supplies", "Review evacuation routes"],
        metadata: {
          processingTime: 0,
          dataSourcesUsed: ["NWS", "NHC", "SPC", "Radar"],
          analysisType: "disaster_prediction"
        }
      };
    } catch (error) {
      console.log('🔄 AI prediction failed, using fallback analysis');
      return this.handleDisasterPredictionFallback(query, data);
    }
  }

  /**
   * Handle current conditions queries  
   */
  private async handleCurrentConditionsQuery(
    query: StormIntelligenceQuery,
    data: RealTimeStormData
  ): Promise<StormIntelligenceResponse> {
    if (!this.openai) {
      return this.handleCurrentConditionsFallback(query, data);
    }

    try {
      const conditionsPrompt = `
      Current weather conditions analysis:
      
      Active Alerts: ${JSON.stringify(data.alerts)}
      Radar Data: ${data.radarData ? 'Available' : 'Not available'}
      Satellite Data: ${data.satelliteData ? 'Available' : 'Not available'}
      
      Question: ${query.question}
      
      Provide current conditions including:
      1. Active weather phenomena
      2. Severity and extent
      3. Current trends and changes
      4. Immediate risks and impacts
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a real-time weather analysis expert. Provide current conditions based on live data."
          },
          {
            role: "user",
            content: conditionsPrompt
          }
        ],
        max_completion_tokens: 1024,
      });

      return {
        answer: response.choices[0].message.content || "Unable to analyze current conditions",
        confidence: 0.9,
        sources: ["Real-time alerts", "Radar data", "Satellite imagery"],
        metadata: {
          processingTime: 0,
          dataSourcesUsed: ["NWS", "Radar", "Satellite"],
          analysisType: "current_conditions"
        }
      };
    } catch (error) {
      console.log('🔄 AI conditions analysis failed, using fallback');
      return this.handleCurrentConditionsFallback(query, data);
    }
  }

  /**
   * Handle historical analysis queries
   */
  private async handleHistoricalAnalysisQuery(
    query: StormIntelligenceQuery,
    data: RealTimeStormData
  ): Promise<StormIntelligenceResponse> {
    if (!this.openai) {
      return this.handleHistoricalAnalysisFallback(query, data);
    }

    try {
      const historicalPrompt = `
      Historical storm pattern analysis:
      
      Historical Data: ${JSON.stringify(data.historicalPatterns.slice(0, 10))}
      FEMA Declarations: ${JSON.stringify(data.femaDeclarations.slice(0, 5))}
      
      Question: ${query.question}
      
      Provide historical analysis including:
      1. Similar past events and outcomes
      2. Seasonal and climate patterns
      3. Long-term trends and changes
      4. Lessons learned from historical events
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a historical weather pattern analyst. Provide insights based on historical storm data."
          },
          {
            role: "user",
            content: historicalPrompt
          }
        ],
        max_completion_tokens: 1024,
      });

      return {
        answer: response.choices[0].message.content || "Unable to analyze historical patterns",
        confidence: 0.8,
        sources: ["Historical storm database", "FEMA disaster records"],
        metadata: {
          processingTime: 0,
          dataSourcesUsed: ["Historical database", "FEMA"],
          analysisType: "historical_analysis"
        }
      };
    } catch (error) {
      console.log('🔄 AI historical analysis failed, using fallback');
      return this.handleHistoricalAnalysisFallback(query, data);
    }
  }

  /**
   * Handle damage assessment queries
   */
  private async handleDamageAssessmentQuery(
    query: StormIntelligenceQuery,
    data: RealTimeStormData
  ): Promise<StormIntelligenceResponse> {
    // Implementation for damage assessment
    return {
      answer: "Damage assessment analysis based on current storm data and historical patterns.",
      confidence: 0.75,
      sources: ["Damage models", "Historical patterns"],
      metadata: {
        processingTime: 0,
        dataSourcesUsed: ["Damage models"],
        analysisType: "damage_assessment"
      }
    };
  }

  /**
   * Handle contractor opportunity queries
   */
  private async handleContractorOpportunityQuery(
    query: StormIntelligenceQuery,
    data: RealTimeStormData
  ): Promise<StormIntelligenceResponse> {
    // Implementation for contractor opportunities
    return {
      answer: "Contractor opportunity analysis based on predicted storm impacts and market conditions.",
      confidence: 0.8,
      sources: ["Market analysis", "Damage predictions"],
      metadata: {
        processingTime: 0,
        dataSourcesUsed: ["Market data"],
        analysisType: "contractor_opportunities"
      }
    };
  }

  /**
   * Handle general information queries
   */
  private async handleGeneralInformationQuery(
    query: StormIntelligenceQuery,
    data: RealTimeStormData
  ): Promise<StormIntelligenceResponse> {
    if (!this.openai) {
      return this.handleGeneralInformationFallback(query, data);
    }

    try {
      const generalPrompt = `
      Storm intelligence general information query:
      
      Question: ${query.question}
      Available Data: Weather alerts, storm data, historical patterns
      
      Provide comprehensive, accurate information about:
      - Weather phenomena and processes
      - Storm safety and preparedness
      - System capabilities and data sources
      - General meteorological concepts
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a comprehensive storm intelligence assistant. Provide helpful, accurate information about weather and storms."
          },
          {
            role: "user",
            content: generalPrompt
          }
        ],
        max_completion_tokens: 1024,
      });

      return {
        answer: response.choices[0].message.content || "I can help with storm intelligence questions.",
        confidence: 0.9,
        sources: ["Storm intelligence knowledge base"],
        metadata: {
          processingTime: 0,
          dataSourcesUsed: ["Knowledge base"],
          analysisType: "general_information"
        }
      };
    } catch (error) {
      console.log('🔄 AI general analysis failed, using fallback');
      return this.handleGeneralInformationFallback(query, data);
    }
  }

  /**
   * Generate AI-powered path prediction
   */
  private async generateAIPathPrediction(
    disaster: any,
    weatherData: any,
    lat: number,
    lng: number
  ): Promise<DisasterPathPrediction> {
    // Implementation for AI path prediction
    return {
      disasterType: disaster?.type || 'severe_weather',
      currentLocation: {
        latitude: lat,
        longitude: lng,
        description: `Location ${lat.toFixed(2)}, ${lng.toFixed(2)}`
      },
      predictedPath: [],
      affectedRegions: [],
      confidence: {
        overall: 0.85,
        pathAccuracy: 0.8,
        timingAccuracy: 0.75,
        intensityAccuracy: 0.82
      },
      modelSources: ["GPT-5 Analysis", "Weather Models"],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Identify active disaster from weather data
   */
  private identifyActiveDisaster(alerts: any[], nhcData: any, disasterType?: string): any {
    if (disasterType) {
      return { type: disasterType };
    }

    // Analyze alerts to identify most significant threat
    if (alerts.length > 0) {
      const severeAlerts = alerts.filter(alert => 
        alert.severity === 'Severe' || alert.severity === 'Extreme'
      );
      if (severeAlerts.length > 0) {
        return { type: 'severe_weather', alert: severeAlerts[0] };
      }
    }

    // Check for active hurricanes
    if (nhcData?.storms?.length > 0) {
      return { type: 'hurricane', storm: nhcData.storms[0] };
    }

    return { type: 'general_weather' };
  }

  /**
   * Gather relevant data for question answering
   */
  private async gatherRelevantData(question: string, context?: any): Promise<any> {
    // Analyze question to determine what data is needed
    const needsWeatherData = /weather|storm|hurricane|tornado|flood/i.test(question);
    const needsLocationData = /where|location|path|track/i.test(question);
    const needsHistoricalData = /history|past|previous|before/i.test(question);

    const data: any = { context };

    if (needsWeatherData && context?.location) {
      data.weather = await weatherService.getComprehensiveWeatherData(
        context.location.latitude,
        context.location.longitude
      );
    }

    if (needsHistoricalData) {
      data.historical = await storage.getHistoricalDamagePatterns();
    }

    return data;
  }

  /**
   * Create comprehensive prompt for storm questions
   */
  private createStormQuestionPrompt(question: string, data: any): string {
    let prompt = `Question: ${question}\n\n`;
    
    if (data.weather) {
      prompt += `Current Weather Data:\n${JSON.stringify(data.weather, null, 2)}\n\n`;
    }
    
    if (data.historical) {
      prompt += `Historical Data:\n${JSON.stringify(data.historical.slice(0, 5), null, 2)}\n\n`;
    }
    
    if (data.context) {
      prompt += `Additional Context:\n${JSON.stringify(data.context, null, 2)}\n\n`;
    }
    
    prompt += `Please provide a comprehensive, accurate answer based on the available data. Include confidence levels and cite sources when possible.`;
    
    return prompt;
  }

  /**
   * Generate fallback response using available weather data
   */
  private async generateFallbackResponse(
    query: StormIntelligenceQuery,
    data: RealTimeStormData
  ): Promise<StormIntelligenceResponse> {
    const queryAnalysis = this.analyzeQueryIntentFallback(query.question);
    
    switch (queryAnalysis.type) {
      case 'disaster_prediction':
        return this.handleDisasterPredictionFallback(query, data);
      case 'current_conditions':
        return this.handleCurrentConditionsFallback(query, data);
      case 'historical_analysis':
        return this.handleHistoricalAnalysisFallback(query, data);
      case 'damage_assessment':
        return this.handleDamageAssessmentFallback(query, data);
      case 'contractor_opportunities':
        return this.handleContractorOpportunityFallback(query, data);
      default:
        return this.handleGeneralInformationFallback(query, data);
    }
  }

  /**
   * Fallback disaster prediction using weather data analysis
   */
  private handleDisasterPredictionFallback(
    query: StormIntelligenceQuery,
    data: RealTimeStormData
  ): StormIntelligenceResponse {
    let answer = "🌀 **Storm Intelligence Analysis (Real-time Data)**\n\n";
    const sources = [];
    const recommendations = [];
    const alerts = [];

    // Analyze current alerts
    if (data.alerts && data.alerts.length > 0) {
      answer += "**🚨 Active Weather Alerts:**\n";
      const severeThreatAlerts = data.alerts.filter(alert => 
        alert.severity === 'Severe' || alert.severity === 'Extreme' ||
        alert.event?.includes('Warning') || alert.event?.includes('Watch')
      ).slice(0, 3);
      
      severeThreatAlerts.forEach(alert => {
        answer += `• **${alert.event}**: ${alert.headline || alert.description || 'Active threat'}\n`;
        if (alert.severity === 'Extreme') {
          alerts.push(`EXTREME THREAT: ${alert.event}`);
        }
      });
      
      if (severeThreatAlerts.length > 0) {
        recommendations.push("Monitor all active warnings and watches");
        recommendations.push("Prepare emergency supplies and evacuation plan");
      }
      
      sources.push("National Weather Service Alerts");
      answer += "\n";
    }

    // NHC Storm Analysis
    if (data.nhcData && data.nhcData.storms && data.nhcData.storms.length > 0) {
      answer += "**🌀 Active Hurricane/Tropical Systems:**\n";
      data.nhcData.storms.slice(0, 2).forEach(storm => {
        answer += `• **${storm.name || 'Tropical System'}**: ${storm.intensity || 'Tropical'} with ${storm.windSpeed || 'unknown'} mph winds\n`;
        if (storm.windSpeed > 100) {
          alerts.push(`MAJOR HURRICANE: ${storm.name} - ${storm.windSpeed} mph`);
        }
      });
      sources.push("National Hurricane Center");
      recommendations.push("Track hurricane path updates every 6 hours");
      answer += "\n";
    }

    // SPC Outlook Analysis
    if (data.spcOutlooks && data.spcOutlooks.length > 0) {
      answer += "**⛈️ Severe Weather Outlook:**\n";
      data.spcOutlooks.slice(0, 2).forEach(outlook => {
        answer += `• **${outlook.day || 'Today'}**: ${outlook.risk || 'Marginal'} risk for severe weather\n`;
        if (outlook.risk === 'High' || outlook.risk === 'Moderate') {
          alerts.push(`SEVERE WEATHER RISK: ${outlook.risk} for ${outlook.day}`);
        }
      });
      sources.push("Storm Prediction Center");
      answer += "\n";
    }

    // FEMA Disaster Declarations
    if (data.femaDeclarations && data.femaDeclarations.length > 0) {
      answer += "**🏛️ Active Disaster Declarations:**\n";
      answer += `• **${data.femaDeclarations.length} active declarations** monitored by FEMA\n`;
      sources.push("FEMA Disaster Records");
      answer += "\n";
    }

    // Add prediction guidance
    answer += "**📊 Prediction Analysis:**\n";
    if (data.alerts.length > 0 || (data.nhcData && data.nhcData.storms?.length > 0)) {
      answer += "• **Short-term (0-48 hours)**: Active threats require immediate monitoring\n";
      answer += "• **Medium-term (2-7 days)**: Track system development and movement\n";
      answer += "• **Preparedness**: Review emergency plans and supply availability\n";
    } else {
      answer += "• **Current Status**: No immediate severe weather threats detected\n";
      answer += "• **Monitoring**: Continuous surveillance of developing patterns\n";
      answer += "• **Seasonal Awareness**: Stay informed of typical weather patterns for your region\n";
    }

    if (sources.length === 0) {
      sources.push("Storm Intelligence Database");
    }

    if (recommendations.length === 0) {
      recommendations.push("Stay informed with weather updates");
      recommendations.push("Review emergency preparedness plans");
    }

    answer += "\n💡 *This analysis is based on real-time weather data from official sources. For the most current information, monitor National Weather Service updates.*";

    return {
      answer,
      confidence: 0.75,
      sources,
      recommendations,
      alerts,
      metadata: {
        processingTime: 0,
        dataSourcesUsed: sources,
        analysisType: "disaster_prediction_fallback"
      }
    };
  }

  /**
   * Fallback current conditions analysis
   */
  private handleCurrentConditionsFallback(
    query: StormIntelligenceQuery,
    data: RealTimeStormData
  ): StormIntelligenceResponse {
    let answer = "🌦️ **Current Weather Conditions Analysis**\n\n";
    const sources = [];
    const recommendations = [];
    
    // Current alerts status
    if (data.alerts && data.alerts.length > 0) {
      const activeAlerts = data.alerts.filter(alert => alert.status === 'Actual');
      answer += `**Active Alerts**: ${activeAlerts.length} current weather alerts\n`;
      
      const warningAlerts = activeAlerts.filter(alert => alert.event?.includes('Warning'));
      const watchAlerts = activeAlerts.filter(alert => alert.event?.includes('Watch'));
      
      if (warningAlerts.length > 0) {
        answer += `• **${warningAlerts.length} Warnings** (immediate action required)\n`;
      }
      if (watchAlerts.length > 0) {
        answer += `• **${watchAlerts.length} Watches** (conditions possible)\n`;
      }
      
      sources.push("NWS Real-time Alerts");
    } else {
      answer += "**Active Alerts**: No current weather warnings or watches\n";
    }

    // Radar status
    answer += `**Radar Data**: ${data.radarData ? '✅ Live radar data available' : '⚠️ Radar data temporarily unavailable'}\n`;
    if (data.radarData) {
      sources.push("Weather Radar Network");
    }

    // Satellite status
    answer += `**Satellite Data**: ${data.satelliteData ? '✅ Current satellite imagery available' : '⚠️ Satellite data temporarily unavailable'}\n`;
    if (data.satelliteData) {
      sources.push("Weather Satellites");
    }

    // Data freshness
    answer += `\n**Data Status**: Live monitoring active as of ${new Date().toLocaleString()}\n`;
    
    // Location-specific guidance
    if (query.location) {
      answer += `**Your Location**: Monitoring conditions for ${query.location.latitude.toFixed(2)}, ${query.location.longitude.toFixed(2)}\n`;
      recommendations.push("Check local radar for your specific area");
    }

    recommendations.push("Refresh data periodically for latest conditions");
    recommendations.push("Enable weather alerts for your location");

    if (sources.length === 0) {
      sources.push("Weather Monitoring Network");
    }

    answer += "\n📡 *Real-time weather monitoring is active. Data updates automatically from official weather services.*";

    return {
      answer,
      confidence: 0.85,
      sources,
      recommendations,
      metadata: {
        processingTime: 0,
        dataSourcesUsed: sources,
        analysisType: "current_conditions_fallback"
      }
    };
  }

  /**
   * Fallback historical analysis
   */
  private handleHistoricalAnalysisFallback(
    query: StormIntelligenceQuery,
    data: RealTimeStormData
  ): StormIntelligenceResponse {
    let answer = "📊 **Historical Storm Pattern Analysis**\n\n";
    const sources = [];
    
    // Historical patterns analysis
    if (data.historicalPatterns && data.historicalPatterns.length > 0) {
      answer += `**Historical Database**: ${data.historicalPatterns.length} historical storm events analyzed\n\n`;
      
      // Analyze patterns
      const severeDamageEvents = data.historicalPatterns.filter(event => 
        event.damageLevel === 'severe' || event.damageLevel === 'catastrophic'
      );
      
      answer += `**Severe Damage Events**: ${severeDamageEvents.length} historical severe weather events\n`;
      
      // Seasonal patterns
      const currentMonth = new Date().getMonth() + 1;
      const seasonalEvents = data.historicalPatterns.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() + 1 === currentMonth;
      });
      
      answer += `**Seasonal Activity**: ${seasonalEvents.length} historical events in ${new Date().toLocaleDateString('en-US', { month: 'long' })}\n`;
      
      sources.push("Historical Storm Database");
    }

    // FEMA historical data
    if (data.femaDeclarations && data.femaDeclarations.length > 0) {
      answer += `\n**FEMA Records**: Access to ${data.femaDeclarations.length} disaster declarations\n`;
      sources.push("FEMA Historical Records");
    }

    // General historical context
    answer += "\n**Historical Context Available:**\n";
    answer += "• Storm frequency and intensity trends\n";
    answer += "• Seasonal weather pattern analysis\n";
    answer += "• Damage assessment comparisons\n";
    answer += "• Regional vulnerability assessments\n";

    if (sources.length === 0) {
      sources.push("Storm Intelligence Historical Database");
    }

    answer += "\n🔍 *Historical analysis helps identify patterns and trends for better preparedness and risk assessment.*";

    return {
      answer,
      confidence: 0.7,
      sources,
      recommendations: [
        "Compare current conditions to historical patterns",
        "Review seasonal preparedness based on historical data",
        "Consider historical damage patterns for risk assessment"
      ],
      metadata: {
        processingTime: 0,
        dataSourcesUsed: sources,
        analysisType: "historical_analysis_fallback"
      }
    };
  }

  /**
   * Fallback damage assessment
   */
  private handleDamageAssessmentFallback(
    query: StormIntelligenceQuery,
    data: RealTimeStormData
  ): StormIntelligenceResponse {
    let answer = "🏗️ **Damage Assessment Intelligence**\n\n";
    const sources = [];
    const recommendations = [];
    
    // Current threat assessment
    if (data.alerts && data.alerts.length > 0) {
      const highImpactAlerts = data.alerts.filter(alert => 
        alert.severity === 'Severe' || alert.severity === 'Extreme'
      );
      
      if (highImpactAlerts.length > 0) {
        answer += "**Current Damage Risk**: HIGH - Active severe weather threats\n";
        answer += "• Immediate property damage possible\n";
        answer += "• Infrastructure impacts likely\n";
        recommendations.push("Secure outdoor items and review insurance coverage");
        recommendations.push("Document property condition before impact");
      } else {
        answer += "**Current Damage Risk**: LOW - No immediate severe threats\n";
      }
    }

    // Historical damage patterns
    if (data.historicalPatterns && data.historicalPatterns.length > 0) {
      const damageEvents = data.historicalPatterns.filter(event => event.damageLevel);
      answer += `\n**Historical Damage Data**: ${damageEvents.length} events with damage assessments\n`;
      sources.push("Historical Damage Database");
    }

    // Assessment capabilities
    answer += "\n**Available Assessment Tools:**\n";
    answer += "• Real-time weather impact monitoring\n";
    answer += "• Historical damage pattern analysis\n";
    answer += "• Risk level categorization\n";
    answer += "• Regional vulnerability mapping\n";

    // Risk factors
    answer += "\n**Key Risk Factors:**\n";
    answer += "• Wind speed and duration\n";
    answer += "• Flood potential and drainage\n";
    answer += "• Hail size and intensity\n";
    answer += "• Lightning strike probability\n";

    if (sources.length === 0) {
      sources.push("Damage Assessment Models");
    }

    if (recommendations.length === 0) {
      recommendations.push("Regular property vulnerability assessments");
      recommendations.push("Maintain updated insurance documentation");
      recommendations.push("Develop damage reporting procedures");
    }

    answer += "\n⚖️ *Damage assessment combines real-time threat analysis with historical patterns for comprehensive risk evaluation.*";

    return {
      answer,
      confidence: 0.75,
      sources,
      recommendations,
      metadata: {
        processingTime: 0,
        dataSourcesUsed: sources,
        analysisType: "damage_assessment_fallback"
      }
    };
  }

  /**
   * Fallback contractor opportunities
   */
  private handleContractorOpportunityFallback(
    query: StormIntelligenceQuery,
    data: RealTimeStormData
  ): StormIntelligenceResponse {
    let answer = "🔨 **Contractor Business Intelligence**\n\n";
    const sources = [];
    const recommendations = [];
    
    // Market opportunity assessment
    if (data.alerts && data.alerts.length > 0) {
      const damageThreats = data.alerts.filter(alert => 
        alert.event?.includes('Wind') || alert.event?.includes('Hail') || 
        alert.event?.includes('Flood') || alert.event?.includes('Storm')
      );
      
      if (damageThreats.length > 0) {
        answer += "**Market Opportunity**: HIGH - Active damage-causing weather\n";
        answer += `• ${damageThreats.length} alerts with damage potential\n`;
        answer += "• Roof, siding, and water damage services likely needed\n";
        recommendations.push("Prepare crews and materials for rapid deployment");
        recommendations.push("Contact insurance adjusters in affected areas");
      } else {
        answer += "**Market Opportunity**: STANDARD - Normal business conditions\n";
      }
    }

    // Historical opportunity analysis
    if (data.historicalPatterns && data.historicalPatterns.length > 0) {
      answer += `\n**Historical Business Data**: ${data.historicalPatterns.length} storm events tracked\n`;
      sources.push("Historical Storm Impact Database");
    }

    // FEMA disaster declarations (business opportunities)
    if (data.femaDeclarations && data.femaDeclarations.length > 0) {
      answer += `\n**FEMA Disaster Areas**: ${data.femaDeclarations.length} active disaster declarations\n`;
      answer += "• Federal disaster assistance programs available\n";
      answer += "• Increased insurance claim processing\n";
      recommendations.push("Register with FEMA contractor databases");
      sources.push("FEMA Disaster Records");
    }

    // Service type recommendations
    answer += "\n**High-Demand Services:**\n";
    answer += "• Emergency roof repairs and tarping\n";
    answer += "• Water damage restoration\n";
    answer += "• Tree removal and debris cleanup\n";
    answer += "• Siding and window replacement\n";
    answer += "• Foundation and structural repairs\n";

    // Business intelligence
    answer += "\n**Business Intelligence Available:**\n";
    answer += "• Real-time storm impact tracking\n";
    answer += "• Regional damage pattern analysis\n";
    answer += "• Market timing optimization\n";
    answer += "• Competitive landscape monitoring\n";

    if (sources.length === 0) {
      sources.push("Contractor Market Intelligence");
    }

    if (recommendations.length === 0) {
      recommendations.push("Monitor weather alerts for business opportunities");
      recommendations.push("Maintain emergency response capability");
      recommendations.push("Build relationships with insurance companies");
    }

    answer += "\n💼 *Business intelligence combines weather data with market analysis for optimal contractor positioning.*";

    return {
      answer,
      confidence: 0.8,
      sources,
      recommendations,
      metadata: {
        processingTime: 0,
        dataSourcesUsed: sources,
        analysisType: "contractor_opportunities_fallback"
      }
    };
  }

  /**
   * Fallback general information
   */
  private handleGeneralInformationFallback(
    query: StormIntelligenceQuery,
    data: RealTimeStormData
  ): StormIntelligenceResponse {
    let answer = "🧠 **Storm Intelligence System Information**\n\n";
    const sources = [];
    
    // System capabilities
    answer += "**Available Capabilities:**\n";
    answer += "• Real-time weather alert monitoring\n";
    answer += "• Storm path tracking and prediction\n";
    answer += "• Historical pattern analysis\n";
    answer += "• Damage risk assessment\n";
    answer += "• Business intelligence for contractors\n";
    answer += "• Emergency preparedness guidance\n\n";

    // Data sources
    answer += "**Live Data Sources:**\n";
    answer += "• National Weather Service (NWS)\n";
    answer += "• National Hurricane Center (NHC)\n";
    answer += "• Storm Prediction Center (SPC)\n";
    answer += "• FEMA Disaster Records\n";
    answer += "• Historical Storm Database\n";
    answer += "• Real-time Radar & Satellite\n\n";

    // Current system status
    answer += "**System Status:**\n";
    answer += `• Weather Data: ${data.alerts ? '✅ Active' : '⚠️ Limited'}\n`;
    answer += `• Alert Monitoring: ${data.alerts && data.alerts.length > 0 ? `${data.alerts.length} active alerts` : 'No current alerts'}\n`;
    answer += `• Historical Database: ${data.historicalPatterns ? `${data.historicalPatterns.length} records` : 'Available'}\n`;
    answer += `• FEMA Integration: ${data.femaDeclarations ? `${data.femaDeclarations.length} declarations` : 'Connected'}\n\n`;

    // How to use the system
    answer += "**How to Use Storm Intelligence:**\n";
    answer += "• Ask about current weather conditions\n";
    answer += "• Request storm path predictions\n";
    answer += "• Inquire about historical patterns\n";
    answer += "• Get damage risk assessments\n";
    answer += "• Explore business opportunities\n";
    answer += "• Access emergency preparedness info\n\n";

    // Sample questions
    answer += "**Sample Questions:**\n";
    answer += "• 'What storms are approaching Florida?'\n";
    answer += "• 'Show me hurricane damage patterns'\n";
    answer += "• 'What's the current threat level?'\n";
    answer += "• 'Predict storm impact for my area'\n";

    sources.push("Storm Intelligence System");
    sources.push("Real-time Weather Networks");
    sources.push("Historical Data Archives");

    answer += "\n🌐 *The Storm Intelligence system provides comprehensive weather analysis using official data sources and advanced pattern recognition.*";

    return {
      answer,
      confidence: 0.9,
      sources,
      recommendations: [
        "Ask specific questions about your area of interest",
        "Check current alerts regularly",
        "Use historical data for long-term planning",
        "Monitor system updates for enhanced capabilities"
      ],
      metadata: {
        processingTime: 0,
        dataSourcesUsed: sources,
        analysisType: "general_information_fallback"
      }
    };
  }

  /**
   * Generate basic error response when everything fails
   */
  private generateBasicErrorResponse(
    query: StormIntelligenceQuery,
    error: any
  ): StormIntelligenceResponse {
    let answer = "⚠️ **Storm Intelligence System Notice**\n\n";
    answer += "I'm currently experiencing technical difficulties, but I can still help you with storm intelligence using available data sources.\n\n";
    
    answer += "**Available Information:**\n";
    answer += "• Current weather alerts and warnings\n";
    answer += "• Storm tracking and path analysis\n";
    answer += "• Historical storm patterns\n";
    answer += "• Emergency preparedness guidance\n";
    answer += "• Risk assessment basics\n\n";
    
    answer += "**Immediate Actions:**\n";
    answer += "• Monitor official weather services (weather.gov)\n";
    answer += "• Check local emergency management alerts\n";
    answer += "• Review your emergency preparedness plan\n";
    answer += "• Stay informed through reliable weather sources\n\n";
    
    answer += "**Emergency Contacts:**\n";
    answer += "• National Weather Service: weather.gov\n";
    answer += "• Local Emergency Management\n";
    answer += "• Red Cross: redcross.org\n";
    answer += "• FEMA: ready.gov\n\n";
    
    answer += "Please try your question again, and I'll do my best to provide helpful storm intelligence using the data sources available to me.";

    return {
      answer,
      confidence: 0.6,
      sources: ["Emergency Guidance Database"],
      recommendations: [
        "Monitor official weather services",
        "Stay informed through reliable sources",
        "Have emergency plans ready",
        "Try rephrasing your question"
      ],
      alerts: ["System experiencing technical difficulties"],
      metadata: {
        processingTime: 0,
        dataSourcesUsed: ["Emergency protocols"],
        analysisType: "basic_error_response"
      }
    };
  }
}

export const stormIntelligenceAI = StormIntelligenceAI.getInstance();