import { Link } from 'react-router-dom';
import { useState } from 'react';
import { 
  Cloud, AlertTriangle, Camera, Users, FileText, Shield, 
  Wrench, TreePine, Paintbrush, Home, DollarSign, Calendar,
  Star, Phone, CheckCircle2, TrendingUp, Building2, Sparkles, 
  Zap, HardHat, UserCircle, ArrowRight, LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function LandingPage() {
  const [showHomeownerChoice, setShowHomeownerChoice] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Top Navigation Bar with Login */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Strategic Service Savers</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/privacy" className="text-slate-400 hover:text-white text-sm hidden md:block">Privacy</Link>
            <Link to="/terms" className="text-slate-400 hover:text-white text-sm hidden md:block">Terms</Link>
            <Link to="/auth/login">
              <Button 
                variant="outline" 
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                data-testid="button-login"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Welcome to <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 bg-clip-text text-transparent">Strategic Service Savers</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-6">
              Connecting homeowners with trusted contractors for storm damage repair and everyday home services.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button 
                onClick={() => setShowHomeownerChoice(true)}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-6 px-10 text-xl shadow-lg shadow-cyan-500/25 animate-pulse"
                data-testid="button-get-help-hero"
              >
                <Home className="w-6 h-6 mr-3" />
                Need Help? Start Here
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </div>
            
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Or tell us who you are below to get started
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <Card className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-cyan-500/30 overflow-hidden group hover:border-cyan-400/50 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                    <Home className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">I'm a Homeowner</h2>
                    <p className="text-cyan-300">Need work done on my property</p>
                  </div>
                </div>

                <p className="text-slate-300 mb-6 text-lg">
                  Get free quotes from verified contractors. Whether you need storm damage repair, 
                  home improvements, or regular maintenance - we connect you with trusted professionals.
                </p>

                <div className="grid grid-cols-1 gap-3 mb-8">
                  <FeatureItem icon={Camera} text="Upload photos for instant AI analysis" color="cyan" />
                  <FeatureItem icon={DollarSign} text="Get fair, transparent pricing" color="cyan" />
                  <FeatureItem icon={Users} text="Match with verified local contractors" color="cyan" />
                  <FeatureItem icon={Star} text="Read reviews from other homeowners" color="cyan" />
                  <FeatureItem icon={Shield} text="Protected payments and guarantees" color="cyan" />
                  <FeatureItem icon={Calendar} text="Easy online scheduling" color="cyan" />
                </div>

                <div className="bg-cyan-950/50 rounded-lg p-4 mb-6">
                  <h3 className="text-cyan-300 font-semibold mb-2">Services We Offer:</h3>
                  <p className="text-slate-300 text-sm">
                    Roofing, tree removal, painting, plumbing, HVAC, electrical, landscaping, 
                    storm damage repair, remodeling, and more.
                  </p>
                </div>

                <Button 
                  onClick={() => setShowHomeownerChoice(true)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-6 text-lg" 
                  data-testid="button-homeowner-entry"
                >
                  Get Started - Find a Contractor
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-900/40 to-green-900/40 border-emerald-500/30 overflow-hidden group hover:border-emerald-400/50 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                    <HardHat className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">I'm a Contractor</h2>
                    <p className="text-emerald-300">Ready to grow my business</p>
                  </div>
                </div>

                <p className="text-slate-300 mb-6 text-lg">
                  Access powerful tools to find leads, manage jobs, and grow your business. 
                  Choose your specialty below - storm response or everyday services.
                </p>

                <div className="space-y-4 mb-6">
                  <Link to="/dashboard" className="block">
                    <div className="bg-blue-900/40 border border-cyan-500/30 rounded-lg p-4 hover:border-cyan-400/50 transition-all group/card">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-6 h-6 text-cyan-400" />
                        <h3 className="text-xl font-bold text-white">Disaster Direct Storm Response</h3>
                      </div>
                      <p className="text-slate-300 text-sm mb-3">
                        Hurricanes, tornadoes, hail damage - AI-powered tools for emergency storm work and insurance claims.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded">Weather Intel</span>
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded">AI Damage Detection</span>
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded">Claims Processing</span>
                      </div>
                    </div>
                  </Link>

                  <Link to="/workhub/contractor" className="block">
                    <div className="bg-purple-900/40 border border-purple-500/30 rounded-lg p-4 hover:border-purple-400/50 transition-all group/card">
                      <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                        <h3 className="text-xl font-bold text-white">WorkHub Marketplace</h3>
                      </div>
                      <p className="text-slate-300 text-sm mb-3">
                        Everyday home services - painting, plumbing, HVAC, landscaping. Get matched with local customers.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">Lead Pipeline</span>
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">AI Scheduling</span>
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">Payments</span>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="bg-emerald-950/50 rounded-lg p-4 mb-6">
                  <h3 className="text-emerald-300 font-semibold mb-2">Contractor Benefits:</h3>
                  <p className="text-slate-300 text-sm">
                    Qualified leads, AI-powered tools, easy payments, reputation management, 
                    and Rachel voice guide to help you every step of the way.
                  </p>
                </div>

                <Link to="/workhub/contractor">
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-6 text-lg" data-testid="button-contractor-entry">
                    Contractor Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 mb-16">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Why Choose Strategic Service Savers?
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <BenefitCard 
                icon={Sparkles} 
                title="AI-Powered" 
                description="Smart analysis, automated workflows, and intelligent recommendations"
              />
              <BenefitCard 
                icon={Shield} 
                title="Trusted & Verified" 
                description="All contractors are verified with ratings and review systems"
              />
              <BenefitCard 
                icon={DollarSign} 
                title="Fair Pricing" 
                description="Industry-standard pricing ranges and transparent estimates"
              />
              <BenefitCard 
                icon={Phone} 
                title="Rachel Voice Guide" 
                description="Natural voice guidance helps you through every step"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-xl border border-cyan-500/20 p-6">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">For Homeowners</h3>
              <div className="grid grid-cols-2 gap-3">
                <ServiceTag icon={Home} text="Roof Repair" color="cyan" />
                <ServiceTag icon={TreePine} text="Tree Service" color="cyan" />
                <ServiceTag icon={Paintbrush} text="Painting" color="cyan" />
                <ServiceTag icon={Wrench} text="Plumbing" color="cyan" />
                <ServiceTag icon={Zap} text="Electrical" color="cyan" />
                <ServiceTag icon={Building2} text="HVAC" color="cyan" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/30 rounded-xl border border-emerald-500/20 p-6">
              <h3 className="text-xl font-bold text-emerald-400 mb-4">For Contractors</h3>
              <div className="grid grid-cols-2 gap-3">
                <ServiceTag icon={Users} text="Qualified Leads" color="emerald" />
                <ServiceTag icon={Camera} text="AI Tools" color="emerald" />
                <ServiceTag icon={DollarSign} text="Easy Payments" color="emerald" />
                <ServiceTag icon={Star} text="Reviews" color="emerald" />
                <ServiceTag icon={Calendar} text="Scheduling" color="emerald" />
                <ServiceTag icon={TrendingUp} text="Growth" color="emerald" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-slate-500 text-sm">
              strategicservicesavers.com
            </p>
          </div>
        </div>
      </div>

      {/* Footer with Legal Links */}
      <footer className="bg-slate-900 border-t border-slate-700/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-slate-400">
                © 2026 Strategic Service Savers. All rights reserved.
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
              <span className="text-slate-600">|</span>
              <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link>
              <span className="text-slate-600">|</span>
              <Link to="/disclaimers" className="text-slate-400 hover:text-white transition-colors">Disclaimers</Link>
              <span className="text-slate-600">|</span>
              <Link to="/data-sources" className="text-slate-400 hover:text-white transition-colors">Data Sources</Link>
              <span className="text-slate-600">|</span>
              <Link to="/security" className="text-slate-400 hover:text-white transition-colors">Security</Link>
            </div>
            <div className="text-sm text-slate-500">
              <a href="mailto:strategicservicesavers@gmail.com" className="hover:text-white transition-colors">
                strategicservicesavers@gmail.com
              </a>
              <span className="mx-2">|</span>
              <a href="tel:+18773785143" className="hover:text-white transition-colors">
                (877) 378-5143
              </a>
            </div>
          </div>
        </div>
      </footer>

      <Dialog open={showHomeownerChoice} onOpenChange={setShowHomeownerChoice}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white text-center">
              Is this an emergency due to a disaster?
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-center">
              Help us direct you to the right place
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-6">
            <Link to="/homeowner" onClick={() => setShowHomeownerChoice(false)}>
              <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border border-red-500/40 rounded-xl p-6 hover:border-red-400/60 transition-all cursor-pointer group" data-testid="button-emergency-yes">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-red-500/20 rounded-lg">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-red-300 transition-colors">
                      Yes - Storm or Disaster Damage
                    </h3>
                    <p className="text-red-300 text-sm">Hurricane, tornado, hail, flood, fire damage</p>
                  </div>
                </div>
                <p className="text-slate-300 text-sm">
                  We'll connect you with emergency response contractors and help with insurance claims.
                </p>
                <div className="flex items-center justify-end mt-3 text-red-400 group-hover:text-red-300">
                  <span className="text-sm font-medium">Go to Disaster Direct</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>

            <Link to="/workhub/customer" onClick={() => setShowHomeownerChoice(false)}>
              <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/40 rounded-xl p-6 hover:border-purple-400/60 transition-all cursor-pointer group" data-testid="button-emergency-no">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Sparkles className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                      No - Regular Home Services
                    </h3>
                    <p className="text-purple-300 text-sm">Repairs, maintenance, improvements</p>
                  </div>
                </div>
                <p className="text-slate-300 text-sm">
                  Get quotes from local contractors for painting, plumbing, roofing, landscaping, and more.
                </p>
                <div className="flex items-center justify-end mt-3 text-purple-400 group-hover:text-purple-300">
                  <span className="text-sm font-medium">Go to WorkHub</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeatureItem({ icon: Icon, text, color = 'cyan' }: { icon: any; text: string; color?: string }) {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/20',
  }[color] || 'text-cyan-400 bg-cyan-500/20';
  
  return (
    <div className="flex items-center gap-2">
      <div className={`p-1.5 rounded-lg ${colorClasses}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm text-slate-300">{text}</span>
    </div>
  );
}

function BenefitCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex p-3 bg-slate-700/50 rounded-xl mb-3">
        <Icon className="w-6 h-6 text-blue-400" />
      </div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}

function ServiceTag({ icon: Icon, text, color = 'cyan' }: { icon: any; text: string; color?: string }) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  }[color] || 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colorClasses}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm">{text}</span>
    </div>
  );
}
