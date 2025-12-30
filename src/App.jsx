
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import {
  Plus, Home, Users, PieChart, Camera, CreditCard, CheckCircle,
  AlertCircle, Trash2, Settings, DollarSign, Zap, Tv, Shield,
  X, Calendar, Feather, Bell, LogOut, Repeat, Wallet, Landmark,
  ArrowRight, Globe, Lock, Mail, User, Check, ChevronRight, Phone, ArrowLeft,
  MousePointerClick, Eye, EyeOff, Heart, Briefcase, GraduationCap, TrendingUp,
  CreditCard as CardIcon, Bug, ExternalLink, CalendarDays, CheckSquare, Percent,
  Waves, Equal, BellRing, Building2, UserCircle, Pencil, Banknote, Sparkles, Loader2, AlertTriangle, ListChecks
} from 'lucide-react';
import { supabase } from './supabaseClient';

// --- CONFIGURACIÓN API ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

// --- ESTILOS CSS INYECTADOS (Mantener igual) ---
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
  if (!apiKey) return "Configura tu API Key en .env";
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
  MX: ['BBVA México', 'Banamex', 'Santander', 'Banorte', 'HSBC', 'Scotiabank', 'Inbursa', 'Banco Azteca'],
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

const CATEGORIES = {
  vivienda: { icon: Home, color: 'bg-blue-100 text-blue-600', label: 'Vivienda', defaultRecurrence: { isRecurring: true, type: 'fixed' } },
  servicios: { icon: Zap, color: 'bg-yellow-100 text-yellow-600', label: 'Servicios', defaultRecurrence: { isRecurring: true, type: 'variable' } },
  streaming: { icon: Tv, color: 'bg-purple-100 text-purple-600', label: 'Streaming', defaultRecurrence: { isRecurring: true, type: 'fixed' } },
  seguros: { icon: Shield, color: 'bg-green-100 text-green-600', label: 'Seguros', defaultRecurrence: { isRecurring: true, type: 'fixed' } },
  ia: { icon: Briefcase, color: 'bg-indigo-100 text-indigo-600', label: 'Educación/IA', defaultRecurrence: { isRecurring: true, type: 'fixed' } },
  deudas: { icon: Landmark, color: 'bg-red-100 text-red-600', label: 'Deudas', defaultRecurrence: { isRecurring: true, type: 'fixed' } },
  otros: { icon: AlertCircle, color: 'bg-gray-100 text-gray-600', label: 'Otros', defaultRecurrence: { isRecurring: false, type: 'fixed' } }
};

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
            <button onClick={onCancel} className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition">Cancelar</button>
            <button onClick={() => { onConfirm(); onCancel(); }} className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition">Eliminar</button>
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

  const handleUpdateChange = (id, val) => setUpdates(prev => ({ ...prev, [id]: val }));
  const handleCardPaymentChange = (cardId, val) => setCardPayments(prev => ({ ...prev, [cardId]: val }));

  const handleSave = () => {
    const expensesToUpdate = [];
    const newExpenses = [];
    Object.keys(updates).forEach(id => {
      const val = parseFloat(parseCurrencyInput(updates[id]));
      if (val > 0) expensesToUpdate.push({ id: id, amount: val }); // Mantener ID original (UUID o Num)
    });
    Object.keys(cardPayments).forEach(cardId => {
      const val = parseFloat(parseCurrencyInput(cardPayments[cardId]));
      const card = creditCards.find(c => c.id.toString() === cardId.toString());
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
          <div className="text-center py-8 text-gray-500"><CheckSquare className="w-12 h-12 mx-auto mb-3 text-emerald-200" /><p>¡Todo al día! No hay servicios variables pendientes ni tarjetas registradas.</p></div>
        )}
        {variableExpenses.length > 0 && (
          <div className="mb-6"><h4 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center"><Zap className="w-4 h-4 mr-1" /> Servicios Variables (Llegada Reciente)</h4><div className="space-y-3">{variableExpenses.map(exp => (<div key={exp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"><div><p className="font-bold text-gray-800 text-sm">{exp.title}</p><p className="text-xs text-gray-500">Estimado: {currency} {formatCurrencyInput(exp.amount)}</p></div><div className="w-32"><input type="text" className="w-full border p-2 rounded-lg text-right font-bold text-emerald-700 bg-white" placeholder="Valor Real" value={formatCurrencyInput(updates[exp.id] !== undefined ? updates[exp.id] : '')} onChange={(e) => handleUpdateChange(exp.id, e.target.value)} /></div></div>))}</div></div>
        )}
        {creditCards.length > 0 && (
          <div className="mb-6"><h4 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center"><CreditCard className="w-4 h-4 mr-1" /> Cuotas de Tarjetas de Crédito</h4><div className="space-y-3">{creditCards.map(card => (<div key={card.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"><div><p className="font-bold text-gray-800 text-sm">{card.name} (**{card.last4})</p><p className="text-xs text-gray-500">{card.ownerName}</p></div><div className="w-32"><input type="text" className="w-full border p-2 rounded-lg text-right font-bold text-indigo-700 bg-white" placeholder="Pagar..." value={formatCurrencyInput(cardPayments[card.id] !== undefined ? cardPayments[card.id] : '')} onChange={(e) => handleCardPaymentChange(card.id, e.target.value)} /></div></div>))}</div></div>
        )}
        {hasItems && (<button onClick={handleSave} className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg mt-2">Guardar Valores</button>)}
      </div>
    </div>, document.body
  );
};

const NavButton = ({ active, onClick, icon: Icon, label, variant = 'bottom' }) => {
  if (variant === 'sidebar') return <button onClick={onClick} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><Icon className={`w-5 h-5 mr-3 ${active ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'}`} /><span className="text-sm">{label}</span>{active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}</button>;
  return <button onClick={onClick} className={`flex flex-col items-center justify-center space-y-1 transition-colors w-full h-full ${active ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}><Icon className="w-5 h-5" /><span className="text-[10px] font-medium">{label}</span></button>;
};

const LoaderScreen = () => (<div className="bg-emerald-50 min-h-screen flex flex-col items-center justify-center animate-fade-in fixed inset-0 z-[60]"><div className="animate-bounce"><div className="w-24 h-24 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-2xl rotate-3 mb-6"><Feather className="w-12 h-12" /></div></div><h1 className="text-4xl font-bold text-emerald-900 tracking-tight animate-pulse">Nido</h1><p className="text-emerald-600 mt-2 font-medium">Preparando tus finanzas...</p></div>);
const CurrencySelectionModal = ({ onClose, onSelect }) => (<div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-slide-up"><div className="text-center mb-6"><div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3"><Globe className="w-6 h-6 text-emerald-600" /></div><h3 className="text-lg font-bold text-gray-900">Selecciona tu Moneda</h3><p className="text-sm text-gray-500">Esto definirá cómo ves todos tus valores.</p></div><div className="space-y-3">{CURRENCIES.map(curr => (<button key={curr.code} onClick={() => onSelect(curr.code)} className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition"><span className="font-medium text-gray-800">{curr.label}</span><span className="text-gray-400 font-mono">{curr.code}</span></button>))}</div><button onClick={() => onClose()} className="mt-4 w-full text-gray-400 text-sm py-2">Cancelar</button></div></div>);
const StatusSelectionScreen = ({ onSelect }) => (<div className="fixed inset-0 z-[60] bg-white flex flex-col p-6 animate-fade-in w-full h-full"><div className="max-w-md mx-auto w-full mt-12 mb-8 text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2">Estado Familiar</h2><p className="text-gray-500">Cuéntanos cómo está conformado tu hogar.</p></div><div className="space-y-4 max-w-md mx-auto w-full">{FAMILY_STATUSES.map(status => { const IconComponent = status.Icon; return (<button key={status.id} onClick={() => onSelect(status.id)} className="w-full flex items-center p-4 bg-gray-50 border-2 border-transparent rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition active:scale-95 text-left group"><div className="bg-white p-3 rounded-xl shadow-sm mr-4 group-hover:scale-110 transition"><IconComponent className={`w-8 h-8 ${status.color}`} /></div><div><span className="block font-bold text-gray-900 text-lg">{status.label}</span><span className="text-xs text-gray-500">{status.description}</span></div><ChevronRight className="w-5 h-5 text-gray-300 ml-auto group-hover:text-emerald-500" /></button>); })}</div></div>);
const ProfileSelectionScreen = ({ status, onSelect }) => { const profiles = ROLES_BY_STATUS[status] || ROLES_BY_STATUS.family; return (<div className="fixed inset-0 z-[60] bg-white flex flex-col p-6 animate-fade-in w-full h-full"><div className="max-w-md mx-auto w-full mt-12 mb-6"><h2 className="text-3xl font-bold text-gray-900 mb-2">¿Cuál es tu rol?</h2><p className="text-gray-500">Selecciona quién eres.</p></div><div className="grid grid-cols-2 gap-4 overflow-y-auto pb-4 custom-scrollbar max-w-md mx-auto w-full">{profiles.map(profile => (<button key={profile.id} onClick={() => onSelect(profile)} className="flex flex-col items-center justify-center p-6 bg-gray-50 border-2 border-transparent rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition active:scale-95"><span className="text-4xl mb-3">{profile.icon}</span><span className="font-bold text-gray-800">{profile.label}</span></button>))}</div></div>); };
const TutorialOverlay = ({ onClose }) => { const [step, setStep] = useState(1); const handleNext = () => { if (step === 2) { onClose(); } else { setStep(step + 1); } }; return (<div className="fixed inset-0 z-[60] overflow-hidden"><div className="absolute inset-0 bg-gray-900/85 animate-fade-in" />{step === 1 && (<div className="absolute inset-0"><div className="absolute bottom-24 right-6 w-16 h-16 rounded-full border-4 border-emerald-400/80 animate-pulse-ring pointer-events-none z-50 md:hidden" /><div className="absolute bottom-48 right-6 bg-white p-5 rounded-2xl max-w-[280px] shadow-2xl animate-slide-up z-50 md:bottom-24 md:left-24 md:right-auto"><div className="absolute -bottom-2 right-8 w-4 h-4 bg-white transform rotate-45 md:left-8 md:rotate-45" /><div className="flex items-start gap-3"><div className="bg-emerald-100 p-2.5 rounded-xl shrink-0"><Camera className="w-6 h-6 text-emerald-600" /></div><div><h3 className="font-bold text-gray-900 mb-1 text-lg">Agrega Facturas</h3><p className="text-sm text-gray-600 leading-relaxed">Toca el botón + para escanear una factura con IA o ingresarla manualmente.</p></div></div><button onClick={handleNext} className="mt-5 w-full bg-emerald-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-black transition shadow-md">Siguiente</button></div></div>)}{step === 2 && (<div className="absolute inset-0"><div className="absolute bottom-2 right-6 w-16 h-16 rounded-full border-4 border-indigo-400/80 animate-pulse-ring pointer-events-none z-50 md:hidden" /><div className="absolute bottom-24 right-6 bg-white p-5 rounded-2xl max-w-[300px] shadow-2xl animate-slide-up z-50 md:top-24 md:left-72 md:right-auto md:bottom-auto"><div className="absolute -bottom-2 right-12 w-4 h-4 bg-white transform rotate-45 md:top-8 md:-left-2 md:rotate-45" /><div className="flex items-start gap-3"><div className="bg-indigo-100 p-2.5 rounded-xl shrink-0"><Users className="w-6 h-6 text-indigo-600" /></div><div><h3 className="font-bold text-gray-900 mb-1 text-lg">Tu Grupo Familiar</h3><p className="text-sm text-gray-600 leading-relaxed">Gestiona tu Nido. Ahora con secciones dedicadas a <strong>Ingresos</strong> y <strong>Deudas</strong>, todo sincronizado en la nube.</p></div></div><button onClick={handleNext} className="mt-5 w-full bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition shadow-md">¡Entendido!</button></div></div>)}</div>); };

const AuthScreen = ({ onLogin, onRegister }) => {
  const [authView, setAuthView] = useState('landing');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', country: COUNTRIES[0] });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = () => {
    const l = formData.password.length;
    if (l === 0) return 0;
    if (l < 8) return 1;
    if (l < 12) return 2;
    return 3;
  };
  const strength = getPasswordStrength();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) return alert("La contraseña debe tener al menos 6 caracteres");
    if (formData.password !== formData.confirmPassword) return alert("Las contraseñas no coinciden");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name: formData.name,
          phone: formData.phone,
          country: formData.country.code
        }
      }
    });

    setLoading(false);
    if (error) {
      alert("Error al crear cuenta: " + error.message);
    } else if (data && !data.session) {
      // Caso: Usuario creado pero requiere confirmación de email
      alert("¡Cuenta creada! Revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.");
      setAuthView('login');
    } else {
      // Caso: Usuario creado y logueado (si email confirm está desactivado)
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
    if (error) alert("Error de inicio de sesión: " + error.message);
    else onLogin();
  };

  if (authView === 'landing') return (<div className="bg-emerald-50 min-h-screen flex flex-col items-center justify-center p-6 w-full animate-fade-in relative"><div className="flex-1 flex flex-col items-center justify-center"><div className="w-24 h-24 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-2xl rotate-3 mb-8"><Feather className="w-12 h-12" /></div><h1 className="text-4xl font-bold text-emerald-900 mb-2 tracking-tight">Nido</h1><p className="text-emerald-700/80 text-lg text-center max-w-xs">Organiza, planifica y crece junto a tu familia.</p></div><div className="w-full max-w-md space-y-4 pb-10"><button onClick={() => setAuthView('register')} className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition shadow-xl transform hover:scale-[1.02] active:scale-95">Crear Cuenta Nueva</button><button onClick={() => setAuthView('login')} className="w-full bg-white text-emerald-900 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition shadow-sm border border-emerald-100">Ya tengo una cuenta</button></div></div>);

  if (authView === 'register') return (
    <div className="bg-white min-h-screen flex flex-col p-6 w-full animate-slide-up overflow-y-auto">
      <div className="max-w-md mx-auto w-full">
        <div className="mb-4 pt-4"><button onClick={() => setAuthView('landing')} className="text-gray-400 hover:text-gray-900 transition flex items-center"><ArrowLeft className="w-6 h-6 mr-1" /> Atrás</button></div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Crea tu cuenta</h2>
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nombre</label><input type="text" required className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3 pl-3 focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="Ej. Papá Oso" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
          <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email</label><input type="email" required className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3 pl-3 focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="tu@email.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Contraseña</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3 pl-3 pr-10 focus:ring-2 focus:ring-emerald-500 outline-none transition" placeholder="********" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
            </div>
            {formData.password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex space-x-1 h-1">
                  <div className={`flex-1 rounded-full transition-colors ${strength >= 1 ? 'bg-red-500' : 'bg-gray-200'}`} />
                  <div className={`flex-1 rounded-full transition-colors ${strength >= 2 ? 'bg-yellow-500' : 'bg-gray-200'}`} />
                  <div className={`flex-1 rounded-full transition-colors ${strength >= 3 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                </div>
                <p className="text-xs text-gray-400 text-right">{strength === 1 ? 'Débil' : strength === 2 ? 'Media' : 'Fuerte'}</p>
              </div>
            )}
          </div>

          <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Confirmar</label><input type="password" required className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3 pl-3" placeholder="********" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} /></div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg mt-4">{loading ? 'Creando...' : 'Continuar'}</button>
        </form>
      </div>
    </div>
  );

  if (authView === 'login') return (<div className="bg-white min-h-screen flex flex-col p-6 w-full animate-slide-up"><div className="max-w-md mx-auto w-full"><div className="mb-6 pt-4"><button onClick={() => setAuthView('landing')} className="text-gray-400 hover:text-gray-900 transition flex items-center"><ArrowLeft className="w-6 h-6 mr-1" /> Atrás</button></div><h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h2><form onSubmit={handleLoginSubmit} className="space-y-5"><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email</label><input type="email" required className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3 pl-3" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Contraseña</label><input type="password" required className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3 pl-3" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} /></div><button type="submit" disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg mt-4">{loading ? 'Iniciando...' : 'Iniciar Sesión'}</button></form></div></div>);
};

const OnboardingScreen = ({ onComplete }) => { const [step, setStep] = useState(0); const handleNext = () => (step < ONBOARDING_STEPS.length - 1 ? setStep(step + 1) : onComplete()); return (<div className="bg-white min-h-screen flex flex-col items-center p-6 w-full animate-fade-in relative"><div className="w-full max-w-md flex justify-end pt-8 pb-4"><button onClick={onComplete} className="text-gray-400 text-sm font-medium hover:text-emerald-600">Saltar</button></div><div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-md"><div key={step} className="animate-slide-up flex flex-col items-center"><div className={`w-40 h-40 rounded-full ${ONBOARDING_STEPS[step].bg} flex items-center justify-center mb-8 shadow-sm`}>{ONBOARDING_STEPS[step].icon}</div><h2 className="text-2xl font-bold text-gray-900 mb-4">{ONBOARDING_STEPS[step].title}</h2><p className="text-gray-500 leading-relaxed px-4">{ONBOARDING_STEPS[step].description}</p></div></div><div className="w-full max-w-md pb-10"><button onClick={handleNext} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg">{step === ONBOARDING_STEPS.length - 1 ? 'Comenzar' : 'Siguiente'}</button></div></div>); };

const DashboardView = ({ totalIncome, totalExpenses, categoryStats, expenses, members, toggleStatus, deleteExpense, currency, onOpenUpdateModal }) => {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

  // RF-04: Calculate "Por Pagar" (Only current month)
  const currentMonthExp = expenses.filter(e => {
    const today = new Date();
    const expDate = new Date(e.dueDate);
    return expDate.getMonth() === today.getMonth() && expDate.getFullYear() === today.getFullYear();
  });

  const pendingAmount = currentMonthExp.filter(e => e.status !== 'paid').reduce((acc, e) => acc + e.amount, 0);
  const totalMonthExpenses = currentMonthExp.reduce((acc, e) => acc + e.amount, 0);
  const paymentProgress = totalMonthExpenses > 0 ? ((totalMonthExpenses - pendingAmount) / totalMonthExpenses) * 100 : 0;

  // RF-05: Health Indicator
  const healthRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 100;
  const healthColor = healthRatio < 40 ? 'bg-emerald-500' : healthRatio < 70 ? 'bg-yellow-500' : 'bg-red-500';
  const healthText = healthRatio < 40 ? 'Saludable 🤩' : healthRatio < 70 ? 'Cuidado 😐' : 'Crítico 🚨';

  const handleGenerateAdvice = async () => {
    setLoading(true);
    // RF-06: Enhanced Context for Gemini
    const debtTotal = members.reduce((acc, m) => acc + (m.loans?.reduce((s, l) => s + l.totalValue, 0) || 0), 0);
    const prompt = `Actúa como asesor financiero experto. Datos del mes: 
    - Ingresos: ${totalIncome}
    - Gastos: ${totalExpenses}
    - Deuda Total: ${debtTotal}
    - Ratio Gasto/Ingreso: ${healthRatio.toFixed(1)}%
    
    Dame 1 consejo corto, accionable y motivador de máximo 20 palabras.`;

    const result = await callGeminiAPI(prompt);
    setAdvice(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div><p className="text-emerald-200 text-sm">Por Pagar (Este Mes)</p><h1 className="text-4xl font-extrabold flex items-baseline"><span className="text-2xl mr-1">{currency}</span>{formatCurrencyInput(pendingAmount)}</h1></div>
          <button onClick={onOpenUpdateModal} className="bg-emerald-600/50 hover:bg-emerald-600 text-white p-2.5 rounded-xl"><ListChecks className="w-5 h-5" /></button>
        </div>
        <div className="mt-6"><div className="flex justify-between text-xs text-emerald-200 mb-1"><span>Progreso Pagos</span><span>{Math.round(paymentProgress)}%</span></div><div className="w-full bg-emerald-900/50 rounded-full h-3"><div className="h-full bg-emerald-400 rounded-full" style={{ width: `${paymentProgress}%` }}></div></div></div>
      </div>

      {/* RF-05: Health Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase">Estado Financiero</p>
          <h3 className="text-lg font-bold text-gray-900">{healthText}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-600">{healthRatio.toFixed(0)}% Gastado</span>
          <div className={`w-4 h-4 rounded-full ${healthColor} animate-pulse`}></div>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 shadow-sm flex items-start gap-4">
        <div className="bg-indigo-600 p-2 rounded-full"><Sparkles className="w-5 h-5 text-white" /></div>
        <div className="flex-1"><h3 className="text-indigo-900 font-bold text-sm">Asesor IA</h3><p className="text-indigo-700 text-sm mt-1">{advice || "Obtén consejos inteligentes basados en tu deuda y gastos."}</p>{!advice && <button onClick={handleGenerateAdvice} className="mt-2 text-xs font-bold text-indigo-600 bg-white px-3 py-1.5 rounded border border-indigo-200 shadow-sm">{loading ? 'Analizando...' : 'Analizar'}</button>}</div>
      </div>
      <div className="space-y-3">
        <h3 className="font-bold text-gray-700">Próximos Vencimientos</h3>
        {currentMonthExp.slice(0, 3).map(e => (
          <div key={e.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div><p className="font-bold text-gray-800">{e.title}</p><p className="text-xs text-gray-500">{formatDate(e.dueDate)}</p></div>
            <div className="text-right"><p className="font-bold">{currency} {formatCurrencyInput(e.amount)}</p><span className={`text-[10px] px-2 py-0.5 rounded-full ${e.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{e.status === 'paid' ? 'Pagado' : 'Pendiente'}</span></div>
          </div>
        ))}
        {currentMonthExp.length === 0 && <p className="text-gray-400 text-sm italic">No hay gastos para este mes.</p>}
      </div>
    </div>
  );
};

const IncomeView = ({ members, currency, isAdding, onClose }) => {
  const [newSource, setNewSource] = useState({ memberId: '', source: '', amount: '', isVariable: false });

  // RF-07: Auto-detect variable income based on source
  const handleSourceChange = (val) => {
    const isVar = ["Trabajo Independiente", "Comisiones", "Ventas", "Otro"].some(k => val.includes(k));
    setNewSource(prev => ({ ...prev, source: val, isVariable: isVar }));
  };

  const handleAdd = async () => {
    if (!newSource.memberId || !newSource.amount) return;
    const { error } = await supabase.from('incomes').insert({
      user_id: newSource.memberId,
      source: newSource.source,
      amount: parseFloat(newSource.amount),
      is_variable: newSource.isVariable
    });
    if (error) alert("Error guardando ingreso");
    else onClose();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Ingresos</h2><button onClick={onClose} className="text-emerald-600 font-bold text-sm hidden">Cerrar</button></div>
      <div className="grid gap-4">
        {members.map(m => (
          <div key={m.id} className="bg-white p-4 rounded-xl shadow-sm">
            <div className="font-bold mb-2 flex items-center gap-2">{m.avatar} {m.name}</div>
            <div className="space-y-2">
              {m.incomes?.map(i => (
                <div key={i.id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${i.isVariable ? 'bg-yellow-400' : 'bg-emerald-400'}`}></span>
                    <span>{i.source}</span>
                  </div>
                  <span className="font-bold">{currency} {formatCurrencyInput(i.amount)}</span>
                </div>
              ))}
              {(!m.incomes || m.incomes.length === 0) && <p className="text-gray-400 text-xs italic opacity-70">Sin ingresos registrados</p>}
            </div>
          </div>
        ))}
      </div>

      {/* RF-07: Formulario de Ingreso Mejorado */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up">
            <h3 className="font-bold text-lg mb-4">Nuevo Ingreso</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Miembro</label>
                <select className="w-full border p-3 rounded-xl bg-gray-50" onChange={e => setNewSource({ ...newSource, memberId: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Fuente</label>
                <input type="text" list="income-sources" className="w-full border p-3 rounded-xl" placeholder="Ej. Salario, Freelance..." value={newSource.source} onChange={e => handleSourceChange(e.target.value)} />
                <datalist id="income-sources">
                  <option value="Salario / Nómina" />
                  <option value="Trabajo Independiente" />
                  <option value="Arriendo" />
                  <option value="Pensión" />
                </datalist>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Monto Mensual</label>
                  <input type="number" className="w-full border p-3 rounded-xl" placeholder="0.00" value={newSource.amount} onChange={e => setNewSource({ ...newSource, amount: e.target.value })} />
                </div>
                <div className="flex items-center pt-5">
                  <button type="button" onClick={() => setNewSource(p => ({ ...p, isVariable: !p.isVariable }))} className={`px-4 py-3 rounded-xl text-sm font-bold border transition ${newSource.isVariable ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                    {newSource.isVariable ? 'Variable' : 'Fijo'}
                  </button>
                </div>
              </div>
              <button onClick={handleAdd} className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold shadow-lg">Guardar Ingreso</button>
              <button onClick={onClose} className="w-full py-3 text-gray-500 font-medium">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DebtsView = ({ members, currency }) => {
  const allCards = members.flatMap(m => m.cards?.map(c => ({ ...c, owner: m.name, ownerId: m.id })) || []);
  const allLoans = members.flatMap(m => m.loans?.map(l => ({ ...l, owner: m.name })) || []);
  const [payModal, setPayModal] = useState({ open: false, card: null, amount: '' });

  const handlePayCard = async () => {
    if (!payModal.amount || !payModal.card) return;

    // RF-11: Acción Masiva - Crear gasto vinculado a tarjeta
    const { error } = await supabase.from('expenses').insert({
      title: `Pago Tarjeta ${payModal.card.name}`,
      amount: parseFloat(payModal.amount),
      category: 'deudas',
      due_date: new Date().toISOString().split('T')[0], // Hoy
      responsible_id: payModal.card.ownerId,
      status: 'paid', // Asumimos pago inmediato si es manual
      is_recurring: false
    });

    if (error) alert("Error registrando pago: " + error.message);
    else {
      alert("Pago registrado exitosamente como gasto.");
      setPayModal({ open: false, card: null, amount: '' });
      // Idealmente recargar datos aquí
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <h2 className="text-2xl font-bold">Deudas</h2>

      <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-6">
        <h3 className="font-bold text-red-800 text-lg mb-2">Resumen de Deuda</h3>
        <p className="text-3xl font-bold text-red-900">{currency} {formatCurrencyInput(allLoans.reduce((sum, l) => sum + l.totalValue, 0))}</p>
        <p className="text-sm text-red-600">Total en préstamos pendientes</p>
      </div>

      <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Tarjetas de Crédito</h3>
      <div className="grid gap-3">
        {allCards.length === 0 && <p className="text-gray-400 text-sm">No hay tarjetas registradas.</p>}
        {allCards.map(c => (
          <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-indigo-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setPayModal({ open: true, card: c, amount: '' })} className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full hover:bg-indigo-200">Pagar</button>
            </div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-bold text-lg block">{c.name}</span>
                <span className="text-xs text-gray-400">{c.franchise || 'Visa'} • **** {c.last4}</span>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold">{c.owner}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-2 border-t pt-2">
              <span>Corte: Día {c.cutoff_day || c.cutoffDate || 'N/A'}</span>
              <span className="text-indigo-600 font-bold cursor-pointer" onClick={() => setPayModal({ open: true, card: c, amount: '' })}>Registrar Pago</span>
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-bold text-gray-700 mt-6 flex items-center gap-2"><Landmark className="w-5 h-5" /> Préstamos</h3>
      <div className="grid gap-3">
        {allLoans.length === 0 && <p className="text-gray-400 text-sm">No hay préstamos registrados.</p>}
        {allLoans.map(l => (
          <div key={l.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500">
            <div className="flex justify-between items-center mb-1">
              <div>
                <span className="font-bold text-gray-900 block">{l.entity || 'Banco'} - {l.name}</span>
                <span className="text-xs text-gray-400">{l.loan_type || 'Crédito'} • {l.interest_rate}% {l.rate_type}</span>
              </div>
              <div className="text-right">
                <span className="block font-bold text-red-900">{currency} {formatCurrencyInput(l.totalValue)}</span>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Cuota: {currency} {formatCurrencyInput(l.monthlyPayment)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {payModal.open && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <h3 className="font-bold text-lg mb-2">Registrar Pago de Tarjeta</h3>
            <p className="text-sm text-gray-500 mb-4">Estás pagando la tarjeta <strong>{payModal.card.name}</strong> de {payModal.card.owner}.</p>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Monto a Pagar</label>
            <input type="number" autoFocus className="w-full border p-3 rounded-xl mb-4 font-bold text-lg" placeholder="0.00" value={payModal.amount} onChange={e => setPayModal({ ...payModal, amount: e.target.value })} />
            <div className="flex gap-3">
              <button onClick={() => setPayModal({ open: false, card: null, amount: '' })} className="flex-1 py-3 text-gray-500 font-bold">Cancelar</button>
              <button onClick={handlePayCard} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700">Pagar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FamilyView = ({ members }) => {
  const handleInvite = () => {
    // RF-13: Simulación de invitación por link (MVP)
    const dummyLink = "https://nido-finance.vercel.app/join/familia-xyz";
    navigator.clipboard.writeText(dummyLink);
    alert("Enlace de invitación copiado al portapapeles (Simulado)");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <h2 className="text-2xl font-bold">Mi Familia</h2>
      <div className="grid gap-4">
        {members.map(m => (
          <div key={m.id} className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4 border border-gray-100">
            <div className="text-4xl bg-gray-50 p-3 rounded-full">{m.avatar}</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900">{m.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{m.role}</p>
            </div>
            {m.role === 'admin' && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold">Admin</span>}
          </div>
        ))}
      </div>
      <div className="bg-indigo-50 p-6 rounded-2xl text-center border border-indigo-100">
        <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Users className="w-8 h-8 text-indigo-600" />
        </div>
        <h3 className="font-bold text-indigo-900 text-lg">Invitar Miembro</h3>
        <p className="text-sm text-indigo-700 mb-6 max-w-xs mx-auto">Comparte este enlace con tu pareja o familiares para que se unan a tu Nido.</p>
        <button className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2" onClick={handleInvite}>
          <ExternalLink className="w-5 h-5" /> Copiar Enlace de Invitación
        </button>
      </div>
    </div>
  );
};

const SettingsView = ({ currency }) => {
  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <h2 className="text-2xl font-bold">Configuración</h2>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-lg"><Globe className="w-5 h-5 text-gray-600" /></div>
            <span className="font-bold text-gray-700">Moneda Principal</span>
          </div>
          <span className="font-mono text-gray-400 font-bold">{currency}</span>
        </div>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-lg"><Bell className="w-5 h-5 text-gray-600" /></div>
            <span className="font-bold text-gray-700">Notificaciones</span>
          </div>
          <div className="w-10 h-6 bg-emerald-500 rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div></div>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="w-full p-4 flex items-center text-red-600 hover:bg-red-50 transition font-bold">
          <LogOut className="w-5 h-5 mr-3" /> Cerrar Sesión
        </button>
      </div>
      <p className="text-center text-gray-400 text-xs mt-8">Nido App v1.0.2 Beta</p>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function FamilyFinanceApp() {
  const [currentView, setCurrentView] = useState('loader');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'otros', dueDate: '', responsibleId: '' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentView(session ? 'app' : 'auth');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCurrentView(session ? 'app' : 'auth');
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    if (!session) return;

    // Fetch Profiles & Related Data
    const { data: profilesData } = await supabase.from('profiles').select('*, incomes(*), cards(*), loans(*)');
    if (profilesData) {
      // Map Snake Case from DB to our Frontend structure
      const mappedMembers = profilesData.map(p => ({
        ...p,
        incomes: p.incomes.map(i => ({ ...i, isVariable: i.is_variable })),
        cards: p.cards.map(c => ({ ...c, cutoffDate: c.cutoff_date })),
        loans: p.loans.map(l => ({ ...l, totalValue: l.total_value, monthlyPayment: l.monthly_payment }))
      }));
      setMembers(mappedMembers);
      // Set default responsible ID if not set
      if (!newExpense.responsibleId && mappedMembers.length > 0) {
        setNewExpense(prev => ({ ...prev, responsibleId: mappedMembers[0].id }));
      }
    }

    // Fetch Expenses
    const { data: expensesData } = await supabase.from('expenses').select('*');
    if (expensesData) {
      const mappedExpenses = expensesData.map(e => ({
        ...e,
        dueDate: e.due_date,
        responsibleId: e.responsible_id,
        isRecurring: e.is_recurring,
        recurrenceType: e.recurrence_type,
        billArrivalDay: e.bill_arrival_day,
        isRecurring: e.is_recur_ring,
        isAutoDebit: e.is_auto_debit,
        billArrivalDay: e.bill_arrival_day,
        paymentUrl: e.payment_url
      }));
      setExpenses(mappedExpenses);
    }
  };

  useEffect(() => {
    if (session) {
      fetchData();
      // Realtime subscription could go here
    }
  }, [session, activeTab]); // Refresh on tab change as a simple "refetch" strategy

  const handleAddExpense = async (e) => {
    e.preventDefault();
    // RF-09: Logic for Variable expenses
    const finalAmount = newExpense.recurrenceType === 'variable' ? (parseFloat(newExpense.amount) || 0) : parseFloat(newExpense.amount);

    const { error } = await supabase.from('expenses').insert({
      title: newExpense.title,
      amount: finalAmount,
      category: newExpense.category,
      due_date: newExpense.dueDate,
      responsible_id: newExpense.responsibleId,
      is_recurring: newExpense.isRecurring, // RF-08: Fixed mapping typo
      recurrence_type: newExpense.recurrenceType,
      bill_arrival_day: newExpense.isRecurring && newExpense.recurrenceType === 'variable' ? parseInt(newExpense.billArrivalDay) : null,
      payment_url: newExpense.paymentUrl,
      status: 'pending'
    });

    if (error) {
      console.error(error);
      alert("Error al crear gasto: " + error.message);
    } else {
      setIsAddModalOpen(false);
      // Reset form properly
      setNewExpense({ title: '', amount: '', category: 'otros', dueDate: '', responsibleId: members[0]?.id || '', isRecurring: false, recurrenceType: 'fixed', billArrivalDay: '' });
      fetchData();
    }
  };

  const totalIncome = members.reduce((acc, m) => acc + (m.incomes?.reduce((s, i) => s + i.amount, 0) || 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <>
      <style>{styles}</style>
      {currentView === 'auth' && <AuthScreen onLogin={() => { }} onRegister={() => { }} />}
      {currentView === 'loader' && <LoaderScreen />}
      {currentView === 'app' && (
        <div className="bg-gray-50 min-h-screen font-sans text-gray-900 w-full flex flex-col md:flex-row relative animate-fade-in">
          <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
            <div className="p-6 border-b border-gray-100"><h1 className="text-xl font-bold text-emerald-900">Nido</h1></div>
            <nav className="flex-1 p-4 space-y-2">
              <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={Home} label="Inicio" variant="sidebar" />
              <NavButton active={activeTab === 'income'} onClick={() => setActiveTab('income')} icon={TrendingUp} label="Ingresos" variant="sidebar" />
              <NavButton active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} icon={DollarSign} label="Gastos" variant="sidebar" />
              <NavButton active={activeTab === 'debts'} onClick={() => setActiveTab('debts')} icon={Landmark} label="Deudas" variant="sidebar" />
              <NavButton active={activeTab === 'family'} onClick={() => setActiveTab('family')} icon={Users} label="Familia" variant="sidebar" />
              <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} label="Ajustes" variant="sidebar" />
            </nav>
            <div className="p-4"><button onClick={() => supabase.auth.signOut()} className="flex items-center text-red-600"><LogOut className="w-4 h-4 mr-2" /> Salir</button></div>
          </aside>

          <main className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24 md:pb-6">
            {activeTab === 'dashboard' && <DashboardView totalIncome={totalIncome} totalExpenses={totalExpenses} expenses={expenses} members={members} currency="$" onOpenUpdateModal={() => setIsUpdateModalOpen(true)} />}
            {activeTab === 'income' && <IncomeView members={members} currency="$" isAdding={false} onClose={() => { }} />}
            {activeTab === 'expenses' && (
              <div className="pb-20">
                <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">Gastos</h2><button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 text-white p-2 rounded-full"><Plus /></button></div>
                <div className="grid gap-3">{expenses.map(e => <div key={e.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex justify-between"><span>{e.title}</span><span className="font-bold">${formatCurrencyInput(e.amount)}</span></div>)}</div>
              </div>
            )}
            {activeTab === 'debts' && <DebtsView members={members} currency="$" />}
            {activeTab === 'family' && <FamilyView members={members} />}
            {activeTab === 'settings' && <SettingsView currency="$" />}
          </main>

          <nav className="md:hidden bg-white border-t border-gray-200 h-20 px-2 flex justify-between items-center absolute bottom-0 w-full z-10">
            <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={Home} label="Inicio" />
            <NavButton active={activeTab === 'income'} onClick={() => setActiveTab('income')} icon={TrendingUp} label="Ingresos" />
            <NavButton active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} icon={DollarSign} label="Gastos" />
            <NavButton active={activeTab === 'debts'} onClick={() => setActiveTab('debts')} icon={Landmark} label="Deudas" />
            <NavButton active={activeTab === 'family'} onClick={() => setActiveTab('family')} icon={Users} label="Familia" />
            <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} label="Ajustes" />
          </nav>

          {isAddModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
              <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Nuevo Gasto</h3>
                  <button onClick={() => setIsAddModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
                </div>
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Concepto</label>
                    <input className="w-full border p-3 rounded-xl" placeholder="Ej. Arriendo, Netflix..." value={newExpense.title} onChange={e => setNewExpense({ ...newExpense, title: e.target.value })} required />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Monto</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                        <input type="number" className="w-full border p-3 pl-7 rounded-xl" placeholder="0.00" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} />
                      </div>
                    </div>
                    <div className="w-1/3">
                      <label className="text-xs font-bold text-gray-500 uppercase">Fecha Límite</label>
                      <input type="date" className="w-full border p-3 rounded-xl text-sm" value={newExpense.dueDate} onChange={e => setNewExpense({ ...newExpense, dueDate: e.target.value })} required />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Opciones de Recurrencia (RF-08)</label>
                    <div className="border rounded-xl p-3 space-y-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">¿Es un gasto mensual?</span>
                        <button type="button" onClick={() => setNewExpense(p => ({ ...p, isRecurring: !p.isRecurring }))} className={`w-12 h-6 rounded-full transition-colors relative ${newExpense.isRecurring ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${newExpense.isRecurring ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>

                      {newExpense.isRecurring && (
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                          <button type="button" onClick={() => setNewExpense(p => ({ ...p, recurrenceType: 'fixed' }))} className={`p-2 text-xs font-bold rounded-lg border text-center ${newExpense.recurrenceType === 'fixed' ? 'bg-white border-emerald-500 text-emerald-700 shadow-sm' : 'border-transparent text-gray-400'}`}>
                            Fijo (Mismo Valor)
                          </button>
                          <button type="button" onClick={() => setNewExpense(p => ({ ...p, recurrenceType: 'variable' }))} className={`p-2 text-xs font-bold rounded-lg border text-center ${newExpense.recurrenceType === 'variable' ? 'bg-white border-yellow-500 text-yellow-700 shadow-sm' : 'border-transparent text-gray-400'}`}>
                            Variable (Servicios)
                          </button>
                        </div>
                      )}

                      {newExpense.isRecurring && newExpense.recurrenceType === 'variable' && (
                        <div className="pt-2 animate-fade-in">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Día LLegada Factura</label>
                          <input type="number" min="1" max="31" className="w-full border p-2 rounded-lg text-sm" placeholder="Ej. Día 15" value={newExpense.billArrivalDay || ''} onChange={e => setNewExpense({ ...newExpense, billArrivalDay: e.target.value })} />
                          <p className="text-[10px] text-gray-400 mt-1">Te avisaremos este día para que ingreses el valor real.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Responsable</label>
                      <select className="w-full border p-3 rounded-xl bg-white" value={newExpense.responsibleId} onChange={e => setNewExpense({ ...newExpense, responsibleId: e.target.value })}>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
                      <select className="w-full border p-3 rounded-xl bg-white" value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}>
                        {Object.entries(CATEGORIES).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold shadow-lg text-lg hover:bg-black transition">Crear Gasto</button>
                </form>
              </div>
            </div>
          )}

          {isUpdateModalOpen && <MonthlyValuesModal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} expenses={expenses} members={members} onBatchUpdate={() => { }} currency="$" />}
        </div>
      )}
    </>
  );
}
