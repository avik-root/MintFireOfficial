
import Link from 'next/link';
import Logo from '@/components/Logo';
import { Separator } from '@/components/ui/separator';
import { Github, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const services = [
    { name: "Cyber Security", href: "/services/cyber-security" },
    { name: "Blockchain", href: "/services/blockchain" },
    { name: "Artificial Intelligence", href: "/services/ai" },
    { name: "IoT Devices", href: "/services/iot-devices" },
  ];

  const companyLinks = [
    { name: "About Us", href: "/company" },
    { name: "Blog", href: "/blog" }, 
    { name: "Careers", href: "/careers" }, 
    { name: "Contact", href: "/contact" }, 
  ];

  return (
    <footer className="border-t border-border/40 bg-background/95 text-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-10">
          {/* Column 1: Logo, Tagline & Socials */}
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Pioneering the Future of Technology.
            </p>
            <div className="mt-6 flex space-x-4">
              <Link href="#" aria-label="MintFire on LinkedIn" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-6 w-6" />
              </Link>
              <Link href="#" aria-label="MintFire on Github" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-6 w-6" />
              </Link>
              <Link href="mailto:contact@mintfire.com" aria-label="Email MintFire" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-6 w-6" />
              </Link>
            </div>
          </div>

          {/* Column 2: Services */}
          <div>
            <h3 className="font-headline text-base font-semibold text-foreground mb-4">Services</h3>
            <ul className="space-y-2.5">
              {services.map((service) => (
                <li key={service.name}>
                  <Link href={service.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="font-headline text-base font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
               <li><Link href="/admin/login" className="text-muted-foreground hover:text-primary transition-colors">Admin Login</Link></li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-border/60" />

        <div className="text-center text-muted-foreground">
          <p>
            MintFire &copy; {currentYear}. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
