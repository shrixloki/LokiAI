const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = 25001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
    credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Backend server is running (Node.js fallback)'
    });
});

// Generate challenge for wallet verification
app.post('/challenge', (req, res) => {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
        return res.status(400).json({
            error: 'Wallet address is required'
        });
    }
    
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(4).toString('hex');
    const message = `Please sign this message to verify your wallet ownership.\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
    
    res.json({ message });
});

// Verify wallet signature (simplified - would need ethers.js for full verification)
app.post('/verify-wallet', (req, res) => {
    const { walletAddress, signature, message } = req.body;
    
    if (!walletAddress || !signature || !message) {
        return res.status(400).json({
            valid: false,
            message: 'Missing required fields'
        });
    }
    
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
        return res.status(400).json({
            valid: false,
            message: 'Invalid wallet address format'
        });
    }
    
    // For now, return success for demo purposes
    // In production, you'd verify the signature using ethers.js
    res.json({
        valid: true,
        message: 'Wallet signature verified successfully (demo mode)'
    });
});

// Mock users endpoint for testing
app.get('/users', (req, res) => {
    res.json([
        {
            id: 1,
            name: 'Demo User',
            email: 'demo@example.com',
            wallet_address: '0x742d35Cc6Cd3B7a8917fe5b3B8b3C9f5d5e5d9a'
        }
    ]);
});

// Create user endpoint
app.post('/users', (req, res) => {
    const { name, email, walletAddress } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({
            error: 'Name and email are required'
        });
    }
    
    const newUser = {
        id: Date.now(),
        name,
        email,
        wallet_address: walletAddress || null
    };
    
    res.json(newUser);
});

app.listen(PORT, '127.0.0.1', () => {
    console.log('🚀 Starting Chainflow Sentinel Backend Server (Node.js)');
    console.log(`📍 Server running on: http://127.0.0.1:${PORT}`);
    console.log('🔧 Mode: Standalone (no database required)');
    console.log(`✅ Health check: http://127.0.0.1:${PORT}/health`);
});
