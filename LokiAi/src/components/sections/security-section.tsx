import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  Lock, 
  FileCheck, 
  Eye, 
  Fingerprint,
  AlertTriangle
} from 'lucide-react';

export function SecuritySection() {
  const securityFeatures = [
    {
      icon: Shield,
      title: "Multi-Signature Compliance",
      description: "Enterprise-grade multi-sig protocols with customizable threshold requirements and hierarchical approval workflows for institutional security standards."
    },
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "Military-grade AES-256 encryption for all data transmission and storage, ensuring your sensitive information remains completely secure."
    },
    {
      icon: FileCheck,
      title: "Smart Contract Audits",
      description: "All protocols undergo rigorous security audits by leading firms including Certik, OpenZeppelin, and Trail of Bits before deployment."
    },
    {
      icon: Eye,
      title: "Real-Time Monitoring",
      description: "Continuous surveillance of all transactions and agent activities with instant alerts for suspicious behavior or anomalous patterns."
    },
    {
      icon: Fingerprint,
      title: "Identity Verification",
      description: "Advanced cryptographic identity systems with KYC/AML compliance and biometric authentication for enhanced security protocols."
    },
    {
      icon: AlertTriangle,
      title: "Risk Assessment",
      description: "AI-powered risk analysis evaluating protocol security, market volatility, and smart contract vulnerabilities in real-time."
    }
  ];

  return (
    <section className="py-24 bg-background relative" id="security">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-scale-gray-800 text-scale-gray-300 border-scale-gray-700">
            Security & Compliance
          </Badge>
          <h2 className="text-4xl md:text-5xl font-light text-foreground mb-6">
            Enterprise-grade security
            <br />
            <span className="font-normal">you can trust</span>
          </h2>
          <p className="text-xl text-scale-gray-400 max-w-3xl mx-auto">
            Our platform implements the highest security standards in the industry, 
            with continuous monitoring, comprehensive audits, and regulatory compliance 
            to protect institutional-level assets.
          </p>
        </div>

        {/* Security Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {securityFeatures.map((feature, index) => (
            <Card 
              key={feature.title}
              className="bg-card border-scale-gray-800 hover:border-scale-gray-700 transition-all duration-300 group"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-scale-gray-800 rounded-lg group-hover:bg-scale-gray-700 transition-colors">
                    <feature.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-scale-gray-400 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security Stats */}
        <div className="bg-scale-gray-900/30 rounded-2xl p-8 border border-scale-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-light text-foreground mb-2">$0</div>
              <div className="text-scale-gray-400">Funds Lost to Security Breaches</div>
            </div>
            <div>
              <div className="text-3xl font-light text-foreground mb-2">100%</div>
              <div className="text-scale-gray-400">Smart Contracts Audited</div>
            </div>
            <div>
              <div className="text-3xl font-light text-foreground mb-2">24/7</div>
              <div className="text-scale-gray-400">Security Monitoring</div>
            </div>
          </div>
        </div>

        {/* Compliance Badges */}
        <div className="text-center mt-12">
          <p className="text-scale-gray-500 mb-6">Compliant with global security standards</p>
          <div className="flex justify-center space-x-8 opacity-60">
            <Badge variant="outline" className="border-scale-gray-700 text-scale-gray-400 py-2 px-4">
              SOC 2 Type II
            </Badge>
            <Badge variant="outline" className="border-scale-gray-700 text-scale-gray-400 py-2 px-4">
              ISO 27001
            </Badge>
            <Badge variant="outline" className="border-scale-gray-700 text-scale-gray-400 py-2 px-4">
              GDPR Compliant
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}