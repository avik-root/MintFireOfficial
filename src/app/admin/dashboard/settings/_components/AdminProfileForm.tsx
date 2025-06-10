
"use client";

import React, { useState } from 'react';
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, UserSquare2, Fingerprint, Mail, Lock, Eye, EyeOff, ShieldCheck, ShieldOff, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';
import { UpdateAdminProfileSchema, type UpdateAdminProfileInput, type AdminProfile, Enable2FASchema, type Enable2FAInput, Change2FAPinSchema, type Change2FAPinInput, Disable2FASchema, type Disable2FAInput } from '@/lib/schemas/admin-schemas';
import { updateAdminProfile, enable2FA, change2FAPin, disable2FA } from '@/actions/admin-actions';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface AdminProfileFormProps {
  admin: AdminProfile;
  onProfileUpdate: () => Promise<void>; // Callback to refresh admin data
}

export default function AdminProfileForm({ admin: initialAdmin, onProfileUpdate }: AdminProfileFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // State for current admin data, to be updated after actions
  const [admin, setAdmin] = useState<AdminProfile>(initialAdmin);

  // State for 2FA Modals
  const [isEnable2FAModalOpen, setIsEnable2FAModalOpen] = useState(false);
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);
  const [isDisable2FAModalOpen, setIsDisable2FAModalOpen] = useState(false);

  // State for 2FA form submissions
  const [isSubmittingEnable2FA, setIsSubmittingEnable2FA] = useState(false);
  const [isSubmittingChangePin, setIsSubmittingChangePin] = useState(false);
  const [isSubmittingDisable2FA, setIsSubmittingDisable2FA] = useState(false);
  
  // State for showing PINs in 2FA forms
  const [showEnableNewPin, setShowEnableNewPin] = useState(false);
  const [showEnableConfirmPin, setShowEnableConfirmPin] = useState(false);
  const [showChangeCurrentPin, setShowChangeCurrentPin] = useState(false);
  const [showChangeNewPin, setShowChangeNewPin] = useState(false);
  const [showChangeConfirmPin, setShowChangeConfirmPin] = useState(false);
  const [showDisablePinOrPassword, setShowDisablePinOrPassword] = useState(false);


  const profileForm = useForm<UpdateAdminProfileInput>({
    resolver: zodResolver(UpdateAdminProfileSchema),
    defaultValues: {
      adminName: admin.adminName || "",
      adminId: admin.adminId || "",
      email: admin.email || "",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    mode: "onBlur",
  });
  
  const newPasswordValue = useWatch({ control: profileForm.control, name: 'newPassword' });

  const enable2FAForm = useForm<Enable2FAInput>({ resolver: zodResolver(Enable2FASchema), defaultValues: { newPin: '', confirmNewPin: '' } });
  const changePinForm = useForm<Change2FAPinInput>({ resolver: zodResolver(Change2FAPinSchema), defaultValues: { currentPin: '', newPin: '', confirmNewPin: '' } });
  const disable2FAForm = useForm<Disable2FAInput>({ resolver: zodResolver(Disable2FASchema), defaultValues: { currentPinOrPassword: '' } });
  
  const newPinForEnable2FA = useWatch({ control: enable2FAForm.control, name: 'newPin'});
  const newPinForChangePin = useWatch({ control: changePinForm.control, name: 'newPin'});

  const handleProfileSubmit = async (data: UpdateAdminProfileInput) => {
    setIsSubmitting(true);
    const payload: UpdateAdminProfileInput = { ...data };
    if (!data.newPassword && !data.currentPassword && !data.confirmNewPassword) {
      delete payload.currentPassword;
      delete payload.newPassword;
      delete payload.confirmNewPassword;
    }
    const result = await updateAdminProfile(payload);
    setIsSubmitting(false);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      profileForm.reset({ ...payload, currentPassword: "", newPassword: "", confirmNewPassword: "" });
      await onProfileUpdate(); // Refresh parent's admin data
    } else {
      // Error handling... (as before)
      if (result.errors) {
         result.errors.forEach((err) => {
           if (err.path && err.path.length > 0) {
             profileForm.setError(err.path[0] as keyof UpdateAdminProfileInput, { message: err.message });
           }
         });
        toast({ variant: "destructive", title: "Validation Error", description: "Please check the form details." });
      } else {
        toast({ variant: "destructive", title: "Update Failed", description: result.message });
      }
    }
  };

  const handleEnable2FA = async (data: Enable2FAInput) => {
    setIsSubmittingEnable2FA(true);
    const result = await enable2FA(admin.adminId, data);
    setIsSubmittingEnable2FA(false);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      setIsEnable2FAModalOpen(false);
      await onProfileUpdate();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error || "Failed to enable 2FA."});
    }
  };

  const handleChangePin = async (data: Change2FAPinInput) => {
    setIsSubmittingChangePin(true);
    const result = await change2FAPin(admin.adminId, data);
    setIsSubmittingChangePin(false);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      setIsChangePinModalOpen(false);
      await onProfileUpdate();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error || "Failed to change PIN."});
    }
  };

  const handleDisable2FA = async (data: Disable2FAInput) => {
    setIsSubmittingDisable2FA(true);
    const result = await disable2FA(admin.adminId, data);
    setIsSubmittingDisable2FA(false);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      setIsDisable2FAModalOpen(false);
      await onProfileUpdate();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error || "Failed to disable 2FA."});
    }
  };
  
  // Update local admin state when parent refreshes it
  React.useEffect(() => {
    setAdmin(initialAdmin);
    profileForm.reset({
      adminName: initialAdmin.adminName || "",
      adminId: initialAdmin.adminId || "",
      email: initialAdmin.email || "",
      currentPassword: "", newPassword: "", confirmNewPassword: "",
    });
  }, [initialAdmin, profileForm]);


  const renderPinInput = (formInstance: any, fieldName: string, placeholder: string, showState: boolean, setShowState: (val: boolean) => void, isSubmittingState: boolean, label: string) => (
    <FormField
      control={formInstance.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center"><KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input 
                type={showState ? "text" : "password"} 
                inputMode="numeric" 
                pattern="[0-9]*" 
                maxLength={6} 
                placeholder={placeholder}
                {...field} 
                disabled={isSubmittingState} 
                className="focus-visible:ring-accent pr-10" 
              />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary" onClick={() => setShowState(!showState)} tabIndex={-1}>
                {showState ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );


  return (
    <>
      <Form {...profileForm}>
        <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-8">
          <Card className="layered-card">
            <CardHeader><CardTitle className="font-headline text-2xl">Account Information</CardTitle><CardDescription>Update your administrator name, ID, and email address.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={profileForm.control} name="adminName" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><UserSquare2 className="mr-2 h-4 w-4 text-muted-foreground" />Admin Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={profileForm.control} name="adminId" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Fingerprint className="mr-2 h-4 w-4 text-muted-foreground" />Admin ID</FormLabel><FormControl><Input placeholder="e.g., mintfire_admin01" {...field} disabled={isSubmitting || true} /></FormControl><FormDescription>Admin ID cannot be changed.</FormDescription><FormMessage /></FormItem>)} />
              <FormField control={profileForm.control} name="email" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Email</FormLabel><FormControl><Input type="email" placeholder="admin@example.com" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>

          <Card className="layered-card">
            <CardHeader><CardTitle className="font-headline text-2xl">Change Password</CardTitle><CardDescription>Leave these fields blank if you do not want to change your password.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={profileForm.control} name="currentPassword" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Current Password</FormLabel><FormControl><div className="relative"><Input type={showCurrentPassword ? "text" : "password"} placeholder="Enter current password" {...field} disabled={isSubmitting} className="pr-10" /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary" onClick={() => setShowCurrentPassword(!showCurrentPassword)} tabIndex={-1}>{showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div></FormControl><FormMessage /></FormItem>)} />
              <FormField control={profileForm.control} name="newPassword" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />New Password</FormLabel><FormControl><div className="relative"><Input type={showNewPassword ? "text" : "password"} placeholder="Enter new password" {...field} disabled={isSubmitting} className="pr-10" /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary" onClick={() => setShowNewPassword(!showNewPassword)} tabIndex={-1}>{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div></FormControl><FormMessage /></FormItem>)} />
              {(profileForm.getValues("newPassword") || newPasswordValue) && <PasswordStrengthMeter password={newPasswordValue} />}
              <FormField control={profileForm.control} name="confirmNewPassword" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Confirm New Password</FormLabel><FormControl><div className="relative"><Input type={showConfirmNewPassword ? "text" : "password"} placeholder="Confirm new password" {...field} disabled={isSubmitting} className="pr-10" /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} tabIndex={-1}>{showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>
          <Separator />
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto" variant="default">{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving Changes...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}</Button>
        </form>
      </Form>

      <Separator className="my-10" />

      <Card className="layered-card">
        <CardHeader><CardTitle className="font-headline text-2xl">Two-Factor Authentication (2FA)</CardTitle><CardDescription>Enhance your account security with a 6-digit PIN.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md border">
            <p className="text-sm font-medium">Status: <span className={admin.is2FAEnabled ? "text-green-500" : "text-red-500"}>{admin.is2FAEnabled ? "Enabled" : "Disabled"}</span></p>
            {admin.is2FAEnabled ? (<ShieldCheck className="h-6 w-6 text-green-500"/>) : (<ShieldOff className="h-6 w-6 text-red-500"/>) }
          </div>
          
          {!admin.is2FAEnabled && (
            <Dialog open={isEnable2FAModalOpen} onOpenChange={setIsEnable2FAModalOpen}>
              <DialogTrigger asChild><Button variant="outline" className="w-full sm:w-auto"><ShieldCheck className="mr-2"/>Enable 2FA</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Enable Two-Factor Authentication</DialogTitle><DialogDescription>Set up a 6-digit PIN for enhanced security. This PIN will be required after your password when logging in.</DialogDescription></DialogHeader>
                <Form {...enable2FAForm}><form onSubmit={enable2FAForm.handleSubmit(handleEnable2FA)} className="space-y-4 pt-4">
                  {renderPinInput(enable2FAForm, "newPin", "Enter 6-digit PIN", showEnableNewPin, setShowEnableNewPin, isSubmittingEnable2FA, "New PIN")}
                  {newPinForEnable2FA && <PasswordStrengthMeter password={newPinForEnable2FA.replace(/\D/g, '')} />}
                  {renderPinInput(enable2FAForm, "confirmNewPin", "Confirm PIN", showEnableConfirmPin, setShowEnableConfirmPin, isSubmittingEnable2FA, "Confirm New PIN")}
                  <DialogFooter><Button type="submit" disabled={isSubmittingEnable2FA}>{isSubmittingEnable2FA ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enabling...</> : "Enable 2FA"}</Button></DialogFooter>
                </form></Form>
              </DialogContent>
            </Dialog>
          )}

          {admin.is2FAEnabled && (
            <div className="flex flex-col sm:flex-row gap-4">
              <Dialog open={isChangePinModalOpen} onOpenChange={setIsChangePinModalOpen}>
                <DialogTrigger asChild><Button variant="outline" className="flex-1"><KeyRound className="mr-2"/>Change PIN</Button></DialogTrigger>
                <DialogContent><DialogHeader><DialogTitle>Change 2FA PIN</DialogTitle><DialogDescription>Enter your current PIN and set a new 6-digit PIN.</DialogDescription></DialogHeader>
                  <Form {...changePinForm}><form onSubmit={changePinForm.handleSubmit(handleChangePin)} className="space-y-4 pt-4">
                    {renderPinInput(changePinForm, "currentPin", "Current PIN", showChangeCurrentPin, setShowChangeCurrentPin, isSubmittingChangePin, "Current PIN")}
                    {renderPinInput(changePinForm, "newPin", "New 6-digit PIN", showChangeNewPin, setShowChangeNewPin, isSubmittingChangePin, "New PIN")}
                    {newPinForChangePin && <PasswordStrengthMeter password={newPinForChangePin.replace(/\D/g, '')} />}
                    {renderPinInput(changePinForm, "confirmNewPin", "Confirm New PIN", showChangeConfirmPin, setShowChangeConfirmPin, isSubmittingChangePin, "Confirm New PIN")}
                    <DialogFooter><Button type="submit" disabled={isSubmittingChangePin}>{isSubmittingChangePin ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Changing...</> : "Change PIN"}</Button></DialogFooter>
                  </form></Form>
                </DialogContent>
              </Dialog>

              <Dialog open={isDisable2FAModalOpen} onOpenChange={setIsDisable2FAModalOpen}>
                <DialogTrigger asChild><Button variant="destructive" className="flex-1"><ShieldOff className="mr-2"/>Disable 2FA</Button></DialogTrigger>
                <DialogContent><DialogHeader><DialogTitle>Disable Two-Factor Authentication</DialogTitle><DialogDescription>Enter your current 6-digit PIN or admin password to disable 2FA.</DialogDescription></DialogHeader>
                  <Form {...disable2FAForm}><form onSubmit={disable2FAForm.handleSubmit(handleDisable2FA)} className="space-y-4 pt-4">
                    <FormField control={disable2FAForm.control} name="currentPinOrPassword" render={({ field }) => (
                        <FormItem><FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Current PIN or Password</FormLabel><FormControl>
                        <div className="relative"><Input type={showDisablePinOrPassword ? "text" : "password"} placeholder="Enter PIN or password" {...field} disabled={isSubmittingDisable2FA} className="pr-10" /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary" onClick={() => setShowDisablePinOrPassword(!showDisablePinOrPassword)} tabIndex={-1}>{showDisablePinOrPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div></FormControl><FormMessage /></FormItem>
                    )} />
                    <DialogFooter><Button type="submit" variant="destructive" disabled={isSubmittingDisable2FA}>{isSubmittingDisable2FA ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Disabling...</> : "Disable 2FA"}</Button></DialogFooter>
                  </form></Form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
