
"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, AlertTriangle, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface SuperActionFormProps {
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  serverError: string | null;
  superActionInput: string;
  setSuperActionInput: (value: string) => void;
}

export default function SuperActionFormComponent({
  onSubmit,
  isSubmitting,
  serverError,
  superActionInput,
  setSuperActionInput,
}: SuperActionFormProps) {
  return (
    <Card className="w-full max-w-md shadow-2xl border-destructive/30 layered-card">
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
            disabled={isSubmitting}
            className="focus-visible:ring-accent"
          />
        </div>
        {serverError && (<p className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md flex items-center justify-center"><AlertTriangle className="h-4 w-4 mr-2" />{serverError}</p>)}
      </CardContent>
      <CardFooter>
        <Button onClick={onSubmit} className="w-full" variant="destructive" disabled={isSubmitting || !superActionInput.trim()}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Disable 2FA with Super Action'}
        </Button>
      </CardFooter>
    </Card>
  );
}
SuperActionFormComponent.displayName = "SuperActionFormComponent";
