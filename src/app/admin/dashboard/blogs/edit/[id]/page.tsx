
"use client";

import { useEffect, useState, useCallback, use } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBlogPostById, updateBlogPost } from "@/actions/blog-post-actions";
import BlogPostForm from "../../_components/BlogPostForm";
import { Edit, Loader2, AlertTriangle } from "lucide-react";
import type { BlogPost } from "@/lib/schemas/blog-post-schemas";

export default function EditBlogPostPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const params = use(paramsPromise);
  const postId = params.id;

  const fetchPost = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getBlogPostById(postId);
    if (result.post) {
      setPost(result.post);
    } else {
      setError(result.error || "Failed to load blog post.");
    }
    setIsLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    const result = await updateBlogPost(postId, formData);
    setIsSubmitting(false);
    if(result.success && result.post) {
      // Update local state with the returned post which might have new image URL
      setPost(result.post); 
    }
    // The form itself handles toast notifications based on the result
    return result;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading blog post...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!post) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Blog post not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full max-w-3xl">
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Edit className="w-8 h-8 text-primary glowing-icon-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Edit Blog Post</CardTitle>
              <CardDescription>Update the details for this blog post.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BlogPostForm 
            initialData={post}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitButtonText="Update Blog Post"
          />
        </CardContent>
      </Card>
    </div>
  );
}

