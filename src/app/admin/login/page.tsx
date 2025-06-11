
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { useToast } from '@/hooks/use-toast';

// Import the new form components
import CreateAdminFormComponent from './_components/CreateAdminForm';
import ActualLoginForm from './_components/AdminLoginForm'; // This will be the repurposed component for standard login
import PinEntryFormComponent from './_components/PinEntryForm';
import SuperActionFormComponent from './_components/SuperActionForm';


type ViewMode = 'loading' | 'create' | 'pin_entry' | 'pin_locked_super_action' | 'login_form';

export default function AdminLoginPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('loading');
  const [serverError, setServerError] = useState<string | null>(null);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showCreateConfirmPassword, setShowCreateConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null); // Used for PIN/SuperAction
  const [pinAttempts, setPinAttempts] = useState(0);
  const MAX_PIN_ATTEMPTS = 5;

  const router = useRouter();
  const { toast } = useToast();

  const checkInitialStatus = useCallback(async () => {
    setServerError(null);
    try {
      const { exists, adminId, is2FAEnabled, error } = await checkAdminExists();
      if (error) {
        setServerError(error);
        setViewMode('login_form'); // Default to login if check fails
        toast({ variant: "destructive", title: "System Error", description: error });
        return;
      }
      if (exists) {
        setCurrentAdminId(adminId || null); // Store adminId if exists
        setViewMode('login_form');
      } else {
        setViewMode('create');
      }
    } catch (e : any) {
      setServerError(e.message || "Failed to check admin status.");
      setViewMode('login_form'); // Default to login on unexpected error
      toast({ variant: "destructive", title: "System Error", description: e.message || "Failed to check admin status." });
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

  const passwordForCreateStrengthMeter = useWatch({ control: createForm.control, name: 'password' });

  const handleCreateSubmit = async (data: CreateAdminInput) => {
    setServerError(null);
    console.log("Client: Calling createAdminAccount with data:", { ...data, password: "[REDACTED]", confirmPassword: "[REDACTED]" });
    const result = await createAdminAccount(data);
    console.log("Client: Received from createAdminAccount:", result);

    if (result && typeof result.success === 'boolean') {
        if (result.success) {
            toast({ title: "Account Created", description: result.message });
            await checkInitialStatus(); // Re-check status, should transition to login_form
            createForm.reset();
        } else {
            setServerError(result.message);
            if (result.errors) {
                result.errors.forEach((err: any) => {
                    const fieldName = Array.isArray(err.path) ? err.path.join(".") : err.path;
                    // @ts-ignore
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
    console.log("Client: Calling loginAdmin with data:", {...data, password: "[REDACTED]"});
    
    try {
      const result = await loginAdmin(data);
      console.log("Client: Received from loginAdmin:", result);

      if (result && typeof result.success === 'boolean') {
        if (result.success) {
          if (result.requiresPin && result.adminId) {
            setCurrentAdminId(result.adminId); // Store adminId for PIN entry
            setViewMode('pin_entry');
            setPinAttempts(0); // Reset PIN attempts
            toast({ title: "2FA Required", description: result.message });
          } else {
            toast({ title: "Login Successful", description: result.message });
            router.refresh();
            router.push('/admin/dashboard');
          }
        } else {
          setServerError(result.message);
          toast({ variant: "destructive", title: "Login Failed", description: result.message });
        }
      } else {
        console.error("Client: loginAdmin returned unexpected result:", result);
        setServerError("Login action did not return a valid response. Please check console for details.");
        toast({ variant: "destructive", title: "Login Error", description: "Received an unexpected response from the server." });
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
      setViewMode('login_form'); // Fallback to login if adminId is missing
      return;
    }
    setServerError(null);
    pinForm.clearErrors();
    console.log("Client: Calling verifyPinForLogin for adminId:", currentAdminId, "with PIN (masked)");
    
    try {
      const result = await verifyPinForLogin(currentAdminId, data.pin);
      console.log("Client: Received from verifyPinForLogin:", result);

      if (result && typeof result.success === 'boolean') {
        if (result.success) {
          toast({ title: "PIN Verified", description: result.message || "Login successful! Redirecting..."});
          router.refresh();
          router.push('/admin/dashboard');
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
        console.error("Client: verifyPinForLogin returned unexpected result:", result);
        setServerError("PIN verification action did not return a valid response. Please check console.");
        toast({ variant: "destructive", title: "PIN Error", description: "Received an unexpected response from the server during PIN verification." });
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
        setViewMode('login_form'); // Fallback
        return;
    }
    setIsSubmittingSuperAction(true);
    setServerError(null);
    console.log("Client: Calling disable2FABySuperAction for adminId:", currentAdminId);
    try {
      const result = await disable2FABySuperAction(currentAdminId, superActionInput);
      console.log("Client: Received from disable2FABySuperAction:", result);
      if (result && typeof result.success === 'boolean') {
          if (result.success) {
              toast({ title: "2FA Disabled", description: result.message });
              setViewMode('login_form'); // Go back to login form
              setPinAttempts(0);
              setSuperActionInput('');
              loginForm.reset(); // Reset login form as user will now login normally
              setCurrentAdminId(null); // Clear stored adminId
          } else {
              setServerError(result.message);
              toast({ variant: "destructive", title: "Super Action Failed", description: result.message });
          }
      } else {
        setServerError("Super Action did not return a valid response.");
        toast({ variant: "destructive", title: "Super Action Error", description: "Received an unexpected response." });
      }
    } catch (error: any) {
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
