"""
Rebalance Engine Module
Handles portfolio rebalancing logic and execution
"""

import asyncio
import logging
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
import json

logger = logging.getLogger(__name__)

@dataclass
class RebalanceRecommendation:
    """Represents a rebalancing recommendation"""
    from_asset: str
    to_asset: str
    from_chain: str
    to_chain: str
    amount: float
    percentage: float
    reason: str
    priority: int  # 1=high, 2=medium, 3=low
    estimated_gas: float = 0.0
    estimated_slippage: float = 0.0

@dataclass
class RebalanceTransaction:
    """Represents a rebalancing transaction"""
    tx_hash: Optional[str]
    from_asset: str
    to_asset: str
    amount: float
    chain: str
    status: str  # 'pending', 'confirmed', 'failed'
    gas_used: float = 0.0
    gas_cost: float = 0.0
    timestamp: datetime = None

class RebalanceEngine:
    """Handles portfolio rebalancing logic and execution"""
    
    # Rebalancing thresholds
    REBALANCE_THRESHOLD = 5.0  # Minimum percentage deviation to trigger rebalance
    MAX_SINGLE_ASSET_ALLOCATION = 30.0  # Maximum allocation for single asset
    MIN_ASSET_ALLOCATION = 2.0  # Minimum allocation to maintain
    
    # Target allocations (can be user-defined in future)
    DEFAULT_TARGET_ALLOCATIONS = {
        'ETH': 25.0,
        'BTC': 20.0,
        'USDC': 15.0,
        'MATIC': 10.0,
        'LINK': 10.0,
        'BNB': 10.0,
        'OTHER': 10.0
    }
    
    def __init__(self, wallet_address: str):
        self.wallet_address = wallet_address
        self.target_allocations = self.DEFAULT_TARGET_ALLOCATIONS.copy()
        
    async def evaluate_rebalance_need(self, portfolio_data: Dict[str, Any]) -> Tuple[bool, List[RebalanceRecommendation]]:
        """Evaluate if rebalancing is needed and generate recommendations"""
        try:
            logger.info("Evaluating rebalance need...")
            
            assets = portfolio_data.get('assets', [])
            if not assets:
                return False, []
            
            # Calculate current allocations
            current_allocations = self._calculate_current_allocations(assets)
            
            # Compare with target allocations
            deviations = self._calculate_allocation_deviations(current_allocations)
            
            # Generate recommendations
            recommendations = await self._generate_recommendations(assets, current_allocations, deviations)
            
            # Determine if rebalancing is needed
            rebalance_needed = any(
                abs(deviation) > self.REBALANCE_THRESHOLD 
                for deviation in deviations.values()
            )
            
            logger.info(f"Rebalance evaluation: needed={rebalance_needed}, recommendations={len(recommendations)}")
            
            return rebalance_needed, recommendations
            
        except Exception as e:
            logger.error(f"Error evaluating rebalance need: {str(e)}", exc_info=True)
            return False, []
    
    def _calculate_current_allocations(self, assets: List[Dict]) -> Dict[str, float]:
        """Calculate current portfolio allocations"""
        total_value = sum(asset.get('value', 0) for asset in assets)
        
        if total_value == 0:
            return {}
        
        allocations = {}
        for asset in assets:
            symbol = asset.get('symbol', '')
            value = asset.get('value', 0)
            allocation = (value / total_value) * 100
            
            # Group small assets under 'OTHER'
            if allocation < self.MIN_ASSET_ALLOCATION and symbol not in self.target_allocations:
                allocations['OTHER'] = allocations.get('OTHER', 0) + allocation
            else:
                allocations[symbol] = allocation
        
        return allocations
    
    def _calculate_allocation_deviations(self, current_allocations: Dict[str, float]) -> Dict[str, float]:
        """Calculate deviations from target allocations"""
        deviations = {}
        
        for symbol, target in self.target_allocations.items():
            current = current_allocations.get(symbol, 0)
            deviation = current - target
            deviations[symbol] = deviation
        
        return deviations
    
    async def _generate_recommendations(
        self, 
        assets: List[Dict], 
        current_allocations: Dict[str, float], 
        deviations: Dict[str, float]
    ) -> List[RebalanceRecommendation]:
        """Generate rebalancing recommendations"""
        
        recommendations = []
        
        # Find assets that are over-allocated (need to sell)
        over_allocated = {symbol: dev for symbol, dev in deviations.items() if dev > self.REBALANCE_THRESHOLD}
        
        # Find assets that are under-allocated (need to buy)
        under_allocated = {symbol: dev for symbol, dev in deviations.items() if dev < -self.REBALANCE_THRESHOLD}
        
        if not over_allocated or not under_allocated:
            return recommendations
        
        # Generate recommendations to move from over-allocated to under-allocated
        for over_symbol, over_deviation in over_allocated.items():
            for under_symbol, under_deviation in under_allocated.items():
                
                # Calculate recommended trade amount
                trade_percentage = min(abs(over_deviation), abs(under_deviation)) / 2
                
                if trade_percentage < 1.0:  # Skip very small trades
                    continue
                
                # Find the actual assets
                from_asset = self._find_asset_by_symbol(assets, over_symbol)
                to_asset_symbol = under_symbol
                
                if not from_asset:
                    continue
                
                trade_amount = (from_asset.get('value', 0) * trade_percentage) / 100
                
                # Determine chains (prefer same chain for lower gas costs)
                from_chain = from_asset.get('chain', 'ethereum')
                to_chain = self._get_preferred_chain_for_asset(to_asset_symbol, from_chain)
                
                # Calculate priority (higher deviation = higher priority)
                priority = 1 if trade_percentage > 10 else (2 if trade_percentage > 5 else 3)
                
                recommendation = RebalanceRecommendation(
                    from_asset=over_symbol,
                    to_asset=under_symbol,
                    from_chain=from_chain,
                    to_chain=to_chain,
                    amount=trade_amount,
                    percentage=trade_percentage,
                    reason=f"Rebalance {over_symbol} (over by {over_deviation:.1f}%) to {under_symbol} (under by {abs(under_deviation):.1f}%)",
                    priority=priority,
                    estimated_gas=self._estimate_gas_cost(from_chain, to_chain),
                    estimated_slippage=self._estimate_slippage(trade_amount)
                )
                
                recommendations.append(recommendation)
        
        # Sort by priority and potential impact
        recommendations.sort(key=lambda x: (x.priority, -x.percentage))
        
        # Limit to top 5 recommendations to avoid over-trading
        return recommendations[:5]
    
    def _find_asset_by_symbol(self, assets: List[Dict], symbol: str) -> Optional[Dict]:
        """Find asset by symbol in the portfolio"""
        for asset in assets:
            if asset.get('symbol') == symbol:
                return asset
        return None
    
    def _get_preferred_chain_for_asset(self, asset_symbol: str, preferred_chain: str) -> str:
        """Get the preferred chain for an asset"""
        # Simple chain preference logic
        chain_preferences = {
            'ETH': 'ethereum',
            'USDC': 'ethereum',  # Available on multiple chains, prefer Ethereum
            'MATIC': 'polygon',
            'BNB': 'bsc',
            'LINK': 'ethereum',
            'BTC': 'ethereum',  # Wrapped BTC
        }
        
        preferred = chain_preferences.get(asset_symbol, preferred_chain)
        return preferred
    
    def _estimate_gas_cost(self, from_chain: str, to_chain: str) -> float:
        """Estimate gas cost for the transaction"""
        # Simple gas estimation (in USD)
        base_costs = {
            'ethereum': 15.0,
            'polygon': 0.5,
            'bsc': 1.0,
            'arbitrum': 2.0,
            'optimism': 2.0
        }
        
        from_cost = base_costs.get(from_chain, 10.0)
        to_cost = base_costs.get(to_chain, 10.0) if to_chain != from_chain else 0
        
        # Cross-chain transactions cost more
        cross_chain_multiplier = 2.0 if from_chain != to_chain else 1.0
        
        return (from_cost + to_cost) * cross_chain_multiplier
    
    def _estimate_slippage(self, trade_amount: float) -> float:
        """Estimate slippage for the trade"""
        # Simple slippage estimation based on trade size
        if trade_amount < 100:
            return 0.1  # 0.1%
        elif trade_amount < 1000:
            return 0.3  # 0.3%
        elif trade_amount < 10000:
            return 0.5  # 0.5%
        else:
            return 1.0  # 1.0%
    
    async def execute_rebalance(self, recommendations: List[RebalanceRecommendation]) -> Dict[str, Any]:
        """Execute rebalancing based on recommendations"""
        try:
            logger.info(f"Starting rebalance execution with {len(recommendations)} recommendations")
            
            transactions = []
            total_gas_used = 0.0
            total_gas_cost = 0.0
            successful_trades = 0
            failed_trades = 0
            
            from time import perf_counter
            for i, rec in enumerate(recommendations):
                logger.info(f"Executing trade {i+1}/{len(recommendations)}: {rec.from_asset} -> {rec.to_asset}")

                # Metrics timer
                try:
                    from metrics import TRADE_EXECUTION_SECONDS  # type: ignore
                    timer = TRADE_EXECUTION_SECONDS.labels(agent='rebalancer').time()
                except Exception:
                    timer = None
                
                # Simulate trade execution (in production, this would interact with DEX/bridges)
                start = perf_counter()
                trade_result = await self._execute_single_trade(rec)
                duration = perf_counter() - start
                if timer:
                    try:
                        timer.observe(duration)
                    except Exception:
                        pass
                
                if trade_result['success']:
                    successful_trades += 1
                    total_gas_used += trade_result.get('gas_used', 0)
                    total_gas_cost += trade_result.get('gas_cost', 0)

                    try:
                        from metrics import TRADES_TOTAL, GAS_COST_USD_TOTAL  # type: ignore
                        TRADES_TOTAL.labels(agent='rebalancer', status='success').inc()
                        GAS_COST_USD_TOTAL.labels(agent='rebalancer').inc(trade_result.get('gas_cost', 0))
                    except Exception:
                        pass
                    
                    transaction = RebalanceTransaction(
                        tx_hash=trade_result.get('tx_hash'),
                        from_asset=rec.from_asset,
                        to_asset=rec.to_asset,
                        amount=rec.amount,
                        chain=rec.from_chain,
                        status='confirmed',
                        gas_used=trade_result.get('gas_used', 0),
                        gas_cost=trade_result.get('gas_cost', 0),
                        timestamp=datetime.utcnow()
                    )
                    
                    logger.info(f"Trade successful: {rec.from_asset} -> {rec.to_asset}, gas: ${trade_result.get('gas_cost', 0):.2f}")
                else:
                    failed_trades += 1

                    try:
                        from metrics import TRADES_TOTAL  # type: ignore
                        TRADES_TOTAL.labels(agent='rebalancer', status='failed').inc()
                    except Exception:
                        pass
                    
                    transaction = RebalanceTransaction(
                        tx_hash=None,
                        from_asset=rec.from_asset,
                        to_asset=rec.to_asset,
                        amount=rec.amount,
                        chain=rec.from_chain,
                        status='failed',
                        timestamp=datetime.utcnow()
                    )
                    
                    logger.error(f"Trade failed: {rec.from_asset} -> {rec.to_asset}, error: {trade_result.get('error', 'Unknown')}")
                
                transactions.append(transaction.__dict__)
                
                # Small delay between trades to avoid rate limits
                await asyncio.sleep(1)
            
            success_rate = (successful_trades / len(recommendations)) * 100 if recommendations else 0
            
            result = {
                'success': successful_trades > 0,
                'summary': {
                    'total_trades': len(recommendations),
                    'successful_trades': successful_trades,
                    'failed_trades': failed_trades,
                    'success_rate': success_rate,
                    'total_gas_used': total_gas_used,
                    'total_gas_cost': total_gas_cost
                },
                'transactions': transactions,
                'gas_used': total_gas_used,
                'total_cost': total_gas_cost,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            logger.info(f"Rebalance execution completed: {successful_trades}/{len(recommendations)} successful trades")
            return result
            
        except Exception as e:
            logger.error(f"Error executing rebalance: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'message': f"Rebalance execution failed: {str(e)}"
            }
    
    async def _execute_single_trade(self, recommendation: RebalanceRecommendation) -> Dict[str, Any]:
        """Execute a single trade (simulation for demo)"""
        try:
            # Simulate trade execution delay
            await asyncio.sleep(2)
            
            # Simulate success/failure (90% success rate for demo)
            import random
            success = random.random() > 0.1
            
            if success:
                # Simulate successful trade
                gas_used = recommendation.estimated_gas * random.uniform(0.8, 1.2)
                gas_cost = gas_used * random.uniform(0.9, 1.1)
                
                return {
                    'success': True,
                    'tx_hash': f"0x{random.randint(10**15, 10**16):016x}",
                    'gas_used': gas_used,
                    'gas_cost': gas_cost,
                    'actual_slippage': recommendation.estimated_slippage * random.uniform(0.5, 1.5)
                }
            else:
                # Simulate failed trade
                return {
                    'success': False,
                    'error': random.choice([
                        'Insufficient liquidity',
                        'Slippage too high',
                        'Transaction reverted',
                        'Network congestion'
                    ])
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def cleanup(self):
        """Cleanup resources"""
        logger.info("Rebalance engine cleanup completed")