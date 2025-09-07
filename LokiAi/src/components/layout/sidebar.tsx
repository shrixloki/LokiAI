import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Bot,
  ArrowUpDown,
  BarChart3,
  Shield,
  Bell,
  Settings,
  Wallet,
  Activity
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    badge: null
  },
  {
    title: 'AI Agents',
    url: '/agents',
    icon: Bot,
    badge: '12'
  },
  {
    title: 'Cross-Chain',
    url: '/cross-chain',
    icon: ArrowUpDown,
    badge: null
  },
  {
    title: 'Analytics',
    url: '/analytics',
    icon: BarChart3,
    badge: null
  },
  {
    title: 'Security',
    url: '/security',
    icon: Shield,
    badge: '2'
  },
  {
    title: 'Activity',
    url: '/activity',
    icon: Activity,
    badge: null
  }
];

const bottomItems = [
  {
    title: 'Notifications',
    url: '/notifications',
    icon: Bell,
    badge: '5'
  },
  {
    title: 'Wallets',
    url: '/wallets',
    icon: Wallet,
    badge: null
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
    badge: null
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');

  const getNavClassName = (path: string) => {
    const active = isActive(path);
    return cn(
      "w-full flex items-center justify-start px-3 py-2 text-sm font-medium transition-all duration-200",
      active
        ? "bg-scale-gray-800 text-foreground border-r-2 border-primary"
        : "text-scale-gray-400 hover:text-foreground hover:bg-scale-gray-900/50"
    );
  };

  return (
    <Sidebar className={cn("border-r border-scale-gray-800", collapsed ? "w-16" : "w-64")}>
      <SidebarContent className="bg-background">
        {/* Logo */}
        <div className="p-4 border-b border-scale-gray-800">
          {!collapsed ? (
            <h2 className="text-xl font-bold text-foreground">Loki AI</h2>
          ) : (
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-black">L</span>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={cn(
            "text-xs font-semibold text-scale-gray-500 uppercase tracking-wide px-3 mb-2",
            collapsed && "sr-only"
          )}>
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className={cn("h-5 w-5 flex-shrink-0", !collapsed && "mr-3")} />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          {item.badge && (
                            <Badge 
                              variant="secondary" 
                              className="ml-auto text-xs bg-scale-gray-700 text-scale-gray-300"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom Navigation */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className={cn(
            "text-xs font-semibold text-scale-gray-500 uppercase tracking-wide px-3 mb-2",
            collapsed && "sr-only"
          )}>
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className={cn("h-5 w-5 flex-shrink-0", !collapsed && "mr-3")} />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          {item.badge && (
                            <Badge 
                              variant="secondary" 
                              className="ml-auto text-xs bg-scale-gray-700 text-scale-gray-300"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}