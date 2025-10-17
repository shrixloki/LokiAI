import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap, Shield, Globe, Wallet } from 'lucide-react';
import { useMetaMask } from '@/hooks/useMetaMask';
import { WalletConnectionModal } from '@/components/auth/wallet-connection-modal';
import { BiometricLoginVerification } from '@/components/auth/BiometricLoginVerification';
import { StatsSection } from '@/components/sections/stats-section';
import { SecuritySection } from '@/components/sections/security-section';
import { CtaSection } from '@/components/sections/cta-section';
import { FooterSection } from '@/components/sections/footer-section';
import { Navigation } from '@/components/ui/navigation';
import { HeroSection } from '@/components/sections/hero-section';
import { FeaturesSection } from '@/components/sections/features-section';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000' 
  : `http://${window.location.hostname}:5000`;

const Index = () => {
  const { isConnected, account, disconnect } = useMetaMask();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [showBiometricVerification, setShowBiometricVerification] = useState(false);
  const [biometricSetupComplete, setBiometricSetupComplete] = useState(false);
  const navigate = useNavigate();

  // Biometric verification disabled - allow direct access
  useEffect(() => {
    if (isConnected && account) {
      console.log('✅ Wallet connected - direct access allowed');
    }
  }, [isConnected, account]);

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

  const handleBiometricSuccess = () => {
    console.log('✅ Biometric verification successful - granting access');
    setShowBiometricVerification(false);
    navigate('/dashboard');
  };

  const handleBiometricFailure = () => {
    console.log('❌ Biometric verification failed - disconnecting wallet');
    setShowBiometricVerification(false);
    disconnect();
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

      {/* Biometric verification modal removed */}
    </div>
  );
};

export default Index;
