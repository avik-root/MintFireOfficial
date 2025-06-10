
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getHallOfFameEntries, deleteHallOfFameEntry } from "@/actions/hall-of-fame-actions";
import type { HallOfFameEntry } from "@/lib/schemas/hall-of-fame-schemas";
import { Button } from "@/components/ui/button";
import Link from "next/link"; // Not used for now, but could be for "Add Entry"
import Image from "next/image";
import { Trophy, UserPlus, Edit, Trash2, AlertTriangle, Loader2, Star, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import HallOfFameEntryForm from "./_components/HallOfFameEntryForm"; 
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


export default function AdminHallOfFameManagementPage() {
  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HallOfFameEntry | null>(null);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);


  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    try {
      const { entries: fetchedEntries, error: fetchError } = await getHallOfFameEntries();
      if (fetchError) {
        setError(fetchError);
      } else {
        setEntries(fetchedEntries || []);
        if (!isInitialLoad) setError(null);
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred fetching Hall of Fame entries.");
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

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingEntry(null);
    fetchData(); // Refresh list
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    const result = await deleteHallOfFameEntry(id);
    if (result.success) {
      toast({ title: 'Success', description: 'Hall of Fame entry deleted.' });
      fetchData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to delete entry.' });
    }
    setIsDeleting(null);
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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Hall of Fame</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (showAddForm || editingEntry) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 w-full max-w-2xl">
        <Button variant="outline" onClick={() => { setShowAddForm(false); setEditingEntry(null); }} className="mb-6">
          ← Back to List
        </Button>
        <Card className="layered-card">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              {editingEntry ? "Edit Hall of Fame Entry" : "Add New Hall of Fame Entry"}
            </CardTitle>
            <CardDescription>
              {editingEntry ? "Update details for this contributor." : "Manually add or update a contributor's points and achievements."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HallOfFameEntryForm initialData={editingEntry} onSuccess={handleFormSuccess} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full">
      {error && entries.length > 0 && (
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
                <Trophy className="w-8 h-8 mr-3 text-primary glowing-icon-primary" />
                Hall of Fame Management
              </CardTitle>
              <CardDescription>View, add, or edit entries in the Hall of Fame.</CardDescription>
            </div>
            <Button onClick={() => { setEditingEntry(null); setShowAddForm(true); }} variant="default" className="shrink-0">
              <UserPlus className="mr-2 h-5 w-5" /> Add/Update Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 && !error ? (
            <div className="text-center py-12">
              <Trophy className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">Hall of Fame is empty.</p>
              <p className="text-muted-foreground">Add entries to recognize contributors.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-card">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rank</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Avatar</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Display Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Points</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Achievements</th>
                     <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {entries.map((entry: HallOfFameEntry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{entry.rank || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden border border-border">
                          <Image 
                            src={entry.avatarUrl || `https://placehold.co/40x40.png?text=${entry.displayName.charAt(0)}`} 
                            alt={entry.displayName} 
                            fill 
                            className="object-cover"
                            data-ai-hint="user avatar"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {entry.displayName}
                        {entry.profileUrl && (
                          <Link href={entry.profileUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline">
                            <ExternalLink className="inline h-3 w-3"/>
                          </Link>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{entry.userId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <span className="flex items-center"><Star className="w-4 h-4 mr-1 text-yellow-400 fill-yellow-400"/>{entry.totalPoints}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground max-w-xs truncate" title={entry.achievements?.join(', ')}>
                        {entry.achievements?.join(', ') || 'None'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                        <Button variant="ghost" size="icon" title="Edit Entry" onClick={() => setEditingEntry(entry)}>
                          <Edit className="h-4 w-4 text-accent" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Delete Entry" disabled={isDeleting === entry.id}>
                              {isDeleting === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this Hall of Fame entry.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(entry.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
