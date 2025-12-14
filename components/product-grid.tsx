"use client";

import { ProductCard } from "./product-card";

interface Product {
  id: string;
  name: string;
  description: string;
  price_small: number | null;
  price_medium: number | null;
  price_large: number | null;
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
      const size = product.price_small
        ? "small"
        : product.price_medium
        ? "medium"
        : "large";

      const existingIndex = currentCart.findIndex(
        (item: any) => item.id === product.id && item.size === size
      );

      if (existingIndex !== -1) {
        currentCart[existingIndex].quantity =
          (currentCart[existingIndex].quantity || 0) + 1;
      } else {
        currentCart.push({
          id: product.id,
          name: product.name,
          price:
            product.price_small || product.price_medium || product.price_large,
          size,
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

  const crepeCakes = products.filter((p) => p.category === "crepe-cake");
  const cookies = products.filter((p) => p.category === "cookie");

  return (
    <div className="space-y-12">
      {crepeCakes.length > 0 && (
        <div>
          <h3 className="text-2xl font-display font-semibold mb-6 text-primary">
            Crepe Cakes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {crepeCakes.map((product) => (
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
