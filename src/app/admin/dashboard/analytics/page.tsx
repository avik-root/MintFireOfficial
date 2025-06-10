
"use client";

import React, { useEffect, useState, useCallback, type ElementType } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalyticsData, getGeneralCounts } from "@/actions/analytics-actions";
import type { AnalyticsData, GeneralCounts, TopHallOfFameParticipant } from "@/lib/schemas/analytics-schemas";
import { getHallOfFameEntries } from '@/actions/hall-of-fame-actions'; 
import type { HallOfFameEntry } from '@/lib/schemas/hall-of-fame-schemas'; 
import { BarChart3, Package, Users, Crown, Newspaper, Briefcase, Eye, Loader2, AlertTriangle, Bug, Trophy, Star } from "lucide-react"; 
import { getProducts } from '@/actions/product-actions';
import { getTeamMembers } from '@/actions/team-member-actions';
import type { Product } from '@/lib/schemas/product-schemas';
import type { TeamMember } from '@/lib/schemas/team-member-schemas';
import Link from 'next/link'; 
import NextImage from 'next/image'; // Changed to NextImage to avoid conflict with local Image type if any

interface CountCardProps {
  title: string;
  count: number;
  icon: ElementType;
}

const CountCard: React.FC<CountCardProps> = ({ title, count, icon: Icon }) => (
  <Card className="layered-card">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-5 w-5 text-accent" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-foreground">{count}</div>
    </CardContent>
  </Card>
);

interface TopViewedItem {
  id: string;
  name: string;
  views: number;
}

export default function AdminAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [generalCounts, setGeneralCounts] = useState<GeneralCounts | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [hallOfFameEntries, setHallOfFameEntries] = useState<HallOfFameEntry[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    let currentError: string | null = null;
    try {
      const [analyticsRes, countsRes, productsRes, teamMembersRes, hofRes] = await Promise.all([ 
        getAnalyticsData(),
        getGeneralCounts(),
        getProducts(),
        getTeamMembers({ publicOnly: false }),
        getHallOfFameEntries() 
      ]);

      if (analyticsRes.error) currentError = (currentError ? currentError + "; " : "") + analyticsRes.error;
      setAnalyticsData(analyticsRes.data || { productViews: {}, teamMemberViews: {}, lastUpdatedAt: new Date().toISOString() });

      if (countsRes.error) currentError = (currentError ? currentError + "; " : "") + countsRes.error;
      setGeneralCounts(countsRes.counts || { totalProducts: 0, totalTeamMembers: 0, totalFounders: 0, totalBlogPosts: 0, totalApplicants: 0, totalBugReports: 0 });
      
      if (productsRes.error) currentError = (currentError ? currentError + "; " : "") + productsRes.error;
      setProducts(productsRes.products || []);

      if (teamMembersRes.error) currentError = (currentError ? currentError + "; " : "") + teamMembersRes.error;
      setTeamMembers(teamMembersRes.members || []);

      if (hofRes.error) currentError = (currentError ? currentError + "; " : "") + hofRes.error; 
      setHallOfFameEntries(hofRes.entries || []); 

      if (currentError) {
        setError(currentError);
      } else if (!isInitialLoad) {
        setError(null);
      }

    } catch (err: any) {
      currentError = (currentError ? currentError + "; " : "") + (err.message || "Failed to load analytics data.");
      setError(currentError);
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

  const getTopViewed = (viewCounts: Record<string, number>, items: Array<{id: string, name: string}>, topN = 5): TopViewedItem[] => {
    if (!viewCounts || Object.keys(viewCounts).length === 0 || items.length === 0) return [];
    return Object.entries(viewCounts)
      .map(([id, views]) => {
        const itemDetails = items.find(p => p.id === id);
        return { id, name: itemDetails?.name || 'Unknown Item', views };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, topN);
  };

  const topViewedProducts = analyticsData ? getTopViewed(analyticsData.productViews, products) : [];
  const topViewedTeamMembers = analyticsData ? getTopViewed(analyticsData.teamMemberViews, teamMembers) : [];
  const topHallOfFameParticipants: TopHallOfFameParticipant[] = hallOfFameEntries.slice(0, 3).map(entry => ({
    id: entry.id,
    displayName: entry.displayName,
    totalPoints: entry.totalPoints,
    rank: entry.rank
  }));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (error && !analyticsData && !generalCounts && hallOfFameEntries.length === 0) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Analytics</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full">
      {error && (analyticsData || generalCounts || hallOfFameEntries.length > 0) && ( 
        <div className="mb-4 p-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <p>Error refreshing data: {error}. Displaying last known data.</p>
        </div>
      )}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-10 h-10 text-primary glowing-icon-primary" />
          <div>
            <h1 className="font-headline text-4xl font-bold">Site Analytics</h1>
            <p className="text-muted-foreground">Overview of site content and engagement.</p>
          </div>
        </div>
      </div>

      {generalCounts && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold font-headline mb-6 text-center md:text-left">Content Overview</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"> 
            <CountCard title="Total Products" count={generalCounts.totalProducts} icon={Package} />
            <CountCard title="Total Team Members" count={generalCounts.totalTeamMembers} icon={Users} />
            <CountCard title="Total Founders" count={generalCounts.totalFounders} icon={Crown} />
            <CountCard title="Total Blog Posts" count={generalCounts.totalBlogPosts} icon={Newspaper} />
            <CountCard title="Total Applicants" count={generalCounts.totalApplicants} icon={Briefcase} />
            <CountCard title="Total Bug Reports" count={generalCounts.totalBugReports} icon={Bug} /> 
          </div>
        </section>
      )}

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"> 
        <Card className="layered-card">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center"><Eye className="mr-2 text-accent"/>Top Viewed Products</CardTitle>
            <CardDescription>Most frequently viewed product details.</CardDescription>
          </CardHeader>
          <CardContent>
            {topViewedProducts.length > 0 ? (
              <ul className="space-y-2">
                {topViewedProducts.map(p => (
                  <li key={p.id} className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded-md">
                    <span className="text-foreground truncate max-w-[70%]">{p.name}</span>
                    <span className="font-semibold text-accent">{p.views} views</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground italic">No product view data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="layered-card">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center"><Eye className="mr-2 text-accent"/>Top Viewed Team Members</CardTitle>
            <CardDescription>Most frequently viewed team member profiles.</CardDescription>
          </CardHeader>
          <CardContent>
            {topViewedTeamMembers.length > 0 ? (
              <ul className="space-y-2">
                {topViewedTeamMembers.map(m => (
                  <li key={m.id} className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded-md">
                     <span className="text-foreground truncate max-w-[70%]">{m.name}</span>
                    <span className="font-semibold text-accent">{m.views} views</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground italic">No team member view data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="layered-card"> 
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center"><Trophy className="mr-2 text-accent"/>Hall of Fame Summary</CardTitle>
            <CardDescription>Overview of top contributors.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Total Participants</p>
              <p className="text-2xl font-bold text-foreground">{hallOfFameEntries.length}</p>
            </div>
            <h4 className="text-md font-semibold text-foreground mb-2">Top 3 Participants:</h4>
            {topHallOfFameParticipants.length > 0 ? (
              <ul className="space-y-2">
                {topHallOfFameParticipants.map((p, index) => (
                  <li key={p.id} className="flex items-center text-sm p-2 bg-muted/30 rounded-md">
                    <span className="font-semibold text-accent mr-2">#{p.rank || index + 1}</span>
                    <span className="text-foreground truncate flex-1">{p.displayName}</span>
                    <span className="font-semibold text-muted-foreground flex items-center"><Star className="w-3 h-3 mr-1 text-yellow-400 fill-yellow-400"/>{p.totalPoints}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground italic">No participants in the Hall of Fame yet.</p>
            )}
             <div className="mt-4 text-right">
                <Link href="/admin/dashboard/hall-of-fame-management" className="text-xs text-primary hover:underline">
                    Manage Hall of Fame →
                </Link>
            </div>
          </CardContent>
        </Card>
      </section>
      {analyticsData?.lastUpdatedAt && (
        <p className="text-xs text-muted-foreground mt-8 text-center">
          Analytics data last updated: {new Date(analyticsData.lastUpdatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
