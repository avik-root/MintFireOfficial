import ServicePageLayout from '@/components/ServicePageLayout';
import { ShieldCheck } from 'lucide-react';

const CyberSecurityPage = () => {
  const features = [
    "Advanced Threat Intelligence and Detection",
    "Next-Generation Endpoint Protection",
    "Comprehensive Network Security Solutions",
    "Data Encryption and Privacy Management",
    "Security Operations Center (SOC) as a Service",
    "Compliance and Risk Management"
  ];

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
      {/* Additional content specific to Cyber Security can go here */}
      <div className="mt-12 p-8 bg-card rounded-lg shadow-lg border border-border">
        <h3 className="font-headline text-2xl font-semibold mb-4 text-primary">Our Approach to Cyber Security</h3>
        <p className="text-muted-foreground">
          We employ a multi-layered security strategy, combining AI-driven analytics, behavioral analysis, and expert human oversight to provide robust protection against evolving cyber threats. Our solutions are tailored to your specific industry and organizational needs.
        </p>
      </div>
    </ServicePageLayout>
  );
};

export default CyberSecurityPage;