
import ServicePageLayout from '@/components/ServicePageLayout';
import ProductCard from '@/app/_components/ProductCard';
import { getProducts } from '@/actions/product-actions';
import type { Product } from '@/lib/schemas/product-schemas';
import { ShieldCheck, AlertTriangle, PackageSearch } from 'lucide-react';
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

  const { products, error } = await getProducts({ tag: 'security' });

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
        <h3 className="font-headline text-3xl font-semibold mb-8 text-center text-primary">
          Featured Security Products
        </h3>
        {error && (
          <div className="text-center text-destructive py-6">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
            <p>Could not load Security products: {error}</p>
          </div>
        )}
        {!error && products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onViewDetailsClick={() => {
                 if (product.productUrl) window.open(product.productUrl, '_blank');
              }} />
            ))}
          </div>
        ) : (
          !error && (
             <div className="text-center text-muted-foreground py-10">
              <PackageSearch className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">No Security products tagged for this section currently.</p>
            </div>
          )
        )}
      </div>
    </ServicePageLayout>
  );
};
