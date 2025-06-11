
"use client"; 

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addProduct } from "@/actions/product-actions";
import ProductForm from "../_components/ProductForm";
import { PlusCircle, Package } from "lucide-react";

export default function AddProductPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    const result = await addProduct(formData);
    setIsSubmitting(false);
    return result; 
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full max-w-3xl">
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-primary glowing-icon-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Add New Product</CardTitle>
              <CardDescription>Enter the details for the new product.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProductForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
            submitButtonText="Add Product"
          />
        </CardContent>
      </Card>
    </div>
  );
}
