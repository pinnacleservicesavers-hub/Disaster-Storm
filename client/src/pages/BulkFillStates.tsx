import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Play, Database, CheckCircle2, AlertCircle, Download, X } from 'lucide-react';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

interface BulkFillResult {
  job_id: string;
  zip: string;
  new_state: string;
}

interface BulkFillResponse {
  updated: number;
  scanned: number;
  details: BulkFillResult[];
}

export function BulkFillStates() {
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BulkFillResult[]>([]);
  const [summary, setSummary] = useState<{ updated: number; scanned: number } | null>(null);
  const [filterZip, setFilterZip] = useState('');
  const [filterState, setFilterState] = useState('');

  // Filter results based on ZIP and State
  const filteredResults = results.filter((result) => {
    const zipMatch = !filterZip || result.zip.includes(filterZip);
    const stateMatch = !filterState || result.new_state.toUpperCase() === filterState.toUpperCase();
    return zipMatch && stateMatch;
  });

  // Export filtered results to CSV
  const exportCSV = () => {
    const csvRows = [
      'job_id,zip,new_state',
      ...filteredResults.map((r) => `${r.job_id},${r.zip || ''},${r.new_state || ''}`)
    ];
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fill-states-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilterZip('');
    setFilterState('');
  };

  const bulkFill = useMutation({
    mutationFn: async () => {
      setProgress(10);
      const response = await apiRequest('/api/admin/jobs/fill_states', {
        method: 'POST',
      }) as BulkFillResponse;
      setProgress(80);
      return response;
    },
    onSuccess: (data) => {
      setResults(data.details || []);
      setSummary({ updated: data.updated, scanned: data.scanned });
      setProgress(100);
      
      toast({
        title: 'Bulk Fill Complete',
        description: `Auto-filled state for ${data.updated} jobs out of ${data.scanned} scanned`,
      });

      // Reset progress after a delay
      setTimeout(() => setProgress(0), 2000);
    },
    onError: (error: Error) => {
      setProgress(0);
      toast({
        title: 'Bulk Fill Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Bulk Fill Job States
          </h1>
          <p className="text-slate-400">
            Auto-fill missing state fields for all jobs using your ZIP→State mapping
          </p>
        </div>

        {/* Run Control */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Play className="w-5 h-5" />
              Run Bulk Fill
            </CardTitle>
            <CardDescription className="text-slate-400">
              Scans all jobs and fills missing state fields using longest-prefix ZIP matching
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => bulkFill.mutate()}
                disabled={bulkFill.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-run-bulk-fill"
              >
                <Play className="w-4 h-4 mr-2" />
                {bulkFill.isPending ? 'Processing...' : 'Run Now'}
              </Button>
              
              {progress > 0 && (
                <div className="flex-1 flex items-center gap-3">
                  <Progress value={progress} className="flex-1" />
                  <span className="text-sm text-slate-400 font-mono">{progress}%</span>
                </div>
              )}
            </div>

            {summary && (
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400">Scanned:</span>
                  <span className="text-white font-bold">{summary.scanned}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400">Updated:</span>
                  <span className="text-green-400 font-bold">{summary.updated}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        {results.length > 0 && (
          <Card className="mb-6 bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Filters</CardTitle>
              <CardDescription className="text-slate-400">
                Filter results by ZIP code or state
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="ZIP contains..."
                    value={filterZip}
                    onChange={(e) => setFilterZip(e.target.value)}
                    className="bg-slate-900 border-slate-600 text-slate-200"
                    data-testid="input-filter-zip"
                  />
                </div>
                <div className="w-32">
                  <Input
                    placeholder="State"
                    value={filterState}
                    onChange={(e) => setFilterState(e.target.value.toUpperCase())}
                    className="bg-slate-900 border-slate-600 text-slate-200"
                    maxLength={2}
                    data-testid="input-filter-state"
                  />
                </div>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  data-testid="button-clear-filters"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button
                  onClick={exportCSV}
                  variant="outline"
                  size="sm"
                  className="border-green-600 text-green-400 hover:bg-green-600/20"
                  data-testid="button-export-csv"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <div className="text-sm text-slate-400">
                  {filteredResults.length} / {results.length} results
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Table */}
        {results.length > 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Results</CardTitle>
              <CardDescription className="text-slate-400">
                Jobs that were auto-filled with state information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-96 rounded-lg border border-slate-700">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-800 border-b border-slate-700">
                    <tr>
                      <th className="p-3 text-left text-slate-300 font-semibold">Job ID</th>
                      <th className="p-3 text-left text-slate-300 font-semibold">ZIP Code</th>
                      <th className="p-3 text-left text-slate-300 font-semibold">New State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.length > 0 ? filteredResults.map((result, idx) => (
                      <tr
                        key={result.job_id}
                        className={idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/30'}
                        data-testid={`row-result-${idx}`}
                      >
                        <td className="p-3 font-mono text-blue-400" data-testid={`text-job-id-${idx}`}>
                          {result.job_id}
                        </td>
                        <td className="p-3 text-slate-300">{result.zip || '—'}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 font-semibold">
                            {result.new_state}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-500">
                          No matching results
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : summary && summary.updated === 0 ? (
          <Alert className="bg-yellow-500/10 border-yellow-500/50">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-yellow-400">
              No jobs needed state updates. All jobs either already have a state or are missing ZIP codes.
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Info Box */}
        <Alert className="mt-6 bg-blue-500/10 border-blue-500/50">
          <Database className="w-4 h-4" />
          <AlertDescription className="text-blue-300">
            <strong>How it works:</strong> This process scans all jobs in the system and attempts to fill
            missing state fields using the ZIP→State prefix mapping. The longest-prefix matching algorithm
            ensures accurate state detection (e.g., "968" for Hawaii matches before "9" for California).
          </AlertDescription>
        </Alert>
      </div>
      <ModuleAIAssistant 
        moduleName="Bulk Fill States"
        moduleContext="Automated state field population tool using ZIP code prefix mapping. Rachel can explain how the longest-prefix matching algorithm works, help troubleshoot bulk updates, and guide you through filtering and exporting results."
      />
    </div>
  );
}
