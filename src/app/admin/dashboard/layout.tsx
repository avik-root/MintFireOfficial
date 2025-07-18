
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Added useRouter
import Logo from '@/components/Logo';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users, 
  Package, 
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
  Bug, 
  Trophy, 
  ImageIcon,
  ListPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';
import { logoutAdmin } from '@/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';

const sidebarNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/dashboard/products', label: 'Products', icon: Package },
  { href: '/admin/dashboard/hall-of-fame-management', label: 'Hall of Fame', icon: Trophy }, 
  { href: '/admin/dashboard/site-content', label: 'Site Content', icon: FileText },
  { href: '/admin/dashboard/logo', label: 'Logo Management', icon: ImageIcon }, 
  { href: '/admin/dashboard/blogs', label: 'Blog Posts', icon: Newspaper },
  { href: '/admin/dashboard/applicants', label: 'Applicants', icon: Briefcase },
  { href: '/admin/dashboard/bug-reports', label: 'Bug Reports', icon: Bug },
  { href: '/admin/dashboard/team', label: 'Team', icon: UsersRound },
  { href: '/admin/dashboard/founders', label: 'Founders', icon: Crown },
  { href: '/admin/dashboard/feedback', label: 'Feedback', icon: MessageSquareWarning },
  { href: '/admin/dashboard/waitlist', label: 'Product Waitlist', icon: ListPlus },
  { href: '/admin/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
];

const sidebarBottomNavItems = [
  { href: '/admin/dashboard/settings', label: 'Settings', icon: Settings },
  // Logout is handled differently now
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/admin/login'); // Ensure client-side redirect after cookie is cleared
    } catch (error) {
      toast({ variant: "destructive", title: "Logout Failed", description: "Could not log out. Please try again." });
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card",
          "transition-all duration-0 ease-in-out", 
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
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={cn(
                "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium hover:bg-destructive/20 hover:text-destructive text-muted-foreground",
                isCollapsed ? "justify-center" : "gap-3 justify-start"
              )}
              title={isCollapsed ? "Logout" : undefined}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className={cn(isCollapsed ? "sr-only" : "opacity-100")}>
                Logout
              </span>
            </Button>
          </nav>
        </div>
      </aside>

      <div
        className={cn(
          "flex-1 flex flex-col",
          "transition-all duration-0 ease-in-out", 
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
