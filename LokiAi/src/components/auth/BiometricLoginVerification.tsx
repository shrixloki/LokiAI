import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { KeystrokeCapture } from '@/components/biometric/KeystrokeCapture';
import { VoiceCapture } from '@/components/biometric/VoiceCapture';

interface BiometricLoginVerificationProps {
  open: boolean;
  walletAddress: string;
  onSuccess: () => void;
  onFailure: () => void;
}

type VerificationStep = 'intro' | 'keystroke' | 'voice' | 'success' | 'failed';

export function BiometricLoginVerification({ 
  open, 
  walletAddress, 
  onSuccess, 
  onFailure 
}: BiometricLoginVerificationProps) {
  const [step, setStep] = useState<VerificationStep>('intro');
  const [keystrokeVerified, setKeystrokeVerified] = useState(false);
  const [voiceVerified, setVoiceVerified] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  const handleKeystrokeComplete = (success: boolean, score?: number) => {
    if (success) {
      console.log('✅ Keystroke verification passed:', score);
      setKeystrokeVerified(true);
      setStep('voice');
    } else {
      console.log('❌ Keystroke verification failed');
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setStep('failed');
      }
    }
  };

  const handleVoiceComplete = (success: boolean, score?: number) => {
    if (success) {
      console.log('✅ Voice verification passed:', score);
      setVoiceVerified(true);
      setStep('success');
      
      // Delay before calling onSuccess to show success message
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } else {
      console.log('❌ Voice verification failed');
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setStep('failed');
      } else {
        // Allow retry
        setStep('voice');
      }
    }
  };

  const handleStartVerification = () => {
    setStep('keystroke');
  };

  const handleFailureAcknowledge = () => {
    onFailure();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl bg-scale-gray-900 border-scale-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-foreground">
            <Shield className="h-6 w-6 text-primary" />
            <span>Biometric Authentication Required</span>
          </DialogTitle>
          <DialogDescription className="text-scale-gray-400">
            Verify your identity to access LokiAI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 'intro' && (
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-scale-gray-300">
                  For security, you must verify your identity using both keystroke dynamics and voice authentication.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="p-4 bg-scale-gray-800 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Step 1: Keystroke Verification</h4>
                  <p className="text-sm text-scale-gray-400">
                    Type your password naturally. We'll verify your typing pattern.
                  </p>
                </div>

                <div className="p-4 bg-scale-gray-800 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Step 2: Voice Verification</h4>
                  <p className="text-sm text-scale-gray-400">
                    Say your passphrase. We'll verify your voice characteristics.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-400 text-sm">
                  ⚠️ You have {MAX_ATTEMPTS} attempts. After {MAX_ATTEMPTS} failed attempts, you'll need to reconnect your wallet.
                </p>
              </div>

              <Button onClick={handleStartVerification} className="w-full">
                Begin Verification
              </Button>
            </div>
          )}

          {step === 'keystroke' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-scale-gray-400">Step 1 of 2</span>
                <span className="text-sm text-scale-gray-400">
                  Attempts: {attempts}/{MAX_ATTEMPTS}
                </span>
              </div>
              
              <KeystrokeCapture
                mode="verify"
                walletAddress={walletAddress}
                onComplete={handleKeystrokeComplete}
              />
            </div>
          )}

          {step === 'voice' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-scale-gray-400">Step 2 of 2</span>
                <span className="text-sm text-scale-gray-400">
                  Attempts: {attempts}/{MAX_ATTEMPTS}
                </span>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-400">
                  Keystroke verification passed! Now verify your voice.
                </AlertDescription>
              </Alert>
              
              <VoiceCapture
                mode="verify"
                walletAddress={walletAddress}
                onComplete={handleVoiceComplete}
                passphrase="Loki unlocks my chain"
              />
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4 text-center py-6">
              <div className="flex justify-center">
                <div className="p-4 bg-green-500/20 rounded-full">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Authentication Successful!</h3>
                <p className="text-scale-gray-400">
                  Your identity has been verified. Granting access to LokiAI...
                </p>
              </div>

              <div className="flex items-center justify-center space-x-2 text-scale-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading dashboard...</span>
              </div>
            </div>
          )}

          {step === 'failed' && (
            <div className="space-y-4 text-center py-6">
              <div className="flex justify-center">
                <div className="p-4 bg-red-500/20 rounded-full">
                  <AlertTriangle className="h-16 w-16 text-red-500" />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Authentication Failed</h3>
                <p className="text-scale-gray-400 mb-4">
                  Maximum verification attempts exceeded. For security reasons, you must reconnect your wallet.
                </p>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  If you're having trouble with biometric authentication, you can retrain your models from the Security settings.
                </AlertDescription>
              </Alert>

              <Button onClick={handleFailureAcknowledge} variant="destructive" className="w-full">
                Disconnect Wallet
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
