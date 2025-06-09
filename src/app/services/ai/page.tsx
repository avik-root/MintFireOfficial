import ServicePageLayout from '@/components/ServicePageLayout';
import { Cpu } from 'lucide-react';

const AiPage = () => {
  const features = [
    "Machine Learning Model Development and Deployment",
    "Natural Language Processing (NLP) Solutions",
    "Computer Vision and Image Analysis",
    "Predictive Analytics and Data Insights",
    "AI-Powered Automation Systems",
    "Ethical AI Frameworks and Governance"
  ];

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
    </ServicePageLayout>
  );
};

export default AiPage;