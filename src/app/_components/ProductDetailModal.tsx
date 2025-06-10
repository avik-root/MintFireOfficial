
"use client";

import type { Product } from '@/lib/schemas/product-schemas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, Users, Zap, CheckCircle, CalendarDays, DollarSign, Tag, Ticket, KeyRound, Info, ExternalLink, Repeat, Clock, Layers } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import React, { Fragment } from 'react'; // Added Fragment import

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  if (!product) return null;

  const getStatusBadge = (status: string) => {
    let colorClass = 'bg-slate-600/30 text-slate-400 border-slate-500';
    let IconComponent = Clock; // Default to Clock

    if (status === 'Stable') {
      colorClass = 'bg-green-600/30 text-green-400 border-green-500';
      IconComponent = CheckCircle;
    } else if (status === 'Beta') {
      colorClass = 'bg-yellow-600/30 text-yellow-400 border-yellow-500';
      IconComponent = Zap;
    } else if (status === 'Alpha') {
      colorClass = 'bg-orange-600/30 text-orange-400 border-orange-500';
      IconComponent = Zap;
    } else if (status === 'Upcoming') {
      colorClass = 'bg-blue-600/30 text-blue-400 border-blue-500';
      IconComponent = Clock;
    } else if (status === 'Deprecated') {
      colorClass = 'bg-red-600/30 text-red-400 border-red-500';
      IconComponent = Zap;
    }
    return (
      <Badge variant="outline" className={`text-sm px-2 py-1 ${colorClass}`}>
        <IconComponent className="mr-1.5 h-4 w-4" />
        {status} {product.version && `v${product.version}`}
      </Badge>
    );
  };

  const renderDeveloperLinksModal = () => {
    if (!product.developer) return null;
    const developerNames = product.developer.split(/[,&]/).map(name => name.trim()).filter(name => name.length > 0);

    return (
      <>
        {developerNames.map((name, index) => (
          <Fragment key={name + index}> {/* Added index to key for safety if names aren't unique */}
            <Link href={`/company?member=${encodeURIComponent(name.trim())}`} className="hover:text-primary hover:underline">
              {name}
            </Link>
            {index < developerNames.length - 1 && (developerNames.length > 1 && index === developerNames.length - 2 ? ' & ' : ', ')}
          </Fragment>
        ))}
      </>
    );
  };


  const getPricingText = (pricingType: string, pricingTerm: string) => {
    if (product.pricingType === 'Free') {
        if (product.pricingTerm === 'Subscription' && product.trialDuration) {
            let summary = `Free Trial: ${product.trialDuration}`;
            if (typeof product.postTrialPriceAmount === 'number' && product.postTrialBillingInterval) {
                summary += ` -> $${product.postTrialPriceAmount.toFixed(2)}/${product.postTrialBillingInterval.slice(0,2).toLowerCase()}`;
            }
            return summary;
        }
        return `Free - ${product.pricingTerm}`;
    }
    if (product.pricingTerm === 'Lifetime' && typeof product.priceAmount === 'number') {
        return `$${product.priceAmount.toFixed(2)} (Lifetime)`;
    }
    if (product.pricingTerm === 'Subscription') {
      const plans = [];
      if (typeof product.monthlyPrice === 'number') plans.push(`$${product.monthlyPrice.toFixed(2)}/mo`);
      if (typeof product.sixMonthPrice === 'number') plans.push(`$${product.sixMonthPrice.toFixed(2)}/6mo`);
      if (typeof product.annualPrice === 'number') plans.push(`$${product.annualPrice.toFixed(2)}/yr`);
      if (plans.length > 0) return plans.join(' | ');
      return "Subscription (Details unavailable)";
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
          <p className="text-sm text-foreground/90">{typeof value === 'number' ? `$${value.toFixed(2)}` : value}</p>
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
        <DialogHeader className="p-6 pb-4 border-b border-border bg-card">
          <DialogTitle className="font-headline text-2xl md:text-3xl text-primary flex items-center gap-3">
            <Package className="w-7 h-7 md:w-8 md:h-8 text-primary flex-shrink-0" />
            {product.name}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Developed by: <span className="ml-1">{renderDeveloperLinksModal()}</span>
          </DialogDescription>
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
                {product.releaseDate && (typeof product.releaseDate === 'string' || product.releaseDate instanceof Date) && (
                    <DetailItem 
                        icon={CalendarDays} 
                        label={product.status === 'Upcoming' ? 'Expected Release' : 'Release Date'} 
                        value={format(new Date(product.releaseDate), "MMMM d, yyyy")} 
                    />
                )}
            </div>

            {product.pricingType === 'Paid' && product.pricingTerm === 'Subscription' && (
                <div className="pt-2 border-t border-border mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 mt-3 flex items-center"><Layers className="w-4 h-4 mr-1.5 text-accent" />Subscription Plans</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {typeof product.monthlyPrice === 'number' && <DetailItem label="Monthly" value={product.monthlyPrice} />}
                        {typeof product.sixMonthPrice === 'number' && <DetailItem label="6-Month Plan" value={product.sixMonthPrice} />}
                        {typeof product.annualPrice === 'number' && <DetailItem label="Annual Plan" value={product.annualPrice} />}
                    </div>
                </div>
            )}

            {product.pricingType === 'Free' && product.pricingTerm === 'Subscription' && typeof product.postTrialPriceAmount === 'number' && product.postTrialBillingInterval && (
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

        <DialogFooter className="p-4 border-t border-border bg-card">
          <div className="flex w-full justify-between items-center gap-2">
             <Button variant="outline" onClick={onClose}>Close</Button>
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

