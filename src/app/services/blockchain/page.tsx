
"use client"; 

import ServicePageLayout from '@/components/ServicePageLayout';
import ProductCard from '@/app/_components/ProductCard';
import { getProducts } from '@/actions/product-actions';
import type { Product } from '@/lib/schemas/product-schemas';
import { Blocks, AlertTriangle, PackageSearch, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const BlockchainPage = () => {
  const features = [
    "Decentralized Application (dApp) Development",
    "Smart Contract Design and Auditing",
    "Custom Blockchain Solutions and Integration",
    "Tokenization and Digital Asset Management",
    "Supply Chain Transparency Solutions",
    "Secure Identity Verification Systems"
  ];
  
  const [productsToDisplay, setProductsToDisplay] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorLoading, setErrorLoading] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState("Related Blockchain Products");
  const [SectionIcon, setSectionIcon] = useState(() => Blocks);


  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setErrorLoading(null);
      let finalProducts: Product[] = [];
      let currentTitle = "Related Blockchain Products";
      let currentIcon = Blocks;

      const { products: taggedProducts, error: taggedError } = await getProducts({ tag: 'blockchain' });

      if (taggedError) {
        setErrorLoading(taggedError);
      } else if (taggedProducts && taggedProducts.length > 0) {
        finalProducts = taggedProducts;
      } else {
        const { products: featuredProducts, error: featuredError } = await getProducts({ isFeatured: true, limit: 3 });
        if (featuredError) {
          setErrorLoading(featuredError);
        } else if (featuredProducts && featuredProducts.length > 0) {
          finalProducts = featuredProducts;
          currentTitle = "Featured Products";
          currentIcon = Sparkles;
        }
      }
      setProductsToDisplay(finalProducts);
      setSectionTitle(currentTitle);
      setSectionIcon(() => currentIcon); // Store the component type itself
      setIsLoading(false);
    }
    fetchData();
  }, []);


  return (
    <ServicePageLayout
      title="Blockchain Solutions"
      description="Leveraging distributed ledger technology to build transparent, secure, and efficient systems for a new era of digital trust."
      icon={Blocks}
      imageUrl="https://placehold.co/1200x800.png"
      imageAlt="Blockchain Technology Abstract"
      imageAiHint="blockchain abstract"
      features={features}
    >
      <div className="mt-12 p-8 bg-card rounded-lg shadow-lg border border-border">
        <h3 className="font-headline text-2xl font-semibold mb-4 text-primary">Transforming Industries with Blockchain</h3>
        <p className="text-muted-foreground">
          MintFire's blockchain expertise helps organizations unlock new efficiencies, enhance security, and create innovative business models. From finance to logistics, we deliver tailored blockchain solutions that drive real-world value.
        </p>
      </div>

      <div className="mt-16">
        <h3 className="font-headline text-3xl font-semibold mb-8 text-center text-primary flex items-center justify-center">
            <SectionIcon className="w-8 h-8 mr-3 glowing-icon-primary" />
            {sectionTitle}
        </h3>
        {isLoading && <p className="text-center text-muted-foreground">Loading products...</p>}
        {errorLoading && (
          <div className="text-center text-destructive py-6">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
            <p>Could not load products: {errorLoading}</p>
          </div>
        )}
        {!isLoading && !errorLoading && productsToDisplay.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productsToDisplay.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          !isLoading && !errorLoading && (
             <div className="text-center text-muted-foreground py-10">
              <PackageSearch className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">No relevant products to display currently.</p>
            </div>
          )
        )}
      </div>
    </ServicePageLayout>
  );
};

export default BlockchainPage;
