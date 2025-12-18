import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, Settings, DollarSign, Save, Edit2, Check, X,
  Users, Zap, Crown, Award, AlertTriangle, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  estimateLimit: number | null;
  isPopular: boolean;
  isActive: boolean;
  icon: typeof Users;
  color: string;
}

const DEFAULT_PRICING: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 79,
    period: 'month',
    features: ['Limited SmartBid™ estimates (10/mo)', 'Basic CRM access', 'Email support'],
    estimateLimit: 10,
    isPopular: false,
    isActive: true,
    icon: Users,
    color: 'from-slate-500 to-slate-600'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 129,
    period: 'month',
    features: ['Unlimited SmartBid™ estimates', 'Full CRM access', 'Priority support', 'AI estimate builder'],
    estimateLimit: null,
    isPopular: true,
    isActive: true,
    icon: Zap,
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 199,
    period: 'month',
    features: ['Everything in Pro', 'Priority scheduling', 'Higher search ranking', 'Dedicated account manager'],
    estimateLimit: null,
    isPopular: false,
    isActive: true,
    icon: Crown,
    color: 'from-amber-500 to-amber-600'
  }
];

export default function WorkHubAdminPricing() {
  const { toast } = useToast();
  const [pricing, setPricing] = useState<PricingTier[]>(DEFAULT_PRICING);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [hasChanges, setHasChanges] = useState(false);

  const startEditing = (tier: PricingTier) => {
    setEditingTier(tier.id);
    setEditPrice(tier.price);
  };

  const savePrice = (tierId: string) => {
    setPricing(prev => prev.map(tier => 
      tier.id === tierId ? { ...tier, price: editPrice } : tier
    ));
    setEditingTier(null);
    setHasChanges(true);
    toast({
      title: "Price Updated",
      description: `${tierId.charAt(0).toUpperCase() + tierId.slice(1)} tier price updated to $${editPrice}/mo`,
    });
  };

  const cancelEditing = () => {
    setEditingTier(null);
  };

  const toggleTierActive = (tierId: string) => {
    setPricing(prev => prev.map(tier =>
      tier.id === tierId ? { ...tier, isActive: !tier.isActive } : tier
    ));
    setHasChanges(true);
  };

  const togglePopular = (tierId: string) => {
    setPricing(prev => prev.map(tier => ({
      ...tier,
      isPopular: tier.id === tierId ? !tier.isPopular : false
    })));
    setHasChanges(true);
  };

  const saveAllChanges = () => {
    toast({
      title: "Changes Saved",
      description: "Subscription pricing has been updated. Changes will apply to new subscriptions.",
    });
    setHasChanges(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <Link to="/workhub" className="hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/workhub/admin" className="hover:text-white">Admin</Link>
            <ChevronRight className="w-4 h-4" />
            <span>Pricing Management</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <DollarSign className="w-7 h-7" />
                Subscription Pricing Management
              </h1>
              <p className="text-slate-400">Configure SmartBid™ subscription tiers and pricing</p>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <Badge className="bg-amber-500">Unsaved Changes</Badge>
              )}
              <Button 
                onClick={saveAllChanges}
                disabled={!hasChanges}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-save-all"
              >
                <Save className="w-4 h-4 mr-2" />
                Save All Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800 dark:text-amber-300">Pricing Change Notice</h4>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Price changes will only affect new subscriptions. Existing subscribers will keep their current rate until renewal or manual update.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pricing.map((tier) => (
            <Card 
              key={tier.id}
              className={`relative overflow-hidden ${!tier.isActive ? 'opacity-60' : ''}`}
            >
              {tier.isPopular && (
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}
              
              <div className={`h-2 bg-gradient-to-r ${tier.color}`} />
              
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${tier.color} text-white`}>
                      <tier.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle>{tier.name}</CardTitle>
                      <CardDescription>
                        {tier.estimateLimit ? `${tier.estimateLimit} estimates/mo` : 'Unlimited estimates'}
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={tier.isActive}
                    onCheckedChange={() => toggleTierActive(tier.id)}
                    data-testid={`switch-active-${tier.id}`}
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {editingTier === tier.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-2xl font-bold">$</span>
                      <Input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(Number(e.target.value))}
                        className="w-24 text-2xl font-bold"
                        data-testid={`input-price-${tier.id}`}
                      />
                      <span className="text-slate-500">/{tier.period}</span>
                      <Button size="sm" onClick={() => savePrice(tier.id)} className="bg-green-600" data-testid={`button-save-price-${tier.id}`}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-4xl font-bold">${tier.price}</p>
                      <span className="text-slate-500">/{tier.period}</span>
                      <Button size="sm" variant="ghost" onClick={() => startEditing(tier)} data-testid={`button-edit-price-${tier.id}`}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`popular-${tier.id}`} className="text-sm">Mark as Popular</Label>
                    <Switch
                      id={`popular-${tier.id}`}
                      checked={tier.isPopular}
                      onCheckedChange={() => togglePopular(tier.id)}
                      data-testid={`switch-popular-${tier.id}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Award className="w-5 h-5" />
              Non-Profit Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-700 dark:text-emerald-400">
                  Verified 501(c)(3) organizations receive <strong>FREE</strong> access to all SmartBid™ features.
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
                  This program cannot be modified. Non-profit access is a core platform commitment.
                </p>
              </div>
              <Badge className="bg-emerald-600 text-white text-lg px-4 py-2">
                $0 / Forever
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Subscription Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">247</p>
                <p className="text-sm text-slate-500">Total Subscribers</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-600">89</p>
                <p className="text-sm text-slate-500">Starter</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">134</p>
                <p className="text-sm text-slate-500">Pro</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-600">24</p>
                <p className="text-sm text-slate-500">Elite</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t text-center">
              <p className="text-2xl font-bold text-green-600">$28,423</p>
              <p className="text-sm text-slate-500">Monthly Recurring Revenue (MRR)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
