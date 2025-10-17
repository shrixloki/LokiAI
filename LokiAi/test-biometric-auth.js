/**
 * Test script for biometric authentication endpoints
 * Run with: node test-biometric-auth.js
 */

const testWalletAddress = '0x742d35Cc6Cd3B7a8917fe5b3B8b3C9f5d5e5d9a';
const baseUrl = 'http://127.0.0.1:25000';

// Generate mock keystroke data
function generateMockKeystrokeData() {
  const features = [];
  // Hold times (11 keys)
  for (let i = 0; i < 11; i++) {
    features.push(80 + Math.random() * 40); // 80-120ms
  }
  // DD times (10 transitions)
  for (let i = 0; i < 10; i++) {
    features.push(150 + Math.random() * 100); // 150-250ms
  }
  // UD times (10 transitions)
  for (let i = 0; i < 10; i++) {
    features.push(50 + Math.random() * 50); // 50-100ms
  }
  // Additional features
  features.push(5.2); // typing speed
  features.push(75); // flight time
  features.push(0); // error rate
  features.push(15); // press pressure
  
  return features;
}

async function testKeystrokeTraining() {
  console.log('\n🔐 Testing Keystroke Training...');
  
  const samples = [];
  for (let i = 0; i < 5; i++) {
    samples.push(generateMockKeystrokeData());
  }
  
  try {
    const response = await fetch(`${baseUrl}/api/biometrics/keystroke/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: testWalletAddress,
        keystrokeSamples: samples
      })
    });
    
    const result = await response.json();
    console.log('✅ Training Result:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Training Failed:', error.message);
    return false;
  }
}

async function testKeystrokeVerification() {
  console.log('\n🔍 Testing Keystroke Verification...');
  
  const testData = generateMockKeystrokeData();
  
  try {
    const response = await fetch(`${baseUrl}/api/biometrics/keystroke/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: testWalletAddress,
        keystrokeData: testData
      })
    });
    
    const result = await response.json();
    console.log('✅ Verification Result:', result);
    console.log(`   Score: ${(result.score * 100).toFixed(2)}%`);
    console.log(`   Status: ${result.success ? 'PASSED' : 'FAILED'}`);
    return result.success;
  } catch (error) {
    console.error('❌ Verification Failed:', error.message);
    return false;
  }
}

async function testVoiceTraining() {
  console.log('\n🎤 Testing Voice Training...');
  
  try {
    const response = await fetch(`${baseUrl}/api/biometrics/voice/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: testWalletAddress
      })
    });
    
    const result = await response.json();
    console.log('✅ Training Result:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Training Failed:', error.message);
    return false;
  }
}

async function testVoiceVerification() {
  console.log('\n🔊 Testing Voice Verification...');
  
  try {
    const response = await fetch(`${baseUrl}/api/biometrics/voice/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: testWalletAddress
      })
    });
    
    const result = await response.json();
    console.log('✅ Verification Result:', result);
    console.log(`   Score: ${(result.score * 100).toFixed(2)}%`);
    console.log(`   Status: ${result.success ? 'PASSED' : 'FAILED'}`);
    return result.success;
  } catch (error) {
    console.error('❌ Verification Failed:', error.message);
    return false;
  }
}

async function testUserSettings() {
  console.log('\n⚙️  Testing User Settings Update...');
  
  try {
    const response = await fetch(`${baseUrl}/api/user/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: testWalletAddress,
        biometricAuth: true
      })
    });
    
    const result = await response.json();
    console.log('✅ Settings Update Result:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Settings Update Failed:', error.message);
    return false;
  }
}

async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  
  try {
    const response = await fetch(`${baseUrl}/health`);
    const result = await response.json();
    console.log('✅ Health Check:', result);
    return result.status === 'healthy';
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    console.error('   Make sure backend server is running: node backend-server.js');
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Biometric Authentication Tests');
  console.log('==========================================');
  console.log(`Test Wallet: ${testWalletAddress}`);
  console.log(`Backend URL: ${baseUrl}`);
  
  const results = {
    healthCheck: false,
    keystrokeTraining: false,
    keystrokeVerification: false,
    voiceTraining: false,
    voiceVerification: false,
    settingsUpdate: false
  };
  
  // Test health check first
  results.healthCheck = await testHealthCheck();
  if (!results.healthCheck) {
    console.log('\n❌ Backend server is not running. Please start it first:');
    console.log('   cd LokiAi && node backend-server.js');
    return;
  }
  
  // Run all tests
  results.keystrokeTraining = await testKeystrokeTraining();
  results.keystrokeVerification = await testKeystrokeVerification();
  results.voiceTraining = await testVoiceTraining();
  results.voiceVerification = await testVoiceVerification();
  results.settingsUpdate = await testUserSettings();
  
  // Summary
  console.log('\n==========================================');
  console.log('📊 Test Summary');
  console.log('==========================================');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const status = passed ? 'PASSED' : 'FAILED';
    console.log(`${icon} ${test.padEnd(25)} ${status}`);
  });
  
  console.log('==========================================');
  console.log(`Total: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Biometric authentication is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Run tests
runAllTests().catch(console.error);
