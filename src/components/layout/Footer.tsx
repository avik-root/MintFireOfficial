
import Link from 'next/link';
import Logo from '@/components/Logo';
import { Separator } from '@/components/ui/separator';
import { Github, Linkedin, Twitter } from 'lucide-react'; // Example social icons

const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-background/95 text-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Column 1: Logo & Tagline */}
          <div className="sm:col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-3 text-muted-foreground">
              Pioneering the Future of Technology.
            </p>
          </div>

          {/* Column 2: Company */}
          <div>
            <h3 className="font-headline text-base font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2.5">
              <li><Link href="/company" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/#core-technologies" className="text-muted-foreground hover:text-primary transition-colors">Services</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="font-headline text-base font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2.5">
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Support</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Documentation</Link></li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h3 className="font-headline text-base font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2.5">
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-border/60" />

        <div className="flex flex-col md:flex-row justify-between items-center text-muted-foreground">
          <p className="mb-4 md:mb-0">
            MintFire &copy; {new Date().getFullYear()}. All Rights Reserved.
          </p>
          <div className="flex space-x-5">
            <Link href="#" aria-label="MintFire on Github" className="text-muted-foreground hover:text-primary transition-colors">
              <Github className="h-5 w-5" />
            </Link>
            <Link href="#" aria-label="MintFire on LinkedIn" className="text-muted-foreground hover:text-primary transition-colors">
              <Linkedin className="h-5 w-5" />
            </Link>
            <Link href="#" aria-label="MintFire on Twitter" className="text-muted-foreground hover:text-primary transition-colors">
              <Twitter className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
