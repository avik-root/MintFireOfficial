
"use client";

import { useEffect, useState, useCallback, use } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBugReportById, updateBugReport } from "@/actions/bug-report-actions";
import { User, Loader2, AlertTriangle as AlertIcon, Mail, Phone, Link as LinkIcon, ExternalLink, FileText, MessageSquare, CalendarDays, Bug as BugIcon, CheckCircle } from "lucide-react"; // Changed AlertTriangle to AlertIcon
import type { BugReport, UpdateBugReportStatusInput } from "@/lib/schemas/bug-report-schemas";
import { Badge } from '@/components/ui/badge';
import UpdateBugReportStatusForm from '../_components/UpdateBugReportStatusForm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BugReportDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const [report, setReport] = useState<BugReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = use(paramsPromise);
  const reportId = params.id;

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getBugReportById(reportId);
    if (result.report) {
      setReport(result.report);
    } else {
      setError(result.error || "Failed to load bug report details.");
    }
    setIsLoading(false);
  }, [reportId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleStatusUpdateSuccess = () => {
    fetchReport(); // Re-fetch the report to show updated status/notes
  };
  
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500/30 text-yellow-400 border-yellow-500';
      case 'Investigating': return 'bg-blue-500/30 text-blue-400 border-blue-500';
      case 'Verified': return 'bg-green-500/30 text-green-400 border-green-500';
      case 'Invalid':
      case 'Duplicate':
      case 'WontFix':
        return 'bg-red-500/30 text-red-400 border-red-500';
      case 'Fixed': return 'bg-teal-500/30 text-teal-400 border-teal-500';
      case 'Rewarded': return 'bg-purple-500/30 text-purple-400 border-purple-500';
      default: return 'bg-slate-600/30 text-slate-400 border-slate-500';
    }
  };

  const getLevelColorClass = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-yellow-500/30 text-yellow-400 border-yellow-500';
      case 'Mid': return 'bg-orange-500/30 text-orange-400 border-orange-500';
      case 'High': return 'bg-red-500/30 text-red-400 border-red-500';
      case 'ZeroDay': return 'bg-purple-600/30 text-purple-400 border-purple-500';
      default: return 'bg-slate-600/30 text-slate-400 border-slate-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading bug report details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertIcon className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error</h2>
        <p>{error}</p>
         <Button asChild variant="link" className="mt-4">
          <Link href="/admin/dashboard/bug-reports">Back to Bug Reports List</Link>
        </Button>
      </div>
    );
  }

  if (!report) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Bug report not found.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/admin/dashboard/bug-reports">Back to Bug Reports List</Link>
        </Button>
      </div>
    );
  }

  const DetailItem = ({ icon: IconComp, label, value, isLink = false, breakWord = false }: { icon: React.ElementType, label: string, value?: string | null, isLink?: boolean, breakWord?: boolean }) => {
    if (!value) return null;
    return (
      <div className="flex items-start space-x-3">
        <IconComp className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
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
         <Link href="/admin/dashboard/bug-reports">← Back to Bug Reports</Link>
      </Button>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="layered-card w-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <BugIcon className="w-8 h-8 text-primary glowing-icon-primary" />
                <div>
                  <CardTitle className="font-headline text-3xl">Bug Report Details</CardTitle>
                  <CardDescription>Submitted by: {report.fullName}</CardDescription>
                </div>
              </div>
               <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Severity:</p>
                  <Badge variant="outline" className={`${getLevelColorClass(report.level)} capitalize text-sm px-2 py-0.5`}>
                    <AlertIcon className="mr-1.5 h-3.5 w-3.5" />
                    {report.level}
                  </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailItem icon={Mail} label="Reporter Email" value={report.email} isLink={true} />
              <DetailItem icon={Phone} label="Reporter Phone" value={report.phone} />
              <DetailItem icon={CalendarDays} label="Reported On" value={new Date(report.reportedAt).toLocaleString()} />
              
              {report.githubUrl && <DetailItem icon={ExternalLink} label="Reporter GitHub" value={report.githubUrl} isLink={true} breakWord={true}/>}
              {report.linkedinUrl && <DetailItem icon={ExternalLink} label="Reporter LinkedIn" value={report.linkedinUrl} isLink={true} breakWord={true}/>}
              
              <div className="flex items-start space-x-3">
                <LinkIcon className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Proof of Concept Link</p>
                  <a href={report.pocGdriveLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">{report.pocGdriveLink}</a>
                </div>
              </div>
              
              <div className="space-y-1 pt-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center"><MessageSquare className="w-4 h-4 mr-2 text-accent"/>Bug Description:</p>
                <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md border border-border">{report.description}</p>
              </div>

            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
            <Card className="layered-card">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                        <Badge variant="outline" className={`${getStatusColorClass(report.status)} capitalize text-lg px-3 py-1`}>
                            {report.status}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <UpdateBugReportStatusForm report={report} onSuccess={handleStatusUpdateSuccess} />
                </CardContent>
            </Card>

            {report.adminNotes && (
                 <Card className="layered-card">
                    <CardHeader>
                        <CardTitle className="text-xl font-headline">Admin Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.adminNotes}</p>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
}
