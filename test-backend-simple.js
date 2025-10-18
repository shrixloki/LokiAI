/**
 * Simple Backend Test - Production Agents
 * Tests the essential backend services
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const TEST_WALLET = '0x742d35Cc6634C0532925a3b8D0C9e3e0C8b0e4c2';

async function testBackend() {
    console.log('🧪 Testing Backend Services...\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    // Test 1: Health Check
    totalTests++;
    try {
        console.log('Testing health endpoint...');
        const response = await fetch(`${BASE_URL}/health`);
        const data = await response.json();
        
        if (data.status === 'healthy') {
            console.log('✅ Health Check: PASSED');
            passedTests++;
        } else {
            console.log('❌ Health Check: FAILED -', data);
        }
    } catch (error) {
        console.log('❌ Health Check: FAILED -', error.message);
    }
    
    // Test 2: Start Production Agents
    totalTests++;
    try {
        console.log('Starting production agents...');
        const response = await fetch(`${BASE_URL}/api/agents/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Start Production Agents: PASSED');
            passedTests++;
        } else {
            console.log('❌ Start Production Agents: FAILED -', data.message);
        }
    } catch (error) {
        console.log('❌ Start Production Agents: FAILED -', error.message);
    }
    
    // Wait for agents to initialize
    console.log('⏳ Waiting for agents to initialize...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 3: Get Agent Status
    totalTests++;
    try {
        console.log('Getting agent status...');
        const response = await fetch(`${BASE_URL}/api/agents/status?wallet=${TEST_WALLET}`);
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Agent Status: PASSED');
            console.log(`   Found agents: ${data.walletAgents?.length || 0}`);
            passedTests++;
        } else {
            console.log('❌ Agent Status: FAILED -', data.message);
        }
    } catch (error) {
        console.log('❌ Agent Status: FAILED -', error.message);
    }
    
    // Test 4: Execute Arbitrage Bot
    totalTests++;
    try {
        console.log('Testing arbitrage bot...');
        const response = await fetch(`${BASE_URL}/api/agents/execute/arbitrage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: TEST_WALLET })
        });
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Arbitrage Bot: PASSED');
            passedTests++;
        } else {
            console.log('❌ Arbitrage Bot: FAILED -', data.message);
        }
    } catch (error) {
        console.log('❌ Arbitrage Bot: FAILED -', error.message);
    }
    
    // Test 5: Rebalancer API Health
    totalTests++;
    try {
        console.log('Testing rebalancer API...');
        const response = await fetch('http://localhost:5001/api/health');
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Rebalancer API: PASSED');
            passedTests++;
        } else {
            console.log('❌ Rebalancer API: FAILED');
        }
    } catch (error) {
        console.log('❌ Rebalancer API: FAILED -', error.message);
    }
    
    // Final Results
    console.log('\n========================================');
    console.log('🧪 Backend Test Results');
    console.log('========================================');
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED - Backend is ready!');
        console.log('🚀 Production agents are working correctly');
    } else {
        console.log('⚠️ Some tests failed - Check the logs above');
    }
    
    console.log('\n🌐 Next: Start frontend with npm run dev in LokiAi directory');
    console.log('🎯 Then open: http://localhost:5173');
    console.log('========================================\n');
}

// Run the tests
testBackend().catch(console.error);