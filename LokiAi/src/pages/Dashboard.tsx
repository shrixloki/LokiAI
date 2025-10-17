import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Bot, 
  Activity, 
  ArrowUpDown,
  Play,
  Pause,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchDashboardSummary, DashboardSummary } from '@/services/dashboard-service';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Get wallet address from MetaMask
  useEffect(() => {
    const getWalletAddress = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (error) {
          console.error('Failed to get wallet address:', error);
        }
      }
    };
    getWalletAddress();
  }, []);

  // Fetch dashboard data when wallet is connected
  useEffect(() => {
    if (walletAddress) {
      loadDashboardData();
    }
  }, [walletAddress]);

  const loadDashboardData = async () => {
    if (!walletAddress) return;

    setLoading(true);
    try {
      console.log('📊 Fetching dashboard data for:', walletAddress);
      const data = await fetchDashboardSummary(walletAddress);
      setDashboardData(data);
      console.log('✅ Dashboard data loaded:', data);
    } catch (error) {
      console.error('❌ Failed to load dashboard:', error);
      toast({
        title: 'Failed to load dashboard',
        description: 'Could not fetch real-time data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading || !dashboardData) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Loading real-time data...">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-scale-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

  // Safely handle assets array with default empty array
  const topAssets = (dashboardData.assets || []).slice(0, 4);

  return (
    <DashboardLayout title="Dashboard" subtitle="Cross-Chain AI Agent Network Overview">
      <div className="space-y-8">
        {/* Portfolio Overview Cards - REAL DATA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border-scale-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-scale-gray-400">
                Total Portfolio Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-scale-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${dashboardData.portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-scale-gray-500">
                  Live from Sepolia testnet
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadDashboardData}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-scale-gray-400">
                Active AI Agents
              </CardTitle>
              <Bot className="h-4 w-4 text-scale-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {dashboardData.activeAgents}/{dashboardData.totalAgents}
              </div>
              <p className="text-xs text-scale-gray-500">
                From MongoDB agents collection
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-scale-gray-400">
                Total P&L (30d)
              </CardTitle>
              <TrendingUp className={`h-4 w-4 ${dashboardData.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${dashboardData.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {dashboardData.totalPnL >= 0 ? '+' : ''}${dashboardData.totalPnL.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-scale-gray-500">
                Real agent performance data
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-scale-gray-400">
                Cross-Chain Activity
              </CardTitle>
              <Activity className="h-4 w-4 text-scale-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {dashboardData.crossChainActivity}
              </div>
              <p className="text-xs text-scale-gray-500">
                Last 30 days from MongoDB
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Assets - REAL BLOCKCHAIN DATA */}
          <Card className="bg-card border-scale-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground">Top Assets</CardTitle>
              <CardDescription className="text-scale-gray-400">
                Live balances from Sepolia testnet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topAssets.length > 0 ? (
                topAssets.map((asset, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-scale-gray-900/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-scale-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-sm">
                          {asset.symbol === 'ETH' ? '⟠' : 
                           asset.symbol === 'USDC' ? '💵' : 
                           asset.symbol === 'WBTC' ? '₿' : 
                           asset.symbol === 'MATIC' ? '⬢' : '🪙'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{asset.symbol}</p>
                        <p className="text-xs text-scale-gray-500">{asset.balance.toFixed(4)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        ${asset.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </p>
                      <p className={`text-xs ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-scale-gray-500">
                  <p>No assets found</p>
                  <p className="text-xs mt-2">Add tokens to your wallet to see them here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Agents Status - REAL MONGODB DATA */}
          <Card className="bg-card border-scale-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground">AI Agents Status</CardTitle>
              <CardDescription className="text-scale-gray-400">
                {dashboardData.totalAgents > 0 
                  ? 'Real-time performance from MongoDB' 
                  : 'No agents deployed yet'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.totalAgents > 0 ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <p className="text-scale-gray-400">
                      {dashboardData.activeAgents} active agents running
                    </p>
                    <p className="text-xs text-scale-gray-500 mt-2">
                      Visit AI Agents page to manage your agents
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-scale-gray-500">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No AI agents deployed</p>
                  <p className="text-xs mt-2">Deploy your first agent to start trading</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity - REAL MONGODB DATA */}
        <Card className="bg-card border-scale-gray-800">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Cross-Chain Activity</CardTitle>
            <CardDescription className="text-scale-gray-400">
              {dashboardData.crossChainActivity > 0 
                ? 'Latest transactions from MongoDB' 
                : 'No recent activity'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.crossChainActivity > 0 ? (
              <div className="text-center py-8 text-scale-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{dashboardData.crossChainActivity} transactions in last 30 days</p>
                <p className="text-xs mt-2">Visit Activity page for detailed transaction history</p>
              </div>
            ) : (
              <div className="text-center py-8 text-scale-gray-500">
                <ArrowUpDown className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent transactions</p>
                <p className="text-xs mt-2">Your cross-chain activity will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}