
"use client";

import React, { useState, useEffect } from 'react';
import ServicePageLayout from '@/components/ServicePageLayout';
import ProductCard from '@/app/_components/ProductCard';
import ProductDetailModal from '@/app/_components/ProductDetailModal';
import { getProducts } from '@/actions/product-actions';
import type { Product } from '@/lib/schemas/product-schemas';
import { Code2, AlertTriangle, PackageSearch, Sparkles, Loader2 } from 'lucide-react';

export default function SoftwaresPage() {
  const [productsToDisplay, setProductsToDisplay] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorLoading, setErrorLoading] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState("Related Software Products");
  const [SectionIcon, setSectionIcon] = useState<React.ElementType>(() => Code2);

  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setErrorLoading(null);
      let finalProducts: Product[] = [];
      let currentTitle = "Related Software Products";
      let currentIcon: React.ElementType = Code2;

      const { products: taggedProducts, error: taggedError } = await getProducts({ tag: 'software' });

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
      setSectionIcon(() => currentIcon);
      setIsLoading(false);
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
  
  const features = [
    "Custom Application Development",
    "Enterprise Software Solutions",
    "Cloud-Native Architectures",
    "Mobile Application Development (iOS & Android)",
    "API Design and Integration Services",
    "Software Modernization and Migration"
  ];

  const pageContent = (
    <>
      <div className="mt-12 p-8 bg-card rounded-lg shadow-lg border border-border">
        <h3 className="font-headline text-2xl font-semibold mb-4 text-primary">Tailored Software, Exceptional Results</h3>
        <p className="text-muted-foreground">
          MintFire specializes in developing high-quality, scalable, and secure software tailored to your unique business needs. From web and mobile applications to complex enterprise systems, we deliver solutions that perform.
        </p>
      </div>

      <div className="mt-16">
        <h3 className="font-headline text-3xl font-semibold mb-8 text-center text-primary flex items-center justify-center">
          <SectionIcon className="w-8 h-8 mr-3 glowing-icon-primary" />
          {sectionTitle}
        </h3>
        {isLoading && (
           <div className="text-center py-10">
             <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
             <p className="mt-4 text-muted-foreground">Loading products...</p>
           </div>
        )}
        {errorLoading && !isLoading && (
          <div className="text-center text-destructive py-6">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
            <p>Could not load products: {errorLoading}</p>
          </div>
        )}
        {!isLoading && !errorLoading && productsToDisplay.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productsToDisplay.map((product) => (
              <ProductCard key={product.id} product={product} onViewDetailsClick={handleOpenProductModal} />
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
      {selectedProductForModal && (
        <ProductDetailModal
          product={selectedProductForModal}
          isOpen={isProductModalOpen}
          onClose={handleCloseProductModal}
        />
      )}
    </>
  );

  return (
    <ServicePageLayout
      title="Software Solutions"
      description="Crafting bespoke software solutions that power businesses, enhance user experiences, and drive digital transformation."
      icon={Code2}
      imageUrl="https://placehold.co/1200x800.png"
      imageAlt="Software Solutions Abstract"
      imageAiHint="software development code"
      features={features}
    >
      {pageContent}
    </ServicePageLayout>
  );
};
