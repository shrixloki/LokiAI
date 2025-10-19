import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Test server working' });
});

// Test production blockchain routes
try {
    console.log('Loading production blockchain routes...');
    const productionBlockchainRouter = await import('./routes/production-blockchain.js');
    app.use('/api/production-blockchain', productionBlockchainRouter.default);
    console.log('✅ Production blockchain routes loaded');
} catch (error) {
    console.error('❌ Failed to load production blockchain routes:', error.message);
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Test server running on http://localhost:${PORT}`);
    console.log('📍 Test endpoint: http://localhost:5001/test');
    console.log('📍 Production endpoint: http://localhost:5001/api/production-blockchain/system/health');
});