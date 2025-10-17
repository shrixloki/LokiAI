import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { KeystrokeCapture } from '@/components/biometric/KeystrokeCapture';
import { VoiceCapture } from '@/components/biometric/VoiceCapture';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useToast } from '@/hooks/use-toast';
import { Keyboard, Mic, CheckCircle2, AlertCircle, RotateCcw, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000' 
  : `http://${window.location.hostname}:5000`;

export default function Security() {
  const { account, isConnected } = useMetaMask();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'keystroke' | 'voice'>('keystroke');
  const [keystrokeComplete, setKeystrokeComplete] = useState(false);
  const [voiceComplete, setVoiceComplete] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState<'keystroke' | 'voice' | null>(null);

  // Check if this is a new user requiring setup
  useEffect(() => {
    const checkStatus = async () => {
      if (!account) return;

      try {
        const response = await fetch(
          `${BACKEND_URL}/api/biometrics/status?walletAddress=${account}`
        );

        if (response.ok) {
          const status = await response.json();
          setKeystrokeComplete(status.hasKeystroke);
          setVoiceComplete(status.hasVoice);
          
          // Check if redirected as new user
          const state = location.state as any;
          if (state?.isNewUser || state?.requireSetup) {
            setIsNewUser(true);
          }
        }
      } catch (error) {
        console.error('Failed to check biometric status:', error);
      }
    };

    checkStatus();
  }, [account, location]);

  // Show warning if wallet not connected
  if (!isConnected || !account) {
    return (
      <DashboardLayout 
        title="Ghost Key Authentication" 
        subtitle="Biometric security using keystroke dynamics and voice recognition"
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 text-center">
            <p className="text-yellow-400 text-lg mb-2">⚠️ Wallet Not Connected</p>
            <p className="text-scale-gray-400">Please connect your MetaMask wallet to use biometric authentication.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleKeystrokeComplete = (success: boolean, score?: number) => {
    if (success) {
      setKeystrokeComplete(true);
      toast({
        title: "✅ Keystroke Training Complete!",
        description: score 
          ? `Verification passed with ${(score * 100).toFixed(1)}% confidence`
          : "Your typing pattern has been securely stored. Now complete voice authentication."
      });
      
      // Auto-switch to voice tab after keystroke completion
      if (!voiceComplete) {
        setTimeout(() => {
          setActiveTab('voice');
        }, 2000);
      }
    } else {
      toast({
        title: "Failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleVoiceComplete = (success: boolean, score?: number) => {
    if (success) {
      setVoiceComplete(true);
      toast({
        title: "✅ Voice Training Complete!",
        description: score 
          ? `Voice verified with ${(score * 100).toFixed(1)}% similarity`
          : "Your voice profile has been securely stored. Setup complete!"
      });
      
      // If both are complete and this was a new user setup, redirect to dashboard
      if (keystrokeComplete && isNewUser) {
        setTimeout(() => {
          toast({
            title: "🎉 Biometric Setup Complete!",
            description: "You can now access LokiAI. Your account is secured with GhostKey."
          });
          navigate('/dashboard');
        }, 2000);
      }
    } else {
      toast({
        title: "Failed",
        description: "Voice pattern doesn't match. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleResetBiometric = async (type: 'keystroke' | 'voice') => {
    if (!account) return;
    
    setIsResetting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/biometrics/reset`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: account,
          type: type
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        if (type === 'keystroke') {
          setKeystrokeComplete(false);
        } else {
          setVoiceComplete(false);
        }

        toast({
          title: "✅ Reset Successful",
          description: `Your ${type === 'keystroke' ? 'keystroke dynamics' : 'voice authentication'} data has been deleted. You can now retrain.`
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Reset failed:', error);
      toast({
        title: "❌ Reset Failed",
        description: error instanceof Error ? error.message : "Failed to reset biometric data",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
      setShowResetDialog(null);
    }
  };



  return (
    <DashboardLayout 
      title="Ghost Key Authentication" 
      subtitle="Biometric security using keystroke dynamics and voice recognition"
    >
      <div className="max-w-6xl mx-auto">
        {/* New User Setup Banner */}
        {isNewUser && (!keystrokeComplete || !voiceComplete) && (
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-4">
              <AlertCircle className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  🔐 Mandatory Biometric Setup Required
                </h3>
                <p className="text-scale-gray-300 mb-4">
                  To ensure maximum security, you must complete both keystroke and voice authentication 
                  before accessing LokiAI. This is a one-time setup that protects your account with 
                  military-grade biometric security.
                </p>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    {keystrokeComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-scale-gray-600" />
                    )}
                    <span className={keystrokeComplete ? 'text-green-400' : 'text-scale-gray-400'}>
                      Keystroke Dynamics
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {voiceComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-scale-gray-600" />
                    )}
                    <span className={voiceComplete ? 'text-green-400' : 'text-scale-gray-400'}>
                      Voice Authentication
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'keystroke' | 'voice')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="keystroke" className="flex items-center space-x-2">
              <Keyboard className="h-4 w-4" />
              <span>Keystroke Dynamics</span>
              {keystrokeComplete && <CheckCircle2 className="h-4 w-4 text-green-400 ml-2" />}
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center space-x-2">
              <Mic className="h-4 w-4" />
              <span>Voice Authentication</span>
              {voiceComplete && <CheckCircle2 className="h-4 w-4 text-green-400 ml-2" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keystroke" className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Keyboard className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="text-blue-400 font-medium mb-1">How Keystroke Dynamics Works</h3>
                    <p className="text-scale-gray-400 text-sm">
                      Your typing pattern is as unique as your fingerprint. We analyze 32+ features including timing, 
                      rhythm, and pressure to create your biometric profile.
                    </p>
                  </div>
                </div>
                {keystrokeComplete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResetDialog('keystroke')}
                    className="flex items-center space-x-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <KeystrokeCapture
                mode="train"
                walletAddress={account}
                onComplete={handleKeystrokeComplete}
                requiredSamples={5}
              />
              <KeystrokeCapture
                mode="verify"
                walletAddress={account}
                onComplete={handleKeystrokeComplete}
              />
            </div>
          </TabsContent>

          <TabsContent value="voice" className="space-y-6">
            {/* Info Banner */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Mic className="h-5 w-5 text-purple-400 mt-0.5" />
                  <div>
                    <h3 className="text-purple-400 font-medium mb-1">How Voice Authentication Works</h3>
                    <p className="text-scale-gray-400 text-sm mb-2">
                      Your voice has unique characteristics. We extract MFCC features, analyze pitch, tempo, 
                      and spectral patterns to verify your identity.
                    </p>
                    <p className="text-yellow-400 text-xs">
                      ⚠️ Note: For best results, say the same phrase during verification: "Loki unlocks my chain"
                    </p>
                  </div>
                </div>
                {voiceComplete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResetDialog('voice')}
                    className="flex items-center space-x-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VoiceCapture
                mode="train"
                walletAddress={account}
                onComplete={handleVoiceComplete}
                requiredSamples={3}
                passphrase="Loki unlocks my chain"
              />
              <VoiceCapture
                mode="verify"
                walletAddress={account}
                onComplete={handleVoiceComplete}
                passphrase="Loki unlocks my chain"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Reset Confirmation Dialog */}
        <AlertDialog open={!!showResetDialog} onOpenChange={() => setShowResetDialog(null)}>
          <AlertDialogContent className="bg-scale-gray-900 border-scale-gray-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                Reset {showResetDialog === 'keystroke' ? 'Keystroke Dynamics' : 'Voice Authentication'}?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-scale-gray-400">
                This will permanently delete your {showResetDialog === 'keystroke' ? 'keystroke pattern' : 'voice profile'} from 
                our secure database. You will need to retrain the model to use this authentication method again.
                <br /><br />
                <span className="text-yellow-400">⚠️ This action cannot be undone.</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isResetting} className="bg-scale-gray-800 border-scale-gray-700">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showResetDialog && handleResetBiometric(showResetDialog)}
                disabled={isResetting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Biometric Data
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}