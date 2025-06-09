
import { Briefcase, Sparkles } from 'lucide-react';
import ApplicationForm from './_components/ApplicationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CareersPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <section className="text-center mb-16">
        <Briefcase className="w-20 h-20 text-primary mx-auto mb-6 glowing-icon-primary" />
        <h1 className="font-headline text-5xl font-bold mb-4">Join Our Team at MintFire</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          We're looking for passionate innovators, creative thinkers, and dedicated professionals to help us build the future of technology. Explore opportunities to make an impact in Cyber Security, Blockchain, AI, and IoT.
        </p>
      </section>

      <section className="mb-16">
        <Card className="layered-card w-full max-w-4xl mx-auto">
          <CardHeader>
             <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-8 h-8 text-accent glowing-icon" />
                <CardTitle className="font-headline text-3xl">Why MintFire?</CardTitle>
             </div>
            <CardDescription>
              At MintFire, you'll be part of a dynamic team that thrives on challenges and celebrates breakthroughs. We offer a collaborative environment, opportunities for growth, and the chance to work on cutting-edge projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 text-muted-foreground">
            <div>
              <h4 className="font-semibold text-lg text-foreground mb-2">Innovative Projects</h4>
              <p>Work with the latest technologies and contribute to solutions that make a real difference.</p>
            </div>
            <div>
              <h4 className="font-semibold text-lg text-foreground mb-2">Growth Opportunities</h4>
              <p>We invest in our team's development with continuous learning and career advancement paths.</p>
            </div>
            <div>
              <h4 className="font-semibold text-lg text-foreground mb-2">Collaborative Culture</h4>
              <p>Join a supportive and inclusive team where ideas are valued and teamwork is key.</p>
            </div>
             <div>
              <h4 className="font-semibold text-lg text-foreground mb-2">Impactful Work</h4>
              <p>Contribute to products and services that shape industries and enhance security and intelligence globally.</p>
            </div>
          </CardContent>
        </Card>
      </section>
      
      <section id="application-form">
        <Card className="layered-card w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="font-headline text-3xl text-center">Apply Now</CardTitle>
                <CardDescription className="text-center">
                Ready to make your mark? Fill out the form below to apply for a position at MintFire.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <ApplicationForm />
            </CardContent>
        </Card>
      </section>
    </div>
  );
}
