import { BaseAgent, AgentTask, AgentResponse } from '../BaseAgent';

export class NegotiatorAgent extends BaseAgent {
  name = 'NegotiatorAgent';
  description = 'Handles insurance claim negotiations and rebuttals';
  capabilities = ['negotiate_claim', 'generate_rebuttal', 'analyze_settlement'];
  
  async execute(task: AgentTask): Promise<AgentResponse> {
    try {
      if (task.type === 'negotiate_claim') {
        const analysis = this.analyzeOffer(task.data);
        const counterOffer = this.generateCounterOffer(task.data, analysis);
        const justification = this.buildJustification(task.data, analysis);
        
        return this.success({
          analysis,
          counterOffer,
          justification,
          strategy: this.determineStrategy(analysis),
          nextSteps: this.getNextSteps(analysis)
        }, {
          reasoning: 'Analyzed insurer offer and generated strategic counter-offer'
        });
      }
      
      if (task.type === 'generate_rebuttal') {
        const rebuttal = this.craftRebuttal(task.data);
        return this.success({ rebuttal });
      }
      
      return this.failure('Unknown task type for NegotiatorAgent');
    } catch (error: any) {
      return this.failure(`NegotiatorAgent error: ${error.message}`);
    }
  }
  
  private analyzeOffer(data: any): any {
    const requestedAmount = data.requestedAmount || 0;
    const offeredAmount = data.offeredAmount || 0;
    const percentage = (offeredAmount / requestedAmount) * 100;
    
    return {
      percentage,
      gap: requestedAmount - offeredAmount,
      acceptability: percentage > 85 ? 'acceptable' : percentage > 70 ? 'negotiable' : 'unacceptable'
    };
  }
  
  private generateCounterOffer(data: any, analysis: any): number {
    if (analysis.acceptability === 'acceptable') {
      return data.offeredAmount;
    }
    return Math.floor(data.requestedAmount * 0.93);
  }
  
  private buildJustification(data: any, analysis: any): string {
    return `Based on market comparables and documented damage, the requested amount of $${data.requestedAmount.toLocaleString()} is justified. The insurer's offer of $${data.offeredAmount.toLocaleString()} (${analysis.percentage.toFixed(1)}%) does not adequately cover restoration costs. We counter with $${this.generateCounterOffer(data, analysis).toLocaleString()}.`;
  }
  
  private determineStrategy(analysis: any): string {
    if (analysis.acceptability === 'acceptable') return 'accept';
    if (analysis.acceptability === 'negotiable') return 'counter_with_evidence';
    return 'escalate_with_formal_rebuttal';
  }
  
  private getNextSteps(analysis: any): string[] {
    return [
      'Submit formal counter-offer',
      'Provide supporting documentation',
      'Schedule adjuster review if needed'
    ];
  }
  
  private craftRebuttal(data: any): string {
    return `We respectfully disagree with the assessment for the following reasons:\n1. Market comparables support our valuation\n2. Documentation clearly shows extent of damage\n3. State regulations require adequate compensation\n\nWe request reconsideration based on attached evidence.`;
  }
}
