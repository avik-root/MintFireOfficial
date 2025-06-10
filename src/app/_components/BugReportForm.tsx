
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreateBugReportInputSchema, type CreateBugReportInput } from "@/lib/schemas/bug-report-schemas";
import { Loader2, Send, Bug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React, { useState } from "react";
import { submitBugReport } from "@/actions/bug-report-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BugReportForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const form = useForm<CreateBugReportInput>({
    resolver: zodResolver(CreateBugReportInputSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      description: "",
      pocGdriveLink: "",
      githubUrl: "",
      linkedinUrl: "",
    },
  });

  const handleSubmit = async (data: CreateBugReportInput) => {
    setIsSubmitting(true);
    setSubmissionSuccess(false);
    const result = await submitBugReport(data);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: "Bug Report Submitted!", description: "Thank you for helping us improve MintFire!" });
      form.reset();
      setSubmissionSuccess(true);
    } else {
      if (result.errors) {
        result.errors.forEach((err: any) => {
          const fieldName = Array.isArray(err.path) ? err.path.join(".") : err.path;
          form.setError(fieldName as keyof CreateBugReportInput, { message: err.message });
        });
        toast({ variant: "destructive", title: "Validation Error", description: "Please check the form fields." });
      } else {
        toast({ variant: "destructive", title: "Submission Error", description: result.error || "Failed to submit bug report." });
      }
    }
  };

  if (submissionSuccess) {
    return (
      <div className="py-12 text-center bg-card border border-primary/30 rounded-lg shadow-xl layered-card">
        <Bug className="w-16 h-16 text-accent mx-auto mb-4 glowing-icon" />
        <h3 className="text-2xl font-semibold mb-3 text-foreground">Thank You for Your Report!</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Our team will review your submission. We appreciate your effort in making MintFire more secure.
        </p>
        <Button onClick={() => setSubmissionSuccess(false)} variant="outline" className="mt-6">
          Report Another Bug
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
            name="fullName"
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl><Input type="tel" placeholder="(123) 456-7890" {...field} disabled={isSubmitting} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bug Description</FormLabel>
              <FormControl><Textarea placeholder="Describe the bug in detail, including steps to reproduce..." {...field} rows={6} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="pocGdriveLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proof of Concept (PoC) Google Drive Link</FormLabel>
              <FormControl><Input placeholder="https://drive.google.com/..." {...field} disabled={isSubmitting} /></FormControl>
              <FormDescription>Share a link to a document, video, or screenshots demonstrating the bug.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <FormField
            control={form.control}
            name="githubUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GitHub Profile URL (Optional)</FormLabel>
                <FormControl><Input placeholder="https://github.com/yourusername" {...field} value={field.value ?? ""} disabled={isSubmitting}/></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="linkedinUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn Profile URL (Optional)</FormLabel>
                <FormControl><Input placeholder="https://linkedin.com/in/yourusername" {...field} value={field.value ?? ""} disabled={isSubmitting}/></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>


        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto" variant="default">
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Report...</>
          ) : (
            <><Send className="mr-2 h-4 w-4" /> Submit Bug Report</>
          )}
        </Button>
      </form>
    </Form>
  );
}
