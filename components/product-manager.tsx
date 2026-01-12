"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Upload, X, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface SizeOption {
  label: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price_small: number | null; // Legacy - kept for backward compatibility
  price_medium: number | null; // Legacy
  price_large: number | null; // Legacy
  size_small_label: string | null; // Legacy
  size_medium_label: string | null; // Legacy
  size_large_label: string | null; // Legacy
  size_options: SizeOption[] | null; // New flexible format
  image_urls: string[] | null;
  category: string;
  customizations: string[] | null;
  is_active: boolean;
}

interface ProductManagerProps {
  products: Product[];
}

export function ProductManager({
  products: initialProducts,
}: ProductManagerProps) {
  const [products, setProducts] = useState(initialProducts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const router = useRouter();

  // Sync local state when initialProducts prop changes (e.g., after router.refresh())
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "cake",
    customizations: "",
    is_active: true,
  });
  
  const [sizeOptions, setSizeOptions] = useState<Array<{ label: string; price: string }>>([]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "cake",
      customizations: "",
      is_active: true,
    });
    setSizeOptions([]);
    setEditingProduct(null);
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImageUrls([]);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      category: product.category,
      customizations: product.customizations?.join(", ") || "",
      is_active: product.is_active,
    });
    
    // Load size options from new format or migrate from legacy fields
    if (product.size_options && product.size_options.length > 0) {
      setSizeOptions(
        product.size_options.map(opt => ({
          label: opt.label,
          price: opt.price.toString(),
        }))
      );
    } else {
      // Migrate from legacy fields
      const legacySizes = [];
      if (product.price_small) {
        legacySizes.push({
          label: product.size_small_label || "",
          price: product.price_small.toString(),
        });
      }
      if (product.price_medium) {
        legacySizes.push({
          label: product.size_medium_label || "",
          price: product.price_medium.toString(),
        });
      }
      if (product.price_large) {
        legacySizes.push({
          label: product.size_large_label || "",
          price: product.price_large.toString(),
        });
      }
      setSizeOptions(legacySizes);
    }
    
    setExistingImageUrls(product.image_urls || []);
    setImageFiles([]);
    setImagePreviews([]);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not an image file`);
        continue;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large (max 5MB)`);
        continue;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setImagePreviews([...imagePreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }

    setImageFiles([...imageFiles, ...validFiles]);
  };

  const removeNewImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls(existingImageUrls.filter((_, i) => i !== index));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const supabase = createClient();

    // Create a unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()
      .toString(36)
      .substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    try {
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map((file) => uploadImage(file));
    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    const supabase = createClient();

    try {
      let allImageUrls = [...existingImageUrls];

      // Upload new images if selected
      if (imageFiles.length > 0) {
        const uploadedUrls = await uploadMultipleImages(imageFiles);
        if (uploadedUrls.length !== imageFiles.length) {
          alert("Some images failed to upload. Please try again.");
          setUploading(false);
          return;
        }
        allImageUrls = [...allImageUrls, ...uploadedUrls];
      }

      // Convert size options to proper format
      const validSizeOptions = sizeOptions
        .filter(opt => opt.label.trim() && opt.price.trim())
        .map(opt => ({
          label: opt.label.trim(),
          price: Number.parseFloat(opt.price),
        }));

      const productData = {
        name: formData.name,
        description: formData.description,
        size_options: validSizeOptions.length > 0 ? validSizeOptions : null,
        image_urls: allImageUrls.length > 0 ? allImageUrls : null,
        category: formData.category,
        customizations: formData.customizations
          ? formData.customizations
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean)
          : null,
        is_active: formData.is_active,
      };

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
      } else {
        // Create new product
        const { error } = await supabase.from("products").insert(productData);

        if (error) throw error;
      }

      setIsDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const supabase = createClient();
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) throw error;

      // Update local state immediately for instant UI feedback
      setProducts(products.filter((p) => p.id !== id));

      // Refresh server component to ensure data consistency
      router.refresh();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  return (
    <div className="space-y-4">
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Product
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cake">Cake</SelectItem>
                  <SelectItem value="cookie">Cookie</SelectItem>
                  <SelectItem value="pastry">Pastry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Size Options (Optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSizeOptions([...sizeOptions, { label: "", price: "" }])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Size
                </Button>
              </div>

              {sizeOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center border-2 border-dashed rounded-lg">
                  No size options. Product will have a single price. Click "Add Size" to add size variations.
                </p>
              ) : (
                <div className="space-y-3">
                  {sizeOptions.map((option, index) => (
                    <div key={index} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-start">
                      <div>
                        <Input
                          placeholder='Size (e.g., "6 inches")'
                          value={option.label}
                          onChange={(e) => {
                            const newOptions = [...sizeOptions];
                            newOptions[index].label = e.target.value;
                            setSizeOptions(newOptions);
                          }}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={option.price}
                          onChange={(e) => {
                            const newOptions = [...sizeOptions];
                            newOptions[index].price = e.target.value;
                            setSizeOptions(newOptions);
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSizeOptions(sizeOptions.filter((_, i) => i !== index));
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Add size options for products with variations (e.g., different cake sizes).
                Leave empty for products with a single price (e.g., cookies).
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="images">Product Images</Label>

              {/* Display existing images */}
              {existingImageUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {existingImageUrls.map((url, index) => (
                    <div
                      key={`existing-${index}`}
                      className="relative aspect-video rounded-lg overflow-hidden border"
                    >
                      <Image
                        src={url}
                        alt={`Existing ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover"
                        loading="lazy"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => removeExistingImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Display new image previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={`new-${index}`}
                      className="relative aspect-video rounded-lg overflow-hidden border border-primary"
                    >
                      <Image
                        src={preview}
                        alt={`New ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover"
                        unoptimized
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => removeNewImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                        New
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="images"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WebP (MAX. 5MB each)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {existingImageUrls.length + imagePreviews.length > 0
                        ? `${
                            existingImageUrls.length + imagePreviews.length
                          } image${
                            existingImageUrls.length + imagePreviews.length > 1
                              ? "s"
                              : ""
                          } selected`
                        : "Select multiple images"}
                    </p>
                  </div>
                  <input
                    id="images"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload multiple images. The first image will be the primary
                image shown in listings.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customizations">
                Customizations (comma-separated)
              </Label>
              <Input
                id="customizations"
                placeholder="Extra strawberries, Matcha drizzle, Gold leaf"
                value={formData.customizations}
                onChange={(e) =>
                  setFormData({ ...formData, customizations: e.target.value })
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">Active (visible to customers)</Label>
            </div>

            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading
                ? "Uploading..."
                : editingProduct
                ? "Update Product"
                : "Add Product"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        product.is_active
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {product.description}
                  </p>
                  <div className="flex gap-4 text-sm flex-wrap">
                    <span>Category: {product.category}</span>
                    {product.size_options && product.size_options.length > 0 ? (
                      product.size_options.map((option, idx) => (
                        <span key={idx}>
                          {option.label}: ${option.price.toFixed(2)}
                        </span>
                      ))
                    ) : (
                      // Fallback for legacy products
                      <>
                        {product.price_small && (
                          <span>{product.size_small_label || "Option 1"}: ${product.price_small}</span>
                        )}
                        {product.price_medium && (
                          <span>{product.size_medium_label || "Option 2"}: ${product.price_medium}</span>
                        )}
                        {product.price_large && (
                          <span>{product.size_large_label || "Option 3"}: ${product.price_large}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEditDialog(product)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
