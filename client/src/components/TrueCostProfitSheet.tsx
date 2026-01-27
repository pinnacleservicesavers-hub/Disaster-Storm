import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Calculator,
  DollarSign,
  Users,
  Truck,
  Package,
  Building2,
  Plus,
  Trash2,
  Copy,
  FileText,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Loader2,
  Save,
  RefreshCw
} from "lucide-react";

interface TrueCostSheet {
  id: number;
  contractorId: string;
  projectName: string;
  projectDescription?: string;
  bidAmount?: string;
  targetMarginPercent?: string;
  contingencyPercent?: string;
  bondsPercent?: string;
  permitsCost?: string;
  estimatedDuration?: string;
  status: string;
  laborTotal?: string;
  equipmentTotal?: string;
  materialsTotal?: string;
  overheadTotal?: string;
  createdAt: string;
  updatedAt: string;
}

interface LaborItem {
  id: number;
  sheetId: number;
  role: string;
  quantity: number;
  baseRate: string;
  burdenPercent: string;
  regHours: string;
  otHours: string;
  otMultiplier: string;
  perDiemPerDay: string;
  lodgingPerNight: string;
  travelAllowance: string;
  totalCost: string;
}

interface EquipmentItem {
  id: number;
  sheetId: number;
  equipmentName: string;
  ownership: string;
  rateType: string;
  rate: string;
  hoursPerDay: string;
  daysUsed: string;
  fuelCost: string;
  maintenanceReservePerHr: string;
  insuranceAllocPerDay: string;
  mobilizationOneTime: string;
  totalCost: string;
}

interface MaterialItem {
  id: number;
  sheetId: number;
  itemType: string;
  description: string;
  unitCost: string;
  quantity: string;
  taxShipping: string;
  wasteFactorPercent: string;
  totalCost: string;
}

interface OverheadItem {
  id: number;
  sheetId: number;
  category: string;
  description: string;
  allocationType: string;
  amount: string;
  totalCost: string;
}

export function TrueCostProfitSheet() {
  const { toast } = useToast();
  const [activeSheet, setActiveSheet] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [activeSection, setActiveSection] = useState("summary");

  const { data: sheets, isLoading: sheetsLoading } = useQuery<TrueCostSheet[]>({
    queryKey: ["/api/truecost/sheets"],
  });

  const { data: laborItems } = useQuery<LaborItem[]>({
    queryKey: [`/api/truecost/sheets/${activeSheet}/labor`],
    enabled: !!activeSheet,
  });

  const { data: equipmentItems } = useQuery<EquipmentItem[]>({
    queryKey: [`/api/truecost/sheets/${activeSheet}/equipment`],
    enabled: !!activeSheet,
  });

  const { data: materialItems } = useQuery<MaterialItem[]>({
    queryKey: [`/api/truecost/sheets/${activeSheet}/materials`],
    enabled: !!activeSheet,
  });

  const { data: overheadItems } = useQuery<OverheadItem[]>({
    queryKey: [`/api/truecost/sheets/${activeSheet}/overhead`],
    enabled: !!activeSheet,
  });

  const currentSheet = useMemo(() => {
    return sheets?.find(s => s.id === activeSheet);
  }, [sheets, activeSheet]);

  const createSheetMutation = useMutation({
    mutationFn: async (data: { projectName: string }) => {
      return await apiRequest("/api/truecost/sheets", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/truecost/sheets"] });
      setActiveSheet(data.id);
      setIsCreating(false);
      setNewProjectName("");
      toast({ title: "Success", description: "New profit sheet created" });
    },
    onError: (error) => {
      console.error("Create sheet error:", error);
      toast({ title: "Error", description: "Failed to create sheet", variant: "destructive" });
    },
  });

  const createLaborMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/truecost/labor", {
        method: "POST",
        body: JSON.stringify({ ...data, sheetId: activeSheet }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/truecost/sheets/${activeSheet}/labor`] });
      toast({ title: "Success", description: "Labor item added" });
    },
  });

  const createEquipmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/truecost/equipment", {
        method: "POST",
        body: JSON.stringify({ ...data, sheetId: activeSheet }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/truecost/sheets/${activeSheet}/equipment`] });
      toast({ title: "Success", description: "Equipment item added" });
    },
  });

  const createMaterialMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/truecost/materials", {
        method: "POST",
        body: JSON.stringify({ ...data, sheetId: activeSheet }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/truecost/sheets/${activeSheet}/materials`] });
      toast({ title: "Success", description: "Material item added" });
    },
  });

  const createOverheadMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/truecost/overhead", {
        method: "POST",
        body: JSON.stringify({ ...data, sheetId: activeSheet }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/truecost/sheets/${activeSheet}/overhead`] });
      toast({ title: "Success", description: "Overhead item added" });
    },
  });

  const totals = useMemo(() => {
    const laborTotal = laborItems?.reduce((sum, i) => sum + Number(i.totalCost || 0), 0) || 0;
    const equipmentTotal = equipmentItems?.reduce((sum, i) => sum + Number(i.totalCost || 0), 0) || 0;
    const materialsTotal = materialItems?.reduce((sum, i) => sum + Number(i.totalCost || 0), 0) || 0;
    const overheadTotal = overheadItems?.reduce((sum, i) => sum + Number(i.totalCost || 0), 0) || 0;
    const directCosts = laborTotal + equipmentTotal + materialsTotal;
    const totalCosts = directCosts + overheadTotal;
    const bidAmount = Number(currentSheet?.bidAmount || 0);
    const contingency = totalCosts * (Number(currentSheet?.contingencyPercent || 10) / 100);
    const bonds = bidAmount * (Number(currentSheet?.bondsPercent || 0) / 100);
    const permits = Number(currentSheet?.permitsCost || 0);
    const allInCost = totalCosts + contingency + bonds + permits;
    const grossProfit = bidAmount - allInCost;
    const grossMargin = bidAmount > 0 ? (grossProfit / bidAmount) * 100 : 0;
    const breakEvenPrice = allInCost;

    return {
      laborTotal,
      equipmentTotal,
      materialsTotal,
      overheadTotal,
      directCosts,
      totalCosts,
      contingency,
      bonds,
      permits,
      allInCost,
      grossProfit,
      grossMargin,
      breakEvenPrice,
      bidAmount,
    };
  }, [laborItems, equipmentItems, materialItems, overheadItems, currentSheet]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (sheetsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-emerald-900/50 to-slate-800/50 border-emerald-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">TrueCost™ Profit Sheet</CardTitle>
                <CardDescription>Private job costing calculator for accurate bid preparation</CardDescription>
              </div>
            </div>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Sheet
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Profit Sheet</DialogTitle>
                  <DialogDescription>Start a new job costing analysis</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-white">Project Name</Label>
                    <Input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Enter project name..."
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => createSheetMutation.mutate({ projectName: newProjectName })}
                    disabled={!newProjectName.trim() || createSheetMutation.isPending}
                  >
                    {createSheetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {!activeSheet ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sheets && sheets.length > 0 ? (
            sheets.map((sheet) => (
              <Card
                key={sheet.id}
                className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 cursor-pointer transition-colors"
                onClick={() => setActiveSheet(sheet.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg">{sheet.projectName}</CardTitle>
                    <Badge variant="outline" className={
                      sheet.status === "complete" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                      sheet.status === "in_progress" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                      "bg-gray-500/20 text-gray-400 border-gray-500/30"
                    }>
                      {sheet.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {sheet.bidAmount && (
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(Number(sheet.bidAmount))}</p>
                  )}
                  <p className="text-sm text-gray-400 mt-2">
                    Created: {new Date(sheet.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full bg-slate-800/50 border-slate-700">
              <CardContent className="py-12 text-center">
                <Calculator className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-gray-400">No profit sheets yet</p>
                <p className="text-sm text-gray-500 mt-1">Create your first sheet to start analyzing job costs</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => setActiveSheet(null)} className="text-gray-400 hover:text-white">
                &larr; Back to Sheets
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h2 className="text-xl font-bold text-white">{currentSheet?.projectName}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-slate-600 text-gray-300">
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
              <Button variant="outline" size="sm" className="border-slate-600 text-gray-300">
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Labor</p>
                <p className="text-lg font-bold text-blue-400">{formatCurrency(totals.laborTotal)}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Equipment</p>
                <p className="text-lg font-bold text-orange-400">{formatCurrency(totals.equipmentTotal)}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Materials</p>
                <p className="text-lg font-bold text-purple-400">{formatCurrency(totals.materialsTotal)}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Overhead</p>
                <p className="text-lg font-bold text-pink-400">{formatCurrency(totals.overheadTotal)}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-emerald-700/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Total Cost</p>
                <p className="text-lg font-bold text-white">{formatCurrency(totals.allInCost)}</p>
              </CardContent>
            </Card>
            <Card className={`border ${totals.grossProfit >= 0 ? "bg-emerald-900/30 border-emerald-700/50" : "bg-red-900/30 border-red-700/50"}`}>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Gross Profit</p>
                <p className={`text-lg font-bold ${totals.grossProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatCurrency(totals.grossProfit)}
                </p>
                <p className="text-xs text-gray-500">({formatPercent(totals.grossMargin)} margin)</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeSection} onValueChange={setActiveSection}>
            <TabsList className="bg-slate-800/50 border border-slate-700">
              <TabsTrigger value="summary" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                <PieChart className="w-4 h-4 mr-2" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="labor" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                <Users className="w-4 h-4 mr-2" />
                Labor
              </TabsTrigger>
              <TabsTrigger value="equipment" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
                <Truck className="w-4 h-4 mr-2" />
                Equipment
              </TabsTrigger>
              <TabsTrigger value="materials" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                <Package className="w-4 h-4 mr-2" />
                Materials
              </TabsTrigger>
              <TabsTrigger value="overhead" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
                <Building2 className="w-4 h-4 mr-2" />
                Overhead
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Cost Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Labor (with burden)</span>
                        <span className="text-blue-400">{formatCurrency(totals.laborTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Equipment</span>
                        <span className="text-orange-400">{formatCurrency(totals.equipmentTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Materials</span>
                        <span className="text-purple-400">{formatCurrency(totals.materialsTotal)}</span>
                      </div>
                      <Separator className="bg-slate-700" />
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-white">Direct Costs</span>
                        <span className="text-white">{formatCurrency(totals.directCosts)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Overhead Allocation</span>
                        <span className="text-pink-400">{formatCurrency(totals.overheadTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Contingency ({currentSheet?.contingencyPercent || 10}%)</span>
                        <span className="text-yellow-400">{formatCurrency(totals.contingency)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Bonds ({currentSheet?.bondsPercent || 0}%)</span>
                        <span className="text-gray-300">{formatCurrency(totals.bonds)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Permits</span>
                        <span className="text-gray-300">{formatCurrency(totals.permits)}</span>
                      </div>
                      <Separator className="bg-slate-700" />
                      <div className="flex justify-between font-bold">
                        <span className="text-white">Total All-In Cost</span>
                        <span className="text-white">{formatCurrency(totals.allInCost)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Profit Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Bid Price</span>
                        <span className="text-emerald-400 font-medium">{formatCurrency(totals.bidAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total Cost</span>
                        <span className="text-white">{formatCurrency(totals.allInCost)}</span>
                      </div>
                      <Separator className="bg-slate-700" />
                      <div className="flex justify-between font-bold">
                        <span className="text-white">Gross Profit</span>
                        <span className={totals.grossProfit >= 0 ? "text-emerald-400" : "text-red-400"}>
                          {formatCurrency(totals.grossProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Gross Margin</span>
                        <span className={totals.grossMargin >= 0 ? "text-emerald-400" : "text-red-400"}>
                          {formatPercent(totals.grossMargin)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-amber-400" />
                        <span className="font-medium text-white">Break-Even Analysis</span>
                      </div>
                      <p className="text-sm text-gray-400">
                        Minimum bid to cover costs: <span className="text-amber-400 font-bold">{formatCurrency(totals.breakEvenPrice)}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Current bid is {totals.bidAmount > totals.breakEvenPrice ? 
                          <span className="text-emerald-400">{formatCurrency(totals.bidAmount - totals.breakEvenPrice)} above</span> : 
                          <span className="text-red-400">{formatCurrency(totals.breakEvenPrice - totals.bidAmount)} below</span>
                        } break-even
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="labor" className="mt-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      Labor Costs
                    </CardTitle>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => createLaborMutation.mutate({
                        role: "Foreman",
                        quantity: 1,
                        baseRate: "45.00",
                        burdenPercent: "35",
                        regHours: "40",
                        otHours: "0",
                      })}
                      disabled={createLaborMutation.isPending}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Labor
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {laborItems && laborItems.length > 0 ? (
                    <div className="space-y-3">
                      {laborItems.map((item) => (
                        <div key={item.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-white">{item.role}</p>
                              <p className="text-sm text-gray-400">
                                {item.quantity}x @ ${item.baseRate}/hr + {item.burdenPercent}% burden
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.regHours} reg hrs + {item.otHours} OT hrs
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-400">{formatCurrency(Number(item.totalCost))}</p>
                              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                      <p>No labor items added</p>
                      <p className="text-sm mt-1">Add crew members with hourly rates and burden</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="equipment" className="mt-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Truck className="w-5 h-5 text-orange-400" />
                      Equipment Costs
                    </CardTitle>
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700"
                      onClick={() => createEquipmentMutation.mutate({
                        equipmentName: "Bucket Truck",
                        ownership: "owned",
                        rateType: "daily",
                        rate: "350.00",
                        hoursPerDay: "8",
                        daysUsed: "5",
                      })}
                      disabled={createEquipmentMutation.isPending}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Equipment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {equipmentItems && equipmentItems.length > 0 ? (
                    <div className="space-y-3">
                      {equipmentItems.map((item) => (
                        <div key={item.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white">{item.equipmentName}</p>
                                <Badge variant="outline" className="text-xs">
                                  {item.ownership}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-400">
                                ${item.rate}/{item.rateType} x {item.daysUsed} days
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-orange-400">{formatCurrency(Number(item.totalCost))}</p>
                              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Truck className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                      <p>No equipment items added</p>
                      <p className="text-sm mt-1">Add owned, leased, or rented equipment</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="materials" className="mt-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Package className="w-5 h-5 text-purple-400" />
                      Material Costs
                    </CardTitle>
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => createMaterialMutation.mutate({
                        itemType: "material",
                        description: "2x4 Studs",
                        unitCost: "5.99",
                        quantity: "100",
                        wasteFactorPercent: "10",
                      })}
                      disabled={createMaterialMutation.isPending}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Material
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {materialItems && materialItems.length > 0 ? (
                    <div className="space-y-3">
                      {materialItems.map((item) => (
                        <div key={item.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-white">{item.description}</p>
                              <p className="text-sm text-gray-400">
                                {item.quantity} units @ ${item.unitCost}/ea
                              </p>
                              <p className="text-xs text-gray-500">
                                +{item.wasteFactorPercent}% waste factor
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-purple-400">{formatCurrency(Number(item.totalCost))}</p>
                              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                      <p>No materials added</p>
                      <p className="text-sm mt-1">Add materials with quantities and waste factors</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overhead" className="mt-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-pink-400" />
                      Overhead Costs
                    </CardTitle>
                    <Button
                      size="sm"
                      className="bg-pink-600 hover:bg-pink-700"
                      onClick={() => createOverheadMutation.mutate({
                        category: "insurance",
                        description: "General Liability Allocation",
                        allocationType: "fixed",
                        amount: "500.00",
                      })}
                      disabled={createOverheadMutation.isPending}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Overhead
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {overheadItems && overheadItems.length > 0 ? (
                    <div className="space-y-3">
                      {overheadItems.map((item) => (
                        <div key={item.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-white">{item.description}</p>
                              <p className="text-sm text-gray-400">
                                {item.category} - {item.allocationType}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-pink-400">{formatCurrency(Number(item.totalCost))}</p>
                              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                      <p>No overhead items added</p>
                      <p className="text-sm mt-1">Allocate insurance, admin, and other overhead costs</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
