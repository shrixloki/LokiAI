/**
 * Complete System Test - After Docker Rebuild
 * Tests all services and agent functionality
 */

import fetch from 'node-fetch';
import { io } from 'socket.io-client';

const BASE_URL = 'http://localhost:5000';
const REBALANCER_URL = 'http://localhost:5001';
const TEST_WALLET = '0x8bbfa86f2766fd05220f319a4d122c97fbc4b529';

async function testCompleteSystem() {
    console.log('🧪 Testing Complete LokiAI System After Docker Rebuild...\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    // Test 1: Backend Health Check
    totalTests++;
    try {
        console.log('1. Testing Backend Health...');
        const response = await fetch(`${BASE_URL}/health`);
        const data = await response.json();
        
        if (data.status === 'healthy') {
            console.log('✅ Backend Health: PASSED');
            passedTests++;
        } else {
            console.log('❌ Backend Health: FAILED -', data);
        }
    } catch (error) {
        console.log('❌ Backend Health: FAILED -', error.message);
    }
    
    // Test 2: Rebalancer API Health
    totalTests++;
    try {
        console.log('2. Testing Rebalancer API...');
        const response = await fetch(`${REBALANCER_URL}/api/health`);
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
    
    // Test 3: Agent Status
    totalTests++;
    try {
        console.log('3. Testing Agent Status...');
        const response = await fetch(`${BASE_URL}/api/agents/status?wallet=${TEST_WALLET}`);
        const data = await response.json();
        
        if (data.success && data.agents && data.agents.length === 4) {
            console.log('✅ Agent Status: PASSED - Found 4 agents');
            passedTests++;
        } else {
            console.log('❌ Agent Status: FAILED - Expected 4 agents, got', data.agents?.length || 0);
        }
    } catch (error) {
        console.log('❌ Agent Status: FAILED -', error.message);
    }
    
    // Test 4: Arbitrage Bot Execution
    totalTests++;
    try {
        console.log('4. Testing Arbitrage Bot...');
        const response = await fetch(`${BASE_URL}/api/agents/execute/arbitrage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: TEST_WALLET })
        });
        const data = await response.json();
        
        if (data.success && data.opportunities > 0) {
            console.log(`✅ Arbitrage Bot: PASSED - Found ${data.opportunities} opportunities, $${data.totalProfit?.toFixed(2)} profit`);
            passedTests++;
        } else {
            console.log('❌ Arbitrage Bot: FAILED -', data.message || 'No opportunities');
        }
    } catch (error) {
        console.log('❌ Arbitrage Bot: FAILED -', error.message);
    }
    
    // Test 5: Yield Optimizer Execution
    totalTests++;
    try {
        console.log('5. Testing Yield Optimizer...');
        const response = await fetch(`${BASE_URL}/api/agents/execute/yield-optimizer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: TEST_WALLET })
        });
        const data = await response.json();
        
        if (data.success && data.bestAPY > 0) {
            console.log(`✅ Yield Optimizer: PASSED - Best APY ${data.bestAPY}%, $${data.optimizedReturn?.toFixed(2)} monthly return`);
            passedTests++;
        } else {
            console.log('❌ Yield Optimizer: FAILED -', data.message || 'No yield data');
        }
    } catch (error) {
        console.log('❌ Yield Optimizer: FAILED -', error.message);
    }
    
    // Test 6: Portfolio Rebalancer Execution
    totalTests++;
    try {
        console.log('6. Testing Portfolio Rebalancer...');
        const response = await fetch(`${BASE_URL}/api/agents/execute/portfolio-rebalancer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: TEST_WALLET })
        });
        const data = await response.json();
        
        if (data.success && data.portfolioValue > 0) {
            console.log(`✅ Portfolio Rebalancer: PASSED - $${data.portfolioValue?.toFixed(0)} portfolio, ${data.recommendations} recommendations`);
            passedTests++;
        } else {
            console.log('❌ Portfolio Rebalancer: FAILED -', data.message || 'No portfolio data');
        }
    } catch (error) {
        console.log('❌ Portfolio Rebalancer: FAILED -', error.message);
    }
    
    // Test 7: Risk Manager Execution
    totalTests++;
    try {
        console.log('7. Testing Risk Manager...');
        const response = await fetch(`${BASE_URL}/api/agents/execute/risk-manager`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: TEST_WALLET })
        });
        const data = await response.json();
        
        if (data.success && data.riskScore !== undefined) {
            console.log(`✅ Risk Manager: PASSED - ${data.riskLevel} risk (${data.riskScore?.toFixed(0)}/100), ${data.alerts} alerts`);
            passedTests++;
        } else {
            console.log('❌ Risk Manager: FAILED -', data.message || 'No risk data');
        }
    } catch (error) {
        console.log('❌ Risk Manager: FAILED -', error.message);
    }
    
    // Test 8: Socket.IO Connection
    totalTests++;
    try {
        console.log('8. Testing Socket.IO Connection...');
        
        const socket = io(BASE_URL, {
            timeout: 5000,
            transports: ['websocket', 'polling']
        });
        
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                socket.disconnect();
                reject(new Error('Connection timeout'));
            }, 5000);
            
            socket.on('connect', () => {
                clearTimeout(timeout);
                console.log('✅ Socket.IO: PASSED - Connected successfully');
                passedTests++;
                socket.disconnect();
                resolve();
            });
            
            socket.on('connect_error', (error) => {
                clearTimeout(timeout);
                socket.disconnect();
                reject(error);
            });
        });
        
    } catch (error) {
        console.log('❌ Socket.IO: FAILED -', error.message);
    }
    
    // Test 9: MongoDB Connection (via backend)
    totalTests++;
    try {
        console.log('9. Testing MongoDB Connection...');
        const response = await fetch(`${BASE_URL}/api/agents/status?wallet=${TEST_WALLET}`);
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ MongoDB: PASSED - Database accessible via backend');
            passedTests++;
        } else {
            console.log('❌ MongoDB: FAILED - Database not accessible');
        }
    } catch (error) {
        console.log('❌ MongoDB: FAILED -', error.message);
    }
    
    // Test 10: External API Integration
    totalTests++;
    try {
        console.log('10. Testing External API Integration...');
        const response = await fetch(`${REBALANCER_URL}/api/yield/opportunities`);
        const data = await response.json();
        
        if (data.success && data.data?.opportunities) {
            console.log(`✅ External APIs: PASSED - ${data.data.opportunities.length} yield opportunities found`);
            passedTests++;
        } else {
            console.log('❌ External APIs: FAILED - No yield data');
        }
    } catch (error) {
        console.log('❌ External APIs: FAILED -', error.message);
    }
    
    // Final Results
    console.log('\n========================================');
    console.log('🧪 Complete System Test Results');
    console.log('========================================');
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED - System is fully operational!');
        console.log('🚀 LokiAI Production Agents are ready for crypto trading');
        console.log('');
        console.log('🎯 Next Steps:');
        console.log('1. Open http://localhost:5173 in your browser');
        console.log('2. Connect your MetaMask wallet');
        console.log('3. Start trading with the 4 production agents');
    } else if (passedTests >= totalTests * 0.8) {
        console.log('⚠️ Most tests passed - System is mostly functional');
        console.log('🔧 Minor issues detected, but core functionality works');
    } else {
        console.log('❌ Multiple tests failed - System needs attention');
        console.log('🔧 Check the logs above and fix the issues');
    }
    
    console.log('\n🌐 Access Points:');
    console.log('- Frontend: http://localhost:5173');
    console.log('- Backend API: http://localhost:5000');
    console.log('- Rebalancer API: http://localhost:5001');
    console.log('- Health Check: http://localhost:5000/health');
    console.log('========================================\n');
}

// Run the complete system test
testCompleteSystem().catch(console.error);