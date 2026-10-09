import { createStore } from "zustand/vanilla";
import { MOCK_PRODUCTS } from "./mock-data";
import { CreateProductInputSchema, ProductSchema, type CreateProductInput } from "./schemas/product.schema";
import type { Product, ProductStatus } from "./types";

interface ProductsState {
  products: Product[];
}

type ProductInput = Omit<CreateProductInput, "unitPrice" | "initialStock"> &
  Partial<Pick<CreateProductInput, "unitPrice" | "initialStock">>;

interface ProductsActions {
  addProduct: (data: ProductInput) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  recordMovement: (productId: string, type: "in" | "out", quantity: number, reference: string, note?: string) => void;
}

export type ProductsStore = ProductsState & ProductsActions;

function calculateStatus(currentStock: number, minStock: number): ProductStatus {
  if (currentStock <= 0) return "out_of_stock";
  if (currentStock <= minStock) return "low_stock";
  return "in_stock";
}

export function createProductsStore() {
  return createStore<ProductsStore>()((set, get) => ({
    // ponytail: session-only mock catalog; replace seeds/actions when real data access exists.
    products: structuredClone(MOCK_PRODUCTS),
    addProduct: (data) => {
      const parsed = CreateProductInputSchema.safeParse({
        ...data,
        unitPrice: data.unitPrice ?? 0,
        initialStock: data.initialStock ?? 0,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const input = parsed.data;
      if (!input.name.trim() || !input.category.trim() || !input.unit.trim()) {
        throw new Error("Name, category, and unit are required.");
      }
      if (input.sku.trim().length < 3) throw new Error("SKU must be at least 3 characters.");
      const now = new Date().toISOString();
      const product: Product = {
        id: `prod-${crypto.randomUUID()}`,
        name: input.name.trim(),
        sku: input.sku.trim().toUpperCase(),
        category: input.category,
        unit: input.unit,
        unitPrice: input.unitPrice,
        currentStock: input.initialStock,
        minStock: input.minStock,
        status: calculateStatus(input.initialStock, input.minStock),
        description: input.description ?? "",
        supplier: input.supplier || "Internal Supplier",
        lastRestocked: "Just now",
        createdAt: now.split("T")[0],
        movementLogs: input.initialStock > 0 ? [{
          id: `log-${crypto.randomUUID()}`,
          type: "in",
          quantity: input.initialStock,
          reference: "INIT-STOCK",
          timestamp: now.replace("T", " ").substring(0, 16),
          performedBy: "Alex Morgan",
          note: "Initial registered inventory.",
        }] : [],
      };
      set((state) => ({ products: [product, ...state.products] }));
      return product;
    },
    updateProduct: (id, updates) => {
      const current = get().products.find((product) => product.id === id);
      if (!current) throw new Error("Product no longer exists.");
      const parsed = ProductSchema.safeParse({ ...current, ...updates, id });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const product = parsed.data;
      if (!product.name.trim() || !product.category.trim() || !product.unit.trim()) {
        throw new Error("Name, category, and unit are required.");
      }
      if (product.sku.trim().length < 3) throw new Error("SKU must be at least 3 characters.");
      const updated = { ...product, name: product.name.trim(), sku: product.sku.trim().toUpperCase(), status: calculateStatus(product.currentStock, product.minStock) };
      set((state) => ({ products: state.products.map((product) => product.id === id ? updated : product) }));
    },
    deleteProduct: (id) => {
      if (!get().products.some((product) => product.id === id)) throw new Error("Product no longer exists.");
      set((state) => ({ products: state.products.filter((product) => product.id !== id) }));
    },
    recordMovement: (productId, type, quantity, reference, note) => {
      const current = get().products.find((product) => product.id === productId);
      if (!current) throw new Error("Product no longer exists.");
      if ((type !== "in" && type !== "out") || !Number.isSafeInteger(quantity) || quantity <= 0) {
        throw new Error("Movement quantity must be a positive integer.");
      }
      if (!reference.trim()) throw new Error("Reference is required.");
      if (type === "out" && quantity > current.currentStock) throw new Error("Insufficient stock.");
      const stock = current.currentStock + (type === "in" ? quantity : -quantity);
      if (!Number.isSafeInteger(stock)) throw new Error("Stock exceeds supported quantity.");
      const log = {
        id: `log-${crypto.randomUUID()}`,
        type,
        quantity,
        reference,
        note,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
        performedBy: "Alex Morgan",
      };
      set((state) => ({ products: state.products.map((product) => product.id !== productId ? product : {
        ...product,
        currentStock: stock,
        status: calculateStatus(stock, product.minStock),
        lastRestocked: type === "in" ? "Just now" : product.lastRestocked,
        movementLogs: [log, ...(product.movementLogs ?? [])],
      }) }));
    },
  }));
}
