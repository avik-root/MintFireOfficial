
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Cpu, Smartphone, Sparkles, ShieldCheck, Blocks, Activity, Megaphone, Package } from 'lucide-react';
import Link from 'next/link';
import { getSiteContentItems } from '@/actions/site-content-actions';
import type { SiteContentItem } from '@/lib/schemas/site-content-schemas';
import { getProducts } from '@/actions/product-actions';
import type { Product } from '@/lib/schemas/product-schemas';
import ProductCard from './_components/ProductCard'; // New ProductCard component

// This hardcoded data for sections other than latest releases can remain if desired,
// or also be moved to admin management. For now, keeping it for Upcoming, Early Access, Dev Testing.
interface OtherFeatureItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  image: string;
  dataAiHint: string;
  link?: string;
}
const otherSectionsData: Array<{ title: string; items: OtherFeatureItem[]; sectionIcon: React.ElementType; sectionId: string }> = [
  {
    title: "Upcoming Products",
    sectionIcon: Cpu, // Example icon
    sectionId: "upcoming-products",
    items: [
      { id: "up1", title: "AI Co-Pilot X", description: "Revolutionary AI assistant for enterprise.", icon: Cpu, image: "https://placehold.co/600x400.png", dataAiHint: "ai assistant" },
      { id: "up2", title: "QuantumNet Secure", description: "Post-quantum cryptography network solution.", icon: ShieldCheck, image: "https://placehold.co/600x400.png", dataAiHint: "quantum security" },
    ],
  },
  {
    title: "Early Access Program",
    sectionIcon: Smartphone, // Example icon
    sectionId: "early-access",
    items: [
      { id: "ea1", title: "IoT Fleet Manager Pro", description: "Manage large scale IoT deployments.", icon: Smartphone, image: "https://placehold.co/600x400.png", dataAiHint: "iot management" },
    ],
  },
  {
    title: "Developer Testing",
    sectionIcon: Blocks, // Example icon
    sectionId: "dev-testing",
    items: [
      { id: "dt1", title: "ChainDev Kit v0.8", description: "Blockchain development toolkit alpha.", icon: Blocks, image: "https://placehold.co/600x400.png", dataAiHint: "developer tools" },
    ],
  },
];


interface CoreTechnology {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  link: string;
}

const coreTechnologiesData: CoreTechnology[] = [
  { id: "ct1", title: "Cyber Security", description: "Protecting digital assets with cutting-edge defense mechanisms.", icon: ShieldCheck, link: "/services/cyber-security" },
  { id: "ct2", title: "Blockchain", description: "Building transparent and secure decentralized solutions.", icon: Blocks, link: "/services/blockchain" },
  { id: "ct3", title: "Artificial Intelligence", description: "Leveraging AI to create intelligent systems and insights.", icon: Cpu, link: "/services/ai" },
  { id: "ct5", title: "IoT Devices", description: "Connecting the physical world with smart, secure devices.", icon: Smartphone, link: "/services/iot-devices" },
];


export default async function Home() {
  const { items: siteContent, error: siteContentError } = await getSiteContentItems();
  const { products: latestProducts, error: productsError } = await getProducts({ isFeatured: true, limit: 3 });

  const announcementItems = siteContent?.filter(item => item.type === 'announcement' && item.isActive).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  const SiteContentCard = ({ item }: { item: SiteContentItem }) => (
    <Card className="layered-card overflow-hidden group transition-all duration-300 ease-in-out hover:shadow-accent/30 flex flex-col">
      <CardHeader className="p-0">
        {item.imageUrl && (
          <div className="relative w-full h-48 mb-4 overflow-hidden">
            <Image src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" data-ai-hint={`${item.type} image`}/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          </div>
        )}
        <div className="p-6 pt-0">
           <CardTitle className="font-headline text-2xl group-hover:text-foreground transition-colors">{item.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{item.content}</p>
      </CardContent>
      <CardFooter>
        {item.linkUrl ? (
           <Button asChild variant="link" className="text-accent p-0 hover:text-foreground">
             <Link href={item.linkUrl} target={item.linkUrl.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer">
                Learn More <ArrowRight className="ml-2 w-4 h-4" />
             </Link>
           </Button>
        ) : (
          <span className="text-sm text-muted-foreground italic">Posted on: {new Date(item.createdAt).toLocaleDateString()}</span>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-16">
      <section className="text-center py-16 md:py-24 bg-gradient-to-br from-background to-primary/10 rounded-xl shadow-2xl border border-primary/30">
        <div className="container mx-auto px-4">
          <h1 className="font-headline text-5xl md:text-7xl font-bold mb-6">
            <span className="glitch-text" data-text="MintFire">MintFire</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Pioneering the future of Cyber Security, Blockchain, AI, and IoT Devices.
          </p>
          <div className="space-x-4">
            <Button asChild size="lg" variant="default" className="shadow-lg shadow-primary/50">
              <Link href="#latest-releases">Explore Products</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="shadow-lg shadow-accent/30">
              <Link href="/company">About Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Latest Releases Section - Dynamic */}
      <section id="latest-releases" className="py-12">
        <div className="flex items-center mb-8">
          <Sparkles className="w-10 h-10 text-primary mr-4 glowing-icon-primary" />
          <h2 className="font-headline text-4xl font-bold">Latest Releases</h2>
        </div>
        {productsError && <p className="text-destructive">Could not load latest products.</p>}
        {latestProducts && latestProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          !productsError && <p className="text-muted-foreground">No featured products right now. Check back soon!</p>
        )}
      </section>

      {/* Announcements Section */}
      <section id="announcements" className="py-12">
        <div className="flex items-center mb-8">
          <Megaphone className="w-10 h-10 text-primary mr-4 glowing-icon-primary" />
          <h2 className="font-headline text-4xl font-bold">Announcements</h2>
        </div>
        {siteContentError && <p className="text-destructive">Could not load announcements.</p>}
        {announcementItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {announcementItems.map((item) => <SiteContentCard key={item.id} item={item} />)}
          </div>
        ) : (
          !siteContentError && <p className="text-muted-foreground">No announcements right now. Stay tuned!</p>
        )}
      </section>

      {/* Other Product Sections (Upcoming, Early Access, Dev Testing) - Hardcoded for now */}
      {otherSectionsData.map((section) => (
        <section key={section.sectionId} id={section.sectionId} className="py-12">
          <div className="flex items-center mb-8">
            <section.sectionIcon className="w-10 h-10 text-primary mr-4 glowing-icon-primary" />
            <h2 className="font-headline text-4xl font-bold">{section.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {section.items.map((item) => (
              <Card key={item.id} className="layered-card overflow-hidden group transition-all duration-300 ease-in-out hover:shadow-accent/30 flex flex-col">
                <CardHeader className="p-0">
                  <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
                    <Image src={item.image} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" data-ai-hint={item.dataAiHint}/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <item.icon className="absolute top-4 right-4 w-8 h-8 text-accent glowing-icon" />
                  </div>
                  <div className="p-6 pt-0">
                     <CardTitle className="font-headline text-2xl group-hover:text-foreground transition-colors">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription className="text-muted-foreground h-12 overflow-hidden">{item.description}</CardDescription>
                </CardContent>
                <CardFooter>
                  {item.link ? (
                     <Button asChild variant="link" className="text-accent p-0 hover:text-foreground">
                       <Link href={item.link}>Learn More <ArrowRight className="ml-2 w-4 h-4" /></Link>
                     </Button>
                  ) : (
                    <Button variant="outline" className="text-accent border-accent">
                      Get Notified <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <section id="core-technologies" className="py-16">
        <div className="text-center mb-12">
          <Activity className="w-12 h-12 text-primary mx-auto mb-4 glowing-icon-primary" />
          <h2 className="font-headline text-4xl font-bold">Our Core Technologies</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-2">
            Driving innovation across key technology domains to build the future.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {coreTechnologiesData.map((tech) => (
            <Card key={tech.id} className="layered-card overflow-hidden group transition-all duration-300 ease-in-out hover:shadow-primary/30 flex flex-col">
              <CardHeader className="items-center text-center">
                <div className="p-3 bg-primary/10 rounded-full inline-block mb-4 border border-primary/30 group-hover:border-primary transition-colors">
                  <tech.icon className="w-10 h-10 text-primary glowing-icon-primary transition-colors group-hover:text-accent" />
                </div>
                <CardTitle className="font-headline text-2xl group-hover:text-foreground transition-colors">{tech.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center flex-grow">
                <CardDescription className="text-muted-foreground h-16 overflow-hidden">{tech.description}</CardDescription>
              </CardContent>
              <CardFooter className="justify-center pt-4">
                 <Button asChild variant="link" className="text-accent p-0 hover:text-foreground">
                   <Link href={tech.link}>Explore Solutions <ArrowRight className="ml-2 w-4 h-4" /></Link>
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

    </div>
  );
}
