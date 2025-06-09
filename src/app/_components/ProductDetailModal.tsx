
"use client";

import type { Product } from '@/lib/schemas/product-schemas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Package, Users, Zap, CheckCircle, CalendarDays, DollarSign, Tag, Ticket, KeyRound, Info, ExternalLink, Repeat, Clock, Layers } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { cn } from "@/lib/utils"; // Added import

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  if (!product) return null;

  const getStatusBadge = (status: string) => {
    let colorClass = 'bg-slate-600/30 text-slate-400 border-slate-500';
    let IconComponent = Zap;

    if (status === 'Stable') {
      colorClass = 'bg-green-600/30 text-green-400 border-green-500';
      IconComponent = CheckCircle;
    } else if (status === 'Beta') {
      colorClass = 'bg-yellow-600/30 text-yellow-400 border-yellow-500';
    } else if (status === 'Alpha') {
      colorClass = 'bg-orange-600/30 text-orange-400 border-orange-500';
    }
    return (
      <Badge variant="outline" className={`text-sm px-2 py-1 ${colorClass}`}>
        <IconComponent className="mr-1.5 h-4 w-4" />
        {status} {product.version && `v${product.version}`}
      </Badge>
    );
  };

  const getPricingText = (pricingType: string, pricingTerm: string) => {
    if (pricingType === 'Free') {
        if (pricingTerm === 'Subscription' && product.trialDuration) {
            return `Free Trial: ${product.trialDuration}`;
        }
        return `Free - ${pricingTerm}`;
    }
    if (pricingTerm === 'Lifetime' && product.priceAmount) {
        return `$${product.priceAmount.toFixed(2)} (Lifetime)`;
    }
    if (pricingTerm === 'Subscription') {
        return "Subscription Plans Available"; // Details will be listed below
    }
    return "Paid (Details unavailable)";
  };
  
  const DetailItem = ({ icon: Icon, label, value, isHtml = false, className = "" }: { icon?: React.ElementType, label: string, value?: string | number | null | string[] | React.ReactNode, isHtml?: boolean, className?: string }) => {
    if (value === null || value === undefined || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) return null;
    
    return (
      <div className={cn("mb-3", className)}>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5 flex items-center">
          {Icon && <Icon className="w-3.5 h-3.5 mr-1.5 text-accent" />} {label}
        </p>
        {Array.isArray(value) ? (
          <div className="flex flex-wrap gap-1.5">
            {value.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
          </div>
        ) : isHtml && typeof value === 'string' ? (
          <div className="text-sm text-foreground/90 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: value }} />
        ) : (
          <p className="text-sm text-foreground/90">{typeof value === 'number' ? value.toFixed(2) : value}</p>
        )}
      </div>
    );
  };
  
  const getSafeLinkProps = (url: string | null | undefined): { href: string; target?: string; rel?: string } | null => {
    if (!url || url.trim() === "") return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return { href: url, target: '_blank', rel: 'noopener noreferrer' };
    if (url.startsWith('/')) return { href: url, target: '_self' };
    return { href: `https://${url}`, target: '_blank', rel: 'noopener noreferrer' };
  };
  const productLinkProps = getSafeLinkProps(product.productUrl);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 border-primary shadow-2xl shadow-primary/30 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-card sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="font-headline text-2xl md:text-3xl text-primary flex items-center gap-3">
                <Package className="w-7 h-7 md:w-8 md:h-8 text-primary flex-shrink-0" />
                {product.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Developed by: {product.developer}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="ml-auto -mt-2 -mr-2">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-grow">
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
                 {getStatusBadge(product.status)}
            </div>
            
            <DetailItem icon={Info} label="Description" value={product.description} />
            {product.longDescription && (
                <DetailItem icon={Info} label="Detailed Information" value={product.longDescription.replace(/\n/g, '<br />')} isHtml={true} />
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <DetailItem icon={DollarSign} label="Pricing Overview" value={getPricingText(product.pricingType, product.pricingTerm)} />
                {product.releaseDate && (
                    <DetailItem 
                        icon={CalendarDays} 
                        label={product.status === 'Upcoming' ? 'Expected Release' : 'Release Date'} 
                        value={format(new Date(product.releaseDate), "MMMM d, yyyy")} 
                    />
                )}
            </div>

            {/* Conditional Pricing Details */}
            {product.pricingType === 'Paid' && product.pricingTerm === 'Subscription' && (
                <div className="pt-2 border-t border-border mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 mt-3 flex items-center"><Layers className="w-4 h-4 mr-1.5 text-accent" />Subscription Plans</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {product.monthlyPrice && <DetailItem label="Monthly" value={`$${product.monthlyPrice.toFixed(2)}`} />}
                        {product.sixMonthPrice && <DetailItem label="6-Month Plan" value={`$${product.sixMonthPrice.toFixed(2)}`} />}
                        {product.annualPrice && <DetailItem label="Annual Plan" value={`$${product.annualPrice.toFixed(2)}`} />}
                    </div>
                </div>
            )}

            {product.pricingType === 'Free' && product.pricingTerm === 'Subscription' && product.postTrialPriceAmount && product.postTrialBillingInterval && (
                 <div className="pt-2 border-t border-border mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 mt-3 flex items-center"><Repeat className="w-4 h-4 mr-1.5 text-accent" />Post-Trial Pricing</h4>
                    <DetailItem label="After Trial" value={`$${product.postTrialPriceAmount.toFixed(2)} / ${product.postTrialBillingInterval.toLowerCase()}`} />
                </div>
            )}

            { (product.tags && product.tags.length > 0) && (
              <DetailItem icon={Tag} label="Tags" value={product.tags} />
            )}

            { (product.couponDetails || product.activationDetails) && (
                <div className="pt-2 border-t border-border mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 mt-3">Additional Info</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <DetailItem icon={Ticket} label="Coupon Details" value={product.couponDetails} />
                        <DetailItem icon={KeyRound} label="Activation Details" value={product.activationDetails} />
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t border-border bg-card sticky bottom-0 z-10">
          <div className="flex w-full justify-between items-center gap-2">
            <DialogClose asChild>
                <Button variant="outline">Close</Button>
            </DialogClose>
            {productLinkProps && (
                <Button asChild variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Link href={productLinkProps.href} target={productLinkProps.target} rel={productLinkProps.rel}>
                        Try Out <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

