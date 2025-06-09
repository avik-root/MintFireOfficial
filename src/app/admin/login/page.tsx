
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Mail, UserPlus, LogIn, AlertTriangle, Loader2, UserSquare2, Fingerprint, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  checkAdminExists, 
  createAdminAccount, 
  loginAdmin, 
} from '@/actions/admin-actions';
import {
  CreateAdminSchema, 
  type CreateAdminInput,
  LoginAdminSchema,
  type LoginAdminInput
} from '@/lib/schemas/admin-schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';

type ViewMode = 'loading' | 'login' | 'create';

export default function AdminPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('loading');
  const [serverError, setServerError] = useState<string | null>(null);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showCreateConfirmPassword, setShowCreateConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function checkAdminStatus() {
      setServerError(null);
      const { exists, error } = await checkAdminExists();
      if (error) {
        setServerError(error);
        setViewMode('login'); 
        toast({ variant: "destructive", title: "Error", description: error });
        return;
      }
      setViewMode(exists ? 'login' : 'create');
    }
    checkAdminStatus();
  }, [toast]);

  const createForm = useForm<CreateAdminInput>({
    resolver: zodResolver(CreateAdminSchema),
    defaultValues: { adminName: '', adminId: '', email: '', password: '', confirmPassword: '' },
    mode: 'onBlur', 
  });

  const loginForm = useForm<LoginAdminInput>({
    resolver: zodResolver(LoginAdminSchema),
    defaultValues: { adminName: '', adminId: '', email: '', password: '' },
  });

  const isSubmittingCreate = createForm.formState.isSubmitting;
  const isSubmittingLogin = loginForm.formState.isSubmitting;

  const passwordValue = useWatch({
    control: createForm.control,
    name: 'password',
  });

  const handleCreateSubmit = async (data: CreateAdminInput) => {
    setServerError(null);
    const result = await createAdminAccount(data);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      setViewMode('login'); 
      createForm.reset();
      loginForm.reset(); 
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
      await router.push('/admin/dashboard'); 
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
                <CardContent className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="adminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <UserSquare2 className="mr-2 h-4 w-4 text-muted-foreground" /> Admin Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Jane Doe" {...field} disabled={isSubmittingCreate} className="focus-visible:ring-accent" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="adminId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Fingerprint className="mr-2 h-4 w-4 text-muted-foreground" /> Admin ID
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., mintfire_admin01" {...field} disabled={isSubmittingCreate} className="focus-visible:ring-accent" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Email
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="admin@example.com" {...field} disabled={isSubmittingCreate} className="focus-visible:ring-accent" />
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
                          <div className="relative">
                            <Input 
                              type={showCreatePassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              {...field} 
                              disabled={isSubmittingCreate} 
                              className="focus-visible:ring-accent pr-10" 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary"
                              onClick={() => setShowCreatePassword(!showCreatePassword)}
                              tabIndex={-1}
                            >
                              {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              <span className="sr-only">{showCreatePassword ? "Hide password" : "Show password"}</span>
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <PasswordStrengthMeter password={passwordValue} />
                  <FormField
                    control={createForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Lock className="mr-2 h-4 w-4 text-muted-foreground" /> Confirm Password
                        </FormLabel>
                        <FormControl>
                           <div className="relative">
                            <Input 
                              type={showCreateConfirmPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              {...field} 
                              disabled={isSubmittingCreate} 
                              className="focus-visible:ring-accent pr-10"
                            />
                             <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary"
                              onClick={() => setShowCreateConfirmPassword(!showCreateConfirmPassword)}
                              tabIndex={-1}
                            >
                              {showCreateConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              <span className="sr-only">{showCreateConfirmPassword ? "Hide password" : "Show password"}</span>
                            </Button>
                          </div>
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
                <CardFooter className="flex flex-col gap-4 pt-4">
                  <Button type="submit" className="w-full" variant="default" disabled={isSubmittingCreate}>
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
                    name="adminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <UserSquare2 className="mr-2 h-4 w-4 text-muted-foreground" /> Admin Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Jane Doe" {...field} disabled={isSubmittingLogin} className="focus-visible:ring-accent" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="adminId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Fingerprint className="mr-2 h-4 w-4 text-muted-foreground" /> Admin ID
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., mintfire_admin01" {...field} disabled={isSubmittingLogin} className="focus-visible:ring-accent" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Email
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="admin@example.com" {...field} disabled={isSubmittingLogin} className="focus-visible:ring-accent" />
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
                          <div className="relative">
                            <Input 
                              type={showLoginPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              {...field} 
                              disabled={isSubmittingLogin} 
                              className="focus-visible:ring-accent pr-10" 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              tabIndex={-1}
                            >
                              {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              <span className="sr-only">{showLoginPassword ? "Hide password" : "Show password"}</span>
                            </Button>
                          </div>
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
                  <Button type="submit" className="w-full" variant="default" disabled={isSubmittingLogin}>
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
