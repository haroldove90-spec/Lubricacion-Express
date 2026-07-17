import React, { useState, useMemo, FormEvent } from 'react';
import { 
  Package, Wrench, BarChart3, Users, ChevronLeft, Plus, Trash2, 
  Edit2, TrendingUp, DollarSign, Wallet, ArrowUpRight, 
  AlertTriangle, RefreshCw, Layers, Check, X, ShieldAlert 
} from 'lucide-react';
import { Product, ServiceBase, ServicePackage, Operator, Order } from '../types';

interface AdminDashboardProps {
  products: Product[];
  services: ServiceBase[];
  packages: ServicePackage[];
  operators: Operator[];
  orders: Order[];
  onUpdateProducts: (products: Product[]) => void;
  onUpdateServices: (services: ServiceBase[]) => void;
  onUpdatePackages: (packages: ServicePackage[]) => void;
  onUpdateOperators: (operators: Operator[]) => void;
  onBackToHome: () => void;
}

export default function AdminDashboard({
  products,
  services,
  packages,
  operators,
  orders,
  onUpdateProducts,
  onUpdateServices,
  onUpdatePackages,
  onUpdateOperators,
  onBackToHome
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'services' | 'reports' | 'personnel'>('inventory');
  
  // Product state helper
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Aceite' as Product['category'],
    viscosity: '',
    brand: '',
    costPrice: 0,
    sellPrice: 0,
    stock: 0,
    minStock: 5
  });

  // Supply Entry state helper
  const [isRestocking, setIsRestocking] = useState(false);
  const [restockForm, setRestockForm] = useState({
    productId: '',
    quantity: 0,
    newCostPrice: 0
  });

  // Service state helper
  const [isAddingService, setIsAddingService] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    basePrice: 0
  });

  // Package state helper
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [packageForm, setPackageForm] = useState<{
    name: string;
    selectedServices: string[];
    selectedProducts: { productId: string; quantity: number }[];
    sellPrice: number;
  }>({
    name: '',
    selectedServices: [],
    selectedProducts: [],
    sellPrice: 0
  });

  // Operator state helper
  const [isAddingOperator, setIsAddingOperator] = useState(false);
  const [operatorForm, setOperatorForm] = useState({
    name: '',
    pinCode: ''
  });

  // Expenses and Petty Cash / Caja Chica State (PRO feature)
  const [expenses, setExpenses] = useState<{ id: string; date: string; category: string; description: string; amount: number }[]>(() => {
    const saved = localStorage.getItem('le_expenses');
    return saved ? JSON.parse(saved) : [
      { id: 'e1', date: '2026-07-16', category: 'Insumos', description: 'Compra de garrafa de anticongelante urgente', amount: 320 },
      { id: 'e2', date: '2026-07-16', category: 'Limpieza', description: 'Jabón para lavado de fosa y desengrasante', amount: 150 },
      { id: 'e3', date: '2026-07-15', category: 'Herramientas', description: 'Llave de filtro ajustable de banda', amount: 450 }
    ];
  });

  // Save expenses to localStorage
  React.useEffect(() => {
    localStorage.setItem('le_expenses', JSON.stringify(expenses));
  }, [expenses]);

  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Insumos',
    description: '',
    amount: 0
  });

  // Minimum Stock Warnings
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= p.minStock);
  }, [products]);

  // Handle Products CRUD
  const handleSaveProduct = (e: FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.brand) return;

    if (editingProduct) {
      const updated = products.map(p => p.id === editingProduct.id ? { 
        ...p, 
        name: productForm.name,
        category: productForm.category,
        viscosity: productForm.category === 'Aceite' ? productForm.viscosity : undefined,
        brand: productForm.brand,
        costPrice: Number(productForm.costPrice),
        sellPrice: Number(productForm.sellPrice),
        stock: Number(productForm.stock),
        minStock: Number(productForm.minStock)
      } : p);
      onUpdateProducts(updated);
      setEditingProduct(null);
    } else {
      const newProduct: Product = {
        id: 'p_' + Date.now(),
        name: productForm.name,
        category: productForm.category,
        viscosity: productForm.category === 'Aceite' ? productForm.viscosity : undefined,
        brand: productForm.brand,
        costPrice: Number(productForm.costPrice),
        sellPrice: Number(productForm.sellPrice),
        stock: Number(productForm.stock),
        minStock: Number(productForm.minStock)
      };
      onUpdateProducts([...products, newProduct]);
      setIsAddingProduct(false);
    }

    // Reset Form
    setProductForm({
      name: '',
      category: 'Aceite',
      viscosity: '',
      brand: '',
      costPrice: 0,
      sellPrice: 0,
      stock: 0,
      minStock: 5
    });
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('¿Seguro que deseas eliminar este producto?')) {
      onUpdateProducts(products.filter(p => p.id !== id));
    }
  };

  const handleStartEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      category: p.category,
      viscosity: p.viscosity || '',
      brand: p.brand,
      costPrice: p.costPrice,
      sellPrice: p.sellPrice,
      stock: p.stock,
      minStock: p.minStock
    });
    setIsAddingProduct(true);
  };

  // Restock Goods Handler
  const handleRestockSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!restockForm.productId || restockForm.quantity <= 0) return;

    const updated = products.map(p => {
      if (p.id === restockForm.productId) {
        const costPrice = restockForm.newCostPrice > 0 ? Number(restockForm.newCostPrice) : p.costPrice;
        return {
          ...p,
          stock: p.stock + Number(restockForm.quantity),
          costPrice
        };
      }
      return p;
    });

    onUpdateProducts(updated);
    setIsRestocking(false);
    setRestockForm({ productId: '', quantity: 0, newCostPrice: 0 });
  };

  // Service Catalogue Handlers
  const handleSaveService = (e: FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name) return;

    const newService: ServiceBase = {
      id: 's_' + Date.now(),
      name: serviceForm.name,
      basePrice: Number(serviceForm.basePrice),
      isActive: true
    };

    onUpdateServices([...services, newService]);
    setIsAddingService(false);
    setServiceForm({ name: '', basePrice: 0 });
  };

  const toggleServiceActive = (id: string) => {
    onUpdateServices(services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  // Package Handlers
  const handleAddProductToPackage = (productId: string) => {
    if (!productId) return;
    const exists = packageForm.selectedProducts.find(sp => sp.productId === productId);
    if (exists) {
      setPackageForm(prev => ({
        ...prev,
        selectedProducts: prev.selectedProducts.map(sp => sp.productId === productId ? { ...sp, quantity: sp.quantity + 1 } : sp)
      }));
    } else {
      setPackageForm(prev => ({
        ...prev,
        selectedProducts: [...prev.selectedProducts, { productId, quantity: 1 }]
      }));
    }
  };

  const handleRemoveProductFromPackage = (productId: string) => {
    setPackageForm(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter(sp => sp.productId !== productId)
    }));
  };

  const toggleServiceInPackage = (serviceId: string) => {
    const isSelected = packageForm.selectedServices.includes(serviceId);
    if (isSelected) {
      setPackageForm(prev => ({
        ...prev,
        selectedServices: prev.selectedServices.filter(id => id !== serviceId)
      }));
    } else {
      setPackageForm(prev => ({
        ...prev,
        selectedServices: [...prev.selectedServices, serviceId]
      }));
    }
  };

  const handleSavePackage = (e: FormEvent) => {
    e.preventDefault();
    if (!packageForm.name || packageForm.sellPrice <= 0) return;

    const newPkg: ServicePackage = {
      id: 'pkg_' + Date.now(),
      name: packageForm.name,
      services: packageForm.selectedServices,
      products: packageForm.selectedProducts,
      sellPrice: Number(packageForm.sellPrice),
      isActive: true
    };

    onUpdatePackages([...packages, newPkg]);
    setIsAddingPackage(false);
    setPackageForm({ name: '', selectedServices: [], selectedProducts: [], sellPrice: 0 });
  };

  const togglePackageActive = (id: string) => {
    onUpdatePackages(packages.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  // Personnel Handlers
  const handleSaveOperator = (e: FormEvent) => {
    e.preventDefault();
    if (!operatorForm.name || !operatorForm.pinCode) return;

    const newOp: Operator = {
      id: 'op_' + Date.now(),
      name: operatorForm.name,
      role: 'operator',
      pinCode: operatorForm.pinCode
    };

    onUpdateOperators([...operators, newOp]);
    setIsAddingOperator(false);
    setOperatorForm({ name: '', pinCode: '' });
  };

  const handleDeleteOperator = (id: string) => {
    if (confirm('¿Seguro que deseas eliminar esta cuenta de operador?')) {
      onUpdateOperators(operators.filter(op => op.id !== id));
    }
  };

  // Expenses Handlers
  const handleSaveExpense = (e: FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description || expenseForm.amount <= 0) return;

    const newExpense = {
      id: 'e_' + Date.now(),
      date: '2026-07-16', // Simulation day
      category: expenseForm.category,
      description: expenseForm.description,
      amount: expenseForm.amount
    };

    setExpenses(prev => [newExpense, ...prev]);
    setIsAddingExpense(false);
    setExpenseForm({ category: 'Insumos', description: '', amount: 0 });
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  // REPORTS & FINANCIAL COMPUTATIONS
  const currentDay = '2026-07-16'; // Simulation Current Day from metadata
  
  const salesByPaymentMethod = useMemo(() => {
    const methods = { Efectivo: 0, Tarjeta: 0, Transferencia: 0 };
    orders.forEach(order => {
      if (order.date === currentDay) {
        methods[order.paymentMethod] += order.totalPaid;
      }
    });
    return methods;
  }, [orders]);

  const totalCajaHoy = useMemo(() => {
    return salesByPaymentMethod.Efectivo + salesByPaymentMethod.Tarjeta + salesByPaymentMethod.Transferencia;
  }, [salesByPaymentMethod]);

  // Gain calculations (Venta - Costo - Gastos)
  const utilityReport = useMemo(() => {
    let salesTotal = 0;
    let costTotal = 0;

    orders.forEach(order => {
      salesTotal += order.totalPaid;
      order.products.forEach(p => {
        costTotal += p.costPrice * p.quantity;
      });
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return {
      sales: salesTotal,
      cost: costTotal,
      grossProfit: salesTotal - costTotal,
      totalExpenses,
      netProfit: salesTotal - costTotal - totalExpenses
    };
  }, [orders, expenses]);

  // Product rotation (oils & filters most sold)
  const productRotation = useMemo(() => {
    const rotationMap: Record<string, { name: string; category: string; count: number; stock: number }> = {};
    
    // Seed with existing products
    products.forEach(p => {
      rotationMap[p.id] = { name: p.name, category: p.category, count: 0, stock: p.stock };
    });

    // Count sales
    orders.forEach(order => {
      order.products.forEach(op => {
        if (rotationMap[op.productId]) {
          rotationMap[op.productId].count += op.quantity;
        }
      });
    });

    return Object.entries(rotationMap)
      .map(([id, item]) => ({ id, ...item }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
  }, [orders, products]);

  // Employee Performance (services per operator)
  const employeePerformance = useMemo(() => {
    const perfMap: Record<string, { name: string; count: number; commission: number }> = {};
    
    operators.forEach(op => {
      perfMap[op.id] = { name: op.name, count: 0, commission: 0 };
    });

    orders.forEach(order => {
      if (perfMap[order.operatorId]) {
        perfMap[order.operatorId].count += 1;
        // Operator gets e.g. 50 pesos commission per completed service
        perfMap[order.operatorId].commission += 50;
      }
    });

    return Object.entries(perfMap).map(([id, data]) => ({ id, ...data }));
  }, [orders, operators]);

  // Package calculations preview
  const packageCostPreview = useMemo(() => {
    let cost = 0;
    packageForm.selectedProducts.forEach(sp => {
      const prod = products.find(p => p.id === sp.productId);
      if (prod) {
        cost += prod.costPrice * sp.quantity;
      }
    });
    // Add base services prices
    packageForm.selectedServices.forEach(sId => {
      const srv = services.find(s => s.id === sId);
      if (srv) {
        cost += 0; // Labor cost to shop is 0 (direct wage or commission)
      }
    });
    return cost;
  }, [packageForm.selectedProducts, packageForm.selectedServices, products, services]);

  const packageMarginPreview = useMemo(() => {
    if (packageForm.sellPrice <= 0) return 0;
    const profit = packageForm.sellPrice - packageCostPreview;
    return Math.round((profit / packageForm.sellPrice) * 100);
  }, [packageForm.sellPrice, packageCostPreview]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              id="admin-btn-back"
              onClick={onBackToHome}
              className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
              title="Volver al menú de roles"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
                <Wrench className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-base font-semibold leading-tight">Lubricación Express</h1>
                <p className="text-[10px] text-zinc-500 font-mono tracking-wider">MIGUEL (PROPIETARIO)</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-zinc-400 font-medium">Panel Administrativo</p>
              <p className="text-[10px] text-sky-400 font-mono">{currentDay}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 pt-6 pb-24 lg:pb-6 flex flex-col lg:flex-row gap-6">
        
        {/* Compact Sidebar navigation */}
        <aside className="hidden lg:block lg:w-64 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-none border-b lg:border-b-0 border-zinc-800">
            <button
              id="admin-tab-inventory"
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center space-x-2.5 px-4 py-3 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                activeTab === 'inventory' 
                  ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 lg:translate-x-1' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Package className="w-4.5 h-4.5" />
              <span>Inventario y Alertas</span>
              {lowStockProducts.length > 0 && (
                <span className="ml-auto bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded-full font-mono animate-pulse">
                  {lowStockProducts.length}
                </span>
              )}
            </button>

            <button
              id="admin-tab-services"
              onClick={() => setActiveTab('services')}
              className={`flex items-center space-x-2.5 px-4 py-3 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                activeTab === 'services' 
                  ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 lg:translate-x-1' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-4.5 h-4.5" />
              <span>Servicios y Paquetes</span>
            </button>

            <button
              id="admin-tab-reports"
              onClick={() => setActiveTab('reports')}
              className={`flex items-center space-x-2.5 px-4 py-3 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                activeTab === 'reports' 
                  ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 lg:translate-x-1' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <BarChart3 className="w-4.5 h-4.5" />
              <span>Reportes y Finanzas</span>
            </button>

            <button
              id="admin-tab-personnel"
              onClick={() => setActiveTab('personnel')}
              className={`flex items-center space-x-2.5 px-4 py-3 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                activeTab === 'personnel' 
                  ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 lg:translate-x-1' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Users className="w-4.5 h-4.5" />
              <span>Personal (Operadores)</span>
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <section className="flex-1 bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-sm shadow-xl min-h-[500px]">
          
          {/* TAB 1: INVENTARIO */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Inventario de Productos</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Control de aceites, filtros, bujías y aditivos en stock.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    id="admin-btn-restock"
                    onClick={() => { setIsRestocking(true); setIsAddingProduct(false); }}
                    className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Entrada Mercancía</span>
                  </button>
                  <button
                    id="admin-btn-add-product"
                    onClick={() => { setIsAddingProduct(true); setEditingProduct(null); setIsRestocking(false); }}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuevo Producto</span>
                  </button>
                </div>
              </div>

              {/* Warnings Banner */}
              {lowStockProducts.length > 0 && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start space-x-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-400">Productos con stock bajo crítico ({lowStockProducts.length})</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Los siguientes productos están por debajo de su stock mínimo configurado: {' '}
                      <span className="font-semibold text-zinc-300">
                        {lowStockProducts.map(p => `${p.name} (${p.stock} pz)`).join(', ')}
                      </span>.
                    </p>
                  </div>
                </div>
              )}

              {/* Dynamic Forms Panel */}
              {isAddingProduct && (
                <form onSubmit={handleSaveProduct} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3.5">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                      {editingProduct ? 'Editar Producto' : 'Dar de Alta Producto'}
                    </h3>
                    <button type="button" onClick={() => setIsAddingProduct(false)} className="text-zinc-500 hover:text-zinc-300">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">Nombre Comercial</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Aceite Castrol Sintético 5W-30"
                        value={productForm.name}
                        onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">Categoría</label>
                      <select
                        value={productForm.category}
                        onChange={e => setProductForm({ ...productForm, category: e.target.value as Product['category'] })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
                      >
                        <option value="Aceite">Aceite</option>
                        <option value="Filtro">Filtro</option>
                        <option value="Bujía">Bujía</option>
                        <option value="Aditivo">Aditivo</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">Marca</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Castrol, Fram"
                        value={productForm.brand}
                        onChange={e => setProductForm({ ...productForm, brand: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">Viscosidad (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ej. 5W-30"
                        disabled={productForm.category !== 'Aceite'}
                        value={productForm.viscosity}
                        onChange={e => setProductForm({ ...productForm, viscosity: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">Costo Proveedor ($)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={productForm.costPrice}
                        onChange={e => setProductForm({ ...productForm, costPrice: Number(e.target.value) })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">Precio Venta ($)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={productForm.sellPrice}
                        onChange={e => setProductForm({ ...productForm, sellPrice: Number(e.target.value) })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">Stock Inicial</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={productForm.stock}
                        onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">Alerta Stock Mínimo</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={productForm.minStock}
                        onChange={e => setProductForm({ ...productForm, minStock: Number(e.target.value) })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setIsAddingProduct(false)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-lg text-xs font-bold"
                    >
                      {editingProduct ? 'Actualizar' : 'Guardar Producto'}
                    </button>
                  </div>
                </form>
              )}

              {/* Form Entry / Restock */}
              {isRestocking && (
                <form onSubmit={handleRestockSubmit} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3.5">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Entrada de Mercancía (Restock de Proveedor)
                    </h3>
                    <button type="button" onClick={() => setIsRestocking(false)} className="text-zinc-500 hover:text-zinc-300">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">Seleccionar Producto</label>
                      <select
                        required
                        value={restockForm.productId}
                        onChange={e => setRestockForm({ ...restockForm, productId: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                      >
                        <option value="">-- Elige un producto --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.brand}) - Actual: {p.stock} pz</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">Cantidad de Entrada</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Cantidad"
                        value={restockForm.quantity || ''}
                        onChange={e => setRestockForm({ ...restockForm, quantity: Number(e.target.value) })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">Nuevo Costo Unitario (Opcional)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Dejar vacío para conservar"
                        value={restockForm.newCostPrice || ''}
                        onChange={e => setRestockForm({ ...restockForm, newCostPrice: Number(e.target.value) })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setIsRestocking(false)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-bold"
                    >
                      Registrar Entrada
                    </button>
                  </div>
                </form>
              )}

              {/* Products Table */}
              <div className="overflow-x-auto rounded-lg border border-zinc-850">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[10px] uppercase font-mono text-zinc-400">
                      <th className="p-3">Categoría / Producto</th>
                      <th className="p-3">Marca</th>
                      <th className="p-3">Viscosidad</th>
                      <th className="p-3 text-right">Costo</th>
                      <th className="p-3 text-right">Precio Público</th>
                      <th className="p-3 text-center">Stock</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850 text-xs">
                    {products.map(p => {
                      const isLow = p.stock <= p.minStock;
                      return (
                        <tr key={p.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="p-3">
                            <div>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold mr-1.5 ${
                                p.category === 'Aceite' ? 'bg-sky-500/10 text-sky-400' :
                                p.category === 'Filtro' ? 'bg-indigo-500/10 text-indigo-400' :
                                p.category === 'Bujía' ? 'bg-emerald-500/10 text-emerald-400' :
                                'bg-purple-500/10 text-purple-400'
                              }`}>
                                {p.category}
                              </span>
                              <span className="font-semibold text-zinc-200">{p.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-zinc-400">{p.brand}</td>
                          <td className="p-3 font-mono text-zinc-400">{p.viscosity || 'N/A'}</td>
                          <td className="p-3 text-right font-mono text-zinc-400">${p.costPrice}</td>
                          <td className="p-3 text-right font-mono text-sky-400 font-semibold">${p.sellPrice}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block font-mono font-bold px-2 py-0.5 rounded ${
                              isLow ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-zinc-800 text-zinc-200'
                            }`}>
                              {p.stock} <span className="text-[9px] font-normal text-zinc-400">pz</span>
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleStartEditProduct(p)}
                                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1 hover:bg-zinc-800/80 text-zinc-500 hover:text-red-400 rounded transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: SERVICIOS Y PAQUETES */}
          {activeTab === 'services' && (
            <div className="space-y-8">
              
              {/* Section: Base Services */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-zinc-100">Catálogo de Servicios Individuales</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Define los precios base para la mano de obra del taller.</p>
                  </div>
                  <button
                    id="admin-btn-add-service"
                    onClick={() => setIsAddingService(true)}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuevo Servicio</span>
                  </button>
                </div>

                {isAddingService && (
                  <form onSubmit={handleSaveService} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3.5">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">Agregar Servicio Base</h4>
                      <button type="button" onClick={() => setIsAddingService(false)} className="text-zinc-500 hover:text-zinc-300">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">Nombre del Servicio</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Lavado de Inyectores"
                          value={serviceForm.name}
                          onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">Tarifa Base de Mano de Obra ($)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={serviceForm.basePrice}
                          onChange={e => setServiceForm({ ...serviceForm, basePrice: Number(e.target.value) })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setIsAddingService(false)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-lg text-xs font-bold"
                      >
                        Guardar Servicio
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {services.map(s => (
                    <div key={s.id} className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-zinc-200 block">{s.name}</span>
                        <span className="text-xs font-mono text-sky-400">${s.basePrice} MXN</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          s.isActive ? 'bg-sky-500/15 text-sky-400' : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {s.isActive ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleServiceActive(s.id)}
                          className={`text-xs px-2.5 py-1 rounded transition-colors ${
                            s.isActive 
                              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' 
                              : 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-400'
                          }`}
                        >
                          {s.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Packages Creator */}
              <div className="space-y-4 border-t border-zinc-800 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-zinc-100">Configuración de Paquetes Exprés</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Combina servicios y productos para crear atractivos paquetes comerciales.</p>
                  </div>
                  <button
                    id="admin-btn-add-package"
                    onClick={() => setIsAddingPackage(true)}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Crear Paquete</span>
                  </button>
                </div>

                {/* Adding Package Form with live utility preview */}
                {isAddingPackage && (
                  <form onSubmit={handleSavePackage} className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">Diseñar Paquete Comercial</h4>
                      <button type="button" onClick={() => setIsAddingPackage(false)} className="text-zinc-500 hover:text-zinc-300">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">Nombre Comercial del Paquete</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Paquete Lubricación Sintética Premium"
                          value={packageForm.name}
                          onChange={e => setPackageForm({ ...packageForm, name: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">Precio Fijo de Venta ($)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="$$$"
                          value={packageForm.sellPrice || ''}
                          onChange={e => setPackageForm({ ...packageForm, sellPrice: Number(e.target.value) })}
                          className="w-full bg-zinc-950 border border-sky-500/40 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Services selectors */}
                      <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg space-y-2">
                        <span className="block text-[10px] text-sky-400 font-mono uppercase">1. Incluir Servicios</span>
                        <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                          {services.map(s => {
                            const isSelected = packageForm.selectedServices.includes(s.id);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => toggleServiceInPackage(s.id)}
                                className={`w-full text-left p-2 rounded text-xs flex items-center justify-between border transition-all ${
                                  isSelected 
                                    ? 'bg-sky-500/10 border-sky-500/40 text-zinc-200' 
                                    : 'bg-zinc-900 border-zinc-850 text-zinc-400'
                                }`}
                              >
                                <span>{s.name}</span>
                                {isSelected ? <Check className="w-3.5 h-3.5 text-sky-400" /> : <span className="text-[10px] font-mono">${s.basePrice}</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Products/Insumos selector */}
                      <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg space-y-2">
                        <span className="block text-[10px] text-sky-400 font-mono uppercase">2. Incluir Insumos (Aceites / Filtros)</span>
                        <div className="flex gap-1 mb-2">
                          <select
                            onChange={e => {
                              handleAddProductToPackage(e.target.value);
                              e.target.value = '';
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300"
                          >
                            <option value="">+ Añadir producto del catálogo...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>
                            ))}
                          </select>
                        </div>
                        {/* Selected products table list */}
                        <div className="space-y-1 max-h-[110px] overflow-y-auto pr-1">
                          {packageForm.selectedProducts.map(sp => {
                            const prod = products.find(p => p.id === sp.productId);
                            if (!prod) return null;
                            return (
                              <div key={sp.productId} className="flex items-center justify-between p-1.5 bg-zinc-900 rounded text-xs text-zinc-300">
                                <span className="truncate max-w-[140px]">{prod.name}</span>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    min="1"
                                    value={sp.quantity}
                                    onChange={e => {
                                      const val = Number(e.target.value);
                                      if (val > 0) {
                                        setPackageForm(prev => ({
                                          ...prev,
                                          selectedProducts: prev.selectedProducts.map(p => p.productId === sp.productId ? { ...p, quantity: val } : p)
                                        }));
                                      }
                                    }}
                                    className="w-10 bg-zinc-950 border border-zinc-800 text-center rounded text-xs py-0.5 font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveProductFromPackage(sp.productId)}
                                    className="text-zinc-500 hover:text-red-400 p-0.5"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Live Margin Utility preview */}
                    <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                      <div>
                        <span className="text-zinc-400">Costo total insumos: </span>
                        <span className="text-zinc-200 font-bold">${packageCostPreview} MXN</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Precio Sugerido (Venta): </span>
                        <span className="text-sky-400 font-bold">${Math.round(packageCostPreview * 1.6)} MXN</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-zinc-400">Margen Real: </span>
                        <span className={`font-bold px-1.5 py-0.5 rounded ${
                          packageMarginPreview >= 40 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {packageForm.sellPrice > 0 ? `${packageMarginPreview}% de utilidad` : 'Configura precio de venta'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setIsAddingPackage(false)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={packageForm.selectedServices.length === 0 && packageForm.selectedProducts.length === 0}
                        className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-zinc-950 rounded-lg text-xs font-bold"
                      >
                        Crear Paquete Comercial
                      </button>
                    </div>
                  </form>
                )}

                {/* Active Packages grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packages.map(pkg => {
                    // Calc cost
                    let totalCost = 0;
                    pkg.products.forEach(sp => {
                      const prod = products.find(p => p.id === sp.productId);
                      if (prod) totalCost += prod.costPrice * sp.quantity;
                    });
                    const profit = pkg.sellPrice - totalCost;
                    const margin = Math.round((profit / pkg.sellPrice) * 100);

                    return (
                      <div key={pkg.id} className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-3 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-bold text-zinc-200">{pkg.name}</h4>
                            <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wide">Código: {pkg.id}</p>
                          </div>
                          <span className="text-sm font-bold text-sky-400 font-mono">${pkg.sellPrice}</span>
                        </div>

                        {/* Details summary */}
                        <div className="space-y-1.5 border-t border-b border-zinc-800 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {pkg.services.map(sId => {
                              const srv = services.find(s => s.id === sId);
                              if (!srv) return null;
                              return (
                                <span key={sId} className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
                                  🔧 {srv.name}
                                </span>
                              );
                            })}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            <span className="font-semibold">Insumos:</span>{' '}
                            {pkg.products.map(sp => {
                              const prod = products.find(p => p.id === sp.productId);
                              return prod ? `${sp.quantity}x ${prod.name} (${prod.brand})` : null;
                            }).filter(Boolean).join(', ')}
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-500">
                            Margen: <span className="text-emerald-400 font-bold">{margin}%</span> (${profit} MXN)
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                              pkg.isActive ? 'bg-sky-500/10 text-sky-400' : 'bg-zinc-800 text-zinc-500'
                            }`}>
                              {pkg.isActive ? 'ACTIVO' : 'INACTIVO'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePackageActive(pkg.id)}
                              className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                                pkg.isActive ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-sky-500/20 text-sky-400'
                              }`}
                            >
                              {pkg.isActive ? 'Pausar' : 'Reactivar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: REPORTES Y FINANZAS */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              
              {/* Financial Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl relative overflow-hidden">
                  <div className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider">Ventas Totales</div>
                  <div className="text-2xl font-bold font-mono text-zinc-100 mt-1">${utilityReport.sales} <span className="text-[11px] text-zinc-500">MXN</span></div>
                  <div className="text-[10px] text-zinc-400 mt-1.5 flex items-center">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                    <span>Progreso del mes</span>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl relative overflow-hidden">
                  <div className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider">Utilidad Bruta</div>
                  <div className="text-2xl font-bold font-mono text-sky-400 mt-1">${utilityReport.grossProfit} <span className="text-[11px] text-zinc-500">MXN</span></div>
                  <div className="text-[10px] text-zinc-400 mt-1.5">
                    Margen bruto: <span className="text-sky-400 font-bold">{utilityReport.sales > 0 ? Math.round((utilityReport.grossProfit / utilityReport.sales) * 100) : 0}%</span>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl relative overflow-hidden">
                  <div className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider">Gastos Registrados</div>
                  <div className="text-2xl font-bold font-mono text-amber-500 mt-1">${utilityReport.totalExpenses} <span className="text-[11px] text-zinc-500">MXN</span></div>
                  <div className="text-[10px] text-zinc-400 mt-1.5">
                    Egresos por Caja Chica
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl relative overflow-hidden">
                  <div className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider">Utilidad Neta Real</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">${utilityReport.netProfit} <span className="text-[11px] text-zinc-500">MXN</span></div>
                  <div className="text-[10px] text-zinc-400 mt-1.5">
                    Margen neto real: <span className="text-emerald-400 font-bold">{utilityReport.sales > 0 ? Math.round((utilityReport.netProfit / utilityReport.sales) * 100) : 0}%</span>
                  </div>
                </div>
              </div>

              {/* Caja details per payment method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                
                {/* Caja desglosada */}
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center">
                    <Wallet className="w-4 h-4 mr-1.5 text-sky-400" />
                    Corte de Caja Diario
                  </h3>
                  
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">💵 Efectivo</span>
                      <span className="font-mono font-bold text-zinc-200">${salesByPaymentMethod.Efectivo} MXN</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">💳 Tarjeta (Terminal)</span>
                      <span className="font-mono font-bold text-zinc-200">${salesByPaymentMethod.Tarjeta} MXN</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">🏦 Transferencia SPEI</span>
                      <span className="font-mono font-bold text-zinc-200">${salesByPaymentMethod.Transferencia} MXN</span>
                    </div>
                    <div className="border-t border-zinc-800 pt-2.5 flex justify-between items-center text-sm">
                      <span className="font-semibold text-zinc-300">Total Recaudado</span>
                      <span className="font-mono font-bold text-sky-400">${totalCajaHoy} MXN</span>
                    </div>
                  </div>
                </div>

                {/* Rotación de Productos */}
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center">
                    <Layers className="w-4 h-4 mr-1.5 text-sky-400" />
                    Rotación de Insumos (Más Vendidos)
                  </h3>

                  <div className="space-y-2">
                    {productRotation.map((p, idx) => (
                      <div key={p.id} className="flex items-center justify-between text-xs p-1 hover:bg-zinc-950 rounded transition-colors">
                        <div className="truncate max-w-[200px]">
                          <span className="text-zinc-500 font-mono mr-2">#{idx+1}</span>
                          <span className="text-zinc-300 font-medium">{p.name}</span>
                        </div>
                        <div className="text-right font-mono text-[11px] whitespace-nowrap">
                          <span className="text-sky-400 font-bold">{p.count} pz</span>
                          <span className="text-zinc-500 text-[10px] ml-1.5">({p.stock} pz rest.)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance & Employee Commissions */}
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center">
                  <Users className="w-4 h-4 mr-1.5 text-sky-400" />
                  Rendimiento y Productividad de Operadores
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {employeePerformance.map(perf => (
                    <div key={perf.id} className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-zinc-200">{perf.name}</span>
                        <span className="bg-sky-500/10 text-sky-400 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">
                          {perf.count} serv.
                        </span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-sky-500 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min((perf.count / 5) * 100, 100)}%` }} 
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-zinc-500">
                        <span>Comisión sugerida ($50 c/u)</span>
                        <span className="font-mono text-emerald-400 font-bold">${perf.commission} MXN</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Control de Gastos & Caja Chica */}
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center">
                      <DollarSign className="w-4 h-4 mr-1.5 text-sky-400" />
                      Control de Gastos & Caja Chica (Petty Cash)
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Bitácora de egresos inmediatos para operación diaria del taller.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingExpense(!isAddingExpense)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 text-xs font-semibold rounded-lg flex items-center space-x-1"
                  >
                    <span>{isAddingExpense ? 'Ocultar Formulario' : '+ Registrar Gasto'}</span>
                  </button>
                </div>

                {isAddingExpense && (
                  <form onSubmit={handleSaveExpense} className="p-4 bg-zinc-950 border border-zinc-850 rounded-lg space-y-3 font-sans">
                    <h4 className="text-xs font-bold text-zinc-300">Nuevo Egreso</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase font-mono mb-1">Categoría</label>
                        <select
                          value={expenseForm.category}
                          onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-200 font-sans"
                        >
                          <option value="Insumos" className="bg-zinc-950 text-zinc-200">Insumos (Emergencias)</option>
                          <option value="Limpieza" className="bg-zinc-950 text-zinc-200">Limpieza & Desengrasante</option>
                          <option value="Herramientas" className="bg-zinc-950 text-zinc-200">Herramientas & Refacciones</option>
                          <option value="Alimentos" className="bg-zinc-950 text-zinc-200">Alimentos & Café</option>
                          <option value="Varios" className="bg-zinc-950 text-zinc-200">Varios / Servicios Públicos</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase font-mono mb-1">Descripción / Concepto</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Compra de desarmadores de cruz"
                          value={expenseForm.description}
                          onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase font-mono mb-1">Monto (MXN)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Monto $"
                          value={expenseForm.amount || ''}
                          onChange={e => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingExpense(false)}
                        className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs rounded"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded"
                      >
                        Registrar Egreso
                      </button>
                    </div>
                  </form>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase font-mono">
                        <th className="py-2">Fecha</th>
                        <th className="py-2">Categoría</th>
                        <th className="py-2">Concepto / Descripción</th>
                        <th className="py-2 text-right">Monto</th>
                        <th className="py-2 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {expenses.map(exp => (
                        <tr key={exp.id} className="hover:bg-zinc-950/40 text-zinc-300">
                          <td className="py-2 font-mono text-[11px] text-zinc-500">{exp.date}</td>
                          <td className="py-2 font-mono text-[11px]">
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-semibold text-[10px]">
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-2 font-medium">{exp.description}</td>
                          <td className="py-2 text-right font-mono font-bold text-red-400">-${exp.amount} MXN</td>
                          <td className="py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="text-zinc-500 hover:text-red-400 p-1"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {expenses.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-zinc-500 italic">No hay gastos registrados en esta sesión.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: PERSONAL */}
          {activeTab === 'personnel' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Gestión de Cuentas y Operadores</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Administra los permisos de acceso y PIN numérico para el equipo técnico.</p>
                </div>
                <button
                  id="admin-btn-add-op"
                  onClick={() => setIsAddingOperator(true)}
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Dar de Alta Operador</span>
                </button>
              </div>

              {isAddingOperator && (
                <form onSubmit={handleSaveOperator} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3.5">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">Crear Acceso Operador</h3>
                    <button type="button" onClick={() => setIsAddingOperator(false)} className="text-zinc-500 hover:text-zinc-300">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">Nombre Completo de Operador</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Juan Pérez"
                        value={operatorForm.name}
                        onChange={e => setOperatorForm({ ...operatorForm, name: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">Código PIN de Acceso (4 dígitos)</label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        pattern="\d{4}"
                        placeholder="Ej. 1234"
                        value={operatorForm.pinCode}
                        onChange={e => setOperatorForm({ ...operatorForm, pinCode: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none font-mono tracking-widest"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setIsAddingOperator(false)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-lg text-xs font-bold"
                    >
                      Crear Acceso
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {operators.map(op => (
                  <div key={op.id} className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-3 relative overflow-hidden">
                    <div className="absolute right-0 top-0 bg-sky-500/10 text-sky-400 text-[9px] uppercase font-mono px-2 py-0.5 rounded-bl">
                      TÉCNICO LUBRICADOR
                    </div>
                    <div>
                      <span className="block text-xs text-zinc-400 font-mono">USUARIO</span>
                      <h4 className="text-sm font-semibold text-zinc-200">{op.name}</h4>
                    </div>
                    <div className="border-t border-zinc-800 pt-2.5 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-zinc-500 text-[10px] uppercase font-mono block">PIN de Acceso</span>
                        <span className="font-mono text-zinc-300 tracking-widest font-semibold">{op.pinCode}</span>
                      </div>
                      {operators.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteOperator(op.id)}
                          className="text-zinc-500 hover:text-red-400 p-1.5 hover:bg-zinc-800 rounded transition-colors"
                          title="Eliminar cuenta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>
      </main>

      {/* Bottom Navigation for Mobile / Tablet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg px-2 flex justify-around items-center h-16 lg:hidden">
        <button
          id="admin-m-tab-inventory"
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center justify-center w-20 h-full transition-colors cursor-pointer ${
            activeTab === 'inventory' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="relative">
            <Package className="w-5 h-5" />
            {lowStockProducts.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] px-1 rounded-full font-mono font-bold animate-pulse">
                {lowStockProducts.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-1">Inventario</span>
        </button>

        <button
          id="admin-m-tab-services"
          onClick={() => setActiveTab('services')}
          className={`flex flex-col items-center justify-center w-20 h-full transition-colors cursor-pointer ${
            activeTab === 'services' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Servicios</span>
        </button>

        <button
          id="admin-m-tab-reports"
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center justify-center w-20 h-full transition-colors cursor-pointer ${
            activeTab === 'reports' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Reportes</span>
        </button>

        <button
          id="admin-m-tab-personnel"
          onClick={() => setActiveTab('personnel')}
          className={`flex flex-col items-center justify-center w-20 h-full transition-colors cursor-pointer ${
            activeTab === 'personnel' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Personal</span>
        </button>
      </div>
    </div>
  );
}
