
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBugReports } from "@/actions/bug-report-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bug, Eye, AlertTriangle, Loader2, Trash2, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BugReport } from "@/lib/schemas/bug-report-schemas";
// import DeleteBugReportButton from "./_components/DeleteBugReportButton"; // Placeholder for future use

type SortKey = 'fullName' | 'status' | 'reportedAt';
type SortDirection = 'asc' | 'desc';

export default function AdminBugReportsPage() {
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('reportedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    try {
      const { reports, error: fetchError } = await getBugReports();
      if (fetchError) {
        setError(fetchError);
      } else {
        setBugReports(reports || []);
        if (!isInitialLoad) setError(null);
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred fetching bug reports.");
    }
    if (isInitialLoad) setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData(true);
    const intervalId = setInterval(() => {
      if (!document.hidden) fetchData(false);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedBugReports = useMemo(() => {
    let reports = [...bugReports];
    reports.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === 'reportedAt') {
        valA = new Date(a.reportedAt).getTime();
        valB = new Date(b.reportedAt).getTime();
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      let comparison = 0;
      if (valA > valB) comparison = 1;
      else if (valA < valB) comparison = -1;
      
      return sortDirection === 'desc' ? comparison * -1 : comparison;
    });
    return reports;
  }, [bugReports, sortKey, sortDirection]);

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

  const SortableHeader = ({ children, columnKey }: { children: React.ReactNode; columnKey: SortKey }) => (
    <th 
        scope="col" 
        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/50"
        onClick={() => handleSort(columnKey)}
    >
        <div className="flex items-center">
            {children}
            {sortKey === columnKey && (
                <ArrowUpDown className={`ml-2 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
            )}
        </div>
    </th>
  );


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading bug reports...</p>
      </div>
    );
  }

  if (error && sortedBugReports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Bug Reports</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full">
      {error && sortedBugReports.length > 0 && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <p>Error refreshing data: {error}. Displaying last known data.</p>
        </div>
      )}
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="font-headline text-3xl flex items-center">
                <Bug className="w-8 h-8 mr-3 text-primary glowing-icon-primary" />
                Manage Bug Reports
              </CardTitle>
              <CardDescription>View and manage user-submitted bug reports.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedBugReports.length === 0 && !error ? (
            <div className="text-center py-12">
              <Bug className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No bug reports found.</p>
              <p className="text-muted-foreground">Bug reports submitted by users will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-card">
                  <tr>
                    <SortableHeader columnKey="fullName">Reporter</SortableHeader>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description (Snippet)</th>
                    <SortableHeader columnKey="status">Status</SortableHeader>
                    <SortableHeader columnKey="reportedAt">Reported At</SortableHeader>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {sortedBugReports.map((report: BugReport) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{report.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground max-w-xs truncate" title={report.description}>
                        {report.description.substring(0, 50)}{report.description.length > 50 ? '...' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant="outline" className={`${getStatusColorClass(report.status)} capitalize`}>
                          {report.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{new Date(report.reportedAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                        <Button variant="ghost" size="icon" asChild title="View Details">
                          <Link href={`/admin/dashboard/bug-reports/${report.id}`}>
                            <Eye className="h-4 w-4 text-accent" />
                          </Link>
                        </Button>
                        {/* <DeleteBugReportButton reportId={report.id} /> Placeholder */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

