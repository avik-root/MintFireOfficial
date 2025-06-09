import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Clock, GitBranch, Sparkles, TestTube2 } from 'lucide-react';
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
      { id: "up1", title: "Project Chimera AI", description: "Adaptive AI core for industrial automation.", icon: Cpu, image: "https://placehold.co/600x400.png", dataAiHint: "artificial intelligence" },
      { id: "up2", title: "Helios IoT Platform", description: "Scalable platform for interconnected smart devices.", icon: Smartphone, image: "https://placehold.co/600x400.png", dataAiHint: "iot devices" },
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

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="text-center py-16 md:py-24 bg-gradient-to-br from-background to-primary/10 rounded-xl shadow-2xl border border-primary/30">
        <div className="container mx-auto px-4">
          <h1 className="font-headline text-5xl md:text-7xl font-bold mb-6">
            <span className="glitch-text" data-text="MintFire">MintFire</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Pioneering the future of Cyber Security, Blockchain, AI, Industrial Software, and IoT Devices.
          </p>
          <div className="space-x-4">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground glowing-icon-primary shadow-lg shadow-primary/50">
              <Link href="#latest-releases">Explore Products</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-accent text-accent hover:bg-accent/10 hover:text-accent glowing-icon shadow-lg shadow-accent/30">
              <Link href="/company">About Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {sectionsData.map((section) => (
        <section key={section.id} id={section.sectionId} className="py-12">
          <div className="flex items-center mb-8">
            <section.sectionIcon className="w-10 h-10 text-primary mr-4 glowing-icon-primary" />
            <h2 className="font-headline text-4xl font-bold">{section.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {section.items.map((item) => (
              <Card key={item.id} className="layered-card overflow-hidden group transition-all duration-300 ease-in-out hover:shadow-accent/30">
                <CardHeader>
                  <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
                    <Image src={item.image} alt={item.title} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" data-ai-hint={item.dataAiHint}/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <item.icon className="absolute top-4 right-4 w-8 h-8 text-accent glowing-icon" />
                  </div>
                  <CardTitle className="font-headline text-2xl group-hover:text-primary transition-colors">{item.title}</CardTitle>
                  <CardDescription className="text-muted-foreground h-12 overflow-hidden">{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {item.link ? (
                     <Button asChild variant="link" className="text-accent p-0 hover:text-primary">
                       <Link href={item.link}>Learn More <ArrowRight className="ml-2 w-4 h-4" /></Link>
                     </Button>
                  ) : (
                    <Button variant="outline" className="text-accent border-accent hover:bg-accent hover:text-accent-foreground">
                      Get Notified <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    