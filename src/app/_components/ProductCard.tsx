
"use client";

import type { Product } from '@/lib/schemas/product-schemas';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, DollarSign, Users, CalendarDays, CheckCircle, Zap, Package, Ticket, KeyRound, Info, Eye, ExternalLink, Layers, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ProductCardProps {
  product: Product;
  onViewDetailsClick?: (product: Product) => void;
}

export default function ProductCard({ product, onViewDetailsClick }: ProductCardProps) {
  const getStatusBadge = (status: string) => {
    let colorClass = 'bg-slate-600/30 text-slate-400 border-slate-500';
    let Icon = Zap;

    if (status === 'Stable') {
      colorClass = 'bg-green-600/30 text-green-400 border-green-500';
      Icon = CheckCircle;
    } else if (status === 'Beta') {
      colorClass = 'bg-yellow-600/30 text-yellow-400 border-yellow-500';
    } else if (status === 'Alpha') {
      colorClass = 'bg-orange-600/30 text-orange-400 border-orange-500';
    } else if (status === 'Upcoming') {
      colorClass = 'bg-blue-600/30 text-blue-400 border-blue-500';
      Icon = Clock;
    } else if (status === 'Deprecated') {
      colorClass = 'bg-red-600/30 text-red-400 border-red-500';
    }
    return (
      <Badge variant="outline" className={`text-xs ${colorClass}`}>
        <Icon className="mr-1 h-3 w-3" />
        {status} {product.version && `v${product.version}`}
      </Badge>
    );
  };

  const getPricingDisplay = () => {
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
    // Paid
    if (product.pricingTerm === 'Lifetime' && typeof product.priceAmount === 'number') {
      return `$${product.priceAmount.toFixed(2)} (Lifetime)`;
    }
    if (product.pricingTerm === 'Subscription') {
      const plans = [];
      if (typeof product.monthlyPrice === 'number') plans.push(`$${product.monthlyPrice.toFixed(2)}/mo`);
      if (typeof product.sixMonthPrice === 'number') plans.push(`$${product.sixMonthPrice.toFixed(2)}/6mo`);
      if (typeof product.annualPrice === 'number') plans.push(`$${product.annualPrice.toFixed(2)}/yr`);
      
      if (plans.length > 0) return plans.join(' | ');
      // This case should ideally not be hit if validation for Paid Subscription requires all three prices
      return "Subscription (Contact for pricing)"; 
    }
    return "Paid (Details unavailable)";
  };

  return (
    <Card className="layered-card flex flex-col overflow-hidden group h-full transition-all duration-300 ease-in-out hover:shadow-accent/30">
      <div className="relative w-full h-40 bg-muted flex items-center justify-center border-b border-border group-hover:bg-muted/80 transition-colors">
          <Package className="w-16 h-16 text-muted-foreground/50 group-hover:scale-105 group-hover:text-accent transition-all duration-300 ease-in-out" />
      </div>
      <CardHeader className="pt-4">
        <div className="flex justify-between items-start mb-1">
          <CardTitle className="font-headline text-xl group-hover:text-primary transition-colors">{product.name}</CardTitle>
          {getStatusBadge(product.status)}
        </div>
        {product.developer && (
          <CardDescription className="text-xs text-muted-foreground flex items-center">
            <Users className="w-3 h-3 mr-1.5 text-accent/80" /> By: {product.developer}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow py-2 space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{product.description}</p>
        
        <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
                {product.pricingType === 'Paid' ? <DollarSign className="w-3.5 h-3.5 text-accent flex-shrink-0" /> : <Layers className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                <span>{getPricingDisplay()}</span>
            </div>
            {product.releaseDate && (
                <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-accent" />
                    <span>
                        {product.status === 'Upcoming' ? 'Expected: ' : 'Released: '} 
                        {format(new Date(product.releaseDate), "MMM d, yyyy")}
                    </span>
                </div>
            )}
             {product.couponDetails && (
                <div className="flex items-start gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Coupon: {product.couponDetails}</span>
                </div>
            )}
            {product.activationDetails && (
                <div className="flex items-start gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                    <span>Activation: {product.activationDetails}</span>
                </div>
            )}
        </div>
      </CardContent>
      <CardFooter className="pt-4">
        {onViewDetailsClick ? (
            <Button 
                variant="link" 
                className="text-accent p-0 hover:text-foreground" 
                onClick={() => onViewDetailsClick(product)}
            >
                View Details <Eye className="ml-2 w-4 h-4" />
            </Button>
        ) : product.productUrl ? (
            <Button asChild variant="link" className="text-accent p-0 hover:text-foreground">
                <Link href={product.productUrl} target="_blank" rel="noopener noreferrer">
                    View Details <ExternalLink className="ml-2 w-4 h-4" />
                </Link>
            </Button>
        ) : (
             <span className="text-sm text-muted-foreground italic">Details unavailable</span>
        )}
      </CardFooter>
    </Card>
  );
}
