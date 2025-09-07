#!/usr/bin/env python3
"""
Chainflow Sentinel Backend Server - Python Fallback
A simple HTTP server for wallet verification and health checks
"""

import json
import time
import uuid
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import hashlib

class ChainflowHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        """Send CORS headers for cross-origin requests"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '3600')

    def _send_json_response(self, data, status_code=200):
        """Send JSON response with proper headers"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        """Handle preflight OPTIONS requests"""
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/health':
            self._send_json_response({
                'status': 'healthy',
                'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()),
                'message': 'Backend server is running (Python fallback)'
            })
        elif parsed_path.path == '/users':
            # Mock users data
            self._send_json_response([
                {
                    'id': 1,
                    'name': 'Demo User',
                    'email': 'demo@example.com',
                    'wallet_address': '0x742d35Cc6Cd3B7a8917fe5b3B8b3C9f5d5e5d9a'
                }
            ])
        else:
            self._send_json_response({'error': 'Not found'}, 404)

    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        
        if content_length > 0:
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
            except json.JSONDecodeError:
                self._send_json_response({'error': 'Invalid JSON'}, 400)
                return
        else:
            data = {}

        if parsed_path.path == '/challenge':
            wallet_address = data.get('walletAddress', '')
            if not wallet_address:
                self._send_json_response({'error': 'Wallet address is required'}, 400)
                return
            
            timestamp = int(time.time())
            nonce = str(uuid.uuid4())[:8]
            message = f"Please sign this message to verify your wallet ownership.\n\nWallet: {wallet_address}\nTimestamp: {timestamp}\nNonce: {nonce}"
            
            self._send_json_response({'message': message})

        elif parsed_path.path == '/verify-wallet':
            wallet_address = data.get('walletAddress', '')
            signature = data.get('signature', '')
            message = data.get('message', '')
            
            if not all([wallet_address, signature, message]):
                self._send_json_response({
                    'valid': False,
                    'message': 'Missing required fields'
                }, 400)
                return
            
            if not wallet_address.startswith('0x') or len(wallet_address) != 42:
                self._send_json_response({
                    'valid': False,
                    'message': 'Invalid wallet address format'
                }, 400)
                return
            
            # For demo purposes, return success
            # In production, you'd verify the signature using web3 libraries
            self._send_json_response({
                'valid': True,
                'message': 'Wallet signature verified successfully (demo mode)'
            })

        elif parsed_path.path == '/users':
            name = data.get('name', '')
            email = data.get('email', '')
            wallet_address = data.get('walletAddress')
            
            if not name or not email:
                self._send_json_response({'error': 'Name and email are required'}, 400)
                return
            
            new_user = {
                'id': int(time.time()),
                'name': name,
                'email': email,
                'wallet_address': wallet_address
            }
            
            self._send_json_response(new_user)

        else:
            self._send_json_response({'error': 'Not found'}, 404)

    def log_message(self, format, *args):
        """Custom log format"""
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

def run_server():
    """Start the HTTP server"""
    server_address = ('127.0.0.1', 25001)
    httpd = HTTPServer(server_address, ChainflowHandler)
    
    print("🚀 Starting Chainflow Sentinel Backend Server (Python)")
    print(f"📍 Server running on: http://127.0.0.1:25001")
    print("🔧 Mode: Standalone (no database required)")
    print("✅ Health check: http://127.0.0.1:25001/health")
    print("🛑 Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
