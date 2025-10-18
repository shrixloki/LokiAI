/**
 * Production Agents Integration Test
 * 
 * Tests all 4 production agents to ensure they work correctly
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const TEST_WALLET = '0x742d35Cc6634C0532925a3b8D0C9e3e0C8b0e4c2';

async function testProductionAgents() {
    console.log('🧪 Testing Production Agents Integration...\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    // Test 1: Health Check
    totalTests++;
    try {
        const response = await fetch(`${BASE_URL}/health`);
        const data = await response.json();
        
        if (data.status === 'healthy') {
            console.log('✅ Health Check: PASSED');
            passedTests++;
        } else {
            console.log('❌ Health Check: FAILED');
        }
    } catch (error) {
        console.log('❌ Health Check: FAILED -', error.message);
    }
    
    // Test 2: Start Production Agents
    totalTests++;
    try {
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
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test 3: Get Agent Status
    totalTests++;
    try {
        const response = await fetch(`${BASE_URL}/api/agents/status?wallet=${TEST_WALLET}`);
        const data = await response.json();
        
        if (data.success && data.walletAgents && data.walletAgents.length === 4) {
            console.log('✅ Agent Status: PASSED - Found 4 production agents');
            passedTests++;
        } else {
            console.log('❌ Agent Status: FAILED - Expected 4 agents, got', data.walletAgents?.length || 0);
        }
    } catch (error) {
        console.log('❌ Agent Status: FAILED -', error.message);
    }
    
    // Test 4: Execute Arbitrage Bot
    totalTests++;
    try {
        const response = await fetch(`${BASE_URL}/api/agents/execute/arbitrage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: TEST_WALLET })
        });
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Arbitrage Bot Execution: PASSED');
            passedTests++;
        } else {
            console.log('❌ Arbitrage Bot Execution: FAILED -', data.message);
        }
    } catch (error) {
        console.log('❌ Arbitrage Bot Execution: FAILED -', error.message);
    }
    
    // Test 5: Execute Yield Optimizer
    totalTests++;
    try {
        const response = await fetch(`${BASE_URL}/api/agents/execute/yield`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: TEST_WALLET })
        });
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Yield Optimizer Execution: PASSED');
            passedTests++;
        } else {
            console.log('❌ Yield Optimizer Execution: FAILED -', data.message);
        }
    } catch (error) {
        console.log('❌ Yield Optimizer Execution: FAILED -', error.message);
    }
    
    // Test 6: Execute Risk Manager
    totalTests++;
    try {
        const response = await fetch(`${BASE_URL}/api/agents/execute/risk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: TEST_WALLET })
        });
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Risk Manager Execution: PASSED');
            passedTests++;
        } else {
            console.log('❌ Risk Manager Execution: FAILED -', data.message);
        }
    } catch (error) {
        console.log('❌ Risk Manager Execution: FAILED -', error.message);
    }
    
    // Test 7: Execute Portfolio Rebalancer
    totalTests++;
    try {
        const response = await fetch(`${BASE_URL}/api/agents/execute/rebalancer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: TEST_WALLET })
        });
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Portfolio Rebalancer Execution: PASSED');
            passedTests++;
        } else {
            console.log('❌ Portfolio Rebalancer Execution: FAILED -', data.message);
        }
    } catch (error) {
        console.log('❌ Portfolio Rebalancer Execution: FAILED -', error.message);
    }
    
    // Test 8: Get Performance Metrics
    totalTests++;
    try {
        const response = await fetch(`${BASE_URL}/api/agents/metrics?wallet=${TEST_WALLET}&timeframe=24h`);
        const data = await response.json();
        
        if (data.success && data.aggregatedMetrics) {
            console.log('✅ Performance Metrics: PASSED');
            passedTests++;
        } else {
            console.log('❌ Performance Metrics: FAILED');
        }
    } catch (error) {
        console.log('❌ Performance Metrics: FAILED -', error.message);
    }
    
    // Test 9: Rebalancer API Health
    totalTests++;
    try {
        const response = await fetch('http://localhost:5001/api/health');
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Rebalancer API Health: PASSED');
            passedTests++;
        } else {
            console.log('❌ Rebalancer API Health: FAILED');
        }
    } catch (error) {
        console.log('❌ Rebalancer API Health: FAILED -', error.message);
    }
    
    // Test 10: Biometrics Service Health
    totalTests++;
    try {
        const response = await fetch('http://localhost:25000/health');
        const data = await response.json();
        
        if (data.status === 'healthy') {
            console.log('✅ Biometrics Service Health: PASSED');
            passedTests++;
        } else {
            console.log('❌ Biometrics Service Health: FAILED');
        }
    } catch (error) {
        console.log('❌ Biometrics Service Health: FAILED -', error.message);
    }
    
    // Final Results
    console.log('\n========================================');
    console.log('🧪 Production Agents Test Results');
    console.log('========================================');
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED - Production agents are ready!');
        console.log('🚀 System is production-ready for crypto traders');
    } else {
        console.log('⚠️ Some tests failed - Check the logs above');
        console.log('🔧 Fix the issues before deploying to production');
    }
    
    console.log('\n🌐 Frontend: http://localhost');
    console.log('🔧 Backend API: http://localhost:5000');
    console.log('📊 Grafana: http://localhost:3000');
    console.log('========================================\n');
}

// Run the tests
testProductionAgents().catch(console.error);