import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Shield, 
  Zap, 
  Globe, 
  BarChart3, 
  Lock,
  ArrowUpDown,
  Brain,
  Layers
} from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: Bot,
      title: "Autonomous AI Agents",
      description: "Deploy intelligent agents that execute cross-chain operations, manage portfolios, and optimize yield strategies without human intervention.",
      badge: "Core Feature",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: ArrowUpDown,
      title: "Cross-Chain Asset Management",
      description: "Seamlessly move assets across 50+ blockchains with real-time optimization, minimal fees, and maximum security guarantees.",
      badge: "Multi-Chain",
      gradient: "from-green-500 to-blue-500"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Military-grade encryption, multi-sig compliance, and AI-powered fraud detection protect institutional-level assets.",
      badge: "Enterprise",
      gradient: "from-red-500 to-orange-500"
    },
    {
      icon: Brain,
      title: "Intelligent Risk Assessment",
      description: "Advanced ML models analyze market conditions, protocol risks, and smart contract vulnerabilities in real-time.",
      badge: "AI-Powered",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Comprehensive dashboards with real-time metrics, profit/loss tracking, and predictive market analysis.",
      badge: "Analytics",
      gradient: "from-cyan-500 to-blue-500"
    },
    {
      icon: Layers,
      title: "Protocol Integrations",
      description: "Native integrations with leading DeFi protocols, CEXs, and institutional trading platforms.",
      badge: "Integrations",
      gradient: "from-indigo-500 to-purple-500"
    }
  ];

  return (
    <section className="py-24 bg-background relative" id="products">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-scale-gray-800 text-scale-gray-300 border-scale-gray-700">
            Platform Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-light text-foreground mb-6">
            Everything you need for
            <br />
            <span className="font-normal">cross-chain operations</span>
          </h2>
          <p className="text-xl text-scale-gray-400 max-w-3xl mx-auto">
            Our AI-powered platform provides enterprise-grade tools for seamless blockchain interoperability, 
            automated asset management, and intelligent risk assessment.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={feature.title}
              className="bg-card border-scale-gray-800 hover:border-scale-gray-700 transition-all duration-300 group hover:translate-y-[-4px]"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.gradient} bg-opacity-10`}>
                    <feature.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-semibold text-foreground group-hover:text-scale-gray-100 transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-scale-gray-400 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-scale-gray-500 mb-4">
            Ready to deploy your first AI agent?
          </p>
          <div className="flex justify-center space-x-4">
            <Badge variant="outline" className="border-scale-gray-600 text-scale-gray-400">
              <Zap className="w-3 h-3 mr-1" />
              Deploy in minutes
            </Badge>
            <Badge variant="outline" className="border-scale-gray-600 text-scale-gray-400">
              <Globe className="w-3 h-3 mr-1" />
              50+ blockchains
            </Badge>
            <Badge variant="outline" className="border-scale-gray-600 text-scale-gray-400">
              <Lock className="w-3 h-3 mr-1" />
              Bank-grade security
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}