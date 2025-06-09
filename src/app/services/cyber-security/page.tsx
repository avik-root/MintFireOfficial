
import ServicePageLayout from '@/components/ServicePageLayout';
import ProductCard from '@/app/_components/ProductCard';
import { getProducts } from '@/actions/product-actions';
import type { Product } from '@/lib/schemas/product-schemas';
import { ShieldCheck, AlertTriangle, PackageSearch, Sparkles } from 'lucide-react';
import React from 'react';

export default async function CyberSecurityPage() {
  const features = [
    "Advanced Threat Intelligence and Detection",
    "Next-Generation Endpoint Protection",
    "Comprehensive Network Security Solutions",
    "Data Encryption and Privacy Management",
    "Security Operations Center (SOC) as a Service",
    "Compliance and Risk Management"
  ];

  let productsToDisplay: Product[] = [];
  let errorLoading: string | null = null;
  let sectionTitle = "Related Security Products";
  let SectionIcon = ShieldCheck; // Renamed to uppercase

  const { products: taggedProducts, error: taggedError } = await getProducts({ tag: 'security' });

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
      SectionIcon = Sparkles; // Renamed to uppercase
    }
  }

  return (
    <ServicePageLayout
      title="Cyber Security"
      description="Fortifying your digital assets with state-of-the-art cyber defense mechanisms and proactive threat mitigation strategies."
      icon={ShieldCheck}
      imageUrl="https://placehold.co/1200x800.png"
      imageAlt="Cyber Security Abstract"
      imageAiHint="cyber security abstract"
      features={features}
    >
      <div className="mt-12 p-8 bg-card rounded-lg shadow-lg border border-border">
        <h3 className="font-headline text-2xl font-semibold mb-4 text-primary">Our Approach to Cyber Security</h3>
        <p className="text-muted-foreground">
          We employ a multi-layered security strategy, combining AI-driven analytics, behavioral analysis, and expert human oversight to provide robust protection against evolving cyber threats. Our solutions are tailored to your specific industry and organizational needs.
        </p>
      </div>

       <div className="mt-16">
        <h3 className="font-headline text-3xl font-semibold mb-8 text-center text-primary flex items-center justify-center">
          <SectionIcon className="w-8 h-8 mr-3 glowing-icon-primary" />
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

