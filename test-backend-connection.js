/**
 * Test Backend Connection
 * Quick test to see if backend is responding
 */

import fetch from 'node-fetch';

async function testConnection() {
    console.log('🧪 Testing Backend Connection...\n');
    
    const tests = [
        { name: 'Health Check', url: 'http://localhost:5000/health' },
        { name: 'Agent Status', url: 'http://localhost:5000/api/agents/status?wallet=0x123' },
        { name: 'Rebalancer API', url: 'http://localhost:5001/api/health' }
    ];
    
    for (const test of tests) {
        try {
            console.log(`Testing ${test.name}...`);
            const response = await fetch(test.url, { timeout: 5000 });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${test.name}: WORKING`);
                console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 200));
            } else {
                console.log(`❌ ${test.name}: HTTP ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ ${test.name}: ${error.message}`);
        }
        console.log('');
    }
    
    // Test Socket.IO connection
    console.log('Testing Socket.IO connection...');
    try {
        const { io } = await import('socket.io-client');
        const socket = io('http://localhost:5000', {
            timeout: 5000,
            transports: ['websocket', 'polling']
        });
        
        socket.on('connect', () => {
            console.log('✅ Socket.IO: CONNECTED');
            socket.disconnect();
        });
        
        socket.on('connect_error', (error) => {
            console.log('❌ Socket.IO: CONNECTION FAILED -', error.message);
        });
        
        // Wait a bit for connection
        await new Promise(resolve => setTimeout(resolve, 3000));
        
    } catch (error) {
        console.log('❌ Socket.IO: IMPORT ERROR -', error.message);
    }
}

testConnection().catch(console.error);