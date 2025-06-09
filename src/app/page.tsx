
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Cpu, Smartphone, Sparkles, ShieldCheck, Blocks, Activity, Megaphone, Package, TestTube, Construction, Info } from 'lucide-react';
import Link from 'next/link';
import { getSiteContentItems } from '@/actions/site-content-actions';
import type { SiteContentItem } from '@/lib/schemas/site-content-schemas';
import { getProducts } from '@/actions/product-actions';
import type { Product } from '@/lib/schemas/product-schemas';
import ProductCard from './_components/ProductCard'; 
import ProductDetailModal from './_components/ProductDetailModal';

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


export default function Home() {
  const [siteContent, setSiteContent] = useState<SiteContentItem[]>([]);
  const [siteContentError, setSiteContentError] = useState<string | null>(null);
  
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [latestProductsError, setLatestProductsError] = useState<string | null>(null);
  
  const [upcomingProducts, setUpcomingProducts] = useState<Product[]>([]);
  const [upcomingProductsError, setUpcomingProductsError] = useState<string | null>(null);

  const [betaProducts, setBetaProducts] = useState<Product[]>([]);
  const [betaProductsError, setBetaProductsError] = useState<string | null>(null);
  
  const [alphaProducts, setAlphaProducts] = useState<Product[]>([]);
  const [alphaProductsError, setAlphaProductsError] = useState<string | null>(null);

  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const scResult = await getSiteContentItems();
      if (scResult.items) setSiteContent(scResult.items);
      if (scResult.error) setSiteContentError(scResult.error);

      const lpResult = await getProducts({ isFeatured: true, limit: 3 });
      if (lpResult.products) setLatestProducts(lpResult.products);
      if (lpResult.error) setLatestProductsError(lpResult.error);
      
      const upResult = await getProducts({ status: 'Upcoming', limit: 3 });
      if (upResult.products) setUpcomingProducts(upResult.products);
      if (upResult.error) setUpcomingProductsError(upResult.error);

      const betaResult = await getProducts({ status: 'Beta', limit: 3 });
      if (betaResult.products) setBetaProducts(betaResult.products);
      if (betaResult.error) setBetaProductsError(betaResult.error);

      const alphaResult = await getProducts({ status: 'Alpha', limit: 3 });
      if (alphaResult.products) setAlphaProducts(alphaResult.products);
      if (alphaResult.error) setAlphaProductsError(alphaResult.error);
    }
    fetchData();
  }, []);

  const handleOpenProductModal = (product: Product) => {
    setSelectedProductForModal(product);
    setIsProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedProductForModal(null);
  };

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

  const ProductSection = ({ title, products, error, icon: Icon, sectionId }: { title: string, products?: Product[], error?: string, icon: React.ElementType, sectionId: string }) => {
    if (error) {
      return (
        <section id={sectionId} className="py-12">
          <div className="flex items-center mb-8">
            <Icon className="w-10 h-10 text-primary mr-4 glowing-icon-primary" />
            <h2 className="font-headline text-4xl font-bold">{title}</h2>
          </div>
          <p className="text-destructive">Could not load {title.toLowerCase()}.</p>
        </section>
      );
    }
    if (!products || products.length === 0) {
      return (
        <section id={sectionId} className="py-12">
          <div className="flex items-center mb-8">
            <Icon className="w-10 h-10 text-primary mr-4 glowing-icon-primary" />
            <h2 className="font-headline text-4xl font-bold">{title}</h2>
          </div>
          <p className="text-muted-foreground">No products in this category right now. Check back soon!</p>
        </section>
      );
    }
    return (
      <section id={sectionId} className="py-12">
        <div className="flex items-center mb-8">
          <Icon className="w-10 h-10 text-primary mr-4 glowing-icon-primary" />
          <h2 className="font-headline text-4xl font-bold">{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onViewDetailsClick={handleOpenProductModal} />
          ))}
        </div>
      </section>
    );
  };


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

      <ProductSection 
        title="Latest Releases"
        products={latestProducts}
        error={latestProductsError}
        icon={Sparkles}
        sectionId="latest-releases"
      />

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

      <ProductSection 
        title="Upcoming Products"
        products={upcomingProducts}
        error={upcomingProductsError}
        icon={Cpu} // Was Package, using Cpu for "Upcoming"
        sectionId="upcoming-products"
      />

      <ProductSection 
        title="Early Access Program"
        products={betaProducts}
        error={betaProductsError}
        icon={TestTube} 
        sectionId="early-access"
      />
      
      <ProductSection 
        title="Developer Testing"
        products={alphaProducts}
        error={alphaProductsError}
        icon={Construction}
        sectionId="dev-testing"
      />


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
      
      {selectedProductForModal && (
        <ProductDetailModal
          product={selectedProductForModal}
          isOpen={isProductModalOpen}
          onClose={handleCloseProductModal}
        />
      )}
    </div>
  );
}
