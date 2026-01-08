import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ClipboardList, 
  Search, 
  Download, 
  RefreshCw, 
  Shield,
  User,
  Clock,
  Database,
  ChevronLeft,
  ChevronRight,
  Activity,
  AlertTriangle,
  FileText
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  userId: string | null;
  userName: string;
  action: string;
  entity: string;
  entityId: string | null;
  meta: Record<string, any> | null;
  at: string | null;
}

interface AuditStats {
  totalLogs: number;
  last24Hours: number;
  last7Days: number;
  uniqueUsers: number;
  topActions: { action: string; count: number }[];
  topEntities: { entity: string; count: number }[];
}

export default function EnterpriseAuditLog() {
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    userId: '',
    startDate: '',
    endDate: '',
    limit: 50,
    offset: 0
  });

  const [searchText, setSearchText] = useState('');

  const { data: auditLogs, isLoading, refetch } = useQuery<{
    entries: AuditLogEntry[];
    total: number;
    limit: number;
    offset: number;
  }>({
    queryKey: ['/api/admin/audit-logs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.entity) params.append('entity', filters.entity);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('limit', filters.limit.toString());
      params.append('offset', filters.offset.toString());
      
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      return res.json();
    }
  });

  const { data: stats } = useQuery<AuditStats>({
    queryKey: ['/api/admin/audit-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/audit-stats', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    }
  });

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    params.append('format', 'csv');
    
    window.open(`/api/admin/audit-logs/export?${params.toString()}`, '_blank');
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) return 'bg-green-500/20 text-green-400';
    if (action.includes('delete') || action.includes('remove')) return 'bg-red-500/20 text-red-400';
    if (action.includes('update') || action.includes('edit')) return 'bg-blue-500/20 text-blue-400';
    if (action.includes('login') || action.includes('auth')) return 'bg-purple-500/20 text-purple-400';
    if (action.includes('view') || action.includes('read')) return 'bg-gray-500/20 text-gray-400';
    return 'bg-yellow-500/20 text-yellow-400';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = auditLogs ? Math.ceil(auditLogs.total / filters.limit) : 0;
  const currentPage = Math.floor(filters.offset / filters.limit) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-emerald-400" />
              Enterprise Audit Log
            </h1>
            <p className="text-slate-400 mt-1">
              SOC2-Ready Compliance Tracking - Who did what, when
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="border-slate-600 hover:bg-slate-700"
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={handleExport}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="button-export"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Logs</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-total-logs">
                    {stats?.totalLogs?.toLocaleString() || '0'}
                  </p>
                </div>
                <Database className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Last 24 Hours</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-24h-logs">
                    {stats?.last24Hours?.toLocaleString() || '0'}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Last 7 Days</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-7d-logs">
                    {stats?.last7Days?.toLocaleString() || '0'}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Unique Users</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-unique-users">
                    {stats?.uniqueUsers?.toLocaleString() || '0'}
                  </p>
                </div>
                <User className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Action</label>
                <Input
                  placeholder="e.g., create, update..."
                  value={filters.action}
                  onChange={(e) => setFilters(f => ({ ...f, action: e.target.value, offset: 0 }))}
                  className="bg-slate-700/50 border-slate-600"
                  data-testid="input-filter-action"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Entity</label>
                <Input
                  placeholder="e.g., user, claim..."
                  value={filters.entity}
                  onChange={(e) => setFilters(f => ({ ...f, entity: e.target.value, offset: 0 }))}
                  className="bg-slate-700/50 border-slate-600"
                  data-testid="input-filter-entity"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Start Date</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value, offset: 0 }))}
                  className="bg-slate-700/50 border-slate-600"
                  data-testid="input-filter-start-date"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">End Date</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value, offset: 0 }))}
                  className="bg-slate-700/50 border-slate-600"
                  data-testid="input-filter-end-date"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({
                    action: '',
                    entity: '',
                    userId: '',
                    startDate: '',
                    endDate: '',
                    limit: 50,
                    offset: 0
                  })}
                  className="w-full border-slate-600 hover:bg-slate-700"
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Audit Trail
            </CardTitle>
            <CardDescription>
              Showing {auditLogs?.entries.length || 0} of {auditLogs?.total || 0} entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-slate-700" />
                ))}
              </div>
            ) : auditLogs?.entries.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit log entries found</p>
                <p className="text-sm">Actions will appear here as they occur</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs?.entries.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="bg-slate-700/30 rounded-lg p-4 hover:bg-slate-700/50 transition-colors"
                    data-testid={`audit-entry-${entry.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getActionBadgeColor(entry.action)}>
                            {entry.action}
                          </Badge>
                          <span className="text-slate-400 text-sm">{entry.entity}</span>
                          {entry.entityId && (
                            <span className="text-slate-500 text-xs font-mono">
                              ID: {entry.entityId.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {entry.userName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(entry.at)}
                          </span>
                        </div>
                        {entry.meta && Object.keys(entry.meta).length > 0 && (
                          <div className="mt-2 text-xs text-slate-500 font-mono bg-slate-800/50 rounded p-2 max-w-2xl overflow-x-auto">
                            {JSON.stringify(entry.meta, null, 2).slice(0, 200)}
                            {JSON.stringify(entry.meta).length > 200 && '...'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setFilters(f => ({ ...f, offset: f.offset - f.limit }))}
                    className="border-slate-600"
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setFilters(f => ({ ...f, offset: f.offset + f.limit }))}
                    className="border-slate-600"
                    data-testid="button-next-page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">Top Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.topActions.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Badge className={getActionBadgeColor(item.action)}>
                        {item.action}
                      </Badge>
                      <span className="text-slate-400">{item.count}</span>
                    </div>
                  ))}
                  {stats.topActions.length === 0 && (
                    <p className="text-slate-500 text-sm">No actions recorded yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">Top Entities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.topEntities.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-slate-300">{item.entity}</span>
                      <span className="text-slate-400">{item.count}</span>
                    </div>
                  ))}
                  {stats.topEntities.length === 0 && (
                    <p className="text-slate-500 text-sm">No entities recorded yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
