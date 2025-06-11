
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFeedback, deleteFeedback } from "@/actions/feedback-actions";
import type { Feedback } from "@/lib/schemas/feedback-schemas";
import { MessageSquareHeart, Star, AlertTriangle, Loader2, Trash2, User, Mail, CalendarDays, ArrowUpDown } from "lucide-react";
import { Button } from '@/components/ui/button';
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

const StarRatingDisplay = ({ rating }: { rating: number }) => {
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
};

type SortKey = 'name' | 'email' | 'rating' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function AdminFeedbackPage() {
  const [feedbackItems, setFeedbackItems] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    try {
      const result = await getFeedback();
      if (result.feedbackItems) {
        setFeedbackItems(result.feedbackItems);
         if (!isInitialLoad) setError(null);
      } else {
        setError(result.error || "Failed to load feedback.");
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred fetching feedback.");
    }
    if (isInitialLoad) setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData(true); 

    const intervalId = setInterval(() => {
      if (!document.hidden) {
        fetchData(false);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    const result = await deleteFeedback(id);
    if (result.success) {
      toast({ title: "Success", description: "Feedback item deleted successfully." });
      fetchData(false); 
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error || "Failed to delete feedback." });
    }
    setIsDeleting(null);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedFeedbackItems = useMemo(() => {
    let items = [...feedbackItems];
    items.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === 'createdAt') {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      let comparison = 0;
      if (valA > valB) comparison = 1;
      else if (valA < valB) comparison = -1;
      
      return sortDirection === 'desc' ? comparison * -1 : comparison;
    });
    return items;
  }, [feedbackItems, sortKey, sortDirection]);
  
  const SortableHeader = ({ children, columnKey }: { children: React.ReactNode; columnKey: SortKey }) => (
    <th 
        scope="col" 
        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/50"
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
        <p className="text-muted-foreground">Loading feedback...</p>
      </div>
    );
  }

  if (error && sortedFeedbackItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Feedback</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full">
      {error && sortedFeedbackItems.length > 0 && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <p>Error refreshing data: {error}. Displaying last known data.</p>
        </div>
      )}
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <MessageSquareHeart className="w-8 h-8 text-primary glowing-icon-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">User Feedback</CardTitle>
              <CardDescription>Review feedback submitted by users.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedFeedbackItems.length === 0 && !error ? (
            <div className="text-center py-12">
              <MessageSquareHeart className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No feedback submitted yet.</p>
            </div>
          ) : (
             <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-card">
                  <tr>
                    <SortableHeader columnKey="name">Name</SortableHeader>
                    <SortableHeader columnKey="email">Email</SortableHeader>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Message Snippet</th>
                    <SortableHeader columnKey="rating">Rating</SortableHeader>
                    <SortableHeader columnKey="createdAt">Submitted At</SortableHeader>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {sortedFeedbackItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">{item.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.email}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground max-w-xs truncate" title={item.message}>
                        {item.message.substring(0, 50)}{item.message.length > 50 ? '...' : ''}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StarRatingDisplay rating={item.rating} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Delete Feedback" disabled={isDeleting === item.id}>
                              {isDeleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this feedback. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
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

