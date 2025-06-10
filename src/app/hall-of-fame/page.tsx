
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { getHallOfFameEntries } from '@/actions/hall-of-fame-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Trophy, UserCircle, Medal, Activity, Award, Star, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { HallOfFameEntry } from '@/lib/schemas/hall-of-fame-schemas';

export default function HallOfFamePage() {
  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    // For subsequent polls, we don't want to flash the error message if data is already there
    // setError(null); 
    try {
      const { entries: fetchedEntries, error: fetchError } = await getHallOfFameEntries();
      if (fetchError) {
        setError(fetchError);
      } else {
        setEntries(fetchedEntries || []);
        if (!isInitialLoad) setError(null); // Clear error on successful poll
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred fetching Hall of Fame entries.");
    }
    if (isInitialLoad) setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData(true); // Initial fetch

    const intervalId = setInterval(() => {
      if (!document.hidden) {
        fetchData(false);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(intervalId); // Cleanup interval
  }, [fetchData]);


  const getRankColor = (rank?: number | null) => {
    if (rank === 1) return "text-yellow-400";
    if (rank === 2) return "text-slate-400";
    if (rank === 3) return "text-orange-400";
    return "text-primary";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading Hall of Fame...</p>
      </div>
    );
  }

  if (error && entries.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 text-center">
        <AlertTriangle className="w-20 h-20 text-destructive mx-auto mb-6" />
        <h1 className="font-headline text-4xl font-bold mb-4">Error Loading Hall of Fame</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
       {error && entries.length > 0 && ( // Show a less intrusive error if data is already displayed
        <div className="mb-4 p-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <p>Error refreshing data: {error}. Displaying last known data.</p>
        </div>
      )}
      <section className="text-center mb-16">
        <Trophy className="w-20 h-20 text-primary mx-auto mb-6 glowing-icon-primary" />
        <h1 className="font-headline text-5xl font-bold mb-4">MintFire Hall of Fame</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Recognizing the exceptional individuals who contribute to MintFire's security and innovation.
        </p>
      </section>

      {entries && entries.length > 0 ? (
        <div className="space-y-6">
          {entries.map((entry, index) => (
            <Card key={entry.id} className={`layered-card w-full max-w-3xl mx-auto ${entry.rank === 1 ? 'border-yellow-400 shadow-yellow-400/30' : entry.rank === 2 ? 'border-slate-400 shadow-slate-400/30' : entry.rank === 3 ? 'border-orange-400 shadow-orange-400/30' : 'border-primary/30'}`}>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`text-5xl font-bold ${getRankColor(entry.rank)} w-16 text-center`}>
                  {entry.rank}
                </div>
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-accent">
                  <Image 
                    src={entry.avatarUrl || `https://placehold.co/64x64.png?text=${entry.displayName.charAt(0)}`} 
                    alt={entry.displayName} 
                    fill 
                    className="object-cover"
                    data-ai-hint="user avatar"
                  />
                </div>
                <div className="flex-1">
                  <CardTitle className="font-headline text-2xl text-foreground">{entry.displayName}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground flex items-center">
                    <Star className="w-4 h-4 mr-1.5 text-yellow-400 fill-yellow-400" />
                    {entry.totalPoints} Points
                    {entry.profileUrl && (
                       <Button asChild variant="link" size="sm" className="ml-2 p-0 h-auto">
                        <Link href={entry.profileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:text-primary">
                            View Profile <ExternalLink className="ml-1 h-3 w-3"/>
                        </Link>
                       </Button>
                    )}
                  </CardDescription>
                </div>
              </CardHeader>
              {entry.achievements && entry.achievements.length > 0 && (
                <CardContent>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center"><Award className="w-4 h-4 mr-2 text-accent"/>Achievements:</h4>
                  <div className="flex flex-wrap gap-2">
                    {entry.achievements.map(ach => (
                      <Badge key={ach} variant="secondary" className="bg-accent/20 text-accent border-accent/50">{ach}</Badge>
                    ))}
                  </div>
                </CardContent>
              )}
              {entry.lastRewardedAt && (
                <CardFooter className="text-xs text-muted-foreground">
                  Last recognized: {new Date(entry.lastRewardedAt).toLocaleDateString()}
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      ) : (
        !error && entries.length === 0 && ( // Check for no error and empty entries
          <div className="text-center py-12">
            <Activity className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">The Hall of Fame is currently empty.</p>
            <p className="text-muted-foreground">Outstanding contributions will be recognized here soon!</p>
          </div>
        )
      )}
    </div>
  );
}
