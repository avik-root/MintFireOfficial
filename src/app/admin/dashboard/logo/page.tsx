
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon as LogoIcon, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import LogoUploadForm from "./_components/LogoUploadForm";
import { getCurrentLogoPath } from '@/actions/logo-actions';
import { Button } from '@/components/ui/button';

export default function AdminLogoManagementPage() {
  const [currentLogoSrc, setCurrentLogoSrc] = useState<string | null>(null);
  const [isLoadingLogo, setIsLoadingLogo] = useState(true);
  const [errorLoadingLogo, setErrorLoadingLogo] = useState<string | null>(null);

  const fetchCurrentLogo = useCallback(async () => {
    setIsLoadingLogo(true);
    setErrorLoadingLogo(null);
    try {
      const path = await getCurrentLogoPath();
      setCurrentLogoSrc(path);
    } catch (error: any) {
      setErrorLoadingLogo(error.message || "Failed to fetch current logo.");
    }
    setIsLoadingLogo(false);
  }, []);

  useEffect(() => {
    fetchCurrentLogo();
  }, [fetchCurrentLogo]);

  const handleUploadSuccess = () => {
    fetchCurrentLogo(); // Refresh the current logo display
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full max-w-2xl">
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <LogoIcon className="w-8 h-8 text-primary glowing-icon-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Logo Management</CardTitle>
              <CardDescription>Upload and manage the site logo.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Current Logo</h3>
            {isLoadingLogo && (
              <div className="flex items-center text-muted-foreground">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span>Loading current logo...</span>
              </div>
            )}
            {errorLoadingLogo && (
              <div className="text-destructive flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span>{errorLoadingLogo}</span>
              </div>
            )}
            {!isLoadingLogo && !errorLoadingLogo && currentLogoSrc && (
              <div className="relative w-40 h-40 p-2 border border-border rounded-md bg-muted/30 flex items-center justify-center">
                <Image 
                  src={currentLogoSrc + `?timestamp=${new Date().getTime()}`} // Cache buster
                  alt="Current Site Logo" 
                  fill 
                  style={{ objectFit: 'contain' }}
                  data-ai-hint="current logo"
                />
              </div>
            )}
            {!isLoadingLogo && !errorLoadingLogo && !currentLogoSrc && (
              <p className="text-muted-foreground italic">No custom logo uploaded. The default site logo is being used.</p>
            )}
            {!isLoadingLogo && (
                 <Button variant="outline" size="sm" onClick={fetchCurrentLogo} className="mt-2">
                    <RefreshCw className="mr-2 h-3 w-3"/> Refresh Current Logo
                </Button>
            )}
          </div>
          
          <LogoUploadForm onUploadSuccess={handleUploadSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}
