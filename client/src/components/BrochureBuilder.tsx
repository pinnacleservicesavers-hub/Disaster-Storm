import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Download, Loader2, FileText, Wand2, Pencil, Eye, RefreshCw, X,
  Phone, Globe, CheckCircle2, FlipHorizontal
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface BrochurePanel {
  position?: string;
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
  outsidePanels: BrochurePanel[];
  insidePanels: BrochurePanel[];
  heroImageUrl?: string;
}

interface BrochureBuilderProps {
  onClose?: () => void;
}

export default function BrochureBuilder({ onClose }: BrochureBuilderProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [brochureData, setBrochureData] = useState<BrochureData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<BrochureData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeSide, setActiveSide] = useState<'outside' | 'inside'>('outside');

  const generateMutation = useMutation({
    mutationFn: async (userPrompt: string) => {
      const res = await apiRequest("/api/ai-ads/generate-brochure", "POST", {
        prompt: userPrompt,
      });
      return res;
    },
    onSuccess: (data) => {
      if (data.success && data.brochure) {
        const b = data.brochure;
        if (b.panels && !b.outsidePanels) {
          b.outsidePanels = b.panels.slice(0, 3);
          b.insidePanels = b.panels.slice(3, 6);
          while (b.outsidePanels.length < 3) b.outsidePanels.push({ title: '', body: [], highlights: [] });
          while (b.insidePanels.length < 3) b.insidePanels.push({ title: '', body: [], highlights: [] });
          delete b.panels;
        }
        setBrochureData(b);
        setEditData(null);
        setIsEditing(false);
        setActiveSide('outside');
        toast({ title: "Brochure Ready!", description: "Your professional tri-fold brochure has been generated with both outside and inside panels." });
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
    if (!brochureData) return;
    setEditData({
      ...brochureData,
      outsidePanels: brochureData.outsidePanels.map(p => ({ ...p, body: [...p.body], highlights: p.highlights ? [...p.highlights] : undefined })),
      insidePanels: brochureData.insidePanels.map(p => ({ ...p, body: [...p.body], highlights: p.highlights ? [...p.highlights] : undefined })),
    });
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

      toast({ title: "Professional PDF Downloaded!", description: "2-page tri-fold PDF generated — Page 1: Outside, Page 2: Inside. Ready for double-sided printing." });
    } catch (err: any) {
      console.error('PDF generation error:', err);
      toast({ title: "Download failed", description: err.message || "Try again", variant: "destructive" });
    }
    setIsDownloading(false);
  }, [brochureData, toast]);

  const data = isEditing ? editData : brochureData;
  const currentPanels = data ? (activeSide === 'outside' ? data.outsidePanels : data.insidePanels) : [];

  const positionLabels: Record<string, string> = {
    front_cover: 'Front Cover',
    back_cover: 'Back Cover',
    inside_flap: 'Inside Flap',
    inside_left: 'Inside Left',
    inside_center: 'Inside Center',
    inside_right: 'Inside Right',
  };

  const renderPanel = (panel: BrochurePanel, index: number, isFront: boolean) => {
    const accentColor = data?.accentColor || '#D4FF00';

    if (isFront) {
      return (
        <div
          key={index}
          className="brochure-panel relative overflow-hidden"
          style={{
            width: `${100 / 3}%`,
            minHeight: '480px',
            backgroundColor: '#0a0a0a',
          }}
        >
          {data?.heroImageUrl && (
            <div className="absolute inset-0" style={{
              backgroundImage: `url(${data.heroImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.45,
              filter: 'grayscale(100%) contrast(1.2)',
            }} />
          )}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.95) 100%)',
          }} />
          <div className="relative z-10 p-5 flex flex-col h-full" style={{ minHeight: '480px' }}>
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <h1 className="text-xl font-black text-white tracking-wider mb-2 uppercase" style={{ letterSpacing: '0.15em' }}>
                {data?.companyName}
              </h1>
              <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                {data?.credentials.map((cred, ci) => (
                  <span key={ci} className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: accentColor }}>
                    {ci > 0 && <span className="mx-1">·</span>}{cred}
                  </span>
                ))}
              </div>
              <div className="w-12 h-0.5 mb-4" style={{ backgroundColor: accentColor }} />
              <p className="text-base font-bold tracking-[0.18em] uppercase mb-6" style={{ color: accentColor }}>
                {data?.tagline}
              </p>
              {panel.highlights && panel.highlights.length > 0 && (
                <div className="mb-4 space-y-1">
                  {panel.highlights.map((h, hi) => (
                    <p key={hi} className="text-xs font-bold tracking-wider uppercase" style={{ color: accentColor }}>{h}</p>
                  ))}
                </div>
              )}
            </div>
            <div className="text-center space-y-1 mt-auto pt-3 border-t border-white/10">
              <div className="flex items-center justify-center gap-2">
                <Phone className="w-3.5 h-3.5" style={{ color: accentColor }} />
                <span className="text-lg font-black text-white tracking-wider">{data?.phone}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Globe className="w-3 h-3" style={{ color: accentColor }} />
                <span className="text-xs font-semibold" style={{ color: accentColor }}>{data?.website}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={index}
        className="brochure-panel relative overflow-hidden"
        style={{
          width: `${100 / 3}%`,
          minHeight: '480px',
          backgroundColor: '#0a0a0a',
        }}
      >
        {data?.heroImageUrl && (
          <div className="absolute inset-0" style={{
            backgroundImage: `url(${data.heroImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.12,
            filter: 'grayscale(100%) contrast(1.2)',
          }} />
        )}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.96) 100%)',
        }} />
        <div className="relative z-10 p-5 flex flex-col h-full" style={{ minHeight: '480px' }}>
          <div className="mb-3">
            <h2 className="text-sm font-black tracking-[0.14em] uppercase mb-0.5" style={{ color: accentColor }}>
              {panel.title}
            </h2>
            {panel.subtitle && (
              <p className="text-[10px] font-semibold text-slate-300 tracking-wider uppercase">{panel.subtitle}</p>
            )}
            <div className="w-8 h-0.5 mt-2" style={{ backgroundColor: accentColor }} />
          </div>
          <div className="flex-1 space-y-1.5">
            {panel.body.map((line, li) => {
              const isCheck = line.startsWith('✔') || line.startsWith('•') || line.startsWith('-');
              return (
                <div key={li} className="flex items-start gap-1.5">
                  {isCheck ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
                      <span className="text-[11px] font-medium text-white leading-relaxed">{line.replace(/^[✔•\-]\s*/, '')}</span>
                    </>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-200 leading-relaxed">{line}</span>
                  )}
                </div>
              );
            })}
          </div>
          {panel.highlights && panel.highlights.length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-700/50 space-y-0.5">
              {panel.highlights.map((h, hi) => (
                <p key={hi} className="text-[9px] font-bold tracking-wider uppercase" style={{ color: accentColor }}>{h}</p>
              ))}
            </div>
          )}
          {panel.footer && (
            <div className="mt-2 pt-1.5 border-t border-slate-700/30">
              <p className="text-[9px] text-slate-400 leading-relaxed">{panel.footer}</p>
            </div>
          )}
          <div className="mt-auto pt-2 text-center">
            <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: accentColor }}>{data?.phone}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {!brochureData && (
        <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-6 h-6 text-indigo-600" />
              <span className="text-indigo-600">Professional Tri-Fold Brochure Builder</span>
            </CardTitle>
            <p className="text-sm text-slate-500">AI generates a real 2-sided tri-fold brochure — outside (front cover, back cover, flap) + inside (3 content panels). Print-ready PDF with WeasyPrint.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your business and what you want on the brochure. Include: company name, phone number, website, services offered, certifications, tagline. The AI will organize your content into 6 panels — 3 outside + 3 inside."
              className="min-h-[140px] resize-none text-base"
            />

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-3 text-lg"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating Tri-Fold Brochure...</>
              ) : (
                <><Wand2 className="w-5 h-5 mr-2" />Build My Tri-Fold Brochure</>
              )}
            </Button>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Try these examples:</p>
              {[
                "Create a tri-fold brochure for Strategic Land Management — tree removal, trimming, land clearing, forestry mulching, stump grinding, debris haul-off. Service Disabled Veteran Owned Business, Licensed, Insured, Bonded, Certified Arborist. Tagline: WHEN TREES FALL — WE RISE. Phone: 800-628-2229, Website: strategiclandmgmt.com. Accent color: neon safety yellow.",
                "Create a professional brochure for ABC Roofing — residential & commercial roofing, storm damage repair, insurance claim assistance. Licensed, Bonded, Insured, GAF Master Elite Contractor. Phone: 555-123-4567, Website: abcroofing.com.",
                "Design a brochure for Premier Restoration — water damage, fire damage, mold remediation, storm cleanup. IICRC Certified, 24/7 emergency service. Phone: 800-555-0199, Website: premierrestoration.com. Tagline: Restoring What Matters Most."
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(example)}
                  className="block w-full text-left text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 p-2 rounded transition-colors"
                >
                  {example.substring(0, 130)}...
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
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Building your tri-fold brochure...</h3>
            <p className="text-slate-500">AI is generating 6 panels (outside + inside) with a hero image. This takes about 20-30 seconds.</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600 text-white"><CheckCircle2 className="w-3 h-3 mr-1" />2-Sided Tri-Fold</Badge>
              <Badge variant="outline">6 Panels — Outside + Inside</Badge>
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
                    onClick={() => { setBrochureData(null); setEditData(null); setIsEditing(false); setPrompt(''); setActiveSide('outside'); }}
                    className="text-red-500 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                  >
                    <X className="w-4 h-4 mr-1" />Clear & Start Over
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Side Toggle */}
          <div className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-2">
            <Button
              size="sm"
              variant={activeSide === 'outside' ? 'default' : 'ghost'}
              onClick={() => setActiveSide('outside')}
              className={activeSide === 'outside' ? 'bg-indigo-600 text-white' : ''}
            >
              Outside (Front Cover, Back, Flap)
            </Button>
            <FlipHorizontal className="w-4 h-4 text-slate-400" />
            <Button
              size="sm"
              variant={activeSide === 'inside' ? 'default' : 'ghost'}
              onClick={() => setActiveSide('inside')}
              className={activeSide === 'inside' ? 'bg-indigo-600 text-white' : ''}
            >
              Inside (3 Content Panels)
            </Button>
          </div>

          {/* Editing Section */}
          {isEditing && editData && (
            <Card className="border-2 border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-yellow-600" />
                  Edit {activeSide === 'outside' ? 'Outside' : 'Inside'} Panels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeSide === 'outside' && (
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
                )}

                {(activeSide === 'outside' ? editData.outsidePanels : editData.insidePanels).map((panel, pi) => (
                  <div key={pi} className="border rounded-lg p-3 space-y-2 bg-white dark:bg-slate-800">
                    <label className="text-xs font-bold text-indigo-600">
                      {positionLabels[panel.position || ''] || `Panel ${pi + 1}`}: {panel.title}
                    </label>
                    <Input value={panel.title} onChange={(e) => {
                      const side = activeSide === 'outside' ? 'outsidePanels' : 'insidePanels';
                      const panels = [...editData[side]];
                      panels[pi] = { ...panels[pi], title: e.target.value };
                      setEditData({ ...editData, [side]: panels });
                    }} placeholder="Panel title" />
                    <Input value={panel.subtitle || ''} onChange={(e) => {
                      const side = activeSide === 'outside' ? 'outsidePanels' : 'insidePanels';
                      const panels = [...editData[side]];
                      panels[pi] = { ...panels[pi], subtitle: e.target.value };
                      setEditData({ ...editData, [side]: panels });
                    }} placeholder="Panel subtitle" />
                    <Textarea value={panel.body.join('\n')} onChange={(e) => {
                      const side = activeSide === 'outside' ? 'outsidePanels' : 'insidePanels';
                      const panels = [...editData[side]];
                      panels[pi] = { ...panels[pi], body: e.target.value.split('\n') };
                      setEditData({ ...editData, [side]: panels });
                    }} placeholder="Body text (one item per line)" className="min-h-[80px]" />
                    {panel.highlights && (
                      <Textarea value={panel.highlights.join('\n')} onChange={(e) => {
                        const side = activeSide === 'outside' ? 'outsidePanels' : 'insidePanels';
                        const panels = [...editData[side]];
                        panels[pi] = { ...panels[pi], highlights: e.target.value.split('\n') };
                        setEditData({ ...editData, [side]: panels });
                      }} placeholder="Highlights (one per line)" className="min-h-[60px]" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Brochure Preview */}
          <div className="bg-slate-900 rounded-xl p-2 overflow-x-auto shadow-2xl">
            <div className="text-center text-xs text-slate-400 mb-2 flex items-center justify-center gap-2">
              <Eye className="w-3 h-3" />
              {activeSide === 'outside'
                ? 'Outside Preview — Flap | Back Cover | Front Cover (left to right as printed)'
                : 'Inside Preview — Inside Left | Inside Center | Inside Right (as seen when opened)'
              }
            </div>
            <div className="flex min-w-[900px]" style={{ fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif' }}>
              {activeSide === 'outside' ? (
                <>
                  {/* Outside print order: flap (left) | back (center) | front (right) */}
                  {(() => {
                    const outsideP = data.outsidePanels || [];
                    const front = outsideP.find(p => p.position === 'front_cover') || outsideP[0] || { title: '', body: [] };
                    const back = outsideP.find(p => p.position === 'back_cover') || outsideP[1] || { title: '', body: [] };
                    const flap = outsideP.find(p => p.position === 'inside_flap') || outsideP[2] || { title: '', body: [] };
                    return (
                      <>
                        {renderPanel(flap, 0, false)}
                        {renderPanel(back, 1, false)}
                        {renderPanel(front, 2, true)}
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  {(data.insidePanels || []).map((panel, i) => renderPanel(panel, i, false))}
                </>
              )}
            </div>
            <div className="text-center text-[10px] text-slate-500 mt-2">
              {activeSide === 'outside'
                ? '← Fold lines will appear on the printed PDF. The front cover is on the right.'
                : '← This side faces the reader when the brochure is opened flat.'
              }
            </div>
          </div>
        </>
      )}
    </div>
  );
}
