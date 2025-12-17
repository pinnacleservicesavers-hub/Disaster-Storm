import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, FileDown, Upload, Calculator, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface IndustryBenchmarkProps {
  customerId?: string;
  existingInvoiceItems?: InvoiceLine[];
}

interface InvoiceLine {
  desc: string;
  qty: number;
  unit: string;
  unit_price: number;
  code?: string;
}

interface Catalog {
  id: string;
  name: string;
  region?: string;
  effective?: string;
  items?: CatalogItem[];
}

interface CatalogItem {
  code: string;
  name: string;
  unit: string;
  unit_price: number;
  notes: string;
}

interface ComparisonRow {
  idx: number;
  desc: string;
  qty: number;
  unit: string;
  contractor_unit: number;
  contractor_total: number;
  code: string;
  name: string;
  x_unit: number;
  x_total: number;
  variance: number;
  variance_pct: number | null;
}

export function XactimateComparables({ customerId, existingInvoiceItems = [] }: IndustryBenchmarkProps) {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [catalogId, setCatalogId] = useState('');
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [invoice, setInvoice] = useState<InvoiceLine[]>(
    existingInvoiceItems.length > 0 ? existingInvoiceItems : [
      { desc: '', qty: 1, unit: 'EA', unit_price: 0 }
    ]
  );
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [totals, setTotals] = useState({ contractor: 0, x: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load catalogs on mount
  useEffect(() => {
    loadCatalogs();
  }, []);

  // Load items when catalog changes
  useEffect(() => {
    if (catalogId) {
      loadItems();
    }
  }, [catalogId]);

  async function loadCatalogs() {
    try {
      const response = await fetch('/api/xact/catalogs');
      const data = await response.json();
      setCatalogs(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load industry benchmark catalogs',
        variant: 'destructive'
      });
    }
  }

  async function loadItems() {
    try {
      const response = await fetch(`/api/xact/items?catalogId=${catalogId}`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load catalog items',
        variant: 'destructive'
      });
    }
  }

  function addLine() {
    setInvoice(lines => [...lines, { desc: '', qty: 1, unit: 'EA', unit_price: 0 }]);
  }

  function updateLine(index: number, updates: Partial<InvoiceLine>) {
    setInvoice(lines => {
      const newLines = [...lines];
      newLines[index] = { ...newLines[index], ...updates };
      return newLines;
    });
  }

  function removeLine(index: number) {
    setInvoice(lines => lines.filter((_, i) => i !== index));
  }

  async function compareWithCatalog() {
    if (!catalogId) {
      toast({
        title: 'Error',
        description: 'Please select a catalog first',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/xact/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catalogId, invoice })
      });
      
      const result = await response.json();
      if (result.ok) {
        setRows(result.rows || []);
        setTotals(result.totals || { contractor: 0, x: 0 });
        toast({
          title: 'Success',
          description: `Compared ${result.rows?.length || 0} line items`,
        });
      } else {
        throw new Error(result.error || 'Comparison failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to compare with catalog',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function exportPDF() {
    if (rows.length === 0) {
      toast({
        title: 'Error',
        description: 'Please run comparison first',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/xact/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerId, 
          compare: { rows, totals } 
        })
      });
      
      const result = await response.json();
      if (result.ok) {
        window.open(result.path, '_blank');
        toast({
          title: 'Success',
          description: 'PDF report generated successfully',
        });
      } else {
        throw new Error('PDF generation failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF report',
        variant: 'destructive'
      });
    }
  }

  function getVarianceColor(variance: number): string {
    if (variance > 0) return 'text-red-600';
    if (variance < 0) return 'text-green-600';
    return 'text-gray-600';
  }

  return (
    <Card className="w-full" data-testid="card-industry-benchmarks">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Industry Benchmark Comparables
          </span>
          <div className="flex space-x-2">
            <Button 
              onClick={compareWithCatalog} 
              disabled={isLoading || !catalogId || invoice.length === 0}
              size="sm"
              data-testid="button-compare"
            >
              <Calculator className="w-4 h-4 mr-2" />
              {isLoading ? 'Comparing...' : 'Compare'}
            </Button>
            <Button 
              onClick={exportPDF} 
              disabled={rows.length === 0}
              variant="outline"
              size="sm"
              data-testid="button-export-pdf"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Catalog Selection */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Regional Benchmark Catalog</label>
            <Select value={catalogId} onValueChange={setCatalogId} data-testid="select-catalog">
              <SelectTrigger>
                <SelectValue placeholder="Select catalog..." />
              </SelectTrigger>
              <SelectContent>
                {catalogs.map(catalog => (
                  <SelectItem key={catalog.id} value={catalog.id}>
                    {catalog.name}
                    {catalog.region && ` • ${catalog.region}`}
                    {catalog.effective && ` (${catalog.effective})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 text-sm text-gray-600">
            <p>💡 <strong>Tip:</strong> Import a CSV of industry-standard line items (code, name, unit, unit_price, notes) to compare against regional market averages.</p>
          </div>
        </div>

        {/* Invoice Lines */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Invoice Line Items</h3>
            <Button onClick={addLine} variant="outline" size="sm" data-testid="button-add-line">
              <Plus className="w-4 h-4 mr-2" />
              Add Line
            </Button>
          </div>

          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-sm font-semibold text-gray-700 bg-gray-50 p-2 rounded">
              <div className="col-span-5">Description</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-center">Unit</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-1"></div>
            </div>

            {/* Lines */}
            {invoice.map((line, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center" data-testid={`invoice-line-${index}`}>
                <Input
                  className="col-span-5"
                  value={line.desc}
                  onChange={(e) => updateLine(index, { desc: e.target.value })}
                  placeholder="e.g., Remove tree from roof, 24″ DBH"
                  data-testid={`input-desc-${index}`}
                />
                <Input
                  className="col-span-2"
                  type="number"
                  value={line.qty}
                  onChange={(e) => updateLine(index, { qty: Number(e.target.value) })}
                  data-testid={`input-qty-${index}`}
                />
                <Input
                  className="col-span-2"
                  value={line.unit}
                  onChange={(e) => updateLine(index, { unit: e.target.value })}
                  placeholder="EA"
                  data-testid={`input-unit-${index}`}
                />
                <Input
                  className="col-span-2"
                  type="number"
                  step="0.01"
                  value={line.unit_price}
                  onChange={(e) => updateLine(index, { unit_price: Number(e.target.value) })}
                  data-testid={`input-price-${index}`}
                />
                <Button
                  className="col-span-1"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLine(index)}
                  disabled={invoice.length <= 1}
                  data-testid={`button-remove-${index}`}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Results */}
        {rows.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Comparison Results</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-2 text-left">Description</th>
                    <th className="border border-gray-200 p-2 text-left">Code</th>
                    <th className="border border-gray-200 p-2 text-center">Qty</th>
                    <th className="border border-gray-200 p-2 text-center">Unit</th>
                    <th className="border border-gray-200 p-2 text-right">Contractor</th>
                    <th className="border border-gray-200 p-2 text-right">Benchmark</th>
                    <th className="border border-gray-200 p-2 text-right">Variance</th>
                    <th className="border border-gray-200 p-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index} data-testid={`comparison-row-${index}`}>
                      <td className="border border-gray-200 p-2">{row.desc}</td>
                      <td className="border border-gray-200 p-2">
                        {row.code && (
                          <Badge variant="secondary" className="text-xs">
                            {row.code}
                          </Badge>
                        )}
                      </td>
                      <td className="border border-gray-200 p-2 text-center">{row.qty}</td>
                      <td className="border border-gray-200 p-2 text-center">{row.unit}</td>
                      <td className="border border-gray-200 p-2 text-right font-mono">
                        ${row.contractor_total.toFixed(2)}
                      </td>
                      <td className="border border-gray-200 p-2 text-right font-mono">
                        ${row.x_total.toFixed(2)}
                      </td>
                      <td className={`border border-gray-200 p-2 text-right font-mono ${getVarianceColor(row.variance)}`}>
                        ${row.variance.toFixed(2)}
                      </td>
                      <td className={`border border-gray-200 p-2 text-right font-mono ${getVarianceColor(row.variance)}`}>
                        {row.variance_pct ? `${(row.variance_pct * 100).toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={4} className="border border-gray-200 p-2">TOTALS</td>
                    <td className="border border-gray-200 p-2 text-right font-mono">
                      ${totals.contractor.toFixed(2)}
                    </td>
                    <td className="border border-gray-200 p-2 text-right font-mono">
                      ${totals.x.toFixed(2)}
                    </td>
                    <td className={`border border-gray-200 p-2 text-right font-mono ${getVarianceColor(totals.contractor - totals.x)}`}>
                      ${(totals.contractor - totals.x).toFixed(2)}
                    </td>
                    <td className={`border border-gray-200 p-2 text-right font-mono ${getVarianceColor(totals.contractor - totals.x)}`}>
                      {totals.x ? `${(((totals.contractor - totals.x) / totals.x) * 100).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}