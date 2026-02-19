import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Download, Loader2, FileText, Wand2, Pencil, Eye, RefreshCw, X,
  Phone, Globe, Shield, CheckCircle2, Zap, Star, Clock, Award
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface BrochurePanel {
  title: string;
  subtitle?: string;
  body: string[];
  highlights?: string[];
  footer?: string;
}

interface BrochureData {
  companyName: string;
  tagline: string;
  phone: string;
  website: string;
  credentials: string[];
  accentColor: string;
  panels: BrochurePanel[];
  heroImageUrl?: string;
}

interface BrochureBuilderProps {
  onClose?: () => void;
}

const defaultBrochureData: BrochureData = {
  companyName: '',
  tagline: '',
  phone: '',
  website: '',
  credentials: [],
  accentColor: '#D4FF00',
  panels: [],
};

export default function BrochureBuilder({ onClose }: BrochureBuilderProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [brochureData, setBrochureData] = useState<BrochureData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<BrochureData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const brochureRef = useRef<HTMLDivElement>(null);

  const generateMutation = useMutation({
    mutationFn: async (userPrompt: string) => {
      const res = await apiRequest("/api/ai-ads/generate-brochure", "POST", {
        prompt: userPrompt,
      });
      return res;
    },
    onSuccess: (data) => {
      if (data.success && data.brochure) {
        setBrochureData(data.brochure);
        setEditData(null);
        setIsEditing(false);
        toast({ title: "Brochure Ready!", description: "Your professional brochure has been generated. Review and edit any text before downloading." });
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to generate brochure", variant: "destructive" });
    }
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({ title: "Describe your brochure", description: "Tell us about your business and what you want on the brochure", variant: "destructive" });
      return;
    }
    generateMutation.mutate(prompt.trim());
  };

  const startEditing = () => {
    setEditData(brochureData ? { ...brochureData, panels: brochureData.panels.map(p => ({ ...p, body: [...p.body], highlights: p.highlights ? [...p.highlights] : undefined })) } : null);
    setIsEditing(true);
  };

  const saveEdits = () => {
    if (editData) {
      setBrochureData(editData);
      setIsEditing(false);
      toast({ title: "Changes saved!" });
    }
  };

  const downloadPDF = useCallback(async () => {
    if (!brochureData) return;
    setIsDownloading(true);
    try {
      const response = await fetch('/api/ai-ads/brochure-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brochureData }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'PDF generation failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brochure-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Professional PDF Downloaded!", description: "Multi-column brochure PDF generated with WeasyPrint — print-ready quality." });
    } catch (err: any) {
      console.error('PDF generation error:', err);
      toast({ title: "Download failed", description: err.message || "Try again", variant: "destructive" });
    }
    setIsDownloading(false);
  }, [brochureData, toast]);

  const data = isEditing ? editData : brochureData;

  return (
    <div className="space-y-6">
      {!brochureData && (
        <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-6 h-6 text-indigo-600" />
              <span className="text-indigo-600">Professional Brochure Builder</span>
            </CardTitle>
            <p className="text-sm text-slate-500">AI generates clean hero images + professional text layout — no misspelled text in images</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your business and what you want on the brochure. Include: company name, phone number, website, services offered, certifications, tagline, and any specific panels you want (residential, commercial, emergency, etc.)."
              className="min-h-[140px] resize-none text-base"
            />

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-3 text-lg"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating Professional Brochure...</>
              ) : (
                <><Wand2 className="w-5 h-5 mr-2" />Build My Brochure</>
              )}
            </Button>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Try these examples:</p>
              {[
                "Create a tri-fold brochure for Strategic Land Management — tree removal, trimming, land clearing, forestry mulching, stump grinding, debris haul-off. Service Disabled Veteran Owned Business, Licensed, Insured, Bonded, Certified Arborist. Tagline: WHEN TREES FALL — WE RISE. Phone: 800-628-2229, Website: strategiclandmgmt.com. Include residential, emergency 24/7, and commercial/municipal panels. Accent color: neon safety yellow.",
                "Create a professional brochure for ABC Roofing — residential & commercial roofing, storm damage repair, insurance claim assistance. Licensed, Bonded, Insured, GAF Master Elite Contractor. Phone: 555-123-4567, Website: abcroofing.com. Include services, warranty info, and financing panels.",
                "Design a brochure for Premier Restoration — water damage, fire damage, mold remediation, storm cleanup. IICRC Certified, 24/7 emergency service. Phone: 800-555-0199, Website: premierrestoration.com. Tagline: Restoring What Matters Most."
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(example)}
                  className="block w-full text-left text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 p-2 rounded transition-colors"
                >
                  → {example.substring(0, 120)}...
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {generateMutation.isPending && !brochureData && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
              <Wand2 className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Building your professional brochure...</h3>
            <p className="text-slate-500">AI is generating clean hero images and professional text layout. This takes about 20-30 seconds.</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600 text-white"><CheckCircle2 className="w-3 h-3 mr-1" />Professional Layout</Badge>
              <Badge variant="outline">AI Hero Image + Your Real Text</Badge>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={saveEdits} className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle2 className="w-4 h-4 mr-1" />Save Changes
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); setEditData(null); }}>
                    <X className="w-4 h-4 mr-1" />Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={startEditing}>
                    <Pencil className="w-4 h-4 mr-1" />Edit Text
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => generateMutation.mutate(prompt.trim())} disabled={generateMutation.isPending}>
                    <RefreshCw className="w-4 h-4 mr-1" />Regenerate
                  </Button>
                  <Button size="sm" onClick={downloadPDF} disabled={isDownloading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {isDownloading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
                    Download Print-Ready PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setBrochureData(null); setEditData(null); setIsEditing(false); setPrompt(''); }}
                    className="text-red-500 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                  >
                    <X className="w-4 h-4 mr-1" />Clear & Start Over
                  </Button>
                </>
              )}
            </div>
          </div>

          {isEditing && editData && (
            <Card className="border-2 border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-yellow-600" />
                  Edit Your Brochure Text
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Company Name</label>
                    <Input value={editData.companyName} onChange={(e) => setEditData({ ...editData, companyName: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tagline</label>
                    <Input value={editData.tagline} onChange={(e) => setEditData({ ...editData, tagline: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Phone</label>
                    <Input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Website</label>
                    <Input value={editData.website} onChange={(e) => setEditData({ ...editData, website: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Accent Color</label>
                    <div className="flex gap-2">
                      <Input type="color" value={editData.accentColor} onChange={(e) => setEditData({ ...editData, accentColor: e.target.value })} className="w-12 h-9 p-1" />
                      <Input value={editData.accentColor} onChange={(e) => setEditData({ ...editData, accentColor: e.target.value })} className="flex-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Credentials (comma-separated)</label>
                    <Input value={editData.credentials.join(', ')} onChange={(e) => setEditData({ ...editData, credentials: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                  </div>
                </div>

                {editData.panels.map((panel, pi) => (
                  <div key={pi} className="border rounded-lg p-3 space-y-2 bg-white dark:bg-slate-800">
                    <label className="text-xs font-bold text-indigo-600">Panel {pi + 1}: {panel.title}</label>
                    <Input value={panel.title} onChange={(e) => {
                      const newPanels = [...editData.panels];
                      newPanels[pi] = { ...newPanels[pi], title: e.target.value };
                      setEditData({ ...editData, panels: newPanels });
                    }} placeholder="Panel title" />
                    <Input value={panel.subtitle || ''} onChange={(e) => {
                      const newPanels = [...editData.panels];
                      newPanels[pi] = { ...newPanels[pi], subtitle: e.target.value };
                      setEditData({ ...editData, panels: newPanels });
                    }} placeholder="Panel subtitle" />
                    <Textarea value={panel.body.join('\n')} onChange={(e) => {
                      const newPanels = [...editData.panels];
                      newPanels[pi] = { ...newPanels[pi], body: e.target.value.split('\n') };
                      setEditData({ ...editData, panels: newPanels });
                    }} placeholder="Body text (one item per line)" className="min-h-[80px]" />
                    {panel.highlights && (
                      <Textarea value={panel.highlights.join('\n')} onChange={(e) => {
                        const newPanels = [...editData.panels];
                        newPanels[pi] = { ...newPanels[pi], highlights: e.target.value.split('\n') };
                        setEditData({ ...editData, panels: newPanels });
                      }} placeholder="Highlights (one per line)" className="min-h-[60px]" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="bg-slate-900 rounded-xl p-2 overflow-x-auto shadow-2xl">
            <div className="text-center text-xs text-slate-400 mb-2 flex items-center justify-center gap-2">
              <Eye className="w-3 h-3" /> Live Brochure Preview — What you see is what gets printed
            </div>
            <div ref={brochureRef} className="flex min-w-[1100px]" style={{ fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif' }}>
              {data.panels.map((panel, index) => (
                <div
                  key={index}
                  className="brochure-panel relative overflow-hidden"
                  style={{
                    width: `${100 / Math.max(data.panels.length, 1)}%`,
                    minHeight: '500px',
                    backgroundColor: '#0a0a0a',
                  }}
                >
                  {data.heroImageUrl && (
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${data.heroImageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: index === 0 ? 0.5 : 0.2,
                        filter: 'grayscale(100%) contrast(1.2)',
                      }}
                    />
                  )}

                  <div className="absolute inset-0" style={{
                    background: index === 0
                      ? 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.9) 100%)'
                      : 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%)',
                  }} />

                  <div className="relative z-10 p-6 flex flex-col h-full" style={{ minHeight: '500px' }}>
                    {index === 0 ? (
                      <>
                        <div className="flex-1 flex flex-col justify-center items-center text-center">
                          <h1 className="text-2xl font-black text-white tracking-wider mb-3 uppercase" style={{ letterSpacing: '0.15em' }}>
                            {data.companyName}
                          </h1>
                          <div className="flex flex-wrap justify-center gap-2 mb-6">
                            {data.credentials.map((cred, ci) => (
                              <span key={ci} className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: data.accentColor }}>
                                {ci > 0 && <span className="mx-1">•</span>}{cred}
                              </span>
                            ))}
                          </div>

                          <div className="w-16 h-0.5 mb-6" style={{ backgroundColor: data.accentColor }} />

                          <p className="text-lg font-bold tracking-[0.2em] uppercase mb-8" style={{ color: data.accentColor }}>
                            {data.tagline}
                          </p>

                          {panel.highlights && panel.highlights.length > 0 && (
                            <div className="mb-6">
                              <p className="text-sm font-bold text-white tracking-wider uppercase mb-1">{panel.highlights[0]}</p>
                            </div>
                          )}
                        </div>

                        <div className="text-center space-y-2 mt-auto">
                          <div className="flex items-center justify-center gap-2">
                            <Phone className="w-4 h-4" style={{ color: data.accentColor }} />
                            <span className="text-xl font-black text-white tracking-wider" style={{
                              textShadow: `0 0 20px ${data.accentColor}40`
                            }}>{data.phone}</span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <Globe className="w-3 h-3" style={{ color: data.accentColor }} />
                            <span className="text-sm font-semibold" style={{ color: data.accentColor }}>{data.website}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mb-4">
                          <h2 className="text-lg font-black tracking-[0.15em] uppercase mb-1" style={{ color: data.accentColor }}>
                            {panel.title}
                          </h2>
                          {panel.subtitle && (
                            <p className="text-xs font-semibold text-slate-300 tracking-wider uppercase">{panel.subtitle}</p>
                          )}
                          <div className="w-10 h-0.5 mt-2" style={{ backgroundColor: data.accentColor }} />
                        </div>

                        <div className="flex-1 space-y-2">
                          {panel.body.map((line, li) => {
                            const isCheckItem = line.startsWith('✔') || line.startsWith('•') || line.startsWith('-');
                            return (
                              <div key={li} className="flex items-start gap-2">
                                {isCheckItem ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: data.accentColor }} />
                                    <span className="text-xs font-medium text-white leading-relaxed">{line.replace(/^[✔•\-]\s*/, '')}</span>
                                  </>
                                ) : (
                                  <span className="text-xs font-medium text-slate-200 leading-relaxed">{line}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {panel.highlights && panel.highlights.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-700/50 space-y-1">
                            {panel.highlights.map((h, hi) => (
                              <p key={hi} className="text-[10px] font-bold tracking-wider uppercase" style={{ color: data.accentColor }}>
                                {h}
                              </p>
                            ))}
                          </div>
                        )}

                        {panel.footer && (
                          <div className="mt-3 pt-2 border-t border-slate-700/30">
                            <p className="text-[10px] text-slate-400 leading-relaxed">{panel.footer}</p>
                          </div>
                        )}

                        <div className="mt-auto pt-3 text-center">
                          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: data.accentColor }}>
                            {data.phone}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
