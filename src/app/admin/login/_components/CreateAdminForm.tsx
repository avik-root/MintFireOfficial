
"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Mail, UserPlus, AlertTriangle, Loader2, UserSquare2, Fingerprint, Eye, EyeOff } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { CreateAdminInput } from '@/lib/schemas/admin-schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';

interface CreateAdminFormProps {
  form: UseFormReturn<CreateAdminInput>;
  onSubmit: (data: CreateAdminInput) => Promise<void>;
  isSubmitting: boolean;
  serverError: string | null;
  passwordValue: string | undefined;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  onSwitchToLogin: () => void;
}

export default function CreateAdminFormComponent({
  form,
  onSubmit,
  isSubmitting,
  serverError,
  passwordValue,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  onSwitchToLogin,
}: CreateAdminFormProps) {
  return (
    <Card className="w-full max-w-md shadow-2xl border-primary/30 layered-card">
      <CardHeader className="text-center">
        <UserPlus className="mx-auto h-12 w-12 text-primary glowing-icon-primary mb-4" />
        <CardTitle className="font-headline text-3xl">Create Admin Account</CardTitle>
        <CardDescription>Setup the first administrator account for MintFire.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="adminName" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><UserSquare2 className="mr-2 h-4 w-4 text-muted-foreground" />Admin Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} disabled={isSubmitting} className="focus-visible:ring-accent" /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="adminId" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Fingerprint className="mr-2 h-4 w-4 text-muted-foreground" />Admin ID</FormLabel><FormControl><Input placeholder="e.g., mintfire_admin01" {...field} disabled={isSubmitting} className="focus-visible:ring-accent" /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Email</FormLabel><FormControl><Input type="email" placeholder="admin@example.com" {...field} disabled={isSubmitting} className="focus-visible:ring-accent" /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Password</FormLabel><FormControl><div className="relative"><Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} disabled={isSubmitting} className="focus-visible:ring-accent pr-10" /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}<span className="sr-only">Toggle password visibility</span></Button></div></FormControl><FormMessage /></FormItem>)} />
            <PasswordStrengthMeter password={passwordValue} />
            <FormField control={form.control} name="confirmPassword" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Confirm Password</FormLabel><FormControl><div className="relative"><Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} disabled={isSubmitting} className="focus-visible:ring-accent pr-10" /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}<span className="sr-only">Toggle password visibility</span></Button></div></FormControl><FormMessage /></FormItem>)} />
            {serverError && (<p className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md flex items-center justify-center"><AlertTriangle className="h-4 w-4 mr-2" />{serverError}</p>)}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-4">
            <Button type="submit" className="w-full" variant="default" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Account'}</Button>
            <Button variant="link" onClick={onSwitchToLogin} className="text-xs">Already have an account? Login</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
CreateAdminFormComponent.displayName = "CreateAdminFormComponent";
