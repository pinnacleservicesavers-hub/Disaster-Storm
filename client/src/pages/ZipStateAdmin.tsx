import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Upload, RefreshCw, Database, FileText, Play } from 'lucide-react';

export function ZipStateAdmin() {
  const { toast } = useToast();
  const [jsonInput, setJsonInput] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Fetch current ZIP prefix map
  const { data: mapData, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/legal/zipmap'],
  });

  const currentMap = mapData as { count: number; sample: Record<string, string>; map: Record<string, string> } | undefined;

  // Upload JSON map
  const uploadJSON = useMutation({
    mutationFn: async () => {
      const map = JSON.parse(jsonInput);
      return apiRequest('/api/admin/legal/zipmap', {
        method: 'POST',
        body: JSON.stringify(map),
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: 'ZIP Map Uploaded',
        description: `Successfully uploaded ${data.count} ZIP prefix mappings`,
      });
      refetch();
      setJsonInput('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Upload CSV map
  const uploadCSV = useMutation({
    mutationFn: async () => {
      if (!csvFile) throw new Error('No file selected');
      
      const text = await csvFile.text();
      const lines = text.trim().split('\n');
      const map: Record<string, string> = {};
      
      for (const line of lines) {
        const [prefix, state] = line.split(',').map(s => s.trim());
        if (prefix && state) {
          map[prefix] = state;
        }
      }
      
      return apiRequest('/api/admin/legal/zipmap', {
        method: 'POST',
        body: JSON.stringify(map),
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: 'CSV Uploaded',
        description: `Successfully uploaded ${data.count} ZIP prefix mappings from CSV`,
      });
      refetch();
      setCsvFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'CSV Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Load default map
  const loadDefault = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/legal/zipmap/load_default', {
        method: 'POST',
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Default Map Loaded',
        description: `Loaded ${data.count} default ZIP prefix mappings`,
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: 'Load Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Bulk fill job states
  const bulkFill = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/jobs/fill_states', {
        method: 'POST',
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Bulk Fill Complete',
        description: `Auto-filled state for ${data.updated} jobs out of ${data.scanned} scanned`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Bulk Fill Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            ZIP → State Mapping Admin
          </h1>
          <p className="text-slate-400">
            Manage ZIP code prefix to state mappings with longest-prefix matching
          </p>
        </div>

        {/* Current Map Status */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Database className="w-5 h-5" />
              Current Map Status
            </CardTitle>
            <CardDescription className="text-slate-400">
              Active ZIP prefix mappings in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-slate-400">Loading...</p>
            ) : currentMap ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total Mappings:</span>
                  <span className="text-2xl font-bold text-blue-400">{currentMap.count}</span>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Sample Mappings:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {Object.entries(currentMap.sample).map(([prefix, state]) => (
                      <div
                        key={prefix}
                        className="bg-slate-700/50 rounded px-3 py-2 text-sm border border-slate-600"
                      >
                        <span className="text-slate-400 font-mono">{prefix}</span>
                        <span className="mx-2 text-slate-500">→</span>
                        <span className="text-blue-400 font-semibold">{state}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            ) : (
              <Alert className="bg-yellow-500/10 border-yellow-500/50">
                <AlertDescription className="text-yellow-400">
                  No ZIP prefix map loaded. Upload a map or load the default.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Upload Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* JSON Upload */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="w-5 h-5" />
                Paste JSON Mapping
              </CardTitle>
              <CardDescription className="text-slate-400">
                Paste a JSON object with ZIP prefix → state mappings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"005":"NY","336":"FL","900":"CA"}'
                className="bg-slate-900 border-slate-600 text-slate-200 font-mono text-sm min-h-[150px]"
                data-testid="textarea-json-map"
              />
              <Button
                onClick={() => uploadJSON.mutate()}
                disabled={!jsonInput.trim() || uploadJSON.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
                data-testid="button-upload-json"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadJSON.isPending ? 'Uploading...' : 'Upload JSON'}
              </Button>
            </CardContent>
          </Card>

          {/* CSV Upload */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Upload className="w-5 h-5" />
                Upload CSV File
              </CardTitle>
              <CardDescription className="text-slate-400">
                Upload CSV with format: prefix,state (e.g., 336,FL)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                  data-testid="input-csv-file"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer block"
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <span className="text-slate-300 block mb-1">
                    {csvFile ? csvFile.name : 'Click to select CSV file'}
                  </span>
                  <span className="text-xs text-slate-500">
                    Format: prefix,state (one per line)
                  </span>
                </label>
              </div>
              <Button
                onClick={() => uploadCSV.mutate()}
                disabled={!csvFile || uploadCSV.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
                data-testid="button-upload-csv"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadCSV.isPending ? 'Uploading...' : 'Upload CSV'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Load Default */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="w-5 h-5" />
                Load Default Map
              </CardTitle>
              <CardDescription className="text-slate-400">
                Load nationwide ZIP prefix mappings (all 50 states + territories)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => loadDefault.mutate()}
                disabled={loadDefault.isPending}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                data-testid="button-load-default"
              >
                <Database className="w-4 h-4 mr-2" />
                {loadDefault.isPending ? 'Loading...' : 'Load Default Map'}
              </Button>
            </CardContent>
          </Card>

          {/* Bulk Fill */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Play className="w-5 h-5" />
                Bulk Fill Job States
              </CardTitle>
              <CardDescription className="text-slate-400">
                Auto-fill missing state fields for all jobs using current ZIP map
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => bulkFill.mutate()}
                disabled={bulkFill.isPending || !currentMap}
                className="w-full bg-purple-600 hover:bg-purple-700"
                data-testid="button-bulk-fill"
              >
                <Play className="w-4 h-4 mr-2" />
                {bulkFill.isPending ? 'Processing...' : 'Run Bulk Fill Now'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Alert className="mt-6 bg-blue-500/10 border-blue-500/50">
          <MapPin className="w-4 h-4" />
          <AlertDescription className="text-blue-300">
            <strong>How it works:</strong> ZIP codes are matched using longest-prefix algorithm.
            For example, "968" (Hawaii) will match before "9" (California), giving you precise state detection.
            A nightly scheduler automatically fills missing job states.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
