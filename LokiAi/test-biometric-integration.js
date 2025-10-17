// Test script for biometric authentication integration
// Run with: node test-biometric-integration.js

const TEST_WALLET = '0x8bbfa86f2766fd05220f319a4d122c97fbc4b529';
const BACKEND_URL = 'http://localhost:5000';
const GHOSTKEY_URL = 'http://127.0.0.1:25000';

console.log('🧪 Testing LokiAI Biometric Integration\n');

// Test 1: Backend Health Check
async function testBackendHealth() {
    console.log('Test 1: Backend Health Check');
    try {
        const response = await fetch(`${BACKEND_URL}/health`);
        const data = await response.json();
        console.log('✅ Backend is healthy:', data.message);
        return true;
    } catch (error) {
        console.log('❌ Backend health check failed:', error.message);
        return false;
    }
}

// Test 2: GhostKey Health Check
async function testGhostKeyHealth() {
    console.log('\nTest 2: GhostKey Health Check');
    try {
        const response = await fetch(`${GHOSTKEY_URL}/health`);
        if (response.ok) {
            console.log('✅ GhostKey is running');
            return true;
        } else {
            console.log('❌ GhostKey returned error status');
            return false;
        }
    } catch (error) {
        console.log('❌ GhostKey health check failed:', error.message);
        console.log('   Make sure GhostKey is running on port 25000');
        return false;
    }
}

// Test 3: Check Biometric Status
async function testBiometricStatus() {
    console.log('\nTest 3: Check Biometric Status');
    try {
        const response = await fetch(
            `${BACKEND_URL}/api/biometrics/status?walletAddress=${TEST_WALLET}`
        );
        const data = await response.json();
        console.log('✅ Biometric status retrieved:');
        console.log('   - Keystroke setup:', data.hasKeystroke ? '✓' : '✗');
        console.log('   - Voice setup:', data.hasVoice ? '✓' : '✗');
        console.log('   - Setup complete:', data.setupComplete ? '✓' : '✗');
        return true;
    } catch (error) {
        console.log('❌ Biometric status check failed:', error.message);
        return false;
    }
}

// Test 4: Keystroke Training (Mock Data)
async function testKeystrokeTraining() {
    console.log('\nTest 4: Keystroke Training');
    
    // Generate mock keystroke samples
    const mockSamples = [];
    for (let i = 0; i < 5; i++) {
        const sample = [];
        // Hold times (11)
        for (let j = 0; j < 11; j++) sample.push(Math.random() * 0.2 + 0.1);
        // DD times (10)
        for (let j = 0; j < 10; j++) sample.push(Math.random() * 0.3 + 0.2);
        // UD times (10)
        for (let j = 0; j < 10; j++) sample.push(Math.random() * 0.25 + 0.15);
        // Additional features (4)
        sample.push(5.2); // typing speed
        sample.push(0.18); // flight time
        sample.push(0); // error rate
        sample.push(0.15); // press pressure
        
        mockSamples.push(sample);
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/biometrics/keystroke/train`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: TEST_WALLET,
                keystrokeSamples: mockSamples
            })
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ Keystroke training successful');
            console.log('   Checksum:', data.checksum);
            return true;
        } else {
            console.log('❌ Keystroke training failed:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Keystroke training error:', error.message);
        return false;
    }
}

// Test 5: Voice Training (Mock Data)
async function testVoiceTraining() {
    console.log('\nTest 5: Voice Training');
    
    // Generate mock voice features
    const mockFeatures = [];
    for (let i = 0; i < 3; i++) {
        const mfccMean = [];
        for (let j = 0; j < 13; j++) {
            mfccMean.push(Math.random() * 2 - 1);
        }
        
        mockFeatures.push({
            mfccMean,
            mfccVariance: mfccMean.map(() => 0.1),
            spectralCentroidMean: Math.random() * 1000 + 500,
            spectralCentroidVariance: 0.1,
            spectralFlatnessMean: Math.random() * 0.5,
            spectralFlatnessVariance: 0.1,
            zcrMean: Math.random() * 0.3,
            zcrVariance: 0.1,
            rmsMean: Math.random() * 0.5,
            rmsVariance: 0.1,
            energyMean: Math.random() * 1.0,
            energyVariance: 0.1,
            pitchMean: 120 + Math.random() * 30,
            pitchVariance: 10,
            pitchRange: 20
        });
    }
    
    try {
        const formData = new FormData();
        formData.append('walletAddress', TEST_WALLET);
        
        mockFeatures.forEach((feature, index) => {
            formData.append(`features_${index}`, JSON.stringify(feature));
        });
        
        const response = await fetch(`${BACKEND_URL}/api/biometrics/voice/train`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ Voice training successful');
            console.log('   Features count:', data.featuresCount);
            return true;
        } else {
            console.log('❌ Voice training failed:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Voice training error:', error.message);
        return false;
    }
}

// Test 6: MongoDB Connection
async function testMongoDBConnection() {
    console.log('\nTest 6: MongoDB Connection');
    try {
        // Try to check status which requires MongoDB
        const response = await fetch(
            `${BACKEND_URL}/api/biometrics/status?walletAddress=${TEST_WALLET}`
        );
        if (response.ok) {
            console.log('✅ MongoDB connection working');
            return true;
        } else {
            console.log('❌ MongoDB connection issue');
            return false;
        }
    } catch (error) {
        console.log('❌ MongoDB test failed:', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('Starting integration tests...\n');
    console.log('='.repeat(50));
    
    const results = {
        backendHealth: await testBackendHealth(),
        ghostKeyHealth: await testGhostKeyHealth(),
        biometricStatus: await testBiometricStatus(),
        mongoDBConnection: await testMongoDBConnection(),
    };
    
    // Only run training tests if basic tests pass
    if (results.backendHealth && results.ghostKeyHealth) {
        results.keystrokeTraining = await testKeystrokeTraining();
        results.voiceTraining = await testVoiceTraining();
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Test Results Summary:\n');
    
    let passed = 0;
    let total = 0;
    
    for (const [test, result] of Object.entries(results)) {
        total++;
        if (result) passed++;
        const status = result ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} - ${test}`);
    }
    
    console.log(`\n${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('\n🎉 All tests passed! System is ready for production.');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the errors above.');
    }
}

// Run tests
runAllTests().catch(console.error);
