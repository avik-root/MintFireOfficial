
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Keep for router.refresh if needed
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

import CreateAdminFormComponent from './_components/CreateAdminForm';
import ActualLoginForm from './_components/AdminLoginForm';
import PinEntryFormComponent from './_components/PinEntryForm';
import SuperActionFormComponent from './_components/SuperActionForm';

type ViewMode = 'loading' | 'create' | 'pin_entry' | 'pin_locked_super_action' | 'login_form';
const AUTH_COOKIE_NAME = 'admin-auth-token'; // Define for client-side check

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

  const passwordForCreateStrengthMeter = useWatch({ control: createForm.control, name: 'password' });

  useEffect(() => {
    // This effect determines the initial state of the login page for an unauthenticated user,
    // or attempts to redirect if a cookie is found client-side (as a fallback to middleware).
    console.log("AdminLoginPage: useEffect triggered. Current viewMode:", viewMode);

    const cookieExistsClientSide = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${AUTH_COOKIE_NAME}=`));

    if (cookieExistsClientSide) {
      console.log("AdminLoginPage: Client-side auth cookie detected. Attempting redirect to dashboard.");
      // If the client has an auth cookie, it means they are likely logged in.
      // The middleware should ideally handle redirecting them from /admin/login to /admin/dashboard.
      // This client-side redirect is a fallback.
      window.location.href = '/admin/dashboard';
      return; // Stop further processing in this effect if redirecting
    }

    // If no client-side cookie, proceed to check server for admin account existence
    // This is to determine if we show "create admin" or "login" form.
    const performInitialServerCheck = async () => {
      console.log("AdminLoginPage: No client-side cookie. Performing initial server check for admin existence.");
      setViewMode('loading');
      setServerError(null);
      try {
        const { exists, adminId, error } = await checkAdminExists();
        if (error) {
          console.error("AdminLoginPage: Error from checkAdminExists:", error);
          setServerError(error);
          setViewMode('login_form'); // Default to login form on error
          toast({ variant: "destructive", title: "System Error", description: error });
          return;
        }
        if (exists) {
          console.log("AdminLoginPage: Admin account exists. Setting viewMode to login_form.");
          setCurrentAdminId(adminId || null);
          setViewMode('login_form');
        } else {
          console.log("AdminLoginPage: No admin account exists. Setting viewMode to create.");
          setViewMode('create');
        }
      } catch (e: any) {
        console.error("AdminLoginPage: Catch block error during checkAdminExists:", e);
        setServerError(e.message || "Failed to check admin status.");
        setViewMode('login_form'); // Default to login form on error
        toast({ variant: "destructive", title: "System Error", description: e.message || "Failed to check admin status." });
      }
    };

    // Only run the server check if we are not already in a loading state from a previous run
    // and no cookie was found client-side.
    if (viewMode === 'loading' && !cookieExistsClientSide) {
       performInitialServerCheck();
    } else if (!cookieExistsClientSide && viewMode !== 'create' && viewMode !== 'login_form') {
      // If somehow viewMode is not loading, create, or login_form, and no cookie, re-evaluate.
      performInitialServerCheck();
    }


  // Effect should run once on mount or if toast changes (which is stable).
  // viewMode is intentionally excluded from deps here to prevent loops if performInitialServerCheck itself changes viewMode.
  // The logic inside handles the 'loading' state to prevent re-runs.
  }, [toast]); 


  const handleCreateSubmit = async (data: CreateAdminInput) => {
    setServerError(null);
    const result = await createAdminAccount(data);

    if (result && typeof result.success === 'boolean') {
        if (result.success) {
            toast({ title: "Account Created", description: result.message });
            // After creating, re-check status which should set viewMode to 'login_form'
            const { exists, adminId } = await checkAdminExists();
            if (exists) {
                setCurrentAdminId(adminId || null);
                setViewMode('login_form');
            }
            createForm.reset();
        } else {
            setServerError(result.message);
            if (result.errors) {
                result.errors.forEach((err: any) => {
                    const fieldName = Array.isArray(err.path) ? err.path.join(".") : err.path;
                    createForm.setError(fieldName as keyof CreateAdminInput, { message: err.message });
                });
                toast({ variant: "destructive", title: "Creation Failed", description: "Please check the form for errors." });
            } else {
                toast({ variant: "destructive", title: "Creation Failed", description: result.message });
            }
        }
    } else {
        setServerError("Create admin action did not return a valid response.");
        toast({ variant: "destructive", title: "Creation Error", description: "Received an unexpected response from the server." });
    }
  };

  const handleLoginSubmit = async (data: LoginAdminInput) => {
    setServerError(null);
    loginForm.clearErrors();
    console.log("Client: handleLoginSubmit called with data:", { ...data, password: "[REDACTED]" });
    
    try {
      const result = await loginAdmin(data);
      console.log("Client: loginAdmin raw result:", result);

      if (result && typeof result.success !== 'undefined') {
        if (result.success) {
          if (result.requiresPin && result.adminId) {
            setCurrentAdminId(result.adminId);
            setViewMode('pin_entry');
            setPinAttempts(0); // Reset PIN attempts
            toast({ title: "2FA Required", description: result.message });
          } else {
            toast({ title: "Login Successful", description: result.message });
            window.location.href = '/admin/dashboard'; 
          }
        } else {
          setServerError(result.message);
          toast({ variant: "destructive", title: "Login Failed", description: result.message });
        }
      } else {
        console.error("Client: loginAdmin result is invalid or missing 'success' property:", result);
        setServerError(result?.message || "Login action did not return a valid success property.");
        toast({ variant: "destructive", title: "Login Error", description: result?.message || "Received an unexpected response from the server." });
      }
    } catch (error: any) {
      console.error("Client: Error during loginAdmin call:", error);
      setServerError(error.message || "An unexpected error occurred during login.");
      toast({ variant: "destructive", title: "Login Error", description: error.message || "An unexpected error occurred." });
    }
  };

  const handlePinSubmit = async (data: VerifyPinInput) => {
    if (!currentAdminId) {
      toast({ variant: "destructive", title: "Error", description: "Admin ID not found for PIN verification." });
      setViewMode('login_form'); 
      return;
    }
    setServerError(null);
    pinForm.clearErrors();
    console.log("Client: handlePinSubmit called for adminId:", currentAdminId);
    
    try {
      const result = await verifyPinForLogin(currentAdminId, data.pin);
      console.log("Client: verifyPinForLogin raw result:", result);

      if (result && typeof result.success !== 'undefined') {
        if (result.success) {
          toast({ title: "PIN Verified", description: result.message || "Login successful! Redirecting..."});
          window.location.href = '/admin/dashboard';
        } else {
          const newAttempts = pinAttempts + 1;
          setPinAttempts(newAttempts);
          setServerError(result.message || "Incorrect PIN.");
          toast({ variant: "destructive", title: "PIN Invalid", description: result.message || "Incorrect PIN." });
          if (newAttempts >= MAX_PIN_ATTEMPTS) {
            setViewMode('pin_locked_super_action');
            setServerError(`Maximum PIN attempts reached. Use Super Action to bypass.`);
            toast({ variant: "destructive", title: "PIN Locked", description: "Maximum PIN attempts reached. Use Super Action to bypass 2FA." });
          }
        }
      } else {
        console.error("Client: verifyPinForLogin result is invalid or missing 'success' property:", result);
        setServerError(result?.message || "PIN verification action did not return a valid success property.");
        toast({ variant: "destructive", title: "PIN Error", description: result?.message || "Received an unexpected response from the server during PIN verification." });
      }
    } catch (error: any) {
      console.error("Client: Error during verifyPinForLogin call:", error);
      setServerError(error.message || "An unexpected error occurred during PIN verification.");
      toast({ variant: "destructive", title: "PIN Error", description: error.message || "An unexpected error occurred." });
    } finally {
      pinForm.reset();
    }
  };

  const handleSuperActionSubmit = async () => {
    if (!currentAdminId) {
        toast({ variant: "destructive", title: "Error", description: "Admin ID not found for Super Action." });
        setViewMode('login_form'); 
        return;
    }
    setIsSubmittingSuperAction(true);
    setServerError(null);
    console.log("Client: handleSuperActionSubmit called for adminId:", currentAdminId);
    try {
      const result = await disable2FABySuperAction(currentAdminId, superActionInput);
      console.log("Client: disable2FABySuperAction raw result:", result);
      if (result && typeof result.success !== 'undefined') {
          if (result.success) {
              toast({ title: "2FA Disabled", description: result.message });
              setViewMode('login_form'); 
              setPinAttempts(0);
              setSuperActionInput('');
              // loginForm.reset(); // Reset login form if needed
              setCurrentAdminId(null); // Clear adminId as 2FA context is gone
          } else {
              setServerError(result.message);
              toast({ variant: "destructive", title: "Super Action Failed", description: result.message });
          }
      } else {
        console.error("Client: disable2FABySuperAction result is invalid or missing 'success' property:", result);
        setServerError(result?.message || "Super Action did not return a valid success property.");
        toast({ variant: "destructive", title: "Super Action Error", description: result?.message || "Received an unexpected response." });
      }
    } catch (error: any) {
      console.error("Client: Error during disable2FABySuperAction call:", error);
      setServerError(error.message || "An unexpected error occurred with Super Action.");
      toast({ variant: "destructive", title: "Super Action Error", description: error.message || "An unexpected error occurred." });
    } finally {
      setIsSubmittingSuperAction(false);
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
      {viewMode === 'create' && (
        <CreateAdminFormComponent
          form={createForm}
          onSubmit={handleCreateSubmit}
          isSubmitting={isSubmittingCreate}
          serverError={serverError}
          passwordValue={passwordForCreateStrengthMeter}
          showPassword={showCreatePassword}
          setShowPassword={setShowCreatePassword}
          showConfirmPassword={showCreateConfirmPassword}
          setShowConfirmPassword={setShowCreateConfirmPassword}
          onSwitchToLogin={() => { setViewMode('login_form'); setServerError(null); }}
        />
      )}
      {viewMode === 'login_form' && (
        <ActualLoginForm
          form={loginForm}
          onSubmit={handleLoginSubmit}
          isSubmitting={isSubmittingLogin}
          serverError={serverError}
          showPassword={showLoginPassword}
          setShowPassword={setShowLoginPassword}
          onSwitchToCreate={() => { setViewMode('create'); setServerError(null); }}
        />
      )}
      {viewMode === 'pin_entry' && (
        <PinEntryFormComponent
          form={pinForm}
          onSubmit={handlePinSubmit}
          isSubmitting={isSubmittingPin}
          serverError={serverError}
          showPin={showPin}
          setShowPin={setShowPin}
          pinAttempts={pinAttempts}
          MAX_PIN_ATTEMPTS={MAX_PIN_ATTEMPTS}
        />
      )}
      {viewMode === 'pin_locked_super_action' && (
        <SuperActionFormComponent
          onSubmit={handleSuperActionSubmit}
          isSubmitting={isSubmittingSuperAction}
          serverError={serverError}
          superActionInput={superActionInput}
          setSuperActionInput={setSuperActionInput}
        />
      )}
    </div>
  );
}
