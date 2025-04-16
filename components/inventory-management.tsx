"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Save, X, Tag, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { deleteProduct } from "@/services/product-service"
import type { Product } from "@/types/pos-types"

interface InventoryManagementProps {
  products: Product[]
  onProductsChange: (products: Product[]) => void
}

export default function InventoryManagement({ products, onProductsChange }: InventoryManagementProps) {
  const [activeTab, setActiveTab] = useState("products")
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isDeleting, setIsDeleting] = useState(false)

  // New product form state
  const [newProduct, setNewProduct] = useState<{
    name: string
    price: string
    category: string
    newCategory: string
    imageUrl: string
    barcode: string
    tags: string[]
    currentTag: string
    quickAdd: boolean
    customPrice: boolean
  }>({
    name: "",
    price: "",
    category: "",
    newCategory: "",
    imageUrl: "",
    barcode: "",
    tags: [],
    currentTag: "",
    quickAdd: false,
    customPrice: false,
  })

  // Get unique categories from products
  const categories = Array.from(new Set(products.map((p) => p.category)))

  // Filter products based on search query and selected category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchQuery))
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const resetNewProductForm = () => {
    setNewProduct({
      name: "",
      price: "",
      category: "",
      newCategory: "",
      imageUrl: "",
      barcode: "",
      tags: [],
      currentTag: "",
      quickAdd: false,
      customPrice: false,
    })
  }

  const handleAddTag = () => {
    if (newProduct.currentTag.trim() && !newProduct.tags.includes(newProduct.currentTag.trim())) {
      setNewProduct({
        ...newProduct,
        tags: [...newProduct.tags, newProduct.currentTag.trim()],
        currentTag: "",
      })
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setNewProduct({
      ...newProduct,
      tags: newProduct.tags.filter((tag) => tag !== tagToRemove),
    })
  }

  const handleSaveProduct = () => {
    if (!newProduct.name || !newProduct.price) return

    const price = Number.parseFloat(newProduct.price)
    if (isNaN(price) || price < 0) return

    // Determine which category to use
    const category = newProduct.newCategory.trim() ? newProduct.newCategory.trim() : newProduct.category

    // If custom price is selected, set price to 0
    const finalPrice = newProduct.customPrice ? 0 : price

    const productToSave: Product = {
      id: editingProduct ? editingProduct.id : `p-${Date.now()}`,
      name: newProduct.name.trim(),
      price: finalPrice,
      category: newProduct.customPrice ? "custom-price" : category,
      imageUrl: newProduct.imageUrl || "/placeholder.svg?height=100&width=100",
      barcode: newProduct.barcode.trim() || undefined,
      stock: 0, // Default stock to 0 as per requirement
      quickAdd: newProduct.quickAdd,
      tags: newProduct.tags,
    }

    if (editingProduct) {
      // Update existing product
      onProductsChange(products.map((p) => (p.id === editingProduct.id ? productToSave : p)))
      toast({
        title: "Product Updated",
        description: `${productToSave.name} has been updated.`,
      })
    } else {
      // Add new product
      onProductsChange([...products, productToSave])
      toast({
        title: "Product Added",
        description: `${productToSave.name} has been added to inventory.`,
      })
    }

    setIsAddProductOpen(false)
    setEditingProduct(null)
    resetNewProductForm()
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setNewProduct({
      name: product.name,
      price: product.customPrice ? "0" : product.price.toString(),
      category: product.category === "custom-price" ? "" : product.category,
      newCategory: "",
      imageUrl: product.imageUrl,
      barcode: product.barcode || "",
      tags: product.tags || [],
      currentTag: "",
      quickAdd: !!product.quickAdd,
      customPrice: product.category === "custom-price",
    })
    setIsAddProductOpen(true)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setIsDeleting(true)
      try {
        // Delete from Supabase
        const success = await deleteProduct(productId)

        if (success) {
          // Update local state
          onProductsChange(products.filter((p) => p.id !== productId))
          toast({
            title: "Product Deleted",
            description: "The product has been removed from inventory.",
          })
        } else {
          throw new Error("Failed to delete product")
        }
      } catch (error) {
        console.error("Error deleting product:", error)
        toast({
          title: "Error",
          description: "Failed to delete product. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-md border border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 bg-slate-50">
          <CardTitle>Inventory Management</CardTitle>
          <Button
            onClick={() => {
              resetNewProductForm()
              setEditingProduct(null)
              setIsAddProductOpen(true)
            }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 bg-slate-100 p-1 rounded-md">
              <TabsTrigger
                value="products"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                Products
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                Categories
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-2 mb-4">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm border-slate-300 focus:border-slate-400 focus:ring-slate-400"
              />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px] border-slate-300">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="products" className="space-y-4">
              <div className="border border-slate-200 rounded-md shadow-sm">
                <div className="grid grid-cols-12 font-medium p-3 border-b bg-slate-100">
                  <div className="col-span-1">Image</div>
                  <div className="col-span-3">Name</div>
                  <div className="col-span-1">Price</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-3">Tags</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <div key={product.id} className="grid grid-cols-12 p-3 items-center hover:bg-slate-50">
                        <div className="col-span-1">
                          <div className="w-10 h-10 rounded-md bg-slate-100 overflow-hidden border border-slate-200">
                            <img
                              src={product.imageUrl || "/placeholder.svg"}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="col-span-3">
                          <div className="font-medium">{product.name}</div>
                          {product.barcode && <div className="text-xs text-slate-500">SKU: {product.barcode}</div>}
                        </div>
                        <div className="col-span-1">
                          {product.category === "custom-price" ? (
                            <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                              Custom
                            </Badge>
                          ) : (
                            <span className="font-medium">${product.price.toFixed(2)}</span>
                          )}
                        </div>
                        <div className="col-span-2">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 border border-slate-200">
                            {product.category}
                          </Badge>
                          {product.quickAdd && (
                            <Badge className="ml-1 bg-emerald-500 hover:bg-emerald-600">Quick</Badge>
                          )}
                        </div>
                        <div className="col-span-3 flex flex-wrap gap-1">
                          {product.tags?.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs border-slate-200 bg-slate-50 text-slate-700"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {!product.tags?.length && <span className="text-xs text-slate-500">No tags</span>}
                        </div>
                        <div className="col-span-2 flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-slate-100 text-slate-700"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-500">
                      No products found. Add some products to get started.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="categories">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => {
                  const categoryProducts = products.filter((p) => p.category === category)
                  return (
                    <Card
                      key={category}
                      className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-2 bg-slate-50 border-b border-slate-200">
                        <CardTitle className="text-lg">{category}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-500">{categoryProducts.length} products</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Product name"
                  className="border-slate-300 focus:border-slate-400 focus:ring-slate-400"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="0.00"
                  disabled={newProduct.customPrice}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newProduct.category}
                  onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                  disabled={newProduct.customPrice}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newCategory">Or Add New Category</Label>
                <Input
                  id="newCategory"
                  value={newProduct.newCategory}
                  onChange={(e) => setNewProduct({ ...newProduct, newCategory: e.target.value })}
                  placeholder="New category name"
                  disabled={newProduct.customPrice}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode/SKU (Optional)</Label>
                <Input
                  id="barcode"
                  value={newProduct.barcode}
                  onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                  placeholder="Barcode or SKU"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                <Input
                  id="imageUrl"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {newProduct.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newProduct.currentTag}
                  onChange={(e) => setNewProduct({ ...newProduct, currentTag: e.target.value })}
                  placeholder="Add a tag"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  <Tag className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="quickAdd"
                  checked={newProduct.quickAdd}
                  onCheckedChange={(checked) => setNewProduct({ ...newProduct, quickAdd: checked })}
                />
                <Label htmlFor="quickAdd">Quick Add Product</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="customPrice"
                  checked={newProduct.customPrice}
                  onCheckedChange={(checked) =>
                    setNewProduct({
                      ...newProduct,
                      customPrice: checked,
                      price: checked ? "0" : newProduct.price,
                    })
                  }
                />
                <Label htmlFor="customPrice">Custom Price Product</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddProductOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProduct} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="mr-2 h-4 w-4" />
              {editingProduct ? "Update Product" : "Save Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
