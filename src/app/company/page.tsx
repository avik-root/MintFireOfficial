import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Zap, Target, Lightbulb } from 'lucide-react';

const CompanyPage = () => {
  return (
    <div className="space-y-12">
      <section className="text-center py-12">
        <Zap className="w-24 h-24 text-primary mx-auto mb-6 glowing-icon-primary" />
        <h1 className="font-headline text-5xl font-bold mb-4">About MintFire</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          MintFire is at the forefront of technological innovation, committed to developing cutting-edge solutions
          that redefine industries and shape the future.
        </p>
      </section>

      <section>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-headline text-3xl font-semibold mb-4 text-primary">Our Mission</h2>
            <p className="text-lg text-foreground/80 mb-4">
              To empower businesses and individuals through transformative technologies, fostering a secure, intelligent,
              and interconnected world. We strive for excellence, innovation, and integrity in everything we do.
            </p>
            <Image 
              src="https://placehold.co/600x400.png" 
              alt="Our Mission" 
              width={600} 
              height={400} 
              className="rounded-lg shadow-xl border border-primary/20"
              data-ai-hint="team collaboration"
            />
          </div>
          <div className="relative aspect-video">
             <Image 
              src="https://placehold.co/600x400.png" 
              alt="Company Vision" 
              layout="fill"
              objectFit="cover"
              className="rounded-lg shadow-xl border border-accent/20"
              data-ai-hint="futuristic city"
            />
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8">
        <Card className="layered-card">
          <CardHeader className="items-center text-center">
            <Target className="w-12 h-12 text-accent mb-4 glowing-icon" />
            <CardTitle className="font-headline text-2xl">Our Vision</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            To be a global leader in pioneering technologies that drive progress and create sustainable value for society.
          </CardContent>
        </Card>
        <Card className="layered-card">
          <CardHeader className="items-center text-center">
            <Users className="w-12 h-12 text-accent mb-4 glowing-icon" />
            <CardTitle className="font-headline text-2xl">Our Team</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            Comprised of passionate experts, researchers, and engineers dedicated to solving complex challenges.
          </CardContent>
        </Card>
        <Card className="layered-card">
          <CardHeader className="items-center text-center">
            <Lightbulb className="w-12 h-12 text-accent mb-4 glowing-icon" />
            <CardTitle className="font-headline text-2xl">Our Values</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            Innovation, Integrity, Collaboration, Customer-Centricity, and Continuous Learning.
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default