/**
 * Types & Interfaces for Lubricación Express
 */

export interface Product {
  id: string;
  name: string;
  category: 'Aceite' | 'Filtro' | 'Bujía' | 'Aditivo' | 'Otro';
  viscosity?: string;
  brand: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
}

export interface ServiceBase {
  id: string;
  name: string;
  basePrice: number;
  isActive: boolean;
}

export interface ServicePackage {
  id: string;
  name: string;
  services: string[]; // ServiceBase IDs
  products: {
    productId: string;
    quantity: number;
  }[];
  sellPrice: number;
  isActive: boolean;
}

export interface Operator {
  id: string;
  name: string;
  role: 'operator';
  pinCode: string;
}

export interface Vehicle {
  plates: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  permanentNotes: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  whatsApp: string;
  email: string;
  visitCount: number;
  lastVisitDate?: string;
}

export interface ChecklistVisual {
  luces: 'OK' | 'Revisar' | 'Falla';
  llantas: 'OK' | 'Revisar' | 'Falla';
  niveles: 'OK' | 'Revisar' | 'Falla';
  frenos: 'OK' | 'Revisar' | 'Falla';
  extraNotes: string;
}

export interface Order {
  id: string;
  date: string;
  clientName: string;
  clientPhone: string;
  clientWhatsApp: string;
  clientEmail: string;
  plates: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  mileage: number;
  packageId?: string;
  services: string[]; // ServiceBase IDs
  products: {
    productId: string;
    quantity: number;
    sellPrice: number;
    costPrice: number;
  }[];
  checklist: ChecklistVisual;
  paymentMethod: 'Efectivo' | 'Tarjeta' | 'Transferencia';
  operatorId: string;
  operatorName: string;
  totalPaid: number;
  nextServiceMileage: number;
  nextServiceDate: string;
}
