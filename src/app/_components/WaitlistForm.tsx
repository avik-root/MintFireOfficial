
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { addToWaitlist } from "@/actions/waitlist-actions";
import { WaitlistFormSchema, type WaitlistFormData } from "@/lib/schemas/waitlist-schemas";

interface WaitlistFormProps {
  productId: string;
  productName: string;
  onSuccess: () => void; // Callback when submission is successful
  onCancel: () => void; // Callback to go back
}

export default function WaitlistForm({ productId, productName, onSuccess, onCancel }: WaitlistFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<WaitlistFormData>({
    resolver: zodResolver(WaitlistFormSchema),
    defaultValues: {
      name: "",
      email: "",
      contactNumber: "",
    },
  });

  const handleSubmit = async (data: WaitlistFormData) => {
    setIsSubmitting(true);
    const payload = { ...data, productId, productName };
    const result = await addToWaitlist(payload);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Joined Waitlist!",
        description: `You're on the waitlist for ${productName}. We'll notify you!`,
      });
      form.reset();
      onSuccess(); // Call the success callback
    } else {
      if (result.errors) {
        result.errors.forEach((err: any) => {
          const fieldName = Array.isArray(err.path) ? err.path.join(".") : err.path;
          form.setError(fieldName as keyof WaitlistFormData, { message: err.message });
        });
        toast({ variant: "destructive", title: "Validation Error", description: "Please check the form." });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to join waitlist." });
      }
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-center">Join Waitlist for {productName}</h3>
      <p className="text-sm text-muted-foreground text-center">
        Be the first to know when {productName} is available.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
          <FormField
            control={form.control}
            name="contactNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Number</FormLabel>
                <FormControl><Input type="tel" placeholder="(123) 456-7890" {...field} disabled={isSubmitting} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto">
              Back to Details
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Join Waitlist</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
