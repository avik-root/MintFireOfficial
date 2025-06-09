
import ServicePageLayout from '@/components/ServicePageLayout';
import ProductCard from '@/app/_components/ProductCard';
import { getProducts } from '@/actions/product-actions';
import type { Product } from '@/lib/schemas/product-schemas';
import { Code2, AlertTriangle, PackageSearch, Sparkles } from 'lucide-react';
import React from 'react'; 

export default async function SoftwaresPage() {
  const features = [
    "Custom Application Development",
    "Enterprise Software Solutions",
    "Cloud-Native Architectures",
    "Mobile Application Development (iOS & Android)",
    "API Design and Integration Services",
    "Software Modernization and Migration"
  ];

  let productsToDisplay: Product[] = [];
  let errorLoading: string | null = null;
  let sectionTitle = "Related Software Products";
  let sectionIcon = Code2;

  const { products: taggedProducts, error: taggedError } = await getProducts({ tag: 'software' });

  if (taggedError) {
    errorLoading = taggedError;
  } else if (taggedProducts && taggedProducts.length > 0) {
    productsToDisplay = taggedProducts;
  } else {
    const { products: featuredProducts, error: featuredError } = await getProducts({ isFeatured: true, limit: 3 });
    if (featuredError) {
      errorLoading = featuredError;
    } else if (featuredProducts && featuredProducts.length > 0) {
      productsToDisplay = featuredProducts;
      sectionTitle = "Featured Products";
      sectionIcon = Sparkles;
    }
  }

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
      <div className="mt-12 p-8 bg-card rounded-lg shadow-lg border border-border">
        <h3 className="font-headline text-2xl font-semibold mb-4 text-primary">Tailored Software, Exceptional Results</h3>
        <p className="text-muted-foreground">
          MintFire specializes in developing high-quality, scalable, and secure software tailored to your unique business needs. From web and mobile applications to complex enterprise systems, we deliver solutions that perform.
        </p>
      </div>

      <div className="mt-16">
        <h3 className="font-headline text-3xl font-semibold mb-8 text-center text-primary flex items-center justify-center">
          <sectionIcon className="w-8 h-8 mr-3 glowing-icon-primary" />
          {sectionTitle}
        </h3>
        {errorLoading && (
          <div className="text-center text-destructive py-6">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
            <p>Could not load products: {errorLoading}</p>
          </div>
        )}
        {!errorLoading && productsToDisplay.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productsToDisplay.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          !errorLoading && (
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
