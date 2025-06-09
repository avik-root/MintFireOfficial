import ServicePageLayout from '@/components/ServicePageLayout';
import { Blocks } from 'lucide-react';

const BlockchainPage = () => {
  const features = [
    "Decentralized Application (dApp) Development",
    "Smart Contract Design and Auditing",
    "Custom Blockchain Solutions and Integration",
    "Tokenization and Digital Asset Management",
    "Supply Chain Transparency Solutions",
    "Secure Identity Verification Systems"
  ];

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
    </ServicePageLayout>
  );
};

export default BlockchainPage;