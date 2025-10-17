/**
 * Test Script for Fixed AI Agents System
 * 
 * Tests the new AI agents socket service with real/mock trading pairs
 */

import fetch from 'node-fetch';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5050';
const TEST_WALLET = '0x1234567890123456789012345678901234567890';

console.log('🧪 Testing Fixed AI Agents System');
console.log('================================');

// Test 1: Health Check
async function testHealthCheck() {
    console.log('\n1️⃣ Testing Health Check...');
    try {
        const response = await fetch(`${SOCKET_URL}/health`);
        const data = await response.json();
        console.log('✅ Health check passed:', data);
        return true;
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        return false;
    }
}

// Test 2: HTTP Agent Execution
async function testHttpAgentExecution() {
    console.log('\n2️⃣ Testing HTTP Agent Execution...');
    try {
        const response = await fetch(`${SOCKET_URL}/run-agent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: TEST_WALLET,
                agentType: 'arbitrage',
                config: { testMode: true }
            })
        });
        
        const data = await response.json();
        console.log('✅ HTTP agent execution result:', {
            success: data.success,
            agentType: data.agentType,
            opportunities: data.opportunities,
            pnl: data.pnl,
            executionTime: data.executionTime
        });
        return data.success;
    } catch (error) {
        console.error('❌ HTTP agent execution failed:', error.message);
        return false;
    }
}

// Test 3: Socket Connection and Agent Execution
async function testSocketAgentExecution() {
    console.log('\n3️⃣ Testing Socket Agent Execution...');
    
    return new Promise((resolve) => {
        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            timeout: 10000
        });
        
        let testPassed = false;
        
        socket.on('connect', () => {
            console.log('✅ Socket connected successfully');
            
            // Join wallet room
            socket.emit('join-wallet', TEST_WALLET);
            
            // Listen for agent updates
            socket.on('agent-update', (data) => {
                console.log('✅ Received agent update:', {
                    agentType: data.agentType,
                    success: data.success,
                    opportunities: data.opportunities,
                    pnl: data.pnl,
                    executionTime: data.executionTime
                });
                testPassed = true;
                socket.disconnect();
                resolve(true);
            });
            
            socket.on('agent-error', (data) => {
                console.error('❌ Agent execution error:', data.error);
                socket.disconnect();
                resolve(false);
            });
            
            // Run arbitrage agent via socket
            socket.emit('run-agent', {
                walletAddress: TEST_WALLET,
                agentType: 'arbitrage',
                config: { testMode: true }
            });
        });
        
        socket.on('connect_error', (error) => {
            console.error('❌ Socket connection failed:', error.message);
            resolve(false);
        });
        
        // Timeout after 15 seconds
        setTimeout(() => {
            if (!testPassed) {
                console.error('❌ Socket test timed out');
                socket.disconnect();
                resolve(false);
            }
        }, 15000);
    });
}

// Test 4: Multiple Agent Types
async function testMultipleAgentTypes() {
    console.log('\n4️⃣ Testing Multiple Agent Types...');
    
    const agentTypes = ['arbitrage', 'yield-optimizer', 'portfolio-rebalancer', 'risk-manager'];
    const results = [];
    
    for (const agentType of agentTypes) {
        try {
            console.log(`   Testing ${agentType}...`);
            const response = await fetch(`${SOCKET_URL}/run-agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: TEST_WALLET,
                    agentType,
                    config: { testMode: true }
                })
            });
            
            const data = await response.json();
            results.push({
                agentType,
                success: data.success,
                pnl: data.pnl || 0,
                error: data.error
            });
            
            console.log(`   ✅ ${agentType}: ${data.success ? 'SUCCESS' : 'FAILED'}`);
            
        } catch (error) {
            console.error(`   ❌ ${agentType}: ${error.message}`);
            results.push({
                agentType,
                success: false,
                error: error.message
            });
        }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\n📊 Agent Types Test Results: ${successCount}/${agentTypes.length} passed`);
    
    return successCount === agentTypes.length;
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting comprehensive AI agents test suite...\n');
    
    const tests = [
        { name: 'Health Check', fn: testHealthCheck },
        { name: 'HTTP Agent Execution', fn: testHttpAgentExecution },
        { name: 'Socket Agent Execution', fn: testSocketAgentExecution },
        { name: 'Multiple Agent Types', fn: testMultipleAgentTypes }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            const result = await test.fn();
            results.push({ name: test.name, passed: result });
        } catch (error) {
            console.error(`❌ Test "${test.name}" threw an error:`, error.message);
            results.push({ name: test.name, passed: false });
        }
    }
    
    // Summary
    console.log('\n🏁 Test Results Summary');
    console.log('======================');
    
    results.forEach(result => {
        const status = result.passed ? '✅ PASSED' : '❌ FAILED';
        console.log(`${status} - ${result.name}`);
    });
    
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    console.log(`\n📊 Overall: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
        console.log('🎉 All tests passed! Your AI agents system is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Check the logs above for details.');
    }
    
    process.exit(passedCount === totalCount ? 0 : 1);
}

// Start tests
runAllTests().catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
});