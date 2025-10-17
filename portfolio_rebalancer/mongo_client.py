"""
MongoDB Client for Portfolio Rebalancer Agent
Handles database operations for logging and data storage
"""

import os
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from functools import wraps
import motor.motor_asyncio
from pymongo.errors import ConnectionFailure, OperationFailure, ServerSelectionTimeoutError, NetworkTimeout

logger = logging.getLogger(__name__)

def retry_on_failure(max_retries: int = 3, delay: float = 1.0, backoff_factor: float = 2.0):
    """Decorator to retry database operations on failure"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except (ConnectionFailure, ServerSelectionTimeoutError, NetworkTimeout, OperationFailure) as e:
                    last_exception = e
                    if attempt == max_retries - 1:
                        logger.error(f"Operation {func.__name__} failed after {max_retries} attempts: {str(e)}")
                        break
                    
                    wait_time = delay * (backoff_factor ** attempt)
                    logger.warning(f"Operation {func.__name__} failed (attempt {attempt + 1}/{max_retries}), retrying in {wait_time}s: {str(e)}")
                    await asyncio.sleep(wait_time)
                except Exception as e:
                    # Don't retry on unexpected errors
                    logger.error(f"Unexpected error in {func.__name__}: {str(e)}")
                    raise
            
            # If we get here, all retries failed
            raise last_exception
        return wrapper
    return decorator

class MongoClient:
    """MongoDB client for rebalancer agent"""
    
    def __init__(self):
        # Prefer explicit DB name env var; do not append or parse DB from URI
        self.mongo_uri = os.getenv('MONGODB_URI') or os.getenv('MONGO_URI') or 'mongodb://localhost:27017'
        
        # Fix DB name parsing - strip any database name from URI if present
        if self.mongo_uri.count('/') > 2:  # Has database name in URI
            uri_parts = self.mongo_uri.rsplit('/', 1)
            if len(uri_parts) == 2 and uri_parts[1] and not uri_parts[1].startswith('?'):
                # Database name found in URI, extract base URI
                self.mongo_uri = uri_parts[0]
                logger.debug(f"Stripped database name from URI, using base: {self.mongo_uri}")
        
        self.db_name = os.getenv('MONGO_DB_NAME', 'lokiai')
        self.client = None
        self.db = None
        self._connected = False
        
    async def connect(self):
        """Connect to MongoDB"""
        try:
            if not self._connected:
                self.client = motor.motor_asyncio.AsyncIOMotorClient(self.mongo_uri)
                self.db = self.client[self.db_name]
                # Test connection
                await self.client.admin.command('ping')
                self._connected = True
                logger.info(f"Connected to MongoDB database '{self.db_name}'")
                
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error connecting to MongoDB: {str(e)}")
            raise
        
    async def _ensure_connected(self):
        """Ensure we're connected to MongoDB"""
        if not self._connected:
            await self.connect()
    
    @retry_on_failure(max_retries=3, delay=1.0)
    async def log_rebalancer_activity(self, log_data: Dict[str, Any]) -> Optional[str]:
        """Log rebalancer activity to MongoDB with retry logic"""
        await self._ensure_connected()
        
        # Prepare log document
        log_doc = {
            **log_data,
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        
        # Insert into rebalancerlogs collection
        result = await self.db.rebalancerlogs.insert_one(log_doc)
        
        logger.debug(f"Logged rebalancer activity: {result.inserted_id}")
        return str(result.inserted_id)
    
    @retry_on_failure(max_retries=3, delay=1.0)
    async def update_portfolio(self, user_id: str, portfolio_data: Dict[str, Any]) -> bool:
        """Update portfolio data in MongoDB with retry logic"""
        await self._ensure_connected()
        
        # Prepare portfolio document
        portfolio_doc = {
            'userId': user_id,
            'assets': portfolio_data.get('assets', []),
            'totalValue': portfolio_data.get('total_value', 0),
            'totalPnL': portfolio_data.get('total_pnl', 0),
            'totalPnLPercentage': portfolio_data.get('total_pnl_percentage', 0),
            'lastUpdated': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        
        # Upsert portfolio document
        result = await self.db.portfolios.update_one(
            {'userId': user_id},
            {'$set': portfolio_doc},
            upsert=True
        )
        
        logger.debug(f"Updated portfolio for user {user_id}: modified={result.modified_count}, upserted={result.upserted_id}")
        return True
    
    async def get_portfolio(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get portfolio data from MongoDB"""
        try:
            await self._ensure_connected()
            
            portfolio = await self.db.portfolios.find_one({'userId': user_id})
            
            if portfolio:
                # Convert ObjectId to string
                portfolio['_id'] = str(portfolio['_id'])
                logger.debug(f"Retrieved portfolio for user {user_id}")
                return portfolio
            else:
                logger.debug(f"No portfolio found for user {user_id}")
                return None
                
        except OperationFailure as e:
            logger.error(f"Failed to get portfolio: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting portfolio: {str(e)}")
            return None
    
    @retry_on_failure(max_retries=3, delay=1.0)
    async def log_trade(self, trade_data: Dict[str, Any]) -> Optional[str]:
        """Log trade execution to MongoDB with retry logic"""
        await self._ensure_connected()
        
        # Prepare trade log document
        trade_doc = {
            **trade_data,
            'timestamp': datetime.utcnow(),
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        
        # Insert into tradelogs collection
        result = await self.db.tradelogs.insert_one(trade_doc)
        
        logger.debug(f"Logged trade: {result.inserted_id}")
        return str(result.inserted_id)
    
    # Safe wrapper methods that handle exceptions gracefully
    async def safe_log_rebalancer_activity(self, log_data: Dict[str, Any]) -> Optional[str]:
        """Safe wrapper for log_rebalancer_activity"""
        try:
            return await self.log_rebalancer_activity(log_data)
        except Exception as e:
            logger.error(f"Failed to log rebalancer activity after retries: {str(e)}")
            return None
    
    async def safe_update_portfolio(self, user_id: str, portfolio_data: Dict[str, Any]) -> bool:
        """Safe wrapper for update_portfolio"""
        try:
            return await self.update_portfolio(user_id, portfolio_data)
        except Exception as e:
            logger.error(f"Failed to update portfolio after retries: {str(e)}")
            return False
    
    async def safe_log_trade(self, trade_data: Dict[str, Any]) -> Optional[str]:
        """Safe wrapper for log_trade"""
        try:
            return await self.log_trade(trade_data)
        except Exception as e:
            logger.error(f"Failed to log trade after retries: {str(e)}")
            return None
    
    async def get_recent_rebalancer_logs(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent rebalancer logs for a user"""
        try:
            await self._ensure_connected()
            
            cursor = self.db.rebalancerlogs.find(
                {'userId': user_id}
            ).sort('timestamp', -1).limit(limit)
            
            logs = []
            async for log in cursor:
                log['_id'] = str(log['_id'])
                logs.append(log)
            
            logger.debug(f"Retrieved {len(logs)} rebalancer logs for user {user_id}")
            return logs
            
        except OperationFailure as e:
            logger.error(f"Failed to get rebalancer logs: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error getting logs: {str(e)}")
            return []
    
    async def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user statistics from database"""
        try:
            await self._ensure_connected()
            
            # Get portfolio stats
            portfolio = await self.get_portfolio(user_id)
            portfolio_value = portfolio.get('totalValue', 0) if portfolio else 0
            
            # Get trade stats
            trade_stats = await self.db.tradelogs.aggregate([
                {'$match': {'userId': user_id, 'status': 'EXECUTED'}},
                {'$group': {
                    '_id': None,
                    'totalTrades': {'$sum': 1},
                    'totalVolume': {'$sum': '$toAmount'},
                    'totalPnL': {'$sum': '$pnl'},
                    'avgPnL': {'$avg': '$pnl'},
                    'totalGasCost': {'$sum': '$gasCost'},
                    'successfulTrades': {
                        '$sum': {'$cond': [{'$gt': ['$pnl', 0]}, 1, 0]}
                    }
                }}
            ]).to_list(1)
            
            trade_data = trade_stats[0] if trade_stats else {
                'totalTrades': 0,
                'totalVolume': 0,
                'totalPnL': 0,
                'avgPnL': 0,
                'totalGasCost': 0,
                'successfulTrades': 0
            }
            
            # Get rebalancer activity stats
            rebalancer_stats = await self.db.rebalancerlogs.aggregate([
                {'$match': {'userId': user_id}},
                {'$group': {
                    '_id': None,
                    'totalRebalances': {'$sum': 1},
                    'lastActivity': {'$max': '$timestamp'}
                }}
            ]).to_list(1)
            
            rebalancer_data = rebalancer_stats[0] if rebalancer_stats else {
                'totalRebalances': 0,
                'lastActivity': None
            }
            
            stats = {
                'portfolio': {
                    'totalValue': portfolio_value,
                    'assets': len(portfolio.get('assets', [])) if portfolio else 0
                },
                'trading': trade_data,
                'rebalancing': rebalancer_data,
                'lastUpdated': datetime.utcnow()
            }
            
            logger.debug(f"Generated user stats for {user_id}")
            return stats
            
        except Exception as e:
            logger.error(f"Error getting user stats: {str(e)}")
            return {
                'portfolio': {'totalValue': 0, 'assets': 0},
                'trading': {'totalTrades': 0, 'totalVolume': 0, 'totalPnL': 0, 'avgPnL': 0, 'totalGasCost': 0, 'successfulTrades': 0},
                'rebalancing': {'totalRebalances': 0, 'lastActivity': None},
                'lastUpdated': datetime.utcnow(),
                'error': str(e)
            }
    
    async def cleanup_old_logs(self, days: int = 30) -> int:
        """Cleanup old logs to save space"""
        try:
            await self._ensure_connected()
            
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Remove old rebalancer logs
            result = await self.db.rebalancerlogs.delete_many({
                'timestamp': {'$lt': cutoff_date}
            })
            
            deleted_count = result.deleted_count
            logger.info(f"Cleaned up {deleted_count} old rebalancer logs")
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up logs: {str(e)}")
            return 0
    
    async def close(self):
        """Close MongoDB connection"""
        try:
            if self.client:
                self.client.close()
                self._connected = False
                logger.info("MongoDB connection closed")
                
        except Exception as e:
            logger.error(f"Error closing MongoDB connection: {str(e)}")
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()

# Convenience function for quick operations
async def log_activity(user_id: str, activity_data: Dict[str, Any]) -> bool:
    """Quick function to log activity"""
    try:
        async with MongoClient() as client:
            result = await client.log_rebalancer_activity({
                'userId': user_id,
                **activity_data
            })
            return result is not None
    except Exception as e:
        logger.error(f"Failed to log activity: {str(e)}")
        return False