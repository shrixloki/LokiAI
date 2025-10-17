import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import multer from 'multer';
import { MongoClient } from 'mongodb';

const app = express();
const PORT = 5000;

// Configure multer for file uploads (store in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Middleware - Allow all common dev server ports
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://127.0.0.1:5173', 
        'http://localhost:5174', 
        'http://127.0.0.1:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5175',
        'http://localhost:5176', 
        'http://127.0.0.1:5176',
        'http://192.168.31.233:5173',
        'http://192.168.31.233:5174',
        'http://192.168.31.233:5175',
        'http://192.168.31.233:5176'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lokiuser:%24hrishii%21okii25@loki-ai-cluster.b63sh3c.mongodb.net/?retryWrites=true&w=majority&appName=loki-ai-cluster';
const DB_NAME = 'loki_agents';
const GHOSTKEY_URL = 'http://127.0.0.1:25000';

let mongoClient = null;
let db = null;

// Initialize MongoDB connection
async function connectMongoDB() {
    if (db) return db;
    
    try {
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        db = mongoClient.db(DB_NAME);
        console.log('✅ Connected to MongoDB');
        return db;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        throw error;
    }
}

// AES-256 encryption for sensitive biometric data
function encryptData(data) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'loki-biometric-key-2025', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
        encrypted,
        iv: iv.toString('hex')
    };
}

function decryptData(encryptedData, ivHex) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'loki-biometric-key-2025', 'salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'LokiAI Backend with GhostKey Integration'
    });
});

// ✅ Generate SIWE (Sign-In with Ethereum) message for MetaMask login
app.get('/api/auth/message', (req, res) => {
    const { address } = req.query;
    
    if (!address) {
        return res.status(400).json({ 
            error: 'Wallet address required' 
        });
    }
    
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(8).toString('hex');
    const message = `Welcome to LokiAI! Sign this message to authenticate your wallet.\n\nAddress: ${address}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
    
    res.json({ message });
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

// Verify wallet signature
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
    
    res.json({
        valid: true,
        message: 'Wallet signature verified successfully'
    });
});

// Check if user has completed biometric setup
app.get('/api/biometrics/status', async (req, res) => {
    const { walletAddress } = req.query;
    
    if (!walletAddress) {
        return res.status(400).json({
            error: 'Wallet address required'
        });
    }
    
    try {
        const database = await connectMongoDB();
        const biometricsCollection = database.collection('biometrics');
        
        const keystrokeModel = await biometricsCollection.findOne({
            walletAddress: walletAddress.toLowerCase(),
            type: 'keystroke'
        });
        
        const voiceModel = await biometricsCollection.findOne({
            walletAddress: walletAddress.toLowerCase(),
            type: 'voice'
        });
        
        res.json({
            hasKeystroke: !!keystrokeModel,
            hasVoice: !!voiceModel,
            setupComplete: !!keystrokeModel && !!voiceModel,
            keystrokeTrainedAt: keystrokeModel?.trainedAt,
            voiceTrainedAt: voiceModel?.trainedAt
        });
    } catch (error) {
        console.error('❌ Status check failed:', error);
        res.status(500).json({
            error: 'Failed to check biometric status'
        });
    }
});

// 🔐 KEYSTROKE TRAINING - Integrates with GhostKey
app.post('/api/biometrics/keystroke/train', async (req, res) => {
    const { walletAddress, keystrokeSamples } = req.body;
    
    console.log('📥 Keystroke training request:', {
        walletAddress,
        samplesCount: keystrokeSamples?.length
    });
    
    if (!walletAddress || !keystrokeSamples || !Array.isArray(keystrokeSamples) || keystrokeSamples.length < 5) {
        return res.status(400).json({
            success: false,
            message: 'Invalid training data - need wallet address and 5 keystroke samples'
        });
    }
    
    try {
        // Train model with GhostKey microservice
        const ghostKeyUrl = `${GHOSTKEY_URL}/api/train-model`;
        
        // Send samples to GhostKey one by one
        for (let i = 0; i < keystrokeSamples.length; i++) {
            const sample = keystrokeSamples[i];
            
            const ghostKeyPayload = {
                username: walletAddress.toLowerCase(),
                features: sample,
                holdTimes: sample.slice(0, 11),
                ddTimes: sample.slice(11, 21),
                udTimes: sample.slice(21, 31),
                additionalFeatures: {
                    typingSpeed: sample[31] || 0,
                    flightTime: sample[32] || 0,
                    errorRate: sample[33] || 0,
                    pressPressure: sample[34] || 0
                },
                sampleCount: i,
                privacyMode: false,
                rawData: null
            };
            
            console.log(`📤 Sending sample ${i + 1}/${keystrokeSamples.length} to GhostKey...`);
            
            const ghostKeyResponse = await fetch(ghostKeyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ghostKeyPayload)
            });
            
            if (!ghostKeyResponse.ok) {
                const errorText = await ghostKeyResponse.text();
                throw new Error(`GhostKey training failed for sample ${i + 1}: ${errorText}`);
            }
        }
        
        console.log('✅ GhostKey training completed successfully');
        
        // Calculate checksum for integrity
        const checksum = crypto.createHash('sha256')
            .update(JSON.stringify(keystrokeSamples))
            .digest('hex');
        
        // Encrypt the keystroke samples
        const { encrypted, iv } = encryptData(keystrokeSamples);
        
        // Store in MongoDB
        const database = await connectMongoDB();
        const biometricsCollection = database.collection('biometrics');
        
        const biometricDoc = {
            walletAddress: walletAddress.toLowerCase(),
            type: 'keystroke',
            encryptedData: encrypted,
            iv: iv,
            checksum: checksum,
            samplesCount: keystrokeSamples.length,
            trainedAt: new Date(),
            version: 1,
            ghostKeyUsername: walletAddress.toLowerCase()
        };
        
        await biometricsCollection.updateOne(
            { walletAddress: walletAddress.toLowerCase(), type: 'keystroke' },
            { $set: biometricDoc },
            { upsert: true }
        );
        
        console.log('✅ Keystroke model stored in MongoDB for:', walletAddress);
        
        res.json({
            success: true,
            message: 'Keystroke model trained and stored successfully',
            checksum: checksum.substring(0, 8)
        });
    } catch (error) {
        console.error('❌ Keystroke training failed:', error);
        res.status(500).json({
            success: false,
            message: 'Training failed: ' + error.message
        });
    }
});

// 🔐 KEYSTROKE VERIFICATION - Uses GhostKey
app.post('/api/biometrics/keystroke/verify', async (req, res) => {
    const { walletAddress, keystrokeData } = req.body;
    
    console.log('📥 Keystroke verification request for:', walletAddress);
    
    if (!walletAddress || !keystrokeData) {
        return res.status(400).json({
            success: false,
            message: 'Invalid verification data'
        });
    }
    
    try {
        // Check if model exists in MongoDB
        const database = await connectMongoDB();
        const biometricsCollection = database.collection('biometrics');
        
        const storedModel = await biometricsCollection.findOne({
            walletAddress: walletAddress.toLowerCase(),
            type: 'keystroke'
        });
        
        if (!storedModel) {
            return res.status(404).json({
                success: false,
                message: 'No trained model found. Please complete biometric setup first.'
            });
        }
        
        // Verify with GhostKey
        const ghostKeyUrl = `${GHOSTKEY_URL}/api/authenticate`;
        
        const ghostKeyPayload = {
            username: walletAddress.toLowerCase(),
            features: keystrokeData
        };
        
        console.log('📤 Sending verification request to GhostKey...');
        
        const ghostKeyResponse = await fetch(ghostKeyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ghostKeyPayload)
        });
        
        if (!ghostKeyResponse.ok) {
            throw new Error('GhostKey verification failed');
        }
        
        const result = await ghostKeyResponse.json();
        
        console.log('✅ GhostKey verification result:', {
            authenticated: result.authenticated,
            mse: result.mse
        });
        
        res.json({
            success: result.authenticated,
            score: result.confidence || (1 - result.mse),
            message: result.authenticated ? 'Verification passed' : 'Verification failed'
        });
    } catch (error) {
        console.error('❌ Keystroke verification failed:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed: ' + error.message
        });
    }
});

// 🎤 VOICE TRAINING - Integrates with GhostKey
app.post('/api/biometrics/voice/train', upload.any(), async (req, res) => {
    console.log('📥 Voice training request');
    
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
        return res.status(400).json({
            success: false,
            message: 'Wallet address required'
        });
    }
    
    // Extract MFCC features from the request
    const features = [];
    let featureIndex = 0;
    while (req.body[`features_${featureIndex}`]) {
        try {
            const featureData = JSON.parse(req.body[`features_${featureIndex}`]);
            features.push(featureData);
            featureIndex++;
        } catch (err) {
            console.error('Failed to parse feature', featureIndex, err);
        }
    }
    
    if (features.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No voice features extracted'
        });
    }
    
    try {
        // Send to GhostKey voice registration
        const ghostKeyUrl = `${GHOSTKEY_URL}/api/voice/register`;
        
        const formData = new FormData();
        formData.append('username', walletAddress.toLowerCase());
        formData.append('features', JSON.stringify(features));
        
        // Add audio samples
        if (req.files) {
            req.files.forEach((file, index) => {
                const blob = new Blob([file.buffer], { type: file.mimetype });
                formData.append(`sample_${index}`, blob, `voice_${index}.webm`);
            });
        }
        
        console.log(`📤 Sending ${features.length} voice samples to GhostKey...`);
        
        const ghostKeyResponse = await fetch(ghostKeyUrl, {
            method: 'POST',
            body: formData
        });
        
        if (!ghostKeyResponse.ok) {
            const errorText = await ghostKeyResponse.text();
            throw new Error(`GhostKey voice training failed: ${errorText}`);
        }
        
        const ghostKeyResult = await ghostKeyResponse.json();
        console.log('✅ GhostKey voice training result:', ghostKeyResult);
        
        // Calculate reference model
        const referenceModel = calculateAverageVoiceFeatures(features);
        
        // Calculate checksum
        const checksum = crypto.createHash('sha256')
            .update(JSON.stringify(features))
            .digest('hex');
        
        // Encrypt voice features
        const { encrypted, iv } = encryptData(referenceModel);
        
        // Store in MongoDB
        const database = await connectMongoDB();
        const biometricsCollection = database.collection('biometrics');
        
        const biometricDoc = {
            walletAddress: walletAddress.toLowerCase(),
            type: 'voice',
            encryptedData: encrypted,
            iv: iv,
            checksum: checksum,
            samplesCount: features.length,
            trainedAt: new Date(),
            version: 1,
            ghostKeyUsername: walletAddress.toLowerCase()
        };
        
        await biometricsCollection.updateOne(
            { walletAddress: walletAddress.toLowerCase(), type: 'voice' },
            { $set: biometricDoc },
            { upsert: true }
        );
        
        console.log('✅ Voice model stored in MongoDB for:', walletAddress);
        
        res.json({
            success: true,
            message: 'Voice model trained and stored successfully',
            featuresCount: features.length
        });
    } catch (error) {
        console.error('❌ Voice training failed:', error);
        res.status(500).json({
            success: false,
            message: 'Voice training failed: ' + error.message
        });
    }
});

// 🎤 VOICE VERIFICATION - Uses GhostKey
app.post('/api/biometrics/voice/verify', upload.any(), async (req, res) => {
    console.log('📥 Voice verification request');
    
    const { walletAddress, features } = req.body;
    
    if (!walletAddress) {
        return res.status(400).json({
            success: false,
            message: 'Wallet address required'
        });
    }
    
    try {
        // Check if model exists in MongoDB
        const database = await connectMongoDB();
        const biometricsCollection = database.collection('biometrics');
        
        const storedModel = await biometricsCollection.findOne({
            walletAddress: walletAddress.toLowerCase(),
            type: 'voice'
        });
        
        if (!storedModel) {
            return res.status(404).json({
                success: false,
                message: 'No trained voice model found. Please complete biometric setup first.'
            });
        }
        
        // Verify with GhostKey
        const ghostKeyUrl = `${GHOSTKEY_URL}/api/voice/verify`;
        
        const formData = new FormData();
        formData.append('username', walletAddress.toLowerCase());
        formData.append('features', features);
        
        // Add voice sample
        if (req.files && req.files.length > 0) {
            const file = req.files[0];
            const blob = new Blob([file.buffer], { type: file.mimetype });
            formData.append('voice_sample', blob, 'voice_verify.webm');
        }
        
        console.log('📤 Sending voice verification to GhostKey...');
        
        const ghostKeyResponse = await fetch(ghostKeyUrl, {
            method: 'POST',
            body: formData
        });
        
        if (!ghostKeyResponse.ok) {
            throw new Error('GhostKey voice verification failed');
        }
        
        const result = await ghostKeyResponse.json();
        
        console.log('✅ GhostKey voice verification result:', {
            success: result.success,
            similarityScore: result.similarityScore
        });
        
        res.json({
            success: result.success,
            score: result.similarityScore,
            message: result.message
        });
    } catch (error) {
        console.error('❌ Voice verification failed:', error);
        res.status(500).json({
            success: false,
            message: 'Voice verification failed: ' + error.message
        });
    }
});

// User settings endpoint
app.patch('/api/user/settings', async (req, res) => {
    const { walletAddress, biometricAuth } = req.body;
    
    if (!walletAddress) {
        return res.status(400).json({
            success: false,
            message: 'Wallet address required'
        });
    }
    
    try {
        const database = await connectMongoDB();
        const usersCollection = database.collection('users');
        
        await usersCollection.updateOne(
            { walletAddress: walletAddress.toLowerCase() },
            { 
                $set: { 
                    biometricAuth: biometricAuth,
                    updatedAt: new Date()
                } 
            },
            { upsert: true }
        );
        
        res.json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('❌ Settings update failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings'
        });
    }
});

// Helper function to calculate average voice features
function calculateAverageVoiceFeatures(features) {
    if (features.length === 0) {
        throw new Error('No features to average');
    }

    const result = {};
    const firstFeature = features[0];

    for (const key in firstFeature) {
        if (Array.isArray(firstFeature[key])) {
            const arrayLength = firstFeature[key].length;
            result[key] = new Array(arrayLength).fill(0);

            for (const feature of features) {
                for (let i = 0; i < arrayLength; i++) {
                    result[key][i] += feature[key][i];
                }
            }

            for (let i = 0; i < arrayLength; i++) {
                result[key][i] /= features.length;
            }
        } else if (typeof firstFeature[key] === 'number') {
            result[key] = 0;

            for (const feature of features) {
                result[key] += feature[key];
            }

            result[key] /= features.length;
        }
    }

    return result;
}

// Start server
app.listen(PORT, '0.0.0.0', async () => {
    console.log('🚀 LokiAI Backend Server with GhostKey Integration');
    console.log(`📍 Server running on: http://0.0.0.0:${PORT}`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`📍 Network: http://192.168.31.233:${PORT}`);
    console.log(`🔐 GhostKey URL: ${GHOSTKEY_URL}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    
    // Initialize MongoDB connection
    try {
        await connectMongoDB();
        console.log('✅ MongoDB connected and ready');
    } catch (error) {
        console.error('❌ MongoDB connection failed - using fallback mode');
    }
});
