
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBlogPosts } from "@/actions/blog-post-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Edit, Newspaper, AlertTriangle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DeleteBlogPostButton from "./_components/DeleteBlogPostButton";
import type { BlogPost } from "@/lib/schemas/blog-post-schemas";

export default async function AdminBlogPostsPage() {
  const { posts: blogPosts, error } = await getBlogPosts();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Blog Posts</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!blogPosts) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Newspaper className="w-16 h-16 mb-4 text-muted-foreground animate-pulse" />
        <p className="text-muted-foreground">Loading blog posts...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full">
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="font-headline text-3xl flex items-center">
                <Newspaper className="w-8 h-8 mr-3 text-primary glowing-icon-primary" />
                Manage Blog Posts
              </CardTitle>
              <CardDescription>View, add, edit, or delete blog articles.</CardDescription>
            </div>
            <Button asChild variant="default" className="shrink-0">
              <Link href="/admin/dashboard/blogs/add">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Post
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {blogPosts.length === 0 ? (
            <div className="text-center py-12">
              <Newspaper className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No blog posts found.</p>
              <p className="text-muted-foreground">Get started by adding a new blog post.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-card">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Author</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created At</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {blogPosts.map((post: BlogPost) => (
                    <tr key={post.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{post.title}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{post.author}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant={post.isPublished ? "default" : "secondary"} className={post.isPublished ? "bg-green-600/30 text-green-400 border-green-500" : "bg-yellow-600/30 text-yellow-400 border-yellow-500"}>
                          {post.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                        {post.isPublished && (
                           <Button variant="ghost" size="icon" asChild title="View Post">
                             <Link href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                               <ExternalLink className="h-4 w-4 text-blue-500" />
                             </Link>
                           </Button>
                        )}
                        <Button variant="ghost" size="icon" asChild title="Edit Post">
                          <Link href={`/admin/dashboard/blogs/edit/${post.id}`}>
                            <Edit className="h-4 w-4 text-accent" />
                          </Link>
                        </Button>
                        <DeleteBlogPostButton postId={post.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
