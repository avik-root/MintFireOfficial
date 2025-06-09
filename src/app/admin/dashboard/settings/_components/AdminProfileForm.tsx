
"use client";

import React, { useState } from 'react';
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, UserSquare2, Fingerprint, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';
import { UpdateAdminProfileSchema, type UpdateAdminProfileInput, type AdminProfile } from '@/lib/schemas/admin-schemas';
import { updateAdminProfile } from '@/actions/admin-actions';
import { Separator } from '@/components/ui/separator';

interface AdminProfileFormProps {
  admin: AdminProfile;
}

export default function AdminProfileForm({ admin }: AdminProfileFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const form = useForm<UpdateAdminProfileInput>({
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

  const newPasswordValue = useWatch({
    control: form.control,
    name: 'newPassword',
  });

  const handleSubmit = async (data: UpdateAdminProfileInput) => {
    setIsSubmitting(true);
    
    // Filter out empty password fields if no new password is being set
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
      form.reset({
        ...payload, // Use payload which might have password fields omitted
        currentPassword: "", // Always reset password fields on form
        newPassword: "",
        confirmNewPassword: "",
      });
      // Potentially trigger a page refresh or data re-fetch if needed to show updated values immediately
      // For now, form.reset helps reflect the non-password changes.
    } else {
      if (result.errors) {
         result.errors.forEach((err) => {
           if (err.path && err.path.length > 0) {
             form.setError(err.path[0] as keyof UpdateAdminProfileInput, { message: err.message });
           }
         });
        toast({ variant: "destructive", title: "Validation Error", description: "Please check the form details." });
      } else {
        toast({ variant: "destructive", title: "Update Failed", description: result.message });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Card className="layered-card">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Account Information</CardTitle>
            <CardDescription>Update your administrator name, ID, and email address.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="adminName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><UserSquare2 className="mr-2 h-4 w-4 text-muted-foreground" />Admin Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jane Doe" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adminId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Fingerprint className="mr-2 h-4 w-4 text-muted-foreground" />Admin ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., mintfire_admin01" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="admin@example.com" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="layered-card">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Change Password</CardTitle>
            <CardDescription>Leave these fields blank if you do not want to change your password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Current Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showCurrentPassword ? "text" : "password"} 
                        placeholder="Enter your current password" 
                        {...field} 
                        disabled={isSubmitting} 
                        className="pr-10"
                      />
                       <Button
                          type="button" variant="ghost" size="icon"
                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)} tabIndex={-1}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />New Password</FormLabel>
                  <FormControl>
                     <div className="relative">
                      <Input 
                        type={showNewPassword ? "text" : "password"} 
                        placeholder="Enter new password" 
                        {...field} 
                        disabled={isSubmitting}
                        className="pr-10"
                       />
                       <Button
                          type="button" variant="ghost" size="icon"
                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary"
                          onClick={() => setShowNewPassword(!showNewPassword)} tabIndex={-1}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            { (form.getValues("newPassword") || newPasswordValue) && <PasswordStrengthMeter password={newPasswordValue} /> }

            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showConfirmNewPassword ? "text" : "password"} 
                        placeholder="Confirm new password" 
                        {...field} 
                        disabled={isSubmitting}
                        className="pr-10"
                      />
                      <Button
                          type="button" variant="ghost" size="icon"
                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary"
                          onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} tabIndex={-1}
                        >
                          {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Separator />

        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto" variant="default">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
