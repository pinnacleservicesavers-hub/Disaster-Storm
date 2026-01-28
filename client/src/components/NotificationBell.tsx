import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, X, TreePine, AlertTriangle, Zap, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  notificationType: string;
  priority: string;
  title: string;
  message: string;
  relatedType?: string;
  relatedId?: string;
  actionUrl?: string;
  actionLabel?: string;
  state?: string;
  city?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    uniqueId?: string;
    impactType?: string;
    estimatedCostMin?: string;
    estimatedCostMax?: string;
    confidenceScore?: number;
  };
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  normal: 'bg-blue-500',
  low: 'bg-gray-500'
};

const typeIcons: Record<string, any> = {
  tree_incident: TreePine,
  weather_alert: AlertTriangle,
  lead_match: Zap,
  system: Bell
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications?limit=20');
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/notifications/mark-all-read', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/notifications/${id}/dismiss`, { method: 'PATCH' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white hover:bg-white/10"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 bg-slate-800 border-slate-700"
        align="end"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              className="text-xs text-slate-400 hover:text-white"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {notifications.map((notification: Notification) => {
                const Icon = typeIcons[notification.notificationType] || Bell;
                
                return (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-slate-700/50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-slate-700/30' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${priorityColors[notification.priority]} flex-shrink-0`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-sm ${notification.isRead ? 'text-slate-300' : 'text-white'}`}>
                            {notification.title}
                          </span>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        {notification.state && notification.city && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3" />
                            {notification.city}, {notification.state}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                          {notification.actionUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-emerald-400 hover:text-emerald-300 p-0 h-auto"
                            >
                              {notification.actionLabel || 'View'}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0 text-slate-500 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissMutation.mutate(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        <div className="px-4 py-2 border-t border-slate-700">
          <Button
            variant="ghost"
            className="w-full text-sm text-slate-400 hover:text-white"
            onClick={() => {
              window.location.href = '/tree-tracker';
              setOpen(false);
            }}
          >
            View Tree Incident Tracker
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
