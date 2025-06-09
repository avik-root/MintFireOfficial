import ServicePageLayout from '@/components/ServicePageLayout';
import { Smartphone } from 'lucide-react';

const IotDevicesPage = () => {
  const features = [
    "Custom IoT Device Design and Prototyping",
    "Embedded Systems Development",
    "IoT Sensor Integration and Network Setup",
    "Cloud-Based IoT Data Platforms",
    "Edge Computing Solutions for IoT",
    "Secure Device Lifecycle Management"
  ];

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
    </ServicePageLayout>
  );
};

export default IotDevicesPage;