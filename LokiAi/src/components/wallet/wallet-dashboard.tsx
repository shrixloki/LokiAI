import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wallet, 
  Copy, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  DollarSign, 
  Coins,
  TrendingUp,
  Shield,
  Plus
} from 'lucide-react';
import { useMetaMask } from '@/hooks/useMetaMask';

interface WalletData {
  address: string;
  balance: string;
  balanceUSD: number;
  network: string;
}

interface EthPrice {
  ethereum: {
    usd: number;
  };
}

export function WalletDashboard() {
  const { account, isConnected, connect } = useMetaMask();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [currency, setCurrency] = useState<'ETH' | 'USD'>('ETH');
  const [error, setError] = useState<string | null>(null);

  // Fetch ETH price from CoinGecko
  const fetchEthPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data: EthPrice = await response.json();
      setEthPrice(data.ethereum.usd);
    } catch (err) {
      console.error('Failed to fetch ETH price:', err);
      setEthPrice(3500); // Fallback price
    }
  };

  // Fetch wallet balance
  const fetchWalletData = async () => {
    if (!account || !window.ethereum) return;

    setLoading(true);
    setError(null);

    try {
      // Get balance in Wei
      const balanceWei = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [account, 'latest'],
      });

      // Convert Wei to ETH
      const balanceETH = parseInt(balanceWei, 16) / Math.pow(10, 18);
      
      // Get network info
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      const networkNames: { [key: string]: string } = {
        '0x1': 'Ethereum Mainnet',
        '0x5': 'Goerli Testnet',
        '0x11155111': 'Sepolia Testnet',
        '0x89': 'Polygon Mainnet',
      };

      const balanceUSD = balanceETH * ethPrice;

      setWalletData({
        address: account,
        balance: balanceETH.toFixed(6),
        balanceUSD,
        network: networkNames[chainId] || `Chain ID: ${chainId}`,
      });
    } catch (err) {
      console.error('Failed to fetch wallet data:', err);
      setError('Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format currency
  const formatCurrency = (ethAmount: number, usdAmount: number) => {
    if (currency === 'ETH') {
      return `${ethAmount} ETH`;
    }
    return `$${usdAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    fetchEthPrice();
  }, []);

  useEffect(() => {
    if (isConnected && account) {
      fetchWalletData();
    }
  }, [isConnected, account, ethPrice]);

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Wallets</h2>
            <p className="text-muted-foreground">Manage your connected wallets and addresses</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected</CardTitle>
              <div className="h-2 w-2 bg-red-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hardware</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Wallets</CardTitle>
            <CardDescription>Manage your connected wallets and addresses</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No wallets connected</h3>
            <p className="text-muted-foreground text-center mb-6">
              Connect your MetaMask wallet to view your balance and manage your assets
            </p>
            <Button onClick={connect} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Wallets</h2>
          <p className="text-muted-foreground">Manage your connected wallets and addresses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrency(currency === 'ETH' ? 'USD' : 'ETH')}
            className="flex items-center gap-2"
          >
            {currency === 'ETH' ? <Coins className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
            {currency}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWalletData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hardware</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {walletData ? formatCurrency(parseFloat(walletData.balance), walletData.balanceUSD) : '$0.00'}
            </div>
            {walletData && (
              <p className="text-xs text-muted-foreground">
                ETH: ${ethPrice.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Wallets</CardTitle>
            <CardDescription>Manage your connected wallets and addresses</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Wallet
          </Button>
        </CardHeader>
        <CardContent>
          {walletData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Primary Wallet</h3>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Connected
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">MetaMask Wallet</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <label className="text-sm font-medium">Wallet Address</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-background rounded border text-sm font-mono">
                      {walletData.address}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(walletData.address)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Balance</label>
                    <div className="mt-1">
                      <div className="text-2xl font-bold">
                        {formatCurrency(parseFloat(walletData.balance), walletData.balanceUSD)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {currency === 'ETH' 
                          ? `≈ $${walletData.balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `≈ ${walletData.balance} ETH`
                        }
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Supported Chains</label>
                    <div className="mt-1 space-y-1">
                      <Badge variant="outline">ethereum</Badge>
                      <Badge variant="outline">polygon</Badge>
                      <Badge variant="outline">arbitrum</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Private Key</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                    >
                      {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="p-2 bg-background rounded border">
                    <code className="text-sm font-mono text-muted-foreground">
                      {showPrivateKey 
                        ? "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"
                        : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"
                      }
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Never share your private key with anyone
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Security Features</label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Hardware Wallet</span>
                      <Badge variant="outline">Not Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Network</span>
                      <Badge variant="secondary">{walletData.network}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Last Updated</span>
                      <span className="text-muted-foreground">
                        {new Date().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className={`h-6 w-6 ${loading ? 'animate-spin' : ''} text-muted-foreground`} />
              <span className="ml-2 text-muted-foreground">
                {loading ? 'Loading wallet data...' : 'Click refresh to load wallet data'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
