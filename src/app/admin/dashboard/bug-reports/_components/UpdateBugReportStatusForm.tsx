"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BugReportStatusSchema, UpdateBugReportStatusInputSchema, type UpdateBugReportStatusInput, type BugReport } from "@/lib/schemas/bug-report-schemas";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { updateBugReport } from "@/actions/bug-report-actions";

interface UpdateBugReportStatusFormProps {
  report: BugReport;
  onSuccess?: () => void; 
}

export default function UpdateBugReportStatusForm({ report, onSuccess }: UpdateBugReportStatusFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<UpdateBugReportStatusInput>({
    resolver: zodResolver(UpdateBugReportStatusInputSchema),
    defaultValues: {
      status: report.status,
      adminNotes: report.adminNotes || "",
    },
  });

  const handleSubmit = async (data: UpdateBugReportStatusInput) => {
    setIsSubmitting(true);
    const result = await updateBugReport(report.id, data);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: "Success", description: "Bug report status updated successfully." });
      if (onSuccess) onSuccess();
    } else {
      if (result.errors) {
        result.errors.forEach((err: any) => {
          form.setError(err.path.join(".") as keyof UpdateBugReportStatusInput, { message: err.message });
        });
        toast({ variant: "destructive", title: "Validation Error", description: "Please check the form." });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to update status." });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Report Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BugReportStatusSchema.options.map(statusValue => (
                    <SelectItem key={statusValue} value={statusValue}>{statusValue}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="adminNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Internal notes about the bug report..."
                  {...field}
                  value={field.value ?? ""}
                  rows={5}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Status...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Update Status & Notes
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}