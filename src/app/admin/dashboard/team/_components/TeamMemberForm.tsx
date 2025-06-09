
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreateTeamMemberInputSchema, type CreateTeamMemberInput, type TeamMember } from "@/lib/schemas/team-member-schemas";
import { Loader2, Save, User, Briefcase, AlignLeft, Image as ImageIcon, Mail, Github, Linkedin, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TeamMemberFormProps {
  initialData?: TeamMember | null;
  onSubmit: (data: CreateTeamMemberInput) => Promise<{ success: boolean; error?: string; errors?: any[] }>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

export default function TeamMemberForm({ 
  initialData, 
  onSubmit,
  isSubmitting,
  submitButtonText = "Save Member" 
}: TeamMemberFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<CreateTeamMemberInput>({
    resolver: zodResolver(CreateTeamMemberInputSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      role: initialData.role,
      description: initialData.description,
      imageUrl: initialData.imageUrl || "",
      email: initialData.email,
      githubUrl: initialData.githubUrl || "",
      linkedinUrl: initialData.linkedinUrl || "",
      joiningDate: initialData.joiningDate ? initialData.joiningDate : new Date().toISOString(),
    } : {
      name: "",
      role: "",
      description: "",
      imageUrl: "",
      email: "",
      githubUrl: "",
      linkedinUrl: "",
      joiningDate: new Date().toISOString(),
    },
  });

  const handleSubmit = async (data: CreateTeamMemberInput) => {
    // Ensure joiningDate is in ISO string format if it's a Date object from the picker
    const payload = {
      ...data,
      joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString() : new Date().toISOString(),
    };
    const result = await onSubmit(payload);
    if (result.success) {
      toast({ title: "Success", description: `Team member ${initialData ? 'updated' : 'added'} successfully.` });
      router.push("/admin/dashboard/team");
      router.refresh(); 
    } else {
      if (result.errors) {
        result.errors.forEach((err: any) => {
          const fieldName = Array.isArray(err.path) ? err.path.join(".") : err.path;
          form.setError(fieldName as keyof CreateTeamMemberInput, { message: err.message });
        });
        toast({ variant: "destructive", title: "Validation Error", description: "Please check the form fields for errors." });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || `Failed to ${initialData ? 'update' : 'add'} team member.` });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground"/>Full Name</FormLabel>
                <FormControl>
                    <Input placeholder="Enter full name" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground"/>Job Role / Title</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Lead Developer, CEO" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><AlignLeft className="mr-2 h-4 w-4 text-muted-foreground"/>Short Description / Bio</FormLabel>
              <FormControl>
                <Textarea placeholder="Brief introduction about the team member..." {...field} rows={5} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4 text-muted-foreground"/>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/profile-image.png" {...field} value={field.value ?? ""} disabled={isSubmitting}/>
              </FormControl>
              <FormDescription>Provide a direct link to the team member's photo.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
            control={form.control}
            name="joiningDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground"/>Joining Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={isSubmitting}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? date.toISOString() : undefined)}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  The date the team member officially joined.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />


        <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground"/>Email Address</FormLabel>
                <FormControl>
                    <Input type="email" placeholder="member@mintfire.com" {...field} disabled={isSubmitting} />
                </FormControl>
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
                <FormLabel className="flex items-center"><Github className="mr-2 h-4 w-4 text-muted-foreground"/>GitHub Profile URL (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="https://github.com/username" {...field} value={field.value ?? ""} disabled={isSubmitting}/>
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
                <FormLabel className="flex items-center"><Linkedin className="mr-2 h-4 w-4 text-muted-foreground"/>LinkedIn Profile URL (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="https://linkedin.com/in/username" {...field} value={field.value ?? ""} disabled={isSubmitting}/>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>


        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> {submitButtonText}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
