
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Redirecting to dashboard...");

  useEffect(() => {
    // Since authentication is removed, directly navigate to the dashboard.
    // Using window.location.href for a full redirect to ensure middleware (if any other rules exist)
    // and server state are freshly evaluated.
    window.location.href = '/admin/dashboard';
    // As a fallback message if redirect takes time or fails for some reason.
    setMessage("If you are not redirected, please click here: /admin/dashboard");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-background text-foreground">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg text-muted-foreground">{message}</p>
      <a href="/admin/dashboard" className="mt-2 text-primary hover:underline">
        Go to Dashboard
      </a>
    </div>
  );
}
