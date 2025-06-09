
import ServicePageLayout from '@/components/ServicePageLayout';
import ProductCard from '@/app/_components/ProductCard';
import { getProducts } from '@/actions/product-actions';
import type { Product } from '@/lib/schemas/product-schemas';
import { Briefcase, AlertTriangle, PackageSearch } from 'lucide-react';
import React from 'react';

export default async function IndustrialSoftwarePage() {
  const features = [
    "Supervisory Control and Data Acquisition (SCADA) Systems",
    "Manufacturing Execution Systems (MES)",
    "Industrial Internet of Things (IIoT) Platforms",
    "Custom Software for Process Optimization",
    "Predictive Maintenance Solutions",
    "Robotics Process Automation (RPA)"
  ];

  const { products, error } = await getProducts({ tag: 'industrial' });

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
      <div className="mt-12 p-8 bg-card rounded-lg shadow-lg border border-border">
        <h3 className="font-headline text-2xl font-semibold mb-4 text-primary">Powering Industrial Excellence</h3>
        <p className="text-muted-foreground">
          Our industrial software solutions are designed to meet the unique challenges of modern manufacturing and industrial environments. We focus on reliability, security, and seamless integration to empower your operations.
        </p>
      </div>

      <div className="mt-16">
        <h3 className="font-headline text-3xl font-semibold mb-8 text-center text-primary">
          Featured Industrial Software
        </h3>
        {error && (
          <div className="text-center text-destructive py-6">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
            <p>Could not load Industrial Software products: {error}</p>
          </div>
        )}
        {!error && products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          !error && (
             <div className="text-center text-muted-foreground py-10">
              <PackageSearch className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">No Industrial Software products tagged for this section currently.</p>
            </div>
          )
        )}
      </div>
    </ServicePageLayout>
  );
};
