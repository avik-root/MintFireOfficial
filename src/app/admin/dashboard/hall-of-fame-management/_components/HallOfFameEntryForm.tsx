
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Not used here, but good to have
import { ManageHallOfFameEntrySchema, type ManageHallOfFameEntryInput, type HallOfFameEntry } from "@/lib/schemas/hall-of-fame-schemas";
import { Loader2, Save, User, Award, Star, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { manageHallOfFameEntry } from "@/actions/hall-of-fame-actions";

interface HallOfFameEntryFormProps {
  initialData?: HallOfFameEntry | null;
  onSuccess: () => void;
}

export default function HallOfFameEntryForm({ initialData, onSuccess }: HallOfFameEntryFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ManageHallOfFameEntryInput>({
    resolver: zodResolver(ManageHallOfFameEntrySchema),
    defaultValues: initialData ? {
      userId: initialData.userId,
      displayName: initialData.displayName,
      pointsToAdd: 0, // Always start with 0 points to add for an update
      newAchievement: "",
      profileUrl: initialData.profileUrl || "",
      avatarUrl: initialData.avatarUrl || "",
    } : {
      userId: "",
      displayName: "",
      pointsToAdd: 0,
      newAchievement: "",
      profileUrl: "",
      avatarUrl: "",
    },
  });

  const handleSubmit = async (data: ManageHallOfFameEntryInput) => {
    setIsSubmitting(true);
    const result = await manageHallOfFameEntry(data);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: "Success", description: `Hall of Fame entry ${initialData ? 'updated' : 'created/updated'} successfully.` });
      onSuccess(); // Call parent's success handler (e.g., close form, refresh list)
    } else {
      if (result.errors) {
        result.errors.forEach((err: any) => {
          const fieldName = Array.isArray(err.path) ? err.path.join(".") : err.path;
          form.setError(fieldName as keyof ManageHallOfFameEntryInput, { message: err.message });
        });
        toast({ variant: "destructive", title: "Validation Error", description: "Please check the form." });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to manage entry." });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4"/>User Identifier</FormLabel>
              <FormControl>
                <Input placeholder="e.g., github_username or email" {...field} disabled={isSubmitting || !!initialData} />
              </FormControl>
              <FormDescription>{initialData ? "User ID cannot be changed." : "Unique identifier for the user (e.g., GitHub username)."}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4"/>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="Name to display on Hall of Fame" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pointsToAdd"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Star className="mr-2 h-4 w-4"/>Points to Add/Award</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} 
                  onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} 
                  disabled={isSubmitting} 
                />
              </FormControl>
              <FormDescription>Enter points to add to current total. Use 0 if only adding achievement.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newAchievement"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Award className="mr-2 h-4 w-4"/>New Achievement (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Bug Hunter Q1" {...field} value={field.value ?? ""} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>If adding a new achievement for this user.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="profileUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><LinkIcon className="mr-2 h-4 w-4"/>Profile URL (Optional)</FormLabel>
              <FormControl><Input placeholder="https://github.com/username" {...field} value={field.value ?? ""} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="avatarUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4"/>Avatar URL (Optional)</FormLabel>
              <FormControl><Input placeholder="https://example.com/avatar.png" {...field} value={field.value ?? ""} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="mr-2 h-4 w-4" /> {initialData ? "Update Entry" : "Add/Update Entry"}</>
          )}
        </Button>
      </form>
    </Form>
  );
}

