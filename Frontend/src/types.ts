export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  uom: string;
  reorderLevel: number;
  description: string;
};

export type Warehouse = {
  id: string;
  name: string;
  location: string;
  parentId?: string;
  type?: 'Warehouse' | 'Rack' | 'Bin';
};

export type Stock = {
  productId: string;
  warehouseId: string;
  quantity: number;
  product?: Product;
  warehouse?: Warehouse;
};

export type OperationType = "Receipt" | "Delivery" | "Internal" | "Adjustment";
export type OperationStatus = "Draft" | "Waiting" | "Ready" | "Done" | "Canceled";

export type OperationItem = {
  productId: string;
  quantity: number;
};

export type Operation = {
  id: string;
  type: OperationType;
  status: OperationStatus;
  date: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  items: OperationItem[];
  description?: string;
};

export type Role = "Admin" | "Manager" | "Staff";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
};

export type DashboardStats = {
  totalProducts: number;
  totalStock: number;
  lowStockItems: number;
  pendingReceipts: number;
  pendingDeliveries: number;
};
