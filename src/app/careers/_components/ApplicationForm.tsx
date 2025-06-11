
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreateApplicantInputSchema, type CreateApplicantInput } from "@/lib/schemas/applicant-schemas";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React, { useState } from "react";
import { submitApplication } from "@/actions/applicant-actions";

export default function ApplicationForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const form = useForm<CreateApplicantInput>({
    resolver: zodResolver(CreateApplicantInputSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      positionAppliedFor: "",
      coverLetter: "",
      resumeLink: "",
      portfolioUrl: "",
      githubUrl: "",
      linkedinUrl: "",
    },
  });

  const handleSubmit = async (data: CreateApplicantInput) => {
    setIsSubmitting(true);
    setSubmissionSuccess(false);
    const result = await submitApplication(data);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: "Application Submitted!", description: "We've received your application. Thank you!" });
      form.reset();
      setSubmissionSuccess(true);
    } else {
      if (result.errors) {
        result.errors.forEach((err: any) => {
          const fieldName = Array.isArray(err.path) ? err.path.join(".") : err.path;
          form.setError(fieldName as keyof CreateApplicantInput, { message: err.message });
        });
        toast({ variant: "destructive", title: "Validation Error", description: "Please check the form fields for errors." });
      } else {
        toast({ variant: "destructive", title: "Submission Error", description: result.error || "Failed to submit application. Please try again." });
      }
    }
  };

  if (submissionSuccess) {
    return (
      <div className="py-12 text-center bg-card border border-primary/30 rounded-lg shadow-xl">
        <Send className="w-16 h-16 text-accent mx-auto mb-4 glowing-icon" />
        <h3 className="text-2xl font-semibold mb-3 text-foreground">Application Received!</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Thank you for your application! If your profile matches our requirements, the MintFire team will contact you via email.
        </p>
        <Button onClick={() => setSubmissionSuccess(false)} variant="outline" className="mt-6">
          Submit Another Application
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
                <FormControl>
                  <Input placeholder="e.g., Jane Doe" {...field} disabled={isSubmitting} />
                </FormControl>
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
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="(123) 456-7890" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="positionAppliedFor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position Applied For</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Software Engineer, Product Manager" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="resumeLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resume/CV Link</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/your-resume.pdf" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>Please provide a direct link to your resume/CV (e.g., Google Drive, Dropbox, personal website).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="portfolioUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Portfolio/Website URL (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://yourportfolio.com" {...field} value={field.value ?? ""} disabled={isSubmitting}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="githubUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GitHub Profile URL (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://github.com/yourusername" {...field} value={field.value ?? ""} disabled={isSubmitting}/>
                </FormControl>
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
                <FormControl>
                  <Input placeholder="https://linkedin.com/in/yourusername" {...field} value={field.value ?? ""} disabled={isSubmitting}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="coverLetter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Letter / Message</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us why you're a great fit for MintFire..." {...field} rows={8} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto" variant="default">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Application...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" /> Submit Application
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
