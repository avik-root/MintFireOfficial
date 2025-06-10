
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ArrowRight, CheckCircle, Cpu, Smartphone, Sparkles, ShieldCheck, Blocks, Activity, Megaphone, Package, TestTube, Construction, Info, Code2, Search, ArrowUpDown, Archive, Loader2, AlertTriangle, SlidersHorizontal, PackageSearch, MessageSquareHeart, Bug } from 'lucide-react';
import Link from 'next/link';
import { getSiteContentItems } from '@/actions/site-content-actions';
import type { SiteContentItem } from '@/lib/schemas/site-content-schemas';
import { getProducts } from '@/actions/product-actions';
import type { Product } from '@/lib/schemas/product-schemas';
import ProductCard from './_components/ProductCard'; 
import ProductDetailModal from './_components/ProductDetailModal';
import FeedbackForm from './_components/FeedbackForm';
import BugReportForm from './_components/BugReportForm'; // Import BugReportForm
import { incrementProductView } from '@/actions/analytics-actions';


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
  { id: "ct4", title: "IoT Devices", description: "Connecting the physical world with smart, secure devices.", icon: Smartphone, link: "/services/iot-devices" },
  { id: "ct5", title: "Industrial Software", description: "Optimizing industrial operations with robust software.", icon: Package, link: "/services/industrial-software" }, 
  { id: "ct6", title: "Software Solutions", description: "Crafting bespoke software to meet diverse business needs.", icon: Code2, link: "/services/softwares" },
];

type ProductSortKey = 'name' | 'releaseDate' | 'status' | 'pricingType' | 'isFeatured' | 'createdAt';


export default function Home() {
  const [siteContent, setSiteContent] = useState<SiteContentItem[]>([]);
  const [siteContentError, setSiteContentError] = useState<string | null>(null);
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allProductsLoading, setAllProductsLoading] = useState(true);
  const [allProductsError, setAllProductsError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<ProductSortKey>('releaseDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');


  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [featuredProductsError, setFeaturedProductsError] = useState<string | null>(null);
  
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
      setAllProductsLoading(true);
      const scResult = await getSiteContentItems();
      if (scResult.items) setSiteContent(scResult.items);
      if (scResult.error) setSiteContentError(scResult.error);

      const allProdResult = await getProducts();
      if (allProdResult.products) setAllProducts(allProdResult.products);
      if (allProdResult.error) setAllProductsError(allProdResult.error);
      setAllProductsLoading(false);

      const fpResult = await getProducts({ isFeatured: true, limit: 3 });
      if (fpResult.products) setFeaturedProducts(fpResult.products);
      if (fpResult.error) setFeaturedProductsError(fpResult.error);
      
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

  const handleOpenProductModal = async (product: Product) => {
    setSelectedProductForModal(product);
    setIsProductModalOpen(true);
    try {
      await incrementProductView(product.id);
    } catch (error) {
      console.warn("Failed to increment product view count:", error);
    }
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

  const ProductSection = ({ title, products, error, icon: Icon, sectionId, limit = 3 }: { title: string, products?: Product[], error?: string, icon: React.ElementType, sectionId: string, limit?: number }) => {
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
    const displayProducts = products?.slice(0, limit);
    if (!displayProducts || displayProducts.length === 0) {
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
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} onViewDetailsClick={handleOpenProductModal} />
          ))}
        </div>
      </section>
    );
  };

  const filteredAndSortedAllProducts = useMemo(() => {
    let productsToDisplay = [...allProducts];

    if (searchTerm) {
      productsToDisplay = productsToDisplay.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.developer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.version && product.version.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.couponDetails && product.couponDetails.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.activationDetails && product.activationDetails.toLowerCase().includes(searchTerm.toLowerCase())) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    productsToDisplay.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === 'releaseDate' || sortKey === 'createdAt') {
        valA = a[sortKey] ? new Date(a[sortKey]!).getTime() : 0;
        valB = b[sortKey] ? new Date(b[sortKey]!).getTime() : 0;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        valA = valA ? 1 : 0;
        valB = valB ? 1 : 0;
      }
      
      if (sortKey === 'pricingType') {
        valA = a.priceAmount ?? (a.pricingType === 'Free' ? 0 : Infinity);
        valB = b.priceAmount ?? (b.pricingType === 'Free' ? 0 : Infinity);
      }

      let comparison = 0;
      if (valA > valB) comparison = 1;
      else if (valA < valB) comparison = -1;
      
      return sortDirection === 'desc' ? comparison * -1 : comparison;
    });

    return productsToDisplay;
  }, [allProducts, searchTerm, sortKey, sortDirection]);


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
              <Link href="#all-products-showcase">Explore Products</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="shadow-lg shadow-accent/30">
              <Link href="/company">About Us</Link>
            </Button>
          </div>
        </div>
      </section>

      <ProductSection 
        title="Featured Products"
        products={featuredProducts}
        error={featuredProductsError}
        icon={Sparkles}
        sectionId="featured-products"
      />

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
        icon={Cpu} 
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

      <section id="all-products-showcase" className="py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center">
            <Archive className="w-10 h-10 text-primary mr-4 glowing-icon-primary" />
            <h2 className="font-headline text-4xl font-bold">All Products</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search all products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
              <Select 
                value={sortKey} 
                onValueChange={(value) => {
                  setSortKey(value as ProductSortKey);
                  if (value === 'name' || value === 'status' || value === 'pricingType') {
                    setSortDirection('asc');
                  } else {
                    setSortDirection('desc'); 
                  }
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="releaseDate">Release Date</SelectItem>
                   <SelectItem value="createdAt">Date Added</SelectItem>
                  <SelectItem value="pricingType">Price</SelectItem>
                  <SelectItem value="isFeatured">Featured</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}>
                  <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {allProductsLoading && (
          <div className="flex flex-col items-center justify-center min-h-[200px]">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        )}
        {allProductsError && (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-destructive">
            <AlertTriangle className="w-12 h-12 mb-4" />
            <p>Error loading products: {allProductsError}</p>
          </div>
        )}
        {!allProductsLoading && !allProductsError && filteredAndSortedAllProducts.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <PackageSearch className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg">{searchTerm ? "No products match your search." : "No products available at the moment."}</p>
          </div>
        )}
        {!allProductsLoading && !allProductsError && filteredAndSortedAllProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAndSortedAllProducts.map((product) => (
              <ProductCard key={product.id} product={product} onViewDetailsClick={handleOpenProductModal} />
            ))}
          </div>
        )}
      </section>

      <section id="core-technologies" className="py-16">
        <div className="text-center mb-12">
          <Activity className="w-12 h-12 text-primary mx-auto mb-4 glowing-icon-primary" />
          <h2 className="font-headline text-4xl font-bold">Our Core Technologies</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-2">
            Driving innovation across key technology domains to build the future.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
      
      <section id="feedback" className="py-16">
        <div className="container mx-auto px-4 max-w-2xl">
           <Card className="layered-card w-full">
            <CardHeader className="text-center">
                <MessageSquareHeart className="w-12 h-12 text-primary mx-auto mb-4 glowing-icon-primary" />
                <CardTitle className="font-headline text-3xl">Share Your Feedback</CardTitle>
                <CardDescription>We value your opinion. Let us know how we can improve.</CardDescription>
            </CardHeader>
            <CardContent>
                 <FeedbackForm />
            </CardContent>
        </Card>
        </div>
      </section>

      <section id="report-bugs" className="py-16">
        <div className="container mx-auto px-4 max-w-2xl">
           <Card className="layered-card w-full">
            <CardHeader className="text-center">
                <Bug className="w-12 h-12 text-primary mx-auto mb-4 glowing-icon-primary" />
                <CardTitle className="font-headline text-3xl">Report a Bug</CardTitle>
                <CardDescription>Help us improve MintFire by reporting any bugs or vulnerabilities you find. Your efforts are appreciated!</CardDescription>
            </CardHeader>
            <CardContent>
                 <BugReportForm />
            </CardContent>
           </Card>
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

