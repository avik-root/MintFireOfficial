
import ServicePageLayout from '@/components/ServicePageLayout';
import ProductCard from '@/app/_components/ProductCard';
import { getProducts } from '@/actions/product-actions';
import type { Product } from '@/lib/schemas/product-schemas';
import { Smartphone, AlertTriangle, PackageSearch } from 'lucide-react';
import React from 'react';

export default async function IotDevicesPage() {
  const features = [
    "Custom IoT Device Design and Prototyping",
    "Embedded Systems Development",
    "IoT Sensor Integration and Network Setup",
    "Cloud-Based IoT Data Platforms",
    "Edge Computing Solutions for IoT",
    "Secure Device Lifecycle Management"
  ];

  const { products, error } = await getProducts({ tag: 'iot' });

  return (
    <ServicePageLayout
      title="IoT Devices & Solutions"
      description="Connecting the physical and digital worlds with innovative IoT devices and comprehensive platform solutions for data-driven insights."
      icon={Smartphone}
      imageUrl="https://placehold.co/1200x800.png"
      imageAlt="IoT Devices Abstract"
      imageAiHint="iot devices"
      features={features}
    >
      <div className="mt-12 p-8 bg-card rounded-lg shadow-lg border border-border">
        <h3 className="font-headline text-2xl font-semibold mb-4 text-primary">Intelligent Connectivity, Tangible Results</h3>
        <p className="text-muted-foreground">
         MintFire provides end-to-end IoT solutions, from custom hardware design to sophisticated data analytics platforms. We enable businesses to harness the power of connected devices for enhanced efficiency, new revenue streams, and improved customer experiences.
        </p>
      </div>

      <div className="mt-16">
        <h3 className="font-headline text-3xl font-semibold mb-8 text-center text-primary">
          Featured IoT Products
        </h3>
        {error && (
          <div className="text-center text-destructive py-6">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
            <p>Could not load IoT products: {error}</p>
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
              <p className="text-lg">No IoT products tagged for this section currently.</p>
            </div>
          )
        )}
      </div>
    </ServicePageLayout>
  );
};
