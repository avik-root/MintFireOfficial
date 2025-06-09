
"use client";

import React, { useState, useEffect } from 'react';
import ServicePageLayout from '@/components/ServicePageLayout';
import ProductCard from '@/app/_components/ProductCard';
import ProductDetailModal from '@/app/_components/ProductDetailModal';
import { getProducts } from '@/actions/product-actions';
import type { Product } from '@/lib/schemas/product-schemas';
import { Briefcase, AlertTriangle, PackageSearch, Sparkles, Loader2 } from 'lucide-react';

export default function IndustrialSoftwarePage() {
  const [productsToDisplay, setProductsToDisplay] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorLoading, setErrorLoading] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState("Related Industrial Software");
  const [SectionIcon, setSectionIcon] = useState<React.ElementType>(() => Briefcase);

  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setErrorLoading(null);
      let finalProducts: Product[] = [];
      let currentTitle = "Related Industrial Software";
      let currentIcon: React.ElementType = Briefcase;

      const { products: taggedProducts, error: taggedError } = await getProducts({ tag: 'industrial' });

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
    "Supervisory Control and Data Acquisition (SCADA) Systems",
    "Manufacturing Execution Systems (MES)",
    "Industrial Internet of Things (IIoT) Platforms",
    "Custom Software for Process Optimization",
    "Predictive Maintenance Solutions",
    "Robotics Process Automation (RPA)"
  ];

  const pageContent = (
    <>
      <div className="mt-12 p-8 bg-card rounded-lg shadow-lg border border-border">
        <h3 className="font-headline text-2xl font-semibold mb-4 text-primary">Powering Industrial Excellence</h3>
        <p className="text-muted-foreground">
          Our industrial software solutions are designed to meet the unique challenges of modern manufacturing and industrial environments. We focus on reliability, security, and seamless integration to empower your operations.
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
      title="Industrial Software"
      description="Developing robust and scalable software solutions to optimize industrial operations, enhance productivity, and drive digital transformation."
      icon={Briefcase}
      imageUrl="https://placehold.co/1200x800.png"
      imageAlt="Industrial Software Abstract"
      imageAiHint="industrial software"
      features={features}
    >
      {pageContent}
    </ServicePageLayout>
  );
};
