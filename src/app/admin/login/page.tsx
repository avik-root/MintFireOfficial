"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Mail } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    // TODO: Implement actual login logic here
    console.log('Logging in with:', { email, password });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Example error handling
    // setError("Invalid email or password.");
    // Example success:
    // router.push('/admin/dashboard'); 
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12">
      <Card className="w-full max-w-md shadow-2xl border-primary/30 layered-card">
        <CardHeader className="text-center">
          <Lock className="mx-auto h-12 w-12 text-primary glowing-icon-primary mb-4" />
          <CardTitle className="font-headline text-3xl">Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the admin panel.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="focus-visible:ring-accent"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center">
                <Lock className="mr-2 h-4 w-4 text-muted-foreground" /> Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="focus-visible:ring-accent"
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/80 text-primary-foreground glowing-icon-primary" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Forgot your password? <Link href="#" className="underline hover:text-primary">Reset it</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
