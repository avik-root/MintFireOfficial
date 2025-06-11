
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkAdminExists, createAdminAccount, loginAdmin, verifyPinForLogin, disable2FABySuperAction } from '@/actions/admin-actions';
import { CreateAdminSchema, LoginAdminSchema, VerifyPinSchema, type CreateAdminInput, type LoginAdminInput, type VerifyPinInput } from '@/lib/schemas/admin-schemas';
import CreateAdminFormComponent from './_components/CreateAdminForm';
import ActualLoginForm from './_components/AdminLoginForm';
import PinEntryFormComponent from './_components/PinEntryForm';
import SuperActionFormComponent from './_components/SuperActionForm';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const MAX_PIN_ATTEMPTS = 5;
const AUTH_COOKIE_NAME = 'admin-auth-token'; // Defined here for client-side check removal clarity

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'loading' | 'createAdmin' | 'login' | 'pinEntry' | 'superAction'>('loading');
  const [adminIdForPin, setAdminIdForPin] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [superActionInput, setSuperActionInput] = useState('');

  const createAdminForm = useForm<CreateAdminInput>({ resolver: zodResolver(CreateAdminSchema), defaultValues: { adminName: "", adminId: "", email: "", password: "", confirmPassword: "" } });
  const loginForm = useForm<LoginAdminInput>({ resolver: zodResolver(LoginAdminSchema), defaultValues: { adminName: "", adminId: "", email: "", password: "" } });
  const pinForm = useForm<VerifyPinInput>({ resolver: zodResolver(VerifyPinSchema), defaultValues: { pin: "" } });
  
  const passwordValue = createAdminForm.watch('password');

  const initializeView = useCallback(async () => {
    console.log("AdminLoginPage: Initializing view...");
    // No need to check client-side cookie here, middleware handles authenticated user redirect
    // If middleware didn't redirect, user is unauthenticated or accessing login page directly.
    const { exists, adminId, is2FAEnabled, error } = await checkAdminExists();
    if (error) {
      setServerError("Could not verify admin status. " + error);
      setViewMode('login'); // Default to login on error
      return;
    }
    if (exists) {
      console.log("AdminLoginPage: Admin exists. Admin ID:", adminId, "2FA Enabled:", is2FAEnabled);
      setAdminIdForPin(adminId || null); // Store adminId if needed for 2FA
      setViewMode('login');
    } else {
      console.log("AdminLoginPage: No admin exists, showing create admin form.");
      setViewMode('createAdmin');
    }
  }, []);


  useEffect(() => {
    initializeView();
  }, [initializeView]);

  const handleCreateAdminSubmit = async (data: CreateAdminInput) => {
    createAdminForm.clearErrors();
    setServerError(null);
    const result = await createAdminAccount(data);
    if (result.success) {
      toast({ title: "Admin Account Created", description: "You can now log in with your new credentials." });
      setViewMode('login');
      loginForm.reset(); 
    } else {
      if (result.errors) {
        result.errors.forEach((err) => {
          if (err.path && err.path.length > 0) {
            createAdminForm.setError(err.path[0] as keyof CreateAdminInput, { message: err.message });
          }
        });
      }
      setServerError(result.message);
    }
  };

  const handleLoginSubmit = async (data: LoginAdminInput) => {
    loginForm.clearErrors();
    setServerError(null);
    const result = await loginAdmin(data);
    
    if (result && result.success) {
      if (result.requiresPin && result.adminId) {
        setAdminIdForPin(result.adminId);
        setPinAttempts(0); 
        setViewMode('pinEntry');
        pinForm.reset();
      } else {
        toast({ title: "Login Successful", description: "Redirecting to dashboard..." });
        window.location.href = '/admin/dashboard'; 
      }
    } else if (result) {
      setServerError(result.message);
    } else {
      setServerError("Login failed. Unexpected response from server.");
    }
  };

  const handlePinSubmit = async (data: VerifyPinInput) => {
    if (!adminIdForPin) {
      setServerError("Admin ID not found for PIN verification.");
      return;
    }
    pinForm.clearErrors();
    setServerError(null);
    const result = await verifyPinForLogin(adminIdForPin, data.pin);

    if (result && result.success) {
      toast({ title: "PIN Verified", description: "Redirecting to login page as requested..." });
      window.location.href = '/admin/login'; // Changed redirect to /admin/login
    } else {
      setPinAttempts(prev => prev + 1);
      if (pinAttempts + 1 >= MAX_PIN_ATTEMPTS) {
        setViewMode('superAction');
        setServerError("Too many incorrect PIN attempts. 2FA locked.");
      } else if (result) {
        setServerError(result.message + ` Attempts remaining: ${MAX_PIN_ATTEMPTS - (pinAttempts + 1)}`);
      } else {
        setServerError("PIN verification failed. Unexpected response from server.");
      }
      pinForm.reset();
    }
  };

  const handleSuperActionSubmit = async () => {
    if (!adminIdForPin) {
        setServerError("Admin ID not available for Super Action.");
        return;
    }
    setServerError(null);
    const result = await disable2FABySuperAction(adminIdForPin, superActionInput);
    if (result.success) {
        toast({ title: "2FA Disabled via Super Action", description: "You can now log in or reset 2FA." });
        setViewMode('login'); 
        setAdminIdForPin(null);
        setSuperActionInput('');
        loginForm.reset(); 
    } else {
        setServerError(result.message || "Super Action failed.");
    }
  };

  if (viewMode === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Admin Access...</p>
      </div>
    );
  }
  
  if (viewMode === 'superAction') {
    return (
      <div className="flex items-center justify-center min-h-screen py-12 bg-background text-foreground">
        <SuperActionFormComponent
          onSubmit={handleSuperActionSubmit}
          isSubmitting={createAdminForm.formState.isSubmitting} 
          serverError={serverError}
          superActionInput={superActionInput}
          setSuperActionInput={setSuperActionInput}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen py-12 bg-background text-foreground">
      {viewMode === 'createAdmin' && (
        <CreateAdminFormComponent
          form={createAdminForm}
          onSubmit={handleCreateAdminSubmit}
          isSubmitting={createAdminForm.formState.isSubmitting}
          serverError={serverError}
          passwordValue={passwordValue}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          onSwitchToLogin={() => { setViewMode('login'); setServerError(null); loginForm.reset(); }}
        />
      )}
      {viewMode === 'login' && (
        <ActualLoginForm
          form={loginForm}
          onSubmit={handleLoginSubmit}
          isSubmitting={loginForm.formState.isSubmitting}
          serverError={serverError}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          onSwitchToCreate={() => { setViewMode('createAdmin'); setServerError(null); createAdminForm.reset(); }}
        />
      )}
      {viewMode === 'pinEntry' && (
        <PinEntryFormComponent
          form={pinForm}
          onSubmit={handlePinSubmit}
          isSubmitting={pinForm.formState.isSubmitting}
          serverError={serverError}
          showPin={showPin}
          setShowPin={setShowPin}
          pinAttempts={pinAttempts}
          MAX_PIN_ATTEMPTS={MAX_PIN_ATTEMPTS}
        />
      )}
    </div>
  );
}
