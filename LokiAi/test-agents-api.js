/**
 * Test AI Agents API
 * 
 * Tests the /api/agents/status endpoint
 */

const WALLET_ADDRESS = process.argv[2] || '0x8bbfa86f2766fd05220f319a4d122c97fbc4b529';
const API_URL = 'http://localhost:5000';

async function testAgentsAPI() {
    console.log('🧪 Testing AI Agents API');
    console.log(`📍 Wallet: ${WALLET_ADDRESS}`);
    console.log('');

    try {
        // Test agents status endpoint
        console.log('📡 Testing GET /api/agents/status...');
        const response = await fetch(`${API_URL}/api/agents/status?wallet=${WALLET_ADDRESS}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('✅ Response received:');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
        
        if (data.success && data.agents) {
            console.log('📊 Agent Summary:');
            console.log(`  Total Agents: ${data.agents.length}`);
            console.log('');
            
            data.agents.forEach((agent, index) => {
                console.log(`  ${index + 1}. ${agent.name}`);
                console.log(`     Type: ${agent.type}`);
                console.log(`     Status: ${agent.status}`);
                console.log(`     APY: ${agent.apy}%`);
                console.log(`     P&L: $${agent.pnl.toLocaleString()}`);
                console.log(`     Win Rate: ${agent.winRate}%`);
                console.log(`     Trades: ${agent.trades}`);
                console.log(`     Chains: ${agent.chains.join(', ')}`);
                console.log('');
            });
            
            console.log('✅ All tests passed!');
        } else {
            console.error('❌ Invalid response format');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testAgentsAPI();
