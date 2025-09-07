import { Button } from '@/components/ui/button';
import { GeometricShapes } from '@/components/ui/geometric-shapes';
import { ArrowRight, Play } from 'lucide-react';

interface HeroSectionProps {
  onConnectWallet?: () => void;
  onExploreDashboard?: () => void;
}

export function HeroSection({ onConnectWallet, onExploreDashboard }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-background pt-16">
      <GeometricShapes />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Main Headlines */}
          <h1 className="text-5xl md:text-7xl font-light text-foreground mb-6 leading-tight">
            Cross-Chain AI Agents from
            <br />
            <span className="font-normal">Data to Deployment</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-scale-gray-300 mb-12 max-w-4xl mx-auto font-light leading-relaxed">
            The first autonomous AI network delivers seamless cross-chain operations, 
            intelligent asset management, and secure blockchain interoperability 
            for DeFi protocols, institutions, and enterprise applications.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button 
              size="lg"
              onClick={onConnectWallet}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 text-lg font-medium group"
            >
              Connect Wallet
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              variant="outline"
              size="lg"
              onClick={onExploreDashboard}
              className="border-scale-gray-600 text-scale-gray-300 hover:text-foreground hover:border-scale-gray-400 px-8 py-4 text-lg font-medium group"
            >
              Explore Dashboard
              <Play className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="text-center">
            <p className="text-sm text-scale-gray-500 mb-8 font-medium tracking-wide uppercase">
              Trusted by Leading DeFi Protocols, Institutions & Web3 Enterprises
            </p>
            
            {/* Partner logos placeholder - would show actual protocol logos */}
            <div className="flex items-center justify-center space-x-12 opacity-40">
              <div className="w-24 h-8 bg-scale-gray-800 rounded flex items-center justify-center">
                <span className="text-xs text-scale-gray-500 font-medium">AAVE</span>
              </div>
              <div className="w-24 h-8 bg-scale-gray-800 rounded flex items-center justify-center">
                <span className="text-xs text-scale-gray-500 font-medium">COMPOUND</span>
              </div>
              <div className="w-24 h-8 bg-scale-gray-800 rounded flex items-center justify-center">
                <span className="text-xs text-scale-gray-500 font-medium">UNISWAP</span>
              </div>
              <div className="w-24 h-8 bg-scale-gray-800 rounded flex items-center justify-center">
                <span className="text-xs text-scale-gray-500 font-medium">CHAINLINK</span>
              </div>
              <div className="w-24 h-8 bg-scale-gray-800 rounded flex items-center justify-center">
                <span className="text-xs text-scale-gray-500 font-medium">POLYGON</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subtle scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-scale-gray-600 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-scale-gray-600 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}