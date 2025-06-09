
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CreateBlogPostInputSchema, type CreateBlogPostInput, type BlogPost } from "@/lib/schemas/blog-post-schemas";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import React from "react";

interface BlogPostFormProps {
  initialData?: BlogPost | null;
  onSubmit: (data: CreateBlogPostInput) => Promise<{ success: boolean; error?: string; errors?: any[] }>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

export default function BlogPostForm({ 
  initialData, 
  onSubmit,
  isSubmitting,
  submitButtonText = "Save Post" 
}: BlogPostFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<CreateBlogPostInput>({
    resolver: zodResolver(CreateBlogPostInputSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      slug: initialData.slug,
      content: initialData.content,
      author: initialData.author,
      tagsString: initialData.tags?.join(', ') || '',
      imageUrl: initialData.imageUrl || undefined,
      isPublished: initialData.isPublished,
    } : {
      title: "",
      slug: "",
      content: "",
      author: "",
      tagsString: "",
      imageUrl: "",
      isPublished: false,
    },
  });

  const handleSubmit = async (data: CreateBlogPostInput) => {
    const result = await onSubmit(data);
    if (result.success) {
      toast({ title: "Success", description: `Blog post ${initialData ? 'updated' : 'added'} successfully.` });
      router.push("/admin/dashboard/blogs");
      router.refresh(); 
    } else {
      if (result.errors) {
        result.errors.forEach((err: any) => {
          const fieldName = Array.isArray(err.path) ? err.path.join(".") : err.path;
          form.setError(fieldName as keyof CreateBlogPostInput, { message: err.message });
        });
        toast({ variant: "destructive", title: "Validation Error", description: "Please check the form fields for errors." });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || `Failed to ${initialData ? 'update' : 'add'} blog post.` });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter post title" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="e.g., my-awesome-post" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>URL-friendly identifier (e.g., 'hello-world'). Use lowercase letters, numbers, and hyphens.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="author"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Author</FormLabel>
              <FormControl>
                <Input placeholder="Enter author name" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content (Markdown supported)</FormLabel>
              <FormControl>
                <Textarea placeholder="Write your blog post content here..." {...field} rows={15} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="tagsString"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., tech, AI, tutorial" {...field} value={field.value ?? ""} disabled={isSubmitting}/>
              </FormControl>
              <FormDescription>Comma-separated list of tags.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.png" {...field} value={field.value ?? ""} disabled={isSubmitting}/>
              </FormControl>
              <FormDescription>Provide a direct link to a header image for the post.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPublished"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Publish Status</FormLabel>
                <FormDescription>
                  Is this blog post published and visible to the public?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItem>
          )}
        />

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
