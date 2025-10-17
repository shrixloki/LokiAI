/**
 * Test Single Agent Execution
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';
const TEST_WALLET = '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87';

console.log('🧪 Testing Single Agent Execution');
console.log('=================================');

async function testArbitrageBot() {
    console.log('\n🤖 Testing Arbitrage Bot...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/agents/run/arbitrage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: TEST_WALLET,
                config: {
                    maxSlippage: 0.5,
                    minProfitThreshold: 0.5,
                    riskLevel: 'medium'
                }
            })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.get('content-type'));
        
        const text = await response.text();
        console.log('Raw response:', text.substring(0, 200) + '...');
        
        try {
            const data = JSON.parse(text);
            console.log('✅ Parsed JSON:', data);
        } catch (parseError) {
            console.log('❌ Failed to parse JSON:', parseError.message);
        }
        
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }
}

testArbitrageBot();