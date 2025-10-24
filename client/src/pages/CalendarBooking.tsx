import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar, Clock, User, MapPin, Video, Phone, Mail, 
  Settings, Plus, Edit, Trash2, Copy, CheckCircle, X,
  AlertCircle, Users, TrendingUp, BarChart3, Zap,
  Globe, Monitor, Smartphone, Eye, Play, Link2,
  CalendarDays, Timer, UserCheck, Bell
} from 'lucide-react';
import { FadeIn, SlideIn, ScaleIn, HoverLift } from '@/components/ui/animations';

interface CalendarBooking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  scheduledDate: string;
  duration: number;
  timeZone: string;
  appointmentType: 'consultation' | 'estimate' | 'inspection';
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  googleCalendarEventId?: string;
  zoomMeetingUrl?: string;
  customerNotes?: string;
  internalNotes?: string;
}

interface AppointmentType {
  id: string;
  name: string;
  duration: number;
  description: string;
  color: string;
  isActive: boolean;
  buffer: number; // minutes between appointments
  maxAdvanceBooking: number; // days in advance
}

interface TimeSlot {
  time: string;
  available: boolean;
  booked?: boolean;
}

interface BusinessHours {
  monday: { start: string; end: string; enabled: boolean };
  tuesday: { start: string; end: string; enabled: boolean };
  wednesday: { start: string; end: string; enabled: boolean };
  thursday: { start: string; end: string; enabled: boolean };
  friday: { start: string; end: string; enabled: boolean };
  saturday: { start: string; end: string; enabled: boolean };
  sunday: { start: string; end: string; enabled: boolean };
}

export default function CalendarBooking() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'bookings' | 'settings'>('calendar');
  const [isCreating, setIsCreating] = useState(false);

  // Mock appointment types
  const [appointmentTypes] = useState<AppointmentType[]>([
    {
      id: 'AT001',
      name: 'Free Consultation',
      duration: 30,
      description: 'Initial consultation to discuss your storm damage needs',
      color: '#3b82f6',
      isActive: true,
      buffer: 15,
      maxAdvanceBooking: 30
    },
    {
      id: 'AT002',
      name: 'Property Inspection',
      duration: 60,
      description: 'Detailed on-site property damage assessment',
      color: '#10b981',
      isActive: true,
      buffer: 30,
      maxAdvanceBooking: 14
    },
    {
      id: 'AT003',
      name: 'Estimate Meeting',
      duration: 45,
      description: 'Review damage assessment and discuss repair estimates',
      color: '#f59e0b',
      isActive: true,
      buffer: 15,
      maxAdvanceBooking: 21
    }
  ]);

  // Mock bookings
  const [bookings] = useState<CalendarBooking[]>([
    {
      id: 'B001',
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah.johnson@email.com',
      customerPhone: '(813) 555-0123',
      scheduledDate: '2024-01-16T10:00:00',
      duration: 60,
      timeZone: 'America/New_York',
      appointmentType: 'inspection',
      status: 'confirmed',
      googleCalendarEventId: 'gcal_123456',
      zoomMeetingUrl: 'https://zoom.us/j/123456789',
      customerNotes: 'Storm damage to roof and siding. Need urgent assessment.',
      internalNotes: 'High priority - extensive damage reported'
    },
    {
      id: 'B002',
      customerName: 'Michael Chen',
      customerEmail: 'mike.chen@email.com',
      customerPhone: '(407) 555-0456',
      scheduledDate: '2024-01-16T14:30:00',
      duration: 30,
      timeZone: 'America/New_York',
      appointmentType: 'consultation',
      status: 'scheduled',
      customerNotes: 'Tree fell on property during recent storm.',
      internalNotes: 'Potential roofing and tree removal work'
    },
    {
      id: 'B003',
      customerName: 'Emma Rodriguez',
      customerEmail: 'emma.rodriguez@email.com',
      customerPhone: '(904) 555-0789',
      scheduledDate: '2024-01-16T16:00:00',
      duration: 45,
      timeZone: 'America/New_York',
      appointmentType: 'estimate',
      status: 'completed',
      customerNotes: 'Follow up on flood damage estimate',
      internalNotes: 'Approved $67,000 restoration project'
    }
  ]);

  // Mock business hours
  const [businessHours] = useState<BusinessHours>({
    monday: { start: '08:00', end: '18:00', enabled: true },
    tuesday: { start: '08:00', end: '18:00', enabled: true },
    wednesday: { start: '08:00', end: '18:00', enabled: true },
    thursday: { start: '08:00', end: '18:00', enabled: true },
    friday: { start: '08:00', end: '17:00', enabled: true },
    saturday: { start: '09:00', end: '15:00', enabled: true },
    sunday: { start: '10:00', end: '14:00', enabled: false }
  });

  const getStatusColor = (status: CalendarBooking['status']) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      no_show: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status];
  };

  const getStatusIcon = (status: CalendarBooking['status']) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-3 w-3" />;
      case 'confirmed': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <X className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'no_show': return <AlertCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getAppointmentTypeColor = (type: CalendarBooking['appointmentType']) => {
    const colors = {
      consultation: '#3b82f6',
      estimate: '#f59e0b',
      inspection: '#10b981'
    };
    return colors[type];
  };

  const generateTimeSlots = (date: string): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const dayOfWeek = new Date(date).toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
    
    // Generate time slots based on business hours
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const isBooked = bookings.some(booking => 
          booking.scheduledDate.includes(date) && 
          booking.scheduledDate.includes(timeString)
        );
        
        slots.push({
          time: timeString,
          available: !isBooked,
          booked: isBooked
        });
      }
    }
    
    return slots;
  };

  const createBooking = () => {
    setIsCreating(true);
    console.log('Creating new booking');
  };

  const editBooking = (booking: CalendarBooking) => {
    setSelectedBooking(booking);
    console.log('Editing booking:', booking);
  };

  const cancelBooking = (bookingId: string) => {
    console.log('Cancelling booking:', bookingId);
  };

  const rescheduleBooking = (bookingId: string) => {
    console.log('Rescheduling booking:', bookingId);
  };

  const markCompleted = (bookingId: string) => {
    console.log('Marking completed:', bookingId);
  };

  const sendReminder = (bookingId: string) => {
    console.log('Sending reminder:', bookingId);
  };

  const todayBookings = bookings.filter(booking => 
    booking.scheduledDate.startsWith(new Date().toISOString().split('T')[0])
  );
  
  const upcomingBookings = bookings.filter(booking => 
    new Date(booking.scheduledDate) > new Date() &&
    !booking.scheduledDate.startsWith(new Date().toISOString().split('T')[0])
  );

  return (
    <div className="space-y-6" data-testid="calendar-booking">
      {/* Header */}
      <FadeIn>
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <ScaleIn>
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Calendar className="h-8 w-8 text-blue-400" />
                  </div>
                </ScaleIn>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Calendar Booking
                  </h1>
                  <p className="text-blue-200">
                    Manage appointments, consultations, and property inspections
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  onClick={createBooking}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-create-booking"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Booking
                </Button>
                <Button
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  data-testid="button-sync-calendar"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Sync Calendar
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <CalendarDays className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white" data-testid="text-total-bookings">
                    {bookings.length}
                  </div>
                  <div className="text-xs text-blue-200">Total Bookings</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <Clock className="h-5 w-5 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white" data-testid="text-today-bookings">
                    {todayBookings.length}
                  </div>
                  <div className="text-xs text-blue-200">Today's Bookings</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <UserCheck className="h-5 w-5 text-orange-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white" data-testid="text-confirmed-bookings">
                    {bookings.filter(b => b.status === 'confirmed').length}
                  </div>
                  <div className="text-xs text-blue-200">Confirmed</div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-5 w-5 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white" data-testid="text-completion-rate">
                    {Math.round((bookings.filter(b => b.status === 'completed').length / bookings.length) * 100)}%
                  </div>
                  <div className="text-xs text-blue-200">Completion Rate</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Appointment Management
            </CardTitle>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'calendar' | 'bookings' | 'settings')}>
              <TabsList>
                <TabsTrigger value="calendar" data-testid="tab-calendar">Calendar</TabsTrigger>
                <TabsTrigger value="bookings" data-testid="tab-bookings">Bookings</TabsTrigger>
                <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {viewMode === 'calendar' ? (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-12 gap-6"
              >
                {/* Calendar Navigation */}
                <div className="col-span-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Select Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        data-testid="input-select-date"
                      />
                      
                      <div className="mt-4 space-y-3">
                        <h4 className="font-medium text-sm">Appointment Types</h4>
                        {appointmentTypes.map(type => (
                          <div key={type.id} className="flex items-center justify-between p-2 rounded-lg border">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: type.color }}
                              />
                              <div>
                                <div className="text-sm font-medium">{type.name}</div>
                                <div className="text-xs text-gray-500">{type.duration} min</div>
                              </div>
                            </div>
                            <Switch checked={type.isActive} size="sm" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Time Slots */}
                <div className="col-span-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Available Times - {new Date(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto" data-testid="time-slots-grid">
                        {generateTimeSlots(selectedDate).map((slot, index) => (
                          <Button
                            key={index}
                            variant={slot.booked ? "destructive" : slot.available ? "outline" : "secondary"}
                            size="sm"
                            disabled={slot.booked || !slot.available}
                            className={`h-8 text-xs ${slot.booked ? 'opacity-50' : ''}`}
                            data-testid={`time-slot-${slot.time}`}
                          >
                            {slot.time}
                            {slot.booked && <Clock className="h-2 w-2 ml-1" />}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Today's Bookings */}
                <div className="col-span-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Today's Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {todayBookings.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No bookings today</p>
                          </div>
                        ) : (
                          todayBookings.map(booking => (
                            <div 
                              key={booking.id} 
                              className="p-3 border rounded-lg"
                              data-testid={`today-booking-${booking.id}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-sm">{booking.customerName}</div>
                                <Badge className={`${getStatusColor(booking.status)} text-xs`}>
                                  {getStatusIcon(booking.status)}
                                  <span className="ml-1 capitalize">{booking.status}</span>
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-600 space-y-1">
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(booking.scheduledDate).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })} ({booking.duration} min)
                                </div>
                                <div className="flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  {booking.appointmentType}
                                </div>
                                {booking.customerPhone && (
                                  <div className="flex items-center">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {booking.customerPhone}
                                  </div>
                                )}
                              </div>
                              <div className="flex space-x-1 mt-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => editBooking(booking)}
                                  data-testid={`button-edit-${booking.id}`}
                                >
                                  <Edit className="h-2 w-2" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => sendReminder(booking.id)}
                                  data-testid={`button-remind-${booking.id}`}
                                >
                                  <Bell className="h-2 w-2" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ) : viewMode === 'bookings' ? (
              <motion.div
                key="bookings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
                data-testid="bookings-list"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">All Bookings</h3>
                  <div className="flex space-x-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Filter status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  {bookings.map(booking => (
                    <Card key={booking.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: getAppointmentTypeColor(booking.appointmentType) }}
                            />
                            <div>
                              <h4 className="font-medium">{booking.customerName}</h4>
                              <p className="text-sm text-gray-600">{booking.customerEmail}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="font-medium text-sm">
                                {new Date(booking.scheduledDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(booking.scheduledDate).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })} ({booking.duration} min)
                              </div>
                            </div>
                            
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1 capitalize">{booking.status}</span>
                            </Badge>
                            
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => editBooking(booking)}
                                data-testid={`button-edit-booking-${booking.id}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => rescheduleBooking(booking.id)}
                                data-testid={`button-reschedule-${booking.id}`}
                              >
                                <Calendar className="h-3 w-3" />
                              </Button>
                              {booking.status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => markCompleted(booking.id)}
                                  data-testid={`button-complete-${booking.id}`}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelBooking(booking.id)}
                                data-testid={`button-cancel-${booking.id}`}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Type: </span>
                            <span className="capitalize">{booking.appointmentType}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Phone: </span>
                            <span>{booking.customerPhone || 'Not provided'}</span>
                          </div>
                        </div>
                        
                        {booking.customerNotes && (
                          <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                            <span className="text-gray-500">Customer Notes: </span>
                            <span className="italic">"{booking.customerNotes}"</span>
                          </div>
                        )}
                        
                        {booking.internalNotes && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900 rounded text-sm">
                            <span className="text-blue-700 dark:text-blue-300">Internal Notes: </span>
                            <span>{booking.internalNotes}</span>
                          </div>
                        )}
                        
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                          <div className="flex space-x-4">
                            {booking.googleCalendarEventId && (
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Google Calendar
                              </span>
                            )}
                            {booking.zoomMeetingUrl && (
                              <span className="flex items-center">
                                <Video className="h-3 w-3 mr-1" />
                                Zoom Meeting
                              </span>
                            )}
                          </div>
                          <span>Timezone: {booking.timeZone}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
                data-testid="calendar-settings"
              >
                <div className="grid grid-cols-2 gap-6">
                  {/* Business Hours */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Business Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(businessHours).map(([day, hours]) => (
                          <div key={day} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Switch checked={hours.enabled} />
                              <Label className="capitalize w-20">{day}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="time"
                                value={hours.start}
                                className="w-24"
                                disabled={!hours.enabled}
                              />
                              <span>to</span>
                              <Input
                                type="time"
                                value={hours.end}
                                className="w-24"
                                disabled={!hours.enabled}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Appointment Types */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Appointment Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {appointmentTypes.map(type => (
                          <div key={type.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: type.color }}
                                />
                                <h4 className="font-medium">{type.name}</h4>
                              </div>
                              <Switch checked={type.isActive} />
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">Duration: </span>
                                <span>{type.duration} min</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Buffer: </span>
                                <span>{type.buffer} min</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Max Advance: </span>
                                <span>{type.maxAdvanceBooking} days</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Integration Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Integrations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg text-center">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <h4 className="font-medium mb-1">Google Calendar</h4>
                        <p className="text-sm text-gray-600 mb-3">Sync appointments with Google Calendar</p>
                        <Button size="sm" className="w-full">Connect</Button>
                      </div>
                      
                      <div className="p-4 border rounded-lg text-center">
                        <Video className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <h4 className="font-medium mb-1">Zoom</h4>
                        <p className="text-sm text-gray-600 mb-3">Auto-generate meeting links</p>
                        <Button size="sm" className="w-full">Connect</Button>
                      </div>
                      
                      <div className="p-4 border rounded-lg text-center">
                        <Mail className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <h4 className="font-medium mb-1">Email Reminders</h4>
                        <p className="text-sm text-gray-600 mb-3">Automatic booking confirmations</p>
                        <Button size="sm" variant="outline" className="w-full">Configure</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}