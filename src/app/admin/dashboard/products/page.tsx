
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProducts } from "@/actions/product-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PlusCircle, Edit, Package, AlertTriangle, Search, ArrowUpDown, Loader2, Eye, EyeOff, Ticket, KeyRound, DollarSign, Layers } from "lucide-react";
import DeleteProductButton from "./_components/DeleteProductButton";
import type { Product } from "@/lib/schemas/product-schemas";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

type SortKey = 'name' | 'status' | 'releaseDate' | 'pricingType' | 'isFeatured';
type SortDirection = 'asc' | 'desc';

export default function AdminProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('releaseDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      const { products, error: fetchError } = await getProducts();
      if (fetchError) {
        setError(fetchError);
      } else if (products) {
        setAllProducts(products);
      }
      setIsLoading(false);
    }
    fetchProducts();
  }, []);

  const getStatusColor = (status: string) => {
    if (status === 'Stable') return 'bg-green-600/30 text-green-400 border-green-500';
    if (status === 'Beta') return 'bg-yellow-600/30 text-yellow-400 border-yellow-500';
    if (status === 'Alpha') return 'bg-orange-600/30 text-orange-400 border-orange-500';
    if (status === 'Upcoming') return 'bg-blue-600/30 text-blue-400 border-blue-500';
    if (status === 'Deprecated') return 'bg-red-600/30 text-red-400 border-red-500';
    return 'bg-slate-600/30 text-slate-400 border-slate-500';
  };

  const getPricingSummary = (product: Product) => {
    if (product.pricingType === 'Free') {
      if (product.pricingTerm === 'Subscription' && product.trialDuration) {
        let summary = `Free Trial: ${product.trialDuration}`;
        if (product.postTrialPriceAmount && product.postTrialBillingInterval) {
          summary += ` -> $${product.postTrialPriceAmount.toFixed(2)}/${product.postTrialBillingInterval.slice(0,2).toLowerCase()}`;
        }
        return summary;
      }
      return `Free - ${product.pricingTerm}`;
    }
    // Paid
    if (product.pricingTerm === 'Lifetime' && product.priceAmount) {
      return `$${product.priceAmount.toFixed(2)} (Lifetime)`;
    }
    if (product.pricingTerm === 'Subscription') {
      const plans = [];
      if (product.monthlyPrice) plans.push(`$${product.monthlyPrice.toFixed(2)}/mo`);
      if (product.sixMonthPrice) plans.push(`$${product.sixMonthPrice.toFixed(2)}/6mo`);
      if (product.annualPrice) plans.push(`$${product.annualPrice.toFixed(2)}/yr`);
      if (plans.length > 0) return plans.join(' | ');
      return "Subscription";
    }
    return "Paid";
  };

  const filteredAndSortedProducts = useMemo(() => {
    let products = [...allProducts];

    if (searchTerm) {
      products = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.developer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.version && product.version.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.couponDetails && product.couponDetails.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.activationDetails && product.activationDetails.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    products.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === 'releaseDate') {
        valA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        valB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        valA = valA ? 1 : 0;
        valB = valB ? 1 : 0;
      } else if (sortKey === 'pricingType') { // Basic sort for pricing - can be enhanced
        valA = a.pricingType === 'Paid' ? (a.monthlyPrice || a.priceAmount || 1) : 0;
        valB = b.pricingType === 'Paid' ? (b.monthlyPrice || b.priceAmount || 1) : 0;
      }


      let comparison = 0;
      if (valA > valB) comparison = 1;
      else if (valA < valB) comparison = -1;
      
      return sortDirection === 'desc' ? comparison * -1 : comparison;
    });

    return products;
  }, [allProducts, searchTerm, sortKey, sortDirection]);

  if (isLoading) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-16 h-16 mb-4 text-primary animate-spin" />
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-destructive">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Products</h2>
        <p>{error}</p>
      </div>
    );
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };
  
  const SortableHeader = ({ children, columnKey }: { children: React.ReactNode; columnKey: SortKey }) => (
    <th 
        scope="col" 
        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/50"
        onClick={() => handleSort(columnKey)}
    >
        <div className="flex items-center">
            {children}
            {sortKey === columnKey && (
                <ArrowUpDown className={`ml-2 h-3 w-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
            )}
        </div>
    </th>
  );

  const InfoCell = ({ icon: Icon, text, title }: { icon: React.ElementType; text: string | null | undefined, title?: string }) => {
    if (!text) return <span className="text-muted-foreground/50 italic">N/A</span>;
    return (
      <div className="flex items-center gap-1.5" title={title || text}>
        <Icon className="w-3.5 h-3.5 text-accent flex-shrink-0" />
        <span className="truncate max-w-[100px]">{text}</span>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 w-full">
      <Card className="layered-card w-full">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="font-headline text-3xl flex items-center">
                <Package className="w-8 h-8 mr-3 text-primary glowing-icon-primary" />
                Manage Products
              </CardTitle>
              <CardDescription>View, add, edit, or delete products.</CardDescription>
            </div>
            <Button asChild variant="default" className="shrink-0">
              <Link href="/admin/dashboard/products/add">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Product
              </Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
             <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                 <Select value={sortKey} onValueChange={(value) => handleSort(value as SortKey)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="releaseDate">Release Date</SelectItem>
                        <SelectItem value="pricingType">Pricing</SelectItem>
                        <SelectItem value="isFeatured">Featured</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}>
                    <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">
                {searchTerm ? "No products match your search." : "No products found."}
              </p>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms." : "Get started by adding a new product."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-card">
                  <tr>
                    <SortableHeader columnKey="name">Name</SortableHeader>
                    <SortableHeader columnKey="status">Status & Version</SortableHeader>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pricing</th>
                    <SortableHeader columnKey="releaseDate">Release Date</SortableHeader>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Coupons</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Activation</th>
                    <SortableHeader columnKey="isFeatured">Featured</SortableHeader>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {filteredAndSortedProducts.map((product: Product) => (
                    <tr key={product.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">{product.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <Badge variant="outline" className={getStatusColor(product.status)}>
                          {product.status} {product.version && `v${product.version}`}
                        </Badge>
                      </td>
                       <td className="px-4 py-4 whitespace-normal text-sm text-muted-foreground max-w-xs" title={getPricingSummary(product)}>
                        <div className="flex items-center gap-1.5">
                           {product.pricingType === 'Paid' ? <DollarSign className="w-3.5 h-3.5 text-accent flex-shrink-0" /> : <Layers className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                           <span className="truncate">{getPricingSummary(product)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {product.releaseDate ? format(new Date(product.releaseDate), "PPP") : 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                         <InfoCell icon={Ticket} text={product.couponDetails} title="Coupon Details" />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <InfoCell icon={KeyRound} text={product.activationDetails} title="Activation Details" />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <Badge variant={product.isFeatured ? "default" : "secondary"} 
                               className={product.isFeatured ? "bg-accent/80 text-accent-foreground border-accent" : ""}>
                          {product.isFeatured ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
                          {product.isFeatured ? "Yes" : "No"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                        <Button variant="ghost" size="icon" asChild title="Edit Product">
                          <Link href={`/admin/dashboard/products/edit/${product.id}`}>
                            <Edit className="h-4 w-4 text-accent" />
                          </Link>
                        </Button>
                        <DeleteProductButton productId={product.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
