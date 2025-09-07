import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap, Shield, Globe, Wallet } from 'lucide-react';
import { useMetaMask } from '@/hooks/useMetaMask';
import { WalletConnectionModal } from '@/components/auth/wallet-connection-modal';
import { StatsSection } from '@/components/sections/stats-section';
import { SecuritySection } from '@/components/sections/security-section';
import { CtaSection } from '@/components/sections/cta-section';
import { FooterSection } from '@/components/sections/footer-section';
import { Navigation } from '@/components/ui/navigation';
import { HeroSection } from '@/components/sections/hero-section';
import { FeaturesSection } from '@/components/sections/features-section';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { isConnected, account } = useMetaMask();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const navigate = useNavigate();

  // Redirect to dashboard if already connected
  useEffect(() => {
    if (isConnected) {
      navigate('/dashboard');
    }
  }, [isConnected, navigate]);

  const handleConnectWallet = async () => {
    setIsWalletModalOpen(true);
  };

  const handleExploreDashboard = () => {
    if (isConnected) {
      navigate('/dashboard');
    } else {
      // Allow access to dashboard even without wallet, but show connection prompt
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        onConnectWallet={handleConnectWallet}
        isWalletConnected={isConnected}
        userAddress={account}
      />
      
      <main>
        <HeroSection 
          onConnectWallet={handleConnectWallet}
          onExploreDashboard={handleExploreDashboard}
        />
        <StatsSection />
        <FeaturesSection />
        <SecuritySection />
        <CtaSection onConnectWallet={handleConnectWallet} />
      </main>
      
      <FooterSection />
      
      <WalletConnectionModal 
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </div>
  );
};

export default Index;
