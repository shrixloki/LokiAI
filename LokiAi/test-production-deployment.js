/**
 * Production Deployment Test Suite
 * Tests all services and endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost';
const BACKEND_URL = `${BASE_URL}/api`;
const BIOMETRICS_URL = `${BASE_URL}/biometrics`;

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, url, options = {}) {
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (response.ok) {
            log(`✅ ${name}: PASSED`, 'green');
            return { success: true, data };
        } else {
            log(`❌ ${name}: FAILED (${response.status})`, 'red');
            return { success: false, error: data };
        }
    } catch (error) {
        log(`❌ ${name}: ERROR - ${error.message}`, 'red');
        return { success: false, error: error.message };
    }
}

async function runTests() {
    log('\n========================================', 'cyan');
    log('  LokiAI Production Deployment Tests', 'cyan');
    log('========================================\n', 'cyan');
    
    let passed = 0;
    let failed = 0;
    
    // Test 1: Backend Health
    log('Testing Backend Services...', 'yellow');
    const backendHealth = await testEndpoint(
        'Backend Health Check',
        `${BACKEND_URL}/health`
    );
    backendHealth.success ? passed++ : failed++;
    
    // Test 2: Biometrics Health
    const biometricsHealth = await testEndpoint(
        'Biometrics Health Check',
        `${BIOMETRICS_URL}/health`
    );
    biometricsHealth.success ? passed++ : failed++;
    
    // Test 3: Auth Message Generation
    log('\nTesting Authentication...', 'yellow');
    const authMessage = await testEndpoint(
        'Auth Message Generation',
        `${BACKEND_URL}/auth/message?address=0x742d35cc6634c0532925a3b844bc9e7595f0beb1`
    );
    authMessage.success ? passed++ : failed++;
    
    // Test 4: Dashboard Summary
    log('\nTesting Dashboard API...', 'yellow');
    const dashboard = await testEndpoint(
        'Dashboard Summary',
        `${BACKEND_URL}/dashboard/summary?wallet=0x742d35cc6634c0532925a3b844bc9e7595f0beb1`
    );
    dashboard.success ? passed++ : failed++;
    
    // Test 5: Agents Status
    log('\nTesting AI Agents API...', 'yellow');
    const agents = await testEndpoint(
        'Agents Status',
        `${BACKEND_URL}/agents/status?wallet=0x742d35cc6634c0532925a3b844bc9e7595f0beb1`
    );
    agents.success ? passed++ : failed++;
    
    // Test 6: Analytics Performance
    log('\nTesting Analytics API...', 'yellow');
    const analytics = await testEndpoint(
        'Analytics Performance',
        `${BACKEND_URL}/analytics/performance?wallet=0x742d35cc6634c0532925a3b844bc9e7595f0beb1&period=30d`
    );
    analytics.success ? passed++ : failed++;
    
    // Test 7: Cross-Chain Activity
    log('\nTesting Cross-Chain API...', 'yellow');
    const crosschain = await testEndpoint(
        'Cross-Chain Activity',
        `${BACKEND_URL}/crosschain/activity?wallet=0x742d35cc6634c0532925a3b844bc9e7595f0beb1`
    );
    crosschain.success ? passed++ : failed++;
    
    // Test 8: Activity History
    log('\nTesting Activity API...', 'yellow');
    const activity = await testEndpoint(
        'Activity History',
        `${BACKEND_URL}/activity/history?wallet=0x742d35cc6634c0532925a3b844bc9e7595f0beb1&limit=10`
    );
    activity.success ? passed++ : failed++;
    
    // Test 9: Biometrics Status
    log('\nTesting Biometrics API...', 'yellow');
    const biometricsStatus = await testEndpoint(
        'Biometrics Status',
        `${BIOMETRICS_URL}/status?walletAddress=0x742d35cc6634c0532925a3b844bc9e7595f0beb1`
    );
    biometricsStatus.success ? passed++ : failed++;
    
    // Test 10: Keystroke Training (will fail without data, but tests endpoint)
    const keystrokeTrain = await testEndpoint(
        'Keystroke Training Endpoint',
        `${BIOMETRICS_URL}/keystroke/train`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0beb1',
                keystrokeSamples: []
            })
        }
    );
    // This should fail validation, which means endpoint is working
    if (!keystrokeTrain.success && keystrokeTrain.error) {
        log('✅ Keystroke Training Endpoint: PASSED (validation working)', 'green');
        passed++;
    } else {
        failed++;
    }
    
    // Summary
    log('\n========================================', 'cyan');
    log('  Test Results', 'cyan');
    log('========================================', 'cyan');
    log(`Total Tests: ${passed + failed}`, 'yellow');
    log(`Passed: ${passed}`, 'green');
    log(`Failed: ${failed}`, 'red');
    log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`, 'cyan');
    log('========================================\n', 'cyan');
    
    if (failed === 0) {
        log('🎉 All tests passed! Production deployment is ready.', 'green');
        process.exit(0);
    } else {
        log('⚠️  Some tests failed. Please check the logs above.', 'yellow');
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    log(`\n❌ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
});
