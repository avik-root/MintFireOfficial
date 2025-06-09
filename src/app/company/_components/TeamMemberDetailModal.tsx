
"use client";

import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Briefcase, AlignLeft, Mail, Github, Linkedin, X, CalendarDays } from 'lucide-react';
import type { TeamMember } from '@/lib/schemas/team-member-schemas';
import Link from 'next/link';
import { format } from 'date-fns';

interface TeamMemberDetailModalProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TeamMemberDetailModal({ member, isOpen, onClose }: TeamMemberDetailModalProps) {
  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] md:max-w-[600px] lg:max-w-[700px] p-0 border-primary shadow-2xl shadow-primary/30">
        <DialogHeader className="p-6 pb-0 relative">
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative w-32 h-40 md:w-40 md:h-52 rounded-md overflow-hidden border-4 border-accent shadow-lg flex-shrink-0 aspect-[3/4]">
                    <Image
                        src={member.imageUrl || `https://placehold.co/120x160.png?text=${member.name.charAt(0)}`}
                        alt={member.name}
                        fill
                        className="object-cover"
                        data-ai-hint="profile photo large"
                    />
                </div>
                <div className="text-center md:text-left">
                    <DialogTitle className="font-headline text-3xl text-primary mb-1">{member.name}</DialogTitle>
                    <DialogDescription className="text-accent text-lg">{member.role}</DialogDescription>
                </div>
            </div>
        </DialogHeader>
        
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center"><AlignLeft className="w-4 h-4 mr-2 text-accent"/>About</h4>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{member.description}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-2">
            <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                <Link href={`mailto:${member.email}`} className="text-sm text-primary hover:underline break-all flex items-center gap-1 group">
                    <Mail className="w-4 h-4 text-accent/70 group-hover:text-accent transition-colors" />
                    {member.email}
                </Link>
            </div>
            {member.githubUrl && (
                <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">GitHub</h4>
                    <Link href={member.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all flex items-center gap-1 group">
                        <Github className="w-4 h-4 text-accent/70 group-hover:text-accent transition-colors" />
                        {member.githubUrl.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '')}
                    </Link>
                </div>
            )}
            {member.linkedinUrl && (
                <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">LinkedIn</h4>
                    <Link href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all flex items-center gap-1 group">
                        <Linkedin className="w-4 h-4 text-accent/70 group-hover:text-accent transition-colors" />
                        {member.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '')}
                    </Link>
                </div>
            )}
            {member.joiningDate && (
                 <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">Joined</h4>
                    <p className="text-sm text-foreground/90 flex items-center gap-1">
                        <CalendarDays className="w-4 h-4 text-accent/70" />
                        {format(new Date(member.joiningDate), "MMMM d, yyyy")}
                    </p>
                </div>
            )}
          </div>
        </div>
        {/* Footer removed to hide "Member registered on" */}
      </DialogContent>
    </Dialog>
  );
}
