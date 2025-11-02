import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Building2, CreditCard, Shield, CheckCircle, AlertCircle, Loader2, Eye, EyeOff, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BankingSettingsProps {
  userId: string;
}

export function BankingSettings({ userId }: BankingSettingsProps) {
  const { toast } = useToast();
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showRoutingNumber, setShowRoutingNumber] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    bankName: '',
    accountHolderName: '',
    bankAccountNumber: '',
    bankRoutingNumber: '',
    bankAccountType: 'checking' as 'checking' | 'savings'
  });

  const { data: bankingInfo, isLoading, refetch } = useQuery({
    queryKey: ['/contractor/banking', userId],
    enabled: !!userId
  });

  const updateBankingMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest(`/contractor/banking`, {
        method: 'POST',
        body: JSON.stringify({ userId, ...data })
      });
    },
    onSuccess: () => {
      toast({
        title: "Banking Information Updated",
        description: "Your banking details have been securely saved.",
        variant: "default"
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/contractor/banking', userId] });
      setFormData({
        bankName: '',
        accountHolderName: '',
        bankAccountNumber: '',
        bankRoutingNumber: '',
        bankAccountType: 'checking'
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update banking information"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bankName || !formData.accountHolderName || !formData.bankAccountNumber || !formData.bankRoutingNumber) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields"
      });
      return;
    }

    if (formData.bankRoutingNumber.length !== 9) {
      toast({
        variant: "destructive",
        title: "Invalid Routing Number",
        description: "Routing number must be exactly 9 digits"
      });
      return;
    }

    if (formData.bankAccountNumber.length < 4 || formData.bankAccountNumber.length > 17) {
      toast({
        variant: "destructive",
        title: "Invalid Account Number",
        description: "Account number must be between 4 and 17 digits"
      });
      return;
    }

    updateBankingMutation.mutate(formData);
  };

  const handleEditClick = () => {
    if (bankingInfo?.configured) {
      setFormData({
        bankName: '',
        accountHolderName: bankingInfo.accountHolderName || '',
        bankAccountNumber: '',
        bankRoutingNumber: '',
        bankAccountType: (bankingInfo.bankAccountType as 'checking' | 'savings') || 'checking'
      });
    }
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  const isConfigured = bankingInfo?.configured;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          Banking Information
        </CardTitle>
        <CardDescription>
          Securely manage your bank account details for receiving payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Notice */}
        <Alert>
          <Shield className="w-4 h-4" />
          <AlertDescription>
            Your banking information is encrypted and stored securely. Account numbers are never displayed in full.
          </AlertDescription>
        </Alert>

        {/* Display Mode - When banking info exists and not editing */}
        {isConfigured && !isEditing && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Bank Name</Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{bankingInfo.bankName || 'Not specified'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Account Holder</Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{bankingInfo.accountHolderName || 'Not specified'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Account Type</Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                  <span className="font-medium capitalize">{bankingInfo.bankAccountType || 'Not specified'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Account Number</Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="font-mono">{bankingInfo.bankAccountNumber || '••••'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Routing Number</Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="font-mono">{bankingInfo.bankRoutingNumber || '••••'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Last Updated</Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{bankingInfo.bankingUpdatedAt ? new Date(bankingInfo.bankingUpdatedAt).toLocaleDateString() : 'Never'}</span>
                </div>
              </div>
            </div>

            <Button onClick={handleEditClick} variant="outline" className="w-full" data-testid="button-edit-banking">
              Update Banking Information
            </Button>
          </div>
        )}

        {/* Edit Mode - Form */}
        {(!isConfigured || isEditing) && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  placeholder="e.g., Chase Bank, Wells Fargo"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  required
                  data-testid="input-bank-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                <Input
                  id="accountHolderName"
                  placeholder="Name on bank account"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  required
                  data-testid="input-account-holder-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccountType">Account Type *</Label>
                <Select
                  value={formData.bankAccountType}
                  onValueChange={(value: 'checking' | 'savings') => setFormData({ ...formData, bankAccountType: value })}
                >
                  <SelectTrigger id="bankAccountType" data-testid="select-account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankRoutingNumber">Routing Number * (9 digits)</Label>
                <div className="relative">
                  <Input
                    id="bankRoutingNumber"
                    type={showRoutingNumber ? 'text' : 'password'}
                    placeholder="123456789"
                    value={formData.bankRoutingNumber}
                    onChange={(e) => setFormData({ ...formData, bankRoutingNumber: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                    required
                    maxLength={9}
                    className="pr-10"
                    data-testid="input-routing-number"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRoutingNumber(!showRoutingNumber)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showRoutingNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bankAccountNumber">Account Number * (4-17 digits)</Label>
                <div className="relative">
                  <Input
                    id="bankAccountNumber"
                    type={showAccountNumber ? 'text' : 'password'}
                    placeholder="Enter your bank account number"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value.replace(/\D/g, '').slice(0, 17) })}
                    required
                    maxLength={17}
                    className="pr-10"
                    data-testid="input-account-number"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountNumber(!showAccountNumber)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showAccountNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={updateBankingMutation.isPending}
                data-testid="button-save-banking"
              >
                {updateBankingMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Save Banking Information
                  </>
                )}
              </Button>

              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={updateBankingMutation.isPending}
                  data-testid="button-cancel-banking"
                >
                  Cancel
                </Button>
              )}
            </div>

            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <Shield className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Security:</strong> Your banking information is encrypted before storage and only the last 4 digits are ever displayed.
              </AlertDescription>
            </Alert>
          </form>
        )}

        {/* No Banking Info Placeholder */}
        {!isConfigured && !isEditing && (
          <div className="text-center py-8 space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-blue-100 rounded-full">
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">No Banking Information on File</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add your bank account details to receive direct deposits for completed jobs
              </p>
              <Button onClick={handleEditClick} data-testid="button-add-banking">
                <Plus className="w-4 h-4 mr-2" />
                Add Banking Information
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
