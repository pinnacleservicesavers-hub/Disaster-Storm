import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { insuranceApi, claimsApi } from "@/lib/api";

export function useInsuranceCompanies() {
  return useQuery({
    queryKey: ["/api/insurance-companies"],
    queryFn: insuranceApi.getCompanies,
    staleTime: 300000, // Consider data stale after 5 minutes
  });
}

export function useInsuranceCompany(id: string) {
  return useQuery({
    queryKey: ["/api/insurance-companies", id],
    queryFn: () => insuranceApi.getCompany(id),
    enabled: !!id,
  });
}

export function useClaims() {
  return useQuery({
    queryKey: ["/api/claims"],
    queryFn: claimsApi.getClaims,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useClaim(id: string) {
  return useQuery({
    queryKey: ["/api/claims", id],
    queryFn: () => claimsApi.getClaim(id),
    enabled: !!id,
  });
}

export function useCreateClaim() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: claimsApi.createClaim,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
    },
  });
}

export function useUpdateClaim() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      claimsApi.updateClaim(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/claims", data.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
    },
  });
}

export function useInsuranceAnalytics() {
  const { data: companies } = useInsuranceCompanies();
  const { data: claims } = useClaims();

  const analytics = {
    topPerformers: companies?.slice().sort((a, b) => b.successRate - a.successRate).slice(0, 5) || [],
    payoutTrends: companies?.map(company => ({
      name: company.name,
      trend: company.payoutTrend,
      avgPayout: company.avgPayout
    })) || [],
    totalPayouts: claims?.reduce((sum, claim) => sum + (claim.paidAmount || 0), 0) || 0,
    activeClaims: claims?.filter(claim => claim.status === 'active').length || 0,
    successRate: claims?.length ? 
      (claims.filter(claim => claim.status === 'settled').length / claims.length) * 100 : 0
  };

  return analytics;
}
