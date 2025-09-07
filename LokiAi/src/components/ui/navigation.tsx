import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Menu, X, Wallet } from 'lucide-react';

interface NavigationProps {
  onConnectWallet?: () => void;
  isWalletConnected?: boolean;
  userAddress?: string;
}

export function Navigation({ onConnectWallet, isWalletConnected, userAddress }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Products', href: '#products' },
    { label: 'Dashboard', href: '#dashboard' },
    { label: 'Enterprise', href: '#enterprise' },
    { label: 'Security', href: '#security' },
    { label: 'Resources', href: '#resources' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-scale-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <span className="text-xl font-bold text-foreground">Loki AI</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-scale-gray-300 hover:text-foreground px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isWalletConnected ? (
              <div className="flex items-center space-x-2 px-3 py-2 bg-scale-gray-800 rounded-md">
                <Wallet className="w-4 h-4 text-scale-gray-400" />
                <span className="text-sm text-scale-gray-300">
                  {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
                </span>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onConnectWallet}
                className="border-scale-gray-600 text-scale-gray-300 hover:text-foreground hover:border-scale-gray-400"
              >
                Connect Wallet
              </Button>
            )}
            <Button 
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Launch Dashboard →
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="bg-transparent inline-flex items-center justify-center p-2 rounded-md text-scale-gray-400 hover:text-foreground hover:bg-scale-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-scale-gray-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={cn(
        "md:hidden",
        isMobileMenuOpen ? "block" : "hidden"
      )}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-t border-scale-gray-800">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-scale-gray-300 hover:text-foreground block px-3 py-2 text-base font-medium transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="mt-4 pt-4 border-t border-scale-gray-800 space-y-2">
            {!isWalletConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onConnectWallet?.();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full border-scale-gray-600 text-scale-gray-300 hover:text-foreground hover:border-scale-gray-400"
              >
                Connect Wallet
              </Button>
            )}
            <Button 
              size="sm"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Launch Dashboard →
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}