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

interface Product {
  id: string;
  name: string;
  description: string;
  price_small: number | null;
  price_medium: number | null;
  price_large: number | null;
  image_url: string | null;
  category: string;
  customizations: string[] | null;
}

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState<
    "small" | "medium" | "large" | null
  >(
    product.price_small
      ? "small"
      : product.price_medium
      ? "medium"
      : product.price_large
      ? "large"
      : null
  );

  const getPrice = (size: "small" | "medium" | "large" | null) => {
    if (size === "small") return product.price_small;
    if (size === "medium") return product.price_medium;
    if (size === "large") return product.price_large;
    return null;
  };

  const currentPrice = getPrice(selectedSize);

  const imageSrc =
    product.image_url ||
    (product.category === "crepe-cake"
      ? "/unnamed.jpg"
      : `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(
          product.name
        )}`);

  const handleAddToCart = () => {
    if (
      !selectedSize &&
      (product.price_small || product.price_medium || product.price_large)
    ) {
      toast({
        title: "Please select a size",
        variant: "destructive",
      });
      return;
    }

    const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");

    const existingIndex = currentCart.findIndex(
      (item: any) => item.id === product.id && item.size === selectedSize
    );

    if (existingIndex !== -1) {
      currentCart[existingIndex].quantity =
        (currentCart[existingIndex].quantity || 0) + 1;
    } else {
      currentCart.push({
        id: product.id,
        name: product.name,
        price: currentPrice,
        size: selectedSize,
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
      <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className="object-cover"
          priority
        />
      </div>

      <Card className="bg-card shadow-sm">
        <CardContent className="flex flex-col gap-6 p-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">
                {product.category === "crepe-cake" ? "Crepe Cake" : "Cookie"}
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

          <div className="space-y-4">
            <div className="font-medium">Select Size</div>
            <RadioGroup
              value={selectedSize || ""}
              onValueChange={(val) =>
                setSelectedSize(val as "small" | "medium" | "large")
              }
              className="flex flex-col space-y-1"
            >
              {product.price_small && (
                <div className="flex items-center space-x-2 border rounded p-3 cursor-pointer hover:bg-accent transition-colors duration-200 has-[data-state=checked]:bg-accent has-[data-state=checked]:border-primary">
                  <RadioGroupItem value="small" id="small" />
                  <Label htmlFor="small" className="flex-1 cursor-pointer">
                    Small - ${product.price_small.toFixed(2)}
                  </Label>
                </div>
              )}
              {product.price_medium && (
                <div className="flex items-center space-x-2 border rounded p-3 cursor-pointer hover:bg-accent transition-colors duration-200 has-[data-state=checked]:bg-accent has-[data-state=checked]:border-primary">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium" className="flex-1 cursor-pointer">
                    Medium - ${product.price_medium.toFixed(2)}
                  </Label>
                </div>
              )}
              {product.price_large && (
                <div className="flex items-center space-x-2 border rounded p-3 cursor-pointer hover:bg-accent transition-colors duration-200 has-[data-state=checked]:bg-accent has-[data-state=checked]:border-primary">
                  <RadioGroupItem value="large" id="large" />
                  <Label htmlFor="large" className="flex-1 cursor-pointer">
                    Large - ${product.price_large.toFixed(2)}
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

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
