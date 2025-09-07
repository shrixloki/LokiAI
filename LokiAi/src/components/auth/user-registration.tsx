import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { useMetaMask } from '@/hooks/useMetaMask';

interface UserRegistrationProps {
  onSuccess?: (user: any) => void;
  onCancel?: () => void;
}

interface User {
  id: number;
  name: string;
  email: string;
  wallet_address: string | null;
}

export function UserRegistration({ onSuccess, onCancel }: UserRegistrationProps) {
  const { isConnected, account, connect, signMessage } = useMetaMask();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleConnectWallet = async () => {
    try {
      setError(null);
      await connect();
    } catch (error) {
      setError('Failed to connect wallet. Please try again.');
    }
  };

  const handleVerifyWallet = async () => {
    if (!account) {
      setError('No wallet connected');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // Step 1: Get challenge from backend
      const challengeResponse = await fetch('http://127.0.0.1:25001/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account,
        }),
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get challenge from server');
      }

      const { message } = await challengeResponse.json();

      // Step 2: Sign the challenge message
      const signature = await signMessage(message);
      if (!signature) {
        throw new Error('Failed to sign message');
      }

      // Step 3: Verify signature with backend
      const verifyResponse = await fetch('http://127.0.0.1:25001/verify-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account,
          signature,
          message,
        }),
      });

      const verifyResult = await verifyResponse.json();

      if (verifyResult.valid) {
        setIsVerified(true);
        setSuccess('Wallet verified successfully!');
      } else {
        throw new Error(verifyResult.message || 'Wallet verification failed');
      }
    } catch (error) {
      console.error('Wallet verification error:', error);
      setError(error instanceof Error ? error.message : 'Wallet verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!isConnected || !account) {
      setError('Please connect your wallet first');
      return;
    }

    if (!isVerified) {
      setError('Please verify your wallet ownership first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:25001/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          walletAddress: account,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create user');
      }

      const user: User = await response.json();
      setSuccess(`User created successfully! Welcome, ${user.name}!`);
      
      // Call success callback after a short delay to show success message
      setTimeout(() => {
        onSuccess?.(user);
      }, 1500);

    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-card border-scale-gray-800">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold text-foreground">
          Create Account
        </CardTitle>
        <CardDescription className="text-scale-gray-400">
          Connect your wallet and create your account
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Wallet Connection Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">
            Step 1: Connect Wallet
          </Label>
          
          {!isConnected ? (
            <Button
              onClick={handleConnectWallet}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect MetaMask
            </Button>
          ) : (
            <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400">Wallet Connected</span>
              </div>
              <p className="text-xs text-scale-gray-400 mt-1">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </p>
            </div>
          )}
        </div>

        {/* Wallet Verification Section */}
        {isConnected && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              Step 2: Verify Wallet Ownership
            </Label>
            
            {!isVerified ? (
              <Button
                onClick={handleVerifyWallet}
                variant="outline"
                className="w-full border-scale-gray-600 text-scale-gray-300 hover:text-foreground hover:border-scale-gray-400"
                disabled={isVerifying || isLoading}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying Wallet...
                  </>
                ) : (
                  'Verify Wallet Ownership'
                )}
              </Button>
            ) : (
              <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-green-400">Wallet Verified</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Information Form */}
        {isVerified && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">
                Step 3: Complete Registration
              </Label>
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm text-scale-gray-300">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="bg-scale-gray-900 border-scale-gray-700 text-foreground placeholder:text-scale-gray-500"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-scale-gray-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  className="bg-scale-gray-900 border-scale-gray-700 text-foreground placeholder:text-scale-gray-500"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading || !isVerified}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        )}

        {/* Error/Success Messages */}
        {error && (
          <Alert className="border-red-800 bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-800 bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Cancel Button */}
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="ghost"
            className="w-full text-scale-gray-400 hover:text-foreground"
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
