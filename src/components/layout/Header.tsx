import Link from 'next/link';
import Logo from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Briefcase, Users, ShieldCheck, Blocks, Cpu, Smartphone, Bot, LayoutDashboard } from 'lucide-react';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/" className="text-foreground/80 hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/company" className="text-foreground/80 hover:text-primary transition-colors">
            Company
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-foreground/80 hover:text-primary transition-colors px-2">
                Services <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/services/cyber-security" className="flex items-center">
                  <ShieldCheck className="mr-2 h-4 w-4 text-accent glowing-icon" /> Cyber Security
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/services/blockchain" className="flex items-center">
                  <Blocks className="mr-2 h-4 w-4 text-accent glowing-icon" /> Blockchain
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/services/ai" className="flex items-center">
                  <Cpu className="mr-2 h-4 w-4 text-accent glowing-icon" /> Artificial Intelligence
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/services/industrial-software" className="flex items-center">
                  <Briefcase className="mr-2 h-4 w-4 text-accent glowing-icon" /> Industrial Software
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/services/iot-devices" className="flex items-center">
                  <Smartphone className="mr-2 h-4 w-4 text-accent glowing-icon" /> IoT Devices
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/admin/login" className="text-foreground/80 hover:text-primary transition-colors">
            Admin Login
          </Link>
        </nav>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          {/* Placeholder for mobile menu trigger if needed */}
        </div>
      </div>
    </header>
  );
};

export default Header;