
import ServicePageLayout from '@/components/ServicePageLayout';
import ProductCard from '@/app/_components/ProductCard'; 
import { getProducts } from '@/actions/product-actions';
import type { Product } from '@/lib/schemas/product-schemas';
import { Cpu, AlertTriangle, PackageSearch, Sparkles } from 'lucide-react';
import React from 'react';

export default async function AiPage() {
  const features = [
    "Machine Learning Model Development and Deployment",
    "Natural Language Processing (NLP) Solutions",
    "Computer Vision and Image Analysis",
    "Predictive Analytics and Data Insights",
    "AI-Powered Automation Systems",
    "Ethical AI Frameworks and Governance"
  ];

  let productsToDisplay: Product[] = [];
  let errorLoading: string | null = null;
  let sectionTitle = "Related AI Products";
  let sectionIcon = Cpu;

  const { products: taggedProducts, error: taggedError } = await getProducts({ tag: 'ai' });

  if (taggedError) {
    errorLoading = taggedError;
  } else if (taggedProducts && taggedProducts.length > 0) {
    productsToDisplay = taggedProducts;
  } else {
    // No tagged products found, fetch featured products as fallback
    const { products: featuredProducts, error: featuredError } = await getProducts({ isFeatured: true, limit: 3 });
    if (featuredError) {
      errorLoading = featuredError; // Or handle combining errors if necessary
    } else if (featuredProducts && featuredProducts.length > 0) {
      productsToDisplay = featuredProducts;
      sectionTitle = "Featured Products"; // Update title for fallback
      sectionIcon = Sparkles;
    }
  }

  return (
    <ServicePageLayout
      title="Artificial Intelligence"
      description="Harnessing the power of AI to drive innovation, optimize processes, and unlock intelligent insights for your business."
      icon={Cpu}
      imageUrl="https://placehold.co/1200x800.png"
      imageAlt="Artificial Intelligence Abstract"
      imageAiHint="ai abstract"
      features={features}
    >
      <div className="mt-12 p-8 bg-card rounded-lg shadow-lg border border-border">
        <h3 className="font-headline text-2xl font-semibold mb-4 text-primary">AI for a Smarter Future</h3>
        <p className="text-muted-foreground">
         MintFire develops bespoke AI solutions that integrate seamlessly into your existing workflows, enhancing decision-making, automating complex tasks, and creating new opportunities for growth and efficiency.
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
