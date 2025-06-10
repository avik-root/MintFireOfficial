
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormTeamMemberSchema, type FormTeamMemberInput, type TeamMember } from "@/lib/schemas/team-member-schemas";
import { Loader2, Save, User, Briefcase, AlignLeft, MailIcon, Github, Linkedin, CalendarDays, UploadCloud, Image as ImageIcon, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import React, { useState, ChangeEvent } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import NextImage from 'next/image';
import { Switch } from '@/components/ui/switch';
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TeamMemberFormProps {
  initialData?: TeamMember | null;
  onSubmit: (formData: FormData) => Promise<{ success: boolean; error?: string; errors?: any[] }>;
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
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<FormTeamMemberInput>({
    resolver: zodResolver(FormTeamMemberSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      role: initialData.role,
      description: initialData.description,
      imageUrl: initialData.imageUrl || "", 
      email: initialData.email,
      githubUrl: initialData.githubUrl || "",
      linkedinUrl: initialData.linkedinUrl || "",
      joiningDate: initialData.joiningDate ? initialData.joiningDate : new Date().toISOString(),
      isPublic: initialData.isPublic !== undefined ? initialData.isPublic : true,
    } : {
      name: "",
      role: "",
      description: "",
      imageUrl: "",
      email: "",
      githubUrl: "",
      linkedinUrl: "",
      joiningDate: new Date().toISOString(),
      isPublic: true,
    },
  });

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setImagePreview(initialData?.imageUrl || null);
    }
  };

  const handleFormSubmit = async (data: FormTeamMemberInput) => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'isPublic') {
        formData.append(key, String(value)); // Append boolean as string
      } else if (value !== undefined && value !== null && key !== 'imageUrl') {
        formData.append(key, String(value));
      }
    });

    if (selectedFile) {
      formData.append("imageFile", selectedFile);
    } else if (initialData?.imageUrl && !selectedFile) {
      formData.append("existingImageUrl", initialData.imageUrl);
    }
    
    const result = await onSubmit(formData);

    if (result.success) {
      toast({ title: "Success", description: `Team member ${initialData ? 'updated' : 'added'} successfully.` });
      router.push("/admin/dashboard/team");
      router.refresh(); 
    } else {
      if (result.errors) {
        result.errors.forEach((err: any) => {
          const fieldName = Array.isArray(err.path) ? err.path.join(".") : err.path;
          if (fieldName in form.getValues()) {
            form.setError(fieldName as keyof FormTeamMemberInput, { message: err.message });
          } else {
            console.warn("Error for unmapped field:", fieldName, err.message);
          }
        });
        toast({ variant: "destructive", title: "Validation Error", description: "Please check the form fields for errors." });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || `Failed to ${initialData ? 'update' : 'add'} team member.` });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base flex items-center">
                  {field.value ? <Eye className="mr-2 h-4 w-4 text-green-500"/> : <EyeOff className="mr-2 h-4 w-4 text-red-500"/>}
                  Profile Visibility
                </FormLabel>
                <FormDescription>
                  {field.value ? "Publicly visible on the Company page." : "Hidden from the public Company page."}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                  aria-label="Toggle profile visibility"
                />
              </FormControl>
            </FormItem>
          )}
        />

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
        
        <FormItem>
          <FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4 text-muted-foreground"/>Team Member Photo</FormLabel>
          <FormControl>
            <Input 
              type="file" 
              accept="image/png, image/jpeg, image/gif, image/webp" 
              onChange={handleImageChange} 
              disabled={isSubmitting}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </FormControl>
          <FormDescription>Upload a photo for the team member (PNG, JPG, GIF, WEBP). Max 10MB.</FormDescription>
          {imagePreview && (
            <div className="mt-4 relative w-32 h-32 rounded-md border border-border overflow-hidden">
              <NextImage src={imagePreview} alt="Selected preview" layout="fill" objectFit="cover" />
            </div>
          )}
          <FormMessage>{form.formState.errors.imageUrl?.message}</FormMessage>
        </FormItem>

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
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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
                <FormLabel className="flex items-center"><MailIcon className="mr-2 h-4 w-4 text-muted-foreground"/>Email Address</FormLabel>
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

