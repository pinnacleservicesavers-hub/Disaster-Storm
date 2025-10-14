import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin, Home, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Homeowner {
  name: string;
  phone: string;
  email?: string;
  address: string;
  damageType: string;
}

interface HomeownerContactModalProps {
  homeowner: Homeowner | null;
  isOpen: boolean;
  onClose: () => void;
  onCall?: (phone: string) => void;
  onEmail?: (email: string) => void;
}

export function HomeownerContactModal({
  homeowner,
  isOpen,
  onClose,
  onCall,
  onEmail
}: HomeownerContactModalProps) {
  if (!homeowner || !isOpen) return null;

  const handleCall = () => {
    if (onCall) {
      onCall(homeowner.phone);
    } else {
      window.location.href = `tel:${homeowner.phone}`;
    }
  };

  const handleEmail = () => {
    if (homeowner.email) {
      if (onEmail) {
        onEmail(homeowner.email);
      } else {
        window.location.href = `mailto:${homeowner.email}`;
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
            data-testid="modal-backdrop"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-md shadow-2xl">
              <CardHeader className="relative pb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="absolute top-4 right-4 h-8 w-8 p-0"
                  data-testid="button-close-modal"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Home className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Homeowner Contact</CardTitle>
                    <CardDescription>Ready to connect</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Damage Alert */}
                <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold text-orange-900">Damage Report</div>
                      <div className="text-sm text-orange-700 mt-1" data-testid="text-damage-type">
                        {homeowner.damageType}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Homeowner Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Home className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">Homeowner</div>
                      <div className="font-semibold text-lg truncate" data-testid="text-homeowner-name">
                        {homeowner.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">Property Address</div>
                      <div className="font-medium text-sm" data-testid="text-homeowner-address">
                        {homeowner.address}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="space-y-3 pt-2">
                  <Button
                    onClick={handleCall}
                    className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
                    data-testid="button-call-homeowner"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Call {homeowner.phone}
                  </Button>

                  {homeowner.email && (
                    <Button
                      onClick={handleEmail}
                      variant="outline"
                      className="w-full h-10"
                      data-testid="button-email-homeowner"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email {homeowner.email}
                    </Button>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-center pt-2">
                  <Badge className="bg-blue-600 text-white px-4 py-1">
                    💼 Contractor Opportunity
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
