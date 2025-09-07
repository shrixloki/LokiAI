import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowUpDown, 
  Send, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  Repeat,
  TrendingUp
} from 'lucide-react';
import { mockAssets, mockChains, mockTransactions } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

export default function CrossChain() {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromChain: '',
    toChain: '',
    asset: '',
    amount: '',
    recipient: ''
  });
  const { toast } = useToast();

  const activeChains = mockChains.filter(chain => chain.isActive);
  const availableAssets = mockAssets.slice(0, 5);
  const recentTransfers = mockTransactions.filter(tx => 
    tx.type === 'bridge' || tx.type === 'transfer'
  ).slice(0, 8);

  const handleTransfer = () => {
    if (!transferForm.fromChain || !transferForm.toChain || !transferForm.asset || !transferForm.amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (transferForm.fromChain === transferForm.toChain) {
      toast({
        title: "Invalid Transfer",
        description: "Source and destination chains must be different.",
        variant: "destructive"
      });
      return;
    }

    // Simulate transfer
    toast({
      title: "Transfer Initiated",
      description: `${transferForm.amount} ${transferForm.asset} transfer from ${transferForm.fromChain} to ${transferForm.toChain} has been initiated.`
    });
    
    setIsTransferModalOpen(false);
    setTransferForm({
      fromChain: '',
      toChain: '',
      asset: '',
      amount: '',
      recipient: ''
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-scale-gray-400" />;
    }
  };

  const getChainLogo = (chainId: string) => {
    const chain = mockChains.find(c => c.id === chainId);
    return chain?.logo || '🔗';
  };

  return (
    <DashboardLayout title="Cross-Chain" subtitle="Manage assets across multiple blockchain networks">
      <div className="space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <ArrowUpDown className="h-5 w-5 text-scale-gray-400" />
                <div>
                  <p className="text-sm text-scale-gray-400">Total Chains</p>
                  <p className="text-2xl font-bold text-foreground">{activeChains.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Send className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-scale-gray-400">Pending Transfers</p>
                  <p className="text-2xl font-bold text-foreground">
                    {recentTransfers.filter(tx => tx.status === 'pending').length}
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
                  <p className="text-sm text-scale-gray-400">Completed Today</p>
                  <p className="text-2xl font-bold text-foreground">
                    {recentTransfers.filter(tx => tx.status === 'confirmed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-scale-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-scale-gray-400" />
                <div>
                  <p className="text-sm text-scale-gray-400">Avg. Gas Saved</p>
                  <p className="text-2xl font-bold text-green-500">23%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Transfer */}
          <Card className="bg-card border-scale-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <span>Quick Transfer</span>
              </CardTitle>
              <CardDescription className="text-scale-gray-400">
                Instantly transfer assets across chains
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    New Transfer
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-scale-gray-800 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Cross-Chain Transfer</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-scale-gray-300">From Chain</Label>
                        <Select value={transferForm.fromChain} onValueChange={(value) => 
                          setTransferForm(prev => ({ ...prev, fromChain: value }))
                        }>
                          <SelectTrigger className="bg-scale-gray-900 border-scale-gray-700 text-foreground">
                            <SelectValue placeholder="Select chain" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-scale-gray-800">
                            {activeChains.map((chain) => (
                              <SelectItem key={chain.id} value={chain.id}>
                                <div className="flex items-center space-x-2">
                                  <span>{chain.logo}</span>
                                  <span>{chain.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-scale-gray-300">To Chain</Label>
                        <Select value={transferForm.toChain} onValueChange={(value) => 
                          setTransferForm(prev => ({ ...prev, toChain: value }))
                        }>
                          <SelectTrigger className="bg-scale-gray-900 border-scale-gray-700 text-foreground">
                            <SelectValue placeholder="Select chain" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-scale-gray-800">
                            {activeChains.map((chain) => (
                              <SelectItem key={chain.id} value={chain.id}>
                                <div className="flex items-center space-x-2">
                                  <span>{chain.logo}</span>
                                  <span>{chain.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-scale-gray-300">Asset</Label>
                      <Select value={transferForm.asset} onValueChange={(value) => 
                        setTransferForm(prev => ({ ...prev, asset: value }))
                      }>
                        <SelectTrigger className="bg-scale-gray-900 border-scale-gray-700 text-foreground">
                          <SelectValue placeholder="Select asset" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-scale-gray-800">
                          {availableAssets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.symbol}>
                              <div className="flex items-center space-x-2">
                                <span>{asset.logo}</span>
                                <span>{asset.symbol}</span>
                                <span className="text-scale-gray-400">{asset.balance.toFixed(4)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-scale-gray-300">Amount</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={transferForm.amount}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                        className="bg-scale-gray-900 border-scale-gray-700 text-foreground"
                      />
                    </div>

                    <div>
                      <Label className="text-scale-gray-300">Recipient Address (Optional)</Label>
                      <Input
                        placeholder="0x... or your address"
                        value={transferForm.recipient}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, recipient: e.target.value }))}
                        className="bg-scale-gray-900 border-scale-gray-700 text-foreground"
                      />
                    </div>

                    <Button onClick={handleTransfer} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      <Send className="h-4 w-4 mr-2" />
                      Initiate Transfer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Quick Actions */}
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start border-scale-gray-700">
                  <Repeat className="h-4 w-4 mr-2" />
                  Bridge ETH → Polygon
                </Button>
                <Button variant="outline" className="w-full justify-start border-scale-gray-700">
                  <Repeat className="h-4 w-4 mr-2" />
                  Bridge USDC → Arbitrum
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Chain Status */}
          <Card className="bg-card border-scale-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground">Chain Network Status</CardTitle>
              <CardDescription className="text-scale-gray-400">
                Real-time network conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeChains.map((chain) => (
                <div key={chain.id} className="flex items-center justify-between p-3 bg-scale-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{chain.logo}</span>
                    <div>
                      <p className="font-medium text-foreground">{chain.name}</p>
                      <p className="text-xs text-scale-gray-500">Gas: {chain.gasPrice} gwei</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    Online
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Portfolio Distribution */}
          <Card className="bg-card border-scale-gray-800">
            <CardHeader>
              <CardTitle className="text-foreground">Portfolio Distribution</CardTitle>
              <CardDescription className="text-scale-gray-400">
                Assets across different chains
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableAssets.map((asset) => (
                <div key={asset.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{asset.logo}</span>
                      <span className="text-sm font-medium text-foreground">{asset.symbol}</span>
                      <span className="text-xs text-scale-gray-500">{asset.chain}</span>
                    </div>
                    <span className="text-sm text-foreground">
                      ${asset.usdValue.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={(asset.usdValue / mockAssets.reduce((sum, a) => sum + a.usdValue, 0)) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Transfers */}
        <Card className="bg-card border-scale-gray-800">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Cross-Chain Activity</CardTitle>
            <CardDescription className="text-scale-gray-400">
              Track your latest transfers and bridges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransfers.map((transfer) => (
                <div key={transfer.id} className="flex items-center justify-between p-4 bg-scale-gray-900/50 rounded-lg hover:bg-scale-gray-900/70 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getChainLogo(transfer.fromChain)}</span>
                      <ArrowRight className="h-4 w-4 text-scale-gray-400" />
                      <span className="text-lg">{transfer.toChain ? getChainLogo(transfer.toChain) : '💰'}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {transfer.amount} {transfer.asset}
                      </p>
                      <p className="text-sm text-scale-gray-400">
                        {transfer.fromChain} → {transfer.toChain || 'wallet'}
                      </p>
                      <p className="text-xs text-scale-gray-500">
                        {new Date(transfer.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(transfer.status)}
                        <Badge 
                          variant={transfer.status === 'confirmed' ? 'default' : 
                                  transfer.status === 'pending' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {transfer.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-scale-gray-500 mt-1">
                        Fee: ${transfer.fee.toFixed(4)}
                      </p>
                    </div>
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