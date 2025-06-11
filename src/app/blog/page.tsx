
import { LibraryBig, ArrowRight, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { getBlogPosts } from '@/actions/blog-post-actions';
import type { BlogPost } from '@/lib/schemas/blog-post-schemas';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function BlogPage() {
  const { posts, error } = await getBlogPosts({ publishedOnly: true });

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 flex flex-col items-center text-center">
        <AlertTriangle className="w-20 h-20 text-destructive mx-auto mb-6" />
        <h1 className="font-headline text-4xl font-bold mb-4">Error Loading Blog Posts</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="flex flex-col items-center text-center mb-12">
        <LibraryBig className="w-20 h-20 text-primary mx-auto mb-6 glowing-icon-primary" />
        <h1 className="font-headline text-5xl font-bold mb-4">MintFire Blog</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Insights, articles, and updates on Cyber Security, Blockchain, AI, and IoT.
        </p>
      </div>

      {posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post: BlogPost) => (
            <Card key={post.id} className="layered-card flex flex-col overflow-hidden group">
              {post.imageUrl && (
                <div className="relative w-full h-48">
                  <Image 
                    src={post.imageUrl} 
                    alt={post.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    data-ai-hint="blog post image"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="font-headline text-2xl group-hover:text-primary transition-colors">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </CardTitle>
                <CardDescription>
                  By {post.author} on {new Date(post.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground line-clamp-3">
                  {post.content.substring(0, 150)}{post.content.length > 150 ? '...' : ''}
                </p>
                 {post.tags && post.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="link" className="text-accent p-0 hover:text-foreground">
                  <Link href={`/blog/${post.slug}`}>
                    Read More <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center mt-16">
          <p className="text-lg text-muted-foreground">
            No blog posts published yet. Check back soon for exciting content!
          </p>
        </div>
      )}
    </div>
  );
}
