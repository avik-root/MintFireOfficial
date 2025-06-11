
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreateFeedbackInputSchema, type CreateFeedbackInput } from "@/lib/schemas/feedback-schemas";
import { Loader2, Send, Star, MessageSquareHeart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React, { useState } from "react";
import { submitFeedback } from "@/actions/feedback-actions";

export default function FeedbackForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(0);

  const form = useForm<CreateFeedbackInput>({
    resolver: zodResolver(CreateFeedbackInputSchema),
    defaultValues: {
      name: "",
      email: "",
      rating: 0,
      message: "",
    },
  });

  const handleSubmit = async (data: CreateFeedbackInput) => {
    setIsSubmitting(true);
    setSubmissionSuccess(false);
    
    const payload = { ...data, rating: currentRating };
    if (currentRating === 0) {
        form.setError("rating", { message: "Please select a rating." });
        setIsSubmitting(false);
        return;
    }

    const result = await submitFeedback(payload);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: "Feedback Submitted!", description: "Thank you for your valuable feedback!" });
      form.reset();
      setCurrentRating(0);
      setSubmissionSuccess(true);
    } else {
      if (result.errors) {
        result.errors.forEach((err: any) => {
          const fieldName = Array.isArray(err.path) ? err.path.join(".") : err.path;
          form.setError(fieldName as keyof CreateFeedbackInput, { message: err.message });
        });
        toast({ variant: "destructive", title: "Validation Error", description: "Please check the form fields." });
      } else {
        toast({ variant: "destructive", title: "Submission Error", description: result.error || "Failed to submit feedback." });
      }
    }
  };

  if (submissionSuccess) {
    return (
      <div className="py-12 text-center"> {/* Removed card-like styling */}
        <MessageSquareHeart className="w-16 h-16 text-accent mx-auto mb-4 glowing-icon" />
        <h3 className="text-2xl font-semibold mb-3 text-foreground">Thank You!</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your feedback has been received. We appreciate you taking the time to help us improve.
        </p>
        <Button onClick={() => setSubmissionSuccess(false)} variant="outline" className="mt-6">
          Submit Another Feedback
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl><Input placeholder="Your Name" {...field} disabled={isSubmitting} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl><Input type="email" placeholder="your.email@example.com" {...field} disabled={isSubmitting} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => ( 
            <FormItem>
              <FormLabel>Overall Rating</FormLabel>
              <FormControl>
                <div className="flex space-x-1 items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => {
                        setCurrentRating(star);
                        form.setValue("rating", star, { shouldValidate: true });
                      }}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none p-1"
                      aria-label={`Rate ${star} out of 5 stars`}
                      disabled={isSubmitting}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors duration-150 
                          ${(hoverRating || currentRating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50 fill-muted-foreground/20'}`}
                      />
                    </button>
                  ))}
                  {currentRating > 0 && <span className="ml-2 text-sm text-muted-foreground">({currentRating}/5)</span>}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Feedback</FormLabel>
              <FormControl><Textarea placeholder="Tell us what you think..." {...field} rows={6} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto" variant="default">
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
          ) : (
            <><Send className="mr-2 h-4 w-4" /> Submit Feedback</>
          )}
        </Button>
      </form>
    </Form>
  );
}
