
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFeedback, deleteFeedback } from "@/actions/feedback-actions";
import type { Feedback } from "@/lib/schemas/feedback-schemas";
import { MessageSquareHeart, Star, AlertTriangle, Loader2, Trash2, User, Mail, CalendarDays } from "lucide-react";
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

export default function AdminFeedbackPage() {
  const [feedbackItems, setFeedbackItems] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    // setError(null);
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
    fetchData(true); // Initial fetch

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
      fetchData(false); // Refresh the list without full load
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error || "Failed to delete feedback." });
    }
    setIsDeleting(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading feedback...</p>
      </div>
    );
  }

  if (error && feedbackItems.length === 0) {
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
      {error && feedbackItems.length > 0 && (
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
          {feedbackItems.length === 0 && !error ? (
            <div className="text-center py-12">
              <MessageSquareHeart className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No feedback submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {feedbackItems.map((item) => (
                <Card key={item.id} className="bg-card/50 border-border">
                  <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2"><User className="w-4 h-4 text-accent"/> {item.name}</CardTitle>
                      <CardDescription className="text-xs flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-muted-foreground"/> {item.email} 
                        <span className="mx-1">·</span>
                        <CalendarDays className="w-3 h-3 text-muted-foreground"/> {new Date(item.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <StarRatingDisplay rating={item.rating} />
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
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{item.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
