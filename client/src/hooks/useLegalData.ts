import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { legalApi } from "@/lib/api";

export function useLienRules() {
  return useQuery({
    queryKey: ["/api/legal/lien-rules"],
    queryFn: legalApi.getLienRules,
    staleTime: 3600000, // Consider data stale after 1 hour
  });
}

export function useLienRule(state: string) {
  return useQuery({
    queryKey: ["/api/legal/lien-rules", state],
    queryFn: () => legalApi.getLienRule(state),
    enabled: !!state,
  });
}

export function useCalculateDeadline() {
  return useMutation({
    mutationFn: ({ state, completionDate, projectType }: {
      state: string;
      completionDate: string;
      projectType?: string;
    }) => legalApi.calculateDeadline(state, completionDate, projectType),
  });
}

export function useAttorneys(state: string, specialty?: string) {
  return useQuery({
    queryKey: ["/api/legal/attorneys", state, specialty],
    queryFn: () => legalApi.getAttorneys(state, specialty),
    enabled: !!state,
    staleTime: 3600000, // Consider data stale after 1 hour
  });
}

export function useLegalCompliance() {
  const { data: lienRules } = useLienRules();

  const complianceStatus = lienRules?.map(rule => {
    // Mock deadline calculation for demo
    const today = new Date();
    const mockCompletionDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    let deadlineDays = 90; // default
    if (rule.lienFilingDeadline.includes('90 days')) {
      deadlineDays = 90;
    } else if (rule.lienFilingDeadline.includes('120 days')) {
      deadlineDays = 120;
    } else if (rule.lienFilingDeadline.includes('4 months')) {
      deadlineDays = 120;
    }

    const deadlineDate = new Date(mockCompletionDate);
    deadlineDate.setDate(deadlineDate.getDate() + deadlineDays);
    
    const daysRemaining = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let status: 'compliant' | 'warning' | 'action_needed' = 'compliant';
    if (daysRemaining <= 0) {
      status = 'action_needed';
    } else if (daysRemaining <= 14) {
      status = 'warning';
    }

    return {
      state: rule.state,
      daysRemaining,
      status,
      deadlineDate,
      rule
    };
  }) || [];

  const urgentStates = complianceStatus.filter(s => s.status === 'action_needed');
  const warningStates = complianceStatus.filter(s => s.status === 'warning');

  return {
    complianceStatus,
    urgentCount: urgentStates.length,
    warningCount: warningStates.length,
    urgentStates,
    warningStates
  };
}
