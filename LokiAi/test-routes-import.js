/**
 * Test Routes Import
 */

console.log('Testing routes import...');

try {
    const agentsRouter = await import('./routes/agents.js');
    console.log('✅ Agents router imported successfully');
    console.log('Router:', typeof agentsRouter.default);
} catch (error) {
    console.log('❌ Failed to import agents router:', error.message);
    console.log('Stack:', error.stack);
}

try {
    const controller = await import('./backend/controllers/agents.controller.js');
    console.log('✅ Agents controller imported successfully');
    console.log('Functions:', Object.keys(controller));
} catch (error) {
    console.log('❌ Failed to import agents controller:', error.message);
    console.log('Stack:', error.stack);
}