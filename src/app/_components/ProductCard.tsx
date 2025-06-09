
import type { Product } from '@/lib/schemas/product-schemas';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Image import removed
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, DollarSign, Users, CalendarDays, CheckCircle, Zap, Package } from 'lucide-react';
import { format } from 'date-fns';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
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
    }
    return (
      <Badge variant="outline" className={`text-xs ${colorClass}`}>
        <Icon className="mr-1 h-3 w-3" />
        {status} {product.version && `v${product.version}`}
      </Badge>
    );
  };

  const getPricingText = (pricingType: string, pricingTerm: string) => {
    if (pricingType === 'Free') {
      return `Free - ${pricingTerm}`;
    }
    return `Paid - ${pricingTerm}`;
  };

  const getSafeLinkProps = (url: string | null | undefined): { href: string; target?: string; rel?: string } | null => {
    if (!url || url.trim() === "") return null;

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return { href: url, target: '_blank', rel: 'noopener noreferrer' };
    }
    if (url.startsWith('/')) {
      return { href: url, target: '_self' };
    }
    return { href: `https://${url}`, target: '_blank', rel: 'noopener noreferrer' };
  };

  const linkProps = getSafeLinkProps(product.productUrl);

  return (
    <Card className="layered-card flex flex-col overflow-hidden group h-full transition-all duration-300 ease-in-out hover:shadow-accent/30">
      {/* Image display section removed, replaced with a placeholder icon area */}
      <div className="relative w-full h-48 bg-muted flex items-center justify-center border-b border-border">
          <Package className="w-16 h-16 text-muted-foreground/50" />
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
      <CardContent className="flex-grow py-0">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{product.description}</p>
        <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-accent" />
                <span>{getPricingText(product.pricingType, product.pricingTerm)}</span>
            </div>
            {product.releaseDate && (
                <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-accent" />
                    <span>Released: {format(new Date(product.releaseDate), "MMM d, yyyy")}</span>
                </div>
            )}
        </div>
      </CardContent>
      <CardFooter className="pt-4">
        {linkProps ? (
          <Button asChild variant="link" className="text-accent p-0 hover:text-foreground">
            <Link href={linkProps.href} target={linkProps.target} rel={linkProps.rel}>
                View Product <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground italic">More details soon</span>
        )}
      </CardFooter>
    </Card>
  );
}
