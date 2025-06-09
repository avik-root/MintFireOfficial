
import ServicePageLayout from '@/components/ServicePageLayout';
import ProductCard from '@/app/_components/ProductCard';
import { getProducts } from '@/actions/product-actions';
import type { Product } from '@/lib/schemas/product-schemas';
import { Blocks, AlertTriangle, PackageSearch } from 'lucide-react';
import React from 'react';

const BlockchainPage = () => {
  const features = [
    "Decentralized Application (dApp) Development",
    "Smart Contract Design and Auditing",
    "Custom Blockchain Solutions and Integration",
    "Tokenization and Digital Asset Management",
    "Supply Chain Transparency Solutions",
    "Secure Identity Verification Systems"
  ];
  
  // This page is a server component, so we fetch data directly
  const [productsData, setProductsData] = React.useState<{ products?: Product[]; error?: string }>({});
  React.useEffect(() => {
    async function fetchData() {
      const data = await getProducts({ tag: 'blockchain' });
      setProductsData(data);
    }
    fetchData();
  }, []);
  const { products, error } = productsData;


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
        <h3 className="font-headline text-3xl font-semibold mb-8 text-center text-primary">
          Featured Blockchain Products
        </h3>
        {error && (
          <div className="text-center text-destructive py-6">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
            <p>Could not load Blockchain products: {error}</p>
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
              <p className="text-lg">No Blockchain products tagged for this section currently.</p>
            </div>
          )
        )}
      </div>
    </ServicePageLayout>
  );
};

export default BlockchainPage;
