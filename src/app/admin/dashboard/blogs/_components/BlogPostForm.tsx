
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CreateBlogPostInputSchema, type CreateBlogPostInput, type BlogPost } from "@/lib/schemas/blog-post-schemas";
import { Loader2, Save, Image as ImageIcon, Trash2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import React, { useState, ChangeEvent, useEffect } from "react";
import NextImage from 'next/image';

interface BlogPostFormProps {
  initialData?: BlogPost | null;
  onSubmit: (data: FormData) => Promise<{ success: boolean; error?: string; errors?: any[] }>;
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
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  const form = useForm<CreateBlogPostInput>({
    resolver: zodResolver(CreateBlogPostInputSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      slug: initialData.slug,
      content: initialData.content,
      author: initialData.author,
      tagsString: initialData.tags?.join(', ') || '',
      // imageUrl is handled by file input/preview state, not directly in form values for RHF
      isPublished: initialData.isPublished,
    } : {
      title: "",
      slug: "",
      content: "",
      author: "",
      tagsString: "",
      // imageUrl: "", // Handled by file input
      isPublished: false,
    },
  });

  useEffect(() => {
    // Only set image preview from initialData if we are in "add" mode with some initial URL (rare)
    // or if we are in "edit" mode and not removing the image.
    // For "edit" mode, this primarily ensures the preview is shown if an image exists.
    if (initialData?.imageUrl && !removeCurrentImage) {
      setImagePreview(initialData.imageUrl);
    }
  }, [initialData, removeCurrentImage]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setRemoveCurrentImage(false); 
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      // If no new file is selected, and we are not in "edit" mode with an initial image, clear preview.
      // If in "edit" mode, keep initial preview unless explicitly removed.
      if (!initialData?.imageUrl) {
        setImagePreview(null);
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setRemoveCurrentImage(true); 
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  };

  const handleSubmitWithFormData = async (data: CreateBlogPostInput) => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      // imageUrl is not part of CreateBlogPostInput, so it won't be appended here.
      // Tags array also not part of CreateBlogPostInput, tagsString is.
       if (typeof value === 'boolean') {
        formData.append(key, String(value));
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Only append imageFile if adding a new post and a file is selected
    if (!initialData && selectedFile) {
      formData.append("imageFile", selectedFile);
    }
    // For "add" mode (or if image management was re-enabled for "edit"):
    // If a new file is selected (applicable for "add" or if "edit" allowed changes)
    if (selectedFile && (initialData || !initialData)) { // This condition covers add and edit (if edit UI was present)
       if (!initialData || (initialData && initialData.imageUrl)) { // only append if adding, or if editing and there was an original image (to replace)
          formData.append("imageFile", selectedFile);
       }
    }
    
    // If in "add" mode and current image is to be removed (which shouldn't happen if previewing a new file)
    // OR if in "edit" mode and remove button was clicked (UI for this is now removed for edit)
    if (removeCurrentImage && (!initialData || initialData?.imageUrl)) {
        formData.append("removeImage", "true");
    }


    const result = await onSubmit(formData);
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
      <form onSubmit={form.handleSubmit(handleSubmitWithFormData)} className="space-y-8">
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
        
        {/* Conditionally render image upload section only for ADDING new posts */}
        {!initialData && (
          <FormItem>
            <FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4 text-muted-foreground"/>Blog Post Image</FormLabel>
            <FormControl>
              <Input 
                type="file" 
                accept="image/png, image/jpeg, image/gif, image/webp" 
                onChange={handleImageChange} 
                disabled={isSubmitting}
                ref={fileInputRef}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </FormControl>
            <FormDescription>Upload a header image for the post (PNG, JPG, GIF, WEBP). Max 5MB.</FormDescription>
            {imagePreview && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Image Preview:</p>
                <div className="w-full md:w-1/2 lg:w-1/3 rounded-md border border-border overflow-hidden">
                  <NextImage 
                    src={imagePreview} 
                    alt="Selected preview" 
                    width={0} 
                    height={0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    data-ai-hint="blog image preview"
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleRemoveImage} disabled={isSubmitting}>
                  <Trash2 className="mr-2 h-3 w-3"/> Remove Image
                </Button>
              </div>
            )}
            {/* FormMessage for imageUrl (if it were part of CreateBlogPostInputSchema) could go here */}
          </FormItem>
        )}
        
        {/* If editing and an image exists, show a non-interactive preview or just its path */}
        {initialData && initialData.imageUrl && (
          <FormItem>
            <FormLabel>Current Image</FormLabel>
            <div className="mt-2">
               <div className="w-full md:w-1/2 lg:w-1/3 rounded-md border border-border overflow-hidden">
                <NextImage 
                    src={initialData.imageUrl} 
                    alt="Current blog post image" 
                    width={0} 
                    height={0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    data-ai-hint="current blog image"
                />
                </div>
              <FormDescription className="mt-2">
                Image management is not available in edit mode. To change the image, please delete and re-create the post or use a direct file management method.
              </FormDescription>
            </div>
          </FormItem>
        )}


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

