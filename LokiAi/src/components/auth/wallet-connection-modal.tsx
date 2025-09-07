import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle } from 'lucide-react';
import { useMetaMask } from '@/hooks/useMetaMask';

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletConnectionModal({ isOpen, onClose }: WalletConnectionModalProps) {
  const { connect, isConnecting, isInstalled, error, isConnected } = useMetaMask();
  const [isAttemptingConnection, setIsAttemptingConnection] = useState(false);

  const handleMetaMaskConnect = async () => {
    if (!isInstalled) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsAttemptingConnection(true);
    try {
      await connect();
      if (isConnected) {
        onClose();
      }
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsAttemptingConnection(false);
    }
  };

  const handleOtherWallet = (walletType: string) => {
    alert(`${walletType} integration coming soon! For now, please use MetaMask.`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-scale-gray-800">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-semibold text-foreground">
            Connect Wallet
          </DialogTitle>
          <DialogDescription className="text-scale-gray-400">
            Choose your preferred wallet to connect to Cross-Chain AI Agent Network
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-3 mt-6">
          {/* MetaMask - Primary Option */}
          <Button
            variant="outline"
            className="w-full h-16 border-scale-gray-700 hover:border-scale-gray-600 hover:bg-scale-gray-900/50 flex items-center justify-between p-4 group transition-all duration-200"
            onClick={handleMetaMaskConnect}
            disabled={isConnecting || isAttemptingConnection}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🦊</span>
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-foreground">MetaMask</span>
                  <Badge variant="secondary" className="text-xs">
                    {isInstalled ? 'Installed' : 'Install Required'}
                  </Badge>
                </div>
                <p className="text-sm text-scale-gray-400">
                  {isInstalled ? 'Connect with MetaMask wallet' : 'Click to install MetaMask'}
                </p>
              </div>
            </div>

            {(isConnecting || isAttemptingConnection) ? (
              <Loader2 className="h-5 w-5 animate-spin text-scale-gray-400" />
            ) : (
              <div className="w-5 h-5 border border-scale-gray-600 rounded-full group-hover:border-scale-gray-400 transition-colors" />
            )}
          </Button>

          {/* Other Wallets - Coming Soon */}
          <Button
            variant="outline"
            className="w-full h-16 border-scale-gray-700 hover:border-scale-gray-600 hover:bg-scale-gray-900/50 flex items-center justify-between p-4 group transition-all duration-200 opacity-60"
            onClick={() => handleOtherWallet('Phantom')}
            disabled={true}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">👻</span>
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-foreground">Phantom</span>
                  <Badge variant="secondary" className="text-xs">
                    Coming Soon
                  </Badge>
                </div>
                <p className="text-sm text-scale-gray-400">Solana wallet support</p>
              </div>
            </div>
            <div className="w-5 h-5 border border-scale-gray-600 rounded-full" />
          </Button>

          <Button
            variant="outline"
            className="w-full h-16 border-scale-gray-700 hover:border-scale-gray-600 hover:bg-scale-gray-900/50 flex items-center justify-between p-4 group transition-all duration-200 opacity-60"
            onClick={() => handleOtherWallet('WalletConnect')}
            disabled={true}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🔗</span>
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-foreground">WalletConnect</span>
                  <Badge variant="secondary" className="text-xs">
                    Coming Soon
                  </Badge>
                </div>
                <p className="text-sm text-scale-gray-400">Connect with 300+ wallets</p>
              </div>
            </div>
            <div className="w-5 h-5 border border-scale-gray-600 rounded-full" />
          </Button>
        </div>

        <div className="mt-6 p-4 bg-scale-gray-900/50 rounded-lg border border-scale-gray-800">
          <p className="text-sm text-scale-gray-400 text-center">
            By connecting a wallet, you agree to our{' '}
            <a href="#" className="text-foreground underline hover:text-scale-gray-200">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-foreground underline hover:text-scale-gray-200">
              Privacy Policy
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}