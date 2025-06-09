
"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getApplicantById } from "@/actions/applicant-actions";
import { UserCheck, Loader2, AlertTriangle, Mail, Phone, Briefcase, Link as LinkIcon, ExternalLink, FileText, MessageSquare, CalendarDays } from "lucide-react";
import type { Applicant } from "@/lib/schemas/applicant-schemas";
import { Badge } from '@/components/ui/badge';
import UpdateApplicantStatusForm from '../_components/UpdateApplicantStatusForm';
import Link from 'next/link'; // Next.js Link
import { Button } from '@/components/ui/button'; // Assuming you have a Button component

export default function ApplicantDetailPage({ params }: { params: { id: string } }) {
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applicantId = params.id;

  const fetchApplicant = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getApplicantById(applicantId);
    if (result.applicant) {
      setApplicant(result.applicant);
    } else {
      setError(result.error || "Failed to load applicant details.");
    }
    setIsLoading(false);
  }, [applicantId]);

  useEffect(() => {
    fetchApplicant();
  }, [fetchApplicant]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading applicant details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error</h2>
        <p>{error}</p>
         <Button asChild variant="link" className="mt-4">
          <Link href="/admin/dashboard/applicants">Back to Applicants List</Link>
        </Button>
      </div>
    );
  }

  if (!applicant) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Applicant not found.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/admin/dashboard/applicants">Back to Applicants List</Link>
        </Button>
      </div>
    );
  }

  const DetailItem = ({ icon: Icon, label, value, isLink = false, breakWord = false }: { icon: React.ElementType, label: string, value?: string | null, isLink?: boolean, breakWord?: boolean }) => {
    if (!value) return null;
    return (
      <div className="flex items-start space-x-3">
        <Icon className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {isLink ? (
            <a href={value.startsWith('http') ? value : `mailto:${value}`} target="_blank" rel="noopener noreferrer" className={`text-sm text-primary hover:underline ${breakWord ? 'break-all' : ''}`}>{value}</a>
          ) : (
            <p className={`text-sm text-foreground ${breakWord ? 'break-all' : ''}`}>{value}</p>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full max-w-4xl">
      <Button asChild variant="outline" size="sm" className="mb-6">
         <Link href="/admin/dashboard/applicants">← Back to Applicants List</Link>
      </Button>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="layered-card w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <UserCheck className="w-8 h-8 text-primary glowing-icon-primary" />
                <div>
                  <CardTitle className="font-headline text-3xl">{applicant.fullName}</CardTitle>
                  <CardDescription>Applicant Details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailItem icon={Mail} label="Email" value={applicant.email} isLink={true} />
              <DetailItem icon={Phone} label="Phone" value={applicant.phone} />
              <DetailItem icon={Briefcase} label="Position Applied For" value={applicant.positionAppliedFor} />
              <DetailItem icon={CalendarDays} label="Applied On" value={new Date(applicant.appliedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} />
              
              {applicant.portfolioUrl && <DetailItem icon={LinkIcon} label="Portfolio/Website" value={applicant.portfolioUrl} isLink={true} breakWord={true}/>}
              {applicant.githubUrl && <DetailItem icon={ExternalLink} label="GitHub Profile" value={applicant.githubUrl} isLink={true} breakWord={true}/>}
              {applicant.linkedinUrl && <DetailItem icon={ExternalLink} label="LinkedIn Profile" value={applicant.linkedinUrl} isLink={true} breakWord={true}/>}
              
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Resume/CV Link</p>
                  <a href={applicant.resumeLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">{applicant.resumeLink}</a>
                </div>
              </div>
              
              <div className="space-y-1 pt-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center"><MessageSquare className="w-4 h-4 mr-2 text-accent"/>Cover Letter/Message:</p>
                <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md border border-border">{applicant.coverLetter}</p>
              </div>

            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
            <Card className="layered-card">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                        <Badge variant={
                            applicant.status === 'Hired' ? 'default' :
                            applicant.status === 'Rejected' ? 'destructive' :
                            applicant.status === 'Pending' || applicant.status === 'On Hold' ? 'secondary' :
                            'outline' 
                        } className="capitalize text-lg px-3 py-1">
                            {applicant.status}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <UpdateApplicantStatusForm applicant={applicant} onSuccess={fetchApplicant} />
                </CardContent>
            </Card>

            {applicant.notes && (
                 <Card className="layered-card">
                    <CardHeader>
                        <CardTitle className="text-xl font-headline">Admin Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{applicant.notes}</p>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
}
