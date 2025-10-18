/**
 * Simple System Test - No External Dependencies
 * Tests basic connectivity to services
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const http = require('http');

const BASE_URL = 'localhost';
const BACKEND_PORT = 5000;
const REBALANCER_PORT = 5001;
const MONGODB_PORT = 27017;

function testHTTP(host, port, path = '/health') {
    return new Promise((resolve) => {
        const options = {
            hostname: host,
            port: port,
            path: path,
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ success: true, status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ success: true, status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (err) => {
            resolve({ success: false, error: err.message });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ success: false, error: 'Timeout' });
        });

        req.end();
    });
}

function testTCP(host, port) {
    return new Promise((resolve) => {
        const net = require('net');
        const socket = new net.Socket();
        
        socket.setTimeout(3000);
        
        socket.connect(port, host, () => {
            socket.destroy();
            resolve({ success: true });
        });
        
        socket.on('error', (err) => {
            resolve({ success: false, error: err.message });
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            resolve({ success: false, error: 'Timeout' });
        });
    });
}

async function runSimpleTests() {
    console.log('🧪 Simple System Test - No Dependencies Required\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    // Test 1: Backend Health
    totalTests++;
    console.log('1. Testing Backend Health...');
    try {
        const result = await testHTTP(BASE_URL, BACKEND_PORT, '/health');
        if (result.success && result.status === 200) {
            console.log('✅ Backend Health: PASSED');
            console.log(`   Status: ${result.data?.status || 'healthy'}`);
            passedTests++;
        } else {
            console.log('❌ Backend Health: FAILED');
            console.log(`   Error: ${result.error || 'HTTP ' + result.status}`);
        }
    } catch (error) {
        console.log('❌ Backend Health: FAILED');
        console.log(`   Error: ${error.message}`);
    }
    
    // Test 2: Rebalancer API Health
    totalTests++;
    console.log('\n2. Testing Rebalancer API...');
    try {
        const result = await testHTTP(BASE_URL, REBALANCER_PORT, '/api/health');
        if (result.success && result.status === 200) {
            console.log('✅ Rebalancer API: PASSED');
            console.log(`   Status: ${result.data?.status || 'healthy'}`);
            passedTests++;
        } else {
            console.log('❌ Rebalancer API: FAILED');
            console.log(`   Error: ${result.error || 'HTTP ' + result.status}`);
        }
    } catch (error) {
        console.log('❌ Rebalancer API: FAILED');
        console.log(`   Error: ${error.message}`);
    }
    
    // Test 3: MongoDB Connection
    totalTests++;
    console.log('\n3. Testing MongoDB Connection...');
    try {
        const result = await testTCP(BASE_URL, MONGODB_PORT);
        if (result.success) {
            console.log('✅ MongoDB: PASSED');
            console.log('   Port 27017 is accessible');
            passedTests++;
        } else {
            console.log('❌ MongoDB: FAILED');
            console.log(`   Error: ${result.error}`);
        }
    } catch (error) {
        console.log('❌ MongoDB: FAILED');
        console.log(`   Error: ${error.message}`);
    }
    
    // Test 4: Agent Status Endpoint
    totalTests++;
    console.log('\n4. Testing Agent Status Endpoint...');
    try {
        const result = await testHTTP(BASE_URL, BACKEND_PORT, '/api/agents/status?wallet=0x123');
        if (result.success && result.status === 200) {
            console.log('✅ Agent Status: PASSED');
            console.log(`   Agents found: ${result.data?.agents?.length || 'unknown'}`);
            passedTests++;
        } else {
            console.log('❌ Agent Status: FAILED');
            console.log(`   Error: ${result.error || 'HTTP ' + result.status}`);
        }
    } catch (error) {
        console.log('❌ Agent Status: FAILED');
        console.log(`   Error: ${error.message}`);
    }
    
    // Test 5: Docker Services Check
    totalTests++;
    console.log('\n5. Checking Docker Services...');
    try {
        const { exec } = require('child_process');
        const dockerCheck = new Promise((resolve) => {
            exec('docker ps --format "table {{.Names}}\\t{{.Status}}"', (error, stdout, stderr) => {
                if (error) {
                    resolve({ success: false, error: error.message });
                } else {
                    const services = stdout.split('\n').filter(line => 
                        line.includes('lokiai') || line.includes('backend') || line.includes('mongodb') || line.includes('rebalancer')
                    );
                    resolve({ success: true, services: services.length, output: stdout });
                }
            });
        });
        
        const result = await dockerCheck;
        if (result.success && result.services > 0) {
            console.log('✅ Docker Services: PASSED');
            console.log(`   Running containers: ${result.services}`);
            passedTests++;
        } else {
            console.log('❌ Docker Services: FAILED');
            console.log(`   Error: ${result.error || 'No LokiAI containers found'}`);
        }
    } catch (error) {
        console.log('❌ Docker Services: FAILED');
        console.log(`   Error: ${error.message}`);
    }
    
    // Results Summary
    console.log('\n========================================');
    console.log('🧪 Simple Test Results');
    console.log('========================================');
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED - System is working!');
        console.log('🚀 Ready to test with full system');
        console.log('');
        console.log('🎯 Next Steps:');
        console.log('1. Install dependencies: npm install');
        console.log('2. Run full test: npm run test');
        console.log('3. Open frontend: http://localhost:5173');
    } else if (passedTests >= 3) {
        console.log('⚠️ Most tests passed - System is mostly working');
        console.log('🔧 Minor issues detected, but core services are up');
    } else {
        console.log('❌ Multiple tests failed - System needs attention');
        console.log('🔧 Run Docker rebuild: .\\docker-rebuild-all.ps1');
    }
    
    console.log('\n🌐 Service URLs:');
    console.log(`- Backend: http://localhost:${BACKEND_PORT}/health`);
    console.log(`- Rebalancer: http://localhost:${REBALANCER_PORT}/api/health`);
    console.log(`- Frontend: http://localhost:5173`);
    console.log('========================================\n');
}

// Run the simple test
runSimpleTests().catch(console.error);