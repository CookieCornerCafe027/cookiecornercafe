"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/utils";

interface SizeOption {
  label: string;
  price: number;
}

interface Product {
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
}

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Use new size_options format or fallback to legacy fields
  const sizeOptions = product.size_options && product.size_options.length > 0
    ? product.size_options.map((opt, idx) => ({
        index: idx,
        label: opt.label,
        price: opt.price,
      }))
    : [
        product.price_small ? { 
          index: 0,
          label: product.size_small_label || "Option 1",
          price: product.price_small 
        } : null,
        product.price_medium ? { 
          index: 1,
          label: product.size_medium_label || "Option 2",
          price: product.price_medium 
        } : null,
        product.price_large ? { 
          index: 2,
          label: product.size_large_label || "Option 3",
          price: product.price_large 
        } : null,
      ].filter((opt): opt is NonNullable<typeof opt> => opt !== null);
  
  const hasSizes = sizeOptions.length > 0;
  const hasMultipleSizes = sizeOptions.length > 1;
  
  // Auto-select first available size
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number | null>(
    sizeOptions.length > 0 ? sizeOptions[0].index : null
  );

  const rawImages = product.image_urls || [];
  const images =
    rawImages.map((url) =>
      getOptimizedImageUrl(url, { width: 1400, quality: 78, format: "webp" }) ?? url
    );
  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getSelectedOption = () => {
    if (selectedSizeIndex === null) return null;
    return sizeOptions.find(opt => opt.index === selectedSizeIndex) || null;
  };
  
  const selectedOption = getSelectedOption();
  const currentPrice = selectedOption?.price || null;


  const handleAddToCart = () => {
    // Only require size selection if there are multiple sizes
    if (hasMultipleSizes && selectedSizeIndex === null) {
      toast({
        title: "Please select a size",
        variant: "destructive",
      });
      return;
    }

    const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");

    const existingIndex = currentCart.findIndex(
      (item: any) => item.id === product.id && item.sizeIndex === selectedSizeIndex
    );

    if (existingIndex !== -1) {
      currentCart[existingIndex].quantity =
        (currentCart[existingIndex].quantity || 0) + 1;
    } else {
      currentCart.push({
        id: product.id,
        name: product.name,
        price: currentPrice,
        sizeIndex: selectedSizeIndex,
        sizeLabel: selectedOption?.label || null,
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(currentCart));

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cartUpdated"));
    }

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-4">
        {images.length > 0 ? (
          <>
            {/* Main image */}
            <div className="aspect-square relative bg-muted rounded-lg overflow-hidden group">
              <Image
                src={images[currentImageIndex]}
                alt={`${product.name} - Image ${currentImageIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />

              {/* Navigation arrows for multiple images */}
              {hasMultipleImages && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={previousImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Image counter */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail navigation */}
            {hasMultipleImages && (
              <div className="grid grid-cols-4 gap-2">
                {rawImages.map((image, index) => {
                  const thumbnailUrl =
                    getOptimizedImageUrl(image, {
                      width: 320,
                      quality: 70,
                      format: "webp",
                    }) ?? image;

                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-square relative bg-muted rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-primary/50"
                      }`}
                    >
                      <Image
                        src={thumbnailUrl}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 20vw, 10vw"
                        className="object-cover"
                        loading="lazy"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="aspect-square relative bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            <p className="text-muted-foreground">No image available</p>
          </div>
        )}
      </div>

      <Card className="bg-card shadow-sm">
        <CardContent className="flex flex-col gap-6 p-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">
                {product.category === "cake" ? "Cake" : product.category === "cookie" ? "Cookie" : "Pastry"}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-primary">
              {product.name}
            </h1>
            <p className="text-2xl font-semibold mt-2">
              {currentPrice ? `$${currentPrice.toFixed(2)}` : "Price varies"}
            </p>
          </div>

          <div className="prose text-muted-foreground">
            <p>{product.description}</p>
          </div>

          {hasSizes && hasMultipleSizes && (
            <div className="space-y-4">
              <div className="font-medium">Select Size</div>
              <RadioGroup
                value={selectedSizeIndex?.toString() || ""}
                onValueChange={(val) => setSelectedSizeIndex(Number(val))}
                className="flex flex-col space-y-1"
              >
                {sizeOptions.map((option) => (
                  <div 
                    key={option.index}
                    className="flex items-center space-x-2 border rounded p-3 cursor-pointer hover:bg-accent transition-colors duration-200 has-[data-state=checked]:bg-accent has-[data-state=checked]:border-primary"
                  >
                    <RadioGroupItem value={option.index.toString()} id={`size-${option.index}`} />
                    <Label htmlFor={`size-${option.index}`} className="flex-1 cursor-pointer">
                      {option.label} - ${option.price.toFixed(2)}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
          
          {hasSizes && !hasMultipleSizes && sizeOptions[0].label && (
            <div className="text-sm text-muted-foreground">
              Size: {sizeOptions[0].label}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            You can add custom instructions (writing on cakes, allergies,
            delivery notes) on the checkout page.
          </p>

          <Button
            size="lg"
            className="w-full md:w-auto"
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
