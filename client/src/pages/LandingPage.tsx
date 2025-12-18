import { Link } from 'react-router-dom';
import { 
  Zap, Cloud, AlertTriangle, Camera, Users, FileText, Shield, 
  Wrench, TreePine, Paintbrush, Home, DollarSign, Calendar,
  Star, Phone, CheckCircle2, TrendingUp, Building2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg shadow-orange-500/30">
                <Zap className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Welcome to <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Strategic Service Savers</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              The complete contractor platform for emergency storm response and everyday home services. 
              Choose your path below to get started.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <Card className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 border-amber-500/30 overflow-hidden group hover:border-amber-400/50 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Disaster Direct</h2>
                    <p className="text-amber-300">Emergency Storm Response</p>
                  </div>
                </div>

                <p className="text-slate-300 mb-6 text-lg">
                  AI-powered storm operations platform for contractors responding to hurricanes, 
                  tornadoes, hail storms, and natural disasters. Maximize insurance claims and 
                  streamline emergency response.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <FeatureItem icon={Cloud} text="Live Weather Intelligence" />
                  <FeatureItem icon={Camera} text="AI Damage Detection" />
                  <FeatureItem icon={AlertTriangle} text="Storm Predictions" />
                  <FeatureItem icon={Users} text="Lead Management" />
                  <FeatureItem icon={FileText} text="Claims Processing" />
                  <FeatureItem icon={Shield} text="Legal Compliance" />
                  <FeatureItem icon={TrendingUp} text="Contractor Deployment" />
                  <FeatureItem icon={Building2} text="Property Data" />
                </div>

                <div className="bg-amber-950/50 rounded-lg p-4 mb-6">
                  <h3 className="text-amber-300 font-semibold mb-2">Perfect For:</h3>
                  <p className="text-slate-300 text-sm">
                    Storm chasers, restoration contractors, roofing companies, tree services, 
                    and property restoration professionals responding to weather disasters.
                  </p>
                </div>

                <Link to="/dashboard">
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-6 text-lg">
                    Enter Disaster Direct
                    <Zap className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-purple-500/30 overflow-hidden group hover:border-purple-400/50 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">The WorkHub</h2>
                    <p className="text-purple-300">Everyday Contractor Marketplace</p>
                  </div>
                </div>

                <p className="text-slate-300 mb-6 text-lg">
                  AI-powered marketplace connecting homeowners with verified contractors for 
                  everyday home improvement and maintenance work. Built for non-emergency 
                  projects nationwide.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <FeatureItem icon={Camera} text="ScopeSnap AI Analysis" color="purple" />
                  <FeatureItem icon={DollarSign} text="Smart Pricing Engine" color="purple" />
                  <FeatureItem icon={Users} text="ContractorMatch" color="purple" />
                  <FeatureItem icon={Calendar} text="AI Scheduling" color="purple" />
                  <FeatureItem icon={Phone} text="CloseBot AI Sales" color="purple" />
                  <FeatureItem icon={Star} text="Review Management" color="purple" />
                  <FeatureItem icon={CheckCircle2} text="Payment Processing" color="purple" />
                  <FeatureItem icon={TrendingUp} text="Lead Pipeline" color="purple" />
                </div>

                <div className="bg-purple-950/50 rounded-lg p-4 mb-6">
                  <h3 className="text-purple-300 font-semibold mb-2">Perfect For:</h3>
                  <p className="text-slate-300 text-sm">
                    Local contractors, handymen, painters, plumbers, HVAC technicians, 
                    landscapers, and home service professionals looking for steady work.
                  </p>
                </div>

                <Link to="/workhub">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-6 text-lg">
                    Enter The WorkHub
                    <Sparkles className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 mb-16">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Why Choose Our Platform?
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
            <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 rounded-xl border border-amber-500/20 p-6">
              <h3 className="text-xl font-bold text-amber-400 mb-4">Disaster Direct Services</h3>
              <div className="grid grid-cols-2 gap-3">
                <ServiceTag icon={Home} text="Roof Damage" />
                <ServiceTag icon={TreePine} text="Tree Removal" />
                <ServiceTag icon={AlertTriangle} text="Storm Cleanup" />
                <ServiceTag icon={Wrench} text="Restoration" />
                <ServiceTag icon={FileText} text="Insurance Claims" />
                <ServiceTag icon={Shield} text="Emergency Tarps" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-xl border border-purple-500/20 p-6">
              <h3 className="text-xl font-bold text-purple-400 mb-4">WorkHub Services</h3>
              <div className="grid grid-cols-2 gap-3">
                <ServiceTag icon={Paintbrush} text="Painting" color="purple" />
                <ServiceTag icon={Wrench} text="Plumbing" color="purple" />
                <ServiceTag icon={Home} text="Remodeling" color="purple" />
                <ServiceTag icon={TreePine} text="Landscaping" color="purple" />
                <ServiceTag icon={Zap} text="Electrical" color="purple" />
                <ServiceTag icon={Building2} text="HVAC" color="purple" />
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
    </div>
  );
}

function FeatureItem({ icon: Icon, text, color = 'amber' }: { icon: any; text: string; color?: string }) {
  const colorClasses = color === 'purple' 
    ? 'text-purple-400 bg-purple-500/20' 
    : 'text-amber-400 bg-amber-500/20';
  
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

function ServiceTag({ icon: Icon, text, color = 'amber' }: { icon: any; text: string; color?: string }) {
  const colorClasses = color === 'purple' 
    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
    : 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colorClasses}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm">{text}</span>
    </div>
  );
}
