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

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price_small: number | null;
    price_medium: number | null;
    price_large: number | null;
    image_urls: string[] | null;
    category: string;
    customizations: string[] | null;
  };
  onAddToCart: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const priceDisplay = product.price_small
    ? `$${product.price_small.toFixed(2)}${
        product.price_medium ? ` - $${product.price_large?.toFixed(2)}` : ""
      }`
    : "Price varies";

  // Use first image as primary image
  const primaryImage = product.image_urls?.[0];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col pt-0">
      <Link
        href={`/product/${product.id}`}
        className="flex flex-col gap-6 flex-1"
      >
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
              {product.category === "crepe-cake" ? "Crepe Cake" : "Cookie"}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">
            {product.description}
          </CardDescription>
        </CardHeader>
      </Link>
      <CardFooter className="flex items-center justify-between mt-auto">
        <span className="text-lg font-semibold text-primary">
          {priceDisplay}
        </span>
        <Button
          onClick={(e) => {
            e.preventDefault();
            onAddToCart(product.id);
          }}
        >
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
