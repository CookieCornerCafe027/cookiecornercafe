"use client";

import { ProductCard } from "./product-card";

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

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const handleAddToCart = (productId: string) => {
    const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const product = products.find((p) => p.id === productId);

    if (product) {
      // Use new size_options format or fallback to legacy fields
      let sizeIndex: number | null = null;
      let sizeLabel: string | null = null;
      let price: number | null = null;
      
      if (product.size_options && product.size_options.length > 0) {
        // Use first size option from new format
        sizeIndex = 0;
        sizeLabel = product.size_options[0].label;
        price = product.size_options[0].price;
      } else {
        // Fallback to legacy fields
        if (product.price_small) {
          sizeIndex = 0;
          sizeLabel = product.size_small_label || null;
          price = product.price_small;
        } else if (product.price_medium) {
          sizeIndex = 1;
          sizeLabel = product.size_medium_label || null;
          price = product.price_medium;
        } else if (product.price_large) {
          sizeIndex = 2;
          sizeLabel = product.size_large_label || null;
          price = product.price_large;
        }
      }
      
      // If no price found, skip adding to cart
      if (!price) return;

      const existingIndex = currentCart.findIndex(
        (item: any) => item.id === product.id && item.sizeIndex === sizeIndex
      );

      if (existingIndex !== -1) {
        currentCart[existingIndex].quantity =
          (currentCart[existingIndex].quantity || 0) + 1;
      } else {
        currentCart.push({
          id: product.id,
          name: product.name,
          price,
          sizeIndex,
          sizeLabel,
          quantity: 1,
        });
      }
      localStorage.setItem("cart", JSON.stringify(currentCart));

      // Notify header/cart UI to animate and open mini-cart
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cartUpdated"));
      }
    }
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No products available at the moment. Check back soon!
        </p>
      </div>
    );
  }

  const cakes = products.filter((p) => p.category === "cake");
  const cookies = products.filter((p) => p.category === "cookie");

  return (
    <div className="space-y-12">
      {cakes.length > 0 && (
        <div>
          <h3 className="text-2xl font-display font-semibold mb-6 text-primary">
            Cakes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cakes.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </div>
      )}

      {cookies.length > 0 && (
        <div>
          <h3 className="text-2xl font-display font-semibold mb-6 text-primary">
            Cookies & Treats
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cookies.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
