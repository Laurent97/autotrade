import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Filter, Eye, EyeOff, Package, CreditCard, MessageSquare, Gift, Truck, Settings, X } from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import { supabase } from '@/lib/supabase/client';
import type { Notification, NotificationType } from '@/lib/types/notifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, unread: 0 });

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter, typeFilter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const userId = await getCurrentUserId();
      const response = await notificationService.getNotifications(
        userId,
        1,
        20,
        filter === 'unread',
        typeFilter === 'all' ? undefined : typeFilter
      );
      
      setNotifications(response.notifications);
      setStats({ total: response.total, unread: response.unreadCount });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserId = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || '';
  };

  const markAsRead = async (id: string) => {
    try {
      const userId = await getCurrentUserId();
      await notificationService.markAsRead(id, userId);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const userId = await getCurrentUserId();
      await notificationService.markAllAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setStats(prev => ({ ...prev, unread: 0 }));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const userId = await getCurrentUserId();
      await notificationService.deleteNotification(id, userId);
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setStats(prev => ({ 
        ...prev, 
        total: prev.total - 1,
        unread: prev.unread - (notification?.read ? 0 : 1)
      }));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getTypeColor = (type: NotificationType) => {
    const colors = {
      payment: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      order: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      system: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      promotion: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      shipping: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    };
    return colors[type] || colors.system;
  };

  const getTypeIcon = (type: NotificationType) => {
    const icons = {
      payment: CreditCard,
      order: Package,
      admin: MessageSquare,
      system: Settings,
      promotion: Gift,
      shipping: Truck
    };
    return icons[type] || Bell;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        // Only close if clicking on the backdrop, not the modal content
        if (e.target === e.currentTarget) {
          onClose();
          // Go back to previous page
          window.history.back();
        }
      }}
    >
      <div 
        className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col m-4"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click from propagating to modal content
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-foreground" />
            <h2 className="text-xl font-bold text-foreground">Notifications</h2>
            {stats.unread > 0 && (
              <Badge variant="secondary" className="text-xs">
                {stats.unread} unread
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {stats.unread > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Mark all as read
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All notifications</SelectItem>
                  <SelectItem value="unread">Unread only</SelectItem>
                  <SelectItem value="read">Read only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="order">Order</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="promotion">Promotions</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
              <Bell className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No notifications found
              </h3>
              <p className="text-muted-foreground">
                {filter !== 'all' || typeFilter !== 'all' 
                  ? 'Try changing your filters' 
                  : 'You\'re all caught up!'
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="divide-y divide-border">
                {notifications.map((notification) => {
                  const IconComponent = getTypeIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 transition-colors hover:bg-muted/50",
                        !notification.read && "bg-accent/10"
                      )}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            notification.read 
                              ? "bg-muted" 
                              : "bg-accent"
                          )}>
                            <IconComponent className={cn(
                              "w-5 h-5",
                              notification.read 
                                ? "text-muted-foreground" 
                                : "text-accent-foreground"
                            )} />
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div 
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    getPriorityColor(notification.priority)
                                  )} 
                                />
                                <h4 className={cn(
                                  "font-medium truncate text-sm",
                                  notification.read 
                                    ? "text-muted-foreground" 
                                    : "text-foreground"
                                )}>
                                  {notification.title}
                                </h4>
                                <span className={cn(
                                  "text-xs px-2 py-1 rounded-full",
                                  getTypeColor(notification.type)
                                )}>
                                  {notification.type}
                                </span>
                                {notification.priority === 'urgent' && (
                                  <Badge variant="destructive" className="text-xs">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                <span>{formatDateTime(notification.created_at)}</span>
                                {!notification.read && (
                                  <Badge variant="secondary" className="text-xs">
                                    New
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-1 ml-2">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="h-6 w-6 p-0"
                                  title="Mark as read"
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-6 w-6 p-0"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          
                          {notification.link && (
                            <Button
                              variant="link"
                              className="p-0 h-auto text-xs text-primary hover:text-primary/80"
                              onClick={() => {
                                if (!notification.read) {
                                  markAsRead(notification.id);
                                }
                                window.open(notification.link, '_blank');
                              }}
                            >
                              View details →
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;
