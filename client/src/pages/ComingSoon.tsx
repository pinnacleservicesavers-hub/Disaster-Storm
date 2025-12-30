import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Shield, 
  Zap, 
  Cloud, 
  Users,
  Mail,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleNotifyMe = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitted(true);
    toast({
      title: 'Thank you!',
      description: 'We will notify you when we launch.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-2xl w-full text-center"
      >
        <div className="flex justify-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="relative"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-4 border-2 border-dashed border-blue-400/30 rounded-3xl"
            />
          </motion.div>
        </div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-5xl md:text-6xl font-bold text-white mb-4"
        >
          Strategic Services Savers
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-blue-200 mb-2"
        >
          Disaster Direct Platform
        </motion.p>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-lg text-slate-400 mb-8"
        >
          The next generation of storm response and claims management
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8 flex items-center justify-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span className="text-amber-200 font-medium">Coming Soon - Launch Date TBD</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {[
            { icon: Cloud, label: 'Live Weather Intel', color: 'from-blue-500 to-cyan-500' },
            { icon: Zap, label: 'AI-Powered Tools', color: 'from-purple-500 to-pink-500' },
            { icon: Shield, label: 'Claims Management', color: 'from-green-500 to-emerald-500' },
            { icon: Users, label: 'StormShare Network', color: 'from-orange-500 to-amber-500' },
          ].map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.1 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <CardContent className="p-4 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-2`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs text-slate-300 text-center">{feature.label}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {!isSubmitted ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <Input
              type="email"
              placeholder="Enter your email for updates"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 h-12"
              data-testid="input-email-notify"
            />
            <Button 
              onClick={handleNotifyMe}
              className="h-12 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold"
              data-testid="button-notify-me"
            >
              <Mail className="w-4 h-4 mr-2" />
              Notify Me
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 text-green-400"
          >
            <CheckCircle className="w-5 h-5" />
            <span>You're on the list! We'll be in touch soon.</span>
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-10 pt-8 border-t border-white/10"
        >
          <p className="text-slate-500 text-sm">
            Questions? Contact us at{' '}
            <a href="mailto:strategicservicesavers@gmail.com" className="text-blue-400 hover:text-blue-300">
              strategicservicesavers@gmail.com
            </a>
          </p>
          <p className="text-slate-600 text-xs mt-2">
            www.strategicservicesavers.org
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="mt-8"
        >
          <a 
            href="/auth/login" 
            className="text-blue-400 hover:text-blue-300 text-sm underline"
            data-testid="link-admin-login"
          >
            Staff / Contractor Login
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
