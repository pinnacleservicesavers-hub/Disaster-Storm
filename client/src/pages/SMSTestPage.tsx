import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SMSTestPage() {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('+17068408949');
  const [message, setMessage] = useState('TEST from Disaster Direct - Reply YES if you receive this!');
  const [results, setResults] = useState<any[]>([]);

  const sendTestSMS = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/test-sms', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, message })
      });
    },
    onSuccess: (data) => {
      setResults(prev => [data, ...prev]);
      toast({
        title: "SMS Sent",
        description: `Message sent to ${phoneNumber}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "SMS Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const sendToShannon = () => {
    setPhoneNumber('+17068408949');
    setMessage('🚨 SHANNON - This is a test from Disaster Direct. Reply YES if you get this!');
    setTimeout(() => sendTestSMS.mutate(), 100);
  };

  const sendToJohn = () => {
    setPhoneNumber('+17066044820');
    setMessage('🚨 JOHN - This is a test from Disaster Direct. Reply YES if you get this!');
    setTimeout(() => sendTestSMS.mutate(), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">SMS Alert Testing</h1>
          <p className="text-slate-300">Test SMS delivery to contractor phones</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Test Buttons</CardTitle>
            <CardDescription className="text-slate-400">
              Send test messages to contractor phones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={sendToShannon}
                disabled={sendTestSMS.isPending}
                className="bg-green-600 hover:bg-green-700 text-white h-20"
                data-testid="button-test-shannon"
              >
                <div className="text-center">
                  <div className="font-bold">Test Shannon</div>
                  <div className="text-xs">706-840-8949</div>
                </div>
              </Button>
              
              <Button
                onClick={sendToJohn}
                disabled={sendTestSMS.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white h-20"
                data-testid="button-test-john"
              >
                <div className="text-center">
                  <div className="font-bold">Test John</div>
                  <div className="text-xs">706-604-4820</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Custom Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Phone Number</label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+17068408949"
                className="bg-slate-700 border-slate-600 text-white"
                data-testid="input-phone"
              />
            </div>
            
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your test message..."
                rows={4}
                className="bg-slate-700 border-slate-600 text-white"
                data-testid="input-message"
              />
            </div>
            
            <Button
              onClick={() => sendTestSMS.mutate()}
              disabled={sendTestSMS.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white w-full"
              data-testid="button-send-custom"
            >
              <Send className="mr-2 h-4 w-4" />
              {sendTestSMS.isPending ? 'Sending...' : 'Send Test SMS'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Delivery Status</CardTitle>
            <CardDescription className="text-slate-400">
              Real-time SMS delivery tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Clock className="mx-auto mb-2 text-slate-600" size={48} />
                <p>No messages sent yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result, i) => (
                  <div key={i} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-white">To: {result.to}</div>
                        <div className="text-xs text-slate-400">{new Date(result.timestamp).toLocaleString()}</div>
                      </div>
                      {result.success ? (
                        <CheckCircle2 className="text-green-500" size={24} />
                      ) : (
                        <AlertCircle className="text-red-500" size={24} />
                      )}
                    </div>
                    
                    {result.success ? (
                      <div className="space-y-1 text-sm">
                        <div className="text-green-400">✓ Accepted by Twilio</div>
                        <div className="text-slate-400">SID: {result.messageSid}</div>
                        <div className="text-slate-400">Status: {result.status}</div>
                        <div className="text-slate-400">From: {result.from}</div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm">
                        <div className="text-red-400">✗ {result.error}</div>
                        {result.errorCode && (
                          <div className="text-slate-400">Error Code: {result.errorCode}</div>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-2 pt-2 border-t border-slate-600">
                      <div className="text-xs text-slate-500">{result.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-yellow-900/20 border-yellow-700/50">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center gap-2">
              <AlertCircle size={20} />
              Twilio Trial Account Limitations
            </CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-200 space-y-2 text-sm">
            <p>⚠️ Your Twilio account is in trial mode. This means:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Phone numbers must be verified at twilio.com/console before receiving messages</li>
              <li>Messages may be delayed or queued</li>
              <li>Some carrier networks may block trial messages</li>
            </ul>
            <div className="mt-4 p-3 bg-yellow-800/30 rounded border border-yellow-700/50">
              <p className="font-semibold mb-1">To fix delivery issues:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Visit: <a href="https://console.twilio.com/us1/develop/phone-numbers/manage/verified" target="_blank" className="underline">Twilio Console - Verified Numbers</a></li>
                <li>Click "+" to add both phone numbers</li>
                <li>Twilio will call each number with a verification code</li>
                <li>OR upgrade account with $20 to remove all restrictions</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
