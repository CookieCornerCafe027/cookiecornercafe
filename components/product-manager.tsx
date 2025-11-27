"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  description: string
  price_small: number | null
  price_medium: number | null
  price_large: number | null
  image_url: string | null
  category: string
  customizations: string[] | null
  is_active: boolean
}

interface ProductManagerProps {
  products: Product[]
}

export function ProductManager({ products: initialProducts }: ProductManagerProps) {
  const [products, setProducts] = useState(initialProducts)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_small: "",
    price_medium: "",
    price_large: "",
    image_url: "",
    category: "crepe-cake",
    customizations: "",
    is_active: true,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price_small: "",
      price_medium: "",
      price_large: "",
      image_url: "",
      category: "crepe-cake",
      customizations: "",
      is_active: true,
    })
    setEditingProduct(null)
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || "",
      price_small: product.price_small?.toString() || "",
      price_medium: product.price_medium?.toString() || "",
      price_large: product.price_large?.toString() || "",
      image_url: product.image_url || "",
      category: product.category,
      customizations: product.customizations?.join(", ") || "",
      is_active: product.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    const productData = {
      name: formData.name,
      description: formData.description,
      price_small: formData.price_small ? Number.parseFloat(formData.price_small) : null,
      price_medium: formData.price_medium ? Number.parseFloat(formData.price_medium) : null,
      price_large: formData.price_large ? Number.parseFloat(formData.price_large) : null,
      image_url: formData.image_url || null,
      category: formData.category,
      customizations: formData.customizations
        ? formData.customizations
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean)
        : null,
      is_active: formData.is_active,
    }

    try {
      if (editingProduct) {
        // Update existing product
        const { error } = await supabase.from("products").update(productData).eq("id", editingProduct.id)

        if (error) throw error
      } else {
        // Create new product
        const { error } = await supabase.from("products").insert(productData)

        if (error) throw error
      }

      setIsDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (error) {
      console.error("Error saving product:", error)
      alert("Failed to save product")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    const supabase = createClient()
    try {
      const { error } = await supabase.from("products").delete().eq("id", id)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("Failed to delete product")
    }
  }

  return (
    <div className="space-y-4">
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
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
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crepe-cake">Crepe Cake</SelectItem>
                  <SelectItem value="cookie">Cookie</SelectItem>
                  <SelectItem value="pastry">Pastry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price_small">Small Price</Label>
                <Input
                  id="price_small"
                  type="number"
                  step="0.01"
                  value={formData.price_small}
                  onChange={(e) => setFormData({ ...formData, price_small: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price_medium">Medium Price</Label>
                <Input
                  id="price_medium"
                  type="number"
                  step="0.01"
                  value={formData.price_medium}
                  onChange={(e) => setFormData({ ...formData, price_medium: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price_large">Large Price</Label>
                <Input
                  id="price_large"
                  type="number"
                  step="0.01"
                  value={formData.price_large}
                  onChange={(e) => setFormData({ ...formData, price_large: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customizations">Customizations (comma-separated)</Label>
              <Input
                id="customizations"
                placeholder="Extra strawberries, Matcha drizzle, Gold leaf"
                value={formData.customizations}
                onChange={(e) => setFormData({ ...formData, customizations: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active (visible to customers)</Label>
            </div>

            <Button type="submit" className="w-full">
              {editingProduct ? "Update Product" : "Add Product"}
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
                      className={`text-xs px-2 py-1 rounded ${product.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                  <div className="flex gap-4 text-sm">
                    <span>Category: {product.category}</span>
                    {product.price_small && <span>S: ${product.price_small}</span>}
                    {product.price_medium && <span>M: ${product.price_medium}</span>}
                    {product.price_large && <span>L: ${product.price_large}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEditDialog(product)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
