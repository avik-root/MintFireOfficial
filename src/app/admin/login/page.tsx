import React, { Suspense } from 'react';
import AdminLoginForm from './_components/AdminLoginForm';
import { Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Login Page...</p>
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}
