import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, ArrowRight, Fingerprint } from 'lucide-react';
import { KeystrokeCapture } from './KeystrokeCapture';
import { VoiceCapture } from './VoiceCapture';
import { useToast } from '@/hooks/use-toast';

interface BiometricSetupModalProps {
  open: boolean;
  onClose: () => void;
  walletAddress: string;
  onComplete: () => void;
}

type SetupStep = 'intro' | 'keystroke' | 'voice' | 'complete';

export function BiometricSetupModal({ open, onClose, walletAddress, onComplete }: BiometricSetupModalProps) {
  const [step, setStep] = useState<SetupStep>('intro');
  const [keystrokeComplete, setKeystrokeComplete] = useState(false);
  const [voiceComplete, setVoiceComplete] = useState(false);
  const { toast } = useToast();

  const handleKeystrokeComplete = async (success: boolean) => {
    if (success) {
      setKeystrokeComplete(true);
      toast({
        title: "Keystroke Training Complete",
        description: "Your typing pattern has been recorded successfully."
      });
      setStep('voice');
    } else {
      toast({
        title: "Training Failed",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleVoiceComplete = async (success: boolean) => {
    if (success) {
      setVoiceComplete(true);
      
      // Update user settings to enable biometric auth
      try {
        await fetch(`http://127.0.0.1:5000/api/user/settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            biometricAuth: true
          })
        });
      } catch (err) {
        console.error('Failed to update settings:', err);
      }

      toast({
        title: "Voice Training Complete",
        description: "Your voice pattern has been recorded successfully."
      });
      setStep('complete');
    } else {
      toast({
        title: "Training Failed",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFinish = () => {
    onComplete();
    onClose();
    setStep('intro');
    setKeystrokeComplete(false);
    setVoiceComplete(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-scale-gray-900 border-scale-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-foreground">
            <Fingerprint className="h-6 w-6" />
            <span>Biometric Authentication Setup</span>
          </DialogTitle>
          <DialogDescription className="text-scale-gray-400">
            Secure your account with keystroke dynamics and voice authentication
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 'intro' && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription className="text-scale-gray-300">
                  You'll be setting up two layers of biometric security:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Keystroke Dynamics: Your unique typing pattern</li>
                    <li>Voice Authentication: Your voice characteristics</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="p-4 bg-scale-gray-800 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Step 1: Keystroke Training</h4>
                  <p className="text-sm text-scale-gray-400">
                    Type your password 5 times. We'll analyze your typing rhythm, speed, and patterns.
                  </p>
                </div>

                <div className="p-4 bg-scale-gray-800 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Step 2: Voice Training</h4>
                  <p className="text-sm text-scale-gray-400">
                    Record your voice 3 times saying a passphrase. We'll extract MFCC features.
                  </p>
                </div>
              </div>

              <Button onClick={() => setStep('keystroke')} className="w-full">
                Begin Setup <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 'keystroke' && (
            <KeystrokeCapture
              mode="train"
              walletAddress={walletAddress}
              onComplete={handleKeystrokeComplete}
              requiredSamples={5}
            />
          )}

          {step === 'voice' && (
            <VoiceCapture
              mode="train"
              walletAddress={walletAddress}
              onComplete={handleVoiceComplete}
              requiredSamples={3}
            />
          )}

          {step === 'complete' && (
            <div className="space-y-4 text-center py-6">
              <div className="flex justify-center">
                <div className="p-4 bg-green-500/20 rounded-full">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Setup Complete!</h3>
                <p className="text-scale-gray-400">
                  Your biometric authentication is now active. You'll be prompted to verify your identity on login.
                </p>
              </div>

              <Alert>
                <AlertDescription className="text-scale-gray-300">
                  <strong>Security Tips:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Type naturally - don't try to match your training pattern exactly</li>
                    <li>Speak clearly in a quiet environment</li>
                    <li>You can retrain your biometrics anytime from settings</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button onClick={handleFinish} className="w-full">
                Finish
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
