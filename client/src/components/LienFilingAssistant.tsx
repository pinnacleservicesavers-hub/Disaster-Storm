import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Scale, FileText, AlertTriangle, CheckCircle, Clock, Calendar, 
  Building, User, MapPin, DollarSign, Send, ExternalLink, 
  Volume2, VolumeX, Loader2, Shield, X, AlertCircle, Info
} from 'lucide-react';
import { stateLienLaws, getLienLaw, calculateLienDeadline, getStatesList, type StateLienLaw } from '@shared/lienLaws';

interface LienFilingData {
  propertyOwnerName: string;
  propertyOwnerAddress: string;
  propertyAddress: string;
  propertyLegalDescription: string;
  propertyCounty: string;
  propertyState: string;
  claimantName: string;
  claimantAddress: string;
  claimantLicenseNumber: string;
  generalContractorName: string;
  generalContractorAddress: string;
  firstFurnishingDate: string;
  lastFurnishingDate: string;
  completionDate: string;
  amountClaimed: string;
  workDescription: string;
  materialsProvided: string;
  preliminaryNoticeSent: boolean;
  preliminaryNoticeDate: string;
  noticeOfIntentSent: boolean;
  noticeOfIntentDate: string;
}

interface ComplianceCheck {
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface LienFilingAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  prefillData?: Partial<LienFilingData>;
  customerName?: string;
  jobId?: string;
}

export default function LienFilingAssistant({ isOpen, onClose, prefillData, customerName, jobId }: LienFilingAssistantProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isValidating, setIsValidating] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [formProgress, setFormProgress] = useState(0);
  
  const [formData, setFormData] = useState<LienFilingData>({
    propertyOwnerName: prefillData?.propertyOwnerName || '',
    propertyOwnerAddress: prefillData?.propertyOwnerAddress || '',
    propertyAddress: prefillData?.propertyAddress || '',
    propertyLegalDescription: prefillData?.propertyLegalDescription || '',
    propertyCounty: prefillData?.propertyCounty || '',
    propertyState: prefillData?.propertyState || 'FL',
    claimantName: prefillData?.claimantName || '',
    claimantAddress: prefillData?.claimantAddress || '',
    claimantLicenseNumber: prefillData?.claimantLicenseNumber || '',
    generalContractorName: prefillData?.generalContractorName || '',
    generalContractorAddress: prefillData?.generalContractorAddress || '',
    firstFurnishingDate: prefillData?.firstFurnishingDate || '',
    lastFurnishingDate: prefillData?.lastFurnishingDate || '',
    completionDate: prefillData?.completionDate || '',
    amountClaimed: prefillData?.amountClaimed || '',
    workDescription: prefillData?.workDescription || '',
    materialsProvided: prefillData?.materialsProvided || '',
    preliminaryNoticeSent: prefillData?.preliminaryNoticeSent || false,
    preliminaryNoticeDate: prefillData?.preliminaryNoticeDate || '',
    noticeOfIntentSent: prefillData?.noticeOfIntentSent || false,
    noticeOfIntentDate: prefillData?.noticeOfIntentDate || ''
  });

  const selectedStateLaw = getLienLaw(formData.propertyState);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
          setVoices(availableVoices);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    const filledFields = Object.entries(formData).filter(([key, value]) => {
      if (typeof value === 'boolean') return true;
      return value && value.toString().trim() !== '';
    }).length;
    const totalFields = Object.keys(formData).length;
    setFormProgress(Math.round((filledFields / totalFields) * 100));
  }, [formData]);

  const getBestFemaleVoice = (): SpeechSynthesisVoice | null => {
    if (!voices || voices.length === 0) return null;
    const preferredVoices = ['Samantha', 'Karen', 'Microsoft Zira', 'Microsoft Jenny', 'Google US English Female'];
    for (const preferred of preferredVoices) {
      const voice = voices.find(v => v.name.toLowerCase().includes(preferred.toLowerCase()));
      if (voice) return voice;
    }
    return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
  };

  const speakGuidance = (text: string) => {
    if (!('speechSynthesis' in window) || voices.length === 0) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const femaleVoice = getBestFemaleVoice();
    if (femaleVoice) utterance.voice = femaleVoice;
    utterance.rate = 1.05;
    utterance.pitch = 1.1;
    utterance.volume = 0.9;
    utterance.onend = () => setIsVoiceActive(false);
    setIsVoiceActive(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopVoice = () => {
    window.speechSynthesis.cancel();
    setIsVoiceActive(false);
  };

  const validateCompliance = async () => {
    setIsValidating(true);
    const checks: ComplianceCheck[] = [];
    const law = selectedStateLaw;

    if (!law) {
      checks.push({ passed: false, message: 'State lien law not found', severity: 'error' });
      setComplianceChecks(checks);
      setIsValidating(false);
      return false;
    }

    if (law.preliminaryNotice.required && !formData.preliminaryNoticeSent) {
      checks.push({
        passed: false,
        message: `${law.state} requires a preliminary notice within ${law.preliminaryNotice.deadline}. You must send this notice before filing a lien.`,
        severity: 'error'
      });
    } else if (law.preliminaryNotice.required && formData.preliminaryNoticeSent) {
      checks.push({
        passed: true,
        message: 'Preliminary notice requirement satisfied',
        severity: 'info'
      });
    }

    if (law.noticeOfIntent.required && !formData.noticeOfIntentSent) {
      checks.push({
        passed: false,
        message: `${law.state} requires a Notice of Intent ${law.noticeOfIntent.daysBeforeFiling} days before filing the lien.`,
        severity: 'error'
      });
    } else if (law.noticeOfIntent.required && formData.noticeOfIntentSent) {
      checks.push({
        passed: true,
        message: 'Notice of Intent requirement satisfied',
        severity: 'info'
      });
    }

    if (formData.lastFurnishingDate) {
      const { deadline, daysRemaining } = calculateLienDeadline(formData.propertyState, new Date(formData.lastFurnishingDate));
      if (daysRemaining < 0) {
        checks.push({
          passed: false,
          message: `CRITICAL: Lien deadline has passed! The deadline was ${deadline.toLocaleDateString()}. You may have lost your lien rights.`,
          severity: 'error'
        });
      } else if (daysRemaining <= 14) {
        checks.push({
          passed: true,
          message: `URGENT: Only ${daysRemaining} days remaining to file lien. Deadline: ${deadline.toLocaleDateString()}`,
          severity: 'warning'
        });
      } else {
        checks.push({
          passed: true,
          message: `${daysRemaining} days remaining to file lien. Deadline: ${deadline.toLocaleDateString()}`,
          severity: 'info'
        });
      }
    }

    if (law.contractorLicenseRequired && !formData.claimantLicenseNumber) {
      checks.push({
        passed: false,
        message: `${law.state} requires a valid contractor license to file a lien`,
        severity: 'error'
      });
    }

    if (!formData.propertyLegalDescription) {
      checks.push({
        passed: false,
        message: 'Property legal description is required for lien recording',
        severity: 'error'
      });
    }

    if (!formData.amountClaimed || parseFloat(formData.amountClaimed) <= 0) {
      checks.push({
        passed: false,
        message: 'A valid lien amount is required',
        severity: 'error'
      });
    }

    if (!formData.workDescription) {
      checks.push({
        passed: false,
        message: 'Description of work/services provided is required',
        severity: 'error'
      });
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    setComplianceChecks(checks);
    setIsValidating(false);

    const hasErrors = checks.some(c => c.severity === 'error' && !c.passed);
    return !hasErrors;
  };

  const handleSubmitToLienItNow = async () => {
    const isCompliant = await validateCompliance();
    
    if (!isCompliant) {
      toast({
        variant: 'destructive',
        title: 'Compliance Issues Found',
        description: 'Please resolve all errors before submitting to LienItNow'
      });
      speakGuidance('I found some compliance issues that need to be resolved before filing. Please review the red items in the compliance check.');
      return;
    }

    const lienItNowData = {
      state: formData.propertyState,
      propertyAddress: formData.propertyAddress,
      propertyLegal: formData.propertyLegalDescription,
      county: formData.propertyCounty,
      owner: {
        name: formData.propertyOwnerName,
        address: formData.propertyOwnerAddress
      },
      claimant: {
        name: formData.claimantName,
        address: formData.claimantAddress,
        license: formData.claimantLicenseNumber
      },
      generalContractor: {
        name: formData.generalContractorName,
        address: formData.generalContractorAddress
      },
      dates: {
        firstFurnishing: formData.firstFurnishingDate,
        lastFurnishing: formData.lastFurnishingDate,
        completion: formData.completionDate
      },
      amount: formData.amountClaimed,
      description: formData.workDescription,
      materials: formData.materialsProvided
    };

    const encodedData = encodeURIComponent(JSON.stringify(lienItNowData));
    
    window.open(`https://www.lienitnow.com/?prefill=${encodedData}`, '_blank');
    
    toast({
      title: 'Opening LienItNow',
      description: 'Your lien filing data has been prepared. Complete the submission on LienItNow.'
    });

    speakGuidance('Great! All compliance checks passed. I\'m opening LienItNow with your pre-filled information. Just review and click submit to file your lien.');
  };

  const getStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Property Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Property State *</Label>
                <Select 
                  value={formData.propertyState} 
                  onValueChange={(v) => setFormData({...formData, propertyState: v})}
                >
                  <SelectTrigger data-testid="select-state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {getStatesList().map(state => (
                      <SelectItem key={state.code} value={state.code}>{state.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <Label>Property Address *</Label>
                <Input 
                  value={formData.propertyAddress}
                  onChange={(e) => setFormData({...formData, propertyAddress: e.target.value})}
                  placeholder="123 Main Street, City, State ZIP"
                  data-testid="input-property-address"
                />
              </div>
              
              <div>
                <Label>County *</Label>
                <Input 
                  value={formData.propertyCounty}
                  onChange={(e) => setFormData({...formData, propertyCounty: e.target.value})}
                  placeholder="Miami-Dade"
                  data-testid="input-county"
                />
              </div>
              
              <div>
                <Label>Property Owner Name *</Label>
                <Input 
                  value={formData.propertyOwnerName}
                  onChange={(e) => setFormData({...formData, propertyOwnerName: e.target.value})}
                  placeholder="John Smith"
                  data-testid="input-owner-name"
                />
              </div>
              
              <div className="col-span-2">
                <Label>Property Owner Address</Label>
                <Input 
                  value={formData.propertyOwnerAddress}
                  onChange={(e) => setFormData({...formData, propertyOwnerAddress: e.target.value})}
                  placeholder="Owner mailing address"
                  data-testid="input-owner-address"
                />
              </div>
              
              <div className="col-span-2">
                <Label>Legal Description *</Label>
                <Textarea 
                  value={formData.propertyLegalDescription}
                  onChange={(e) => setFormData({...formData, propertyLegalDescription: e.target.value})}
                  placeholder="Lot 5, Block 12, Sunshine Estates, as recorded in Plat Book 45, Page 72..."
                  className="min-h-[80px]"
                  data-testid="input-legal-description"
                />
                <p className="text-xs text-gray-500 mt-1">Find this on the property deed or county records</p>
              </div>
            </div>

            {selectedStateLaw && (
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">{selectedStateLaw.state} Lien Law Summary</p>
                      <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                        {selectedStateLaw.lienDeadline.description}
                      </p>
                      {selectedStateLaw.preliminaryNotice.required && (
                        <p className="text-sm text-blue-600 dark:text-blue-300">
                          ⚠️ Preliminary notice required: {selectedStateLaw.preliminaryNotice.deadline}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Claimant & Contractor Information</h3>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-3">Your Information (Lien Claimant)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Company/Contractor Name *</Label>
                    <Input 
                      value={formData.claimantName}
                      onChange={(e) => setFormData({...formData, claimantName: e.target.value})}
                      placeholder="ABC Roofing LLC"
                      data-testid="input-claimant-name"
                    />
                  </div>
                  
                  <div>
                    <Label>Contractor License # {selectedStateLaw?.contractorLicenseRequired ? '*' : ''}</Label>
                    <Input 
                      value={formData.claimantLicenseNumber}
                      onChange={(e) => setFormData({...formData, claimantLicenseNumber: e.target.value})}
                      placeholder="CCC123456"
                      data-testid="input-license"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Company Address *</Label>
                    <Input 
                      value={formData.claimantAddress}
                      onChange={(e) => setFormData({...formData, claimantAddress: e.target.value})}
                      placeholder="456 Business Ave, City, State ZIP"
                      data-testid="input-claimant-address"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-3">General Contractor (if you're a subcontractor)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>GC Name</Label>
                    <Input 
                      value={formData.generalContractorName}
                      onChange={(e) => setFormData({...formData, generalContractorName: e.target.value})}
                      placeholder="XYZ General Contractors"
                      data-testid="input-gc-name"
                    />
                  </div>
                  
                  <div>
                    <Label>GC Address</Label>
                    <Input 
                      value={formData.generalContractorAddress}
                      onChange={(e) => setFormData({...formData, generalContractorAddress: e.target.value})}
                      placeholder="789 Contractor Blvd"
                      data-testid="input-gc-address"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Work Dates & Amount</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Day of Work/Materials *</Label>
                <Input 
                  type="date"
                  value={formData.firstFurnishingDate}
                  onChange={(e) => setFormData({...formData, firstFurnishingDate: e.target.value})}
                  data-testid="input-first-date"
                />
              </div>
              
              <div>
                <Label>Last Day of Work/Materials *</Label>
                <Input 
                  type="date"
                  value={formData.lastFurnishingDate}
                  onChange={(e) => setFormData({...formData, lastFurnishingDate: e.target.value})}
                  data-testid="input-last-date"
                />
              </div>
              
              <div>
                <Label>Project Completion Date</Label>
                <Input 
                  type="date"
                  value={formData.completionDate}
                  onChange={(e) => setFormData({...formData, completionDate: e.target.value})}
                  data-testid="input-completion-date"
                />
              </div>
              
              <div>
                <Label>Amount Claimed ($) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    type="number"
                    value={formData.amountClaimed}
                    onChange={(e) => setFormData({...formData, amountClaimed: e.target.value})}
                    placeholder="45000.00"
                    className="pl-8"
                    data-testid="input-amount"
                  />
                </div>
              </div>
              
              <div className="col-span-2">
                <Label>Description of Work/Services *</Label>
                <Textarea 
                  value={formData.workDescription}
                  onChange={(e) => setFormData({...formData, workDescription: e.target.value})}
                  placeholder="Complete roof replacement including tear-off, underlayment, and installation of architectural shingles..."
                  className="min-h-[100px]"
                  data-testid="input-work-description"
                />
              </div>
              
              <div className="col-span-2">
                <Label>Materials Provided</Label>
                <Textarea 
                  value={formData.materialsProvided}
                  onChange={(e) => setFormData({...formData, materialsProvided: e.target.value})}
                  placeholder="30 squares of GAF Timberline HDZ shingles, synthetic underlayment, flashing, etc."
                  className="min-h-[80px]"
                  data-testid="input-materials"
                />
              </div>
            </div>

            {formData.lastFurnishingDate && selectedStateLaw && (
              <Card className={`border-2 ${
                calculateLienDeadline(formData.propertyState, new Date(formData.lastFurnishingDate)).daysRemaining < 0 
                  ? 'bg-red-50 border-red-300' 
                  : calculateLienDeadline(formData.propertyState, new Date(formData.lastFurnishingDate)).daysRemaining <= 14
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-green-50 border-green-300'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Lien Filing Deadline</p>
                      <p className="text-sm">
                        {(() => {
                          const { deadline, daysRemaining } = calculateLienDeadline(formData.propertyState, new Date(formData.lastFurnishingDate));
                          if (daysRemaining < 0) return `EXPIRED - Deadline was ${deadline.toLocaleDateString()}`;
                          return `${deadline.toLocaleDateString()} (${daysRemaining} days remaining)`;
                        })()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Notice Requirements & Compliance</h3>
            </div>
            
            {selectedStateLaw?.preliminaryNotice.required && (
              <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-800 dark:text-amber-200">Preliminary Notice Required</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                        {selectedStateLaw.preliminaryNotice.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          id="prelim-notice"
                          checked={formData.preliminaryNoticeSent}
                          onCheckedChange={(checked) => setFormData({...formData, preliminaryNoticeSent: checked as boolean})}
                        />
                        <Label htmlFor="prelim-notice" className="text-sm">I have sent the preliminary notice</Label>
                      </div>
                      {formData.preliminaryNoticeSent && (
                        <div className="mt-2">
                          <Label className="text-sm">Date Sent</Label>
                          <Input 
                            type="date"
                            value={formData.preliminaryNoticeDate}
                            onChange={(e) => setFormData({...formData, preliminaryNoticeDate: e.target.value})}
                            className="mt-1 max-w-[200px]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedStateLaw?.noticeOfIntent.required && (
              <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-800 dark:text-amber-200">Notice of Intent Required</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                        {selectedStateLaw.noticeOfIntent.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          id="intent-notice"
                          checked={formData.noticeOfIntentSent}
                          onCheckedChange={(checked) => setFormData({...formData, noticeOfIntentSent: checked as boolean})}
                        />
                        <Label htmlFor="intent-notice" className="text-sm">I have sent the Notice of Intent</Label>
                      </div>
                      {formData.noticeOfIntentSent && (
                        <div className="mt-2">
                          <Label className="text-sm">Date Sent</Label>
                          <Input 
                            type="date"
                            value={formData.noticeOfIntentDate}
                            onChange={(e) => setFormData({...formData, noticeOfIntentDate: e.target.value})}
                            className="mt-1 max-w-[200px]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              onClick={validateCompliance}
              className="w-full"
              disabled={isValidating}
              data-testid="button-validate"
            >
              {isValidating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Validating...</>
              ) : (
                <><Shield className="w-4 h-4 mr-2" /> Run Compliance Check</>
              )}
            </Button>

            {complianceChecks.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Compliance Results</h4>
                {complianceChecks.map((check, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg flex items-start gap-2 ${
                      check.severity === 'error' 
                        ? 'bg-red-50 border border-red-200' 
                        : check.severity === 'warning'
                          ? 'bg-amber-50 border border-amber-200'
                          : 'bg-green-50 border border-green-200'
                    }`}
                  >
                    {check.severity === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    ) : check.severity === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm">{check.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Send className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Review & Submit to LienItNow</h3>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Property</p>
                  <p className="font-medium">{formData.propertyAddress}</p>
                </div>
                <div>
                  <p className="text-gray-500">Owner</p>
                  <p className="font-medium">{formData.propertyOwnerName}</p>
                </div>
                <div>
                  <p className="text-gray-500">State</p>
                  <p className="font-medium">{selectedStateLaw?.state}</p>
                </div>
                <div>
                  <p className="text-gray-500">Amount</p>
                  <p className="font-medium text-green-600">${parseFloat(formData.amountClaimed || '0').toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Claimant</p>
                  <p className="font-medium">{formData.claimantName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Work Period</p>
                  <p className="font-medium">{formData.firstFurnishingDate} to {formData.lastFurnishingDate}</p>
                </div>
              </div>
              
              <div className="pt-3 border-t">
                <p className="text-gray-500 text-sm">Work Description</p>
                <p className="text-sm">{formData.workDescription}</p>
              </div>
            </div>

            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <ExternalLink className="w-6 h-6 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200">Ready to File with LienItNow</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-300 mb-3">
                      All your information is ready. Click below to open LienItNow with pre-filled data. 
                      Review the information and click submit on their site to complete the filing.
                    </p>
                    <p className="text-xs text-blue-500">
                      Estimated filing fee: ${selectedStateLaw?.filingFee.min} - ${selectedStateLaw?.filingFee.max}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleSubmitToLienItNow}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
              data-testid="button-submit-lien"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Submit to LienItNow
            </Button>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6" />
              <div>
                <h2 className="font-semibold">AI Lien Filing Assistant</h2>
                <p className="text-sm text-blue-100">
                  {customerName ? `Filing for: ${customerName}` : 'Complete lien filing for non-paying customers'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => isVoiceActive ? stopVoice() : speakGuidance('I\'m Rachel, your AI lien filing assistant. I\'ll help you complete all the required information and ensure compliance with state-specific lien laws. Let\'s get your lien filed correctly!')}
                className="text-white hover:bg-blue-500"
              >
                {isVoiceActive ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="text-white hover:bg-blue-500"
                data-testid="button-close-lien-assistant"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="px-4 py-3 border-b bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Step {step} of 5</span>
              <span className="text-sm text-gray-600">{formProgress}% complete</span>
            </div>
            <Progress value={(step / 5) * 100} className="h-2" />
            <div className="flex justify-between mt-2">
              {['Property', 'Parties', 'Work/Amount', 'Notices', 'Submit'].map((label, idx) => (
                <span 
                  key={label}
                  className={`text-xs ${step > idx ? 'text-blue-600 font-medium' : 'text-gray-400'}`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {getStepContent()}
          </div>

          <div className="flex items-center justify-between p-4 border-t bg-gray-50 dark:bg-gray-800">
            <Button 
              variant="outline" 
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              data-testid="button-prev-step"
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              {step < 5 ? (
                <Button 
                  onClick={() => setStep(Math.min(5, step + 1))}
                  data-testid="button-next-step"
                >
                  Next Step
                </Button>
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
