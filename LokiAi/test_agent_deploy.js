import fetch from 'node-fetch';

const BACKEND_URL = 'http://127.0.0.1:25001';
const MOCK_WALLET = '0x0000000000000000000000000000000000000001';

async function testDeploy() {
    try {
        const agentConfig = {
            type: 'yield',
            tokenSymbol: 'ETH',
            network: 'sepolia',
            name: 'Test Yield Agent',
            description: 'Test agent for prediction flow'
        };
        
        const response = await fetch(`${BACKEND_URL}/agents/deploy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agentConfig: agentConfig,
                walletAddress: MOCK_WALLET
            })
        });
        
        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Response:', text);
        
        if (response.ok) {
            const result = JSON.parse(text);
            console.log('✅ Agent deployed:', result.agentId);
        } else {
            console.error('❌ Deployment failed');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testDeploy();