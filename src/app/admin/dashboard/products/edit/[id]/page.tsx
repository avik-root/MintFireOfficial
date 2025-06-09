
"use client";

import { useEffect, useState, useCallback, use } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProductById, updateProduct } from "@/actions/product-actions";
import ProductForm from "../../_components/ProductForm";
import { Edit, Loader2, AlertTriangle, Package } from "lucide-react";
import type { Product } from "@/lib/schemas/product-schemas";

export default function EditProductPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const params = use(paramsPromise);
  const productId = params.id;

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getProductById(productId);
    if (result.product) {
      setProduct(result.product);
    } else {
      setError(result.error || "Failed to load product.");
    }
    setIsLoading(false);
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    const result = await updateProduct(productId, formData);
    setIsSubmitting(false);
    if(result.success) {
      await fetchProduct(); 
    }
    return result;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!product) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full max-w-3xl">
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-primary glowing-icon-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Edit Product</CardTitle>
              <CardDescription>Update the details for this product.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProductForm 
            initialData={product}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitButtonText="Update Product"
          />
        </CardContent>
      </Card>
    </div>
  );
}
