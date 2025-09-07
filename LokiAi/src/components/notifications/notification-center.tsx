import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  BellOff,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Trash2,
  Settings,
  X
} from 'lucide-react';
import { mockNotifications } from '@/data/mockData';
import { Notification } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [notificationSettings, setNotificationSettings] = useState({
    agentExecutions: true,
    priceAlerts: true,
    securityAlerts: true,
    systemUpdates: false,
    emailNotifications: true,
    pushNotifications: true
  });
  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4 text-scale-gray-400" />;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    toast({
      title: "All notifications marked as read",
      description: "Your notification list has been cleared."
    });
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const updateNotificationSetting = (setting: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: value }));
    toast({
      title: "Notification Settings Updated",
      description: `${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} notifications ${value ? 'enabled' : 'disabled'}.`
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative text-scale-gray-400 hover:text-foreground ${className}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-card border-scale-gray-800" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b border-scale-gray-800">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-scale-gray-400 hover:text-foreground"
              >
                Mark all read
              </Button>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="text-scale-gray-400 hover:text-foreground">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 bg-card border-scale-gray-800" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Notification Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-scale-gray-300">Agent Executions</span>
                      <Switch
                        checked={notificationSettings.agentExecutions}
                        onCheckedChange={(checked) => updateNotificationSetting('agentExecutions', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-scale-gray-300">Price Alerts</span>
                      <Switch
                        checked={notificationSettings.priceAlerts}
                        onCheckedChange={(checked) => updateNotificationSetting('priceAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-scale-gray-300">Security Alerts</span>
                      <Switch
                        checked={notificationSettings.securityAlerts}
                        onCheckedChange={(checked) => updateNotificationSetting('securityAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-scale-gray-300">System Updates</span>
                      <Switch
                        checked={notificationSettings.systemUpdates}
                        onCheckedChange={(checked) => updateNotificationSetting('systemUpdates', checked)}
                      />
                    </div>
                    <Separator className="bg-scale-gray-800" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-scale-gray-300">Email Notifications</span>
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => updateNotificationSetting('emailNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-scale-gray-300">Push Notifications</span>
                      <Switch
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={(checked) => updateNotificationSetting('pushNotifications', checked)}
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellOff className="h-8 w-8 text-scale-gray-500 mx-auto mb-2" />
              <p className="text-scale-gray-400">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-scale-gray-800">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 hover:bg-scale-gray-900/50 transition-colors ${
                    !notification.read ? 'bg-scale-gray-900/30' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-foreground' : 'text-scale-gray-300'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-scale-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-scale-gray-500 mt-2">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 w-6 p-0 text-scale-gray-400 hover:text-foreground"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 w-6 p-0 text-scale-gray-400 hover:text-red-400"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {notification.actionUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-6 px-2 text-xs text-primary hover:text-primary/80"
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-3 border-t border-scale-gray-800">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-scale-gray-400 hover:text-foreground"
            >
              View All Notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}