import React, { useState, useMemo, FormEvent } from 'react';
import { 
  ChevronLeft, Wrench, Search, Plus, CheckSquare, Clipboard, 
  Send, ShieldAlert, Check, RefreshCw, Eye, Sparkles, BookOpen, 
  User, Car, Phone, Calendar, ArrowRight, TrendingUp, HelpCircle
} from 'lucide-react';
import { Product, ServiceBase, ServicePackage, Operator, Client, Vehicle, Order, ChecklistVisual } from '../types';

interface OperatorDashboardProps {
  products: Product[];
  services: ServiceBase[];
  packages: ServicePackage[];
  operators: Operator[];
  orders: Order[];
  clients: Client[];
  vehicles: Vehicle[];
  onAddOrder: (order: Order) => void;
  onAddClient: (client: Client) => void;
  onAddVehicle: (vehicle: Vehicle) => void;
  onUpdateVehicleNotes: (plates: string, notes: string) => void;
  onBackToHome: () => void;
}

export default function OperatorDashboard({
  products,
  services,
  packages,
  operators,
  orders,
  clients,
  vehicles,
  onAddOrder,
  onAddClient,
  onAddVehicle,
  onUpdateVehicleNotes,
  onBackToHome
}: OperatorDashboardProps) {
  // Simple operator log-in simulation
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>(operators[0]?.id || '');
  const activeOperator = useMemo(() => operators.find(o => o.id === selectedOperatorId), [operators, selectedOperatorId]);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'pos' | 'clients' | 'vehicles' | 'reminders'>('pos');

  // Search States
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');

  // 1. POINT OF SALE (PUNTO DE VENTA EXPRÉS) STATES
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Vehicle & Customer, 2: Checklist & Service Select, 3: Ticket Summary
  
  // Form fields for current vehicle
  const [plates, setPlates] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(2020);
  const [mileage, setMileage] = useState<number>(0);
  const [permanentNotes, setPermanentNotes] = useState('');

  // Form fields for customer
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientWhatsApp, setClientWhatsApp] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  // Checklist
  const [checklist, setChecklist] = useState<ChecklistVisual>({
    luces: 'OK',
    llantas: 'OK',
    niveles: 'OK',
    frenos: 'OK',
    extraNotes: ''
  });

  // Services & Insumos selection
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [customServiceIds, setCustomServiceIds] = useState<string[]>([]);
  const [customProducts, setCustomProducts] = useState<{ productId: string; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');

  // Completed Order Ticket Holder for Step 3
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Auto-fill details if plates or phone are typed
  const handleLookupPlates = (inputPlates: string) => {
    const cleanPlates = inputPlates.toUpperCase().trim();
    setPlates(cleanPlates);
    
    const existingVeh = vehicles.find(v => v.plates === cleanPlates);
    if (existingVeh) {
      setBrand(existingVeh.brand);
      setModel(existingVeh.model);
      setYear(existingVeh.year);
      setMileage(existingVeh.mileage + 1); // Suggest increment
      setPermanentNotes(existingVeh.permanentNotes);
      
      // Look up owner
      // In a real DB we associate, in mock we match from previous orders or matching name
      const pastOrder = [...orders].reverse().find(o => o.plates === cleanPlates);
      if (pastOrder) {
        setClientName(pastOrder.clientName);
        setClientPhone(pastOrder.clientPhone);
        setClientWhatsApp(pastOrder.clientWhatsApp);
        setClientEmail(pastOrder.clientEmail);
      }
    }
  };

  const handleLookupClientPhone = (phone: string) => {
    setClientPhone(phone);
    setClientWhatsApp(phone); // keep synced by default
    const existingClient = clients.find(c => c.phone === phone.trim());
    if (existingClient) {
      setClientName(existingClient.name);
      setClientWhatsApp(existingClient.whatsApp);
      setClientEmail(existingClient.email);
    }
  };

  // Live order calculations
  const liveOrderTotals = useMemo(() => {
    let subtotal = 0;
    const itemsList: { name: string; price: number; quantity: number }[] = [];
    const productsToDeduct: { productId: string; quantity: number; costPrice: number; sellPrice: number }[] = [];
    let isSyntheticUsed = false;

    // Package Selected
    if (selectedPackageId) {
      const pkg = packages.find(p => p.id === selectedPackageId);
      if (pkg) {
        subtotal += pkg.sellPrice;
        itemsList.push({ name: pkg.name, price: pkg.sellPrice, quantity: 1 });
        
        // Add products included in package to deduction list
        pkg.products.forEach(sp => {
          const prod = products.find(p => p.id === sp.productId);
          if (prod) {
            if (prod.name.toLowerCase().includes('sintético')) {
              isSyntheticUsed = true;
            }
            productsToDeduct.push({
              productId: sp.productId,
              quantity: sp.quantity,
              costPrice: prod.costPrice,
              sellPrice: prod.sellPrice
            });
          }
        });
      }
    }

    // Custom services selected
    customServiceIds.forEach(srvId => {
      const srv = services.find(s => s.id === srvId);
      if (srv) {
        subtotal += srv.basePrice;
        itemsList.push({ name: srv.name, price: srv.basePrice, quantity: 1 });
      }
    });

    // Custom products added
    customProducts.forEach(cp => {
      const prod = products.find(p => p.id === cp.productId);
      if (prod) {
        if (prod.name.toLowerCase().includes('sintético')) {
          isSyntheticUsed = true;
        }
        const cost = prod.sellPrice * cp.quantity;
        subtotal += cost;
        itemsList.push({ name: prod.name, price: prod.sellPrice, quantity: cp.quantity });
        productsToDeduct.push({
          productId: cp.productId,
          quantity: cp.quantity,
          costPrice: prod.costPrice,
          sellPrice: prod.sellPrice
        });
      }
    });

    return {
      total: subtotal,
      items: itemsList,
      productsDeductions: productsToDeduct,
      isSynthetic: isSyntheticUsed
    };
  }, [selectedPackageId, customServiceIds, customProducts, packages, services, products]);

  // Submit Order / Complete Service
  const handleCompleteOrder = (e: FormEvent) => {
    e.preventDefault();
    if (!plates || !brand || !model || mileage <= 0 || !clientName || !clientPhone) return;

    // 1. Calculate next visit
    // Synthetic gets +10,000 km or 6 months. Mineral gets +5,000 km or 3 months.
    const isSynthetic = liveOrderTotals.isSynthetic;
    const incrementKm = isSynthetic ? 10000 : 5000;
    const monthsAhead = isSynthetic ? 6 : 3;

    const nextKm = Number(mileage) + incrementKm;
    const d = new Date('2026-07-16'); // Today simulated
    d.setMonth(d.getMonth() + monthsAhead);
    const nextDate = d.toISOString().split('T')[0];

    // 2. Add client & vehicle if not exist
    const isNewClient = !clients.some(c => c.phone.trim() === clientPhone.trim());
    if (isNewClient) {
      onAddClient({
        id: 'c_' + Date.now(),
        name: clientName,
        phone: clientPhone,
        whatsApp: clientWhatsApp,
        email: clientEmail,
        visitCount: 1,
        lastVisitDate: '2026-07-16'
      });
    }

    const isNewVehicle = !vehicles.some(v => v.plates === plates);
    if (isNewVehicle) {
      onAddVehicle({
        plates,
        brand,
        model,
        year,
        mileage,
        permanentNotes
      });
    } else {
      // update mileage and notes
      onUpdateVehicleNotes(plates, permanentNotes);
    }

    // 3. Create active service order
    const newOrder: Order = {
      id: 'LE-' + (1000 + orders.length + 1),
      date: '2026-07-16', // current time metadata simulated
      clientName,
      clientPhone,
      clientWhatsApp,
      clientEmail,
      plates,
      vehicleBrand: brand,
      vehicleModel: model,
      vehicleYear: year,
      mileage: Number(mileage),
      packageId: selectedPackageId || undefined,
      services: [
        ...(selectedPackageId ? packages.find(p => p.id === selectedPackageId)?.services || [] : []),
        ...customServiceIds
      ],
      products: liveOrderTotals.productsDeductions,
      checklist,
      paymentMethod,
      operatorId: selectedOperatorId,
      operatorName: activeOperator?.name || 'Mecánico',
      totalPaid: liveOrderTotals.total,
      nextServiceMileage: nextKm,
      nextServiceDate: nextDate
    };

    onAddOrder(newOrder);
    setCompletedOrder(newOrder);
    setStep(3); // summary screen
  };

  // Reset order creator
  const handleResetOrderForm = () => {
    setPlates('');
    setBrand('');
    setModel('');
    setYear(2020);
    setMileage(0);
    setPermanentNotes('');
    setClientName('');
    setClientPhone('');
    setClientWhatsApp('');
    setClientEmail('');
    setChecklist({ luces: 'OK', llantas: 'OK', niveles: 'OK', frenos: 'OK', extraNotes: '' });
    setSelectedPackageId('');
    setCustomServiceIds([]);
    setCustomProducts([]);
    setPaymentMethod('Efectivo');
    setCompletedOrder(null);
    setStep(1);
  };

  // Interactive Product Selector for Custom Insumos
  const handleAddCustomProduct = (productId: string) => {
    if (!productId) return;
    const exists = customProducts.find(cp => cp.productId === productId);
    if (exists) {
      setCustomProducts(customProducts.map(cp => cp.productId === productId ? { ...cp, quantity: cp.quantity + 1 } : cp));
    } else {
      setCustomProducts([...customProducts, { productId, quantity: 1 }]);
    }
  };

  const handleRemoveCustomProduct = (productId: string) => {
    setCustomProducts(customProducts.filter(cp => cp.productId !== productId));
  };

  const toggleCustomService = (serviceId: string) => {
    if (customServiceIds.includes(serviceId)) {
      setCustomServiceIds(customServiceIds.filter(id => id !== serviceId));
    } else {
      setCustomServiceIds([...customServiceIds, serviceId]);
    }
  };

  // 2. CLIENT HISTORY FILTERS
  const filteredClients = useMemo(() => {
    const q = clientSearchQuery.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [clients, clientSearchQuery]);

  // 3. VEHICLE HISTORY TIMELINE
  const filteredVehicles = useMemo(() => {
    const q = vehicleSearchQuery.toUpperCase().trim();
    if (!q) return vehicles;
    return vehicles.filter(v => v.plates.includes(q) || v.brand.toLowerCase().includes(q.toLowerCase()));
  }, [vehicles, vehicleSearchQuery]);

  const [selectedVehiclePlates, setSelectedVehiclePlates] = useState<string | null>(null);
  const activeVehicleTimeline = useMemo(() => {
    if (!selectedVehiclePlates) return [];
    return orders.filter(o => o.plates === selectedVehiclePlates).sort((a, b) => b.date.localeCompare(a.date));
  }, [orders, selectedVehiclePlates]);

  const activeVehicleObject = useMemo(() => {
    return vehicles.find(v => v.plates === selectedVehiclePlates);
  }, [vehicles, selectedVehiclePlates]);

  // Mileage growth analysis
  const mileageDiffAnalysis = useMemo(() => {
    if (activeVehicleTimeline.length < 2) return null;
    const sorted = [...activeVehicleTimeline].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const diffKm = last.mileage - first.mileage;
    const firstDate = new Date(first.date);
    const lastDate = new Date(last.date);
    const months = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4));
    const avgMonthlyKm = Math.round(diffKm / months);
    return {
      totalGrowth: diffKm,
      monthlyAvg: avgMonthlyKm,
      isHighWear: avgMonthlyKm > 2500 // Alert if user drives >2500 km per month
    };
  }, [activeVehicleTimeline]);

  // 4. MARKETING REMINDERS SEGMENTATION
  // Clients that are due for service (next visit date has passed, or they have high predicted mileage)
  const marketingRemindersList = useMemo(() => {
    const todayStr = '2026-07-16';
    const reminders: { clientName: string; phone: string; car: string; plates: string; lastService: string; nextServiceDate: string; reason: string }[] = [];

    // Map each vehicle to its latest order
    const latestOrderPerVehicle: Record<string, Order> = {};
    orders.forEach(o => {
      const prev = latestOrderPerVehicle[o.plates];
      if (!prev || o.date.localeCompare(prev.date) > 0) {
        latestOrderPerVehicle[o.plates] = o;
      }
    });

    Object.values(latestOrderPerVehicle).forEach(o => {
      const isPastDate = o.nextServiceDate.localeCompare(todayStr) <= 0;
      if (isPastDate) {
        reminders.push({
          clientName: o.clientName,
          phone: o.clientPhone,
          car: `${o.vehicleBrand} ${o.vehicleModel}`,
          plates: o.plates,
          lastService: o.date,
          nextServiceDate: o.nextServiceDate,
          reason: 'Fecha de mantenimiento vencida'
        });
      }
    });

    return reminders;
  }, [orders]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-zinc-850 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              id="op-btn-back"
              onClick={onBackToHome}
              className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
              title="Volver al menú de roles"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg animate-pulse">
                <Wrench className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-base font-semibold leading-tight">Lubricación Express</h1>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-emerald-400 font-mono tracking-wider">MÓDULO DE TALLER</span>
                  <span className="text-zinc-600 text-[10px]">•</span>
                  {/* Quick operator switcher */}
                  <select
                    id="op-select-user"
                    value={selectedOperatorId}
                    onChange={e => setSelectedOperatorId(e.target.value)}
                    className="bg-transparent text-[10px] text-zinc-400 focus:text-zinc-100 font-medium focus:outline-none cursor-pointer hover:underline"
                  >
                    {operators.map(op => (
                      <option key={op.id} value={op.id} className="bg-zinc-900 text-zinc-300">Atiende: {op.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono">
              Operador: <span className="text-sky-400 font-bold">{activeOperator?.name || 'Mecánico'}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 pt-5 pb-24 md:pb-5 flex flex-col md:flex-row gap-5">
        
        {/* Navigation Sidebar */}
        <aside className="hidden md:block md:w-56 flex-shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 border-b md:border-b-0 border-zinc-800">
            <button
              id="op-tab-pos"
              onClick={() => setActiveTab('pos')}
              className={`flex items-center space-x-2.5 px-3 py-2.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'pos' 
                  ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Servicio Exprés (POS)</span>
            </button>

            <button
              id="op-tab-clients"
              onClick={() => { setActiveTab('clients'); setClientSearchQuery(''); }}
              className={`flex items-center space-x-2.5 px-3 py-2.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'clients' 
                  ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Historial Clientes</span>
            </button>

            <button
              id="op-tab-vehicles"
              onClick={() => { setActiveTab('vehicles'); setVehicleSearchQuery(''); }}
              className={`flex items-center space-x-2.5 px-3 py-2.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'vehicles' 
                  ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Historial Vehículos</span>
            </button>

            <button
              id="op-tab-reminders"
              onClick={() => setActiveTab('reminders')}
              className={`flex items-center space-x-2.5 px-3 py-2.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'reminders' 
                  ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Marketing ({marketingRemindersList.length})</span>
            </button>
          </nav>
        </aside>

        {/* Dynamic Content Panel */}
        <section className="flex-1 bg-zinc-900/30 border border-zinc-800/85 rounded-xl p-4 md:p-5 backdrop-blur-sm shadow-xl min-h-[500px]">
          
          {/* TAB 1: SERVICIO EXPRÉS (PUNTO DE VENTA) */}
          {activeTab === 'pos' && (
            <div className="space-y-4">
              {/* Steps Progress */}
              <div className="flex items-center space-x-3 text-xs border-b border-zinc-850 pb-3">
                <span className={`px-2.5 py-1 rounded-md font-mono font-bold ${
                  step >= 1 ? 'bg-sky-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500'
                }`}>1</span>
                <span className="text-zinc-600">Recepción</span>
                <span className="text-zinc-700">/</span>
                
                <span className={`px-2.5 py-1 rounded-md font-mono font-bold ${
                  step >= 2 ? 'bg-sky-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500'
                }`}>2</span>
                <span className="text-zinc-600">Checklist & Servicios</span>
                <span className="text-zinc-700">/</span>
                
                <span className={`px-2.5 py-1 rounded-md font-mono font-bold ${
                  step === 3 ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500'
                }`}>3</span>
                <span className="text-zinc-600">Ticket</span>
              </div>

              {/* STEP 1: RECEPCION AUTO Y CLIENTE */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400">Recepción Exprés de Vehículo</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Ingresa placas o teléfono del cliente para rellenar datos al instante.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Vehicle section */}
                    <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-3">
                      <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wide block">1. Datos del Automóvil</span>
                      
                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase font-mono mb-1">Placas (Buscador centralizado)</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. NMX-45-89"
                          value={plates}
                          onChange={e => handleLookupPlates(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono uppercase tracking-wider text-zinc-100 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-zinc-500 uppercase font-mono mb-1">Marca</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Toyota"
                            value={brand}
                            onChange={e => setBrand(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 uppercase font-mono mb-1">Modelo</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Corolla"
                            value={model}
                            onChange={e => setModel(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-zinc-500 uppercase font-mono mb-1">Año</label>
                          <input
                            type="number"
                            required
                            min="1950"
                            max="2027"
                            value={year || ''}
                            onChange={e => setYear(Number(e.target.value))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 uppercase font-mono mb-1">Kilometraje Actual</label>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="Ej. 58200"
                            value={mileage || ''}
                            onChange={e => setMileage(Number(e.target.value))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase font-mono mb-1">Notas Técnicas Permanentes</label>
                        <textarea
                          placeholder="Ej. Rosca de cárter barrida, fugas, etc."
                          value={permanentNotes}
                          onChange={e => setPermanentNotes(e.target.value)}
                          rows={2}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200"
                        />
                      </div>
                    </div>

                    {/* Customer Section */}
                    <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-3">
                      <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wide block">2. Datos de Contacto del Dueño</span>
                      
                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase font-mono mb-1">Teléfono (Buscador centralizado)</label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="Ej. 5512345678"
                          value={clientPhone}
                          onChange={e => handleLookupClientPhone(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase font-mono mb-1">Nombre Completo del Cliente</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Sofía Martínez"
                          value={clientName}
                          onChange={e => setClientName(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase font-mono mb-1">WhatsApp para Envío de Ticket</label>
                        <input
                          type="tel"
                          required
                          placeholder="Ej. 5512345678"
                          value={clientWhatsApp}
                          onChange={e => setClientWhatsApp(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 uppercase font-mono mb-1">Correo Electrónico</label>
                        <input
                          type="email"
                          placeholder="sofia@gmail.com"
                          value={clientEmail}
                          onChange={e => setClientEmail(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={!plates || !brand || !model || mileage <= 0 || !clientName || !clientPhone}
                      onClick={() => setStep(2)}
                      className="px-5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-zinc-950 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md"
                    >
                      <span>Siguiente: Inspección y Servicios</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: CHECKLIST & SELECTION */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400">Inspección Visual & Selección de Insumos</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">Realiza el checklist rápido para sugerir servicios adicionales.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center space-x-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Volver</span>
                    </button>
                  </div>

                  <form onSubmit={handleCompleteOrder} className="space-y-5">
                    
                    {/* Visual Checklist Grid */}
                    <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-3.5">
                      <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wide block">1. Checklist de Entrada Rápida</span>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-zinc-950 p-2 border border-zinc-850 rounded-lg space-y-1 text-center">
                          <span className="block text-[10px] text-zinc-400">💡 Luces & Faros</span>
                          <div className="flex justify-center space-x-1 mt-1.5">
                            {['OK', 'Revisar', 'Falla'].map(status => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => setChecklist({ ...checklist, luces: status as any })}
                                className={`text-[9px] px-2 py-0.5 rounded font-bold font-mono transition-colors ${
                                  checklist.luces === status 
                                    ? status === 'OK' ? 'bg-emerald-500 text-zinc-950' : status === 'Revisar' ? 'bg-amber-500 text-zinc-950' : 'bg-red-500 text-zinc-100'
                                    : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-zinc-950 p-2 border border-zinc-850 rounded-lg space-y-1 text-center">
                          <span className="block text-[10px] text-zinc-400">🛞 Llantas (Presión/Desgaste)</span>
                          <div className="flex justify-center space-x-1 mt-1.5">
                            {['OK', 'Revisar', 'Falla'].map(status => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => setChecklist({ ...checklist, llantas: status as any })}
                                className={`text-[9px] px-2 py-0.5 rounded font-bold font-mono transition-colors ${
                                  checklist.llantas === status 
                                    ? status === 'OK' ? 'bg-emerald-500 text-zinc-950' : status === 'Revisar' ? 'bg-amber-500 text-zinc-950' : 'bg-red-500 text-zinc-100'
                                    : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-zinc-950 p-2 border border-zinc-850 rounded-lg space-y-1 text-center">
                          <span className="block text-[10px] text-zinc-400">🧪 Niveles de Fluidos</span>
                          <div className="flex justify-center space-x-1 mt-1.5">
                            {['OK', 'Revisar', 'Falla'].map(status => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => setChecklist({ ...checklist, niveles: status as any })}
                                className={`text-[9px] px-2 py-0.5 rounded font-bold font-mono transition-colors ${
                                  checklist.niveles === status 
                                    ? status === 'OK' ? 'bg-emerald-500 text-zinc-950' : status === 'Revisar' ? 'bg-amber-500 text-zinc-950' : 'bg-red-500 text-zinc-100'
                                    : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-zinc-950 p-2 border border-zinc-850 rounded-lg space-y-1 text-center">
                          <span className="block text-[10px] text-zinc-400">🛑 Estado de Frenos</span>
                          <div className="flex justify-center space-x-1 mt-1.5">
                            {['OK', 'Revisar', 'Falla'].map(status => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => setChecklist({ ...checklist, frenos: status as any })}
                                className={`text-[9px] px-2 py-0.5 rounded font-bold font-mono transition-colors ${
                                  checklist.frenos === status 
                                    ? status === 'OK' ? 'bg-emerald-500 text-zinc-950' : status === 'Revisar' ? 'bg-amber-500 text-zinc-950' : 'bg-red-500 text-zinc-100'
                                    : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Observaciones extra del checklist... (ej. Faro izquierdo fundido, baja presión en llanta trasera)"
                          value={checklist.extraNotes}
                          onChange={e => setChecklist({ ...checklist, extraNotes: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Services and Insumos Selector Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      
                      {/* Paquetes base */}
                      <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-3 lg:col-span-1">
                        <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wide block">2. Selecciona un Paquete</span>
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPackageId('')}
                            className={`w-full text-left p-2.5 rounded-lg text-xs border transition-all ${
                              !selectedPackageId 
                                ? 'bg-sky-500/10 border-sky-500 text-zinc-200 font-semibold' 
                                : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                            }`}
                          >
                            <span>Ninguno / Servicio Personalizado</span>
                          </button>
                          {packages.filter(p => p.isActive).map(pkg => (
                            <button
                              key={pkg.id}
                              type="button"
                              onClick={() => setSelectedPackageId(pkg.id)}
                              className={`w-full text-left p-2.5 rounded-lg text-xs border transition-all flex justify-between items-center ${
                                selectedPackageId === pkg.id 
                                  ? 'bg-sky-500/10 border-sky-500 text-zinc-200 font-semibold' 
                                  : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                              }`}
                            >
                              <div>
                                <span className="block">{pkg.name}</span>
                                <span className="text-[10px] text-zinc-500 font-normal">Aceite + Filtro + Inspección</span>
                              </div>
                              <span className="font-mono text-sky-400 font-bold">${pkg.sellPrice}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom additions */}
                      <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-3 lg:col-span-2">
                        <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wide block">3. Adicionales (Mano de Obra & Insumos Extra)</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Services */}
                          <div className="space-y-1.5">
                            <span className="block text-[10px] text-zinc-400 font-mono">Servicios Extra</span>
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                              {services.filter(s => s.isActive).map(s => {
                                const isChecked = customServiceIds.includes(s.id);
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => toggleCustomService(s.id)}
                                    className={`w-full text-left p-2 rounded text-xs flex items-center justify-between border transition-all ${
                                      isChecked 
                                        ? 'bg-sky-500/10 border-sky-500/40 text-zinc-200' 
                                        : 'bg-zinc-950 border-zinc-850 text-zinc-400'
                                    }`}
                                  >
                                    <span>{s.name}</span>
                                    <span className="font-mono text-[11px]">${s.basePrice}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Extra products picker */}
                          <div className="space-y-1.5">
                            <span className="block text-[10px] text-zinc-400 font-mono">Insumos Extra (Aceite adicional, Bujías, Aditivos)</span>
                            <select
                              onChange={e => {
                                handleAddCustomProduct(e.target.value);
                                e.target.value = '';
                              }}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 mb-2 focus:outline-none"
                            >
                              <option value="">+ Agregar insumos de almacén...</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (${p.sellPrice})</option>
                              ))}
                            </select>

                            <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1">
                              {customProducts.map(cp => {
                                const prod = products.find(p => p.id === cp.productId);
                                if (!prod) return null;
                                return (
                                  <div key={cp.productId} className="flex items-center justify-between p-1.5 bg-zinc-950 rounded text-xs border border-zinc-850">
                                    <span className="truncate max-w-[130px]">{prod.name}</span>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="number"
                                        min="1"
                                        value={cp.quantity}
                                        onChange={e => {
                                          const val = Number(e.target.value);
                                          if (val > 0) {
                                            setCustomProducts(customProducts.map(p => p.productId === cp.productId ? { ...p, quantity: val } : p));
                                          }
                                        }}
                                        className="w-8 bg-zinc-900 border border-zinc-800 text-center rounded text-xs py-0.5"
                                      />
                                      <button 
                                        type="button" 
                                        onClick={() => handleRemoveCustomProduct(cp.productId)} 
                                        className="text-zinc-500 hover:text-red-400"
                                      >
                                        &times;
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order summary bar & Method of Payment */}
                    <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div>
                          <span className="block text-[10px] text-zinc-400 font-mono">MÉTODO DE PAGO</span>
                          <div className="flex space-x-1.5 mt-1">
                            {['Efectivo', 'Tarjeta', 'Transferencia'].map(method => (
                              <button
                                key={method}
                                type="button"
                                onClick={() => setPaymentMethod(method as any)}
                                className={`text-[10px] px-2.5 py-1 rounded font-semibold transition-colors ${
                                  paymentMethod === method 
                                    ? 'bg-sky-500 text-zinc-950' 
                                    : 'bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-zinc-200'
                                }`}
                              >
                                {method}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="block text-[10px] text-zinc-400 font-mono">PRÓXIMO CAMBIO SUGERIDO</span>
                          <span className="text-xs text-zinc-300 mt-1 block font-semibold">
                            {liveOrderTotals.isSynthetic ? '+10,000 km (Sintético)' : '+5,000 km (Mineral)'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="block text-[10px] text-zinc-500 font-mono">TOTAL A LIQUIDAR</span>
                          <span className="text-xl font-bold font-mono text-sky-400">${liveOrderTotals.total} MXN</span>
                        </div>

                        <button
                          type="submit"
                          disabled={liveOrderTotals.total === 0}
                          className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 rounded-lg text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Finalizar Orden & Ticket</span>
                        </button>
                      </div>
                    </div>

                  </form>
                </div>
              )}

              {/* STEP 3: TICKET SUMMARY SCREEN */}
              {step === 3 && completedOrder && (
                <div className="space-y-5">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                        <Check className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">¡Servicio Registrado Exitosamente!</h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">La orden se guardó y el inventario se actualizó automáticamente.</p>
                      </div>
                    </div>
                    <button
                      onClick={handleResetOrderForm}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Nueva Orden</span>
                    </button>
                  </div>

                  {/* Printable & digital ticket layout */}
                  <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl p-6 font-mono text-xs text-zinc-300 space-y-4">
                    <div className="text-center border-b border-dashed border-zinc-800 pb-4 space-y-1">
                      <h3 className="text-base font-bold text-zinc-100">LUBRICACIÓN EXPRESS</h3>
                      <p className="text-[10px] text-zinc-500">Mantenimiento Preventivo Automotriz</p>
                      <p className="text-[9px] text-zinc-500">Calle Taller #123, Ciudad de México</p>
                      <p className="text-[10px] text-sky-400 font-bold mt-1.5">TICKET: {completedOrder.id}</p>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">FECHA:</span>
                        <span>{completedOrder.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">MECÁNICO:</span>
                        <span>{completedOrder.operatorName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">CLIENTE:</span>
                        <span className="truncate max-w-[200px]">{completedOrder.clientName}</span>
                      </div>
                    </div>

                    <div className="border-t border-b border-dashed border-zinc-800 py-3 space-y-1.5">
                      <span className="text-[10px] text-zinc-500 font-bold">VEHÍCULO</span>
                      <div className="flex justify-between text-zinc-200">
                        <span>{completedOrder.vehicleBrand} {completedOrder.vehicleModel} ({completedOrder.vehicleYear})</span>
                        <span className="font-bold">{completedOrder.plates}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">KILOMETRAJE:</span>
                        <span>{completedOrder.mileage} KM</span>
                      </div>
                    </div>

                    {/* Service Checklist results on ticket */}
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-850 text-[10px] space-y-1">
                      <span className="text-zinc-500 font-bold">INSPECCIÓN VISUAL</span>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                        <div className="flex justify-between"><span>Luces:</span> <span className="font-bold text-emerald-400">{completedOrder.checklist.luces}</span></div>
                        <div className="flex justify-between"><span>Llantas:</span> <span className="font-bold text-emerald-400">{completedOrder.checklist.llantas}</span></div>
                        <div className="flex justify-between"><span>Niveles:</span> <span className="font-bold text-emerald-400">{completedOrder.checklist.niveles}</span></div>
                        <div className="flex justify-between"><span>Frenos:</span> <span className="font-bold text-emerald-400">{completedOrder.checklist.frenos}</span></div>
                      </div>
                      {completedOrder.checklist.extraNotes && (
                        <p className="text-[9px] text-zinc-500 mt-1 italic">Obs: {completedOrder.checklist.extraNotes}</p>
                      )}
                    </div>

                    <div className="space-y-2 border-b border-dashed border-zinc-800 pb-3">
                      <span className="text-[10px] text-zinc-500 font-bold">DETALLE DE COMPRA</span>
                      {completedOrder.products.map((p, idx) => {
                        const prod = products.find(prodObj => prodObj.id === p.productId);
                        return (
                          <div key={idx} className="flex justify-between">
                            <span>{p.quantity}x {prod?.name || 'Insumo'}</span>
                            <span>${p.sellPrice * p.quantity}</span>
                          </div>
                        );
                      })}
                      {completedOrder.services.map((sId, idx) => {
                        const srv = services.find(s => s.id === sId);
                        return (
                          <div key={idx} className="flex justify-between">
                            <span>🔧 {srv?.name || 'Mano de obra'}</span>
                            <span>${srv?.basePrice || 0}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-zinc-400">
                        <span>PAGO ({completedOrder.paymentMethod}):</span>
                        <span className="font-bold text-zinc-200">${completedOrder.totalPaid} MXN</span>
                      </div>
                      <div className="flex justify-between text-sky-400 font-bold border-t border-zinc-800 pt-2 text-[11px]">
                        <span>PRÓXIMA VISITA:</span>
                        <span>{completedOrder.nextServiceMileage} KM</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>FECHA ESTIMADA:</span>
                        <span>{completedOrder.nextServiceDate}</span>
                      </div>
                    </div>

                    {/* WhatsApp simulated sharing links */}
                    <div className="pt-4 border-t border-dashed border-zinc-800 flex flex-col gap-2">
                      <a
                        id="op-whatsapp-btn"
                        href={`https://wa.me/${completedOrder.clientWhatsApp}?text=Hola%20${encodeURIComponent(completedOrder.clientName)}%2C%20tu%20servicio%20en%20Lubricaci%C3%B3n%20Express%20est%C3%A1%20listo.%20Pr%C3%B3ximo%20servicio%3A%20${completedOrder.nextServiceMileage}%20km.%20Consulta%20tu%20historial%20completo%20aqu%C3%AD%3A%20https%3A%2F%2Flube-express.app%2Fhistorial%2F${completedOrder.plates}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded-lg text-center flex items-center justify-center space-x-1.5 transition-colors font-sans cursor-pointer text-zinc-950"
                      >
                        <Send className="w-4 h-4 text-zinc-950" />
                        <span>Enviar por WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HISTORIAL DE CLIENTES */}
          {activeTab === 'clients' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400">Buscador Centralizado de Clientes</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Encuentra perfiles y asocia vehículos a familias o micro-flotillas.</p>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-500">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por nombre o teléfono..."
                    value={clientSearchQuery}
                    onChange={e => setClientSearchQuery(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-100 focus:outline-none focus:border-sky-500 w-full sm:w-64 font-mono"
                  />
                </div>
              </div>

              {/* Grid of clients cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredClients.map(c => {
                  // Find fleet associated
                  const associatedVehicles = vehicles.filter(v => {
                    // Match by owner or from past orders owner name
                    const isOwnerInPastOrder = orders.some(o => o.plates === v.plates && o.clientPhone === c.phone);
                    return isOwnerInPastOrder;
                  });

                  return (
                    <div key={c.id} className="p-4 bg-zinc-900/50 border border-zinc-850 rounded-xl space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-200">{c.name}</h4>
                          <span className="text-[9px] text-zinc-500 font-mono">CÓDIGO: {c.id}</span>
                        </div>
                        <div className="text-right">
                          <span className="bg-sky-500/10 text-sky-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold block">
                            {c.visitCount} Visitas Totales
                          </span>
                        </div>
                      </div>

                      {/* Contact row */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 border-t border-zinc-850 pt-2.5 font-mono">
                        <div className="flex items-center space-x-1.5">
                          <Phone className="w-3.5 h-3.5 text-sky-400" />
                          <span>{c.phone}</span>
                        </div>
                        <div className="text-right truncate">
                          <span>{c.email || 'Sin correo'}</span>
                        </div>
                      </div>

                      {/* Fleet associated list */}
                      <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-850 space-y-1.5">
                        <span className="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">Flota de Vehículos Asociada</span>
                        {associatedVehicles.length === 0 ? (
                          <span className="text-[10px] text-zinc-500 block italic">Sin vehículos asociados en este historial</span>
                        ) : (
                          <div className="grid grid-cols-2 gap-1.5">
                            {associatedVehicles.map(v => (
                              <button
                                key={v.plates}
                                onClick={() => {
                                  setSelectedVehiclePlates(v.plates);
                                  setActiveTab('vehicles');
                                }}
                                className="text-left text-[10px] p-1.5 bg-zinc-900 rounded border border-zinc-800 hover:border-sky-500/50 transition-all flex justify-between items-center"
                              >
                                <span>🚗 {v.brand} {v.model}</span>
                                <span className="font-mono text-sky-400 font-bold">{v.plates}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: HISTORIAL DE AUTOMÓVILES */}
          {activeTab === 'vehicles' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400">Hoja de Vida Técnica del Vehículo</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Busca por placas o VIN para consultar la línea de tiempo de mantenimiento.</p>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-500">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Filtrar por placas o marca..."
                    value={vehicleSearchQuery}
                    onChange={e => setVehicleSearchQuery(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-100 focus:outline-none focus:border-sky-500 w-full sm:w-64 font-mono uppercase"
                  />
                </div>
              </div>

              {/* Grid of Vehicles and Timeline details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* Vehicle Selection List */}
                <div className="space-y-2 lg:col-span-1 max-h-[450px] overflow-y-auto pr-1">
                  <span className="block text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Automóviles Registrados</span>
                  {filteredVehicles.map(v => (
                    <button
                      key={v.plates}
                      onClick={() => setSelectedVehiclePlates(v.plates)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                        selectedVehiclePlates === v.plates 
                          ? 'bg-sky-500/10 border-sky-500 text-zinc-200' 
                          : 'bg-zinc-900/60 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                      }`}
                    >
                      <div>
                        <span className="block font-semibold text-zinc-200 text-xs">{v.brand} {v.model} ({v.year})</span>
                        <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">{v.mileage} KM recorridos</span>
                      </div>
                      <span className="font-mono text-sky-400 font-bold bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">{v.plates}</span>
                    </button>
                  ))}
                </div>

                {/* Timeline and technical notes detailed view */}
                <div className="lg:col-span-2 space-y-4">
                  {!selectedVehiclePlates ? (
                    <div className="p-10 bg-zinc-950/20 border border-dashed border-zinc-850 rounded-xl text-center text-xs text-zinc-500 flex flex-col items-center justify-center space-y-2">
                      <Car className="w-8 h-8 text-zinc-600" />
                      <span>Selecciona un vehículo de la lista de la izquierda para ver su historial técnico completo</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      
                      {/* Technical Info & Permanent Notes */}
                      {activeVehicleObject && (
                        <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-3">
                          <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                            <div>
                              <h4 className="text-xs font-bold text-zinc-200">{activeVehicleObject.brand} {activeVehicleObject.model}</h4>
                              <span className="text-[10px] text-zinc-500 font-mono">Placas: {activeVehicleObject.plates} | Año: {activeVehicleObject.year}</span>
                            </div>
                            <span className="text-xs font-mono bg-zinc-950 text-sky-400 font-bold px-3 py-1 rounded border border-zinc-800">
                              {activeVehicleObject.mileage} KM
                            </span>
                          </div>

                          {/* Mileage Evolution indicator */}
                          {mileageDiffAnalysis && (
                            <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-lg flex items-center justify-between text-[11px] font-mono">
                              <span className="text-zinc-500">Uso promedio mensual:</span>
                              <span className={`font-bold px-2 py-0.5 rounded ${
                                mileageDiffAnalysis.isHighWear ? 'bg-amber-500/10 text-amber-400' : 'bg-sky-500/10 text-sky-400'
                              }`}>
                                ~{mileageDiffAnalysis.monthlyAvg} KM / mes
                                {mileageDiffAnalysis.isHighWear && ' (Uso Intenso)'}
                              </span>
                            </div>
                          )}

                          {/* Permanent Notes Edit Form */}
                          <div>
                            <label className="block text-[10px] text-amber-400 uppercase font-mono mb-1.5 flex items-center">
                              <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                              Observaciones Técnicas Permanentes (No se borran)
                            </label>
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                placeholder="Agregar observación fija del carro..."
                                value={permanentNotes}
                                onChange={e => setPermanentNotes(e.target.value)}
                                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateVehicleNotes(selectedVehiclePlates, permanentNotes);
                                  alert('Observación fija actualizada');
                                }}
                                className="px-3 bg-zinc-800 border border-zinc-750 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Service Timeline */}
                      <div className="space-y-3">
                        <span className="block text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Historial Cronológico de Visitas</span>
                        
                        {activeVehicleTimeline.length === 0 ? (
                          <div className="p-6 bg-zinc-900 border border-zinc-850 rounded-xl text-center text-[11px] text-zinc-500 italic">
                            Sin servicios registrados aún para este automóvil en el sistema.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {activeVehicleTimeline.map(order => (
                              <div key={order.id} className="p-3.5 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-2 text-xs relative">
                                <div className="absolute right-3 top-3 text-[10px] text-zinc-500 font-mono">
                                  {order.date}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="px-1.5 py-0.5 bg-zinc-800 text-sky-400 font-mono text-[10px] font-bold rounded">
                                    {order.id}
                                  </span>
                                  <span className="text-zinc-200 font-semibold">{order.mileage} KM</span>
                                  <span className="text-zinc-600">•</span>
                                  <span className="text-zinc-400">Atendió: {order.operatorName}</span>
                                </div>

                                <div className="text-[11px] text-zinc-400">
                                  <span className="text-zinc-500 font-bold">Detalle:</span>{' '}
                                  {order.products.map(p => {
                                    const prod = products.find(prodObj => prodObj.id === p.productId);
                                    return prod ? `${p.quantity}x ${prod.name}` : null;
                                  }).filter(Boolean).join(', ')}
                                  {order.services.map(sId => {
                                    const srv = services.find(s => s.id === sId);
                                    return srv ? `, ${srv.name}` : null;
                                  }).filter(Boolean).join('')}
                                </div>

                                <div className="text-[10px] text-zinc-500 flex justify-between items-center border-t border-zinc-850 pt-2 mt-1">
                                  <span>Próximo cambio calculado en: <strong className="text-sky-400 font-mono">{order.nextServiceMileage} KM</strong> ({order.nextServiceDate})</span>
                                  <span className="bg-zinc-950 px-1.5 py-0.5 rounded text-[9px] text-zinc-400 border border-zinc-850 font-semibold">
                                    Pago: {order.paymentMethod}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: RECORDATORIOS DE MARKETING SEGMENTADOS */}
          {activeTab === 'reminders' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400">Campañas & Recordatorios de Mantenimiento</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Lista de clientes que ya necesitan servicio según su kilometraje o fecha de última visita.</p>
              </div>

              {/* Reminders Table */}
              {marketingRemindersList.length === 0 ? (
                <div className="p-8 bg-zinc-900 border border-zinc-850 rounded-xl text-center text-xs text-zinc-500 italic">
                  Todos los clientes se encuentran al día con sus servicios de lubricación.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-sky-500/10 p-3 rounded-lg border border-sky-500/20">
                    <span className="text-xs text-sky-400 font-semibold font-mono">Segmento: Clientes con Mantenimiento Vencido ({marketingRemindersList.length})</span>
                    <button
                      onClick={() => {
                        const csvContent = "data:text/csv;charset=utf-8,Cliente,Telefono,Vehiculo,UltimoServicio,FechaProxima,Motivo\n" 
                          + marketingRemindersList.map(r => `"${r.clientName}","${r.phone}","${r.car}","${r.lastService}","${r.nextServiceDate}","${r.reason}"`).join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", "recordatorios_lubricacion.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-2.5 py-1 bg-sky-500 text-zinc-950 text-[11px] font-bold rounded hover:bg-sky-400 transition-all font-sans cursor-pointer"
                    >
                      Exportar para WhatsApp/Meta Ads (.CSV)
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-zinc-850">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-900 border-b border-zinc-800 text-[9px] uppercase font-mono text-zinc-500">
                          <th className="p-3">Dueño / Carro</th>
                          <th className="p-3">Celular WhatsApp</th>
                          <th className="p-3">Último Servicio</th>
                          <th className="p-3">Próximo Vencido</th>
                          <th className="p-3 text-right">Contacto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850 text-xs">
                        {marketingRemindersList.map((rem, idx) => (
                          <tr key={idx} className="hover:bg-zinc-900/30 transition-colors">
                            <td className="p-3">
                              <div>
                                <span className="font-semibold text-zinc-200 block">{rem.clientName}</span>
                                <span className="text-[10px] text-zinc-500">🚗 {rem.car} ({rem.plates})</span>
                              </div>
                            </td>
                            <td className="p-3 font-mono text-zinc-400">{rem.phone}</td>
                            <td className="p-3 text-zinc-400 font-mono">{rem.lastService}</td>
                            <td className="p-3 font-mono text-red-400 font-semibold">{rem.nextServiceDate}</td>
                            <td className="p-3 text-right">
                              <a
                                href={`https://wa.me/${rem.phone}?text=Hola%20${encodeURIComponent(rem.clientName)}%2C%20te%20escribimos%20de%20Lubricaci%C3%B3n%20Express.%20Notamos%20que%20tu%20${encodeURIComponent(rem.car)}%20ya%20requiere%20su%20cambio%20de%20aceite%20peri%C3%B3dico.%20%C2%BFTe%20gustar%C3%ADa%20agendar%20hoy%3F`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/10 transition-colors font-sans cursor-pointer inline-block"
                              >
                                Enviar WhatsApp
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </section>
      </main>

      {/* Bottom Navigation for Mobile / Tablet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg px-2 flex justify-around items-center h-16 md:hidden">
        <button
          id="op-m-tab-pos"
          onClick={() => setActiveTab('pos')}
          className={`flex flex-col items-center justify-center w-20 h-full transition-colors cursor-pointer ${
            activeTab === 'pos' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Wrench className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Servicio POS</span>
        </button>

        <button
          id="op-m-tab-clients"
          onClick={() => { setActiveTab('clients'); setClientSearchQuery(''); }}
          className={`flex flex-col items-center justify-center w-20 h-full transition-colors cursor-pointer ${
            activeTab === 'clients' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Clientes</span>
        </button>

        <button
          id="op-m-tab-vehicles"
          onClick={() => { setActiveTab('vehicles'); setVehicleSearchQuery(''); }}
          className={`flex flex-col items-center justify-center w-20 h-full transition-colors cursor-pointer ${
            activeTab === 'vehicles' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Car className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Vehículos</span>
        </button>

        <button
          id="op-m-tab-reminders"
          onClick={() => setActiveTab('reminders')}
          className={`flex flex-col items-center justify-center w-20 h-full transition-colors cursor-pointer ${
            activeTab === 'reminders' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="relative">
            <Calendar className="w-5 h-5" />
            {marketingRemindersList.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] px-1 rounded-full font-mono font-bold animate-pulse">
                {marketingRemindersList.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-1">Marketing</span>
        </button>
      </div>
    </div>
  );
}
