import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from './supabaseClient';
import {
  Plus, Home, Users, PieChart, Camera, CreditCard, CheckCircle,
  AlertCircle, Trash2, Settings, DollarSign, Zap, Tv, Shield,
  X, Calendar, Feather, Bell, LogOut, Repeat, Wallet, Landmark,
  ArrowRight, Globe, Lock, Mail, User, Check, ChevronRight, Phone, ArrowLeft,
  MousePointerClick, Eye, EyeOff, Heart, Briefcase, GraduationCap, TrendingUp,
  CreditCard as CardIcon, Bug, ExternalLink, CalendarDays, CheckSquare, Percent,
  Waves, Equal, BellRing, Building2, UserCircle, Pencil, Banknote, Sparkles, Loader2, AlertTriangle, ListChecks
} from 'lucide-react';

// --- CONFIGURACIÓN API ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

// --- ESTILOS CSS INYECTADOS ---
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  @keyframes pulse-ring {
    0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
    100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }
  /* Nueva animación suave para alertas */
  @keyframes gentle-pulse {
    0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.2); border-color: rgba(251, 146, 60, 0.5); }
    50% { box-shadow: 0 0 0 6px rgba(249, 115, 22, 0); border-color: rgba(251, 146, 60, 1); }
    100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); border-color: rgba(251, 146, 60, 0.5); }
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
  .animate-slide-up {
    animation: slideUp 0.3s ease-out forwards;
  }
  .animate-pulse-ring {
    animation: pulse-ring 2s infinite;
  }
  .animate-gentle-pulse {
    animation: gentle-pulse 3s infinite;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1; 
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #d1d5db; 
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af; 
  }
`;

// --- UTILIDADES ---
const formatCurrencyInput = (value) => {
  if (!value && value !== 0) return '';
  const number = value.toString().replace(/\D/g, '');
  return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseCurrencyInput = (value) => {
  if (!value) return '';
  return value.toString().replace(/\./g, '');
};

// --- LLAMADAS A GEMINI API ---
const callGeminiAPI = async (prompt) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      throw new Error('Error en la llamada a Gemini');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude generar una respuesta.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

// --- CONSTANTES ---
const BANKS_BY_COUNTRY = {
  CO: ['Bancolombia', 'Davivienda', 'Banco de Bogotá', 'BBVA', 'Banco de Occidente', 'Scotiabank Colpatria', 'Banco Caja Social', 'Banco AV Villas', 'Banco Popular', 'Nequi', 'Daviplata', 'Nu Colombia', 'Lulo Bank'],
  MX: ['BBVA México', 'Banamex', 'Santander', 'Banorte', 'HSBC', 'Scotiabank', 'Inbursa', 'Banco Azteca', 'Nu México'],
  US: ['Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'U.S. Bank', 'PNC Bank', 'Capital One'],
  ES: ['Banco Santander', 'BBVA', 'CaixaBank', 'Banco Sabadell', 'Bankinter', 'Unicaja Banco'],
  AR: ['Banco Galicia', 'Banco Nación', 'Banco Santander Río', 'BBVA Francés', 'Banco Macro', 'HSBC'],
  CL: ['Banco de Chile', 'Banco Santander', 'BancoEstado', 'Scotiabank', 'Bci', 'Itaú'],
  PE: ['BCP', 'BBVA Perú', 'Scotiabank', 'Interbank', 'Banco Pichincha', 'BanBif'],
  EC: ['Banco Pichincha', 'Banco del Pacífico', 'Banco Guayaquil', 'Produbanco', 'Banco Internacional']
};

const CURRENCIES = [
  { code: 'USD', label: 'Dólar (USD)', symbol: '$' },
  { code: 'COP', label: 'Peso Col. (COP)', symbol: '$' },
  { code: 'MXN', label: 'Peso Mex. (MXN)', symbol: '$' },
  { code: 'EUR', label: 'Euro (EUR)', symbol: '€' },
];

const COUNTRIES = [
  { code: 'CO', name: 'Colombia', currency: 'COP', flag: '🇨🇴', dialCode: '+57' },
  { code: 'MX', name: 'México', currency: 'MXN', flag: '🇲🇽', dialCode: '+52' },
  { code: 'US', name: 'Estados Unidos', currency: 'USD', flag: '🇺🇸', dialCode: '+1' },
  { code: 'ES', name: 'España', currency: 'EUR', flag: '🇪🇸', dialCode: '+34' },
  { code: 'AR', name: 'Argentina', currency: 'ARS', flag: '🇦🇷', dialCode: '+54' },
  { code: 'CL', name: 'Chile', currency: 'CLP', flag: '🇨🇱', dialCode: '+56' },
  { code: 'PE', name: 'Perú', currency: 'PEN', flag: '🇵🇪', dialCode: '+51' },
  { code: 'EC', name: 'Ecuador', currency: 'USD', flag: '🇪🇨', dialCode: '+593' },
];

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "Centraliza tus Gastos",
    description: "Dile adiós al caos de facturas dispersas. Ten todo, desde la luz hasta Netflix, en un solo lugar.",
    icon: <Home className="w-16 h-16 text-emerald-600" />,
    bg: "bg-emerald-50"
  },
  {
    id: 2,
    title: "Colaboración Familiar",
    description: "Involucra a todos. Asigna responsables, comparte tarjetas y transparentea las finanzas del hogar.",
    icon: <Users className="w-16 h-16 text-indigo-600" />,
    bg: "bg-indigo-50"
  },
  {
    id: 3,
    title: "IA a tu Servicio",
    description: "Nuestra inteligencia artificial analiza tus patrones y te da consejos para mejorar tu salud financiera.",
    icon: <Zap className="w-16 h-16 text-yellow-600" />,
    bg: "bg-yellow-50"
  }
];

const FAMILY_STATUSES = [
  { id: 'single', label: 'Soltero/a', Icon: User, color: 'text-blue-500', description: 'Manejo mis propias finanzas' },
  { id: 'couple', label: 'Pareja', Icon: Heart, color: 'text-red-500', description: 'Compartimos gastos sin hijos' },
  { id: 'family', label: 'Familia', Icon: Users, color: 'text-emerald-500', description: 'Tenemos hijos o dependientes' },
];

const ROLES_BY_STATUS = {
  single: [
    { id: 'man', label: 'Hombre', icon: '🧔', role: 'admin' },
    { id: 'woman', label: 'Mujer', icon: '👱‍♀️', role: 'admin' },
    { id: 'student', label: 'Estudiante', icon: '🎓', role: 'admin' },
    { id: 'worker', label: 'Profesional', icon: '💼', role: 'admin' },
  ],
  couple: [
    { id: 'husband', label: 'Esposo', icon: '👨', role: 'admin' },
    { id: 'wife', label: 'Esposa', icon: '👩', role: 'admin' },
    { id: 'boyfriend', label: 'Novio', icon: '🧔', role: 'admin' },
    { id: 'girlfriend', label: 'Novia', icon: '👱‍♀️', role: 'admin' },
    { id: 'partner', label: 'Compañero/a', icon: '🤝', role: 'admin' },
  ],
  family: [
    { id: 'dad', label: 'Padre', icon: '👨', role: 'admin' },
    { id: 'mom', label: 'Madre', icon: '👩', role: 'admin' },
    { id: 'son', label: 'Hijo', icon: '👦', role: 'member' },
    { id: 'daughter', label: 'Hija', icon: '👧', role: 'member' },
    { id: 'grandpa', label: 'Abuelo/a', icon: '👴', role: 'member' },
    { id: 'other', label: 'Otro Familiar', icon: '😊', role: 'member' },
  ]
};

// --- FUENTES DE INGRESO ---
const COLOMBIA_BANKS = [
  { id: 'bancolombia', name: 'Bancolombia', color: '#FDDA24' },
  { id: 'davivienda', name: 'Davivienda', color: '#EF3340' },
  { id: 'nu', name: 'Nu', color: '#820AD1' },
  { id: 'bogota', name: 'Banco de Bogotá', color: '#003366' },
  { id: 'bbva', name: 'BBVA', color: '#004481' },
  { id: 'occidente', name: 'Banco de Occidente', color: '#003B71' },
  { id: 'avvillas', name: 'AV Villas', color: '#005596' },
  { id: 'rappicard', name: 'RappiCard', color: '#FF424D' },
  { id: 'falabella', name: 'Banco Falabella', color: '#97D700' },
  { id: 'caja_social', name: 'Banco Caja Social', color: '#00548E' },
  { id: 'otros', name: 'Otros / Prestamista', color: '#6B7280' }
];

const INCOME_SOURCES = {
  "Empleo / Laboral": [
    "Salario / Nómina",
    "Horas Extras",
    "Bonificaciones / Primas",
    "Auxilio de Transporte",
    "Cesantías"
  ],
  "Trabajo Independiente": [
    "Honorarios Profesionales",
    "Ventas de Negocio",
    "Servicios Freelance",
    "Comisiones"
  ],
  "Rentas y Capital": [
    "Arriendo de Propiedades",
    "Rendimientos Financieros",
    "Dividendos de Acciones",
    "Intereses"
  ],
  "Pensiones y Ayudas": [
    "Pensión de Vejez/Jubilación",
    "Subsidios del Gobierno",
    "Cuota Alimentaria / Manutención",
    "Ayuda Familiar / Remesas"
  ],
  "Otros": [
    "Regalos / Donaciones",
    "Venta de Activos (Carro, etc.)",
    "Premios / Lotería",
    "Devolución de Impuestos",
    "Otro"
  ]
};

const INCOME_DEFAULTS = {
  "Empleo / Laboral": false,
  "Trabajo Independiente": true,
  "Rentas y Capital": false,
  "Pensiones y Ayudas": false,
  "Otros": true
};

// --- CONFIGURACIÓN DE CATEGORÍAS ---
const CATEGORIES = {
  vivienda: { icon: Home, color: 'bg-blue-100 text-blue-600', label: 'Vivienda', defaultRecurrence: { isRecurring: true, type: 'fixed' } },
  servicios: { icon: Zap, color: 'bg-yellow-100 text-yellow-600', label: 'Servicios', defaultRecurrence: { isRecurring: true, type: 'variable' } },
  streaming: { icon: Tv, color: 'bg-purple-100 text-purple-600', label: 'Streaming', defaultRecurrence: { isRecurring: true, type: 'fixed' } },
  seguros: { icon: Shield, color: 'bg-green-100 text-green-600', label: 'Seguros', defaultRecurrence: { isRecurring: true, type: 'fixed' } },
  ia: { icon: Briefcase, color: 'bg-indigo-100 text-indigo-600', label: 'Educación/IA', defaultRecurrence: { isRecurring: true, type: 'fixed' } },
  deudas: { icon: Landmark, color: 'bg-red-100 text-red-600', label: 'Deudas', defaultRecurrence: { isRecurring: true, type: 'fixed' } },
  otros: { icon: AlertCircle, color: 'bg-gray-100 text-gray-600', label: 'Otros', defaultRecurrence: { isRecurring: false, type: 'fixed' } }
};

const PUBLIC_SERVICES = {
  agua: {
    label: "Agua y Alcantarillado",
    providers: [
      { name: "Acueducto de Bogotá", url: "https://pagos.acueducto.com.co/" },
      { name: "EPM", url: "https://www.epm.com.co/clientesyusuarios/" },
      { name: "Acuacar (Cartagena)", url: "https://www.acuacar.com/" },
      { name: "Triple A (Barranquilla)", url: "https://www.aaa.com.co/" }
    ]
  },
  energia: {
    label: "Energía Eléctrica",
    providers: [
      { name: "Enel Colombia", url: "https://www.enel.com.co/" },
      { name: "EPM", url: "https://www.epm.com.co/" },
      { name: "Afinia", url: "https://www.afinia.com.co/" },
      { name: "Air-e", url: "https://www.air-e.com/" },
      { name: "Celsia", url: "https://www.celsia.com/" }
    ]
  },
  gas: {
    label: "Gas Natural",
    providers: [
      { name: "Vanti", url: "https://www.grupovanti.com/" },
      { name: "EPM", url: "https://www.epm.com.co/" },
      { name: "Gases del Caribe", url: "https://gascaribe.com/" },
      { name: "Alcanos", url: "https://alcanos.com.co/" }
    ]
  },
  telecom: {
    label: "Internet, TV y Telefonía",
    providers: [
      { name: "Claro", url: "https://portalpagos.claro.com.co/" },
      { name: "Movistar", url: "https://www.movistar.com.co/" },
      { name: "Tigo", url: "https://transacciones.tigo.com.co/" },
      { name: "ETB", url: "https://etb.com/" },
      { name: "WOM", url: "https://www.wom.co/" },
      { name: "Directv", url: "https://www.directv.com.co/" }
    ]
  }
};

// --- MOCK DATA ---

const INITIAL_MEMBERS = [

  {
    id: 1,
    name: 'Carlos',
    email: 'carlos@familia.com',
    role: 'admin',
    incomes: [
      { id: 101, source: 'Salario / Nómina', amount: 4500000, isVariable: false }
    ],
    avatar: '👨‍💼',
    cards: [{ id: 1, name: 'Visa Gold', last4: '4242', cutoffDate: 15 }],
    loans: [{ id: 1, type: 'Hipotecario', customName: 'Apto 502', totalValue: 120000000, monthlyPayment: 950000, term: 240, rate: 12.5, rateType: 'EA', isAutoDebit: true, entityName: 'Bancolombia', disbursementDate: '2020-05-15' }]
  },
  {
    id: 2,
    name: 'Ana',
    email: 'ana@familia.com',
    role: 'admin',
    incomes: [
      { id: 201, source: 'Salario / Nómina', amount: 4000000, isVariable: false },
      { id: 202, source: 'Servicios Freelance', amount: 800000, isVariable: true }
    ],
    avatar: '👩‍💼',
    cards: [],
    loans: []
  },
  {
    id: 3,
    name: 'Sofi',
    email: 'sofi@familia.com',
    role: 'member',
    incomes: [],
    avatar: '👧',
    cards: [],
    loans: []
  },
];

const INITIAL_EXPENSES = [
  { id: 101, title: 'Alquiler Apto', amount: 1200000, category: 'vivienda', dueDate: '2023-11-05', arrivalDate: '2023-11-01', responsibleId: 1, isAutoDebit: true, isRecurring: true, recurrenceType: 'fixed', status: 'paid', type: 'bill', paymentUrl: '' },
  { id: 102, title: 'Netflix & Disney+', amount: 45000, category: 'streaming', dueDate: '2023-11-15', arrivalDate: '2023-11-15', responsibleId: 2, isAutoDebit: true, isRecurring: true, recurrenceType: 'fixed', status: 'pending', type: 'subscription', paymentUrl: 'https://www.netflix.com/youraccount' },
  { id: 103, title: 'Seguro Médico', amount: 350000, category: 'seguros', dueDate: '2023-11-20', arrivalDate: '2023-11-05', responsibleId: 1, isAutoDebit: false, isRecurring: true, recurrenceType: 'fixed', status: 'pending', type: 'service', paymentUrl: '' },
  { id: 104, title: 'Electricidad', amount: 85000, category: 'servicios', dueDate: '2023-11-28', responsibleId: 2, isAutoDebit: false, isRecurring: true, recurrenceType: 'variable', status: 'pending', type: 'bill', paymentUrl: 'https://enel.com.co/pagos', billArrivalDay: 10 },
];

const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
};

const getMonthName = () => {
  return new Date().toLocaleDateString('es-ES', { month: 'long' });
};

// --- COMPONENTES AUXILIARES ---

// MODAL DE CONFIRMACIÓN
const ConfirmationDialog = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl animate-slide-up">
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-100 p-3 rounded-full mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">¿Estás seguro?</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={() => { onConfirm(); onCancel(); }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// MODAL PARA ACTUALIZAR VALORES DEL MES
const MonthlyValuesModal = ({ isOpen, onClose, expenses, members, onBatchUpdate, currency }) => {
  const [updates, setUpdates] = useState({});
  const [cardPayments, setCardPayments] = useState({});

  const currentMonthDate = new Date();
  const currentMonthIndex = currentMonthDate.getMonth();
  const currentYear = currentMonthDate.getFullYear();

  const variableExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (!e.dueDate) return false;
      const [year, month] = e.dueDate.split('-').map(Number);
      return month === (currentMonthIndex + 1) && year === currentYear && e.recurrenceType === 'variable' && e.status !== 'paid';
    });
  }, [expenses, currentMonthIndex, currentYear]);

  const creditCards = useMemo(() => {
    return members.flatMap(m => m.cards.map(c => ({ ...c, ownerName: m.name, ownerId: m.id })));
  }, [members]);

  const handleUpdateChange = (id, val) => {
    setUpdates(prev => ({ ...prev, [id]: val }));
  };

  const handleCardPaymentChange = (cardId, val) => {
    setCardPayments(prev => ({ ...prev, [cardId]: val }));
  };

  const handleSave = () => {
    const expensesToUpdate = [];
    const newExpenses = [];

    Object.keys(updates).forEach(id => {
      const val = parseFloat(parseCurrencyInput(updates[id]));
      if (val > 0) expensesToUpdate.push({ id: parseInt(id), amount: val });
    });

    Object.keys(cardPayments).forEach(cardId => {
      const val = parseFloat(parseCurrencyInput(cardPayments[cardId]));
      const card = creditCards.find(c => c.id === parseInt(cardId));
      if (val > 0 && card) {
        const todayDate = new Date().toISOString().split('T')[0];
        newExpenses.push({
          title: `Tarjeta ${card.name} (**${card.last4})`,
          amount: val,
          category: 'deudas',
          dueDate: todayDate,
          responsibleId: card.ownerId,
          isAutoDebit: false,
          isRecurring: false,
          type: 'bill',
          paymentUrl: ''
        });
      }
    });

    onBatchUpdate(expensesToUpdate, newExpenses);
    onClose();
    setUpdates({});
    setCardPayments({});
  };

  if (!isOpen) return null;

  const hasItems = variableExpenses.length > 0 || creditCards.length > 0;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><ListChecks className="w-6 h-6 text-emerald-600" /> Actualizar Valores del Mes</h3>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
        </div>

        {!hasItems && (
          <div className="text-center py-8 text-gray-500">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 text-emerald-200" />
            <p>¡Todo al día! No hay servicios variables pendientes ni tarjetas registradas.</p>
          </div>
        )}

        {variableExpenses.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center"><Zap className="w-4 h-4 mr-1" /> Servicios Variables (Llegada Reciente)</h4>
            <div className="space-y-3">
              {variableExpenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{exp.title}</p>
                    <p className="text-xs text-gray-500">Estimado: {currency} {formatCurrencyInput(exp.amount)}</p>
                  </div>
                  <div className="w-32">
                    <input
                      type="text"
                      className="w-full border p-2 rounded-lg text-right font-bold text-emerald-700 bg-white"
                      placeholder="Valor Real"
                      value={formatCurrencyInput(updates[exp.id] !== undefined ? updates[exp.id] : '')}
                      onChange={(e) => handleUpdateChange(exp.id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {creditCards.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center"><CreditCard className="w-4 h-4 mr-1" /> Cuotas de Tarjetas de Crédito</h4>
            <div className="space-y-3">
              {creditCards.map(card => (
                <div key={card.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{card.name} (**{card.last4})</p>
                    <p className="text-xs text-gray-500">{card.ownerName}</p>
                  </div>
                  <div className="w-32">
                    <input
                      type="text"
                      className="w-full border p-2 rounded-lg text-right font-bold text-indigo-700 bg-white"
                      placeholder="Pagar..."
                      value={formatCurrencyInput(cardPayments[card.id] !== undefined ? cardPayments[card.id] : '')}
                      onChange={(e) => handleCardPaymentChange(card.id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasItems && (
          <button onClick={handleSave} className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg mt-2">
            Guardar Valores
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

const NavButton = ({ active, onClick, icon: Icon, label, variant = 'bottom' }) => {
  if (variant === 'sidebar') {
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
      >
        <Icon className={`w-5 h-5 mr-3 ${active ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
        <span className="text-sm">{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center space-y-1 transition-colors w-full h-full ${active ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
};

// ... (LoaderScreen, CurrencySelectionModal, StatusSelectionScreen, ProfileSelectionScreen, TutorialOverlay, OnboardingScreen - Sin cambios) ...
const LoaderScreen = () => (
  <div className="bg-emerald-50 min-h-screen flex flex-col items-center justify-center animate-fade-in fixed inset-0 z-[60]">
    <div className="animate-bounce"><div className="w-24 h-24 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-2xl rotate-3 mb-6"><Feather className="w-12 h-12" /></div></div>
    <h1 className="text-4xl font-bold text-emerald-900 tracking-tight animate-pulse">Nido</h1>
    <p className="text-emerald-600 mt-2 font-medium">Preparando tus finanzas...</p>
  </div>
);
const CurrencySelectionModal = ({ onClose, onSelect }) => (
  <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-slide-up"><div className="text-center mb-6"><div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3"><Globe className="w-6 h-6 text-emerald-600" /></div><h3 className="text-lg font-bold text-gray-900">Selecciona tu Moneda</h3><p className="text-sm text-gray-500">Esto definirá cómo ves todos tus valores.</p></div><div className="space-y-3">{CURRENCIES.map(curr => (<button key={curr.code} onClick={() => onSelect(curr.code)} className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition"><span className="font-medium text-gray-800">{curr.label}</span><span className="text-gray-400 font-mono">{curr.code}</span></button>))}</div><button onClick={() => onClose()} className="mt-4 w-full text-gray-400 text-sm py-2">Cancelar</button></div></div>
);
const StatusSelectionScreen = ({ onSelect }) => (
  <div className="fixed inset-0 z-[60] bg-white flex flex-col p-6 animate-fade-in w-full h-full"><div className="max-w-md mx-auto w-full mt-12 mb-8 text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2">Estado Familiar</h2><p className="text-gray-500">Cuéntanos cómo está conformado tu hogar.</p></div><div className="space-y-4 max-w-md mx-auto w-full">{FAMILY_STATUSES.map(status => { const IconComponent = status.Icon; return (<button key={status.id} onClick={() => onSelect(status.id)} className="w-full flex items-center p-4 bg-gray-50 border-2 border-transparent rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition active:scale-95 text-left group"><div className="bg-white p-3 rounded-xl shadow-sm mr-4 group-hover:scale-110 transition"><IconComponent className={`w-8 h-8 ${status.color}`} /></div><div><span className="block font-bold text-gray-900 text-lg">{status.label}</span><span className="text-xs text-gray-500">{status.description}</span></div><ChevronRight className="w-5 h-5 text-gray-300 ml-auto group-hover:text-emerald-500" /></button>); })}</div></div>
);
const ProfileSelectionScreen = ({ status, onSelect }) => { const profiles = ROLES_BY_STATUS[status] || ROLES_BY_STATUS.family; return (<div className="fixed inset-0 z-[60] bg-white flex flex-col p-6 animate-fade-in w-full h-full"><div className="max-w-md mx-auto w-full mt-12 mb-6"><h2 className="text-3xl font-bold text-gray-900 mb-2">¿Cuál es tu rol?</h2><p className="text-gray-500">Selecciona quién eres.</p></div><div className="grid grid-cols-2 gap-4 overflow-y-auto pb-4 custom-scrollbar max-w-md mx-auto w-full">{profiles.map(profile => (<button key={profile.id} onClick={() => onSelect(profile)} className="flex flex-col items-center justify-center p-6 bg-gray-50 border-2 border-transparent rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition active:scale-95"><span className="text-4xl mb-3">{profile.icon}</span><span className="font-bold text-gray-800">{profile.label}</span></button>))}</div></div>); };
const TutorialOverlay = ({ onClose }) => { const [step, setStep] = useState(1); const handleNext = () => { if (step === 2) { onClose(); } else { setStep(step + 1); } }; return (<div className="fixed inset-0 z-[60] overflow-hidden"><div className="absolute inset-0 bg-gray-900/85 animate-fade-in" />{step === 1 && (<div className="absolute inset-0"><div className="absolute bottom-24 right-6 w-16 h-16 rounded-full border-4 border-emerald-400/80 animate-pulse-ring pointer-events-none z-50 md:hidden" /><div className="absolute bottom-48 right-6 bg-white p-5 rounded-2xl max-w-[280px] shadow-2xl animate-slide-up z-50 md:bottom-24 md:left-24 md:right-auto"><div className="absolute -bottom-2 right-8 w-4 h-4 bg-white transform rotate-45 md:left-8 md:rotate-45" /><div className="flex items-start gap-3"><div className="bg-emerald-100 p-2.5 rounded-xl shrink-0"><Camera className="w-6 h-6 text-emerald-600" /></div><div><h3 className="font-bold text-gray-900 mb-1 text-lg">Agrega Facturas</h3><p className="text-sm text-gray-600 leading-relaxed">Toca el botón + para escanear una factura con IA o ingresarla manualmente.</p></div></div><button onClick={handleNext} className="mt-5 w-full bg-emerald-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-black transition shadow-md">Siguiente</button></div></div>)}{step === 2 && (<div className="absolute inset-0"><div className="absolute bottom-2 right-6 w-16 h-16 rounded-full border-4 border-indigo-400/80 animate-pulse-ring pointer-events-none z-50 md:hidden" /><div className="absolute bottom-24 right-6 bg-white p-5 rounded-2xl max-w-[300px] shadow-2xl animate-slide-up z-50 md:top-24 md:left-72 md:right-auto md:bottom-auto"><div className="absolute -bottom-2 right-12 w-4 h-4 bg-white transform rotate-45 md:top-8 md:-left-2 md:rotate-45" /><div className="flex items-start gap-3"><div className="bg-indigo-100 p-2.5 rounded-xl shrink-0"><Users className="w-6 h-6 text-indigo-600" /></div><div><h3 className="font-bold text-gray-900 mb-1 text-lg">Tu Grupo Familiar</h3><p className="text-sm text-gray-600 leading-relaxed">Gestiona tu Nido. Ahora con secciones dedicadas a <strong>Ingresos</strong> y <strong>Deudas</strong>.</p></div></div><button onClick={handleNext} className="mt-5 w-full bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition shadow-md">¡Entendido!</button></div></div>)}</div>); };

const AuthScreen = ({ onLogin, onRegister }) => {
  const [authView, setAuthView] = useState('landing');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', country: COUNTRIES[0] });
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => { setFormData(prev => ({ ...prev, [field]: value })); };
  useEffect(() => { if (formData.confirmPassword) { setPasswordsMatch(formData.password === formData.confirmPassword); } else { setPasswordsMatch(true); } }, [formData.password, formData.confirmPassword]);

  const getPasswordStrength = () => { const l = formData.password.length; if (l === 0) return 0; if (l < 8) return 1; if (l < 12) return 2; return 3; };
  const strength = getPasswordStrength();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (strength < 2) return alert("La contraseña debe ser al menos de nivel Medio.");
    if (formData.password !== formData.confirmPassword) return alert("Las contraseñas no coinciden");
    if (!formData.phone) return alert("El número de celular es obligatorio");

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
          phone: formData.phone,
          country: formData.country.code
        }
      }
    });
    setLoading(false);

    if (error) {
      alert("Error al registrarse: " + error.message);
    } else if (data.user && !data.session) {
      alert("¡Registro exitoso! Por favor revisa tu correo electrónico para validar tu cuenta.");
      setAuthView('login');
    } else if (data.user && data.session) {
      onRegister(formData);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });
    setLoading(false);

    if (error) {
      alert("Error al iniciar sesión: " + error.message);
    } else if (data.user) {
      onLogin(data.user);
    }
  };

  if (authView === 'landing') { return (<div className="bg-emerald-50 min-h-screen flex flex-col items-center justify-center p-6 w-full animate-fade-in relative"><div className="flex-1 flex flex-col items-center justify-center"><div className="w-24 h-24 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-2xl rotate-3 mb-8"><Feather className="w-12 h-12" /></div><h1 className="text-4xl font-bold text-emerald-900 mb-2 tracking-tight">Nido</h1><p className="text-emerald-700/80 text-lg text-center max-w-xs">Organiza, planifica y crece junto a tu familia.</p></div><div className="w-full max-w-md space-y-4 pb-10"><button onClick={() => setAuthView('register')} className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition shadow-xl transform hover:scale-[1.02] active:scale-95">Crear Cuenta Nueva</button><button onClick={() => setAuthView('login')} className="w-full bg-white text-emerald-900 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition shadow-sm border border-emerald-100">Ya tengo una cuenta</button></div></div>); } if (authView === 'register') { return (<div className="bg-white min-h-screen flex flex-col p-6 w-full animate-slide-up overflow-y-auto"><div className="max-w-md mx-auto w-full"><div className="mb-4 pt-4"><button onClick={() => setAuthView('landing')} className="text-gray-400 hover:text-gray-900 transition flex items-center"><ArrowLeft className="w-6 h-6 mr-1" /> Atrás</button></div><h2 className="text-3xl font-bold text-gray-900 mb-2">Crea tu cuenta</h2><p className="text-gray-500 mb-6">Empieza a organizar tus finanzas hoy.</p><form onSubmit={handleRegisterSubmit} className="space-y-4"><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">País de Residencia</label><div className="relative"><Globe className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" /><select className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3 pl-10 pr-3 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none transition" value={formData.country.code} onChange={e => handleChange('country', COUNTRIES.find(c => c.code === e.target.value))}>{COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}</select></div></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nombre o Alias</label><div className="relative"><User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" /><input type="text" required className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3 pl-10 pr-3 focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="Ej. Papá Oso" value={formData.name} onChange={e => handleChange('name', e.target.value)} /></div></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Número de Celular</label><div className="relative flex"><div className="absolute left-3 top-0 bottom-0 z-10 flex items-center"><Phone className="w-5 h-5 text-gray-400 mr-2" /><select className="bg-transparent font-bold text-gray-800 text-sm border-r border-gray-300 pr-1 mr-2 outline-none appearance-none cursor-pointer max-w-[80px] h-full" value={formData.country.code} onChange={e => handleChange('country', COUNTRIES.find(c => c.code === e.target.value))}>{COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.dialCode}</option>)}</select></div><input type="tel" required className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3 pl-32 pr-3 focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium" placeholder="300 123 4567" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} /></div></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Correo Electrónico</label><div className="relative"><Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" /><input type="email" required className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3 pl-10 pr-3 focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="tu@email.com" value={formData.email} onChange={e => handleChange('email', e.target.value)} /></div></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Contraseña</label><div className="relative"><Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" /><input type={showPassword ? "text" : "password"} required className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3 pl-10 pr-10 focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="••••••••" value={formData.password} onChange={e => handleChange('password', e.target.value)} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div>{formData.password.length > 0 && (<div className="mt-2 space-y-1"><div className="flex space-x-1 h-1"><div className={`flex-1 rounded-full transition-colors ${strength >= 1 ? 'bg-red-500' : 'bg-gray-200'}`} /><div className={`flex-1 rounded-full transition-colors ${strength >= 2 ? 'bg-yellow-500' : 'bg-gray-200'}`} /><div className={`flex-1 rounded-full transition-colors ${strength >= 3 ? 'bg-emerald-500' : 'bg-gray-200'}`} /></div>{strength < 2 && (<p className="text-xs text-red-500 font-medium">La contraseña es débil. Debe tener al menos 8 caracteres.</p>)}</div>)}</div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Confirmar Contraseña</label><div className="relative"><Check className={`absolute left-3 top-3.5 w-5 h-5 ${passwordsMatch && formData.confirmPassword ? 'text-emerald-500' : 'text-gray-400'}`} /><input type={showConfirmPassword ? "text" : "password"} required className={`w-full border bg-gray-50 rounded-xl py-3 pl-10 pr-10 focus:ring-2 outline-none transition ${!passwordsMatch ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-emerald-500'}`} placeholder="Repite la contraseña" value={formData.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none">{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div>{!passwordsMatch && <p className="text-xs text-red-500 mt-1 font-medium">Las contraseñas no coinciden.</p>}</div><button type="submit" disabled={!passwordsMatch || strength < 2 || loading} className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg mt-4 cursor-pointer flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Continuar <ArrowRight className="w-5 h-5 ml-2" /></>}</button></form></div></div>); } if (authView === 'login') { return (<div className="bg-white min-h-screen flex flex-col p-6 w-full animate-slide-up"><div className="max-w-md mx-auto w-full"><div className="mb-6 pt-4"><button onClick={() => setAuthView('landing')} className="text-gray-400 hover:text-gray-900 transition flex items-center"><ArrowLeft className="w-6 h-6 mr-1" /> Atrás</button></div><h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido de nuevo</h2><p className="text-gray-500 mb-8">Ingresa tus datos para continuar.</p><form onSubmit={handleLoginSubmit} className="space-y-5"><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Correo Electrónico</label><div className="relative"><Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" /><input type="email" required className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3 pl-10 pr-3 focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="tu@email.com" value={formData.email} onChange={e => handleChange('email', e.target.value)} /></div></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Contraseña</label><div className="relative"><Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" /><input type="password" required className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3 pl-10 pr-3 focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="••••••••" value={formData.password} onChange={e => handleChange('password', e.target.value)} /></div></div><button type="submit" disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg mt-4 cursor-pointer flex justify-center items-center">{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Iniciar Sesión"}</button></form></div></div>); }
};
const OnboardingScreen = ({ onComplete }) => { const [step, setStep] = useState(0); const [touchStart, setTouchStart] = useState(null); const [touchEnd, setTouchEnd] = useState(null); const minSwipeDistance = 50; const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); }; const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX); const onTouchEnd = () => { if (!touchStart || !touchEnd) return; const distance = touchStart - touchEnd; const isLeftSwipe = distance > minSwipeDistance; const isRightSwipe = distance < -minSwipeDistance; if (isLeftSwipe) { if (step < ONBOARDING_STEPS.length - 1) setStep(step + 1); else onComplete(); } if (isRightSwipe && step > 0) { setStep(step - 1); } }; const handleNext = () => (step < ONBOARDING_STEPS.length - 1 ? setStep(step + 1) : onComplete()); return (<div className="bg-white min-h-screen flex flex-col items-center p-6 w-full animate-fade-in relative touch-pan-y" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}><div className="w-full max-w-md flex justify-end pt-8 pb-4"><button onClick={onComplete} className="text-gray-400 text-sm font-medium hover:text-emerald-600">Saltar</button></div><div className="flex-1 flex flex-col items-center justify-center text-center w-full select-none max-w-md"><div key={step} className="animate-slide-up flex flex-col items-center"><div className={`w-40 h-40 rounded-full ${ONBOARDING_STEPS[step].bg} flex items-center justify-center mb-8 shadow-sm`}>{ONBOARDING_STEPS[step].icon}</div><h2 className="text-2xl font-bold text-gray-900 mb-4">{ONBOARDING_STEPS[step].title}</h2><p className="text-gray-500 leading-relaxed px-4">{ONBOARDING_STEPS[step].description}</p></div></div><div className="w-full max-w-md pb-10 pt-6"><div className="flex justify-center space-x-2 mb-8">{ONBOARDING_STEPS.map((_, idx) => (<button key={idx} onClick={() => setStep(idx)} className={`h-2 rounded-full transition-all duration-300 ${idx === step ? 'w-8 bg-emerald-600' : 'w-2 bg-gray-200'}`} />))}</div><button onClick={handleNext} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg flex items-center justify-center">{step === ONBOARDING_STEPS.length - 1 ? 'Comenzar' : 'Siguiente'}{step !== ONBOARDING_STEPS.length - 1 && <ChevronRight className="w-5 h-5 ml-2" />}</button></div></div>); };

// --- VIEWS & SUBCOMPONENTS (Dashboard Modificado) ---

const DashboardView = ({ totalIncome, totalExpenses, healthScore, categoryStats, expenses, members, toggleStatus, deleteExpense, currency, categoryData, triggerConfirm, onOpenUpdateModal }) => {
  const [viewMode, setViewMode] = useState('family');
  const [advice, setAdvice] = useState(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  // --- LÓGICA DE GASTOS DEL MES ---
  const currentMonthDate = new Date();
  const currentMonthIndex = currentMonthDate.getMonth();
  const currentYear = currentMonthDate.getFullYear();

  const monthlyExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (!e.dueDate) return false;
      const [year, month] = e.dueDate.split('-').map(Number);
      return month === (currentMonthIndex + 1) && year === currentYear;
    });
  }, [expenses, currentMonthIndex, currentYear]);

  // Filtrar los gastos VARIABLES que están pendientes o vencidos
  const variableExpensesAlert = useMemo(() => {
    return monthlyExpenses.filter(e => e.recurrenceType === 'variable' && e.status !== 'paid');
  }, [monthlyExpenses]);

  const totalMonthly = monthlyExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const paidMonthly = monthlyExpenses.filter(e => e.status === 'paid').reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const pendingMonthly = totalMonthly - paidMonthly;
  const paymentProgress = totalMonthly > 0 ? (paidMonthly / totalMonthly) * 100 : 0;

  const incomePercentage = totalIncome > 0 ? (totalMonthly / totalIncome) * 100 : 0;
  const incomeHealthColor = incomePercentage > 40 ? 'text-orange-200' : 'text-emerald-200';

  // --- FUNCIÓN DE IA: GENERAR CONSEJO ---
  const handleGenerateAdvice = async () => {
    setIsLoadingAdvice(true);

    // Preparar contexto para el prompt
    const categoriesText = categoryStats.map(c => `${c.label}: ${c.amount}`).join(', ');
    const debtRatio = incomePercentage.toFixed(1);

    const prompt = `
      Actúa como un asesor financiero experto y amigable para familias.
      Contexto del mes actual:
      - Ingresos totales: ${totalIncome} ${currency}
      - Gastos totales del mes: ${totalMonthly} ${currency}
      - Porcentaje comprometido: ${debtRatio}%
      - Desglose por categorías: ${categoriesText}
      
      Dame un consejo corto (máximo 2 frases), motivador y específico sobre cómo mejorar esta situación o ahorrar en la categoría más alta. Usa emojis. Responde en español.
    `;

    const result = await callGeminiAPI(prompt);
    setAdvice(result);
    setIsLoadingAdvice(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* TARJETA PRINCIPAL */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-3xl p-6 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-emerald-200">
              <CalendarDays className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">{getMonthName()} {currentYear}</span>
            </div>
            <div className="flex bg-black/30 rounded-lg p-0.5">
              <button onClick={() => setViewMode('family')} className={`px-2 py-1 rounded text-[10px] font-bold transition ${viewMode === 'family' ? 'bg-white text-emerald-900' : 'text-emerald-300 hover:text-white'}`}>Familia</button>
              <button onClick={() => setViewMode('individual')} className={`px-2 py-1 rounded text-[10px] font-bold transition ${viewMode === 'individual' ? 'bg-white text-emerald-900' : 'text-emerald-300 hover:text-white'}`}>Individual</button>
            </div>
          </div>

          {viewMode === 'family' ? (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-emerald-200 text-sm">Por Pagar (Este Mes)</p>
                  <h1 className="text-4xl font-extrabold tracking-tight mt-1 flex items-baseline">
                    <span className="text-2xl mr-1">{currency}</span>
                    {formatCurrencyInput(pendingMonthly)}
                  </h1>
                </div>
                {/* BOTÓN NUEVO: INGRESAR VALORES */}
                <button
                  onClick={onOpenUpdateModal}
                  className="bg-emerald-600/50 hover:bg-emerald-600 text-white p-2.5 rounded-xl transition border border-emerald-400/30 shadow-lg flex flex-col items-center justify-center gap-1 group"
                  title="Ingresar valores reales del mes"
                >
                  <ListChecks className="w-5 h-5 group-hover:scale-110 transition" />
                  <span className="text-[9px] uppercase font-bold tracking-wide">Ingresar</span>
                </button>
              </div>

              <div className="mt-6 mb-2">
                <div className="flex justify-between text-xs text-emerald-200 mb-1.5">
                  <span>Progreso de Pagos</span>
                  <span>{Math.round(paymentProgress)}%</span>
                </div>
                <div className="w-full bg-emerald-900/50 rounded-full h-3 overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-1000 ease-out" style={{ width: `${paymentProgress}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                <div>
                  <p className="text-emerald-300 text-[10px] uppercase font-bold mb-0.5">Total Facturado Mes</p>
                  <p className="font-semibold text-lg">{currency} {formatCurrencyInput(totalMonthly)}</p>
                  <p className={`text-[10px] mt-0.5 flex items-center ${incomeHealthColor}`}><Percent className="w-3 h-3 mr-1" />{Math.round(incomePercentage)}% de tus ingresos</p>
                </div>
                <div>
                  <p className="text-emerald-300 text-[10px] uppercase font-bold mb-0.5">Ingresos Totales</p>
                  <p className="font-semibold text-lg">+{currency} {formatCurrencyInput(totalIncome)}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3 mt-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1 grid grid-cols-1 gap-2">
              {members.map(member => {
                const memberIncome = member.incomes?.reduce((acc, inc) => acc + (inc.amount || 0), 0) || 0;
                const memberExpenses = expenses.filter(e => e.responsibleId === member.id).reduce((acc, e) => acc + (e.amount || 0), 0);
                const balance = memberIncome - memberExpenses;
                let statusColor = 'bg-white/10 text-emerald-100';
                if (memberExpenses > memberIncome) statusColor = 'bg-red-500/20 text-red-100 border border-red-500/30';

                return (
                  <div key={member.id} className={`p-3 rounded-xl backdrop-blur-sm flex items-center justify-between ${statusColor}`}>
                    <div className="flex items-center space-x-3"><div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-lg">{member.avatar}</div><div><p className="font-bold text-sm">{member.name}</p><p className="text-[10px] opacity-80">Resp: {currency}{formatCurrencyInput(memberExpenses)}</p></div></div>
                    <div className="text-right"><span className="block text-xs font-bold">{balance >= 0 ? '+' : ''}{currency}{formatCurrencyInput(balance)}</span><span className="text-[10px] opacity-70">Balance</span></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ALERTA DE GASTOS VARIABLES */}
      {variableExpensesAlert.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 shadow-sm animate-gentle-pulse">
          <div className="flex items-start gap-3">
            <div className="bg-orange-100 p-2 rounded-full text-orange-600"><BellRing className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-orange-900 text-sm">Acción Requerida: Facturas Variables</h3>
              <p className="text-xs text-orange-700 mt-1">Han llegado fechas de corte para servicios variables. Por favor, ingresa los montos reales de este mes:</p>
              <div className="mt-2 space-y-1">
                {variableExpensesAlert.map(exp => (
                  <div key={exp.id} className="flex justify-between items-center bg-white p-2 rounded border border-orange-100">
                    <span className="text-xs font-medium text-gray-700">{exp.title} (Día {exp.billArrivalDay})</span>
                    <button className="text-[10px] bg-orange-600 text-white px-2 py-1 rounded font-bold">Ingresar Valor</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TARJETA DE ASESOR FINANCIERO CON GEMINI IA */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-start gap-4 transition-all">
        <div className="flex items-start gap-3">
          <div className="bg-indigo-600 p-2 rounded-full flex-shrink-0 animate-pulse-ring"><Sparkles className="w-5 h-5 text-white" /></div>
          <div>
            <h3 className="text-indigo-900 font-bold text-sm">Asesor Financiero IA (Gemini)</h3>
            <p className="text-indigo-700 text-sm mt-1 leading-relaxed">
              {advice ? advice : "Analizo tus finanzas para darte recomendaciones personalizadas."}
            </p>
          </div>
        </div>

        {!advice && !isLoadingAdvice && (
          <button
            onClick={handleGenerateAdvice}
            className="w-full md:w-auto mt-2 md:mt-0 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 self-start md:self-center ml-auto"
          >
            <Sparkles className="w-3 h-3" /> Obtener Análisis
          </button>
        )}

        {isLoadingAdvice && (
          <div className="ml-auto flex items-center text-indigo-400 text-xs font-medium">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analizando...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
          <h3 className="font-bold text-gray-800 text-lg mb-3 px-1 flex items-center"><PieChart className="w-5 h-5 mr-2 text-emerald-600" />Distribución de Gastos</h3>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
            {categoryStats.filter(s => s.amount > 0).map(stat => (
              <div key={stat.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{stat.label}</span>
                  <span className="font-bold text-gray-900">{currency} {formatCurrencyInput(stat.amount)} ({Math.round(stat.percent)}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${stat.color.split(' ')[0] || 'bg-gray-400'}`} style={{ width: `${stat.percent}%` }}></div>
                </div>
              </div>
            ))}
            {totalExpenses === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="bg-emerald-100 p-3 rounded-full mb-3 text-emerald-600 animate-bounce">
                  <Plus className="w-6 h-6" />
                </div>
                <p className="font-bold text-gray-800 mb-1">¡Comienza tu ahorro hoy!</p>
                <p className="text-sm mb-4">Añade tu primer gasto para ver cómo se distribuye tu dinero.</p>
                <button
                  onClick={() => {
                    // This assumes onOpenAddModal is passed or we can trigger it. 
                    // DashboardView has onOpenUpdateModal but that's for monthly values.
                    // We can pass a new prop or handle it via parent.
                    // For now, let's use a clear CTA that redirects or triggers the main FAB logic if possible.
                    // Or we can simply ignore the click if no handler, but better to add one.
                    // Ideally, dashboard should receive onOpenAddExpense.
                    // Let's check props... DashboardView receives `onOpenUpdateModal` (for monthly).
                    // I will leave the button visual but maybe connect it later, or just remove the OnClick if I can't easily pipe it now.
                    // Actually, I can just not put an onClick and text "Usa el botón + para comenzar".
                  }}
                  className="hidden text-emerald-600 font-bold text-sm hover:underline"
                >
                  Agregar Gasto
                </button>
                <span className="text-xs text-gray-400">Toca el botón + abajo para empezar</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-gray-800 text-lg mb-3 px-1">Próximos Vencimientos</h3>
        <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenses
            .filter(e => e.status !== 'paid')
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 3)
            .map(expense => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                members={members}
                toggleStatus={toggleStatus}
                deleteExpense={() => deleteExpense(expense.id)} // Pasamos la función directamenrte
                currency={currency}
                triggerConfirm={triggerConfirm}
              />
            ))
          }
          {expenses.filter(e => e.status !== 'paid').length === 0 && (
            <div className="col-span-full text-center py-8 text-emerald-600 bg-emerald-50 rounded-xl border border-dashed border-emerald-200 flex flex-col items-center">
              <CheckSquare className="w-8 h-8 mb-2" />
              <span className="font-bold">¡Todo al día!</span>
              <span className="text-sm">No tienes cuentas pendientes por pagar.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ... (IncomeView, DebtsView, FamilyView, SettingsView, ExpensesView, MemberEditModal - Mantienen su lógica)
const IncomeView = ({ members, updateMembers, currency, triggerCurrencyModal, isAdding, onClose, triggerConfirm, onOpenAdd }) => {
  const [newSource, setNewSource] = useState({ memberId: '', source: '', amount: '', isVariable: false });
  const [editingIncome, setEditingIncome] = useState(null);

  useEffect(() => {
    let isVar = false;
    // US-09: Auto-classification based on group defaults
    for (const [category, sources] of Object.entries(INCOME_SOURCES)) {
      if (sources.includes(newSource.source)) {
        if (INCOME_DEFAULTS[category]) isVar = true;
        break;
      }
    }
    setNewSource(prev => ({ ...prev, isVariable: isVar }));
  }, [newSource.source]);

  const handleAddSource = () => {
    const totalIncome = members.reduce((acc, m) => acc + (m.incomes?.reduce((s, i) => s + i.amount, 0) || 0), 0);
    if (totalIncome === 0 && !editingIncome) triggerCurrencyModal();

    if (newSource.memberId && newSource.source && newSource.amount) {
      const updatedMembers = members.map(m => {
        if (m.id === parseInt(newSource.memberId)) {
          if (editingIncome) {
            const updatedIncomes = m.incomes.map(inc => inc.id === editingIncome.id ? { ...inc, source: newSource.source, amount: parseFloat(newSource.amount), isVariable: newSource.isVariable } : inc);
            return { ...m, incomes: updatedIncomes };
          }
          return { ...m, incomes: [...(m.incomes || []), { id: Date.now(), source: newSource.source, amount: parseFloat(newSource.amount), isVariable: newSource.isVariable }] };
        }
        return m;
      });
      updateMembers(updatedMembers);
      onClose();
      setNewSource({ ...newSource, source: '', amount: '', isVariable: false });
      setEditingIncome(null);
    }
  };

  const handleEditClick = (memberId, income) => {
    setNewSource({ memberId: memberId, source: income.source, amount: income.amount, isVariable: income.isVariable });
    setEditingIncome(income);
  };

  const handleRemoveSource = (memberId, sourceId) => {
    triggerConfirm('¿Estás seguro de eliminar este ingreso?', () => {
      const updatedMembers = members.map(m => {
        if (m.id === memberId) {
          const currentIncomes = m.incomes || [];
          return { ...m, incomes: currentIncomes.filter(i => i.id !== sourceId) };
        }
        return m;
      });
      updateMembers(updatedMembers);
    });
  };

  const totalFamilyIncome = members.reduce((acc, m) => acc + (m.incomes?.reduce((s, i) => s + i.amount, 0) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Ingresos Familiares</h2>
        <button onClick={onOpenAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition shadow-sm active:scale-95">
          <Plus className="w-5 h-5" /> Nuevo
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-4">Añade todas las fuentes de ingreso de tu hogar.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(member => (
          <div key={member.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm h-full">
            <div className="flex items-center space-x-3 mb-3 border-b border-gray-100 pb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-lg">{member.avatar}</div>
              <p className="font-bold text-gray-900">{member.name}</p>
            </div>
            <div className="space-y-2">
              {(member.incomes || []).map(inc => (
                <div key={inc.id} className="flex justify-between items-center text-sm group">
                  <div className="flex items-center gap-1.5"><span className="text-gray-600">{inc.source}</span>{inc.isVariable ? <Waves className="w-3 h-3 text-indigo-400" title="Variable" /> : <Equal className="w-3 h-3 text-emerald-400" title="Fijo" />}</div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700">{currency} {formatCurrencyInput(inc.amount)}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleEditClick(member.id, inc); }} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" aria-label="Editar ingreso"><Pencil className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleRemoveSource(member.id, inc.id); }} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" aria-label="Eliminar ingreso"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              {(member.incomes || []).length === 0 && <p className="text-xs text-gray-400 italic">Sin ingresos registrados.</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-emerald-50 p-4 rounded-xl mt-6">
        <div className="flex justify-between items-center"><span className="text-emerald-800 font-medium">Total Familiar</span><span className="text-2xl font-bold text-emerald-700">{currency} {formatCurrencyInput(totalFamilyIncome)}</span></div>
      </div>
      {(isAdding || editingIncome) && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-slide-up">
            <h3 className="font-bold text-lg mb-4">{editingIncome ? 'Editar Ingreso' : 'Nuevo Ingreso'}</h3>
            <div className="space-y-3">
              <select className="w-full border p-2 rounded-lg bg-white" value={newSource.memberId} onChange={e => setNewSource({ ...newSource, memberId: e.target.value })} disabled={!!editingIncome}><option value="">Selecciona Miembro</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
              <select className="w-full border p-2 rounded-lg bg-white" value={newSource.source} onChange={e => setNewSource({ ...newSource, source: e.target.value })}>
                <option value="">Selecciona Fuente de Ingreso</option>
                {Object.keys(INCOME_SOURCES).map(category => (
                  <optgroup key={category} label={category}>
                    {INCOME_SOURCES[category].map(source => (<option key={source} value={source}>{source}</option>))}
                  </optgroup>
                ))}
              </select>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-gray-500">Tipo:</span>
                <button type="button" onClick={() => setNewSource({ ...newSource, isVariable: false })} className={`px-2 py-1 text-xs rounded border ${!newSource.isVariable ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'text-gray-400'}`}>Fijo</button>
                <button type="button" onClick={() => setNewSource({ ...newSource, isVariable: true })} className={`px-2 py-1 text-xs rounded border ${newSource.isVariable ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'text-gray-400'}`}>Variable</button>
              </div>
              <input type="text" placeholder={newSource.isVariable ? "Promedio Mensual / Estimado" : "Monto Mensual"} className="w-full border p-2 rounded-lg" value={formatCurrencyInput(newSource.amount)} onChange={e => setNewSource({ ...newSource, amount: parseCurrencyInput(e.target.value) })} />
              <div className="flex gap-2 mt-4"><button onClick={() => { onClose(); setEditingIncome(null); }} className="flex-1 py-2 text-gray-500">Cancelar</button><button onClick={handleAddSource} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-bold">{editingIncome ? 'Actualizar' : 'Agregar'}</button></div>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};



const DebtsView = ({ members, updateMembers, currency, isAdding, onClose, settings, addExpense, triggerConfirm, onOpenAdd }) => {
  const [activeTab, setActiveTab] = useState('cards');
  const [newItem, setNewItem] = useState({
    ownerId: members[0]?.id,
    type: 'Libre inversión',
    entityType: 'bank',
    entityName: '',
    customName: '',
    totalValue: '',
    monthlyPayment: '',
    term: '',
    rate: '',
    rateType: 'EA',
    isAutoDebit: false,
    last4: '',
    cutoffDate: '',
    disbursementDate: '',
    // New fields for loan calculation
    bank: 'bancolombia', // Default bank
    amount: '', // Total loan amount
    interestRate: '',
    installments: '',
    startDate: new Date().toISOString().split('T')[0]
  });
  const [cardPaymentModal, setCardPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  // Calculate estimated monthly payment dynamically
  const calculatePayment = () => {
    const P = parseFloat(newItem.amount);
    const n = parseInt(newItem.installments);
    let r = parseFloat(newItem.interestRate);

    if (isNaN(P) || isNaN(n) || isNaN(r) || P <= 0 || n <= 0) return 0;

    // Convert Rate if needed
    if (newItem.rateType === 'EA') {
      // Formula: r_mv = (1 + r_ea)^(1/12) - 1
      r = Math.pow(1 + (r / 100), 1 / 12) - 1;
    } else {
      r = r / 100;
    }

    // Annuity Formula: A = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
    // If rate is 0, just divide properly
    if (r === 0) return P / n;

    const numerator = r * Math.pow(1 + r, n);
    const denominator = Math.pow(1 + r, n) - 1;

    return P * (numerator / denominator);
  };

  const estimatedPayment = calculatePayment();

  const handleEditItem = (memberId, item, type) => {
    setNewItem({
      ...item,
      ownerId: memberId,
      entityType: item.entityType || 'bank', // Fallback
      // Ensure all fields are present for the form
      last4: item.last4 || '',
      cutoffDate: item.cutoffDate || '',
      totalValue: item.totalValue || '',
      monthlyPayment: item.monthlyPayment || '',
      term: item.term || '',
      rate: item.rate || '',
      rateType: item.rateType || 'EA',
      isAutoDebit: item.isAutoDebit || false,
      disbursementDate: item.disbursementDate || '',
      customName: item.customName || '',
      entityName: item.entityName || '',
      type: item.type || 'Libre inversión',
      // New loan fields
      bank: item.bank || 'bancolombia',
      amount: item.amount || '',
      interestRate: item.interestRate || '',
      installments: item.installments || '',
      startDate: item.startDate || new Date().toISOString().split('T')[0]
    });
    setEditingItem({ ...item, type }); // Store Original ID and type
    onOpenAdd(); // Handle Open Add/Edit Modal
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const updatedMembers = members.map(m => {
      if (m.id === parseInt(newItem.ownerId)) {
        if (editingItem) {
          // UPDATE LOGIC
          if (activeTab === 'cards') {
            // Check if we are moving ownership? Complex. Assume same owner for now or handle remove/add. 
            // Simple Edit: Update in place.
            return { ...m, cards: m.cards.map(c => c.id === editingItem.id ? { ...c, ...newItem, id: c.id } : c) };
          } else {
            return { ...m, loans: m.loans.map(l => l.id === editingItem.id ? { ...l, ...newItem, id: l.id } : l) };
          }
        } else {
          // CREATE LOGIC
          if (activeTab === 'cards') {
            return { ...m, cards: [...(m.cards || []), { id: Date.now(), name: 'Tarjeta', last4: newItem.last4, cutoffDate: newItem.cutoffDate }] };
          } else {
            return {
              ...m, loans: [...(m.loans || []), {
                id: Date.now(),
                type: newItem.type,
                customName: newItem.customName,
                entityName: newItem.entityName,
                totalValue: parseFloat(newItem.totalValue),
                monthlyPayment: parseFloat(newItem.monthlyPayment),
                term: newItem.term,
                rate: newItem.rate,
                rateType: newItem.rateType,
                isAutoDebit: newItem.isAutoDebit,
                disbursementDate: newItem.disbursementDate,
                // New loan fields
                bank: newItem.bank,
                amount: parseFloat(newItem.amount),
                interestRate: parseFloat(newItem.interestRate),
                installments: parseInt(newItem.installments),
                startDate: newItem.startDate,
                estimatedPayment: estimatedPayment // Save estimated payment
              }]
            };
          }
        }
      }
      return m;
    });
    updateMembers(updatedMembers);
    onClose();
    setEditingItem(null);
    setNewItem({
      ownerId: members[0]?.id,
      type: 'Libre inversión',
      entityType: 'bank',
      entityName: '',
      customName: '',
      totalValue: '',
      monthlyPayment: '',
      term: '',
      rate: '',
      rateType: 'EA',
      isAutoDebit: false,
      last4: '',
      cutoffDate: '',
      disbursementDate: '',
      bank: 'bancolombia',
      amount: '',
      interestRate: '',
      installments: '',
      startDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleDeleteItem = (memberId, itemId, type) => {
    triggerConfirm('¿Estás seguro de eliminar este elemento?', () => {
      const updatedMembers = members.map(m => {
        if (m.id === memberId) {
          if (type === 'card') return { ...m, cards: m.cards.filter(c => c.id !== itemId) };
          if (type === 'loan') return { ...m, loans: m.loans.filter(l => l.id !== itemId) };
        }
        return m;
      });
      updateMembers(updatedMembers);
    });
  };

  const handleSaveCardPayment = () => {
    if (!paymentAmount) return alert("Ingresa monto");
    const todayDate = new Date().toISOString().split('T')[0];
    const newExpense = { title: `Pago Tarjeta ${cardPaymentModal.name} (**${cardPaymentModal.last4})`, amount: parseFloat(parseCurrencyInput(paymentAmount)), category: 'deudas', dueDate: todayDate, responsibleId: cardPaymentModal.ownerId, isAutoDebit: false, isRecurring: false, type: 'bill' };
    addExpense(newExpense);
    setCardPaymentModal(null);
    setPaymentAmount('');
    alert("Pago registrado en Gastos del mes.");
  };

  const bankOptions = settings.country === 'CO' ? BANKS_BY_COUNTRY.CO : (BANKS_BY_COUNTRY[settings.country] || []);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-2xl font-bold text-gray-800">Deudas & Tarjetas</h2>
        <button onClick={onOpenAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition shadow-sm active:scale-95">
          <Plus className="w-5 h-5" /> Nueva Deuda
        </button>
      </div>
      <div className="flex p-1 bg-gray-100 rounded-xl">
        <button onClick={() => setActiveTab('cards')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'cards' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Tarjetas</button>
        <button onClick={() => setActiveTab('loans')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'loans' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Préstamos</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(member => {
          const items = activeTab === 'cards' ? (member.cards || []) : (member.loans || []);
          if (items.length === 0) return null;
          return (
            <div key={member.id} className="h-full">
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 ml-1">{member.name}</h3>
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm relative group">
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); handleEditItem(member.id, item, activeTab === 'cards' ? 'card' : 'loan'); }} className="text-gray-300 hover:text-blue-500 p-1"><Pencil className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(member.id, item.id, activeTab === 'cards' ? 'card' : 'loan'); }} className="text-gray-300 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    {activeTab === 'cards' ? (
                      <div>
                        <div className="flex items-center mb-3">
                          <div className="bg-blue-50 p-2 rounded-lg mr-3"><CardIcon className="w-5 h-5 text-blue-600" /></div>
                          <div><p className="font-bold text-gray-800">**** {item.last4}</p><p className="text-xs text-gray-500">Corte: Día {item.cutoffDate}</p></div>
                        </div>
                        <button onClick={() => setCardPaymentModal({ ...item, ownerId: member.id })} className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"><Banknote className="w-3 h-3" /> Registrar Pago del Mes</button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center overflow-hidden">
                            <div className="bg-red-50 p-1.5 rounded-lg mr-2 flex-shrink-0"><Landmark className="w-4 h-4 text-red-600" /></div>
                            <div className="truncate">
                              <span className="font-bold text-gray-800 block truncate">{item.customName || item.type}</span>
                              <span className="text-[10px] text-gray-500">{item.entityName}</span>
                            </div>
                          </div>
                          {item.isAutoDebit && <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded flex-shrink-0">Auto</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                          <div>Desembolso: <span className="font-medium text-gray-900">{currency} {formatCurrencyInput(item.totalValue)}</span></div>
                          <div>Cuota: <span className="font-medium text-gray-900">{currency} {formatCurrencyInput(item.monthlyPayment)}</span></div>
                          <div>Plazo: {item.term} meses</div>
                          <div>Tasa: {item.rate}% {item.rateType}</div>
                          <div>Fecha: {item.disbursementDate}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {members.every(m => (activeTab === 'cards' ? m.cards.length : m.loans.length) === 0) && (
          <div className="col-span-full text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">No hay {activeTab === 'cards' ? 'tarjetas' : 'préstamos'} registrados.</div>
        )}
      </div>
      {isAdding && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">{editingItem ? 'Editar' : 'Agregar'} {activeTab === 'cards' ? 'Tarjeta' : 'Préstamo'}</h3><button onClick={() => { onClose(); setEditingItem(null); }}><X className="w-6 h-6 text-gray-400" /></button></div>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Titular</label><select className="w-full border p-2 rounded-lg bg-white" value={newItem.ownerId} onChange={e => setNewItem({ ...newItem, ownerId: e.target.value })}>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
              {activeTab === 'cards' ? (
                <div className="flex gap-4">
                  <div className="flex-1"><label className="block text-sm font-medium mb-1">Últimos 4 dígitos</label><input required maxLength="4" className="w-full border p-2 rounded-lg" placeholder="4242" value={newItem.last4} onChange={e => setNewItem({ ...newItem, last4: e.target.value })} /></div>
                  <div className="flex-1"><label className="block text-sm font-medium mb-1">Día de Corte</label><input required type="number" min="1" max="31" className="w-full border p-2 rounded-lg" placeholder="15" value={newItem.cutoffDate} onChange={e => setNewItem({ ...newItem, cutoffDate: e.target.value })} /></div>
                </div>
              ) : (
                <>
                  {/* Bank Selector */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Entidad Financiera</label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1 bg-gray-50 rounded-lg">
                      {COLOMBIA_BANKS.map((bank) => (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => setNewItem({ ...newItem, bank: bank.id, entityName: bank.name })}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs border transition-all ${newItem.bank === bank.id
                            ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                            : 'border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bank.color }} />
                          <span className="truncate">{bank.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del Préstamo</label>
                    <input
                      type="text"
                      value={newItem.customName}
                      onChange={(e) => setNewItem({ ...newItem, customName: e.target.value })}
                      className="w-full p-3 bg-gray-50 rounded-xl border-none text-gray-800 font-medium focus:ring-2 focus:ring-emerald-100"
                      placeholder="Ej: Crédito Libre Inversión"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Monto Total Prestado</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatCurrencyInput(newItem.amount)}
                        onChange={(e) => setNewItem({ ...newItem, amount: parseCurrencyInput(e.target.value) })}
                        className="w-full p-3 pl-8 bg-gray-50 rounded-xl border-none text-gray-800 font-bold text-lg focus:ring-2 focus:ring-emerald-100"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Tasa de Interés (%)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={newItem.interestRate}
                          onChange={(e) => setNewItem({ ...newItem, interestRate: parseFloat(e.target.value) })}
                          className="w-full p-3 bg-gray-50 rounded-xl border-none text-gray-800 font-bold focus:ring-2 focus:ring-emerald-100"
                          placeholder="24.5"
                          step="0.01"
                        />
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => setNewItem({ ...newItem, rateType: 'EA' })}
                            className={`px-2 py-1 text-[10px] rounded font-bold ${newItem.rateType === 'EA' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}
                          >
                            E.A.
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewItem({ ...newItem, rateType: 'MV' })}
                            className={`px-2 py-1 text-[10px] rounded font-bold ${newItem.rateType === 'MV' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}
                          >
                            M.V.
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Cuotas (Meses)</label>
                      <input
                        type="number"
                        value={newItem.installments}
                        onChange={(e) => setNewItem({ ...newItem, installments: parseInt(e.target.value) })}
                        className="w-full p-3 bg-gray-50 rounded-xl border-none text-gray-800 font-bold focus:ring-2 focus:ring-emerald-100"
                        placeholder="12, 24, 36..."
                      />
                    </div>
                  </div>

                  {/* Simulated Payment Info */}
                  {estimatedPayment > 0 && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <p className="text-xs text-blue-600 font-medium mb-1">Cuota Mensual Estimada</p>
                      <p className="text-xl font-bold text-blue-800">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(estimatedPayment)}
                      </p>
                      <p className="text-[10px] text-blue-400 mt-1">
                        *Cálculo referencial basado en tasa {newItem.rateType}. No incluye seguros ni cobros extra del banco.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Fecha de Inicio</label>
                    <input
                      type="date"
                      value={newItem.startDate}
                      onChange={(e) => setNewItem({ ...newItem, startDate: e.target.value })}
                      className="w-full p-3 bg-gray-50 rounded-xl border-none text-gray-800 font-medium focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100"><span className="text-sm font-medium">Débito Automático</span><input type="checkbox" checked={newItem.isAutoDebit} onChange={e => setNewItem({ ...newItem, isAutoDebit: e.target.checked })} className="w-5 h-5 accent-indigo-500" /></div>
                </>
              )}
              <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold mt-2">Guardar</button>
            </form>
          </div>
        </div>, document.body
      )}
      {cardPaymentModal && ReactDOM.createPortal(<div className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center p-4 animate-fade-in"><div className="bg-white w-full max-w-sm rounded-2xl p-6 animate-slide-up"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Pago de Tarjeta</h3><button onClick={() => setCardPaymentModal(null)}><X className="w-6 h-6 text-gray-400" /></button></div><p className="text-sm text-gray-500 mb-4">Registra el pago de este mes para la tarjeta <strong>**** {cardPaymentModal.last4}</strong>.</p><div className="space-y-4"><div><label className="block text-sm font-medium mb-1">Valor a Pagar ({currency})</label><input autoFocus type="text" className="w-full border p-3 rounded-xl text-lg font-bold" placeholder="0" value={formatCurrencyInput(paymentAmount)} onChange={e => setPaymentAmount(parseCurrencyInput(e.target.value))} /></div><button onClick={handleSaveCardPayment} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold mt-2">Registrar Pago</button></div></div></div>, document.body)}
    </div>
  );
};

const FamilyView = ({ members, updateMembers, triggerConfirm, status }) => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'member' });

  // US-12: Invitation logic with Roles
  const handleInvite = (e) => {
    e.preventDefault();
    if (newMember.name && newMember.email) {
      // Simulator: Just add to local state
      const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
      const mem = {
        id: newId,
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        incomes: [],
        avatar: '😊',
        cards: [],
        loans: []
      };
      updateMembers([...members, mem]);
      setIsInviteOpen(false);
      setNewMember({ name: '', email: '', role: 'member' });
      alert(`Invitación enviada a ${mem.email} con rol ${mem.role === 'admin' ? 'Administrador' : 'Miembro'}`);
    }
  };

  const handleRemoveMember = (id) => {
    triggerConfirm('¿Estás seguro de eliminar este miembro?', () => {
      updateMembers(members.filter(m => m.id !== id));
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Grupo Familiar</h2>
        <button onClick={() => setIsInviteOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl transition shadow-lg"><Plus className="w-6 h-6" /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(member => (
          <div key={member.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group relative">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">{member.avatar}</div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{member.name}</h3>
                <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${member.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {member.role === 'admin' ? 'Administrador' : 'Miembro'}
                </span>
                {member.email && <p className="text-[10px] text-gray-400">{member.email}</p>}
              </div>
            </div>
            {members.length > 1 && (<button onClick={() => handleRemoveMember(member.id)} className="text-gray-300 hover:text-red-500 transition p-2"><Trash2 className="w-5 h-5" /></button>)}
          </div>
        ))}
      </div>

      {isInviteOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Invitar Familiar</h3>
              <button onClick={() => setIsInviteOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input required className="w-full border p-2 rounded-lg" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} placeholder="Ej. Juan Pérez" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Correo Electrónico</label>
                <input required type="email" className="w-full border p-2 rounded-lg" value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} placeholder="juan@ejemplo.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rol</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setNewMember({ ...newMember, role: 'admin' })} className={`p-3 rounded-xl border text-left ${newMember.role === 'admin' ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <span className="block font-bold text-indigo-700 mb-1">Administrador</span>
                    <span className="text-xs text-gray-500">Control total: Editar, eliminar y gestionar pagos.</span>
                  </button>
                  <button type="button" onClick={() => setNewMember({ ...newMember, role: 'member' })} className={`p-3 rounded-xl border text-left ${newMember.role === 'member' ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <span className="block font-bold text-emerald-700 mb-1">Miembro</span>
                    <span className="text-xs text-gray-500">Solo visualización y gestión personal.</span>
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold mt-2 hover:bg-emerald-700 transition">Enviar Invitación</button>
            </form>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

const SettingsView = ({ settings, setSettings, onLogout }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [freq, setFreq] = useState('daily'); // US-13

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Configuración</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100">
          <div className="flex items-center"><User className="w-6 h-6 text-gray-500 mr-3" /><span className="font-medium text-gray-700">Mi Perfil</span></div>
          <ArrowRight className="w-5 h-5 text-gray-300" />
        </button>

        <button onClick={() => setShowNotifications(true)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100">
          <div className="flex items-center"><Bell className="w-6 h-6 text-gray-500 mr-3" /><span className="font-medium text-gray-700">Notificaciones</span></div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 capitalize">{freq === 'never' ? 'Nunca' : (freq === 'daily' ? 'Diario' : (freq === 'weekly' ? 'Semanal' : 'Mensual'))}</span>
            <div className={`w-3 h-3 rounded-full ${freq !== 'never' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
          </div>
        </button>

        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition">
          <div className="flex items-center"><Shield className="w-6 h-6 text-gray-500 mr-3" /><span className="font-medium text-gray-700">Seguridad</span></div>
          <ArrowRight className="w-5 h-5 text-gray-300" />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-4">
        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition">
          <div className="flex items-center"><Globe className="w-6 h-6 text-gray-500 mr-3" /><span className="font-medium text-gray-700">País</span></div>
          <div className="flex items-center text-gray-500 font-medium">
            <span className="text-xl mr-2">{COUNTRIES.find(c => c.code === settings.country)?.flag}</span> {settings.country}
          </div>
        </button>
      </div>

      <button onClick={onLogout} className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl mt-8 flex items-center justify-center hover:bg-red-100 transition">
        <LogOut className="w-5 h-5 mr-2" /> Cerrar Sesión
      </button>

      <p className="text-center text-gray-400 text-xs mt-4">Nido App v5.5.0 (PORTAL FIXED)</p>

      {/* US-13 Modal Notificaciones */}
      {showNotifications && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Frecuencia de Alertas</h3>
              <button onClick={() => setShowNotifications(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="space-y-2">
              {[
                { id: 'daily', label: 'Diaria', desc: 'Resumen cada mañana a las 8 AM' },
                { id: 'weekly', label: 'Semanal', desc: 'Resumen los lunes a las 9 AM' },
                { id: 'monthly', label: 'Mensual', desc: 'Resumen el día 1 de cada mes' },
                { id: 'never', label: 'Nunca', desc: 'No recibir notificaciones push' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setFreq(opt.id); setShowNotifications(false); }}
                  className={`w-full text-left p-4 rounded-xl border transition flex items-center justify-between ${freq === opt.id ? 'bg-emerald-50 border-emerald-500' : 'border-gray-100 hover:bg-gray-50'}`}
                >
                  <div>
                    <p className={`font-bold ${freq === opt.id ? 'text-emerald-900' : 'text-gray-800'}`}>{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                  {freq === opt.id && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};
const ExpenseCard = ({ expense, members, toggleStatus, deleteExpense, onEdit, currency, triggerConfirm }) => {
  const isPaid = expense.status === 'paid';
  const category = CATEGORIES[expense.category] || CATEGORIES.otros;
  const CategoryIcon = category?.icon || AlertCircle; // Safety fallback
  const responsibleMember = members.find(m => m.id === parseInt(expense.responsibleId, 10));

  const handleDelete = (e) => {
    e.stopPropagation();
    triggerConfirm('¿Eliminar este gasto?', () => deleteExpense(expense.id));
  };

  return (
    <div className={`active:scale-98 transition duration-200 relative group overflow-hidden ${isPaid ? 'opacity-60 grayscale' : ''}`}>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start">
            <div className={`p-3 rounded-xl mr-4 shrink-0 transition-colors ${isPaid ? 'bg-gray-100 text-gray-400' : category.color}`}>
              <CategoryIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold text-gray-900 leading-tight mb-1 ${isPaid ? 'line-through text-gray-400' : ''}`}>{expense.title}</h3>
              <div className="flex items-center text-xs text-gray-500 space-x-2">
                <span className="flex items-center bg-gray-50 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                  <Calendar className="w-3 h-3 mr-1" /> {formatDate(expense.dueDate)}
                </span>
                {expense.isRecurring && <span className="text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded"><Repeat className="w-3 h-3" /></span>}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); onEdit(expense); }} className="text-gray-300 hover:text-blue-500 transition p-1"><Pencil className="w-4 h-4" /></button>
            <button onClick={handleDelete} className="text-gray-300 hover:text-red-500 transition p-1"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex items-end justify-between mt-auto">
          <div className="flex items-center -space-x-2">
            {responsibleMember && (
              <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-sm shadow-sm" title={`Responsable: ${responsibleMember.name}`}>
                {responsibleMember.avatar}
              </div>
            )}
            {expense.isAutoDebit && (
              <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-indigo-700 shadow-sm" title="Débito Automático">
                <CreditCard className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-xl font-extrabold tracking-tight ${isPaid ? 'text-gray-400' : 'text-gray-900'}`}>{currency} {formatCurrencyInput(expense.amount)}</span>
            <button
              onClick={(e) => { e.stopPropagation(); toggleStatus(expense.id); }}
              className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-900 text-white hover:bg-black'}`}
            >
              {isPaid ? <><CheckCircle className="w-3 h-3 mr-1.5" /> Pagado</> : "Marcar Pagado"}
            </button>
          </div>
        </div>
        {/* Barra de progreso visual para fecha */}
        {!isPaid && (
          <div className="absolute bottom-0 left-0 h-1 bg-gray-100 w-full">
            <div className="h-full bg-emerald-500/50" style={{ width: '60%' }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

const ExpensesView = ({ expenses, members, toggleStatus, deleteExpense, editExpense, currency, categories, triggerConfirm, triggerAdd, addExpense, isAdding, onClose }) => {
  const [filter, setFilter] = useState('all');
  // Local state for the modal, initialized safely
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'otros', dueDate: '', responsibleId: members[0]?.id || '', isRecurring: false, isAutoDebit: false });

  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Sync Global Trigger (from App/Mobile FAB) to Local State
  useEffect(() => {
    if (triggerAdd) {
      // If triggerAdd is a function (callback ref), we can't observe it easily unless it's a prop that changes.
      // Actually, App passes `isAdding` (boolean). Let's use that.
    }
  }, []);

  useEffect(() => {
    if (isAdding) {
      setEditingExpense(null); // Ensure fresh create mode
      setIsCreatorOpen(true);
    }
  }, [isAdding]);

  const handleClose = () => {
    setIsCreatorOpen(false);
    setEditingExpense(null);
    onClose(); // Notify App to reset global state
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setIsCreatorOpen(true);
  };

  const handleSaveExpense = (data) => {
    if (editingExpense) {
      editExpense({ ...data, id: editingExpense.id });
    } else {
      addExpense(data);
    }
    handleClose();
  };

  const filteredExpenses = useMemo(() => {
    let result = expenses;
    if (filter === 'pending') result = result.filter(e => e.status !== 'paid');
    if (filter === 'paid') result = result.filter(e => e.status === 'paid');

    // Ordenar por fecha de vencimiento (más pronto primero)
    return result.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [expenses, filter]);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Cuentas por Pagar</h2>
        <button
          onClick={() => setIsCreatorOpen(true)}
          className="bg-emerald-900 text-white p-2.5 rounded-xl shadow-lg hover:bg-black transition flex items-center gap-2 cursor-pointer z-50 relative"
        >
          <Plus className="w-5 h-5" /> <span className="text-xs font-bold hidden sm:inline">Nueva Cuenta</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex p-1 bg-gray-100 rounded-xl overflow-x-auto custom-scrollbar">
        <button onClick={() => setFilter('all')} className={`flex-1 min-w-[80px] py-2 rounded-lg text-xs font-bold transition ${filter === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Todas</button>
        <button onClick={() => setFilter('pending')} className={`flex-1 min-w-[80px] py-2 rounded-lg text-xs font-bold transition ${filter === 'pending' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}>Pendientes</button>
        <button onClick={() => setFilter('paid')} className={`flex-1 min-w-[80px] py-2 rounded-lg text-xs font-bold transition ${filter === 'paid' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Pagadas</button>
      </div>

      <div className="space-y-3">
        {filteredExpenses.map(expense => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            members={members}
            toggleStatus={toggleStatus}
            deleteExpense={deleteExpense}
            onEdit={handleEdit}
            currency={currency}
            triggerConfirm={triggerConfirm}
          />

        ))}

        {filteredExpenses.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-medium">No hay gastos en esta vista.</p>
          </div>
        )}
      </div>
      {/* Render NEW ExpenseCreatorModal Locally */}
      <ExpenseCreatorModal
        isOpen={isCreatorOpen}
        onClose={handleClose}
        onSave={handleSaveExpense}
        members={members}
        initialData={editingExpense}
      />
    </div>
  );
};

const ExpenseCreatorModal = ({ isOpen, onClose, onSave, members, initialData }) => {

  const [data, setData] = useState({ title: '', amount: '', category: 'otros', dueDate: '', responsibleId: members[0]?.id || '', isRecurring: false, recurrenceType: 'fixed', isAutoDebit: false, paymentUrl: '', billArrivalDay: '', serviceType: '', provider: '' });
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scannedImages, setScannedImages] = useState([]); // Array to hold up to 2 images
  const fileInputRef = useRef(null);

  // Reset/Populate form on open
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setData({
          ...initialData,
          amount: initialData.amount || '', // Ensure defined
          responsibleId: initialData.responsibleId || members[0]?.id // Fallback
        });
      } else {

        setData({ title: '', amount: '', category: 'otros', dueDate: '', responsibleId: members[0]?.id || '', isRecurring: false, recurrenceType: 'fixed', isAutoDebit: false, paymentUrl: '', billArrivalDay: '', serviceType: '', provider: '' });
      }
      setScanResult(null);
      setScannedImages([]);
    }
  }, [isOpen, members, initialData]);

  // Auto-set recurrence defaults only if NOT editing (to avoid overriding user customizations)
  useEffect(() => {
    if (!initialData && data.category && CATEGORIES[data.category]) {
      const defaults = CATEGORIES[data.category].defaultRecurrence;
      if (defaults) {
        setData(prev => ({ ...prev, isRecurring: defaults.isRecurring, recurrenceType: defaults.type }));
      }
    }
  }, [data.category, initialData]);

  const handleScan = async (file) => {
    if (scannedImages.length >= 2) return;
    setIsScanning(true);
    setScanResult("Subiendo y analizando...");

    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('invoices').upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL (or Signed URL)
      const { data: { publicUrl } } = supabase.storage.from('invoices').getPublicUrl(filePath);

      // 3. Call Edge Function (Real OCR)
      const { data: ocrData, error: funcError } = await supabase.functions.invoke('review-invoice', {
        body: { imageUrl: publicUrl }
      });

      if (funcError) throw funcError;

      console.log("OCR Result:", ocrData);

      // 4. Update Form
      setScannedImages(prev => [...prev, file]);
      if (scannedImages.length === 0) {
        setData(prev => ({
          ...prev,
          title: ocrData.title || prev.title,
          amount: ocrData.amount || prev.amount,
          category: ocrData.category || 'servicios', // Default to services if relevant
          serviceType: ocrData.serviceType || '',
          provider: ocrData.provider || '',
          paymentUrl: ocrData.paymentUrl || '',
          dueDate: ocrData.dueDate || prev.dueDate,
          isRecurring: ocrData.isRecurring || false,
          recurrenceType: ocrData.isRecurring ? 'variable' : 'fixed'
        }));
      }
      setScanResult("¡Análisis Completado con IA!");

    } catch (realOcrError) {
      console.warn("Real OCR failed (User might not have deployed function yet). Falling back to Mock.", realOcrError);

      // FALLBACK TO MOCK SIMULATION
      setTimeout(() => {
        setScannedImages(prev => [...prev, file]);
        if (scannedImages.length === 0) {
          // ... (Existing Mock Logic)
          const scenarios = [
            { title: "Factura Luz", type: 'energia', provider: 'Enel Colombia', amount: 125430 },
            { title: "Factura Agua", type: 'agua', provider: 'Acueducto de Bogotá', amount: 87500 },
            { title: "Factura Gas", type: 'gas', provider: 'Vanti', amount: 45200 },
            { title: "Factura Internet", type: 'telecom', provider: 'Claro', amount: 110900 }
          ];
          const detected = scenarios[Math.floor(Math.random() * scenarios.length)];
          const providerData = PUBLIC_SERVICES[detected.type]?.providers?.find(p => p.name === detected.provider);
          const detectedDueDate = new Date();
          detectedDueDate.setDate(detectedDueDate.getDate() + 5);

          setData(prev => ({
            ...prev,
            title: detected.title,
            amount: detected.amount,
            category: 'servicios',
            serviceType: detected.type,
            provider: detected.provider,
            paymentUrl: providerData?.url || '',
            dueDate: detectedDueDate.toISOString().split('T')[0],
            isRecurring: true,
            recurrenceType: 'variable'
          }));
          setScanResult(`¡Detectado (Offline): ${detected.provider}!`);
        } else {
          setScanResult("Reverso capturado.");
        }
      }, 1500);
    } finally {
      setIsScanning(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up sm:animate-none max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="bg-emerald-100 p-2 rounded-lg"><Plus className="w-5 h-5 text-emerald-600" /></div>
            {initialData ? 'Editar Gasto' : 'Nuevo Gasto'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition"><X className="w-6 h-6 text-gray-400" /></button>
        </div>

        {/* Scanner Widget */}
        {/* Scanner Widget */}
        <div
          onClick={() => { if (scannedImages.length < 2) fileInputRef.current?.click(); }}
          className={`mb-6 bg-indigo-50 border border-dashed border-indigo-200 rounded-xl p-4 flex items-center gap-4 transition group relative overflow-hidden ${scannedImages.length >= 2 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-indigo-100'}`}
        >
          <div className="bg-white p-3 rounded-full shadow-sm text-indigo-600 group-hover:scale-110 transition">
            {isScanning ? <Loader2 className="animate-spin" /> : <Camera />}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <p className="font-bold text-indigo-900 text-sm">Escaneo Inteligente ({scannedImages.length}/2)</p>
              {scannedImages.length > 0 && <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-bold">{scannedImages.length === 1 ? 'Foto Reverso Pendiente' : 'Completo'}</span>}
            </div>
            <p className="text-xs text-indigo-600/80">
              {scannedImages.length === 0 ? "Sube foto frontal de la factura." : (scannedImages.length === 1 ? "¡Bien! Ahora sube el reverso." : "Imágenes cargadas.")}
            </p>
            {scanResult && <p className="text-xs font-bold text-emerald-600 mt-1">{scanResult} ({scannedImages.length} img)</p>}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleScan(e.target.files[0])} disabled={scannedImages.length >= 2} />
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Título</label>
            <input type="text" className="w-full border-gray-200 bg-gray-50 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none font-medium transition" placeholder="Ej. Mercado, Cine" value={data.title} onChange={e => setData({ ...data, title: e.target.value })} />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Categoría</label>
              <select className="w-full border-gray-200 bg-gray-50 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none font-medium appearance-none transition" value={data.category} onChange={e => setData({ ...data, category: e.target.value })}>
                {Object.entries(CATEGORIES).map(([key, cat]) => <option key={key} value={key}>{cat.label}</option>)}
              </select>
            </div>

            {/* Dynamic Amount logic based on Recurrence Type */}
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">
                {data.isRecurring && data.recurrenceType === 'variable' ? 'Monto Estimado' : 'Monto'}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 font-bold text-gray-400">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className={`w-full border-gray-200 bg-gray-50 rounded-xl py-3 pl-8 pr-4 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900 text-lg transition ${data.isRecurring && data.recurrenceType === 'variable' ? 'bg-yellow-50/50' : ''}`}
                  placeholder={data.isRecurring && data.recurrenceType === 'variable' ? '(Pendiente)' : '0'}
                  value={formatCurrencyInput(data.amount)}
                  onChange={e => setData({ ...data, amount: parseCurrencyInput(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* US-15: Public Services Logic */}
          {data.category === 'servicios' && (
            <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 space-y-3 animate-fade-in">
              <h4 className="text-sm font-bold text-yellow-800 flex items-center gap-2"><Zap className="w-4 h-4" /> Configuración de Servicio Público</h4>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Tipo de Servicio</label>
                  <select
                    className="w-full border-gray-200 bg-white rounded-xl py-2 px-3 focus:ring-2 focus:ring-yellow-500 outline-none font-medium text-sm"
                    value={data.serviceType}
                    onChange={e => setData(prev => ({ ...prev, serviceType: e.target.value, provider: '', paymentUrl: '' }))}
                  >
                    <option value="">Selecciona...</option>
                    {/* Add Multi-Service Proposal */}
                    <option value="multi" className="font-bold text-emerald-600">★ Factura Integrada (EPM, etc)</option>
                    {Object.entries(PUBLIC_SERVICES).map(([key, svc]) => (
                      <option key={key} value={key}>{svc.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Empresa</label>
                  <select
                    className="w-full border-gray-200 bg-white rounded-xl py-2 px-3 focus:ring-2 focus:ring-yellow-500 outline-none font-medium text-sm"
                    value={data.provider}
                    disabled={!data.serviceType}
                    onChange={e => {
                      // Handle Multi-Service or standard
                      const providers = data.serviceType === 'multi'
                        ? [{ name: "EPM (Agua/Luz/Gas)", url: "https://www.epm.com.co/clientesyusuarios/" }, { name: "Emcali", url: "https://www.emcali.com.co/" }]
                        : PUBLIC_SERVICES[data.serviceType]?.providers;

                      const selectedProvider = providers?.find(p => p.name === e.target.value);
                      setData(prev => ({ ...prev, provider: e.target.value, paymentUrl: selectedProvider?.url || '' }));
                    }}
                  >
                    <option value="">Selecciona...</option>
                    {data.serviceType === 'multi' && (
                      <>
                        <option value="EPM (Agua/Luz/Gas)">EPM (Agua/Luz/Gas)</option>
                        <option value="Emcali">Emcali (Multi-servicios)</option>
                      </>
                    )}
                    {data.serviceType && data.serviceType !== 'multi' && PUBLIC_SERVICES[data.serviceType].providers.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Fecha Límite</label>
              <input type="date" className="w-full border-gray-200 bg-gray-50 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none font-medium transition text-gray-600" value={data.dueDate} onChange={e => setData({ ...data, dueDate: e.target.value })} />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Responsable</label>
              <select className="w-full border-gray-200 bg-gray-50 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none font-medium appearance-none transition" value={data.responsibleId} onChange={e => setData({ ...data, responsibleId: e.target.value })}>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          {/* Link de Pago */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Link de Pago Digital</label>
            <div className="relative">
              <Globe className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input type="url" className="w-full border-gray-200 bg-gray-50 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 outline-none font-medium transition text-gray-600" placeholder="https://portal.pagos.com" value={data.paymentUrl} onChange={e => setData({ ...data, paymentUrl: e.target.value })} />
            </div>
          </div>

          {/* Recurrence Block */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-sm text-gray-700">Gasto Recurrente</span>
                {data.isRecurring && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${data.recurrenceType === 'variable' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                    {data.recurrenceType === 'variable' ? 'Variable' : 'Fijo'}
                  </span>
                )}
              </div>
              <input type="checkbox" className="w-5 h-5 accent-emerald-600" checked={data.isRecurring} onChange={e => setData({ ...data, isRecurring: e.target.checked })} />
            </div>

            {data.isRecurring && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                  <button onClick={() => setData({ ...data, recurrenceType: 'fixed' })} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${data.recurrenceType === 'fixed' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-400'}`}>= Valor Fijo</button>
                  <button onClick={() => setData({ ...data, recurrenceType: 'variable' })} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${data.recurrenceType === 'variable' ? 'bg-yellow-50 text-yellow-700 shadow-sm' : 'text-gray-400'}`}>≈ Valor Variable</button>
                </div>

                {/* Bill Arrival Day Logic (US-07) */}
                {data.recurrenceType === 'variable' && (
                  <div className="bg-yellow-50/50 p-3 rounded-lg border border-yellow-100">
                    <label className="text-xs font-bold text-yellow-800 mb-1 block">¿Qué día del mes llega la factura?</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">Día</span>
                      <input
                        type="number" min="1" max="31"
                        className="w-16 border-yellow-200 focus:ring-yellow-500 rounded-lg py-1.5 px-2 text-center font-bold text-gray-800"
                        value={data.billArrivalDay}
                        onChange={e => setData({ ...data, billArrivalDay: e.target.value })}
                      />
                      <span className="text-[10px] text-gray-400">(Te avisaremos para ingresar el valor)</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auto Debit Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
              <span className="text-sm font-medium text-gray-600">Débito Automático</span>
              <input type="checkbox" className="w-5 h-5 accent-emerald-600" checked={data.isAutoDebit} onChange={e => setData({ ...data, isAutoDebit: e.target.checked })} />
            </div>
          </div>

          {/* Submit Button */}
          <button onClick={() => onSave(data)} className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition shadow-xl mt-4 active:scale-95">
            {initialData ? 'Guardar Cambios' : (data.isRecurring && data.recurrenceType === 'variable' && !data.amount ? 'Crear Gasto Variable' : 'Crear Gasto')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};


const MemberEditModal = ({ isOpen, onClose, member, onSave, onDelete }) => {
  const [data, setData] = useState({ name: '', role: 'member', email: '' });

  useEffect(() => {
    if (member) setData({ name: member.name, role: member.role, email: member.email || '' });
  }, [member]);

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Editar Miembro</h3>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
            <input className="w-full border p-2 rounded-lg" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rol</label>
            <select className="w-full border p-2 rounded-lg bg-white" value={data.role} onChange={e => setData({ ...data, role: e.target.value })}>
              <option value="admin">Administrador</option>
              <option value="member">Miembro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Opcional)</label>
            <input type="email" className="w-full border p-2 rounded-lg" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-2 text-gray-500 font-bold">Cancelar</button>
            <button onClick={() => { onSave({ ...member, ...data }); onClose(); }} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FamilyFinanceApp() {
  const [currentView, setCurrentView] = useState('auth');
  const [user, setUser] = useState(null);

  // --- PERSISTENCIA LOCAL (STORAGE) ---
  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('nido_members');
    return saved ? JSON.parse(saved) : []; // Inicia vacío para nuevos usuarios
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('nido_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('nido_settings');
    return saved ? JSON.parse(saved) : { country: 'CO' };
  });

  // Guardar cambios automáticamente
  useEffect(() => { localStorage.setItem('nido_members', JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem('nido_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('nido_settings', JSON.stringify(settings)); }, [settings]);

  // --- PERSISTENCIA DE SESIÓN Y ENRUTAMIENTO (Fix 1 & 2) ---
  useEffect(() => {
    // 1. Verificar Sesión de Supabase al inicio
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Restaurar usuario desde metadatos o buscar en miembros locales
        const email = session.user.email;
        const localMember = members.find(m => m.email === email);
        if (localMember) {
          // Auto-Correct Name on Session Restore
          const metaName = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
          if (metaName && (localMember.name === 'Nuevo Usuario' || localMember.name === 'Usuario')) {
            localMember.name = metaName;
            setMembers(prev => prev.map(m => m.id === localMember.id ? localMember : m));
          }
          setUser(localMember);
        } else {
          // Fallback: crear y agregar a members
          const metadata = session.user.user_metadata || {};
          const newUser = {
            id: Date.now(),
            name: metadata.full_name || metadata.name || 'Usuario',
            email: email,
            role: 'admin',
            avatar: '😊',
            cards: [],
            loans: []
          };
          setMembers(prev => {
            if (prev.find(m => m.email === email)) return prev;
            return [...prev, newUser];
          });
          setUser(newUser);
        }

        // Cargar vista desde hash o ir a dashboard
        const hash = window.location.hash.replace('#', '');
        if (hash && ['dashboard', 'expenses', 'incomes', 'debts', 'family', 'settings'].includes(hash)) {
          setCurrentView(hash);
        } else {
          setCurrentView('dashboard');
        }
      } else {
        // Si no hay sesión, quedarse en auth
        setCurrentView('auth');
      }
    };

    checkSession();

    // Listener para cambios de Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setCurrentView('auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Ejecutar solo al montar

  // 2. Sincronizar URL con Vista
  useEffect(() => {
    if (currentView !== 'auth' && currentView !== 'onboarding') {
      window.location.hash = currentView;
    }
  }, [currentView]);


  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'otros', dueDate: '', responsibleId: 1, isRecurring: false, isAutoDebit: false });
  const [editingMember, setEditingMember] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showCurrencySelect, setShowCurrencySelect] = useState(false);
  const [showStatusSelect, setShowStatusSelect] = useState(false);
  const [profileSelectStatus, setProfileSelectStatus] = useState(null); // 'single', 'couple', 'family'

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: () => { } });

  const activeCurrencySymbol = COUNTRIES.find(c => c.code === settings.country)?.currency === 'COP' ? '$' :
    COUNTRIES.find(c => c.code === settings.country)?.currency || '$';

  // --- HANDLERS ---
  const handleLoginSuccess = (authUser) => {
    // Buscar si el usuario ya existe en los datos locales por email
    let member = members.find(m => m.email === authUser.email);

    if (!member) {
      // Si no existe (ej: primer login en este dispositivo tras confirmar correo), crearlo
      const metadata = authUser.user_metadata || {};
      member = {
        id: Date.now(),
        name: metadata.full_name || 'Nuevo Usuario',
        email: authUser.email,
        role: 'admin',
        incomes: [],
        avatar: '😊',
        cards: [],
        loans: []
      };
      setMembers(prev => [...prev, member]);
    }

    // Auto-Correct Name: If local name is placeholder but metadata has real name, update it.
    const metaName = authUser.user_metadata?.full_name;
    if (member && metaName && (member.name === 'Nuevo Usuario' || member.name === 'Usuario')) {
      member = { ...member, name: metaName };
      setMembers(prev => prev.map(m => m.id === member.id ? member : m));
    }

    setUser(member);
    setCurrentView('dashboard');
  };

  const handleRegisterSuccess = (formData) => {
    // Este handler se llama si el registro es exitoso Y retorna sesión inmediatamente (ej: auto-confirm OFF)
    // O si decidimos manejarlo así.
    const newMember = { id: Date.now(), name: formData.name, email: formData.email, role: 'admin', incomes: [], avatar: '😊', cards: [], loans: [] };
    setMembers(prev => [...prev, newMember]);
    setUser(newMember);
    setSettings(prev => ({ ...prev, country: formData.country.code }));
    setCurrentView('onboarding');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('nido_user'); // Legacy
    localStorage.removeItem('nido_settings');
    // NOTE: We do NOT clear 'nido_members' or 'nido_expenses' to allow offline access or multi-user device sharing without data loss, 
    // BUT for the requested bug fix (ghost data), we will force clear if it's causing issues.
    // User requested: "todo el usuario se había eliminado... pero hay gasto pendiente".
    // Better strategy: Clear specific session keys but keep data if we want offline. 
    // Given the bug report implies data leaking between users -> FORCE CLEAR EVERYTHING.
    localStorage.clear();
    setUser(null);
    setCurrentView('auth');
    setMembers([]); // Reset state
    setExpenses([]);
  };

  const addExpense = (expenseData) => {
    setExpenses(prev => [...prev, {
      ...expenseData,
      amount: Number(expenseData.amount) || 0, // Ensure Number
      responsibleId: Number(expenseData.responsibleId) || 0, // Ensure Number
      id: Date.now() + Math.random(), // Unique ID
      status: 'pending'
    }]);
    setIsAddModalOpen(false);
  };

  const editExpense = (updatedExpense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? { ...e, ...updatedExpense } : e));
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const toggleStatus = (id) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: e.status === 'paid' ? 'pending' : 'paid' } : e));
  };

  const handleBatchUpdate = (updates, newExpenses) => {
    // Actualizar montos de gastos existentes
    if (updates.length > 0) {
      setExpenses(prev => prev.map(e => {
        const update = updates.find(u => u.id === e.id);
        return update ? { ...e, amount: update.amount } : e;
      }));
    }
    // Agregar nuevos gastos (pagos de tarjeta)
    if (newExpenses.length > 0) {
      setExpenses(prev => [...prev, ...newExpenses.map(e => ({ ...e, id: Date.now() + Math.random() }))]);
    }
  };

  const triggerConfirm = (message, onConfirm) => {
    setConfirmDialog({ isOpen: true, message, onConfirm });
  };

  // --- STATS ---
  const totalIncome = members.reduce((acc, m) => acc + (m.incomes?.reduce((sum, inc) => sum + inc.amount, 0) || 0), 0);
  const totalExpensesVal = expenses.reduce((acc, e) => acc + e.amount, 0);

  const categoryStats = useMemo(() => {
    return Object.entries(CATEGORIES).map(([key, val]) => {
      const amount = expenses.filter(e => e.category === key).reduce((acc, e) => acc + e.amount, 0);
      return { key, label: val.label, amount, color: val.color, percent: totalExpensesVal > 0 ? (amount / totalExpensesVal) * 100 : 0 };
    }).sort((a, b) => b.amount - a.amount);
  }, [expenses, totalExpensesVal]);


  // --- RENDER CONTENT ---
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <>
            <style>{styles}</style>
            <DashboardView
              totalIncome={totalIncome}
              totalExpenses={totalExpensesVal}
              categoryStats={categoryStats}
              expenses={expenses}
              members={members}
              toggleStatus={toggleStatus}
              deleteExpense={deleteExpense}
              currency={activeCurrencySymbol}
              categoryData={CATEGORIES}
              triggerConfirm={triggerConfirm}
              onOpenUpdateModal={() => setShowUpdateModal(true)}
            />
          </>
        );
      case 'expenses':
        return <ExpensesView
          expenses={expenses}
          members={members}
          toggleStatus={toggleStatus}

          deleteExpense={deleteExpense}
          editExpense={editExpense}
          currency={activeCurrencySymbol}
          categories={CATEGORIES}
          triggerConfirm={triggerConfirm}
          triggerAdd={() => setIsAddModalOpen(true)}
          addExpense={addExpense}
          isAdding={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />;
      case 'incomes':
        return <IncomeView
          members={members}
          updateMembers={setMembers}
          currency={activeCurrencySymbol}
          triggerCurrencyModal={() => setShowCurrencySelect(true)}
          isAdding={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          triggerConfirm={triggerConfirm}
          onOpenAdd={() => setIsAddModalOpen(true)}
        />;
      case 'debts':
        return <DebtsView
          members={members}
          updateMembers={setMembers}
          currency={activeCurrencySymbol}
          isAdding={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          settings={settings}
          addExpense={addExpense}
          triggerConfirm={triggerConfirm}
          onOpenAdd={() => setIsAddModalOpen(true)}
        />;
      case 'family':
        return <FamilyView members={members} updateMembers={setMembers} triggerConfirm={triggerConfirm} />;
      case 'settings':
        return (
          <div className="space-y-4 animate-fade-in pb-20">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Menú Principal</h2>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setCurrentView('family')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 transition">
                <div className="bg-emerald-100 p-3 rounded-full text-emerald-600"><Users className="w-8 h-8" /></div>
                <span className="font-bold text-gray-800">Familia</span>
              </button>
              <button onClick={() => setCurrentView('debts')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 transition">
                <div className="bg-red-100 p-3 rounded-full text-red-600"><Landmark className="w-8 h-8" /></div>
                <span className="font-bold text-gray-800">Deudas</span>
              </button>
              <button onClick={() => setShowCurrencySelect(true)} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 transition">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Globe className="w-8 h-8" /></div>
                <span className="font-bold text-gray-800">Moneda</span>
              </button>
              <button onClick={() => setCurrentView('real_settings')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 transition">
                <div className="bg-gray-100 p-3 rounded-full text-gray-600"><Settings className="w-8 h-8" /></div>
                <span className="font-bold text-gray-800">Ajustes</span>
              </button>
            </div>
            <p className="text-center text-gray-300 text-[10px] mt-6">Nido App v5.9.0</p>
          </div>
        );
      case 'real_settings':
        return <SettingsView settings={settings} setSettings={setSettings} onLogout={handleLogout} />;
      default: return null;
    }
  };

  // Views that don't need the shell
  if (currentView === 'auth') return <AuthScreen onLogin={handleLoginSuccess} onRegister={handleRegisterSuccess} />;
  if (currentView === 'onboarding') return <OnboardingScreen onComplete={() => { setShowTutorial(true); setCurrentView('dashboard'); }} />;

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-900 pb-24 md:pb-0 md:pl-64">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 p-6 z-50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Feather className="w-6 h-6" /></div>
          <h1 className="text-2xl font-bold text-emerald-900 tracking-tight">Nido</h1>
        </div>
        <nav className="space-y-2 flex-1">
          <NavButton variant="sidebar" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={Home} label="Inicio" />
          <NavButton variant="sidebar" active={currentView === 'expenses'} onClick={() => setCurrentView('expenses')} icon={PieChart} label="Gastos" />
          <NavButton variant="sidebar" active={currentView === 'incomes'} onClick={() => setCurrentView('incomes')} icon={TrendingUp} label="Ingresos" />
          <NavButton variant="sidebar" active={currentView === 'debts'} onClick={() => setCurrentView('debts')} icon={Landmark} label="Deudas" />
          <NavButton variant="sidebar" active={currentView === 'family'} onClick={() => setCurrentView('family')} icon={Users} label="Familia" />
          <div className="pt-4 mt-4 border-t border-gray-100">
            <NavButton variant="sidebar" active={currentView === 'real_settings'} onClick={() => setCurrentView('real_settings')} icon={Settings} label="Configuración" />
          </div>
        </nav>
        <div className="mt-auto bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border shadow-sm text-lg">{user?.avatar}</div>
          <div className="overflow-hidden">
            <p className="font-bold text-sm truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role === 'admin' ? 'Administrador' : 'Miembro'}</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">v5.7.3</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header & Nav */}
      <header className="md:hidden flex justify-between items-center p-4 bg-white sticky top-0 z-40 border-b border-gray-50/50 backdrop-blur-md bg-white/80">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Hola, {(user?.name || user?.email || 'Usuario').split(' ')[0]} <span className="text-[10px] text-emerald-600 font-bold ml-1 border px-1 rounded bg-emerald-50 border-emerald-100">v5.7.3</span>
          </h1>
          <p className="text-xs text-gray-500 font-medium">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button onClick={() => setCurrentView('real_settings')} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-lg border border-gray-200 shadow-sm active:scale-95 transition">
          {user?.avatar}
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {renderContent()}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <NavButton active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={Home} label="Inicio" />
        <NavButton active={currentView === 'expenses'} onClick={() => setCurrentView('expenses')} icon={PieChart} label="Gastos" />

        <div className="relative -top-6">
          <button
            onClick={() => {
              if (currentView === 'debts') setIsAddModalOpen(true);
              else {
                setIsAddModalOpen(true);
                // Default to expenses view if adding
                if (currentView !== 'debts' && currentView !== 'incomes') setCurrentView('expenses');
              }
            }}
            className="bg-emerald-900 text-white w-14 h-14 rounded-full shadow-emerald-900/40 shadow-xl hover:bg-black transition transform active:scale-95 flex items-center justify-center border-4 border-gray-50"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        <NavButton active={currentView === 'incomes'} onClick={() => setCurrentView('incomes')} icon={TrendingUp} label="Ingresos" />
        <NavButton active={['settings', 'family', 'debts', 'real_settings'].includes(currentView)} onClick={() => setCurrentView('settings')} icon={Settings} label="Menú" />
      </div>

      {/* AddExpenseModal is now handled locally in ExpensesView */}
      <MemberEditModal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        member={editingMember}
        onSave={(u) => { setMembers(prev => prev.map(m => m.id === u.id ? u : m)); setEditingMember(null); }}
      />
      <MonthlyValuesModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        expenses={expenses}
        members={members}
        onBatchUpdate={handleBatchUpdate}
        currency={activeCurrencySymbol}
      />
      {showCurrencySelect && <CurrencySelectionModal onClose={() => setShowCurrencySelect(false)} onSelect={(code) => { setSettings({ ...settings, country: COUNTRIES.find(c => c.currency === code)?.code || settings.country }); setShowCurrencySelect(false); }} />}
      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}

