import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Wallet,
  Globe,
  Moon,
  Sun,
  Bell,
  Shield,
  ChevronRight,
  AlertTriangle,
  Download,
  Upload,
  Trash2
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';

export function UserSettings() {
  const { user, updatePreferences, disconnectWallet } = useWallet();
  const { toast } = useToast();
  
  const [profileSettings, setProfileSettings] = useState({
    displayName: '',
    email: '',
    timezone: 'UTC',
    language: 'en'
  });

  const [preferences, setPreferences] = useState({
    theme: user?.preferences?.theme || 'dark',
    notifications: user?.preferences?.notifications || true,
    autoExecute: user?.preferences?.autoExecute || false,
    riskTolerance: user?.preferences?.riskTolerance || 'medium',
    preferredChains: user?.preferences?.preferredChains || ['ethereum', 'polygon']
  });

  const [exportFormat, setExportFormat] = useState('json');

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    updatePreferences({ [key]: value });
  };

  const handleProfileUpdate = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile settings have been saved successfully."
    });
  };

  const exportData = () => {
    const data = {
      profile: profileSettings,
      preferences,
      wallet: {
        address: user?.address,
        type: user?.walletType,
        connectedAt: user?.connectedAt
      },
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crosschain-ai-data-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: `Your data has been exported as ${exportFormat.toUpperCase()}.`
    });
  };

  const deleteAccount = () => {
    toast({
      title: "Account Deletion",
      description: "This feature will be available soon. Please contact support for account deletion.",
      variant: "destructive"
    });
  };

  return (
    <div className="space-y-8">
      {/* Profile Settings */}
      <Card className="bg-card border-scale-gray-800">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Settings</span>
          </CardTitle>
          <CardDescription className="text-scale-gray-400">
            Manage your personal information and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-scale-gray-300">Display Name</Label>
              <Input
                placeholder="Enter your display name"
                value={profileSettings.displayName}
                onChange={(e) => setProfileSettings(prev => ({ ...prev, displayName: e.target.value }))}
                className="bg-scale-gray-900 border-scale-gray-700 text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-scale-gray-300">Email Address</Label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={profileSettings.email}
                onChange={(e) => setProfileSettings(prev => ({ ...prev, email: e.target.value }))}
                className="bg-scale-gray-900 border-scale-gray-700 text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-scale-gray-300">Timezone</Label>
              <Select value={profileSettings.timezone} onValueChange={(value) => 
                setProfileSettings(prev => ({ ...prev, timezone: value }))
              }>
                <SelectTrigger className="bg-scale-gray-900 border-scale-gray-700 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-scale-gray-800">
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-scale-gray-300">Language</Label>
              <Select value={profileSettings.language} onValueChange={(value) => 
                setProfileSettings(prev => ({ ...prev, language: value }))
              }>
                <SelectTrigger className="bg-scale-gray-900 border-scale-gray-700 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-scale-gray-800">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleProfileUpdate} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Update Profile
          </Button>
        </CardContent>
      </Card>

      {/* Wallet Information */}
      <Card className="bg-card border-scale-gray-800">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Connected Wallet</span>
          </CardTitle>
          <CardDescription className="text-scale-gray-400">
            Your current wallet connection details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-scale-gray-900/50 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <p className="font-medium text-foreground">Wallet Address</p>
                <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                  {user?.walletType?.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-scale-gray-400 font-mono break-all">
                {user?.address}
              </p>
              <p className="text-xs text-scale-gray-500">
                Connected: {user?.connectedAt ? new Date(user.connectedAt).toLocaleString() : 'Unknown'}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={disconnectWallet}
            className="border-red-600 text-red-400 hover:bg-red-600/10"
          >
            Disconnect Wallet
          </Button>
        </CardContent>
      </Card>

      {/* Application Preferences */}
      <Card className="bg-card border-scale-gray-800">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Application Preferences</span>
          </CardTitle>
          <CardDescription className="text-scale-gray-400">
            Customize your application experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                {preferences.theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <p className="font-medium text-foreground">Theme</p>
              </div>
              <p className="text-sm text-scale-gray-400">Choose your preferred theme</p>
            </div>
            <Select value={preferences.theme} onValueChange={(value) => 
              handlePreferenceChange('theme', value)
            }>
              <SelectTrigger className="w-32 bg-scale-gray-900 border-scale-gray-700 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-scale-gray-800">
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <p className="font-medium text-foreground">Notifications</p>
              </div>
              <p className="text-sm text-scale-gray-400">Enable push notifications</p>
            </div>
            <Switch
              checked={preferences.notifications}
              onCheckedChange={(checked) => handlePreferenceChange('notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <p className="font-medium text-foreground">Auto-Execute Trades</p>
              </div>
              <p className="text-sm text-scale-gray-400">Allow agents to execute trades automatically</p>
            </div>
            <Switch
              checked={preferences.autoExecute}
              onCheckedChange={(checked) => handlePreferenceChange('autoExecute', checked)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <p className="font-medium text-foreground">Risk Tolerance</p>
            </div>
            <Select value={preferences.riskTolerance} onValueChange={(value) => 
              handlePreferenceChange('riskTolerance', value)
            }>
              <SelectTrigger className="bg-scale-gray-900 border-scale-gray-700 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-scale-gray-800">
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <p className="font-medium text-foreground">Preferred Chains</p>
            <div className="flex flex-wrap gap-2">
              {['ethereum', 'polygon', 'arbitrum', 'bsc'].map((chain) => (
                <Badge
                  key={chain}
                  variant={preferences.preferredChains.includes(chain) ? 'default' : 'outline'}
                  className={`cursor-pointer ${
                    preferences.preferredChains.includes(chain) 
                      ? 'bg-primary text-primary-foreground' 
                      : 'border-scale-gray-600 hover:bg-scale-gray-800'
                  }`}
                  onClick={() => {
                    const newChains = preferences.preferredChains.includes(chain)
                      ? preferences.preferredChains.filter(c => c !== chain)
                      : [...preferences.preferredChains, chain];
                    handlePreferenceChange('preferredChains', newChains);
                  }}
                >
                  {chain}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="bg-card border-scale-gray-800">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Data Management</span>
          </CardTitle>
          <CardDescription className="text-scale-gray-400">
            Export or delete your account data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Export Data</p>
                <p className="text-sm text-scale-gray-400">Download all your account data</p>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="w-20 bg-scale-gray-900 border-scale-gray-700 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-scale-gray-800">
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={exportData} variant="outline" className="border-scale-gray-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <Separator className="bg-scale-gray-800" />

            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-scale-gray-400">
                  <strong>Warning:</strong> Account deletion is permanent and cannot be undone. 
                  All your data, settings, and AI agents will be permanently removed.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={deleteAccount}
                variant="outline" 
                className="border-red-600 text-red-400 hover:bg-red-600/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}