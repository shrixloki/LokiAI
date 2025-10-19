// Test imports to identify the issue
console.log('Testing imports...');

try {
    console.log('1. Testing production-blockchain controller import...');
    const controller = await import('./backend/controllers/production-blockchain.controller.js');
    console.log('✅ Controller imported successfully');
    
    console.log('2. Testing production-blockchain routes import...');
    const routes = await import('./routes/production-blockchain.js');
    console.log('✅ Routes imported successfully');
    
    console.log('3. Testing production-agent-orchestrator import...');
    const orchestrator = await import('./backend/services/production-agent-orchestrator.js');
    console.log('✅ Orchestrator imported successfully');
    
    console.log('All imports successful!');
    
} catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error('Stack:', error.stack);
}