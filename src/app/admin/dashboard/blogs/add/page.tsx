
"use client"; 

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addBlogPost } from "@/actions/blog-post-actions";
import BlogPostForm from "../_components/BlogPostForm";
import { PlusCircle } from "lucide-react";

export default function AddBlogPostPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    const result = await addBlogPost(formData);
    setIsSubmitting(false);
    return result;
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full max-w-3xl">
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <PlusCircle className="w-8 h-8 text-primary glowing-icon-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Add New Blog Post</CardTitle>
              <CardDescription>Create and publish a new article for your blog.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BlogPostForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            submitButtonText="Add Blog Post"
          />
        </CardContent>
      </Card>
    </div>
  );
}

