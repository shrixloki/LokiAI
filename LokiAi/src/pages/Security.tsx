import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Key, 
  Lock, 
  Unlock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Fingerprint,
  Smartphone,
  Users,
  FileText,
  Download
} from 'lucide-react';
import { mockSecurityLogs } from '@/data/mockData';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';

export default function Security() {
  const { user, updatePreferences } = useWallet();
  const { toast } = useToast();
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    multiSigEnabled: true,
    autoLockEnabled: true,
    biometricEnabled: false,
    allowedIps: '',
    sessionTimeout: 30
  });
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const securityScore = 85; // Mock security score
  const recentLogs = mockSecurityLogs.slice(0, 8);

  const handleSecuritySettingChange = (setting: string, value: boolean | string | number) => {
    setSecuritySettings(prev => ({ ...prev, [setting]: value }));
    toast({
      title: "Security Setting Updated",
      description: `${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} has been updated.`
    });
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'login': return <Key className="h-4 w-4" />;
      case 'transaction': return <Shield className="h-4 w-4" />;
      case 'agent-action': return <FileText className="h-4 w-4" />;
      case 'security-alert': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getLogColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-scale-gray-400';
    }
  };

  const generateBackupCodes = () => {
    toast({
      title: "Backup Codes Generated",
      description: "Your new backup codes have been generated. Please store them securely."
    });
  };

  const exportSecurityReport = () => {
    toast({
      title: "Security Report",
      description: "Your security report has been generated and downloaded."
    });
  };

  return (
    <DashboardLayout title="Security" subtitle="Manage your security settings and monitor account activity">
      <div className="space-y-8">
        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Shield className={`h-5 w-5 ${securityScore >= 80 ? 'text-green-500' : securityScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`} />
                <div className="flex-1">
                  <p className="text-sm text-scale-gray-400">Security Score</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold text-foreground">{securityScore}</p>
                    <span className="text-xs text-scale-gray-500">/100</span>
                  </div>
                  <Progress value={securityScore} className="h-1 mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-scale-gray-400">Multi-Sig Wallets</p>
                  <p className="text-2xl font-bold text-foreground">3</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-scale-gray-400">Active Alerts</p>
                  <p className="text-2xl font-bold text-foreground">
                    {recentLogs.filter(log => !log.resolved && log.severity === 'high').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-scale-gray-400">Verified Sessions</p>
                  <p className="text-2xl font-bold text-foreground">2</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Security Settings */}
          <Card className="bg-card border-scale-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
              <CardDescription className="text-scale-gray-400">
                Configure your account security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Two-Factor Authentication</p>
                  <p className="text-sm text-scale-gray-400">Add an extra layer of security to your account</p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={(checked) => handleSecuritySettingChange('twoFactorEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Multi-Signature Wallet</p>
                  <p className="text-sm text-scale-gray-400">Require multiple signatures for transactions</p>
                </div>
                <Switch
                  checked={securitySettings.multiSigEnabled}
                  onCheckedChange={(checked) => handleSecuritySettingChange('multiSigEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Auto-Lock</p>
                  <p className="text-sm text-scale-gray-400">Automatically lock after inactivity</p>
                </div>
                <Switch
                  checked={securitySettings.autoLockEnabled}
                  onCheckedChange={(checked) => handleSecuritySettingChange('autoLockEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Biometric Authentication</p>
                  <p className="text-sm text-scale-gray-400">Use fingerprint or face ID when available</p>
                </div>
                <Switch
                  checked={securitySettings.biometricEnabled}
                  onCheckedChange={(checked) => handleSecuritySettingChange('biometricEnabled', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-scale-gray-300">Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => handleSecuritySettingChange('sessionTimeout', parseInt(e.target.value))}
                  className="bg-scale-gray-900 border-scale-gray-700 text-foreground"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-scale-gray-800">
                <Button variant="outline" onClick={generateBackupCodes} className="w-full border-scale-gray-700">
                  <Key className="h-4 w-4 mr-2" />
                  Generate Backup Codes
                </Button>
                <Button variant="outline" onClick={exportSecurityReport} className="w-full border-scale-gray-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export Security Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Security */}
          <Card className="bg-card border-scale-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>Wallet Security</span>
              </CardTitle>
              <CardDescription className="text-scale-gray-400">
                Manage your cryptographic identity and keys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Wallet Info */}
              <div className="p-4 bg-scale-gray-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Fingerprint className="h-4 w-4 text-scale-gray-400" />
                    <span className="text-sm font-medium text-foreground">Connected Wallet</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    {user?.walletType?.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-scale-gray-400 font-mono break-all">
                  {user?.address}
                </p>
              </div>

              {/* Private Key (Mock) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-scale-gray-300">Private Key</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="text-scale-gray-400 hover:text-foreground"
                  >
                    {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="p-3 bg-scale-gray-900 rounded-lg border border-scale-gray-700">
                  <p className="text-sm font-mono text-scale-gray-400">
                    {showPrivateKey 
                      ? "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b"
                      : "•".repeat(64)
                    }
                  </p>
                </div>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-scale-gray-400">
                    Never share your private key. This is shown for educational purposes only.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Multi-Sig Configuration */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-scale-gray-400" />
                  <span className="font-medium text-foreground">Multi-Signature Setup</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-scale-gray-900/50 rounded-lg">
                    <span className="text-sm text-foreground">Required Signatures</span>
                    <Badge variant="outline" className="border-scale-gray-600">2 of 3</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-scale-gray-900/50 rounded-lg">
                    <span className="text-sm text-foreground">Threshold Value</span>
                    <Badge variant="outline" className="border-scale-gray-600">$10,000</Badge>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full border-scale-gray-700">
                <Smartphone className="h-4 w-4 mr-2" />
                Configure Hardware Wallet
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Security Activity Log */}
        <Card className="bg-card border-scale-gray-800">
          <CardHeader>
            <CardTitle className="text-foreground">Security Activity Log</CardTitle>
            <CardDescription className="text-scale-gray-400">
              Monitor all security-related events and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-scale-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg bg-scale-gray-800 ${getLogColor(log.severity)}`}>
                      {getLogIcon(log.type)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{log.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs border-scale-gray-600">
                          {log.type.replace('-', ' ')}
                        </Badge>
                        <span className="text-xs text-scale-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={log.severity === 'critical' ? 'destructive' : 
                              log.severity === 'high' ? 'destructive' :
                              log.severity === 'medium' ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {log.severity}
                    </Badge>
                    {log.resolved ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}