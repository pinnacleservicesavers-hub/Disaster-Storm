import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Calendar, Clock, DollarSign, TrendingUp,
  ChevronRight, Bell, Settings, Filter, Search, MoreVertical,
  CheckCircle, XCircle, AlertCircle, Phone, Mail, MapPin, Star,
  ArrowUpRight, ArrowDownRight, Target, Briefcase, Activity,
  BarChart3, PieChart, Timer, Zap, Award, RefreshCw, Eye,
  MessageSquare, FileText, CreditCard, Lock, Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const LIVE_ACTIVITY = [
  { id: 1, type: 'new_lead', message: 'New SmartBid™ request: Roofing in Austin, TX', time: '2 min ago', icon: Zap, color: 'text-blue-600 bg-blue-100' },
  { id: 2, type: 'estimate_viewed', message: 'Customer viewed your estimate #E-1247', time: '8 min ago', icon: Eye, color: 'text-purple-600 bg-purple-100' },
  { id: 3, type: 'appointment', message: 'Reminder: Estimate appointment at 2:00 PM', time: '15 min ago', icon: Calendar, color: 'text-amber-600 bg-amber-100' },
  { id: 4, type: 'payment', message: 'Payment received: $2,450 for Job #J-892', time: '1 hr ago', icon: DollarSign, color: 'text-green-600 bg-green-100' },
  { id: 5, type: 'review', message: 'New 5-star review from John M.', time: '2 hrs ago', icon: Star, color: 'text-yellow-600 bg-yellow-100' },
];

const PIPELINE_STATS = {
  newLeads: 8,
  scheduledEstimates: 5,
  estimatesSent: 12,
  jobsWon: 3,
  jobsInProgress: 4,
  completed: 47
};

const REVENUE_DATA = {
  today: 2450,
  week: 12840,
  month: 48750,
  monthlyTarget: 60000,
  growth: 18.5
};

const SMARTBID_REQUESTS = [
  { id: 'SB-001', service: 'Roof Inspection', customer: 'Sarah J.', location: 'Round Rock, TX', budget: '$500 - $15,000', urgency: 'urgent', aiScore: 92, scheduledTime: '10:00 AM Tomorrow' },
  { id: 'SB-002', service: 'Tree Removal', customer: 'Michael C.', location: 'Cedar Park, TX', budget: '$1,200 - $2,500', urgency: 'normal', aiScore: 88, scheduledTime: '2:00 PM Tomorrow' },
  { id: 'SB-003', service: 'Fence Installation', customer: 'Emily R.', location: 'Austin, TX', budget: '$4,500 - $7,000', urgency: 'flexible', aiScore: 95, scheduledTime: '9:00 AM Friday' },
];

const UPCOMING_APPOINTMENTS = [
  { id: 'A-001', customer: 'David L.', service: 'Roof Repair', time: '10:00 AM', date: 'Today', address: '1234 Oak St, Austin, TX', status: 'confirmed' },
  { id: 'A-002', customer: 'Lisa M.', service: 'Gutter Installation', time: '2:30 PM', date: 'Today', address: '5678 Elm Ave, Round Rock, TX', status: 'pending' },
  { id: 'A-003', customer: 'Robert K.', service: 'Storm Damage Assessment', time: '9:00 AM', date: 'Tomorrow', address: '9012 Pine Rd, Cedar Park, TX', status: 'confirmed' },
];

export default function WorkHubContractorCRM() {
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isSubscribed) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Lock className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <CardTitle>SmartBid™ CRM Access Required</CardTitle>
            <CardDescription>
              Subscribe to access the full CRM dashboard with real-time activity tracking, lead management, and scheduling tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => setShowUpgradeDialog(true)} data-testid="button-subscribe-crm">
              <CreditCard className="w-4 h-4 mr-2" />
              Subscribe to SmartBid™
            </Button>
            <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
              <Heart className="w-4 h-4" />
              <span>Non-profits get FREE access</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-purple-300 text-sm mb-1">
                <Link to="/workhub" className="hover:text-white">WorkHub</Link>
                <ChevronRight className="w-4 h-4" />
                <span>SmartBid™ CRM</span>
              </div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <LayoutDashboard className="w-7 h-7" />
                Contractor Command Center
              </h1>
              <p className="text-purple-300">Real-time business intelligence powered by SmartBid™</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-purple-300">
                <RefreshCw className="w-4 h-4" />
                <span>Updated {lastRefresh.toLocaleTimeString()}</span>
              </div>
              <Badge className="bg-green-500 text-white">
                <Activity className="w-3 h-3 mr-1" />
                Live
              </Badge>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">3</span>
              </Button>
              <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10" data-testid="button-crm-settings">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs uppercase tracking-wide">New Leads</p>
                  <p className="text-3xl font-bold">{PIPELINE_STATS.newLeads}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs uppercase tracking-wide">Scheduled</p>
                  <p className="text-3xl font-bold">{PIPELINE_STATS.scheduledEstimates}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-xs uppercase tracking-wide">Estimates Out</p>
                  <p className="text-3xl font-bold">{PIPELINE_STATS.estimatesSent}</p>
                </div>
                <FileText className="w-8 h-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs uppercase tracking-wide">Jobs Won</p>
                  <p className="text-3xl font-bold">{PIPELINE_STATS.jobsWon}</p>
                </div>
                <Award className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-100 text-xs uppercase tracking-wide">In Progress</p>
                  <p className="text-3xl font-bold">{PIPELINE_STATS.jobsInProgress}</p>
                </div>
                <Briefcase className="w-8 h-8 text-cyan-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs uppercase tracking-wide">Completed</p>
                  <p className="text-3xl font-bold">{PIPELINE_STATS.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  SmartBid™ Requests
                </CardTitle>
                <Badge className="bg-purple-100 text-purple-700">{SMARTBID_REQUESTS.length} pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {SMARTBID_REQUESTS.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                        {request.customer.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{request.service}</p>
                        <Badge variant="outline" className={
                          request.urgency === 'urgent' ? 'border-red-300 text-red-700' :
                          request.urgency === 'normal' ? 'border-blue-300 text-blue-700' :
                          'border-gray-300 text-gray-700'
                        }>
                          {request.urgency}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {request.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {request.budget}
                        </span>
                      </div>
                      <p className="text-sm text-purple-600 font-medium mt-1">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {request.scheduledTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">AI Match</p>
                      <p className="text-lg font-bold text-purple-600">{request.aiScore}%</p>
                    </div>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700" data-testid={`button-accept-${request.id}`}>
                      Accept
                    </Button>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Live Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {LIVE_ACTIVITY.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className={`p-2 rounded-full ${activity.color}`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.message}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Revenue Tracker
                </CardTitle>
                <Select defaultValue="month">
                  <SelectTrigger className="w-32" data-testid="select-revenue-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-slate-500">Monthly Revenue</p>
                  <p className="text-4xl font-bold text-green-600">${REVENUE_DATA.month.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <ArrowUpRight className="w-5 h-5" />
                  <span className="font-semibold">+{REVENUE_DATA.growth}%</span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-500">Progress to Goal</span>
                  <span className="font-medium">{Math.round((REVENUE_DATA.month / REVENUE_DATA.monthlyTarget) * 100)}%</span>
                </div>
                <Progress value={(REVENUE_DATA.month / REVENUE_DATA.monthlyTarget) * 100} className="h-3" />
                <p className="text-xs text-slate-500 mt-1">Target: ${REVENUE_DATA.monthlyTarget.toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-xl font-bold">${REVENUE_DATA.today.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Today</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">${REVENUE_DATA.week.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">This Week</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{PIPELINE_STATS.completed}</p>
                  <p className="text-xs text-slate-500">Jobs Done</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {UPCOMING_APPOINTMENTS.map((appt) => (
                <div 
                  key={appt.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-12 rounded-full ${appt.status === 'confirmed' ? 'bg-green-500' : 'bg-amber-500'}`} />
                    <div>
                      <p className="font-semibold">{appt.service}</p>
                      <p className="text-sm text-slate-500">{appt.customer}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {appt.address}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-purple-600">{appt.time}</p>
                    <p className="text-sm text-slate-500">{appt.date}</p>
                    <Badge variant="outline" className={appt.status === 'confirmed' ? 'text-green-600' : 'text-amber-600'}>
                      {appt.status}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" data-testid="button-view-calendar">
                <Calendar className="w-4 h-4 mr-2" />
                View Full Calendar
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <Target className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Your SmartBid™ Score: 94</h3>
                  <p className="text-purple-200">Excellent performance! You're in the top 5% of contractors.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link to="/workhub/contractor">
                  <Button variant="secondary" data-testid="button-view-profile">
                    View Profile
                  </Button>
                </Link>
                <Link to="/workhub/reviewrocket">
                  <Button className="bg-white text-purple-700 hover:bg-purple-50" data-testid="button-boost-score">
                    Boost Score
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
