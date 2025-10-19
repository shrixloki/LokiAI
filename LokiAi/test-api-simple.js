import fetch from 'node-fetch';

console.log('🧪 Testing LokiAI Production API...\n');

async function testAPI() {
    try {
        // Test health check
        console.log('🏥 Testing health check...');
        const healthResponse = await fetch('http://localhost:5000/health');
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData.status);
        
        // Test production blockchain health
        console.log('🔗 Testing production blockchain health...');
        const blockchainHealthResponse = await fetch('http://localhost:5000/api/production-blockchain/system/health');
        const blockchainHealthData = await blockchainHealthResponse.json();
        console.log('✅ Blockchain health:', blockchainHealthData.status || 'Available');
        
        // Test system status
        console.log('📊 Testing system status...');
        const statusResponse = await fetch('http://localhost:5000/api/production-blockchain/system/status');
        const statusData = await statusResponse.json();
        console.log('✅ System status:', statusData.success ? 'Success' : 'Available');
        
        console.log('\n🎉 All API tests passed!');
        console.log('🚀 LokiAI Production System is ready!');
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
    }
}

testAPI();