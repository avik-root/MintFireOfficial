import Image from 'next/image';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ServicePageLayoutProps {
  title: string;
  description: string;
  icon: React.ElementType;
  imageUrl: string;
  imageAlt: string;
  imageAiHint: string;
  features: string[];
  children?: React.ReactNode; // For additional specific content
}

const ServicePageLayout: React.FC<ServicePageLayoutProps> = ({
  title,
  description,
  icon: Icon,
  imageUrl,
  imageAlt,
  imageAiHint,
  features,
  children,
}) => {
  return (
    <div className="space-y-12">
      <section className="relative py-16 md:py-24 rounded-xl overflow-hidden border border-primary/30">
        <Image 
          src={imageUrl} 
          alt={imageAlt} 
          layout="fill" 
          objectFit="cover" 
          className="absolute inset-0 z-0 opacity-30" 
          data-ai-hint={imageAiHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10"></div>
        <div className="container mx-auto px-4 relative z-20 text-center">
          <Icon className="w-20 h-20 text-primary mx-auto mb-6 glowing-icon-primary" />
          <h1 className="font-headline text-5xl font-bold mb-4">{title}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="font-headline text-3xl font-semibold mb-6 text-primary">Key Features</h2>
            <ul className="space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-accent mr-3 mt-1 flex-shrink-0 glowing-icon" />
                  <span className="text-foreground/90">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-xl border border-border layered-card">
            <h3 className="font-headline text-2xl font-semibold mb-4 text-accent">Why Choose MintFire?</h3>
            <p className="text-muted-foreground mb-6">
              Our {title.toLowerCase()} solutions are built on a foundation of innovation, security, and scalability, ensuring your operations are future-proof and resilient.
            </p>
            <Button asChild className="bg-accent hover:bg-accent/80 text-accent-foreground w-full glowing-icon">
              <Link href="/company#contact">Request a Demo <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
      
      {children && <section className="container mx-auto px-4">{children}</section>}
    </div>
  );
};

export default ServicePageLayout;