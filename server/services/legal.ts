export interface LienDeadline {
  state: string;
  deadlineDate: Date;
  daysRemaining: number;
  deadlineType: string;
  isUrgent: boolean;
  complianceStatus: 'compliant' | 'warning' | 'action_needed';
}

export interface AttorneyInfo {
  name: string;
  firm: string;
  phone: string;
  email: string;
  specialty: string[];
  state: string;
  rating: number;
  barNumber?: string;
}

export interface ComplianceCheck {
  state: string;
  claimId: string;
  checks: ComplianceItem[];
  overallStatus: 'compliant' | 'warning' | 'non_compliant';
  recommendations: string[];
}

export interface ComplianceItem {
  requirement: string;
  status: 'met' | 'pending' | 'missed';
  deadline?: Date;
  description: string;
}

export class LegalService {
  async calculateLienDeadline(
    state: string, 
    completionDate: Date, 
    projectType: string = 'residential'
  ): Promise<LienDeadline> {
    try {
      // Get lien rules for the state
      const lienRule = await this.getLienRule(state);
      if (!lienRule) {
        throw new Error(`No lien rules found for state: ${state}`);
      }

      // Parse deadline from rules (simplified logic)
      let deadlineDays = 90; // default
      if (lienRule.lienFilingDeadline.includes('90 days')) {
        deadlineDays = 90;
      } else if (lienRule.lienFilingDeadline.includes('120 days')) {
        deadlineDays = 120;
      } else if (lienRule.lienFilingDeadline.includes('4 months')) {
        deadlineDays = 120;
      } else if (lienRule.lienFilingDeadline.includes('6 months')) {
        deadlineDays = 180;
      }

      const deadlineDate = new Date(completionDate);
      deadlineDate.setDate(deadlineDate.getDate() + deadlineDays);

      const now = new Date();
      const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let complianceStatus: 'compliant' | 'warning' | 'action_needed' = 'compliant';
      if (daysRemaining <= 0) {
        complianceStatus = 'action_needed';
      } else if (daysRemaining <= 14) {
        complianceStatus = 'warning';
      }

      return {
        state,
        deadlineDate,
        daysRemaining,
        deadlineType: 'Lien Filing',
        isUrgent: daysRemaining <= 7,
        complianceStatus
      };
    } catch (error) {
      console.error('Error calculating lien deadline:', error);
      throw new Error('Failed to calculate lien deadline');
    }
  }

  async getAttorneysByState(state: string, specialty?: string): Promise<AttorneyInfo[]> {
    try {
      // In production, this would query a legal directory API
      const mockAttorneys: AttorneyInfo[] = [
        {
          name: "Sarah Johnson",
          firm: "Johnson & Associates",
          phone: "404-555-0123",
          email: "sjohnson@johnsonlaw.com",
          specialty: ["Construction Law", "Lien Rights", "Insurance Disputes"],
          state: state,
          rating: 4.8,
          barNumber: `${state}123456`
        },
        {
          name: "Michael Rodriguez",
          firm: "Rodriguez Legal Group",
          phone: "404-555-0456",
          email: "mrodriguez@rlegal.com",
          specialty: ["Property Law", "Construction Litigation", "Insurance Claims"],
          state: state,
          rating: 4.6,
          barNumber: `${state}789012`
        },
        {
          name: "Emily Chen",
          firm: "Chen Law Firm",
          phone: "404-555-0789",
          email: "echen@chenlaw.com",
          specialty: ["Storm Damage Claims", "Insurance Bad Faith", "Lien Enforcement"],
          state: state,
          rating: 4.9,
          barNumber: `${state}345678`
        }
      ];

      if (specialty) {
        return mockAttorneys.filter(attorney => 
          attorney.specialty.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
        );
      }

      return mockAttorneys;
    } catch (error) {
      console.error('Error getting attorneys by state:', error);
      return [];
    }
  }

  async checkCompliance(claimId: string, state: string): Promise<ComplianceCheck> {
    try {
      const lienRule = await this.getLienRule(state);
      const checks: ComplianceItem[] = [];

      if (lienRule?.prelimNoticeRequired) {
        checks.push({
          requirement: "Preliminary Notice",
          status: "met", // This would be determined by actual claim data
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          description: `Preliminary notice required within ${lienRule.prelimNoticeDeadline}`
        });
      }

      checks.push({
        requirement: "Lien Filing",
        status: "pending",
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        description: `Lien must be filed within ${lienRule?.lienFilingDeadline || '90 days'}`
      });

      checks.push({
        requirement: "Contractor License",
        status: "met",
        description: "Valid contractor license required for lien rights"
      });

      const pendingChecks = checks.filter(check => check.status === 'pending');
      const missedChecks = checks.filter(check => check.status === 'missed');

      let overallStatus: 'compliant' | 'warning' | 'non_compliant' = 'compliant';
      if (missedChecks.length > 0) {
        overallStatus = 'non_compliant';
      } else if (pendingChecks.length > 0) {
        overallStatus = 'warning';
      }

      const recommendations: string[] = [];
      if (pendingChecks.length > 0) {
        recommendations.push("Monitor upcoming deadlines closely");
      }
      if (lienRule?.homesteadNote) {
        recommendations.push(`Note: ${lienRule.homesteadNote}`);
      }

      return {
        state,
        claimId,
        checks,
        overallStatus,
        recommendations
      };
    } catch (error) {
      console.error('Error checking compliance:', error);
      throw new Error('Failed to check compliance');
    }
  }

  private async getLienRule(state: string): Promise<any> {
    // This would typically query the database
    // Mock implementation for demonstration
    const mockRules: Record<string, any> = {
      'GA': {
        prelimNoticeRequired: true,
        prelimNoticeDeadline: '30 days',
        lienFilingDeadline: '90 days',
        enforcementDeadline: '1 year',
        homesteadNote: 'Residential properties may have additional service requirements'
      },
      'FL': {
        prelimNoticeRequired: true,
        prelimNoticeDeadline: '45 days',
        lienFilingDeadline: '90 days',
        enforcementDeadline: '1 year',
        homesteadNote: 'Notice to Owner required for most non-privity claimants'
      },
      'TX': {
        prelimNoticeRequired: true,
        prelimNoticeDeadline: '15th day of 2nd month',
        lienFilingDeadline: '15th day of 3rd month',
        enforcementDeadline: '1 year',
        homesteadNote: 'Monthly fund-trapping notices required'
      }
    };

    return mockRules[state] || null;
  }

  async getStateSpecificRequirements(state: string): Promise<any> {
    try {
      // Return state-specific legal requirements for contractors
      const requirements = {
        licensing: {
          required: true,
          authority: `${state} State Licensing Board`,
          renewalPeriod: '2 years'
        },
        insurance: {
          generalLiability: true,
          workersComp: true,
          minimumCoverage: 1000000
        },
        bonding: {
          required: false,
          minimumAmount: 0
        },
        liens: await this.getLienRule(state)
      };

      return requirements;
    } catch (error) {
      console.error('Error getting state requirements:', error);
      return null;
    }
  }
}

export const legalService = new LegalService();
