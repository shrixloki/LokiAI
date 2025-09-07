import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Zap, DollarSign } from 'lucide-react';

export function StatsSection() {
  const stats = [
    {
      icon: DollarSign,
      value: "$2.4B+",
      label: "Total Value Locked",
      description: "Assets managed across all chains"
    },
    {
      icon: Users,
      value: "50K+",
      label: "Active Agents",
      description: "AI agents deployed and running"
    },
    {
      icon: TrendingUp,
      value: "99.9%",
      label: "Success Rate",
      description: "Cross-chain transaction reliability"
    },
    {
      icon: Zap,
      value: "24/7",
      label: "Autonomous Operation",
      description: "Continuous monitoring and execution"
    }
  ];

  return (
    <section className="py-24 bg-scale-gray-900/50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-scale-gray-800 text-scale-gray-300 border-scale-gray-700">
            Platform Metrics
          </Badge>
          <h2 className="text-4xl md:text-5xl font-light text-foreground mb-6">
            Powering the future of
            <br />
            <span className="font-normal">decentralized finance</span>
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="text-center group hover:scale-105 transition-transform duration-300"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-scale-gray-800 rounded-lg group-hover:bg-scale-gray-700 transition-colors">
                  <stat.icon className="w-6 h-6 text-foreground" />
                </div>
              </div>
              <div className="text-4xl md:text-5xl font-light text-foreground mb-2">
                {stat.value}
              </div>
              <div className="text-lg font-medium text-scale-gray-300 mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-scale-gray-500">
                {stat.description}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Message */}
        <div className="text-center mt-16">
          <p className="text-scale-gray-400 text-lg">
            Join thousands of institutions and DeFi protocols building on our platform
          </p>
        </div>
      </div>
    </section>
  );
}