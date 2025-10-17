"""
Portfolio Analyzer Module
Analyzes user's portfolio across multiple chains and protocols
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import aiohttp
import json
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class Asset:
    """Represents a portfolio asset"""
    symbol: str
    name: str
    balance: float
    chain: str
    contract_address: Optional[str]
    price: float = 0.0
    value: float = 0.0
    change_24h: float = 0.0
    allocation_percentage: float = 0.0

@dataclass
class PortfolioData:
    """Represents complete portfolio data"""
    assets: List[Asset]
    total_value: float
    total_pnl: float
    total_pnl_percentage: float
    chain_distribution: Dict[str, float]
    asset_distribution: Dict[str, float]
    last_updated: datetime

class PortfolioAnalyzer:
    """Analyzes portfolio composition and metrics"""
    
    SUPPORTED_CHAINS = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism']
    PRICE_API_BASE = "https://api.coingecko.com/api/v3"
    
    def __init__(self, wallet_address: str):
        self.wallet_address = wallet_address
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session"""
        if not self.session:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30)
            )
        return self.session
    
    async def analyze(self) -> Dict[str, Any]:
        """Main analysis method"""
        try:
            logger.info(f"Starting portfolio analysis for wallet: {self.wallet_address[:10]}...")
            
            # Step 1: Fetch portfolio data from multiple chains
            portfolio_data = await self._fetch_multi_chain_portfolio()
            
            # Step 2: Get price data for all assets
            await self._enrich_with_price_data(portfolio_data)
            
            # Step 3: Calculate portfolio metrics
            metrics = await self._calculate_portfolio_metrics(portfolio_data)
            
            # Step 4: Analyze allocation and diversification
            allocation_analysis = await self._analyze_allocation(portfolio_data)
            
            result = {
                'wallet_address': self.wallet_address,
                'assets': [asset.__dict__ for asset in portfolio_data.assets],
                'total_value': portfolio_data.total_value,
                'total_pnl': portfolio_data.total_pnl,
                'total_pnl_percentage': portfolio_data.total_pnl_percentage,
                'chain_distribution': portfolio_data.chain_distribution,
                'asset_distribution': portfolio_data.asset_distribution,
                'metrics': metrics,
                'allocation_analysis': allocation_analysis,
                'last_updated': portfolio_data.last_updated.isoformat(),
                'analysis_timestamp': datetime.utcnow().isoformat()
            }
            
            logger.info(f"Portfolio analysis completed: {len(portfolio_data.assets)} assets, ${portfolio_data.total_value:.2f} total value")
            return result
            
        except Exception as e:
            logger.error(f"Portfolio analysis failed: {str(e)}", exc_info=True)
            return None
    
    async def _fetch_multi_chain_portfolio(self) -> PortfolioData:
        """Fetch portfolio data from all supported chains"""
        all_assets = []
        
        # For demo purposes, we'll simulate portfolio data
        # In production, this would integrate with actual blockchain APIs
        demo_assets = [
            Asset("ETH", "Ethereum", 2.5, "ethereum", None, 0.0, 0.0, 0.0),
            Asset("USDC", "USD Coin", 1000.0, "ethereum", "0xa0b86a33e6776103e8b1dc9ccd1d9b0e2b1a3b3e", 0.0, 0.0, 0.0),
            Asset("MATIC", "Polygon", 500.0, "polygon", None, 0.0, 0.0, 0.0),
            Asset("BNB", "BNB", 1.2, "bsc", None, 0.0, 0.0, 0.0),
            Asset("LINK", "Chainlink", 25.0, "ethereum", "0x514910771af9ca656af840dff83e8264ecf986ca", 0.0, 0.0, 0.0),
        ]
        
        # Simulate some randomness in balances
        import random
        for asset in demo_assets:
            asset.balance *= random.uniform(0.8, 1.2)
        
        all_assets.extend(demo_assets)
        
        logger.info(f"Fetched {len(all_assets)} assets from portfolio")
        return PortfolioData(
            assets=all_assets,
            total_value=0.0,  # Will be calculated later
            total_pnl=0.0,
            total_pnl_percentage=0.0,
            chain_distribution={},
            asset_distribution={},
            last_updated=datetime.utcnow()
        )
    
    async def _enrich_with_price_data(self, portfolio_data: PortfolioData):
        """Enrich portfolio data with current prices"""
        session = await self._get_session()
        
        # Create mapping of symbols to CoinGecko IDs
        symbol_to_id = {
            'ETH': 'ethereum',
            'USDC': 'usd-coin',
            'MATIC': 'matic-network',
            'BNB': 'binancecoin',
            'LINK': 'chainlink',
            'BTC': 'bitcoin',
            'ADA': 'cardano',
            'DOT': 'polkadot'
        }
        
        # Get unique symbols
        symbols = list(set(asset.symbol for asset in portfolio_data.assets))
        coin_ids = [symbol_to_id.get(symbol, symbol.lower()) for symbol in symbols]
        
        try:
            # Fetch prices from CoinGecko
            url = f"{self.PRICE_API_BASE}/simple/price"
            params = {
                'ids': ','.join(coin_ids),
                'vs_currencies': 'usd',
                'include_24hr_change': 'true'
            }
            
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    price_data = await response.json()
                    
                    # Update asset prices
                    for asset in portfolio_data.assets:
                        coin_id = symbol_to_id.get(asset.symbol, asset.symbol.lower())
                        if coin_id in price_data:
                            asset.price = price_data[coin_id].get('usd', 0.0)
                            asset.change_24h = price_data[coin_id].get('usd_24h_change', 0.0)
                            asset.value = asset.balance * asset.price
                            
                            logger.debug(f"Updated {asset.symbol}: ${asset.price:.4f}, Value: ${asset.value:.2f}")
                        else:
                            logger.warning(f"Price not found for {asset.symbol}")
                            # Set fallback values
                            asset.price = 1.0 if 'USD' in asset.symbol else 0.0
                            asset.value = asset.balance * asset.price
                else:
                    logger.error(f"Failed to fetch prices: HTTP {response.status}")
                    
        except Exception as e:
            logger.error(f"Error fetching price data: {str(e)}")
            # Set fallback values
            for asset in portfolio_data.assets:
                if asset.price == 0:
                    asset.price = 1.0 if 'USD' in asset.symbol else 100.0
                    asset.value = asset.balance * asset.price
    
    async def _calculate_portfolio_metrics(self, portfolio_data: PortfolioData) -> Dict[str, Any]:
        """Calculate comprehensive portfolio metrics"""
        
        # Calculate total value
        portfolio_data.total_value = sum(asset.value for asset in portfolio_data.assets)
        
        # Calculate chain distribution
        chain_values = {}
        for asset in portfolio_data.assets:
            chain_values[asset.chain] = chain_values.get(asset.chain, 0) + asset.value
        
        portfolio_data.chain_distribution = {
            chain: (value / portfolio_data.total_value * 100) if portfolio_data.total_value > 0 else 0
            for chain, value in chain_values.items()
        }
        
        # Calculate asset distribution and allocation percentages
        asset_values = {}
        for asset in portfolio_data.assets:
            asset_values[asset.symbol] = asset_values.get(asset.symbol, 0) + asset.value
            asset.allocation_percentage = (asset.value / portfolio_data.total_value * 100) if portfolio_data.total_value > 0 else 0
        
        portfolio_data.asset_distribution = {
            symbol: (value / portfolio_data.total_value * 100) if portfolio_data.total_value > 0 else 0
            for symbol, value in asset_values.items()
        }
        
        # Calculate basic metrics
        metrics = {
            'total_assets': len(portfolio_data.assets),
            'unique_tokens': len(set(asset.symbol for asset in portfolio_data.assets)),
            'chains_used': len(portfolio_data.chain_distribution),
            'average_allocation': 100.0 / len(portfolio_data.assets) if portfolio_data.assets else 0,
            'largest_holding': max(asset_values.values()) if asset_values else 0,
            'largest_holding_percentage': max(portfolio_data.asset_distribution.values()) if portfolio_data.asset_distribution else 0,
            'diversification_score': self._calculate_diversification_score(portfolio_data),
            'volatility_score': self._calculate_volatility_score(portfolio_data),
        }
        
        return metrics
    
    def _calculate_diversification_score(self, portfolio_data: PortfolioData) -> float:
        """Calculate portfolio diversification score (0-100)"""
        if not portfolio_data.assets:
            return 0.0
        
        # Simple diversification score based on allocation distribution
        allocations = [asset.allocation_percentage for asset in portfolio_data.assets]
        
        # Calculate Herfindahl-Hirschman Index (HHI)
        hhi = sum(allocation ** 2 for allocation in allocations)
        
        # Convert to diversification score (100 = perfectly diversified)
        max_hhi = 10000  # 100^2 for perfectly concentrated portfolio
        diversification_score = (1 - (hhi / max_hhi)) * 100
        
        return max(0, min(100, diversification_score))
    
    def _calculate_volatility_score(self, portfolio_data: PortfolioData) -> float:
        """Calculate portfolio volatility score based on 24h changes"""
        if not portfolio_data.assets:
            return 0.0
        
        # Weighted average of 24h changes
        total_weighted_change = 0.0
        total_weight = 0.0
        
        for asset in portfolio_data.assets:
            if asset.value > 0:
                weight = asset.allocation_percentage / 100
                total_weighted_change += abs(asset.change_24h) * weight
                total_weight += weight
        
        if total_weight > 0:
            avg_volatility = total_weighted_change / total_weight
            # Convert to score (0-100, where 100 is very volatile)
            return min(100, avg_volatility * 5)  # Scale factor
        
        return 0.0
    
    async def _analyze_allocation(self, portfolio_data: PortfolioData) -> Dict[str, Any]:
        """Analyze portfolio allocation and provide insights"""
        
        allocation_analysis = {
            'is_balanced': False,
            'concentration_risk': 'low',
            'chain_diversification': 'good',
            'recommendations': [],
            'risk_factors': []
        }
        
        # Check for concentration risk
        max_allocation = max(portfolio_data.asset_distribution.values()) if portfolio_data.asset_distribution else 0
        
        if max_allocation > 50:
            allocation_analysis['concentration_risk'] = 'high'
            allocation_analysis['risk_factors'].append(f"High concentration in single asset ({max_allocation:.1f}%)")
            allocation_analysis['recommendations'].append("Consider reducing position in largest holding")
        elif max_allocation > 30:
            allocation_analysis['concentration_risk'] = 'medium'
            allocation_analysis['risk_factors'].append(f"Moderate concentration in largest holding ({max_allocation:.1f}%)")
        else:
            allocation_analysis['concentration_risk'] = 'low'
        
        # Check chain diversification
        chain_count = len(portfolio_data.chain_distribution)
        if chain_count == 1:
            allocation_analysis['chain_diversification'] = 'poor'
            allocation_analysis['risk_factors'].append("Portfolio concentrated on single blockchain")
            allocation_analysis['recommendations'].append("Consider diversifying across multiple chains")
        elif chain_count == 2:
            allocation_analysis['chain_diversification'] = 'fair'
        else:
            allocation_analysis['chain_diversification'] = 'good'
        
        # Check if portfolio is balanced (no single asset > 25%)
        allocation_analysis['is_balanced'] = max_allocation <= 25
        
        # Add general recommendations
        if len(portfolio_data.assets) < 5:
            allocation_analysis['recommendations'].append("Consider adding more assets for better diversification")
        
        return allocation_analysis
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.session:
            await self.session.close()
            self.session = None
            logger.info("Portfolio analyzer session closed")