import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, ChevronRight, Volume2, VolumeX, CheckCircle,
  Clock, Camera, DollarSign, Users, ArrowRight, Play, Pause, Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import TopNav from '@/components/TopNav';
import ModuleAIAssistant from '@/components/ModuleAIAssistant';
import { AutonomousAgentBadge } from '@/components/AutonomousAgentBadge';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const MOCK_JOBS = [
  { id: 1, customer: 'Robert Williams', service: 'Tree Removal', value: 2100, progress: 60, status: 'in_progress', startDate: 'Dec 15', dueDate: 'Dec 18', milestones: ['Site Prep', 'Cutting', 'Cleanup'] },
  { id: 2, customer: 'Amanda Foster', service: 'Fence Installation', value: 5500, progress: 0, status: 'scheduled', startDate: 'Dec 20', dueDate: 'Dec 24', milestones: ['Materials', 'Posts', 'Panels', 'Gate'] },
  { id: 3, customer: 'David Park', service: 'Stump Grinding', value: 450, progress: 100, status: 'completed', startDate: 'Dec 10', dueDate: 'Dec 10', milestones: ['Grinding', 'Fill'] }
];

export default function JobFlow() {
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
        context: { leadName: "contractor", companyName: "your company", trade: "project_management" },
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
      voiceMutation.mutate("Give a brief, warm 1-sentence welcome to JobFlow. You're Rachel, their project command center assistant. They have 1 job in progress, 1 scheduled, and 1 completed. Keep it super short and natural.");
    }
  }, []);

  const toggleVoice = () => {
    const newEnabled = !isVoiceEnabled;
    setIsVoiceEnabled(newEnabled);
    voiceEnabledRef.current = newEnabled;
    if (!newEnabled) {
      stopAudio();
    } else {
      voiceMutation.mutate("Say a quick, natural 1-sentence overview of JobFlow — tracking every job from estimate to completion with real-time progress updates. Keep it warm and conversational.");
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string; icon: any }> = {
      in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700', icon: Play },
      scheduled: { label: 'Scheduled', className: 'bg-amber-100 text-amber-700', icon: Clock },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-700', icon: CheckCircle }
    };
    const c = config[status] || config.scheduled;
    return <Badge className={c.className}><c.icon className="w-3 h-3 mr-1" />{c.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-slate-950 dark:to-slate-900">
      <TopNav />
      <audio ref={audioRef} className="hidden" />

      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-indigo-200 text-sm mb-2">
            <Link to="/workhub" className="hover:text-white">WorkHub</Link>
            <ChevronRight className="w-4 h-4" />
            <span>JobFlow</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">JobFlow</h1>
              <p className="text-indigo-100 text-lg">Project Command Center - Track every job from start to finish</p>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={toggleVoice}
              className="text-white hover:bg-white/10"
            >
              {isPlaying ? <Volume2 className="w-6 h-6 animate-pulse" /> : isVoiceEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <AutonomousAgentBadge moduleName="JobFlow" />
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Play className="w-10 h-10 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-slate-600">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Clock className="w-10 h-10 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-slate-600">Scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-slate-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {MOCK_JOBS.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow" data-testid={`job-${job.id}`}>
              <CardContent className="py-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      job.status === 'in_progress' ? 'bg-blue-100' :
                      job.status === 'scheduled' ? 'bg-amber-100' : 'bg-green-100'
                    }`}>
                      <Briefcase className={`w-7 h-7 ${
                        job.status === 'in_progress' ? 'text-blue-600' :
                        job.status === 'scheduled' ? 'text-amber-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{job.customer}</h3>
                        {getStatusBadge(job.status)}
                      </div>
                      <p className="text-slate-500">{job.service}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">${job.value.toLocaleString()}</p>
                    <p className="text-sm text-slate-500">{job.startDate} - {job.dueDate}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-medium">{job.progress}%</span>
                  </div>
                  <Progress value={job.progress} className="h-3" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {job.milestones.map((m, idx) => (
                      <Badge key={m} variant={idx < Math.ceil(job.progress / (100 / job.milestones.length)) ? 'default' : 'secondary'}>
                        {m}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Camera className="w-4 h-4 mr-1" />
                      Add Photos
                    </Button>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                      Update Progress
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <ModuleAIAssistant 
        moduleName="JobFlow"
        moduleContext="JobFlow is the project command center for tracking jobs from estimate to completion. It shows job progress, milestones, and allows updating status. Help users manage their active jobs, track progress, and communicate with customers."
      />
    </div>
  );
}