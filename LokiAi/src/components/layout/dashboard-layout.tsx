import { ReactNode, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './sidebar';
import { DashboardGeometricShapes } from '@/components/ui/geometric-shapes';
import { useMetaMask } from '@/hooks/useMetaMask';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, ChevronDown, LogOut } from 'lucide-react';
import { NotificationCenter } from '@/components/notifications/notification-center';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { isConnected, account, disconnect } = useMetaMask();
  const [notifications] = useState(5); // Mock notification count

  // Show wallet connection prompt if not connected
  if (!isConnected || !account) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Connect Your Wallet</h1>
            <p className="text-scale-gray-400">
              You need to connect a wallet to access the dashboard
            </p>
          </div>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Go to Home Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Navigation Bar */}
          <header className="h-16 border-b border-scale-gray-800 bg-background/95 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center space-x-4">
              <SidebarTrigger className="text-scale-gray-400 hover:text-foreground" />
              {title && (
                <div>
                  <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                  {subtitle && (
                    <p className="text-sm text-scale-gray-400">{subtitle}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2 text-scale-gray-400 hover:text-foreground"
              >
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {notifications}
                  </Badge>
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 text-scale-gray-300 hover:text-foreground"
                  >
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-black">
                        {account?.slice(2, 4).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm">
                      {account?.slice(0, 6)}...{account?.slice(-4)}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 bg-card border-scale-gray-800"
                >
                  <DropdownMenuLabel className="text-foreground">
                    Connected Wallet
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-scale-gray-800" />
                  <DropdownMenuItem className="text-scale-gray-300 hover:text-foreground hover:bg-scale-gray-800">
                    <span className="text-sm">
                      {account}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-scale-gray-300 hover:text-foreground hover:bg-scale-gray-800">
                    Wallet: MetaMask
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-scale-gray-800" />
                  <DropdownMenuItem 
                    onClick={disconnect}
                    className="text-red-400 hover:text-red-300 hover:bg-scale-gray-800 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 relative">
            <DashboardGeometricShapes />
            <div className="relative z-10 p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}