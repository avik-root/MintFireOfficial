
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Clock, Cpu, GitBranch, Smartphone, Sparkles, TestTube2, ShieldCheck, Blocks, Activity } from 'lucide-react';
import Link from 'next/link';

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  image: string;
  dataAiHint: string;
  link?: string;
}

const sectionsData: Array<{ title: string; items: FeatureItem[]; sectionIcon: React.ElementType; sectionId: string }> = [
  {
    title: "Latest Releases",
    sectionIcon: Sparkles,
    sectionId: "latest-releases",
    items: [
      { id: "lr1", title: "CyberGuard Suite 3.0", description: "Advanced threat detection and response system.", icon: CheckCircle, image: "https://placehold.co/600x400.png", dataAiHint: "cyber security", link: "/services/cyber-security" },
      { id: "lr2", title: "NovaChain Ledger", description: "Next-gen decentralized ledger technology.", icon: CheckCircle, image: "https://placehold.co/600x400.png", dataAiHint: "blockchain network", link: "/services/blockchain"},
    ],
  },
  {
    title: "Upcoming Products",
    sectionIcon: Clock,
    sectionId: "upcoming-products",
    items: [
      { id: "up1", title: "Project Chimera AI", description: "Adaptive AI core for industrial automation.", icon: Cpu, image: "https://placehold.co/600x400.png", dataAiHint: "artificial intelligence", link: "/services/ai" },
      { id: "up2", title: "Helios IoT Platform", description: "Scalable platform for interconnected smart devices.", icon: Smartphone, image: "https://placehold.co/600x400.png", dataAiHint: "iot devices", link: "/services/iot-devices" },
    ],
  },
  {
    title: "Early Access Programs",
    sectionIcon: GitBranch,
    sectionId: "early-access",
    items: [
      { id: "ea1", title: "QuantumLeap OS", description: "Join the beta for our revolutionary operating system.", icon: TestTube2, image: "https://placehold.co/600x400.png", dataAiHint: "software code" },
    ],
  },
  {
    title: "Developer Testing",
    sectionIcon: TestTube2,
    sectionId: "dev-testing",
    items: [
      { id: "dt1", title: "ForgeSDK Alpha", description: "Access our latest SDK for AI model development.", icon: Cpu, image: "https://placehold.co/600x400.png", dataAiHint: "developer tools" },
    ],
  },
];

interface CoreTechnology {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  link: string;
}

const coreTechnologiesData: CoreTechnology[] = [
  { id: "ct1", title: "Cyber Security", description: "Protecting digital assets with cutting-edge defense mechanisms.", icon: ShieldCheck, link: "/services/cyber-security" },
  { id: "ct2", title: "Blockchain", description: "Building transparent and secure decentralized solutions.", icon: Blocks, link: "/services/blockchain" },
  { id: "ct3", title: "Artificial Intelligence", description: "Leveraging AI to create intelligent systems and insights.", icon: Cpu, link: "/services/ai" },
  { id: "ct5", title: "IoT Devices", description: "Connecting the physical world with smart, secure devices.", icon: Smartphone, link: "/services/iot-devices" },
];


export default function Home() {
  return (
    <div className="space-y-16">
      <section className="text-center py-16 md:py-24 bg-gradient-to-br from-background to-primary/10 rounded-xl shadow-2xl border border-primary/30">
        <div className="container mx-auto px-4">
          <h1 className="font-headline text-5xl md:text-7xl font-bold mb-6">
            <span className="glitch-text" data-text="MintFire">MintFire</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Pioneering the future of Cyber Security, Blockchain, AI, and IoT Devices.
          </p>
          <div className="space-x-4">
            <Button asChild size="lg" variant="default" className="shadow-lg shadow-primary/50">
              <Link href="#latest-releases">Explore Products</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="shadow-lg shadow-accent/30">
              <Link href="/company">About Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {sectionsData.map((section) => (
        <section key={section.sectionId} id={section.sectionId} className="py-12">
          <div className="flex items-center mb-8">
            <section.sectionIcon className="w-10 h-10 text-primary mr-4 glowing-icon-primary" />
            <h2 className="font-headline text-4xl font-bold">{section.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {section.items.map((item) => (
              <Card key={item.id} className="layered-card overflow-hidden group transition-all duration-300 ease-in-out hover:shadow-accent/30">
                <CardHeader>
                  <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
                    <Image src={item.image} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" data-ai-hint={item.dataAiHint}/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <item.icon className="absolute top-4 right-4 w-8 h-8 text-accent glowing-icon" />
                  </div>
                  <CardTitle className="font-headline text-2xl group-hover:text-foreground transition-colors">{item.title}</CardTitle>
                  <CardDescription className="text-muted-foreground h-12 overflow-hidden">{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {item.link ? (
                     <Button asChild variant="link" className="text-accent p-0 hover:text-foreground">
                       <Link href={item.link}>Learn More <ArrowRight className="ml-2 w-4 h-4" /></Link>
                     </Button>
                  ) : (
                    <Button variant="outline" className="text-accent border-accent">
                      Get Notified <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <section id="core-technologies" className="py-16">
        <div className="text-center mb-12">
          <Activity className="w-12 h-12 text-primary mx-auto mb-4 glowing-icon-primary" />
          <h2 className="font-headline text-4xl font-bold">Our Core Technologies</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-2">
            Driving innovation across key technology domains to build the future.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {coreTechnologiesData.map((tech) => (
            <Card key={tech.id} className="layered-card overflow-hidden group transition-all duration-300 ease-in-out hover:shadow-primary/30 flex flex-col">
              <CardHeader className="items-center text-center">
                <div className="p-3 bg-primary/10 rounded-full inline-block mb-4 border border-primary/30 group-hover:border-primary transition-colors">
                  <tech.icon className="w-10 h-10 text-primary glowing-icon-primary transition-colors group-hover:text-accent" />
                </div>
                <CardTitle className="font-headline text-2xl group-hover:text-foreground transition-colors">{tech.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center flex-grow">
                <CardDescription className="text-muted-foreground h-16 overflow-hidden">{tech.description}</CardDescription>
              </CardContent>
              <CardFooter className="justify-center pt-4">
                 <Button asChild variant="link" className="text-accent p-0 hover:text-foreground">
                   <Link href={tech.link}>Explore Solutions <ArrowRight className="ml-2 w-4 h-4" /></Link>
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
