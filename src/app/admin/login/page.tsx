
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // For redirection
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Mail, UserPlus, LogIn, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  checkAdminExists, 
  createAdminAccount, 
  loginAdmin, 
  CreateAdminSchema, 
  CreateAdminInput,
  LoginAdminSchema,
  LoginAdminInput
} from '@/actions/admin-actions';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

type ViewMode = 'loading' | 'login' | 'create';

export default function AdminPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('loading');
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function checkAdminStatus() {
      setServerError(null);
      const { exists, error } = await checkAdminExists();
      if (error) {
        setServerError(error);
        setViewMode('login'); // Default to login on error, admin might exist
        toast({ variant: "destructive", title: "Error", description: error });
        return;
      }
      setViewMode(exists ? 'login' : 'create');
    }
    checkAdminStatus();
  }, [toast]);

  const createForm = useForm<CreateAdminInput>({
    resolver: zodResolver(CreateAdminSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const loginForm = useForm<LoginAdminInput>({
    resolver: zodResolver(LoginAdminSchema),
    defaultValues: { email: '', password: '' },
  });

  const isSubmittingCreate = createForm.formState.isSubmitting;
  const isSubmittingLogin = loginForm.formState.isSubmitting;

  const handleCreateSubmit = async (data: CreateAdminInput) => {
    setServerError(null);
    const result = await createAdminAccount(data);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      setViewMode('login'); // Switch to login view after creation
      createForm.reset();
    } else {
      setServerError(result.message);
      toast({ variant: "destructive", title: "Creation Failed", description: result.message });
    }
  };

  const handleLoginSubmit = async (data: LoginAdminInput) => {
    setServerError(null);
    const result = await loginAdmin(data);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      // TODO: Implement actual session management and redirect to dashboard
      console.log("Login successful, redirecting (placeholder)...");
      router.push('/admin/dashboard'); // Placeholder redirect
    } else {
      setServerError(result.message);
      toast({ variant: "destructive", title: "Login Failed", description: result.message });
    }
  };
  
  if (viewMode === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Checking admin status...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12">
      <Card className="w-full max-w-md shadow-2xl border-primary/30 layered-card">
        {viewMode === 'create' && (
          <>
            <CardHeader className="text-center">
              <UserPlus className="mx-auto h-12 w-12 text-primary glowing-icon-primary mb-4" />
              <CardTitle className="font-headline text-3xl">Create Admin Account</CardTitle>
              <CardDescription>Setup the first administrator account for MintFire.</CardDescription>
            </CardHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateSubmit)}>
                <CardContent className="space-y-6">
                  <FormField
                    control={createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Email
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="admin@example.com" {...field} disabled={isSubmittingCreate} className="focus-visible:ring-accent" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Lock className="mr-2 h-4 w-4 text-muted-foreground" /> Password
                        </FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} disabled={isSubmittingCreate} className="focus-visible:ring-accent" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Lock className="mr-2 h-4 w-4 text-muted-foreground" /> Confirm Password
                        </FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} disabled={isSubmittingCreate} className="focus-visible:ring-accent" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {serverError && (
                    <p className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 mr-2" /> {serverError}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/80 text-primary-foreground glowing-icon-primary" disabled={isSubmittingCreate}>
                    {isSubmittingCreate ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Account'}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </>
        )}

        {viewMode === 'login' && (
          <>
            <CardHeader className="text-center">
              <LogIn className="mx-auto h-12 w-12 text-primary glowing-icon-primary mb-4" />
              <CardTitle className="font-headline text-3xl">Admin Login</CardTitle>
              <CardDescription>Enter your credentials to access the admin panel.</CardDescription>
            </CardHeader>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)}>
                <CardContent className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Email
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="admin@example.com" {...field} disabled={isSubmittingLogin} className="focus-visible:ring-accent" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Lock className="mr-2 h-4 w-4 text-muted-foreground" /> Password
                        </FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} disabled={isSubmittingLogin} className="focus-visible:ring-accent" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {serverError && (
                     <p className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md flex items-center justify-center">
                       <AlertTriangle className="h-4 w-4 mr-2" /> {serverError}
                     </p>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/80 text-primary-foreground glowing-icon-primary" disabled={isSubmittingLogin}>
                    {isSubmittingLogin ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...</> : 'Login'}
                  </Button>
                   <p className="text-xs text-muted-foreground text-center">
                     Forgot your password? <Link href="#" className="underline hover:text-primary">Reset it</Link> (Not implemented)
                   </p>
                </CardFooter>
              </form>
            </Form>
          </>
        )}
      </Card>
    </div>
  );
}
