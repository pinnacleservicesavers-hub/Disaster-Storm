import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  FileText, Upload, Trash2, Download, Search, Filter,
  Clock, User, Shield, FolderOpen, Plus, Eye, FileCheck
} from "lucide-react";

interface ContractDocument {
  id: number;
  contract_id: string | null;
  project_id: string | null;
  document_type: string;
  document_name: string;
  description: string | null;
  file_url: string | null;
  file_size_bytes: number;
  file_mime_type: string | null;
  version: number;
  uploaded_by: string;
  uploaded_by_role: string;
  is_active: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const DOCUMENT_TYPES = [
  'Master Service Agreement (MSA)',
  'Approved Rate Sheet',
  'Job Classification',
  'Notice to Proceed (NTP)',
  'Change Order',
  'Amendment',
  'Written Modification',
  'Supplemental Agreement',
  'Procurement Documentation',
  'Subcontract Agreement',
  'Insurance Certificate',
  'Bond Documentation',
  'Safety Plan',
  'Other',
];

const ROLE_OPTIONS = [
  { value: 'prime', label: 'Prime Contractor' },
  { value: 'contractor', label: 'Contractor / Sub' },
  { value: 'fema_monitor', label: 'FEMA Monitor' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'admin', label: 'Administrator' },
];

export default function ContractDocumentsComponent() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [newDoc, setNewDoc] = useState({
    documentType: '',
    documentName: '',
    description: '',
    uploadedBy: '',
    uploadedByRole: 'contractor',
    fileContent: '' as string,
    fileMimeType: '',
    fileName: '',
  });

  const loadDocuments = useCallback(async () => {
    try {
      const data = await apiRequest('/api/fema-data/contract-documents');
      if (data.success) {
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setNewDoc(prev => ({
        ...prev,
        fileContent: base64,
        fileMimeType: file.type,
        fileName: file.name,
        documentName: prev.documentName || file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const uploadDocument = async () => {
    if (!newDoc.documentName || !newDoc.documentType || !newDoc.uploadedBy) {
      toast({ title: "Missing Fields", description: "Document name, type, and uploader name are required", variant: "destructive" });
      return;
    }
    try {
      const data = await apiRequest('/api/fema-data/contract-documents', 'POST', {
        documentType: newDoc.documentType,
        documentName: newDoc.documentName,
        description: newDoc.description,
        uploadedBy: newDoc.uploadedBy,
        uploadedByRole: newDoc.uploadedByRole,
        fileContent: newDoc.fileContent,
        fileMimeType: newDoc.fileMimeType,
      });
      if (data.success) {
        toast({ title: "Document Uploaded", description: `"${newDoc.documentName}" has been securely stored and timestamped` });
        setShowUpload(false);
        setNewDoc({ documentType: '', documentName: '', description: '', uploadedBy: '', uploadedByRole: 'contractor', fileContent: '', fileMimeType: '', fileName: '' });
        loadDocuments();
      }
    } catch (err) {
      toast({ title: "Upload Failed", description: "Could not upload document", variant: "destructive" });
    }
  };

  const deleteDocument = async (id: number, name: string) => {
    try {
      await apiRequest(`/api/fema-data/contract-documents/${id}`, 'DELETE');
      toast({ title: "Document Archived", description: `"${name}" has been archived` });
      loadDocuments();
    } catch (err) {
      toast({ title: "Error", description: "Failed to archive document", variant: "destructive" });
    }
  };

  const downloadDocument = (doc: ContractDocument) => {
    if (!doc.file_url) {
      toast({ title: "No File", description: "This document record has no attached file", variant: "destructive" });
      return;
    }
    const a = document.createElement('a');
    a.href = doc.file_url;
    a.download = doc.document_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredDocs = documents.filter(d => {
    if (filterType !== 'all' && d.document_type !== filterType) return false;
    if (searchQuery && !d.document_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !d.document_type.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !d.uploaded_by.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTypeColor = (type: string) => {
    if (type.includes('MSA') || type.includes('Master')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (type.includes('Rate')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (type.includes('NTP') || type.includes('Notice')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (type.includes('Change') || type.includes('Amendment') || type.includes('Modification')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (type.includes('Insurance') || type.includes('Bond') || type.includes('Safety')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-400" />
                Contract Document Vault
              </CardTitle>
              <p className="text-sm text-slate-400 mt-1">
                Secure, immutable document storage — timestamped, user-stamped, and audit-ready
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-slate-400 border-slate-600">{documents.length} Documents</Badge>
              <Button size="sm" onClick={() => setShowUpload(true)}>
                <Plus className="h-4 w-4 mr-1" /> Upload Document
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-64 bg-slate-800 border-slate-600 text-white">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Document Types</SelectItem>
                {DOCUMENT_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading documents...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No documents yet</p>
              <p className="text-sm mt-1">Upload your first contract document to begin building your audit-ready vault</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">Document</TableHead>
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400">Uploaded By</TableHead>
                  <TableHead className="text-slate-400">Date</TableHead>
                  <TableHead className="text-slate-400">Size</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id} className="border-slate-700 hover:bg-slate-800/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-400 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-white">{doc.document_name}</p>
                          {doc.description && <p className="text-xs text-slate-400 truncate max-w-[300px]">{doc.description}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getTypeColor(doc.document_type)}`}>
                        {doc.document_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" />
                        <span className="text-sm text-slate-300">{doc.uploaded_by}</span>
                        <Badge variant="outline" className="text-[10px] ml-1 text-slate-500 border-slate-600">{doc.uploaded_by_role}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {new Date(doc.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {doc.file_size_bytes > 0 ? formatFileSize(doc.file_size_bytes) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {doc.file_url && (
                          <Button variant="ghost" size="sm" onClick={() => downloadDocument(doc)} className="h-7 px-2">
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => deleteDocument(doc.id, doc.document_name)} className="h-7 px-2 text-red-400 hover:text-red-300">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-400" />
              Upload Contract Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Document Type *</Label>
              <Select value={newDoc.documentType} onValueChange={(v) => setNewDoc(p => ({ ...p, documentType: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Document Name *</Label>
              <Input value={newDoc.documentName} onChange={(e) => setNewDoc(p => ({ ...p, documentName: e.target.value }))}
                placeholder="e.g., MSA - AshBritt Environmental - DR-4784"
                className="bg-slate-800 border-slate-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea value={newDoc.description} onChange={(e) => setNewDoc(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of the document..."
                className="bg-slate-800 border-slate-600 text-white mt-1" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">Uploaded By *</Label>
                <Input value={newDoc.uploadedBy} onChange={(e) => setNewDoc(p => ({ ...p, uploadedBy: e.target.value }))}
                  placeholder="Your name"
                  className="bg-slate-800 border-slate-600 text-white mt-1" />
              </div>
              <div>
                <Label className="text-slate-300">Role</Label>
                <Select value={newDoc.uploadedByRole} onValueChange={(v) => setNewDoc(p => ({ ...p, uploadedByRole: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Attach File (max 10MB)</Label>
              <div className="mt-1 border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                <input type="file" onChange={handleFileSelect} className="hidden" id="doc-file-input"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png" />
                <label htmlFor="doc-file-input" className="cursor-pointer">
                  {newDoc.fileName ? (
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <FileCheck className="h-5 w-5" />
                      <span className="text-sm">{newDoc.fileName}</span>
                    </div>
                  ) : (
                    <div className="text-slate-400">
                      <Upload className="h-6 w-6 mx-auto mb-1" />
                      <p className="text-sm">Click to select file</p>
                      <p className="text-xs text-slate-500">PDF, DOC, XLS, CSV, TXT, JPG, PNG</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button onClick={uploadDocument}>
              <Shield className="h-4 w-4 mr-1" /> Upload & Timestamp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
