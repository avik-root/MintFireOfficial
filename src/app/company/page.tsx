
"use client"; 

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Zap, Target, Lightbulb, UsersRound, Crown, AlertTriangle, Loader2 } from 'lucide-react';
import { getTeamMembers } from '@/actions/team-member-actions';
import { getFounders } from '@/actions/founder-actions';
import type { TeamMember } from '@/lib/schemas/team-member-schemas';
import type { Founder } from '@/lib/schemas/founder-schema';
import TeamMemberCard from './_components/TeamMemberCard';
import FounderCard from './_components/FounderCard';
import TeamMemberDetailModal from './_components/TeamMemberDetailModal';
import React, { useEffect, useState } from 'react';

const CompanyPage = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [founders, setFounders] = useState<Founder[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [isLoadingFounders, setIsLoadingFounders] = useState(true);
  const [errorTeam, setErrorTeam] = useState<string | null>(null);
  const [errorFounders, setErrorFounders] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchCompanyData = async () => {
      setIsLoadingTeam(true);
      setErrorTeam(null);
      const teamResult = await getTeamMembers({ publicOnly: true }); 
      if (teamResult.members) {
        setTeamMembers(teamResult.members);
      } else {
        setErrorTeam(teamResult.error || "Failed to load team members.");
      }
      setIsLoadingTeam(false);

      setIsLoadingFounders(true);
      setErrorFounders(null);
      const founderResult = await getFounders();
      if (founderResult.founders) {
        setFounders(founderResult.founders);
      } else {
        setErrorFounders(founderResult.error || "Failed to load founder profiles.");
      }
      setIsLoadingFounders(false);
    };
    fetchCompanyData();
  }, []);

  const handleViewDetails = (member: TeamMember) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
  };

  return (
    <div className="space-y-16">
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
              fill
              className="object-cover rounded-lg shadow-xl border border-accent/20"
              data-ai-hint="futuristic city"
            />
          </div>
        </div>
      </section>

      {/* Meet Our Founders Section */}
      <section id="our-founders" className="py-12">
        <div className="flex items-center mb-10 text-center flex-col">
          <Crown className="w-16 h-16 text-primary mb-4 glowing-icon-primary" />
          <h2 className="font-headline text-4xl font-bold">Meet Our Founders</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mt-2">
            The visionary leaders guiding MintFire.
          </p>
        </div>
        {isLoadingFounders && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Loading founder profiles...</p>
          </div>
        )}
        {errorFounders && (
          <div className="flex flex-col items-center text-destructive py-10">
            <AlertTriangle className="w-12 h-12 mb-3" />
            <p className="text-lg font-semibold">Error loading founder profiles</p>
            <p>{errorFounders}</p>
          </div>
        )}
        {!isLoadingFounders && !errorFounders && founders.length === 0 && (
          <p className="text-center text-muted-foreground text-lg">
            Founder profiles are being curated. Check back soon!
          </p>
        )}
        {!isLoadingFounders && !errorFounders && founders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            {founders.map(founder => (
              <FounderCard key={founder.id} founder={founder} />
            ))}
          </div>
        )}
      </section>


      <section id="our-team" className="py-12">
        <div className="flex items-center mb-10 text-center flex-col">
          <UsersRound className="w-16 h-16 text-primary mb-4 glowing-icon-primary" />
          <h2 className="font-headline text-4xl font-bold">Meet Our Team</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mt-2">
            The driving force behind MintFire's innovation and success. Oldest members first.
          </p>
        </div>

        {isLoadingTeam && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Loading team members...</p>
          </div>
        )}
        {errorTeam && (
          <div className="flex flex-col items-center text-destructive py-10">
            <AlertTriangle className="w-12 h-12 mb-3" />
            <p className="text-lg font-semibold">Error loading team members</p>
            <p>{errorTeam}</p>
          </div>
        )}
        {!isLoadingTeam && !errorTeam && teamMembers.length === 0 && (
          <p className="text-center text-muted-foreground text-lg">
            Our team is growing! Check back soon to meet the innovators at MintFire.
          </p>
        )}
        {!isLoadingTeam && !errorTeam && teamMembers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {teamMembers.map(member => (
              <TeamMemberCard key={member.id} member={member} onViewDetails={handleViewDetails} />
            ))}
          </div>
        )}
      </section>
      
      <TeamMemberDetailModal member={selectedMember} isOpen={isModalOpen} onClose={handleCloseModal} />

      <section className="grid md:grid-cols-2 gap-8">
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

export default CompanyPage;
