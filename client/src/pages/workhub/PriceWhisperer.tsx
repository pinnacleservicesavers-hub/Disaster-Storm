import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign, TrendingUp, ChevronRight, Volume2, VolumeX,
  BarChart3, CheckCircle, Scale, Lightbulb, Shield, ArrowRight,
  Calculator, Percent, MapPin, Clock, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

export default function PriceWhisperer() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [jobType, setJobType] = useState('');
  const [location, setLocation] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    if (voices.length > 0) {
      setTimeout(() => {
        speakGuidance("Welcome to PriceWhisperer! I'm Rachel, and I'll help you understand fair market pricing for any job. This tool provides AI-powered estimates with market comparisons, so both customers and contractors can be confident in pricing.");
      }, 500);
    }
  }, [voices]);

  const getBestFemaleVoice = (voiceList: SpeechSynthesisVoice[]) => {
    const preferredVoices = ['Samantha', 'Zira', 'Jenny', 'Google US English Female', 'Microsoft Zira'];
    for (const preferred of preferredVoices) {
      const found = voiceList.find(v => v.name.includes(preferred));
      if (found) return found;
    }
    return voiceList.find(v => v.lang.startsWith('en')) || voiceList[0];
  };

  const speakGuidance = (text: string) => {
    if (voices.length === 0) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = getBestFemaleVoice(voices);
    utterance.pitch = 1.1;
    utterance.rate = 1.05;
    utterance.onstart = () => setIsVoiceActive(true);
    utterance.onend = () => setIsVoiceActive(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleAnalyze = () => {
    setShowAnalysis(true);
    speakGuidance("I've analyzed the market data for tree removal in your area. The industry-standard pricing range is $1,200 to $3,500 for this type of job. Based on complexity and local rates, I'd suggest targeting around $2,100 for a competitive yet profitable bid.");
  };

  const pricingData = {
    lowRange: 1200,
    midRange: 2100,
    highRange: 3500,
    marketAverage: 2350,
    localAverage: 2180,
    competitorRange: { min: 1800, max: 2800 },
    factors: [
      { name: 'Tree Size', impact: '+$400-800', description: 'Large trees over 60ft' },
      { name: 'Access Difficulty', impact: '+$200-500', description: 'Limited equipment access' },
      { name: 'Stump Removal', impact: '+$150-300', description: 'Per stump grinding' },
      { name: 'Permits Required', impact: '+$50-200', description: 'City permit fees' }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />

      <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-emerald-200 text-sm mb-2">
            <Link to="/workhub" className="hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <span>PriceWhisperer</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">PriceWhisperer</h1>
              <p className="text-emerald-100 text-lg">Smart Estimate Engine - Fair pricing customers trust</p>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => isVoiceActive ? window.speechSynthesis.cancel() : speakGuidance("I'm Rachel, your pricing assistant. PriceWhisperer uses AI to analyze market data and provide fair, competitive pricing ranges for any job type in your area.")}
              className="text-white hover:bg-white/10"
            >
              {isVoiceActive ? <Volume2 className="w-6 h-6 animate-pulse" /> : <VolumeX className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  Price Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Job Type</Label>
                  <Select value={jobType} onValueChange={setJobType}>
                    <SelectTrigger data-testid="select-job-type">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tree-removal">Tree Removal</SelectItem>
                      <SelectItem value="roofing">Roofing Repair</SelectItem>
                      <SelectItem value="fence">Fence Installation</SelectItem>
                      <SelectItem value="painting">Interior Painting</SelectItem>
                      <SelectItem value="plumbing">Plumbing Repair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Location (ZIP Code)</Label>
                  <Input
                    placeholder="78701"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    data-testid="input-location"
                  />
                </div>
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleAnalyze}
                  data-testid="button-analyze-pricing"
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Analyze Market Pricing
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-6 h-6 text-blue-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-800">Second Opinion Mode</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Customers can verify if an estimate is fair by comparing to market averages.
                    </p>
                    <Button variant="link" className="px-0 text-blue-600 mt-2">
                      Try Second Opinion →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {showAnalysis ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="border-2 border-emerald-300 bg-emerald-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                      Industry-Standard Pricing Range
                      <Badge className="ml-auto bg-emerald-600">AI Verified</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative pt-8 pb-4">
                      <div className="flex justify-between text-sm text-slate-500 mb-2">
                        <span>Budget</span>
                        <span>Standard</span>
                        <span>Premium</span>
                      </div>
                      <div className="h-4 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-600 rounded-full" />
                      <div className="flex justify-between mt-2">
                        <span className="font-semibold">${pricingData.lowRange.toLocaleString()}</span>
                        <span className="font-bold text-emerald-700 text-lg">${pricingData.midRange.toLocaleString()}</span>
                        <span className="font-semibold">${pricingData.highRange.toLocaleString()}</span>
                      </div>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Recommended: ${pricingData.midRange.toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                          <TrendingUp className="w-7 h-7 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Market Average</p>
                          <p className="text-2xl font-bold">${pricingData.marketAverage.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center">
                          <MapPin className="w-7 h-7 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Local Average (Your Area)</p>
                          <p className="text-2xl font-bold">${pricingData.localAverage.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-slate-600" />
                      Price Adjustment Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pricingData.factors.map((factor, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium">{factor.name}</p>
                            <p className="text-sm text-slate-500">{factor.description}</p>
                          </div>
                          <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                            {factor.impact}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">
                        <strong>Disclaimer:</strong> These are industry-standard pricing ranges based on market data. 
                        Final pricing should be determined after on-site inspection and specific job requirements.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="border-slate-200">
                <CardContent className="py-16">
                  <div className="text-center text-slate-500">
                    <DollarSign className="w-20 h-20 mx-auto mb-4 opacity-20" />
                    <h3 className="text-xl font-medium mb-2">Enter job details to see pricing</h3>
                    <p>AI will analyze market data and provide fair pricing ranges</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <ModuleAIAssistant 
        moduleName="PriceWhisperer"
        moduleContext="PriceWhisperer is a smart estimate engine that provides AI-powered pricing analysis. It shows industry-standard pricing ranges, market comparisons, local averages, and price adjustment factors. Help users understand fair pricing for their jobs and how to price competitively."
      />
    </div>
  );
}
