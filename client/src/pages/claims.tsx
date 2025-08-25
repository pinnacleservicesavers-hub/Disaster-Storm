import { useState } from "react";
import TopNavigation from "@/components/TopNavigation";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useClaims, useInsuranceCompanies } from "@/hooks/useInsuranceData";
import { Plus, Search, Filter, FileText, DollarSign } from "lucide-react";

export default function Claims() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const { translate } = useLanguage();

  const { data: claims, isLoading: claimsLoading } = useClaims();
  const { data: companies } = useInsuranceCompanies();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'settled':
        return 'bg-green-100 text-green-800';
      case 'disputed':
        return 'bg-red-100 text-red-800';
      case 'denied':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredClaims = claims?.filter(claim => {
    const matchesSearch = searchTerm === "" || 
      claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.claimantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.insuranceCompany.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || claim.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="pt-16 flex">
        <Sidebar collapsed={sidebarCollapsed} />
        
        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-280'
        }`}>
          <div className="p-6">
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900" data-testid="claims-page-title">
                    {translate('claims_management')}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage insurance claims and track payouts
                  </p>
                </div>
                <div className="mt-4 lg:mt-0">
                  <Button 
                    className="bg-primary text-white hover:bg-primary-dark"
                    data-testid="button-new-claim"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {translate('new_claim')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search claims..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-claims"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                      data-testid="select-filter-status"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="settled">Settled</option>
                      <option value="disputed">Disputed</option>
                      <option value="denied">Denied</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Claims Table */}
            <Card data-testid="card-claims-table">
              <CardHeader>
                <CardTitle>Claims Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {claimsLoading ? (
                  <div className="animate-shimmer h-64 rounded"></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Claim Number</th>
                          <th>Claimant</th>
                          <th>Insurance Company</th>
                          <th>Damage Type</th>
                          <th>Status</th>
                          <th>Estimated Amount</th>
                          <th>Paid Amount</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClaims.map((claim, index) => (
                          <tr key={claim.id} data-testid={`claim-row-${index}`}>
                            <td className="font-medium" data-testid={`claim-number-${index}`}>
                              {claim.claimNumber}
                            </td>
                            <td data-testid={`claimant-name-${index}`}>
                              {claim.claimantName}
                            </td>
                            <td data-testid={`insurance-company-${index}`}>
                              {claim.insuranceCompany}
                            </td>
                            <td data-testid={`damage-type-${index}`}>
                              {claim.damageType}
                            </td>
                            <td>
                              <Badge 
                                className={getStatusColor(claim.status)}
                                data-testid={`claim-status-${index}`}
                              >
                                {claim.status}
                              </Badge>
                            </td>
                            <td data-testid={`estimated-amount-${index}`}>
                              {formatCurrency(claim.estimatedAmount)}
                            </td>
                            <td data-testid={`paid-amount-${index}`}>
                              {claim.paidAmount ? formatCurrency(claim.paidAmount) : '-'}
                            </td>
                            <td>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`button-view-claim-${index}`}
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`button-payment-${index}`}
                                >
                                  <DollarSign className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
