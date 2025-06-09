
"use client";

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Founder } from '@/lib/schemas/founder-schema';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mail, Github, Linkedin } from 'lucide-react';
import Link from 'next/link';

interface FounderCardProps {
  founder: Founder;
}

export default function FounderCard({ founder }: FounderCardProps) {
  return (
    <Card
      className="layered-card flex flex-col overflow-hidden group h-full transition-all duration-300 w-full max-w-md mx-auto"
      aria-label={`Profile card for ${founder.name}`}
    >
      <CardHeader className="p-0">
        <div className="relative w-full aspect-[3/4]">
          <Image
            src={founder.imageUrl || `https://placehold.co/300x400.png?text=${founder.name.charAt(0)}`}
            alt={founder.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            data-ai-hint="founder photo"
            priority // For important images like a founder
          />
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
           <div className="absolute bottom-0 left-0 p-6 text-white">
             <CardTitle className="font-headline text-3xl drop-shadow-md">{founder.name}</CardTitle>
             <CardDescription className="text-accent text-lg drop-shadow-sm">{founder.role}</CardDescription>
           </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        <p className="text-muted-foreground text-sm line-clamp-4">{founder.description}</p>
        <div className="flex flex-wrap gap-3 pt-2">
            {founder.email && (
                 <Button asChild variant="outline" size="sm">
                    <Link href={`mailto:${founder.email}`} title={`Email ${founder.name}`}>
                        <Mail className="mr-2 h-4 w-4"/> Email
                    </Link>
                 </Button>
            )}
            {founder.linkedinUrl && (
                <Button asChild variant="outline" size="sm">
                    <Link href={founder.linkedinUrl} target="_blank" rel="noopener noreferrer" title={`${founder.name} on LinkedIn`}>
                        <Linkedin className="mr-2 h-4 w-4"/> LinkedIn
                    </Link>
                </Button>
            )}
            {founder.githubUrl && (
                 <Button asChild variant="outline" size="sm">
                    <Link href={founder.githubUrl} target="_blank" rel="noopener noreferrer" title={`${founder.name} on GitHub`}>
                        <Github className="mr-2 h-4 w-4"/> GitHub
                    </Link>
                 </Button>
            )}
        </div>
      </CardContent>
      {/* No explicit "See More" footer, details are inline or via links */}
    </Card>
  );
}
