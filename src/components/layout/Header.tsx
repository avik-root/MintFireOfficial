
"use client";

import Link from 'next/link';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ShieldCheck, Blocks, Cpu, Smartphone, Menu, LibraryBig } from 'lucide-react';
import React from 'react';

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/company", label: "Company" },
  { href: "/blog", label: "Blog" },
];

const serviceLinks = [
  { href: "/services/cyber-security", label: "Cyber Security", icon: ShieldCheck },
  { href: "/services/blockchain", label: "Blockchain", icon: Blocks },
  { href: "/services/ai", label: "Artificial Intelligence", icon: Cpu },
  { href: "/services/iot-devices", label: "IoT Devices", icon: Smartphone },
];

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2 text-sm font-medium">
          {navLinks.map(link => (
             <Button key={link.href} variant="ghost" asChild className="text-foreground/80 hover:text-primary transition-colors px-3">
                <Link href={link.href}>{link.label}</Link>
             </Button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-foreground/80 hover:text-primary transition-colors px-3 hover:bg-primary/10">
                Services <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {serviceLinks.map(service => (
                <DropdownMenuItem key={service.href} asChild>
                  <Link href={service.href} className="flex items-center">
                    <service.icon className="mr-2 h-4 w-4 text-accent glowing-icon" /> {service.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Mobile Navigation Trigger */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open mobile menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] bg-card border-primary/30 flex flex-col p-0">
              <SheetHeader className="p-4 border-b border-border/50">
                 <div className="flex items-center justify-between">
                  <SheetTitle className="font-headline text-xl text-primary">Menu</SheetTitle>
                  {/* SheetClose is automatically rendered by SheetContent top-right */}
                </div>
                <div className="mt-4">
                  <Logo />
                </div>
              </SheetHeader>
              <ScrollArea className="flex-grow">
                <nav className="flex flex-col space-y-1 p-4">
                  {navLinks.map((link) => (
                    <SheetClose key={`mobile-${link.href}`} asChild>
                       <Button variant="ghost" asChild className="justify-start text-lg text-foreground/90 hover:text-primary px-2 py-3">
                        <Link href={link.href} className="flex items-center w-full">
                          {link.label === "Blog" && <LibraryBig className="mr-3 h-5 w-5 text-accent" />} 
                          {link.label}
                        </Link>
                      </Button>
                    </SheetClose>
                  ))}
                  <div className="pt-2">
                    <h4 className="px-2 pb-1 text-sm font-medium text-muted-foreground">Services</h4>
                    {serviceLinks.map((service) => (
                      <SheetClose key={`mobile-${service.href}`} asChild>
                        <Button variant="ghost" asChild className="w-full justify-start text-lg text-foreground/90 hover:text-primary px-2 py-3">
                          <Link href={service.href} className="flex items-center w-full">
                            <service.icon className="mr-3 h-5 w-5 text-accent" />
                            {service.label}
                          </Link>
                        </Button>
                      </SheetClose>
                    ))}
                  </div>
                </nav>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
