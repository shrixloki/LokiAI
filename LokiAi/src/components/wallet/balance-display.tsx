import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, AlertTriangle, CheckCircle, Network } from 'lucide-react';

interface BalanceDisplayProps {
  ethBalance: string;
  usdBalance: number;
  ethPrice: number;
  isLoading: boolean;
  error: string | null;
  networkInfo: {
    name: string;
    isTestnet: boolean;
  } | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
  formatEthBalance: (decimals?: number) => string;
  formatUsdBalance: (decimals?: number) => string;
}

export function BalanceDisplay({
  ethBalance,
  usdBalance,
  ethPrice,
  isLoading,
  error,
  networkInfo,
  lastUpdated,
  onRefresh,
  formatEthBalance,
  formatUsdBalance,
}: BalanceDisplayProps) {
  const hasBalance = parseFloat(ethBalance) > 0;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Wallet Balance</CardTitle>
        <div className="flex items-center gap-2">
          {networkInfo && (
            <Badge 
              variant={networkInfo.isTestnet ? "secondary" : "default"}
              className="text-xs"
            >
              <Network className="h-3 w-3 mr-1" />
              {networkInfo.name}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to fetch balance: {error}
            </AlertDescription>
          </Alert>
        )}

        {!hasBalance && !isLoading && !error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No ETH balance detected. Make sure you're connected to the correct network.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {/* ETH Balance */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ETH Balance</span>
              {hasBalance && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>
            <div className="text-3xl font-bold font-mono">
              {formatEthBalance()} ETH
            </div>
            <div className="text-xs text-muted-foreground">
              Wei: {ethBalance === '0' ? '0' : parseFloat(ethBalance) * Math.pow(10, 18)}
            </div>
          </div>

          {/* USD Value */}
          <div>
            <span className="text-sm text-muted-foreground">USD Value</span>
            <div className="text-2xl font-semibold text-green-600">
              ${formatUsdBalance()}
            </div>
          </div>

          {/* ETH Price */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">ETH Price:</span>
            <span className="font-medium">${ethPrice.toLocaleString()}</span>
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Last Updated:</span>
              <span>{lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-blue-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Updating balance...</span>
            </div>
          )}
        </div>

        {/* Balance Precision Info */}
        {hasBalance && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="font-medium">Balance Precision:</div>
              <div>• 8 decimals: {parseFloat(ethBalance).toFixed(8)} ETH</div>
              <div>• 6 decimals: {parseFloat(ethBalance).toFixed(6)} ETH</div>
              <div>• 4 decimals: {parseFloat(ethBalance).toFixed(4)} ETH</div>
              <div>• USD (4 decimals): ${usdBalance.toFixed(4)}</div>
            </div>
          </div>
        )}

        {/* Network Info */}
        {networkInfo && (
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Network className="h-3 w-3" />
              <span>
                Connected to {networkInfo.name}
                {networkInfo.isTestnet && " (Testnet)"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
