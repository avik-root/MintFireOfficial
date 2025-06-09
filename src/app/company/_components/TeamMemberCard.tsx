
"use client";

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import type { TeamMember } from '@/lib/schemas/team-member-schemas';

interface TeamMemberCardProps {
  member: TeamMember;
  onViewDetails: (member: TeamMember) => void;
}

export default function TeamMemberCard({ member, onViewDetails }: TeamMemberCardProps) {
  return (
    <Card className="layered-card flex flex-col overflow-hidden group h-full">
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
      <CardFooter className="justify-center p-4 pt-0">
        <Button variant="outline" size="sm" onClick={() => onViewDetails(member)}>
          <Eye className="mr-2 h-4 w-4" /> View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
