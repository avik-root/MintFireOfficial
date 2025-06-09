
"use client";

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { TeamMember } from '@/lib/schemas/team-member-schemas';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface TeamMemberCardProps {
  member: TeamMember;
  onViewDetails: (member: TeamMember) => void;
}

export default function TeamMemberCard({ member, onViewDetails }: TeamMemberCardProps) {
  return (
    <Card
      className="layered-card flex flex-col overflow-hidden group h-full transition-all duration-300"
      aria-label={`Profile card for ${member.name}`}
    >
      <CardHeader className="p-0">
        <div className="relative w-full aspect-[3/4] md:aspect-square">
          <Image
            src={member.imageUrl || `https://placehold.co/400x500.png?text=${member.name.charAt(0)}`}
            alt={member.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            data-ai-hint="team member photo"
          />
           <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4 space-y-1 text-center mt-auto">
        <CardTitle className="font-headline text-xl group-hover:text-primary transition-colors">{member.name}</CardTitle>
        <CardDescription className="text-accent">{member.role}</CardDescription>
      </CardContent>
      <CardFooter className="justify-center">
        <Button 
          variant="link" 
          className="text-accent p-0 hover:text-foreground"
          onClick={() => onViewDetails(member)}
          aria-label={`See more details for ${member.name}`}
        >
          See More <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
