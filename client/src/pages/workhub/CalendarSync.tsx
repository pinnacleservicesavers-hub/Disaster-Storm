import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, ChevronRight, Volume2, VolumeX, Bell,
  CheckCircle, Users, MapPin, Phone, Plus, ArrowRight, Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import { AutonomousAgentBadge } from '@/components/AutonomousAgentBadge';

const MOCK_APPOINTMENTS = [
  { id: 1, customer: 'John Martinez', service: 'Tree Removal Estimate', date: 'Today', time: '2:00 PM', status: 'confirmed', location: '123 Oak St, Austin, TX' },
  { id: 2, customer: 'Sarah Johnson', service: 'Roof Inspection', date: 'Tomorrow', time: '9:00 AM', status: 'pending', location: '456 Elm Ave, Round Rock, TX' },
  { id: 3, customer: 'Michael Chen', service: 'Fence Measurement', date: 'Dec 20', time: '11:00 AM', status: 'confirmed', location: '789 Pine Dr, Cedar Park, TX' }
];

export default function CalendarSync() {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasPlayedWelcome = useRef(false);
  const voiceEnabledRef = useRef(true);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const voiceMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/closebot/chat", {
        message,
        history: [],
        context: { leadName: "contractor", companyName: "your company", trade: "scheduling" },
        enableVoice: true,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (!voiceEnabledRef.current) return;
      if (data.audioUrl && audioRef.current) {
        setIsPlaying(true);
        audioRef.current.src = data.audioUrl;
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    },
  });

  useEffect(() => {
    if (!hasPlayedWelcome.current) {
      hasPlayedWelcome.current = true;
      voiceMutation.mutate("Give a brief, warm 1-sentence welcome to CalendarSync. You're Rachel, helping them manage their scheduling so they never miss a lead. Keep it super short and natural — like a friendly coworker greeting them.");
    }
  }, []);

  const toggleVoice = () => {
    const newEnabled = !isVoiceEnabled;
    setIsVoiceEnabled(newEnabled);
    voiceEnabledRef.current = newEnabled;
    if (!newEnabled) {
      stopAudio();
    } else {
      voiceMutation.mutate("Say a quick, natural 1-sentence overview of CalendarSync — managing appointments, sending reminders, and making sure they never miss a job. Keep it warm and conversational.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />
      <audio ref={audioRef} className="hidden" />

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
              onClick={toggleVoice}
              className="text-white hover:bg-white/10"
            >
              {isVoiceEnabled ? <Volume2 className={`w-6 h-6 ${isPlaying ? 'animate-pulse' : ''}`} /> : <VolumeX className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <AutonomousAgentBadge moduleName="CalendarSync" />
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
                  <Heart className="w-5 h-5 text-orange-600" />
                  AI Auto-Scheduling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Let Rachel handle scheduling for you. When a new lead comes in, she'll automatically find 
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
