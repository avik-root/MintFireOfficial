
"use client";

import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Briefcase, AlignLeft, Mail, Github, Linkedin, X } from 'lucide-react';
import type { TeamMember } from '@/lib/schemas/team-member-schemas';
import Link from 'next/link';

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
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-accent shadow-lg flex-shrink-0">
                    <Image
                        src={member.imageUrl || `https://placehold.co/160x160.png?text=${member.name.charAt(0)}`}
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
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-primary">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center"><AlignLeft className="w-4 h-4 mr-2 text-accent"/>About</h4>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{member.description}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Mail className="w-4 h-4 mr-2 text-accent"/>Email</h4>
                <Link href={`mailto:${member.email}`} className="text-sm text-primary hover:underline break-all">{member.email}</Link>
            </div>
            {member.githubUrl && (
                <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Github className="w-4 h-4 mr-2 text-accent"/>GitHub</h4>
                    <Link href={member.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">{member.githubUrl}</Link>
                </div>
            )}
            {member.linkedinUrl && (
                <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center"><Linkedin className="w-4 h-4 mr-2 text-accent"/>LinkedIn</h4>
                    <Link href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">{member.linkedinUrl}</Link>
                </div>
            )}
          </div>
        </div>
        <DialogFooter className="p-4 border-t border-border bg-card/50">
            <p className="text-xs text-muted-foreground">Member since: {new Date(member.createdAt).toLocaleDateString()}</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
