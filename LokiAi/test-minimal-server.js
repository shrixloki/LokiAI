/**
 * Test Minimal Server
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5001';
const TEST_WALLET = '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87';

console.log('🧪 Testing Minimal Server');
console.log('=========================');

async function testHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        console.log('✅ Health:', data.status);
    } catch (error) {
        console.log('❌ Health failed:', error.message);
    }
}

async function testAgentStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/agents/status?wallet=${TEST_WALLET}`);
        console.log('Status code:', response.status);
        const text = await response.text();
        console.log('Response:', text.substring(0, 200));
    } catch (error) {
        console.log('❌ Agent status failed:', error.message);
    }
}

async function testAgentRun() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/agents/run/arbitrage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: TEST_WALLET })
        });
        console.log('Run status code:', response.status);
        const text = await response.text();
        console.log('Run response:', text.substring(0, 200));
    } catch (error) {
        console.log('❌ Agent run failed:', error.message);
    }
}

async function runTests() {
    await testHealth();
    await testAgentStatus();
    await testAgentRun();
}

runTests();