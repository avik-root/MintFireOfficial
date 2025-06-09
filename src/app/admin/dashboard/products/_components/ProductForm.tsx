
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FormProductSchema, type FormProductInput, type Product, ProductStatusSchema, ProductPricingTypeSchema, ProductPricingTermSchema } from "@/lib/schemas/product-schemas";
import { Loader2, Save, Package, Tag, GitBranch, CalendarDays, MessageSquare, Link as LinkIcon, Users, DollarSign, Award, Image as ImageIcon, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import React, { useState, ChangeEvent } from "react";
import NextImage from 'next/image';
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (formData: FormData) => Promise<{ success: boolean; error?: string; errors?: any[] }>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

export default function ProductForm({ 
  initialData, 
  onSubmit,
  isSubmitting,
  submitButtonText = "Save Product" 
}: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<FormProductInput>({
    resolver: zodResolver(FormProductSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      version: initialData.version || "",
      status: initialData.status,
      releaseDate: initialData.releaseDate ? new Date(initialData.releaseDate).toISOString() : undefined,
      description: initialData.description,
      longDescription: initialData.longDescription || "",
      imageUrl: initialData.imageUrl || "", 
      productUrl: initialData.productUrl || "",
      developer: initialData.developer,
      pricingType: initialData.pricingType,
      pricingTerm: initialData.pricingTerm,
      tagsString: initialData.tags?.join(', ') || '',
      isFeatured: initialData.isFeatured,
    } : {
      name: "",
      version: "",
      status: "Upcoming",
      releaseDate: undefined,
      description: "",
      longDescription: "",
      imageUrl: "",
      productUrl: "",
      developer: "MintFire R&D",
      pricingType: "Free",
      pricingTerm: "Lifetime",
      tagsString: "",
      isFeatured: false,
    },
  });

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setImagePreview(initialData?.imageUrl || null); // Keep existing if no new file selected
    }
  };

  const handleFormSubmit = async (data: FormProductInput) => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
       if (key === 'isFeatured') {
        formData.append(key, String(value));
      } else if (value !== undefined && value !== null && key !== 'imageUrl') {
        formData.append(key, String(value));
      }
    });

    if (selectedFile) {
      formData.append("imageFile", selectedFile);
    } else if (initialData?.imageUrl && !selectedFile && imagePreview) { // if imagePreview is not null means user wants to keep the old image
      formData.append("existingImageUrl", initialData.imageUrl);
    } else if (!imagePreview && initialData?.imageUrl) { // if imagePreview is null it means user wants to remove the image
       formData.append("existingImageUrl", ""); // Send empty to indicate removal
    }
    
    const result = await onSubmit(formData);

    if (result.success) {
      toast({ title: "Success", description: `Product ${initialData ? 'updated' : 'added'} successfully.` });
      router.push("/admin/dashboard/products");
      router.refresh(); 
    } else {
      if (result.errors) {
        result.errors.forEach((err: any) => {
          const fieldName = Array.isArray(err.path) ? err.path.join(".") : err.path;
          if (fieldName in form.getValues()) {
            form.setError(fieldName as keyof FormProductInput, { message: err.message });
          } else {
            console.warn("Error for unmapped field:", fieldName, err.message);
             toast({ variant: "destructive", title: "Form Error", description: `Error on field ${fieldName}: ${err.message}` });
          }
        });
        toast({ variant: "destructive", title: "Validation Error", description: "Please check the form fields for errors." });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error || `Failed to ${initialData ? 'update' : 'add'} product.` });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Package className="mr-2 h-4 w-4 text-muted-foreground"/>Product Name</FormLabel>
              <FormControl><Input placeholder="Enter product name" {...field} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center"><GitBranch className="mr-2 h-4 w-4 text-muted-foreground"/>Version (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., 1.0.0, 2.1 Beta" {...field} value={field.value ?? ""} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center"><Award className="mr-2 h-4 w-4 text-muted-foreground"/>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                        <SelectContent>
                        {ProductStatusSchema.options.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        
        <FormField
            control={form.control}
            name="releaseDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground"/>Release Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        disabled={isSubmitting}
                      >
                        {field.value ? ( format(new Date(field.value), "PPP") ) : ( <span>Pick a date</span> )}
                        <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                       onSelect={(date) => field.onChange(date ? date.toISOString() : undefined)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>The official release date of this product version.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><MessageSquare className="mr-2 h-4 w-4 text-muted-foreground"/>Short Description</FormLabel>
              <FormControl><Textarea placeholder="Brief summary of the product (for cards, lists)" {...field} rows={3} disabled={isSubmitting} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="longDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><MessageSquare className="mr-2 h-4 w-4 text-muted-foreground"/>Long Description (Optional)</FormLabel>
              <FormControl><Textarea placeholder="Detailed product information, features, etc. (Markdown supported for future use)" {...field} value={field.value ?? ""} rows={8} disabled={isSubmitting} /></FormControl>
               <FormDescription>Provide more details for the dedicated product page (if applicable).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4 text-muted-foreground"/>Product Image/Logo</FormLabel>
           <div className="flex items-center gap-4">
            {imagePreview && (
                <div className="relative w-24 h-24 rounded-md border border-border overflow-hidden bg-muted flex-shrink-0">
                <NextImage src={imagePreview} alt="Selected preview" layout="fill" objectFit="contain" data-ai-hint="product image preview" />
                </div>
            )}
            <div className="flex-grow">
                <FormControl>
                    <Input 
                    type="file" 
                    accept="image/png, image/jpeg, image/gif, image/webp" 
                    onChange={handleImageChange} 
                    disabled={isSubmitting}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                </FormControl>
                 <FormDescription>Upload an image or logo for the product (PNG, JPG, GIF, WEBP). Max 5MB.</FormDescription>
            </div>
             {imagePreview && (
                 <Button variant="ghost" size="sm" onClick={() => {setImagePreview(null); setSelectedFile(null); form.setValue('imageUrl', '');}} disabled={isSubmitting} type="button">
                    Remove
                 </Button>
            )}
          </div>
          <FormMessage>{form.formState.errors.imageUrl?.message}</FormMessage>
        </FormItem>

        <FormField
            control={form.control}
            name="productUrl"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center"><LinkIcon className="mr-2 h-4 w-4 text-muted-foreground"/>Product URL (Optional)</FormLabel>
                <FormControl><Input placeholder="https://mintfire.com/product-name" {...field} value={field.value ?? ""} disabled={isSubmitting}/></FormControl>
                <FormDescription>Link to the product's dedicated page or external site.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
        />
         <FormField
            control={form.control}
            name="developer"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center"><Users className="mr-2 h-4 w-4 text-muted-foreground"/>Developer</FormLabel>
                <FormControl><Input placeholder="e.g., MintFire R&D, Third-Party Partner" {...field} disabled={isSubmitting}/></FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="pricingType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-muted-foreground"/>Pricing Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select pricing type" /></SelectTrigger></FormControl>
                        <SelectContent>
                        {ProductPricingTypeSchema.options.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="pricingTerm"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center"><Tag className="mr-2 h-4 w-4 text-muted-foreground"/>Pricing Term</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select pricing term" /></SelectTrigger></FormControl>
                        <SelectContent>
                        {ProductPricingTermSchema.options.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <FormField
          control={form.control}
          name="tagsString"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Tag className="mr-2 h-4 w-4 text-muted-foreground"/>Tags (Optional)</FormLabel>
              <FormControl><Input placeholder="e.g., security, enterprise, new" {...field} value={field.value ?? ""} disabled={isSubmitting}/></FormControl>
              <FormDescription>Comma-separated list of tags.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isFeatured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base flex items-center">
                 {field.value ? <Eye className="mr-2 h-4 w-4 text-green-500"/> : <EyeOff className="mr-2 h-4 w-4 text-red-500"/>}
                  Feature on Homepage
                </FormLabel>
                <FormDescription>
                  {field.value ? "This product will be highlighted on the homepage." : "This product will not be specially featured."}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                  aria-label="Toggle product feature status"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="mr-2 h-4 w-4" /> {submitButtonText}</>
          )}
        </Button>
      </form>
    </Form>
  );
}

    