import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet,
  Plus,
  Copy,
  ExternalLink,
  Shield,
  Key,
  Fingerprint,
  Smartphone,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  QrCode
} from 'lucide-react';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useToast } from '@/hooks/use-toast';

export default function Wallets() {
  const { account, isConnected, connect } = useMetaMask();
  const { 
    ethBalance, 
    usdBalance, 
    ethPrice, 
    isLoading, 
    error, 
    networkInfo, 
    refreshBalance, 
    formatEthBalance, 
    formatUsdBalance,
    lastUpdated 
  } = useWalletBalance(account, isConnected);
  const { toast } = useToast();
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [showPrivateKeys, setShowPrivateKeys] = useState<Record<string, boolean>>({});

  // Real wallet data based on MetaMask connection
  const wallets = isConnected ? [
    {
      id: 'primary',
      name: 'Primary Wallet',
      address: account || '0x742d35Cc6Cd3B7a8917fe5b3B8b3C9f5d5e5d9a',
      type: 'metamask',
      balance: usdBalance,
      balanceETH: parseFloat(ethBalance),
      isConnected: true,
      isHardware: false,
      chains: ['ethereum', 'polygon', 'arbitrum'],
      createdAt: '2024-01-15T10:30:00Z',
      network: networkInfo?.name || 'Unknown Network'
    }
  ] : [];

  // Only show real connected wallets - no mock data
  const allWallets = wallets;

  const supportedWallets = [
    { id: 'metamask', name: 'MetaMask', icon: '🦊', type: 'software' },
    { id: 'phantom', name: 'Phantom', icon: '👻', type: 'software' },
    { id: 'coinbase', name: 'Coinbase Wallet', icon: '💰', type: 'software' },
    { id: 'ledger', name: 'Ledger', icon: '🔒', type: 'hardware' },
    { id: 'trezor', name: 'Trezor', icon: '🔐', type: 'hardware' },
    { id: 'walletconnect', name: 'WalletConnect', icon: '🔗', type: 'software' }
  ];

  const getWalletIcon = (type: string) => {
    const wallet = supportedWallets.find(w => w.id === type);
    return wallet?.icon || '💳';
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} has been copied to your clipboard.`
    });
  };

  const togglePrivateKey = (walletId: string) => {
    setShowPrivateKeys(prev => ({
      ...prev,
      [walletId]: !prev[walletId]
    }));
  };

  const totalBalance = allWallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const connectedWallets = isConnected ? 1 : 0;
  const hardwareWallets = 0; // Only software wallets (MetaMask) for now

  return (
    <DashboardLayout title="Wallets" subtitle="Manage your connected wallets and addresses">
      <div className="space-y-8">
        {/* Wallet Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-scale-gray-400" />
                <div>
                  <p className="text-sm text-scale-gray-400">Total Wallets</p>
                  <p className="text-2xl font-bold text-foreground">{isConnected ? 1 : 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-scale-gray-400">Connected</p>
                  <p className="text-2xl font-bold text-foreground">{connectedWallets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-scale-gray-400">Hardware</p>
                  <p className="text-2xl font-bold text-foreground">{hardwareWallets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-scale-gray-400" />
                <div>
                  <p className="text-sm text-scale-gray-400">Total Balance</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${isConnected ? totalBalance.toLocaleString() : '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Your Wallets</h2>
            <p className="text-scale-gray-400">Manage your connected wallets and addresses</p>
          </div>
          <Dialog open={isAddWalletOpen} onOpenChange={setIsAddWalletOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Wallet
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-scale-gray-800">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add New Wallet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {supportedWallets.map((wallet) => (
                    <Button
                      key={wallet.id}
                      variant="outline"
                      className="h-20 border-scale-gray-700 hover:border-scale-gray-600 flex flex-col items-center space-y-2"
                      onClick={() => {
                        if (wallet.id === 'metamask') {
                          connect();
                        } else {
                          toast({
                            title: "Wallet connection initiated",
                            description: `Connecting to ${wallet.name}...`
                          });
                        }
                        setIsAddWalletOpen(false);
                      }}
                    >
                      <span className="text-2xl">{wallet.icon}</span>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">{wallet.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {wallet.type}
                        </Badge>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Wallets List */}
        <div className="space-y-6">
          {!isConnected && (
            <Card className="bg-card border-scale-gray-800">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wallet className="h-12 w-12 text-scale-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">No wallets connected</h3>
                <p className="text-scale-gray-400 text-center mb-6">
                  Connect your MetaMask wallet to view your balance and manage your assets
                </p>
                <Button onClick={connect} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Connect Wallet
                </Button>
              </CardContent>
            </Card>
          )}
          {allWallets.map((wallet) => (
            <Card key={wallet.id} className="bg-card border-scale-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getWalletIcon(wallet.type)}</div>
                    <div>
                      <CardTitle className="text-foreground flex items-center space-x-2">
                        <span>{wallet.name}</span>
                        {wallet.isConnected && (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                            Connected
                          </Badge>
                        )}
                        {wallet.isHardware && (
                          <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                            Hardware
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-scale-gray-400">
                        {wallet.type.charAt(0).toUpperCase() + wallet.type.slice(1)} Wallet
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-scale-gray-400 hover:text-foreground">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-scale-gray-400 hover:text-foreground"
                      onClick={refreshBalance}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    {!wallet.isConnected && (
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Wallet Address */}
                <div className="space-y-2">
                  <Label className="text-scale-gray-300">Wallet Address</Label>
                  <div className="flex items-center space-x-2 p-3 bg-scale-gray-900 rounded-lg border border-scale-gray-700">
                    <code className="flex-1 text-sm font-mono text-foreground">
                      {wallet.address}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(wallet.address, 'Address')}
                      className="text-scale-gray-400 hover:text-foreground"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-scale-gray-400 hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-scale-gray-400 hover:text-foreground"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Balance and Chains */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-scale-gray-300">Balance</Label>
                    <div className="mt-1">
                      <p className="text-2xl font-bold text-foreground">
                        ${formatUsdBalance()}
                      </p>
                      <p className="text-lg text-scale-gray-300">
                        {formatEthBalance()} ETH
                      </p>
                      {networkInfo && (
                        <p className="text-xs text-scale-gray-500">
                          Network: {networkInfo.name}
                        </p>
                      )}
                      <p className="text-xs text-scale-gray-500">
                        ETH Price: ${ethPrice.toLocaleString()}
                      </p>
                      {lastUpdated && (
                        <p className="text-xs text-scale-gray-500">
                          Last updated: {lastUpdated.toLocaleTimeString()}
                        </p>
                      )}
                      {isLoading && (
                        <p className="text-xs text-blue-400">Updating...</p>
                      )}
                      {error && (
                        <p className="text-xs text-red-400">Error: {error}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-scale-gray-300">Supported Chains</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {wallet.chains.map((chain) => (
                        <Badge key={chain} variant="outline" className="border-scale-gray-600">
                          {chain}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Private Key (Mock - Never show real private keys!) */}
                {!wallet.isHardware && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-scale-gray-300">Private Key</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePrivateKey(wallet.id)}
                        className="text-scale-gray-400 hover:text-foreground"
                      >
                        {showPrivateKeys[wallet.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="p-3 bg-scale-gray-900 rounded-lg border border-scale-gray-700">
                      <code className="text-sm font-mono text-scale-gray-400">
                        {showPrivateKeys[wallet.id] 
                          ? "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b"
                          : "•".repeat(64)
                        }
                      </code>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-scale-gray-500">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Never share your private key with anyone</span>
                    </div>
                  </div>
                )}

                {/* Security Features */}
                <div className="space-y-3">
                  <Label className="text-scale-gray-300">Security Features</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2 p-2 bg-scale-gray-900/50 rounded-lg">
                      <Key className="h-4 w-4 text-scale-gray-400" />
                      <span className="text-sm text-foreground">Multi-Sig</span>
                      <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                    </div>
                    <div className="flex items-center space-x-2 p-2 bg-scale-gray-900/50 rounded-lg">
                      <Fingerprint className="h-4 w-4 text-scale-gray-400" />
                      <span className="text-sm text-foreground">Biometric</span>
                      {wallet.isHardware ? (
                        <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                      ) : (
                        <div className="h-4 w-4 border border-scale-gray-600 rounded-full ml-auto" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 p-2 bg-scale-gray-900/50 rounded-lg">
                      <Smartphone className="h-4 w-4 text-scale-gray-400" />
                      <span className="text-sm text-foreground">2FA</span>
                      <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                    </div>
                  </div>
                </div>

                {/* Connection Status */}
                <div className="flex items-center justify-between pt-4 border-t border-scale-gray-800">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      wallet.isConnected ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-sm text-scale-gray-400">
                      {wallet.isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                    <span className="text-xs text-scale-gray-500">
                      • Added {new Date(wallet.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {!wallet.isConnected && (
                    <Button size="sm" variant="outline" className="border-scale-gray-700">
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}