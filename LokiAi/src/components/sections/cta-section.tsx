import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';

interface CtaSectionProps {
  onConnectWallet?: () => void;
}

export function CtaSection({ onConnectWallet }: CtaSectionProps) {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-scale-gray-900/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-scale-gray-900/10 to-transparent"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Badge */}
        <Badge className="mb-6 bg-gradient-primary text-black font-medium px-4 py-2">
          <Sparkles className="w-4 h-4 mr-2" />
          Ready to Deploy
        </Badge>

        {/* Main Headline */}
        <h2 className="text-4xl md:text-6xl font-light text-foreground mb-6 leading-tight">
          Deploy your first
          <br />
          <span className="font-normal bg-gradient-primary bg-clip-text text-transparent">
            AI agent today
          </span>
        </h2>

        {/* Description */}
        <p className="text-xl text-scale-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          Join thousands of institutions already using our platform to automate 
          cross-chain operations, optimize yields, and manage risk across 50+ blockchains.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Button 
            size="lg"
            onClick={onConnectWallet}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 text-lg font-medium group min-w-48"
          >
            Connect Wallet
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <Button 
            variant="outline"
            size="lg"
            className="border-scale-gray-600 text-scale-gray-300 hover:text-foreground hover:border-scale-gray-400 px-8 py-4 text-lg font-medium min-w-48"
          >
            View Documentation
          </Button>
        </div>

        {/* Feature Highlights */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-scale-gray-500">
          <div className="flex items-center">
            <Zap className="w-4 h-4 mr-2 text-blue-400" />
            <span>Deploy in under 5 minutes</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2 bg-green-500 rounded-full"></div>
            <span>No smart contract experience required</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2 bg-purple-500 rounded-full"></div>
            <span>Enterprise support available</span>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-32 h-32 bg-gradient-primary opacity-10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-10 w-24 h-24 bg-gradient-accent opacity-10 rounded-full blur-xl animate-pulse delay-1000"></div>
    </section>
  );
}