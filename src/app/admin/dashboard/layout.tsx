
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Package, // Icon for Products
  Newspaper, 
  FileText, 
  Briefcase, 
  UsersRound, 
  MessageSquareWarning, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Crown, 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

const sidebarNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/dashboard/products', label: 'Products', icon: Package }, // Added Products
  { href: '/admin/dashboard/users', label: 'Users', icon: Users },
  { href: '/admin/dashboard/site-content', label: 'Site Content', icon: FileText },
  { href: '/admin/dashboard/blogs', label: 'Blog Posts', icon: Newspaper },
  { href: '/admin/dashboard/applicants', label: 'Applicants', icon: Briefcase },
  { href: '/admin/dashboard/team', label: 'Team', icon: UsersRound },
  { href: '/admin/dashboard/founders', label: 'Founders', icon: Crown },
  { href: '/admin/dashboard/feedback', label: 'Feedback', icon: MessageSquareWarning },
  { href: '/admin/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
];

const sidebarBottomNavItems = [
  { href: '/admin/dashboard/settings', label: 'Settings', icon: Settings },
  // Add logout functionality later
  { href: '/admin/login', label: 'Logout', icon: LogOut }, 
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card",
          "transition-all duration-0 ease-in-out", // Removed animation for instant snap
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className={cn(
          "flex items-center border-b border-border",
          isCollapsed ? "h-16 justify-center" : "h-16 px-6 justify-between"
        )}>
          {!isCollapsed && <Logo />}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className={cn(isCollapsed ? "mx-auto" : "")}>
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            <span className="sr-only">{isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}</span>
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <nav className={cn("grid gap-1 p-2.5", isCollapsed ? "px-2" : "px-4")}>
            {sidebarNavItems.map((item) => {
              const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin/dashboard' && item.href.length > '/admin/dashboard'.length);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium hover:bg-primary/10 hover:text-primary",
                    isActive ? "bg-primary/15 text-primary font-semibold" : "text-muted-foreground",
                    isCollapsed ? "justify-center" : "gap-3 justify-start"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className={cn(isCollapsed ? "sr-only" : "opacity-100")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="mt-auto border-t border-border p-2.5">
          <nav className={cn("grid gap-1", isCollapsed ? "px-0.5" : "px-2")}>
            {sidebarBottomNavItems.map((item) => {
               const isActive = pathname === item.href;
               return(
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium hover:bg-primary/10 hover:text-primary",
                    isActive ? "bg-primary/15 text-primary font-semibold" : "text-muted-foreground",
                    isCollapsed ? "justify-center" : "gap-3 justify-start"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className={cn(isCollapsed ? "sr-only" : "opacity-100")}>
                    {item.label}
                  </span>
                </Link>
               );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col",
          "transition-all duration-0 ease-in-out", // Removed animation
          isCollapsed ? "sm:pl-20" : "sm:pl-64"
        )}
      >
        <main className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
