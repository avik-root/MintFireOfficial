
import { LibraryBig } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BlogPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="flex flex-col items-center text-center mb-12">
        <LibraryBig className="w-20 h-20 text-primary mx-auto mb-6 glowing-icon-primary" />
        <h1 className="font-headline text-5xl font-bold mb-4">MintFire Blog</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Insights, articles, and updates on Cyber Security, Blockchain, AI, and IoT.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Placeholder for blog posts - to be replaced with dynamic content */}
        {[1, 2, 3].map((i) => (
          <Card key={i} className="layered-card">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Placeholder Blog Post {i}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This is a placeholder for a blog post. Content coming soon!
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
       <div className="text-center mt-16">
        <p className="text-lg text-muted-foreground">
          Our blog is currently under construction. Check back soon for exciting content!
        </p>
      </div>
    </div>
  );
}
