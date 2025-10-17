/**
 * Minimal Test Server
 */

import express from 'express';
import cors from 'cors';
import agentsRouter from './routes/agents.js';

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Mount agents routes
app.use('/api/agents', agentsRouter);

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 404 handler
app.use((req, res) => {
    console.log('404 - Route not found:', req.method, req.path);
    res.status(404).json({ error: 'Route not found', path: req.path, method: req.method });
});

app.listen(PORT, () => {
    console.log(`🧪 Test server running on http://localhost:${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/health`);
    console.log(`📍 Agents: http://localhost:${PORT}/api/agents/status`);
});