import { Product, ServiceBase, ServicePackage, Operator, Client, Vehicle, Order } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Mobil Super 10W-30 (Mineral)', category: 'Aceite', viscosity: '10W-30', brand: 'Mobil', costPrice: 120, sellPrice: 210, stock: 45, minStock: 10 },
  { id: 'p2', name: 'Castrol Edge 5W-30 (Sintético)', category: 'Aceite', viscosity: '5W-30', brand: 'Castrol', costPrice: 220, sellPrice: 380, stock: 8, minStock: 12 }, // Trigger minimum warning
  { id: 'p3', name: 'Quaker State High Mileage 25W-50', category: 'Aceite', viscosity: '25W-50', brand: 'Quaker State', costPrice: 110, sellPrice: 195, stock: 30, minStock: 10 },
  { id: 'p4', name: 'Filtro Aceite Fram Extra Guard PH3614', category: 'Filtro', brand: 'Fram', costPrice: 85, sellPrice: 160, stock: 15, minStock: 8 },
  { id: 'p5', name: 'Filtro Aceite Gonher GP-58', category: 'Filtro', brand: 'Gonher', costPrice: 70, sellPrice: 135, stock: 22, minStock: 8 },
  { id: 'p6', name: 'Bujía NGK Iridium Spark Plug', category: 'Bujía', brand: 'NGK', costPrice: 95, sellPrice: 180, stock: 40, minStock: 16 },
  { id: 'p7', name: 'Aditivo Lucas Estabilizador Aceite', category: 'Aditivo', brand: 'Lucas', costPrice: 150, sellPrice: 260, stock: 5, minStock: 6 }, // Trigger warning
  { id: 'p8', name: 'Filtro de Aire Interfil F-48A57', category: 'Filtro', brand: 'Interfil', costPrice: 90, sellPrice: 180, stock: 14, minStock: 5 },
];

export const INITIAL_SERVICES: ServiceBase[] = [
  { id: 's1', name: 'Mano de Obra de Afinación', basePrice: 250, isActive: true },
  { id: 's2', name: 'Lavado de Motor Express', basePrice: 180, isActive: true },
  { id: 's3', name: 'Revisión de Puntos de Seguridad (Checklist)', basePrice: 0, isActive: true }, // Free service base
  { id: 's4', name: 'Cambio de Aceite y Filtro (Mano de obra)', basePrice: 120, isActive: true },
  { id: 's5', name: 'Limpieza y Ajuste de Frenos', basePrice: 200, isActive: true },
];

export const INITIAL_PACKAGES: ServicePackage[] = [
  {
    id: 'pkg1',
    name: 'Paquete Sintético Premium',
    services: ['s4', 's3'],
    products: [
      { productId: 'p2', quantity: 4 }, // 4L de Castrol Edge Sintético
      { productId: 'p4', quantity: 1 }  // Filtro Fram
    ],
    sellPrice: 1750,
    isActive: true
  },
  {
    id: 'pkg2',
    name: 'Paquete Mineral Esencial',
    services: ['s4', 's3'],
    products: [
      { productId: 'p1', quantity: 4 }, // 4L de Mobil Mineral
      { productId: 'p5', quantity: 1 }  // Filtro Gonher
    ],
    sellPrice: 980,
    isActive: true
  },
  {
    id: 'pkg3',
    name: 'Afinación Básica 4 Cilindros',
    services: ['s1', 's3'],
    products: [
      { productId: 'p6', quantity: 4 }, // 4 Bujías NGK
      { productId: 'p8', quantity: 1 }  // Filtro Aire
    ],
    sellPrice: 1350,
    isActive: true
  }
];

export const INITIAL_OPERATORS: Operator[] = [
  { id: 'op1', name: 'Juan Pérez', role: 'operator', pinCode: '1234' },
  { id: 'op2', name: 'Pedro Gómez', role: 'operator', pinCode: '5678' },
  { id: 'op3', name: 'Carlos Ruiz', role: 'operator', pinCode: '9012' },
];

export const INITIAL_CLIENTS: Client[] = [
  { id: 'c1', name: 'Sofía Martínez García', phone: '5512345678', whatsApp: '5512345678', email: 'sofia.mg@gmail.com', visitCount: 3, lastVisitDate: '2026-06-10' },
  { id: 'c2', name: 'Alejandro Ruiz Peralta', phone: '5598765432', whatsApp: '5598765432', email: 'alex.ruiz@hotmail.com', visitCount: 1, lastVisitDate: '2026-07-01' },
  { id: 'c3', name: 'Distribuidora del Valle (Flotilla)', phone: '5544332211', whatsApp: '5544332211', email: 'contacto@distvalle.com', visitCount: 4, lastVisitDate: '2026-07-15' },
];

export const INITIAL_VEHICLES: Vehicle[] = [
  { plates: 'NMX-45-89', brand: 'Toyota', model: 'Corolla', year: 2020, mileage: 58200, permanentNotes: 'Rosca del cárter barrida, requiere rondana de cobre nueva en cada servicio.' },
  { plates: 'YUX-12-34', brand: 'Nissan', model: 'Versa', year: 2018, mileage: 94500, permanentNotes: 'Presenta fuga leve en retén de cigüeñal. Monitorear nivel.' },
  { plates: 'VVF-98-76', brand: 'Chevrolet', model: 'Aveo', year: 2019, mileage: 110200, permanentNotes: 'Tornillo de cárter de 14mm, sin anomalías.' },
  { plates: 'ZSA-77-22', brand: 'Nissan', model: 'NP300 (Flotilla 1)', year: 2021, mileage: 125000, permanentNotes: 'Uso rudo de carga. Revisar suspensión siempre.' },
  { plates: 'ZSA-77-33', brand: 'Nissan', model: 'NP300 (Flotilla 2)', year: 2021, mileage: 141000, permanentNotes: 'Se sugiere cambio de bujías próximamente.' },
];

// Helper to map vehicle to owners for queries
export const VEHICLE_OWNER_MAP: Record<string, string> = {
  'NMX-45-89': 'c1', // Sofía
  'YUX-12-34': 'c2', // Alejandro
  'VVF-98-76': 'c1', // Sofía (corolla + aveo = family fleet)
  'ZSA-77-22': 'c3', // Flotilla
  'ZSA-77-33': 'c3', // Flotilla
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'LE-1001',
    date: '2026-07-14',
    clientName: 'Sofía Martínez García',
    clientPhone: '5512345678',
    clientWhatsApp: '5512345678',
    clientEmail: 'sofia.mg@gmail.com',
    plates: 'NMX-45-89',
    vehicleBrand: 'Toyota',
    vehicleModel: 'Corolla',
    vehicleYear: 2020,
    mileage: 53200,
    packageId: 'pkg1', // Sintético
    services: ['s4', 's3'],
    products: [
      { productId: 'p2', quantity: 4, sellPrice: 380, costPrice: 220 }, // Castrol Sintético
      { productId: 'p4', quantity: 1, sellPrice: 160, costPrice: 85 }   // Filtro Fram
    ],
    checklist: { luces: 'OK', llantas: 'OK', niveles: 'OK', frenos: 'OK', extraNotes: 'Auto en excelentes condiciones.' },
    paymentMethod: 'Tarjeta',
    operatorId: 'op1',
    operatorName: 'Juan Pérez',
    totalPaid: 1750,
    nextServiceMileage: 63200, // +10,000 for synthetic
    nextServiceDate: '2027-01-14' // +6 months
  },
  {
    id: 'LE-1002',
    date: '2026-07-15',
    clientName: 'Alejandro Ruiz Peralta',
    clientPhone: '5598765432',
    clientWhatsApp: '5598765432',
    clientEmail: 'alex.ruiz@hotmail.com',
    plates: 'YUX-12-34',
    vehicleBrand: 'Nissan',
    vehicleModel: 'Versa',
    vehicleYear: 2018,
    mileage: 94500,
    packageId: 'pkg2', // Mineral
    services: ['s4', 's3'],
    products: [
      { productId: 'p1', quantity: 4, sellPrice: 210, costPrice: 120 }, // Mobil Mineral
      { productId: 'p5', quantity: 1, sellPrice: 135, costPrice: 70 }   // Filtro Gonher
    ],
    checklist: { luces: 'OK', llantas: 'Revisar', niveles: 'Revisar', frenos: 'OK', extraNotes: 'Llantas delanteras con 1/4 de vida. Fuga leve en cárter.' },
    paymentMethod: 'Efectivo',
    operatorId: 'op2',
    operatorName: 'Pedro Gómez',
    totalPaid: 980,
    nextServiceMileage: 99500, // +5,000 for mineral
    nextServiceDate: '2026-10-15' // +3 months
  },
  {
    id: 'LE-1003',
    date: '2026-07-15',
    clientName: 'Distribuidora del Valle (Flotilla)',
    clientPhone: '5544332211',
    clientWhatsApp: '5544332211',
    clientEmail: 'contacto@distvalle.com',
    plates: 'ZSA-77-22',
    vehicleBrand: 'Nissan',
    vehicleModel: 'NP300 (Flotilla 1)',
    vehicleYear: 2021,
    mileage: 125000,
    packageId: 'pkg2', // Mineral
    services: ['s4', 's3', 's2'], // Extra: lavado motor
    products: [
      { productId: 'p1', quantity: 4, sellPrice: 210, costPrice: 120 },
      { productId: 'p5', quantity: 1, sellPrice: 135, costPrice: 70 }
    ],
    checklist: { luces: 'Falla', llantas: 'OK', niveles: 'OK', frenos: 'Revisar', extraNotes: 'Faro trasero derecho fundido. Requiere balatas delanteras.' },
    paymentMethod: 'Transferencia',
    operatorId: 'op3',
    operatorName: 'Carlos Ruiz',
    totalPaid: 1160, // 980 + 180 lavado
    nextServiceMileage: 130000,
    nextServiceDate: '2026-10-15'
  },
  {
    id: 'LE-1004',
    date: '2026-07-16',
    clientName: 'Sofía Martínez García',
    clientPhone: '5512345678',
    clientWhatsApp: '5512345678',
    clientEmail: 'sofia.mg@gmail.com',
    plates: 'VVF-98-76',
    vehicleBrand: 'Chevrolet',
    vehicleModel: 'Aveo',
    vehicleYear: 2019,
    mileage: 110200,
    packageId: 'pkg3', // Afinacion
    services: ['s1', 's3'],
    products: [
      { productId: 'p6', quantity: 4, sellPrice: 180, costPrice: 95 },
      { productId: 'p8', quantity: 1, sellPrice: 180, costPrice: 90 }
    ],
    checklist: { luces: 'OK', llantas: 'OK', niveles: 'OK', frenos: 'OK', extraNotes: 'Servicio de afinación básico.' },
    paymentMethod: 'Efectivo',
    operatorId: 'op1',
    operatorName: 'Juan Pérez',
    totalPaid: 1350,
    nextServiceMileage: 120200, // +10,000 or custom
    nextServiceDate: '2027-01-16'
  },
];
