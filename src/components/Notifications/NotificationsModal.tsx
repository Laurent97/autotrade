import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Filter, Eye, EyeOff, Package, CreditCard, MessageSquare, Gift, Truck, Settings, X, Sparkles, Clock, AlertCircle } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
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
        className="bg-gradient-to-br from-background via-background to-muted/50 border border-border/50 shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col m-4 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click from propagating to modal content
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/5 via-transparent to-primary/5 border-b border-border/50 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse"></div>
                <Bell className="w-7 h-7 text-primary relative z-10" />
                {stats.unread > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-bounce"></div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-primary/80 bg-clip-text text-transparent">
                  Notifications
                </h2>
                <p className="text-sm text-muted-foreground">
                  {stats.total} total {stats.total === 1 ? 'notification' : 'notifications'}
                </p>
              </div>
              {stats.unread > 0 && (
                <Badge variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors animate-in slide-in-from-right-2 duration-300">
                  <Sparkles className="w-3 h-3 mr-1" />
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
                  className="flex items-center gap-2 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                >
                  <Check className="w-4 h-4" />
                  Mark all as read
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-muted/30 border-b border-border/30 p-4 backdrop-blur-sm">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-3 bg-background/50 rounded-lg px-3 py-2 border border-border/50">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Filters:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-44 bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      All notifications
                    </div>
                  </SelectItem>
                  <SelectItem value="unread">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Unread only
                    </div>
                  </SelectItem>
                  <SelectItem value="read">
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4" />
                      Read only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger className="w-44 bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    All types
                  </div>
                </SelectItem>
                <SelectItem value="payment">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-green-600" />
                    Payment
                  </div>
                </SelectItem>
                <SelectItem value="order">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    Order
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    Admin
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-600" />
                    System
                  </div>
                </SelectItem>
                <SelectItem value="promotion">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-yellow-600" />
                    Promotions
                  </div>
                </SelectItem>
                <SelectItem value="shipping">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    Shipping
                  </div>
                </SelectItem>
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
              <div className="divide-y divide-border/50">
                {notifications.map((notification, index) => {
                  const IconComponent = getTypeIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 transition-all duration-200 hover:bg-muted/30 hover:shadow-sm border-l-4 border-transparent hover:border-primary/30 animate-in slide-in-from-left-2",
                        !notification.read && "bg-gradient-to-r from-primary/5 via-transparent to-transparent border-l-primary/50 hover:border-primary",
                        `delay-${Math.min(index * 50, 500)}`
                      )}
                    >
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-all duration-200",
                            notification.read 
                              ? "bg-muted/50 border border-border/30" 
                              : "bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 shadow-primary/20"
                          )}>
                            <IconComponent className={cn(
                              "w-6 h-6 transition-colors",
                              notification.read 
                                ? "text-muted-foreground" 
                                : "text-primary"
                            )} />
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <div 
                                  className={cn(
                                    "w-2.5 h-2.5 rounded-full animate-pulse",
                                    getPriorityColor(notification.priority)
                                  )} 
                                />
                                <h4 className={cn(
                                  "font-semibold truncate text-base",
                                  notification.read 
                                    ? "text-muted-foreground" 
                                    : "text-foreground"
                                )}>
                                  {notification.title}
                                </h4>
                                <span className={cn(
                                  "text-xs px-2.5 py-1 rounded-full font-medium",
                                  getTypeColor(notification.type)
                                )}>
                                  {notification.type}
                                </span>
                                {notification.priority === 'urgent' && (
                                  <Badge variant="destructive" className="text-xs animate-pulse">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDateTime(notification.created_at)}</span>
                                </div>
                                {!notification.read && (
                                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                    <Sparkles className="w-3 h-3 mr-1" />
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
                                  className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                                  title="Mark as read"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="bg-muted/20 rounded-lg p-3 mb-3 border border-border/30">
                            <p className="text-sm text-foreground leading-relaxed">
                              {notification.message}
                            </p>
                          </div>
                          
                          {notification.link && (
                            <Button
                              variant="outline"
                              className="text-xs bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                              onClick={() => {
                                if (!notification.read) {
                                  markAsRead(notification.id);
                                }
                                window.open(notification.link, '_blank');
                              }}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View details
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
