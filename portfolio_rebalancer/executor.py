#!/usr/bin/env python3
"""
Portfolio Rebalancer Agent Executor
Main entry point for running the portfolio rebalancer agent
"""

import sys
import os
import asyncio
import logging
from datetime import datetime, UTC
from typing import Dict, Any, Optional
import json
import requests
import smtplib
from email.mime.text import MIMEText

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from portfolio_analyzer import PortfolioAnalyzer
from rebalance_engine import RebalanceEngine
from mongo_client import MongoClient

# Configure logging (JSON to stdout)
try:
    from logging_config import configure_logging  # type: ignore
    configure_logging(service='lokiai-rebalancer')
except Exception:
    # Fallback to basic config
    logging.basicConfig(level=logging.INFO, handlers=[logging.StreamHandler(sys.stdout)])

logger = logging.getLogger(__name__)

class RebalancerExecutor:
    """Main executor class for the portfolio rebalancer agent"""
    
    def __init__(self, wallet_address: str, user_id: Optional[str] = None):
        self.wallet_address = wallet_address
        self.user_id = user_id or os.getenv('USER_ID')
        self.mongo_client = MongoClient()
        self.portfolio_analyzer = PortfolioAnalyzer(wallet_address)
        self.rebalance_engine = RebalanceEngine(wallet_address)
        
        logger.info(f"Initialized RebalancerExecutor for wallet: {wallet_address[:10]}...")
        
    async def run(self) -> Dict[str, Any]:
        """Main execution method"""
        try:
            logger.info("Starting portfolio rebalancer execution")
            
            # Step 1: Analyze current portfolio
            logger.info("Analyzing current portfolio...")
            portfolio_data = await self.portfolio_analyzer.analyze()
            
            if not portfolio_data:
                raise Exception("Failed to analyze portfolio - no data received")
            
            logger.info(f"Portfolio analyzed: {len(portfolio_data.get('assets', []))} assets found")
            
            # Step 2: Check if rebalancing is needed
            logger.info("Checking if rebalancing is needed...")
            rebalance_needed, recommendations = await self.rebalance_engine.evaluate_rebalance_need(portfolio_data)
            
            if not rebalance_needed:
                logger.info("No rebalancing needed - portfolio is already balanced")
                await self._log_to_mongo({
                    'action': 'REBALANCE_EVALUATION',
                    'message': 'No rebalancing needed - portfolio is already balanced',
                    'status': 'COMPLETED',
                    'recommendations': recommendations
                })
                return {
                    'success': True,
                    'action': 'no_rebalance_needed',
                    'message': 'Portfolio is already balanced',
                    'recommendations': recommendations
                }
            
            # Step 3: Execute rebalancing
            logger.info("Executing rebalancing strategy...")
            rebalance_result = await self.rebalance_engine.execute_rebalance(recommendations)
            
            if rebalance_result['success']:
                logger.info("Rebalancing completed successfully")
                await self._log_to_mongo({
                    'action': 'REBALANCE_EXECUTION',
                    'message': 'Portfolio rebalanced successfully',
                    'status': 'COMPLETED',
                    'transactions': rebalance_result.get('transactions', []),
                    'gas_used': rebalance_result.get('gas_used', 0),
                    'total_cost': rebalance_result.get('total_cost', 0)
                })
                
                # Send success notifications
                await self._send_notifications(
                    "success",
                    f"Portfolio Rebalanced Successfully! "
                    f"Wallet: {self.wallet_address[:6]}...{self.wallet_address[-4:]} | "
                    f"Trades: {rebalance_result.get('summary', {}).get('total_trades', 0)} | "
                    f"Gas Cost: ${rebalance_result.get('total_cost', 0):.2f}"
                )
            else:
                logger.error(f"Rebalancing failed: {rebalance_result.get('error', 'Unknown error')}")
                await self._log_to_mongo({
                    'action': 'REBALANCE_EXECUTION',
                    'message': f"Rebalancing failed: {rebalance_result.get('error', 'Unknown error')}",
                    'status': 'FAILED',
                    'error': rebalance_result.get('error')
                })
                
                # Send failure notifications
                await self._send_notifications(
                    "failure",
                    f"Portfolio Rebalancing Failed! "
                    f"Wallet: {self.wallet_address[:6]}...{self.wallet_address[-4:]} | "
                    f"Error: {rebalance_result.get('error', 'Unknown error')}"
                )
            
            # Attach analysis and recommendations for backend persistence
            try:
                rebalance_result['recommendations'] = [r.__dict__ if hasattr(r, '__dict__') else r for r in recommendations]
            except Exception:
                rebalance_result['recommendations'] = []
            if isinstance(portfolio_data, dict):
                if 'asset_distribution' in portfolio_data:
                    rebalance_result['asset_distribution'] = portfolio_data.get('asset_distribution')
                if 'allocation_analysis' in portfolio_data:
                    rebalance_result['allocation_analysis'] = portfolio_data.get('allocation_analysis')
            
            return rebalance_result
            
        except Exception as e:
            error_msg = f"Rebalancer execution failed: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            await self._log_to_mongo({
                'action': 'REBALANCE_ERROR',
                'message': error_msg,
                'status': 'FAILED',
                'error': str(e)
            })
            
            return {
                'success': False,
                'error': str(e),
                'message': error_msg
            }
    
    async def _log_to_mongo(self, log_data: Dict[str, Any]):
        """Log execution data to MongoDB"""
        try:
            log_entry = {
                'userId': self.user_id,
                'walletAddress': self.wallet_address,
                'timestamp': datetime.now(UTC),
                **log_data
            }
            
            await self.mongo_client.log_rebalancer_activity(log_entry)
            
        except Exception as e:
            logger.error(f"Failed to log to MongoDB: {str(e)}")
    
    async def _send_notifications(self, status: str, message: str):
        """Send notifications to all configured channels"""
        try:
            # Telegram
            if os.getenv('TELEGRAM_BOT_TOKEN') and os.getenv('TELEGRAM_CHAT_ID'):
                try:
                    url = f"https://api.telegram.org/bot{os.getenv('TELEGRAM_BOT_TOKEN')}/sendMessage"
                    data = {"chat_id": os.getenv('TELEGRAM_CHAT_ID'), "text": message}
                    requests.post(url, data=data, timeout=5)
                    logger.info("Telegram notification sent")
                except Exception as e:
                    logger.error(f"Failed to send Telegram: {e}")
            
            # Discord
            if os.getenv('DISCORD_WEBHOOK_URL'):
                try:
                    webhook_url = os.getenv('DISCORD_WEBHOOK_URL').replace('discordapp.com', 'discord.com')
                    requests.post(webhook_url, json={"content": message}, timeout=5)
                    logger.info("Discord notification sent")
                except Exception as e:
                    logger.error(f"Failed to send Discord: {e}")
            
            # Email
            if os.getenv('EMAIL_USER') and os.getenv('EMAIL_PASS') and os.getenv('EMAIL_TO'):
                try:
                    msg = MIMEText(message)
                    msg['Subject'] = f"LokiAI Rebalancer - {status.upper()}"
                    msg['From'] = os.getenv('EMAIL_USER')
                    msg['To'] = os.getenv('EMAIL_TO')
                    
                    server = smtplib.SMTP(os.getenv('EMAIL_SMTP', 'smtp.gmail.com'), 587)
                    server.starttls()
                    server.login(os.getenv('EMAIL_USER'), os.getenv('EMAIL_PASS'))
                    server.sendmail(os.getenv('EMAIL_USER'), os.getenv('EMAIL_TO'), msg.as_string())
                    server.quit()
                    logger.info("Email notification sent")
                except Exception as e:
                    logger.error(f"Failed to send Email: {e}")
                    
        except Exception as e:
            logger.error(f"Failed to send notifications: {e}")
    
    async def cleanup(self):
        """Cleanup resources"""
        try:
            await self.mongo_client.close()
            await self.portfolio_analyzer.cleanup()
            await self.rebalance_engine.cleanup()
            logger.info("Cleanup completed")
        except Exception as e:
            logger.error(f"Cleanup failed: {str(e)}")

async def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python -m executor <wallet_address>", file=sys.stderr)
        sys.exit(1)
    
    wallet_address = sys.argv[1]
    user_id = os.getenv('USER_ID')
    
    executor = RebalancerExecutor(wallet_address, user_id)
    
    try:
        result = await executor.run()
        
        # Output result as JSON for the Node.js backend to capture
        print(json.dumps(result, indent=2, default=str))
        
        # Exit with appropriate code
        sys.exit(0 if result.get('success', False) else 1)
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'message': f"Fatal error in rebalancer execution: {str(e)}"
        }
        
        print(json.dumps(error_result, indent=2), file=sys.stderr)
        sys.exit(1)
        
    finally:
        await executor.cleanup()

if __name__ == "__main__":
    # Start metrics server
    try:
        from metrics import start_metrics_server  # type: ignore
        port = start_metrics_server()
        logger.info(f"Prometheus metrics server started on :{port}")
    except Exception as e:
        logger.warning(f"Failed to start metrics server: {e}")

    asyncio.run(main())
