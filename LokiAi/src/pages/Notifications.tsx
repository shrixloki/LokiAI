import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell,
  BellOff,
  Settings,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Trash2,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { mockNotifications } from '@/data/mockData';
import { Notification } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function Notifications() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState({
    // Notification Types
    agentExecutions: true,
    priceAlerts: true,
    securityAlerts: true,
    systemUpdates: false,
    crossChainEvents: true,
    portfolioChanges: true,
    
    // Delivery Methods
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    desktopNotifications: true,
    
    // Timing
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    
    // Frequency
    instantNotifications: true,
    dailyDigest: false,
    weeklyReport: true
  });

  const { toast } = useToast();

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

  const markAsUnread = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: false }
          : notification
      )
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
    toast({
      title: "Notification deleted",
      description: "The notification has been removed."
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    toast({
      title: "All notifications marked as read",
      description: "Your notification list has been updated."
    });
  };

  const updateSetting = (setting: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    toast({
      title: "Settings updated",
      description: `${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} has been updated.`
    });
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.read) ||
      (filter === 'read' && notification.read) ||
      notification.type === filter;
    
    const matchesSearch = searchTerm === '' || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DashboardLayout title="Notifications" subtitle="Manage your alerts and notification preferences">
      <div className="space-y-8">
        {/* Notification Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-scale-gray-400" />
                <div>
                  <p className="text-sm text-scale-gray-400">Total</p>
                  <p className="text-2xl font-bold text-foreground">{notifications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-scale-gray-400">Unread</p>
                  <p className="text-2xl font-bold text-foreground">{unreadCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-scale-gray-400">Warnings</p>
                  <p className="text-2xl font-bold text-foreground">
                    {notifications.filter(n => n.type === 'warning').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-scale-gray-400">Errors</p>
                  <p className="text-2xl font-bold text-foreground">
                    {notifications.filter(n => n.type === 'error').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Notifications List */}
          <Card className="bg-card border-scale-gray-800 lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-foreground">Recent Notifications</CardTitle>
                  <CardDescription className="text-scale-gray-400">
                    Stay updated with your cross-chain activities
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="border-scale-gray-700"
                >
                  Mark All Read
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-scale-gray-400" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-scale-gray-900 border-scale-gray-700 text-foreground"
                  />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-48 bg-scale-gray-900 border-scale-gray-700 text-foreground">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-scale-gray-800">
                    <SelectItem value="all">All Notifications</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warnings</SelectItem>
                    <SelectItem value="error">Errors</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notifications */}
              <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <BellOff className="h-12 w-12 text-scale-gray-500 mx-auto mb-4" />
                    <p className="text-scale-gray-400">No notifications found</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        !notification.read 
                          ? 'bg-scale-gray-900/70 border-scale-gray-700' 
                          : 'bg-scale-gray-900/30 border-scale-gray-800'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`font-medium ${
                                !notification.read ? 'text-foreground' : 'text-scale-gray-300'
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-scale-gray-400 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-scale-gray-500 mt-2">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 ml-4">
                              {!notification.read ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="h-8 w-8 p-0 text-scale-gray-400 hover:text-foreground"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsUnread(notification.id)}
                                  className="h-8 w-8 p-0 text-scale-gray-400 hover:text-foreground"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-8 w-8 p-0 text-scale-gray-400 hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-card border-scale-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Notification Settings</span>
              </CardTitle>
              <CardDescription className="text-scale-gray-400">
                Customize your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Types */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Event Types</h4>
                <div className="space-y-3">
                  {[
                    { key: 'agentExecutions', label: 'Agent Executions', icon: CheckCircle },
                    { key: 'priceAlerts', label: 'Price Alerts', icon: AlertTriangle },
                    { key: 'securityAlerts', label: 'Security Alerts', icon: XCircle },
                    { key: 'systemUpdates', label: 'System Updates', icon: Info },
                    { key: 'crossChainEvents', label: 'Cross-Chain Events', icon: Bell },
                    { key: 'portfolioChanges', label: 'Portfolio Changes', icon: CheckCircle }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <item.icon className="h-4 w-4 text-scale-gray-400" />
                        <span className="text-sm text-scale-gray-300">{item.label}</span>
                      </div>
                      <Switch
                        checked={settings[item.key as keyof typeof settings] as boolean}
                        onCheckedChange={(checked) => updateSetting(item.key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-scale-gray-800" />

              {/* Delivery Methods */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Delivery Methods</h4>
                <div className="space-y-3">
                  {[
                    { key: 'emailNotifications', label: 'Email', icon: Mail },
                    { key: 'pushNotifications', label: 'Push Notifications', icon: Bell },
                    { key: 'smsNotifications', label: 'SMS', icon: MessageSquare },
                    { key: 'desktopNotifications', label: 'Desktop', icon: Smartphone }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <item.icon className="h-4 w-4 text-scale-gray-400" />
                        <span className="text-sm text-scale-gray-300">{item.label}</span>
                      </div>
                      <Switch
                        checked={settings[item.key as keyof typeof settings] as boolean}
                        onCheckedChange={(checked) => updateSetting(item.key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-scale-gray-800" />

              {/* Quiet Hours */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <VolumeX className="h-4 w-4 text-scale-gray-400" />
                    <span className="text-sm font-medium text-foreground">Quiet Hours</span>
                  </div>
                  <Switch
                    checked={settings.quietHoursEnabled}
                    onCheckedChange={(checked) => updateSetting('quietHoursEnabled', checked)}
                  />
                </div>
                {settings.quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-scale-gray-400">From</Label>
                      <Input
                        type="time"
                        value={settings.quietHoursStart}
                        onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                        className="bg-scale-gray-900 border-scale-gray-700 text-foreground text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-scale-gray-400">To</Label>
                      <Input
                        type="time"
                        value={settings.quietHoursEnd}
                        onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                        className="bg-scale-gray-900 border-scale-gray-700 text-foreground text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}