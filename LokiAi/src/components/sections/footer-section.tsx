import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Github, 
  Twitter, 
  Linkedin, 
  Mail,
  ArrowUpRight
} from 'lucide-react';

export function FooterSection() {
  const footerLinks = {
    platform: [
      { label: 'Dashboard', href: '#dashboard' },
      { label: 'AI Agents', href: '#agents' },
      { label: 'Cross-Chain', href: '#cross-chain' },
      { label: 'Analytics', href: '#analytics' },
      { label: 'API Docs', href: '#api' }
    ],
    company: [
      { label: 'About', href: '#about' },
      { label: 'Blog', href: '#blog' },
      { label: 'Careers', href: '#careers' },
      { label: 'Press', href: '#press' },
      { label: 'Contact', href: '#contact' }
    ],
    resources: [
      { label: 'Documentation', href: '#docs' },
      { label: 'Tutorials', href: '#tutorials' },
      { label: 'Community', href: '#community' },
      { label: 'Support', href: '#support' },
      { label: 'Status', href: '#status' }
    ],
    legal: [
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' },
      { label: 'Security', href: '#security' },
      { label: 'Compliance', href: '#compliance' }
    ]
  };

  return (
    <footer className="bg-background border-t border-scale-gray-800">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Left Column - Brand & Newsletter */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-4">scale</h3>
              <p className="text-scale-gray-400 text-lg leading-relaxed max-w-md">
                The future of cross-chain AI agent networks. Deploy intelligent agents 
                that seamlessly operate across 50+ blockchains with enterprise-grade security.
              </p>
            </div>

            {/* Newsletter Signup */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-foreground">Stay Updated</h4>
              <p className="text-scale-gray-500 text-sm">
                Get the latest updates on new features, protocols, and platform developments.
              </p>
              <div className="flex space-x-2 max-w-md">
                <Input 
                  placeholder="Enter your email"
                  className="bg-scale-gray-900 border-scale-gray-700 text-foreground placeholder-scale-gray-500"
                />
                <Button size="sm" className="shrink-0">
                  Subscribe
                </Button>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-scale-gray-900 rounded-lg hover:bg-scale-gray-800 transition-colors">
                <Twitter className="w-5 h-5 text-scale-gray-400" />
              </a>
              <a href="#" className="p-2 bg-scale-gray-900 rounded-lg hover:bg-scale-gray-800 transition-colors">
                <Github className="w-5 h-5 text-scale-gray-400" />
              </a>
              <a href="#" className="p-2 bg-scale-gray-900 rounded-lg hover:bg-scale-gray-800 transition-colors">
                <Linkedin className="w-5 h-5 text-scale-gray-400" />
              </a>
              <a href="#" className="p-2 bg-scale-gray-900 rounded-lg hover:bg-scale-gray-800 transition-colors">
                <Mail className="w-5 h-5 text-scale-gray-400" />
              </a>
            </div>
          </div>

          {/* Right Column - Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Platform</h4>
              <ul className="space-y-2">
                {footerLinks.platform.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      className="text-scale-gray-400 hover:text-foreground text-sm transition-colors duration-200 flex items-center group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Company</h4>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      className="text-scale-gray-400 hover:text-foreground text-sm transition-colors duration-200 flex items-center group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Resources</h4>
              <ul className="space-y-2">
                {footerLinks.resources.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      className="text-scale-gray-400 hover:text-foreground text-sm transition-colors duration-200 flex items-center group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Legal</h4>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      className="text-scale-gray-400 hover:text-foreground text-sm transition-colors duration-200 flex items-center group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-scale-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <p className="text-scale-gray-500 text-sm">
                © 2024 Cross-Chain AI Agent Network. All rights reserved.
              </p>
              <Badge variant="outline" className="border-scale-gray-700 text-scale-gray-400 text-xs">
                Enterprise Ready
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-scale-gray-500">
              <span>Built with security-first design</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}