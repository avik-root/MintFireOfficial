
import { getBlogPostBySlug, getBlogPosts } from '@/actions/blog-post-actions';
import { BlogPost } from '@/lib/schemas/blog-post-schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { CalendarDays, UserCircle, Tags, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
// For converting Markdown to HTML (optional, install 'marked' or similar if needed)
// import { marked } from 'marked'; 

// Function to generate static paths
export async function generateStaticParams() {
  const { posts } = await getBlogPosts({ publishedOnly: true });
  return posts?.map(post => ({ slug: post.slug })) || [];
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { post, error } = await getBlogPostBySlug(params.slug);

  if (error || !post) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 text-center">
        <h1 className="text-3xl font-bold text-destructive mb-4">Post Not Found</h1>
        <p className="text-muted-foreground">{error || "The blog post you're looking for doesn't exist or is not published."}</p>
        <Button asChild variant="link" className="mt-6">
          <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog</Link>
        </Button>
      </div>
    );
  }

  // Example of simple Markdown to HTML conversion (replace with a proper library if needed)
  // const htmlContent = marked.parse(post.content); // Requires 'marked' library
  // For now, we'll render content directly assuming it might contain basic HTML or just text.
  // For security, if content is user-generated Markdown, ensure proper sanitization.
  const displayContent = post.content.replace(/\\n/g, '<br />'); // Simple newline handling for now

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-4xl">
      <article className="space-y-8">
        <header className="space-y-4">
          <Button asChild variant="outline" size="sm" className="mb-6">
             <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog</Link>
          </Button>

          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary leading-tight">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-accent" />
              <span>By {post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-accent" />
              <span>{new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tags className="w-5 h-5 text-accent" />
                {post.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
            )}
          </div>
        </header>

        {post.imageUrl && (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg border border-border">
            <Image 
              src={post.imageUrl} 
              alt={post.title} 
              fill 
              className="object-cover" 
              priority
              data-ai-hint="blog post header image"
            />
          </div>
        )}

        <Card className="layered-card">
          <CardContent className="py-6 prose prose-invert prose-lg max-w-none dark:prose-invert 
            prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground 
            prose-a:text-accent hover:prose-a:text-primary 
            prose-blockquote:border-accent prose-blockquote:text-muted-foreground
            prose-code:bg-muted prose-code:text-accent prose-code:p-1 prose-code:rounded-sm
            prose-li:marker:text-accent">
            {/* 
              For proper Markdown rendering, you'd use a library:
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} /> 
              Ensure content is sanitized if it's user-input markdown.
              Using a simple pre-wrap for now for basic text display.
            */}
             <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: displayContent }} />
          </CardContent>
        </Card>

      </article>
    </div>
  );
}
