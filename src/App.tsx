import { useState, useEffect } from 'react';
import { Shield, Wrench, Download, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, ServiceBase, ServicePackage, Operator, Client, Vehicle, Order } from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_SERVICES, 
  INITIAL_PACKAGES, 
  INITIAL_OPERATORS, 
  INITIAL_CLIENTS, 
  INITIAL_VEHICLES, 
  INITIAL_ORDERS 
} from './data/mockData';
import AdminDashboard from './components/AdminDashboard';
import OperatorDashboard from './components/OperatorDashboard';

export default function App() {
  // Role selector view
  const [currentRole, setCurrentRole] = useState<'home' | 'admin' | 'operator'>('home');

  // Load States from LocalStorage or fallback to seed data
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('le_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [services, setServices] = useState<ServiceBase[]>(() => {
    const saved = localStorage.getItem('le_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [packages, setPackages] = useState<ServicePackage[]>(() => {
    const saved = localStorage.getItem('le_packages');
    return saved ? JSON.parse(saved) : INITIAL_PACKAGES;
  });

  const [operators, setOperators] = useState<Operator[]>(() => {
    const saved = localStorage.getItem('le_operators');
    return saved ? JSON.parse(saved) : INITIAL_OPERATORS;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('le_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('le_vehicles');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('le_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  // Sync back to local storage
  useEffect(() => {
    localStorage.setItem('le_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('le_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('le_packages', JSON.stringify(packages));
  }, [packages]);

  useEffect(() => {
    localStorage.setItem('le_operators', JSON.stringify(operators));
  }, [operators]);

  useEffect(() => {
    localStorage.setItem('le_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('le_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('le_orders', JSON.stringify(orders));
  }, [orders]);

  // PWA Installation state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } else {
      alert(
        '¡Lubricación Express está lista para instalar!\n\nEn tu celular o computadora, haz clic en el botón de compartir de tu navegador y selecciona "Agregar a pantalla de inicio" o "Instalar Aplicación" para tener acceso directo instantáneo.'
      );
    }
  };

  // State callbacks
  const handleAddOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    
    // Deduct stock for products used in this order
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        const matchingDeduction = newOrder.products.find(op => op.productId === prod.id);
        if (matchingDeduction) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - matchingDeduction.quantity)
          };
        }
        return prod;
      });
    });

    // Increment client visits count if exist
    setClients(prevClients => {
      return prevClients.map(c => {
        if (c.phone.trim() === newOrder.clientPhone.trim()) {
          return {
            ...c,
            visitCount: c.visitCount + 1,
            lastVisitDate: newOrder.date
          };
        }
        return c;
      });
    });

    // Update vehicle mileage if exist
    setVehicles(prevVehicles => {
      return prevVehicles.map(v => {
        if (v.plates === newOrder.plates) {
          return {
            ...v,
            mileage: Math.max(v.mileage, newOrder.mileage)
          };
        }
        return v;
      });
    });
  };

  const handleAddClient = (newClient: Client) => {
    setClients(prev => [...prev, newClient]);
  };

  const handleAddVehicle = (newVehicle: Vehicle) => {
    setVehicles(prev => [...prev, newVehicle]);
  };

  const handleUpdateVehicleNotes = (plates: string, notes: string) => {
    setVehicles(prev => prev.map(v => v.plates === plates ? { ...v, permanentNotes: notes } : v));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col justify-between font-sans select-none">
      <AnimatePresence mode="wait">
        {currentRole === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 flex flex-col items-center justify-center px-4 py-16"
          >
            <div className="max-w-4xl w-full space-y-12 text-center">
              
              {/* BRAND LOGO & TITLE */}
              <div className="space-y-6">
                <div className="mx-auto w-20 h-20 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 transform hover:scale-105 transition-transform duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-11 h-11 text-white" fill="currentColor">
                    <path d="M256 120c-15 0-30 15-40 30-20 30-40 70-40 100 0 50 35 90 80 90s80-40 80-90c0-30-20-70-40-100-10-15-25-30-40-30zm0 40c10 0 20 10 25 20 15 25 30 55 30 80 0 30-20 50-55 50s-55-20-55-50c0-25 15-55 30-80 5-10 15-20 25-20z"/>
                    <path d="M410 380h-308c-12 0-22-10-22-22s10-22 22-22h308c12 0 22 10 22 22s-10 22-22 22z" fill="none" stroke="currentColor" strokeWidth="24" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 uppercase">
                    Lubricación Express
                  </h1>
                  <p className="text-base sm:text-lg text-slate-500 font-medium">
                    Sistema de Gestión de Taller Inteligente
                  </p>
                </div>
              </div>

              {/* ROLE CHANNELS SELECTORS */}
              <div className="grid grid-cols-2 gap-4 sm:gap-8 max-w-4xl mx-auto w-full">
                
                {/* Channel 1: Propietario (Admin) */}
                <button
                  id="home-btn-admin"
                  onClick={() => setCurrentRole('admin')}
                  className="group relative p-4 sm:p-10 bg-white border border-slate-200 rounded-3xl text-center hover:shadow-xl hover:border-amber-500 transition-all cursor-pointer flex flex-col items-center"
                >
                  <div className="w-12 h-12 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mb-3 sm:mb-6 group-hover:bg-amber-100 transition-colors">
                    <Shield className="w-6 h-6 sm:w-10 sm:h-10 text-slate-600 group-hover:text-amber-600 transition-colors" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">Miguel</h2>
                  <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-slate-900 text-white text-[9px] sm:text-xs font-bold rounded-full uppercase tracking-wider mb-2 sm:mb-4">
                    Administrador
                  </span>
                  <p className="text-slate-500 text-[11px] sm:text-sm leading-snug sm:leading-relaxed">
                    Control total de inventario, finanzas, catálogos y reportes de rendimiento del taller.
                  </p>
                </button>

                {/* Channel 2: Operador */}
                <button
                  id="home-btn-operator"
                  onClick={() => setCurrentRole('operator')}
                  className="group relative p-4 sm:p-10 bg-white border border-slate-200 rounded-3xl text-center hover:shadow-xl hover:border-amber-500 transition-all cursor-pointer flex flex-col items-center"
                >
                  <div className="w-12 h-12 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mb-3 sm:mb-6 group-hover:bg-amber-100 transition-colors">
                    <Wrench className="w-6 h-6 sm:w-10 sm:h-10 text-slate-600 group-hover:text-amber-600 transition-colors" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">Operadores</h2>
                  <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-slate-500 text-white text-[9px] sm:text-xs font-bold rounded-full uppercase tracking-wider mb-2 sm:mb-4">
                    Personal de Taller
                  </span>
                  <p className="text-slate-500 text-[11px] sm:text-sm leading-snug sm:leading-relaxed">
                    Recepción de vehículos, checklist de inspección y registro rápido de servicios y órdenes.
                  </p>
                </button>

              </div>

              {/* INSTALL APP PWA TRIGGER BUTTON */}
              <div className="pt-4 max-w-sm mx-auto w-full">
                <button
                  id="home-btn-install"
                  onClick={handleInstallApp}
                  className="w-full bg-slate-900 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-slate-800 transition-colors shadow-lg active:scale-95 cursor-pointer"
                >
                  <Download className="w-5 h-5 text-amber-500" />
                  <span>Instalar Aplicación (PWA)</span>
                </button>
              </div>

            </div>
          </motion.div>
        )}

        {currentRole === 'admin' && (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <AdminDashboard
              products={products}
              services={services}
              packages={packages}
              operators={operators}
              orders={orders}
              onUpdateProducts={setProducts}
              onUpdateServices={setServices}
              onUpdatePackages={setPackages}
              onUpdateOperators={setOperators}
              onBackToHome={() => setCurrentRole('home')}
            />
          </motion.div>
        )}

        {currentRole === 'operator' && (
          <motion.div
            key="operator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <OperatorDashboard
              products={products}
              services={services}
              packages={packages}
              operators={operators}
              orders={orders}
              clients={clients}
              vehicles={vehicles}
              onAddOrder={handleAddOrder}
              onAddClient={handleAddClient}
              onAddVehicle={handleAddVehicle}
              onUpdateVehicleNotes={handleUpdateVehicleNotes}
              onBackToHome={() => setCurrentRole('home')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="py-8 border-t border-slate-200 text-center text-[10px] uppercase tracking-widest font-bold text-slate-400 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-6 bg-white/50 backdrop-blur-sm">
        <span>Versión 2.1.0</span>
        <span className="hidden sm:inline">&bull;</span>
        <span>Mecánica Digital</span>
        <span className="hidden sm:inline">&bull;</span>
        <span>Lubricación Express &copy; {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
