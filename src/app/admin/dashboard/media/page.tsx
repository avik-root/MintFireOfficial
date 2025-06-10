
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImageIcon, UploadCloud, Trash2, Copy, Loader2, AlertTriangle, CheckCircle, ImagePlus } from "lucide-react";
import { getUploadedMediaFiles, uploadMediaFile, deleteMediaFile } from "@/actions/media-actions";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const UploadSchema = z.object({
  imageFile: z.custom<File>((val) => val instanceof File, "Image file is required.")
    .refine((file) => file?.size <= 5 * 1024 * 1024, `Max file size is 5MB.`)
    .refine(
      (file) => ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file?.type),
      "Only .jpg, .jpeg, .png, .gif, and .webp formats are supported."
    ),
});
type UploadInput = z.infer<typeof UploadSchema>;

export default function AdminMediaPage() {
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [errorLoadingFiles, setErrorLoadingFiles] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Store path of file being deleted
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  const form = useForm<UploadInput>({
    resolver: zodResolver(UploadSchema),
  });

  const fetchMedia = async () => {
    setIsLoadingFiles(true);
    setErrorLoadingFiles(null);
    const result = await getUploadedMediaFiles();
    if (result.files) {
      setMediaFiles(result.files.sort((a,b) => b.localeCompare(a))); // Sort newest first if filenames are sortable
    } else {
      setErrorLoadingFiles(result.error || "Failed to load media.");
    }
    setIsLoadingFiles(false);
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUploadSubmit = async (data: UploadInput) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('imageFile', data.imageFile);

    const result = await uploadMediaFile(formData);
    setIsUploading(false);

    if (result.success) {
      toast({ title: "Upload Successful", description: `File ${result.filePath} uploaded.`, variant: 'default' });
      form.reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear the file input
      }
      await fetchMedia(); // Refresh file list
    } else {
      toast({ variant: "destructive", title: "Upload Failed", description: result.error || "An unknown error occurred." });
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    setIsDeleting(filePath);
    const result = await deleteMediaFile(filePath);
    setIsDeleting(null);
    if (result.success) {
      toast({ title: "Delete Successful", description: `File ${filePath} deleted.`, variant: 'default' });
      await fetchMedia(); // Refresh file list
    } else {
      toast({ variant: "destructive", title: "Delete Failed", description: result.error || "An unknown error occurred." });
    }
  };
  
  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path)
      .then(() => toast({ title: "Path Copied!", description: path, variant: 'default' }))
      .catch(err => toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy path." }));
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full">
      <Card className="layered-card w-full mb-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ImagePlus className="w-8 h-8 text-primary glowing-icon-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Upload New Media</CardTitle>
              <CardDescription>Add images (JPEG, PNG, GIF, WEBP) to the media library. Max 5MB.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUploadSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="imageFile"
                render={({ field: { onChange, value, ...restField } }) => (
                  <FormItem>
                    <FormLabel>Select Image File</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={(e) => onChange(e.target.files?.[0])}
                        disabled={isUploading}
                        ref={fileInputRef}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        {...restField}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isUploading} className="w-full sm:w-auto">
                {isUploading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                ) : (
                  <><UploadCloud className="mr-2 h-4 w-4" /> Upload Image</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-primary glowing-icon-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Media Library</CardTitle>
              <CardDescription>Manage uploaded images.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingFiles && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Loading media files...</p>
            </div>
          )}
          {errorLoadingFiles && (
            <div className="text-center text-destructive py-10">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
              <p className="text-lg font-semibold">Error loading media</p>
              <p>{errorLoadingFiles}</p>
            </div>
          )}
          {!isLoadingFiles && !errorLoadingFiles && mediaFiles.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">Media library is empty.</p>
              <p className="text-muted-foreground">Upload some images to see them here.</p>
            </div>
          )}
          {!isLoadingFiles && !errorLoadingFiles && mediaFiles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {mediaFiles.map((filePath) => (
                <Card key={filePath} className="overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="relative aspect-square w-full">
                      <Image 
                        src={filePath} 
                        alt={`Media file: ${filePath.split('/').pop()}`} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform"
                        data-ai-hint="uploaded media library"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="p-2 flex-col items-start text-xs space-y-1">
                    <p className="text-muted-foreground truncate w-full" title={filePath.split('/').pop()}>
                      {filePath.split('/').pop()}
                    </p>
                    <div className="flex w-full justify-between items-center">
                      <Button variant="ghost" size="icon" onClick={() => handleCopyPath(filePath)} title="Copy Path">
                        <Copy className="h-4 w-4 text-blue-500" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" title="Delete Image" disabled={isDeleting === filePath}>
                              {isDeleting === filePath ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this image? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteFile(filePath)} className="bg-destructive hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
