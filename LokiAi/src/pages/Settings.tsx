import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  Zap,
  DollarSign,
  Clock,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useWalletSettings } from '@/hooks/useWalletSettings';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { account, isConnected } = useMetaMask();
  const { 
    settings, 
    isLoading, 
    isSaving, 
    error, 
    updateSetting, 
    saveSettings, 
    resetSettings, 
    deleteSettings, 
    exportSettings, 
    importSettings 
  } = useWalletSettings();
  const { toast } = useToast();
  
  // Local state for pending changes
  const [pendingChanges, setPendingChanges] = useState<Partial<typeof settings>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);

  // Handle local changes without triggering MetaMask
  const handleLocalChange = (key: string, value: any) => {
    setPendingChanges(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  // Get current value (pending change or original setting) with proper typing
  const getCurrentValue = (key: string): any => {
    return pendingChanges[key as keyof typeof pendingChanges] ?? settings?.[key as keyof typeof settings];
  };

  // Type-safe getters for specific types
  const getCurrentStringValue = (key: string): string => {
    const value = getCurrentValue(key);
    return typeof value === 'string' ? value : '';
  };

  const getCurrentBooleanValue = (key: string): boolean => {
    const value = getCurrentValue(key);
    return typeof value === 'boolean' ? value : false;
  };

  const getCurrentNumberValue = (key: string): number => {
    const value = getCurrentValue(key);
    return typeof value === 'number' ? value : 0;
  };

  // Save all pending changes with MetaMask signature
  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges || Object.keys(pendingChanges).length === 0) {
      toast({
        title: "No changes to save",
        description: "Make some changes first before saving."
      });
      return;
    }

    try {
      // Save all pending changes in one batch request
      const success = await saveSettings(pendingChanges);
      
      if (success) {
        // Clear pending changes
        setPendingChanges({});
        setHasUnsavedChanges(false);
        
        toast({
          title: "Settings saved",
          description: "All your changes have been saved successfully with wallet verification."
        });
      }
    } catch (error) {
      toast({
        title: "Failed to save settings",
        description: "Please try again or check your wallet connection.",
        variant: "destructive"
      });
    }
  };

  // Discard pending changes
  const handleDiscardChanges = () => {
    setPendingChanges({});
    setHasUnsavedChanges(false);
    toast({
      title: "Changes discarded",
      description: "All unsaved changes have been discarded."
    });
  };

  const handleUpdateSetting = async (key: string, value: any) => {
    try {
      const success = await updateSetting(key as keyof typeof settings, value);
      if (success) {
        toast({
          title: "Setting updated",
          description: `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} has been updated.`
        });
      }
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Failed to update setting",
        variant: "destructive"
      });
    }
  };

  const handleExportSettings = async () => {
    try {
      const exportData = await exportSettings();
      if (exportData) {
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `lokiai-settings-${account?.slice(0, 8)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        toast({
          title: "Settings exported",
          description: "Your settings have been downloaded as a JSON file."
        });
      }
    } catch (err) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Failed to export settings",
        variant: "destructive"
      });
    }
  };

  const handleResetSettings = async () => {
    try {
      const success = await resetSettings();
      if (success) {
        toast({
          title: "Settings reset",
          description: "All settings have been reset to defaults.",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Reset failed",
        description: err instanceof Error ? err.message : "Failed to reset settings",
        variant: "destructive"
      });
    }
  };

  const handleImportSettings = () => {
    fileInputRef?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      const success = await importSettings(importData);
      if (success) {
        toast({
          title: "Settings imported",
          description: "Your settings have been successfully imported."
        });
      }
    } catch (err) {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Failed to import settings",
        variant: "destructive"
      });
    }
    
    // Reset file input
    event.target.value = '';
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete all your settings? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await deleteSettings();
      if (success) {
        toast({
          title: "Account deleted",
          description: "All your settings have been permanently deleted.",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Deletion failed",
        description: err instanceof Error ? err.message : "Failed to delete account",
        variant: "destructive"
      });
    }
  };

  // Show loading state while fetching settings
  if (isLoading) {
    return (
      <DashboardLayout title="Settings" subtitle="Customize your Cross-Chain AI Agent Network experience">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-scale-gray-400">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show connection prompt if wallet not connected
  if (!isConnected || !account) {
    return (
      <DashboardLayout title="Settings" subtitle="Customize your Cross-Chain AI Agent Network experience">
        <div className="flex items-center justify-center h-64">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Connect Your Wallet</CardTitle>
              <CardDescription className="text-center">
                Please connect your MetaMask wallet to access personalized settings.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state if settings failed to load
  if (error && !settings) {
    return (
      <DashboardLayout title="Settings" subtitle="Customize your Cross-Chain AI Agent Network experience">
        <div className="flex items-center justify-center h-64">
          <Card className="w-full max-w-md border-red-800">
            <CardHeader>
              <CardTitle className="text-center text-red-400">Error Loading Settings</CardTitle>
              <CardDescription className="text-center">
                {error}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings" subtitle="Customize your Cross-Chain AI Agent Network experience">
      <div className="space-y-8">
        {/* Quick Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Preferences</h2>
            <p className="text-scale-gray-400">Manage your account and application settings</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleExportSettings} className="border-scale-gray-700">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleImportSettings} className="border-scale-gray-700">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <input
              type="file"
              ref={setFileInputRef}
              onChange={handleFileImport}
              accept=".json"
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile & Account */}
          <Card className="bg-card border-scale-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile & Account</span>
              </CardTitle>
              <CardDescription className="text-scale-gray-400">
                Manage your personal information and account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-scale-gray-300">Display Name</Label>
                <Input
                  value={getCurrentStringValue('display_name')}
                  onChange={(e) => handleLocalChange('display_name', e.target.value)}
                  className="bg-scale-gray-900 border-scale-gray-700 text-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-scale-gray-300">Email Address</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={getCurrentStringValue('email')}
                  onChange={(e) => handleLocalChange('email', e.target.value)}
                  className="bg-scale-gray-900 border-scale-gray-700 text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-scale-gray-300">Timezone</Label>
                  <Select value={getCurrentStringValue('timezone') || 'UTC'} onValueChange={(value) => handleLocalChange('timezone', value)}>
                    <SelectTrigger className="bg-scale-gray-900 border-scale-gray-700 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-scale-gray-800">
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern</SelectItem>
                      <SelectItem value="PST">Pacific</SelectItem>
                      <SelectItem value="GMT">GMT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-scale-gray-300">Language</Label>
                  <Select value={getCurrentStringValue('language') || 'en'} onValueChange={(value) => handleLocalChange('language', value)}>
                    <SelectTrigger className="bg-scale-gray-900 border-scale-gray-700 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-scale-gray-800">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-scale-gray-300">Connected Wallet</Label>
                <div className="p-3 bg-scale-gray-900 rounded-lg border border-scale-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{account}</p>
                      <p className="text-xs text-scale-gray-400">MetaMask</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                      Connected
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trading Preferences */}
          <Card className="bg-card border-scale-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Trading Preferences</span>
              </CardTitle>
              <CardDescription className="text-scale-gray-400">
                Configure your default trading and execution settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-scale-gray-300">Default Slippage (%)</Label>
                <div className="px-3">
                  <Slider
                    value={[getCurrentNumberValue('default_slippage') || 0.5]}
                    onValueChange={(value) => handleLocalChange('default_slippage', value[0])}
                    max={5}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-scale-gray-500 mt-1">
                    <span>0.1%</span>
                    <span>{getCurrentNumberValue('default_slippage') || 0.5}%</span>
                    <span>5%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-scale-gray-300">Gas Price Strategy</Label>
                <Select value={getCurrentStringValue('gas_price_preference') || 'standard'} onValueChange={(value) => handleLocalChange('gas_price_preference', value)}>
                  <SelectTrigger className="bg-scale-gray-900 border-scale-gray-700 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-scale-gray-800">
                    <SelectItem value="fast">Fast</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="slow">Slow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-scale-gray-300">Preferred DEX</Label>
                <Input
                  type="text"
                  value={getCurrentStringValue('preferred_dex') || 'uniswap'}
                  onChange={(e) => handleLocalChange('preferred_dex', e.target.value)}
                  className="bg-scale-gray-900 border-scale-gray-700 text-foreground"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Auto-Approve Trades</p>
                  <p className="text-sm text-scale-gray-400">Automatically approve trade transactions</p>
                </div>
                <Switch
                  checked={getCurrentBooleanValue('auto_approve_enabled')}
                  onCheckedChange={(checked) => handleLocalChange('auto_approve_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-card border-scale-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security</span>
              </CardTitle>
              <CardDescription className="text-scale-gray-400">
                Protect your account and manage privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Two-Factor Authentication</p>
                  <p className="text-sm text-scale-gray-400">Add extra security to your account</p>
                </div>
                <Switch
                  checked={getCurrentBooleanValue('two_factor_enabled')}
                  onCheckedChange={(checked) => handleLocalChange('two_factor_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Biometric Authentication</p>
                  <p className="text-sm text-scale-gray-400">Use fingerprint or face ID</p>
                </div>
                <Switch
                  checked={getCurrentBooleanValue('biometric_enabled')}
                  onCheckedChange={(checked) => handleLocalChange('biometric_enabled', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-scale-gray-300">Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  value={(getCurrentNumberValue('session_timeout') || 30).toString()}
                  onChange={(e) => handleLocalChange('session_timeout', parseInt(e.target.value) || 30)}
                  className="bg-scale-gray-900 border-scale-gray-700 text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-scale-gray-300">IP Whitelist</Label>
                <Input
                  placeholder="192.168.1.1, 10.0.0.1"
                  value={getCurrentStringValue('ip_whitelist')}
                  onChange={(e) => handleLocalChange('ip_whitelist', e.target.value)}
                  className="bg-scale-gray-900 border-scale-gray-700 text-foreground"
                />
                <p className="text-xs text-scale-gray-500">Restrict access to specific IP addresses</p>
              </div>

              <Separator className="bg-scale-gray-800" />

              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Data & Privacy</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-scale-gray-300">Data Sharing</span>
                    <Switch
                      checked={getCurrentBooleanValue('data_sharing_enabled')}
                      onCheckedChange={(checked) => handleLocalChange('data_sharing_enabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-scale-gray-300">Analytics Collection</span>
                    <Switch
                      checked={getCurrentBooleanValue('analytics_enabled')}
                      onCheckedChange={(checked) => handleLocalChange('analytics_enabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-scale-gray-300">Marketing Emails</span>
                    <Switch
                      checked={getCurrentBooleanValue('marketing_emails')}
                      onCheckedChange={(checked) => handleLocalChange('marketing_emails', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interface & Display */}
          <Card className="bg-card border-scale-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Interface & Display</span>
              </CardTitle>
              <CardDescription className="text-scale-gray-400">
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-scale-gray-300">Theme</Label>
                <Select value={getCurrentStringValue('theme') || 'dark'} onValueChange={(value) => handleLocalChange('theme', value)}>
                  <SelectTrigger className="bg-scale-gray-900 border-scale-gray-700 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-scale-gray-800">
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-scale-gray-300">Currency Display</Label>
                <Select value={getCurrentStringValue('currency') || 'USD'} onValueChange={(value) => handleLocalChange('currency', value)}>
                  <SelectTrigger className="bg-scale-gray-900 border-scale-gray-700 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-scale-gray-800">
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="BTC">BTC (₿)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Developer Mode</p>
                  <p className="text-sm text-scale-gray-400">Enable advanced developer features</p>
                </div>
                <Switch
                  checked={getCurrentBooleanValue('developer_mode')}
                  onCheckedChange={(checked) => handleLocalChange('developer_mode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Beta Features</p>
                  <p className="text-sm text-scale-gray-400">Enable experimental beta features</p>
                </div>
                <Switch
                  checked={getCurrentBooleanValue('beta_features')}
                  onCheckedChange={(checked) => handleLocalChange('beta_features', checked)}
                />
              </div>

              <Separator className="bg-scale-gray-800" />

              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-scale-gray-300">Email Notifications</span>
                    <Switch
                      checked={getCurrentBooleanValue('email_notifications')}
                      onCheckedChange={(checked) => handleLocalChange('email_notifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-scale-gray-300">Push Notifications</span>
                    <Switch
                      checked={getCurrentBooleanValue('push_notifications')}
                      onCheckedChange={(checked) => handleLocalChange('push_notifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-scale-gray-300">Trade Alerts</span>
                    <Switch
                      checked={getCurrentBooleanValue('trade_alerts')}
                      onCheckedChange={(checked) => handleLocalChange('trade_alerts', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save/Discard Actions - Sticky at bottom when changes exist */}
        {hasUnsavedChanges && (
          <div className="sticky bottom-0 bg-card border-t border-scale-gray-800 p-4 mt-6">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-scale-gray-300">
                  You have unsaved changes ({Object.keys(pendingChanges).length} settings modified)
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDiscardChanges}
                  className="border-scale-gray-700 text-scale-gray-300 hover:bg-scale-gray-800"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Discard Changes
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <Card className="bg-card border-red-800 mt-6">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Danger Zone</span>
            </CardTitle>
            <CardDescription className="text-scale-gray-400">
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-red-800 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Reset All Settings</p>
                <p className="text-sm text-scale-gray-400">Reset all preferences to default values</p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleResetSettings}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Settings
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-red-800 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Delete Account</p>
                <p className="text-sm text-scale-gray-400">Permanently delete your account and all data</p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}