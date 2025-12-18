import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, ChevronRight, Volume2, VolumeX, Bell,
  CheckCircle, Users, MapPin, Phone, Plus, ArrowRight, Bot
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';

const MOCK_APPOINTMENTS = [
  { id: 1, customer: 'John Martinez', service: 'Tree Removal Estimate', date: 'Today', time: '2:00 PM', status: 'confirmed', location: '123 Oak St, Austin, TX' },
  { id: 2, customer: 'Sarah Johnson', service: 'Roof Inspection', date: 'Tomorrow', time: '9:00 AM', status: 'pending', location: '456 Elm Ave, Round Rock, TX' },
  { id: 3, customer: 'Michael Chen', service: 'Fence Measurement', date: 'Dec 20', time: '11:00 AM', status: 'confirmed', location: '789 Pine Dr, Cedar Park, TX' }
];

export default function CalendarSync() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

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
        speakGuidance("Welcome to CalendarSync! I'm Rachel. I manage your scheduling so you never miss a lead. You have 3 upcoming appointments. Your next one is today at 2 PM with John Martinez for a tree removal estimate. I'll send you a reminder 30 minutes before.");
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />

      <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-orange-200 text-sm mb-2">
            <Link to="/workhub" className="hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <span>CalendarSync</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">CalendarSync</h1>
              <p className="text-orange-100 text-lg">AI Scheduling - Never miss a lead again</p>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => isVoiceActive ? window.speechSynthesis.cancel() : speakGuidance("I'm Rachel. CalendarSync automatically manages your appointments with AI coordination. I send reminders, prevent scheduling conflicts, and even let customers book directly.")}
              className="text-white hover:bg-white/10"
            >
              {isVoiceActive ? <Volume2 className="w-6 h-6 animate-pulse" /> : <VolumeX className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
              <Button data-testid="button-new-appointment">
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            </div>

            {MOCK_APPOINTMENTS.map((apt) => (
              <Card key={apt.id} className="hover:shadow-md transition-shadow" data-testid={`appointment-${apt.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        apt.date === 'Today' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Calendar className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{apt.customer}</p>
                          <Badge className={apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                            {apt.status === 'confirmed' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                            {apt.status}
                          </Badge>
                        </div>
                        <p className="text-slate-500">{apt.service}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                          <MapPin className="w-3 h-3" />
                          {apt.location}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${apt.date === 'Today' ? 'text-orange-600' : ''}`}>{apt.date}</p>
                      <p className="text-slate-500">{apt.time}</p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">Reschedule</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-orange-600" />
                  AI Auto-Scheduling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Let AI handle scheduling for you. When a new lead comes in, I'll automatically find 
                  a time that works for both you and the customer.
                </p>
                <Button className="w-full bg-orange-600 hover:bg-orange-700" data-testid="button-enable-ai">
                  Enable AI Scheduling
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-600" />
                  Smart Reminders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Morning of appointment</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>30 minutes before</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Customer reminders</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Your Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Set your working hours so customers can book directly.
                </p>
                <Button variant="outline" className="w-full" data-testid="button-set-hours">
                  Set Working Hours
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ModuleAIAssistant 
        moduleName="CalendarSync"
        moduleContext="CalendarSync is an AI-powered scheduling system. It manages appointments, sends smart reminders, prevents conflicts, and can auto-schedule based on contractor availability. Help users manage their calendar efficiently and never miss appointments."
      />
    </div>
  );
}
