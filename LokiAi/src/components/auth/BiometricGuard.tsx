import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMetaMask } from '@/hooks/useMetaMask';
import { BiometricSetupModal } from '@/components/biometric/BiometricSetupModal';
import { Loader2 } from 'lucide-react';

interface BiometricGuardProps {
  children: React.ReactNode;
}

interface BiometricStatus {
  hasKeystroke: boolean;
  hasVoice: boolean;
  setupComplete: boolean;
}

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000' 
  : `http://${window.location.hostname}:5000`;

export function BiometricGuard({ children }: BiometricGuardProps) {
  const { account, isConnected } = useMetaMask();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);

  useEffect(() => {
    const checkBiometricStatus = async () => {
      if (!isConnected || !account) {
        setIsChecking(false);
        return;
      }

      try {
        console.log('🔍 Checking biometric status for:', account);
        
        const response = await fetch(
          `${BACKEND_URL}/api/biometrics/status?walletAddress=${account}`
        );

        if (!response.ok) {
          throw new Error('Failed to check biometric status');
        }

        const status: BiometricStatus = await response.json();
        console.log('✅ Biometric status:', status);
        
        setBiometricStatus(status);

        // If setup is not complete, show modal or redirect to security
        if (!status.setupComplete) {
          console.log('⚠️ Biometric setup incomplete - redirecting to setup');
          
          // Check if we're already on the security page
          if (window.location.pathname !== '/security') {
            // Show modal for mandatory setup
            setShowSetupModal(true);
          }
        }
      } catch (error) {
        console.error('❌ Failed to check biometric status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkBiometricStatus();
  }, [account, isConnected]);

  const handleSetupComplete = () => {
    setShowSetupModal(false);
    setBiometricStatus({
      hasKeystroke: true,
      hasVoice: true,
      setupComplete: true
    });
    console.log('✅ Biometric setup completed');
  };

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-scale-gray-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-scale-gray-400">Checking biometric authentication...</p>
        </div>
      </div>
    );
  }

  // Show setup modal if biometric setup is incomplete
  if (showSetupModal && account) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen bg-scale-gray-950">
          <div className="text-center max-w-md p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              🔐 Biometric Setup Required
            </h2>
            <p className="text-scale-gray-400 mb-6">
              To ensure maximum security, you must complete biometric authentication setup before accessing LokiAI.
            </p>
            <p className="text-sm text-scale-gray-500">
              This includes keystroke dynamics and voice authentication.
            </p>
          </div>
        </div>
        <BiometricSetupModal
          open={showSetupModal}
          onClose={() => {}} // Prevent closing - mandatory setup
          walletAddress={account}
          onComplete={handleSetupComplete}
        />
      </>
    );
  }

  // If setup is complete or not connected, render children
  return <>{children}</>;
}
