import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Keyboard, AlertTriangle } from 'lucide-react';

interface KeystrokeEvent {
    key: string;
    type: 'keydown' | 'keyup';
    timestamp: number;
}

interface KeystrokeCaptureProps {
    mode: 'train' | 'verify';
    walletAddress: string;
    onComplete: (success: boolean, score?: number) => void;
    requiredSamples?: number;
}

export function KeystrokeCapture({ mode, walletAddress, onComplete, requiredSamples = 5 }: KeystrokeCaptureProps) {
    const [password, setPassword] = useState('');
    const [currentAttempt, setCurrentAttempt] = useState(0);
    const [keystrokeData, setKeystrokeData] = useState<KeystrokeEvent[]>([]);
    const [allSamples, setAllSamples] = useState<number[][]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const extractFeatures = useCallback((data: KeystrokeEvent[]): number[] => {
        const keydowns = data.filter(k => k.type === 'keydown');
        const keyups = data.filter(k => k.type === 'keyup');

        const holdTimes: number[] = [];
        const ddTimes: number[] = [];
        const udTimes: number[] = [];

        keydowns.forEach((down) => {
            const up = keyups.find(u => u.key === down.key && u.timestamp > down.timestamp);
            if (up) holdTimes.push(up.timestamp - down.timestamp);
        });

        for (let i = 0; i < keydowns.length - 1; i++) {
            ddTimes.push(keydowns[i + 1].timestamp - keydowns[i].timestamp);
        }

        for (let i = 0; i < keydowns.length - 1; i++) {
            const currentUp = keyups.find(u => u.key === keydowns[i].key && u.timestamp > keydowns[i].timestamp);
            if (currentUp) {
                udTimes.push(keydowns[i + 1].timestamp - currentUp.timestamp);
            }
        }

        const totalTime = Math.max(...ddTimes, ...holdTimes, ...udTimes) || 0.001;
        const typingSpeed = keydowns.length / (totalTime / 1000);
        const flightTime = udTimes.length > 0 ? udTimes.reduce((a, b) => a + b, 0) / udTimes.length : 0;
        const errorRate = data.filter(k => k.key === 'Backspace').length;

        const meanHoldTime = holdTimes.length > 0 ? holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length : 0;
        const pressPressure = holdTimes.length > 0
            ? Math.sqrt(holdTimes.reduce((sum, t) => sum + Math.pow(t - meanHoldTime, 2), 0) / holdTimes.length)
            : 0;

        return [...holdTimes, ...ddTimes, ...udTimes, typingSpeed, flightTime, errorRate, pressPressure];
    }, []);

    const handleKeyEvent = useCallback((e: React.KeyboardEvent, type: 'keydown' | 'keyup') => {
        if (e.key === 'Enter') return;

        const event: KeystrokeEvent = {
            key: e.key,
            type,
            timestamp: performance.now()
        };

        setKeystrokeData(prev => [...prev, event]);
    }, []);

    const handleSubmit = useCallback(async () => {
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        const features = extractFeatures(keystrokeData);

        if (features.length < 10) {
            setError('Insufficient keystroke data captured. Please try again.');
            setKeystrokeData([]);
            setPassword('');
            return;
        }

        if (mode === 'train') {
            const newSamples = [...allSamples, features];
            setAllSamples(newSamples);
            const newAttemptCount = currentAttempt + 1;
            setCurrentAttempt(newAttemptCount);
            setKeystrokeData([]);
            setPassword('');
            setError(null);

            // Trigger training DURING the 5th attempt (when we reach requiredSamples)
            if (newAttemptCount === requiredSamples) {
                console.log('🚀 Triggering Ghost Key training on attempt', newAttemptCount);
                console.log('📊 Training data:', {
                    walletAddress,
                    samplesCount: newSamples.length,
                    sampleLengths: newSamples.map(s => s.length)
                });
                setIsProcessing(true);
                
                // Small delay to ensure UI updates and buffer completes
                setTimeout(async () => {
                    try {
                        const payload = {
                            walletAddress,
                            keystrokeSamples: newSamples
                        };
                        console.log('📤 Sending payload:', payload);
                        
                        const response = await fetch('http://localhost:5000/api/biometrics/keystroke/train', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });

                        const result = await response.json();
                        console.log('✅ Training result:', result);
                        onComplete(result.success);
                    } catch (err) {
                        console.error('❌ Training failed:', err);
                        setError('Failed to train model');
                        onComplete(false);
                    } finally {
                        setIsProcessing(false);
                    }
                }, 200);
            }
        } else {
            setIsProcessing(true);
            try {
                const response = await fetch('http://localhost:5000/api/biometrics/keystroke/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        walletAddress,
                        keystrokeData: features
                    })
                });

                const result = await response.json();
                onComplete(result.success, result.score);
            } catch (err) {
                setError('Verification failed');
                onComplete(false);
            } finally {
                setIsProcessing(false);
            }
        }
    }, [password, keystrokeData, mode, walletAddress, allSamples, requiredSamples, extractFeatures, onComplete]);

    useEffect(() => {
        inputRef.current?.focus();
    }, [currentAttempt]);

    const progress = mode === 'train' ? (currentAttempt / requiredSamples) * 100 : 0;

    return (
        <Card className="bg-card border-scale-gray-800">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Keyboard className="h-5 w-5" />
                    <span>Keystroke Dynamics {mode === 'train' ? 'Training' : 'Verification'}</span>
                </CardTitle>
                <CardDescription>
                    {mode === 'train'
                        ? `Type your password ${requiredSamples} times to train the model`
                        : 'Type your password to verify your identity'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {mode === 'train' && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-scale-gray-400">Progress</span>
                            <span className="text-foreground font-medium">
                                Attempt {currentAttempt}/{requiredSamples}
                            </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                        ref={inputRef}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => handleKeyEvent(e, 'keydown')}
                        onKeyUp={(e) => handleKeyEvent(e, 'keyup')}
                        placeholder="Type your password..."
                        className="bg-scale-gray-900 border-scale-gray-700"
                        disabled={isProcessing}
                    />
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {mode === 'train' && currentAttempt >= requiredSamples && (
                    <Alert>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-green-400">
                            Training complete! Model is being processed...
                        </AlertDescription>
                    </Alert>
                )}

                <Button
                    onClick={handleSubmit}
                    disabled={isProcessing || password.length < 8}
                    className="w-full"
                >
                    {isProcessing ? 'Processing...' : mode === 'train' ? 'Submit Sample' : 'Verify'}
                </Button>
            </CardContent>
        </Card>
    );
}
