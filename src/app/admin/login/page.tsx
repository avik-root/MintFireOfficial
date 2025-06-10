
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Mail, UserPlus, LogIn, AlertTriangle, Loader2, UserSquare2, Fingerprint, Eye, EyeOff, Shield } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  checkAdminExists, 
  createAdminAccount, 
  loginAdmin,
  verifyPinForLogin,
  disable2FABySuperAction
} from '@/actions/admin-actions';
import {
  CreateAdminSchema, 
  type CreateAdminInput,
  LoginAdminSchema,
  type LoginAdminInput,
  VerifyPinSchema,
  type VerifyPinInput
} from '@/lib/schemas/admin-schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';

type ViewMode = 'loading' | 'create' | 'pin_entry' | 'pin_locked_super_action' | 'login_form';

export default function AdminLoginPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('loading');
  const [serverError, setServerError] = useState<string | null>(null);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showCreateConfirmPassword, setShowCreateConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [pinAttempts, setPinAttempts] = useState(0);
  const MAX_PIN_ATTEMPTS = 5;

  const router = useRouter();
  const { toast } = useToast();

  const checkInitialStatus = useCallback(async () => {
    setServerError(null);
    const { exists, adminId, is2FAEnabled, error } = await checkAdminExists();
    if (error) {
      setServerError(error);
      setViewMode('login_form'); // Default to login if check fails
      toast({ variant: "destructive", title: "System Error", description: error });
      return;
    }
    if (exists && adminId) {
      setCurrentAdminId(adminId);
      if (is2FAEnabled) {
        setViewMode('pin_entry');
      } else {
        setViewMode('login_form');
      }
    } else {
      setViewMode('create');
    }
  }, [toast]);

  useEffect(() => {
    checkInitialStatus();
  }, [checkInitialStatus]);

  const createForm = useForm<CreateAdminInput>({
    resolver: zodResolver(CreateAdminSchema),
    defaultValues: { adminName: '', adminId: '', email: '', password: '', confirmPassword: '' },
    mode: 'onBlur', 
  });

  const loginForm = useForm<LoginAdminInput>({
    resolver: zodResolver(LoginAdminSchema),
    defaultValues: { adminName: '', adminId: '', email: '', password: '' },
  });
  
  const pinForm = useForm<VerifyPinInput>({
    resolver: zodResolver(VerifyPinSchema),
    defaultValues: { pin: '' },
  });

  const [superActionInput, setSuperActionInput] = useState('');

  const isSubmittingCreate = createForm.formState.isSubmitting;
  const isSubmittingLogin = loginForm.formState.isSubmitting;
  const isSubmittingPin = pinForm.formState.isSubmitting;
  const [isSubmittingSuperAction, setIsSubmittingSuperAction] = useState(false);

  const passwordValue = useWatch({ control: createForm.control, name: 'password' });

  const handleCreateSubmit = async (data: CreateAdminInput) => {
    setServerError(null);
    const result = await createAdminAccount(data);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      await checkInitialStatus(); // Re-check status to transition to login or PIN
      createForm.reset();
      loginForm.reset();
      pinForm.reset();
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
      router.push('/admin/dashboard'); 
    } else {
      setServerError(result.message);
      toast({ variant: "destructive", title: "Login Failed", description: result.message });
    }
  };

  const handlePinSubmit = async (data: VerifyPinInput) => {
    if (!currentAdminId) {
      toast({ variant: "destructive", title: "Error", description: "Admin ID not found." });
      return;
    }
    setServerError(null);
    const result = await verifyPinForLogin(currentAdminId, data.pin);
    if (result.success) {
      toast({ title: "PIN Verified", description: "Please proceed to login."});
      setViewMode('login_form');
      setPinAttempts(0);
    } else {
      const newAttempts = pinAttempts + 1;
      setPinAttempts(newAttempts);
      setServerError(result.message || "Incorrect PIN.");
      toast({ variant: "destructive", title: "PIN Invalid", description: result.message || "Incorrect PIN." });
      if (newAttempts >= MAX_PIN_ATTEMPTS) {
        setViewMode('pin_locked_super_action');
        setServerError(`Maximum PIN attempts reached. Use Super Action to bypass.`);
      }
    }
    pinForm.reset();
  };
  
  const handleSuperActionSubmit = async () => {
    if (!currentAdminId) {
        toast({ variant: "destructive", title: "Error", description: "Admin ID not found for Super Action." });
        return;
    }
    setIsSubmittingSuperAction(true);
    setServerError(null);
    const result = await disable2FABySuperAction(currentAdminId, superActionInput);
    setIsSubmittingSuperAction(false);
    if (result.success) {
        toast({ title: "2FA Disabled", description: result.message });
        setViewMode('login_form');
        setPinAttempts(0);
        setSuperActionInput('');
    } else {
        setServerError(result.message);
        toast({ variant: "destructive", title: "Super Action Failed", description: result.message });
    }
  };
  
  if (viewMode === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Verifying setup...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12">
      <Card className="w-full max-w-md shadow-2xl border-primary/30 layered-card">
        {/* Create Account View */}
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
                  <FormField control={createForm.control} name="adminName" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><UserSquare2 className="mr-2 h-4 w-4 text-muted-foreground" />Admin Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} disabled={isSubmittingCreate} className="focus-visible:ring-accent" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={createForm.control} name="adminId" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Fingerprint className="mr-2 h-4 w-4 text-muted-foreground" />Admin ID</FormLabel><FormControl><Input placeholder="e.g., mintfire_admin01" {...field} disabled={isSubmittingCreate} className="focus-visible:ring-accent" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={createForm.control} name="email" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Email</FormLabel><FormControl><Input type="email" placeholder="admin@example.com" {...field} disabled={isSubmittingCreate} className="focus-visible:ring-accent" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={createForm.control} name="password" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Password</FormLabel><FormControl><div className="relative"><Input type={showCreatePassword ? "text" : "password"} placeholder="••••••••" {...field} disabled={isSubmittingCreate} className="focus-visible:ring-accent pr-10" /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary" onClick={() => setShowCreatePassword(!showCreatePassword)} tabIndex={-1}>{showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}<span className="sr-only">Toggle password visibility</span></Button></div></FormControl><FormMessage /></FormItem>)} />
                  <PasswordStrengthMeter password={passwordValue} />
                  <FormField control={createForm.control} name="confirmPassword" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Confirm Password</FormLabel><FormControl><div className="relative"><Input type={showCreateConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} disabled={isSubmittingCreate} className="focus-visible:ring-accent pr-10" /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary" onClick={() => setShowCreateConfirmPassword(!showCreateConfirmPassword)} tabIndex={-1}>{showCreateConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}<span className="sr-only">Toggle password visibility</span></Button></div></FormControl><FormMessage /></FormItem>)} />
                  {serverError && (<p className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md flex items-center justify-center"><AlertTriangle className="h-4 w-4 mr-2" />{serverError}</p>)}
                </CardContent>
                <CardFooter className="flex flex-col gap-4 pt-4">
                  <Button type="submit" className="w-full" variant="default" disabled={isSubmittingCreate}>{isSubmittingCreate ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Account'}</Button>
                </CardFooter>
              </form>
            </Form>
          </>
        )}

        {/* PIN Entry View */}
        {viewMode === 'pin_entry' && (
          <>
            <CardHeader className="text-center">
              <Shield className="mx-auto h-12 w-12 text-primary glowing-icon-primary mb-4" />
              <CardTitle className="font-headline text-3xl">Enter 2FA PIN</CardTitle>
              <CardDescription>Please enter your 6-digit security PIN to proceed.</CardDescription>
            </CardHeader>
            <Form {...pinForm}>
              <form onSubmit={pinForm.handleSubmit(handlePinSubmit)}>
                <CardContent className="space-y-6">
                  <FormField control={pinForm.control} name="pin" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />PIN</FormLabel><FormControl><div className="relative"><Input type={showPin ? "text" : "password"} inputMode="numeric" pattern="[0-9]*" maxLength={8} placeholder="••••••" {...field} disabled={isSubmittingPin} className="focus-visible:ring-accent pr-10 text-center tracking-[0.3em]" /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary" onClick={() => setShowPin(!showPin)} tabIndex={-1}>{showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}<span className="sr-only">Toggle PIN visibility</span></Button></div></FormControl><FormMessage /></FormItem>)} />
                  {serverError && (<p className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md flex items-center justify-center"><AlertTriangle className="h-4 w-4 mr-2" />{serverError}</p>)}
                  <p className="text-xs text-muted-foreground text-center">Attempts remaining: {MAX_PIN_ATTEMPTS - pinAttempts}</p>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" variant="default" disabled={isSubmittingPin}>{isSubmittingPin ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : 'Verify PIN'}</Button>
                </CardFooter>
              </form>
            </Form>
          </>
        )}
        
        {/* PIN Locked - Super Action View */}
        {viewMode === 'pin_locked_super_action' && (
            <>
            <CardHeader className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <CardTitle className="font-headline text-3xl">PIN Entry Locked</CardTitle>
                <CardDescription>Too many incorrect PIN attempts. Enter Super Action code to bypass 2FA.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="superActionInput" className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Super Action Code</Label>
                    <Input 
                        id="superActionInput"
                        type="text" 
                        placeholder="Enter Super Action hash" 
                        value={superActionInput}
                        onChange={(e) => setSuperActionInput(e.target.value)}
                        disabled={isSubmittingSuperAction} 
                        className="focus-visible:ring-accent"
                    />
                </div>
                {serverError && (<p className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md flex items-center justify-center"><AlertTriangle className="h-4 w-4 mr-2" />{serverError}</p>)}
            </CardContent>
            <CardFooter>
                <Button onClick={handleSuperActionSubmit} className="w-full" variant="destructive" disabled={isSubmittingSuperAction || !superActionInput.trim()}>
                    {isSubmittingSuperAction ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Disable 2FA with Super Action'}
                </Button>
            </CardFooter>
            </>
        )}

        {/* Login Form View */}
        {viewMode === 'login_form' && (
          <>
            <CardHeader className="text-center">
              <LogIn className="mx-auto h-12 w-12 text-primary glowing-icon-primary mb-4" />
              <CardTitle className="font-headline text-3xl">Admin Login</CardTitle>
              <CardDescription>Enter your credentials to access the admin panel.</CardDescription>
            </CardHeader>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)}>
                <CardContent className="space-y-6">
                  <FormField control={loginForm.control} name="adminName" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><UserSquare2 className="mr-2 h-4 w-4 text-muted-foreground" />Admin Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} disabled={isSubmittingLogin} className="focus-visible:ring-accent" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={loginForm.control} name="adminId" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Fingerprint className="mr-2 h-4 w-4 text-muted-foreground" />Admin ID</FormLabel><FormControl><Input placeholder="e.g., mintfire_admin01" {...field} disabled={isSubmittingLogin} className="focus-visible:ring-accent" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={loginForm.control} name="email" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Email</FormLabel><FormControl><Input type="email" placeholder="admin@example.com" {...field} disabled={isSubmittingLogin} className="focus-visible:ring-accent" /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={loginForm.control} name="password" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Password</FormLabel><FormControl><div className="relative"><Input type={showLoginPassword ? "text" : "password"} placeholder="••••••••" {...field} disabled={isSubmittingLogin} className="focus-visible:ring-accent pr-10" /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary" onClick={() => setShowLoginPassword(!showLoginPassword)} tabIndex={-1}>{showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}<span className="sr-only">Toggle password visibility</span></Button></div></FormControl><FormMessage /></FormItem>)} />
                  {serverError && (<p className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md flex items-center justify-center"><AlertTriangle className="h-4 w-4 mr-2" />{serverError}</p>)}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" variant="default" disabled={isSubmittingLogin}>{isSubmittingLogin ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...</> : 'Login'}</Button>
                </CardFooter>
              </form>
            </Form>
          </>
        )}
      </Card>
    </div>
  );
}

