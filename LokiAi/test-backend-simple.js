/**
 * Simple Backend Test
 * Tests basic backend functionality
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';
const TEST_WALLET = '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87';

console.log('🧪 Testing LokiAI Backend');
console.log('========================');

async function testHealth() {
    console.log('\n1️⃣ Testing Health Endpoint...');
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        console.log('✅ Health check passed:', data.status);
        return true;
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
        return false;
    }
}

async function testAgentStatus() {
    console.log('\n2️⃣ Testing Agent Status...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/agents/status?wallet=${TEST_WALLET}`);
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Agent status working');
            console.log(`   Found ${data.agents.length} agents`);
        } else {
            console.log('❌ Agent status failed:', data.error);
        }
        return data.success;
    } catch (error) {
        console.log('❌ Agent status error:', error.message);
        return false;
    }
}

async function runTests() {
    const healthOk = await testHealth();
    if (!healthOk) {
        console.log('\n❌ Backend is not running. Please start it first:');
        console.log('   node backend/server.js');
        return;
    }
    
    await testAgentStatus();
    
    console.log('\n🏁 Basic tests completed!');
}

runTests().catch(console.error);