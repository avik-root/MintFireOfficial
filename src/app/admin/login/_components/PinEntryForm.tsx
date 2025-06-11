
"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Shield, AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { VerifyPinInput } from '@/lib/schemas/admin-schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface PinEntryFormProps {
  form: UseFormReturn<VerifyPinInput>;
  onSubmit: (data: VerifyPinInput) => Promise<void>;
  isSubmitting: boolean;
  serverError: string | null;
  showPin: boolean;
  setShowPin: (show: boolean) => void;
  pinAttempts: number;
  MAX_PIN_ATTEMPTS: number;
}

export default function PinEntryFormComponent({
  form,
  onSubmit,
  isSubmitting,
  serverError,
  showPin,
  setShowPin,
  pinAttempts,
  MAX_PIN_ATTEMPTS,
}: PinEntryFormProps) {
  return (
    <Card className="w-full max-w-md shadow-2xl border-primary/30 layered-card">
      <CardHeader className="text-center">
        <Shield className="mx-auto h-12 w-12 text-primary glowing-icon-primary mb-4" />
        <CardTitle className="font-headline text-3xl">Enter 2FA PIN</CardTitle>
        <CardDescription>Please enter your 6-digit security PIN to proceed.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="pin" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />PIN</FormLabel><FormControl><div className="relative"><Input type={showPin ? "text" : "password"} inputMode="numeric" pattern="[0-9]*" maxLength={8} placeholder="••••••" {...field} disabled={isSubmitting} className="focus-visible:ring-accent pr-10 text-center tracking-[0.3em]" /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary" onClick={() => setShowPin(!showPin)} tabIndex={-1}>{showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}<span className="sr-only">Toggle PIN visibility</span></Button></div></FormControl><FormMessage /></FormItem>)} />
            {serverError && (<p className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md flex items-center justify-center"><AlertTriangle className="h-4 w-4 mr-2" />{serverError}</p>)}
            <p className="text-xs text-muted-foreground text-center">Attempts remaining: {MAX_PIN_ATTEMPTS - pinAttempts}</p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" variant="default" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : 'Verify PIN'}</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
PinEntryFormComponent.displayName = "PinEntryFormComponent";
