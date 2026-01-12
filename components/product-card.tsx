"use client";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";

interface SizeOption {
  label: string;
  price: number;
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price_small: number | null; // Legacy
    price_medium: number | null; // Legacy
    price_large: number | null; // Legacy
    size_small_label: string | null; // Legacy
    size_medium_label: string | null; // Legacy
    size_large_label: string | null; // Legacy
    size_options: SizeOption[] | null; // New flexible format
    image_urls: string[] | null;
    category: string;
    customizations: string[] | null;
  };
  onAddToCart: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // Build price display from new size_options or fallback to legacy fields
  let prices: number[] = [];
  
  if (product.size_options && product.size_options.length > 0) {
    prices = product.size_options.map(opt => opt.price);
  } else {
    prices = [
      product.price_small,
      product.price_medium,
      product.price_large,
    ].filter((p): p is number => p !== null);
  }
  
  let priceDisplay = "Price varies";
  if (prices.length === 1) {
    // Single price - show exact amount
    priceDisplay = `$${prices[0].toFixed(2)}`;
  } else if (prices.length > 1) {
    // Multiple prices - show range
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    priceDisplay = `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
  }

  // Use first image as primary image
  const primaryImage = product.image_urls?.[0];

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col pt-0">
      {/* Full-card link for reliable tapping on mobile */}
      <Link
        href={`/product/${product.id}`}
        aria-label={`View ${product.name}`}
        className="absolute inset-0 z-0"
      />

      {/* Content sits above the link; most of it passes clicks through to the link */}
      <div className="relative z-10 flex flex-col flex-1 pointer-events-none">
        {primaryImage ? (
          <div className="aspect-square relative bg-muted">
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform hover:scale-105"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            />
            {product.image_urls && product.image_urls.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                +{product.image_urls.length - 1} more
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-square relative bg-muted flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No image available</p>
          </div>
        )}

        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight">
              {product.name}
            </CardTitle>
            <Badge variant="secondary" className="shrink-0">
              {product.category === "cake" ? "Cake" : product.category === "cookie" ? "Cookie" : "Pastry"}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">
            {product.description}
          </CardDescription>
        </CardHeader>
      </div>

      <CardFooter className="relative z-10 flex items-center justify-between mt-auto pointer-events-auto">
        <span className="text-lg font-semibold text-primary">
          {priceDisplay}
        </span>
        <Button
          onClick={() => {
            onAddToCart(product.id);
          }}
        >
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
