import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trash2, Eye, ChevronRight, Filter, Search, 
  TreePine, Home, Wind, Droplets, Plug, Paintbrush, Car,
  Hammer, Wrench, Settings, Building2, CheckCircle, Clock,
  AlertCircle, XCircle, Mail, Phone, MapPin, DollarSign,
  Image, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TopNav from '@/components/TopNav';
import { queryClient, apiRequest } from '@/lib/queryClient';

const WORK_TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  tree: { icon: TreePine, label: 'Tree Services', color: 'text-green-600' },
  roofing: { icon: Home, label: 'Roofing', color: 'text-red-600' },
  hvac: { icon: Wind, label: 'HVAC', color: 'text-blue-600' },
  plumbing: { icon: Droplets, label: 'Plumbing', color: 'text-cyan-600' },
  electrical: { icon: Plug, label: 'Electrical', color: 'text-yellow-600' },
  painting: { icon: Paintbrush, label: 'Painting', color: 'text-purple-600' },
  auto: { icon: Car, label: 'Auto Repair', color: 'text-orange-600' },
  general: { icon: Hammer, label: 'General Contractor', color: 'text-slate-600' },
  flooring: { icon: Building2, label: 'Flooring', color: 'text-amber-600' },
  fence: { icon: Settings, label: 'Fencing', color: 'text-teal-600' },
  concrete: { icon: Wrench, label: 'Concrete', color: 'text-gray-600' },
  other: { icon: Settings, label: 'Other', color: 'text-indigo-600' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  contacted: { label: 'Contacted', color: 'bg-blue-100 text-blue-800', icon: Mail },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800', icon: Settings },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
};

interface Submission {
  id: number;
  workType: string;
  customerName: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  description: string | null;
  photoUrls: string[] | null;
  aiAnalysis: any | null;
  estimatedPrice: { min: number; max: number } | null;
  budgetConfirmed: boolean | null;
  budgetReason: string | null;
  afterPreviewUrl: string | null;
  matchedContractors: any[] | null;
  status: string;
  urgency: string | null;
  createdAt: string;
}

export default function WorkHubAdminSubmissions() {
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: submissions = [], isLoading, refetch } = useQuery<Submission[]>({
    queryKey: ['/api/workhub/admin/submissions', workTypeFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (workTypeFilter !== 'all') params.append('workType', workTypeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const response = await fetch(`/api/workhub/admin/submissions?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      const data = await response.json();
      return data.submissions || [];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PATCH', `/api/workhub/admin/submissions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workhub/admin/submissions'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/workhub/admin/submissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workhub/admin/submissions'] });
      setDeleteId(null);
    }
  });

  const filteredSubmissions = submissions.filter(sub => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sub.customerName.toLowerCase().includes(query) ||
      sub.email.toLowerCase().includes(query) ||
      (sub.city && sub.city.toLowerCase().includes(query)) ||
      (sub.state && sub.state.toLowerCase().includes(query))
    );
  });

  const getWorkTypeIcon = (workType: string) => {
    const config = WORK_TYPE_CONFIG[workType] || WORK_TYPE_CONFIG.other;
    return config;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />

      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Link to="/workhub" className="text-slate-300 hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span>Admin</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span>Customer Submissions</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Customer Submissions</h1>
          <p className="text-slate-300">Manage and review customer project requests by work type</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by name, email, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  data-testid="input-search"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-400" />
                <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-work-type">
                    <SelectValue placeholder="Work Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Work Types</SelectItem>
                    {Object.entries(WORK_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''} found
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
              <p className="text-slate-500">Loading submissions...</p>
            </div>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No submissions found</p>
              <p className="text-sm text-slate-400 mt-2">
                {workTypeFilter !== 'all' || statusFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Customer submissions will appear here'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredSubmissions.map((submission) => {
              const workTypeConfig = getWorkTypeIcon(submission.workType);
              const WorkTypeIcon = workTypeConfig.icon;
              const statusConfig = STATUS_CONFIG[submission.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${workTypeConfig.color}`}>
                          <WorkTypeIcon className="w-6 h-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-lg">{submission.customerName}</h3>
                              <p className="text-sm text-slate-500">{workTypeConfig.label}</p>
                            </div>
                            <Badge className={statusConfig.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <Mail className="w-4 h-4" />
                              <span className="truncate">{submission.email}</span>
                            </div>
                            {submission.phone && (
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <Phone className="w-4 h-4" />
                                <span>{submission.phone}</span>
                              </div>
                            )}
                            {submission.city && submission.state && (
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                <MapPin className="w-4 h-4" />
                                <span>{submission.city}, {submission.state}</span>
                              </div>
                            )}
                            {submission.estimatedPrice && (
                              <div className="flex items-center gap-2 text-green-600">
                                <DollarSign className="w-4 h-4" />
                                <span>${submission.estimatedPrice.min} - ${submission.estimatedPrice.max}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(submission.createdAt)}
                              </span>
                              {submission.photoUrls && submission.photoUrls.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Image className="w-3 h-3" />
                                  {submission.photoUrls.length} photo{submission.photoUrls.length !== 1 ? 's' : ''}
                                </span>
                              )}
                              {submission.budgetConfirmed !== null && (
                                <Badge variant={submission.budgetConfirmed ? 'default' : 'secondary'} className="text-xs">
                                  {submission.budgetConfirmed ? 'Budget Confirmed' : 'Budget Not Confirmed'}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Select
                                value={submission.status}
                                onValueChange={(status) => updateStatusMutation.mutate({ id: submission.id, status })}
                              >
                                <SelectTrigger className="w-[140px] h-8 text-xs" data-testid={`select-status-${submission.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSubmission(submission)}
                                data-testid={`button-view-${submission.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => setDeleteId(submission.id)}
                                data-testid={`button-delete-${submission.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              {selectedSubmission && `${selectedSubmission.customerName} - ${WORK_TYPE_CONFIG[selectedSubmission.workType]?.label || 'Unknown'}`}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-slate-500 mb-1">Contact Information</h4>
                  <p className="font-semibold">{selectedSubmission.customerName}</p>
                  <p className="text-sm">{selectedSubmission.email}</p>
                  {selectedSubmission.phone && <p className="text-sm">{selectedSubmission.phone}</p>}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-slate-500 mb-1">Location</h4>
                  <p className="text-sm">{selectedSubmission.address || 'No address'}</p>
                  <p className="text-sm">{selectedSubmission.city}, {selectedSubmission.state} {selectedSubmission.zip}</p>
                </div>
              </div>

              {selectedSubmission.description && (
                <div>
                  <h4 className="font-medium text-sm text-slate-500 mb-1">Description</h4>
                  <p className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">{selectedSubmission.description}</p>
                </div>
              )}

              {selectedSubmission.aiAnalysis && (
                <div>
                  <h4 className="font-medium text-sm text-slate-500 mb-1">AI Analysis</h4>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-slate-500">Complexity:</span> {selectedSubmission.aiAnalysis.complexity}</div>
                      <div><span className="text-slate-500">Confidence:</span> {selectedSubmission.aiAnalysis.aiConfidence}%</div>
                      <div><span className="text-slate-500">Time Estimate:</span> {selectedSubmission.aiAnalysis.timeEstimate}</div>
                    </div>
                    {selectedSubmission.aiAnalysis.identifiedIssues && (
                      <div className="mt-2">
                        <span className="text-slate-500">Issues:</span>
                        <ul className="list-disc list-inside mt-1">
                          {selectedSubmission.aiAnalysis.identifiedIssues.map((issue: string, i: number) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedSubmission.photoUrls && selectedSubmission.photoUrls.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-slate-500 mb-2">Photos ({selectedSubmission.photoUrls.length})</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedSubmission.photoUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedSubmission.afterPreviewUrl && (
                <div>
                  <h4 className="font-medium text-sm text-slate-500 mb-2">AI "After" Preview</h4>
                  <img
                    src={selectedSubmission.afterPreviewUrl}
                    alt="After preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              {!selectedSubmission.budgetConfirmed && selectedSubmission.budgetReason && (
                <div>
                  <h4 className="font-medium text-sm text-slate-500 mb-1">Budget Concern</h4>
                  <p className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200">
                    {selectedSubmission.budgetReason}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Submission?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The customer submission will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
