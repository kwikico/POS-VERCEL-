"use client"

import { useEffect, useState, useRef } from "react"
import { Plus, Pencil, Trash2, Save, Loader2 } from "lucide-react"
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
import { addProduct, updateProduct, deleteProduct } from "@/services/product-service"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useFocusTrap } from "@/hooks/use-focus-trap"
import { TagInputWithSuggestions } from "@/components/tag-input-with-suggestions"
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
  const [isSaving, setIsSaving] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [productToDeleteName, setProductToDeleteName] = useState<string>("")

  // Fallback: no-op if parent did not provide a handler
  const onProductsChangeSafe = typeof onProductsChange === "function" ? onProductsChange : () => {}

  // Use our focus trap hook for the product dialog
  const productDialogRef = useFocusTrap(isAddProductOpen)

  // Ref for the product name input to focus when dialog opens
  const productNameInputRef = useRef<HTMLInputElement>(null)

  // New product form state
  const [newProduct, setNewProduct] = useState<{
    name: string
    price: string
    category: string
    newCategory: string
    imageUrl: string
    barcode: string
    tags: string[]
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
    quickAdd: false,
    customPrice: false,
  })

  // Focus the product name input when the dialog opens
  useEffect(() => {
    if (isAddProductOpen && productNameInputRef.current) {
      setTimeout(() => {
        productNameInputRef.current?.focus()
      }, 100)
    }
  }, [isAddProductOpen])

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
      quickAdd: false,
      customPrice: false,
    })
  }

  const handleSaveProduct = async () => {
    console.log("=== SAVE PRODUCT DEBUG ===")
    console.log("Form data:", newProduct)
    console.log("Editing product:", editingProduct)

    // Validation
    if (!newProduct.name.trim()) {
      console.error("Validation failed: Product name is required")
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive",
      })
      return
    }

    if (
      !newProduct.customPrice &&
      (!newProduct.price || isNaN(Number(newProduct.price)) || Number(newProduct.price) < 0)
    ) {
      console.error("Validation failed: Valid price is required")
      toast({
        title: "Validation Error",
        description: "Valid price is required",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const price = newProduct.customPrice ? 0 : Number.parseFloat(newProduct.price)

      // Determine which category to use
      const category = newProduct.newCategory.trim()
        ? newProduct.newCategory.trim()
        : newProduct.category || "Uncategorized"

      const finalCategory = newProduct.customPrice ? "custom-price" : category

      const productData: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
        name: newProduct.name.trim(),
        price: price,
        category: finalCategory,
        imageUrl: newProduct.imageUrl || "/placeholder.svg?height=100&width=100",
        barcode: newProduct.barcode.trim() || undefined,
        stock: 0,
        quickAdd: newProduct.quickAdd,
        tags: newProduct.tags,
        customPrice: newProduct.customPrice,
      }

      console.log("Product data to save:", productData)

      if (editingProduct) {
        // Update existing product
        console.log("Updating existing product with ID:", editingProduct.id)

        const { data: updatedProduct, error } = await updateProduct(editingProduct.id, productData)

        if (error) {
          console.error("Update product error:", error)
          throw new Error(error.message)
        }

        if (updatedProduct) {
          console.log("Product updated successfully:", updatedProduct)

          // Update local state
          const updatedProducts = products.map((p) => (p.id === editingProduct.id ? updatedProduct : p))
          onProductsChangeSafe(updatedProducts)

          toast({
            title: "Product Updated",
            description: `${updatedProduct.name} has been updated successfully.`,
          })
        }
      } else {
        // Add new product
        console.log("Adding new product")

        const { data: newProductResult, error } = await addProduct(productData)

        if (error) {
          console.error("Add product error:", error)
          throw new Error(error.message)
        }

        if (newProductResult) {
          console.log("Product added successfully:", newProductResult)

          // Update local state
          onProductsChangeSafe([...products, newProductResult])

          toast({
            title: "Product Added",
            description: `${newProductResult.name} has been added to inventory successfully.`,
          })
        }
      }

      // Close dialog and reset form
      setIsAddProductOpen(false)
      setEditingProduct(null)
      resetNewProductForm()
    } catch (error) {
      console.error("Save product error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditProduct = (product: Product) => {
    console.log("Editing product:", product)
    setEditingProduct(product)
    setNewProduct({
      name: product.name,
      price: product.customPrice ? "0" : product.price.toString(),
      category: product.category === "custom-price" ? "" : product.category,
      newCategory: "",
      imageUrl: product.imageUrl || "",
      barcode: product.barcode || "",
      tags: product.tags || [],
      quickAdd: !!product.quickAdd,
      customPrice: product.category === "custom-price" || !!product.customPrice,
    })
    setIsAddProductOpen(true)
  }

  const handleDeleteClick = (productId: string, productName: string) => {
    setProductToDelete(productId)
    setProductToDeleteName(productName)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    setIsDeleting(true)
    try {
      console.log("Deleting product:", productToDelete)

      const { data: success, error } = await deleteProduct(productToDelete)

      if (error) {
        console.error("Delete product error:", error)
        throw new Error(error.message)
      }

      if (success) {
        console.log("Product deleted successfully")

        // Update local state
        onProductsChangeSafe(products.filter((p) => p.id !== productToDelete))

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
        description: error instanceof Error ? error.message : "Failed to delete product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteConfirmOpen(false)
      setProductToDelete(null)
      setProductToDeleteName("")
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
            aria-label="Add new product"
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
                aria-label="Search products by name or barcode"
              />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px] border-slate-300" aria-label="Filter by category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories
                    .filter((category) => category !== "")
                    .map((category) => (
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
                              alt={`${product.name} product image`}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        </div>
                        <div className="col-span-3">
                          <div className="font-medium">{product.name}</div>
                          {product.barcode && (
                            <div className="text-xs text-slate-700 font-mono">SKU: {product.barcode}</div>
                          )}
                        </div>
                        <div className="col-span-1">
                          {product.category === "custom-price" || product.customPrice ? (
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
                            aria-label={`Edit ${product.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => handleDeleteClick(product.id, product.name)}
                            disabled={isDeleting}
                            aria-label={`Delete ${product.name}`}
                          >
                            {isDeleting && productToDelete === product.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-500" aria-live="polite">
                      No products found. Add some products to get started.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="categories">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories
                  .filter((category) => category !== "")
                  .map((category) => {
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
      <Dialog
        open={isAddProductOpen}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            setIsAddProductOpen(false)
            setEditingProduct(null)
            resetNewProductForm()
          }
        }}
      >
        <DialogContent
          className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
          aria-describedby="product-form-desc"
          ref={productDialogRef}
          onEscapeKeyDown={(e) => {
            if (isSaving) {
              e.preventDefault()
            }
          }}
          onPointerDownOutside={(e) => {
            if (isSaving) {
              e.preventDefault()
            }
          }}
        >
          <p id="product-form-desc" className="sr-only">
            Use this form to {editingProduct ? "edit an existing" : "add a new"} product to inventory. Fill in the
            required fields marked with an asterisk and press Save when done.
          </p>
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
                  ref={productNameInputRef}
                  aria-required="true"
                  disabled={isSaving}
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
                  disabled={newProduct.customPrice || isSaving}
                  required={!newProduct.customPrice}
                  aria-required={!newProduct.customPrice}
                  aria-disabled={newProduct.customPrice || isSaving}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newProduct.category || ""}
                  onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                  disabled={newProduct.customPrice || isSaving}
                >
                  <SelectTrigger id="category" aria-disabled={newProduct.customPrice || isSaving}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((category) => category !== "")
                      .map((category) => (
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
                  disabled={newProduct.customPrice || isSaving}
                  aria-disabled={newProduct.customPrice || isSaving}
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
                  aria-label="Barcode or SKU (optional)"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                <Input
                  id="imageUrl"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  aria-label="Image URL (optional)"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Enhanced Tag Input with Suggestions */}
            <TagInputWithSuggestions
              tags={newProduct.tags}
              onTagsChange={(tags) => setNewProduct({ ...newProduct, tags })}
              disabled={isSaving}
              placeholder="Add a tag"
              label="Tags"
            />

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="quickAdd"
                  checked={newProduct.quickAdd}
                  onCheckedChange={(checked) => !isSaving && setNewProduct({ ...newProduct, quickAdd: checked })}
                  aria-label="Add to Quick Access buttons"
                  disabled={isSaving}
                />
                <Label htmlFor="quickAdd">Quick Add Product</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="customPrice"
                  checked={newProduct.customPrice}
                  onCheckedChange={(checked) =>
                    !isSaving &&
                    setNewProduct({
                      ...newProduct,
                      customPrice: checked,
                      price: checked ? "0" : newProduct.price,
                    })
                  }
                  aria-label="Set as custom price product"
                  disabled={isSaving}
                />
                <Label htmlFor="customPrice">Custom Price Product</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (!isSaving) {
                  setIsAddProductOpen(false)
                  setEditingProduct(null)
                  resetNewProductForm()
                }
              }}
              aria-label="Cancel and close dialog"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProduct}
              className="bg-emerald-600 hover:bg-emerald-700"
              aria-label={editingProduct ? "Update product" : "Save new product"}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingProduct ? "Updating..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {editingProduct ? "Update Product" : "Save Product"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteConfirmOpen(false)
            setProductToDelete(null)
            setProductToDeleteName("")
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        description={`Are you sure you want to delete "${productToDeleteName}"? This action cannot be undone.`}
        confirmText="Delete Product"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
