
"use client";

import React, { useState, ChangeEvent, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { uploadLogoAction } from '@/actions/logo-actions';
import { useRouter } from 'next/navigation';

const MAX_FILE_SIZE_MB = 1;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg']; // Standardized MIME types
const ACCEPTED_FILE_EXTENSIONS_STRING = ".png, .jpg, .jpeg";

const UploadSchema = z.object({
  logoFile: z.custom<File>((val) => val instanceof File, "Logo file is required.")
    .refine((file) => file.size <= MAX_FILE_SIZE_MB * 1024 * 1024, `Max file size is ${MAX_FILE_SIZE_MB}MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      `Only PNG (${ACCEPTED_FILE_EXTENSIONS_STRING}) and JPEG (${ACCEPTED_FILE_EXTENSIONS_STRING}) formats are supported.`
    ),
});
type UploadInput = z.infer<typeof UploadSchema>;

interface LogoUploadFormProps {
  onUploadSuccess: () => void;
}

export default function LogoUploadForm({ onUploadSuccess }: LogoUploadFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UploadInput>({
    resolver: zodResolver(UploadSchema),
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('logoFile', file, { shouldValidate: true }); // Validate on change
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      form.resetField('logoFile');
      setPreview(null);
    }
  };

  const handleSubmit = async (data: UploadInput) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('logoFile', data.logoFile);

    const result = await uploadLogoAction(formData);
    setIsUploading(false);

    if (result.success) {
      toast({ title: "Upload Successful", description: "Logo has been updated.", variant: 'default' });
      form.reset();
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onUploadSuccess(); 
      router.refresh(); 
    } else {
      toast({ variant: "destructive", title: "Upload Failed", description: result.error || "An unknown error occurred." });
      // Reset file input ref if server fails, allowing re-selection of same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      form.resetField('logoFile'); // Also reset RHF state for the file
      setPreview(null); // Clear preview on server error
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="logoFile"
          render={({ fieldState }) => ( 
            <FormItem>
              <FormLabel className="flex items-center text-base">
                <ImageIcon className="mr-2 h-5 w-5 text-muted-foreground" />
                Upload New Logo
              </FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept={`${ACCEPTED_IMAGE_TYPES.join(',')},${ACCEPTED_FILE_EXTENSIONS_STRING}`}
                  onChange={handleFileChange}
                  disabled={isUploading}
                  ref={fileInputRef}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </FormControl>
              <FormDescription>
                PNG ({ACCEPTED_FILE_EXTENSIONS_STRING}) or JPEG ({ACCEPTED_FILE_EXTENSIONS_STRING}) format. Max {MAX_FILE_SIZE_MB}MB. Recommended square or slightly wide.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {preview && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">New Logo Preview:</p>
            <div className="relative w-32 h-32 border border-dashed border-border rounded-md p-2 flex items-center justify-center">
              <Image src={preview} alt="New logo preview" fill style={{ objectFit: 'contain' }} data-ai-hint="logo preview"/>
            </div>
          </div>
        )}

        <Button type="submit" disabled={isUploading || !form.formState.isValid} className="w-full sm:w-auto">
          {isUploading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
          ) : (
            <><UploadCloud className="mr-2 h-4 w-4" /> Upload and Set Logo</>
          )}
        </Button>
      </form>
    </Form>
  );
}
