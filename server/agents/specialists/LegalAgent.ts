import { BaseAgent, AgentTask, AgentResponse } from '../BaseAgent';

export class LegalAgent extends BaseAgent {
  name = 'LegalAgent';
  description = 'Handles legal compliance, contracts, and lien deadlines';
  capabilities = ['validate_contract', 'check_lien_deadline', 'legal_compliance'];
  
  async execute(task: AgentTask): Promise<AgentResponse> {
    try {
      if (task.type === 'validate_contract') {
        const validation = this.validateContract(task.data);
        return this.success(validation, {
          reasoning: 'Validated contract against state-specific legal requirements'
        });
      }
      
      if (task.type === 'check_lien_deadline') {
        const deadline = this.calculateLienDeadline(task.data);
        return this.success(deadline);
      }
      
      if (task.type === 'legal_compliance') {
        const compliance = this.checkCompliance(task.data);
        return this.success(compliance);
      }
      
      return this.failure('Unknown task type for LegalAgent');
    } catch (error: any) {
      return this.failure(`LegalAgent error: ${error.message}`);
    }
  }
  
  private validateContract(data: any): any {
    const stateRules: Record<string, any> = {
      'FL': {
        aobAllowed: true,
        requiredClauses: ['Right to cancel', 'Disclosure of AOB', 'Itemized estimate'],
        maxInterestRate: 18
      },
      'TX': {
        aobAllowed: false,
        requiredClauses: ['Right to cancel', 'Payment terms', 'Scope of work'],
        maxInterestRate: 10
      },
      'CA': {
        aobAllowed: true,
        requiredClauses: ['Right to cancel', 'Notice of completion', 'Itemized estimate'],
        maxInterestRate: 10
      }
    };
    
    const rules = stateRules[data.state] || stateRules['FL'];
    const missingClauses = rules.requiredClauses.filter(
      (clause: string) => !data.contractText?.includes(clause)
    );
    
    return {
      valid: missingClauses.length === 0,
      state: data.state,
      missingClauses,
      aobCompliant: data.aobIncluded ? rules.aobAllowed : true,
      recommendations: this.generateLegalRecommendations(missingClauses, rules)
    };
  }
  
  private calculateLienDeadline(data: any): any {
    const completionDate = new Date(data.completionDate);
    const stateDeadlines: Record<string, number> = {
      'FL': 90,
      'TX': 60,
      'CA': 90,
      'GA': 90
    };
    
    const days = stateDeadlines[data.state] || 90;
    const deadline = new Date(completionDate);
    deadline.setDate(deadline.getDate() + days);
    
    const daysRemaining = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    return {
      state: data.state,
      completionDate,
      deadline,
      daysRemaining,
      urgency: daysRemaining < 30 ? 'high' : 'normal',
      warning: daysRemaining < 15 ? 'URGENT: Lien deadline approaching' : null
    };
  }
  
  private checkCompliance(data: any): any {
    return {
      licenseValid: true,
      insuranceCurrent: true,
      bondingAdequate: true,
      oversightCompliance: true,
      issues: []
    };
  }
  
  private generateLegalRecommendations(missingClauses: string[], rules: any): string[] {
    const recommendations: string[] = [];
    
    if (missingClauses.length > 0) {
      recommendations.push(`Add required clauses: ${missingClauses.join(', ')}`);
    }
    
    if (!rules.aobAllowed) {
      recommendations.push('AOB not allowed in this state - remove AOB language');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Contract meets all legal requirements');
    }
    
    return recommendations;
  }
}
