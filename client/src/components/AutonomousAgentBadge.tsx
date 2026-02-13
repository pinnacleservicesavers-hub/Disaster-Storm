import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, Zap, Activity, ChevronDown, ChevronUp, Clock, CheckCircle2, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AgentActivity {
  id: string;
  agentId: string;
  action: string;
  details: string;
  result?: string;
  timestamp: string;
  duration?: number;
}

interface AgentStatus {
  id: string;
  name: string;
  module: string;
  status: 'active' | 'idle' | 'processing' | 'error';
  description: string;
  lastAction: string;
  lastActionTime: string;
  totalActions: number;
  uptime: number;
  tasksCompleted: number;
  recentActivities: AgentActivity[];
  capabilities: string[];
  currentTask?: string;
  healthScore: number;
  startedAt: string;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export function AutonomousAgentBadge({ moduleName }: { moduleName: string }) {
  const [expanded, setExpanded] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  const { data: agentData } = useQuery<{ success: boolean; agents: AgentStatus[] }>({
    queryKey: [`/api/ai-agents/module/${moduleName}`],
    refetchInterval: 8000,
  });

  const agents = agentData?.agents || [];
  const agent = agents[0];

  useEffect(() => {
    if (agent?.lastActionTime) {
      setPulseKey(prev => prev + 1);
    }
  }, [agent?.lastActionTime]);

  if (!agent) return null;

  const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    processing: 'bg-blue-500 animate-pulse',
    idle: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-white shadow-lg hover:shadow-xl transition-all group border border-slate-700"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${statusColors[agent.status]} border-2 border-slate-900`} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{agent.name}</span>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px] px-1.5 py-0">
                24/7 ACTIVE
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Activity className="w-3 h-3 text-green-400" />
              <span key={pulseKey} className="animate-fade-in">{agent.lastAction}</span>
              <span className="text-slate-500">·</span>
              <span>{formatTimeAgo(agent.lastActionTime)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400 mr-2">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" />
              {agent.totalActions} tasks
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              {formatUptime(agent.uptime)}
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-green-400" />
              {agent.healthScore}%
            </span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <Card className="mt-2 border-slate-200 dark:border-slate-700 overflow-hidden">
          <CardContent className="p-4 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">{agent.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-center">
                <p className="text-lg font-bold text-slate-800 dark:text-white">{agent.totalActions}</p>
                <p className="text-xs text-slate-500">Tasks Done</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-center">
                <p className="text-lg font-bold text-green-600">{agent.healthScore}%</p>
                <p className="text-xs text-slate-500">Health</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-center">
                <p className="text-lg font-bold text-blue-600">{formatUptime(agent.uptime)}</p>
                <p className="text-xs text-slate-500">Uptime</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-center">
                <p className="text-lg font-bold text-purple-600">{agent.capabilities.length}</p>
                <p className="text-xs text-slate-500">Capabilities</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Capabilities</h4>
              <div className="flex flex-wrap gap-1.5">
                {agent.capabilities.map((cap, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    {cap}
                  </Badge>
                ))}
              </div>
            </div>

            {agent.recentActivities.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Activity</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {agent.recentActivities.slice(0, 5).map((activity, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">{activity.action}</p>
                        <p className="text-xs text-slate-500 truncate">{activity.details}</p>
                        <p className="text-[10px] text-slate-400">{formatTimeAgo(activity.timestamp)}{activity.duration ? ` · ${activity.duration}ms` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function AutonomousAgentDashboard() {
  const { data: systemData } = useQuery<{
    success: boolean;
    totalAgents: number;
    activeAgents: number;
    totalActions: number;
    averageHealthScore: number;
    uptimeSeconds: number;
    isRunning: boolean;
    agents: AgentStatus[];
  }>({
    queryKey: ['/api/ai-agents/status'],
    refetchInterval: 10000,
  });

  if (!systemData?.success) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Autonomous AI Agents</h2>
            <p className="text-sm text-slate-500">24/7 intelligent operations across all modules</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-green-600 dark:text-green-400">System Active</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-cyan-200 dark:border-cyan-800">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-cyan-700 dark:text-cyan-400">{systemData.totalAgents}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Total Agents</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-green-700 dark:text-green-400">{systemData.activeAgents}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Active Now</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">{systemData.totalActions.toLocaleString()}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Tasks Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{systemData.averageHealthScore}%</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Avg Health</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {systemData.agents.map((agent) => (
          <Card key={agent.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${agent.status === 'active' || agent.status === 'processing' ? 'bg-green-500' : 'bg-yellow-500'} border-2 border-white dark:border-slate-900`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-800 dark:text-white">{agent.name}</h3>
                    <p className="text-[10px] text-slate-500">{agent.module}</p>
                  </div>
                </div>
                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px]">
                  {agent.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mb-2 line-clamp-1">{agent.lastAction}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{agent.totalActions} tasks</span>
                <span>{formatUptime(agent.uptime)} uptime</span>
                <span>{agent.healthScore}% health</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
