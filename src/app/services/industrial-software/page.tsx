import ServicePageLayout from '@/components/ServicePageLayout';
import { Briefcase } from 'lucide-react';

const IndustrialSoftwarePage = () => {
  const features = [
    "Supervisory Control and Data Acquisition (SCADA) Systems",
    "Manufacturing Execution Systems (MES)",
    "Industrial Internet of Things (IIoT) Platforms",
    "Custom Software for Process Optimization",
    "Predictive Maintenance Solutions",
    "Robotics Process Automation (RPA)"
  ];

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
    </ServicePageLayout>
  );
};

export default IndustrialSoftwarePage;