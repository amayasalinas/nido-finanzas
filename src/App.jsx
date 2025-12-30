import React, { useState, useEffect, useMemo } from 'react';
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
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-1.5-flash"; // Usamos flash que es rápido y económico

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

const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
};

const getMonthName = () => {
  return new Date().toLocaleDateString('es-ES', { month: 'long' });
};

// --- LLAMADA A GEMINI API ---
const callGeminiAPI = async (prompt) => {
  if (!GEMINI_API_KEY) return "No se encontró la API Key de Gemini. Verifica tu configuración.";
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    if (!response.ok) throw new Error('Error en llamada a Gemini');
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No tengo un consejo ahora.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocurrió un error consultando a mi cerebro digital.";
  }
};

// --- CATALOGOS ---
const BANKS_BY_COUNTRY = {
  CO: ['Bancolombia', 'Davivienda', 'Banco de Bogotá', 'BBVA', 'Nequi', 'Daviplata', 'Nu Colombia'],
  MX: ['BBVA México', 'Banamex', 'Santander', 'Banorte', 'Banco Azteca'],
  US: ['Chase', 'Bank of America', 'Wells Fargo', 'Citibank'],
  ES: ['Banco Santander', 'BBVA', 'CaixaBank', 'Banco Sabadell'],
  AR: ['Banco Galicia', 'Banco Nación', 'Banco Santander Río'],
  CL: ['Banco de Chile', 'Banco Santander', 'BancoEstado'],
  PE: ['BCP', 'BBVA Perú', 'Scotiabank', 'Interbank'],
  EC: ['Banco Pichincha', 'Banco del Pacífico', 'Banco Guayaquil']
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
  { id: 1, title: "Centraliza tus Gastos", description: "Dile adiós al caos de facturas. Ten todo en un solo lugar.", icon: <Home className="w-16 h-16 text-emerald-600" />, bg: "bg-emerald-50" },
  { id: 2, title: "Colaboración Familiar", description: "Involucra a todos. Comparte gastos y transparentea las finanzas.", icon: <Users className="w-16 h-16 text-indigo-600" />, bg: "bg-indigo-50" },
  { id: 3, title: "IA a tu Servicio", description: "Gemini AI analiza tus patrones y te da consejos financieros.", icon: <Zap className="w-16 h-16 text-yellow-600" />, bg: "bg-yellow-50" }
];

const CATEGORIES = {
  vivienda: { icon: Home, color: 'bg-blue-100 text-blue-600', label: 'Vivienda', defaultRecurrence: { isRecurring: true, type: 'fixed' } },
  servicios: { icon: Zap, color: 'bg-yellow-100 text-yellow-600', label: 'Servicios', defaultRecurrence: { isRecurring: true, type: 'variable' } },
  streaming: { icon: Tv, color: 'bg-purple-100 text-purple-600', label: 'Streaming', defaultRecurrence: { isRecurring: true, type: 'fixed' } },
  seguros: { icon: Shield, color: 'bg-green-100 text-green-600', label: 'Seguros', defaultRecurrence: { isRecurring: true, type: 'fixed' } },
  ia: { icon: Briefcase, color: 'bg-indigo-100 text-indigo-600', label: 'Educación/IA', defaultRecurrence: { isRecurring: true, type: 'fixed' } },
  deudas: { icon: Landmark, color: 'bg-red-100 text-red-600', label: 'Deudas', defaultRecurrence: { isRecurring: true, type: 'fixed' } },
  otros: { icon: AlertCircle, color: 'bg-gray-100 text-gray-600', label: 'Otros', defaultRecurrence: { isRecurring: false, type: 'fixed' } }
};

const INCOME_SOURCES = {
  "Empleo / Laboral": ["Salario / Nómina", "Horas Extras", "Bonificaciones", "Prima"],
  "Trabajo Independiente": ["Honorarios", "Ventas", "Freelance"],
  "Rentas y Capital": ["Arriendo", "Rendimientos", "Dividendos"],
  "Otros": ["Regalos", "Venta Activos", "Otro"]
};

// --- COMPONENTES UI (V4.0) ---

const ConfirmationDialog = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl animate-slide-up">
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-100 p-3 rounded-full mb-4"><Trash2 className="w-8 h-8 text-red-600" /></div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">¿Estás seguro?</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <div className="flex gap-3 w-full">
            <button onClick={onCancel} className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">Cancelar</button>
            <button onClick={() => { onConfirm(); onCancel(); }} className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200">Eliminar</button>
          </div>
        </div>
      </div>
    </div>, document.body
  );
};

// MODAL PARA ACTUALIZAR VALORES DEL MES (Batch Update)
const MonthlyValuesModal = ({ isOpen, onClose, expenses, members, onBatchUpdate, currency }) => {
  const [updates, setUpdates] = useState({});
  const [cardPayments, setCardPayments] = useState({});

  const currentMonthDate = new Date();
  const currentMonthIndex = currentMonthDate.getMonth();
  const currentYear = currentMonthDate.getFullYear();

  const variableExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (!e.dueDate) return false;
      const d = new Date(e.dueDate);
      return d.getMonth() === currentMonthIndex && d.getFullYear() === currentYear && e.recurrenceType === 'variable' && e.status !== 'paid';
    });
  }, [expenses, currentMonthIndex, currentYear]);

  // Validamos que 'cards' exista en members
  const creditCards = useMemo(() => {
    return members.flatMap(m => (m.cards || []).map(c => ({ ...c, ownerName: m.name, ownerId: m.id })));
  }, [members]);

  const handleUpdateChange = (id, val) => setUpdates(prev => ({ ...prev, [id]: val }));
  const handleCardPaymentChange = (cardId, val) => setCardPayments(prev => ({ ...prev, [cardId]: val }));

  const handleSave = () => {
    const expensesToUpdate = [];
    const newExpenses = [];

    Object.keys(updates).forEach(id => {
      const val = parseFloat(parseCurrencyInput(updates[id]));
      if (val > 0) expensesToUpdate.push({ id: id, amount: val }); // ID as string usually from Supabase
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
          type: 'bill'
        });
      }
    });

    onBatchUpdate(expensesToUpdate, newExpenses);
    onClose();
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
        {!hasItems && <div className="text-center py-8 text-gray-500"><CheckSquare className="w-12 h-12 mx-auto mb-3 text-emerald-200" /><p>¡Todo al día! No hay pendientes variables ni tarjetas.</p></div>}

        {variableExpenses.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center"><Zap className="w-4 h-4 mr-1" /> Servicios Variables (Llegada Reciente)</h4>
            <div className="space-y-3">
              {variableExpenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div><p className="font-bold text-gray-800 text-sm">{exp.title}</p><p className="text-xs text-gray-500">Estimado: {currency} {formatCurrencyInput(exp.amount)}</p></div>
                  <div className="w-32"><input type="text" className="w-full border p-2 rounded-lg text-right font-bold text-emerald-700 bg-white" placeholder="Valor Real" value={formatCurrencyInput(updates[exp.id] !== undefined ? updates[exp.id] : '')} onChange={(e) => handleUpdateChange(exp.id, e.target.value)} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {creditCards.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center"><CreditCard className="w-4 h-4 mr-1" /> Pagos Tarjetas Crédito</h4>
            <div className="space-y-3">
              {creditCards.map(card => (
                <div key={card.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div><p className="font-bold text-gray-800 text-sm">{card.name} (**{card.last4})</p><p className="text-xs text-gray-500">{card.ownerName}</p></div>
                  <div className="w-32"><input type="text" className="w-full border p-2 rounded-lg text-right font-bold text-indigo-700 bg-white" placeholder="Pagar..." value={formatCurrencyInput(cardPayments[card.id] !== undefined ? cardPayments[card.id] : '')} onChange={(e) => handleCardPaymentChange(card.id, e.target.value)} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasItems && <button onClick={handleSave} className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg mt-2">Guardar Valores</button>}
      </div>
    </div>, document.body
  );
};

const NavButton = ({ active, onClick, icon: Icon, label, variant = 'bottom' }) => {
  if (variant === 'sidebar') {
    return (
      <button onClick={onClick} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
        <Icon className={`w-5 h-5 mr-3 ${active ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
        <span className="text-sm">{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
      </button>
    );
  }
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center space-y-1 transition-colors w-full h-full ${active ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}>
      <Icon className="w-5 h-5" /> <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
};

const LoaderScreen = () => (
  <div className="bg-emerald-50 min-h-screen flex flex-col items-center justify-center animate-fade-in fixed inset-0 z-[60]">
    <div className="animate-bounce"><div className="w-24 h-24 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-2xl rotate-3 mb-6"><Feather className="w-12 h-12" /></div></div>
    <h1 className="text-4xl font-bold text-emerald-900 tracking-tight animate-pulse">Nido</h1>
    <p className="text-emerald-600 mt-2 font-medium">Sincronizando con tu nube...</p>
  </div>
);

const AuthScreen = ({ onLogin, onRegister, loading }) => {
  const [view, setView] = useState('landing');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', country: COUNTRIES[0] });

  if (view === 'landing') {
    return (
      <div className="bg-emerald-50 min-h-screen flex flex-col items-center justify-center p-6 w-full animate-fade-in relative">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-2xl rotate-3 mb-8"><Feather className="w-12 h-12" /></div>
          <h1 className="text-4xl font-bold text-emerald-900 mb-2 tracking-tight">Nido</h1>
          <p className="text-emerald-700/80 text-lg text-center max-w-xs">Tus finanzas familiares, bajo control.</p>
        </div>
        <div className="w-full max-w-md space-y-4 pb-10">
          <button onClick={() => setView('register')} className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition shadow-xl">Crear Cuenta Nueva</button>
          <button onClick={() => setView('login')} className="w-full bg-white text-emerald-900 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition shadow-sm border border-emerald-100">Ya tengo una cuenta</button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (view === 'login') onLogin(formData.email, formData.password);
    else onRegister(formData);
  };

  return (
    <div className="bg-white min-h-screen flex flex-col p-6 w-full animate-slide-up">
      <div className="max-w-md mx-auto w-full">
        <button onClick={() => setView('landing')} className="text-gray-400 hover:text-gray-900 mb-6 flex items-center"><ArrowLeft className="w-6 h-6 mr-1" /> Atrás</button>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{view === 'login' ? 'Bienvenido' : 'Crear Cuenta'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {view === 'register' && (
            <>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label><input required className="w-full border p-3 rounded-xl" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Tu Nombre" /></div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">País</label>
                <select className="w-full border p-3 rounded-xl bg-white" value={formData.country.code} onChange={e => setFormData({ ...formData, country: COUNTRIES.find(c => c.code === e.target.value) })}>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </select>
              </div>
            </>
          )}
          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label><input type="email" required className="w-full border p-3 rounded-xl" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="correo@ejemplo.com" /></div>
          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña</label><input type="password" required className="w-full border p-3 rounded-xl" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" /></div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-900 text-white py-4 rounded-xl font-bold shadow-lg mt-4 flex justify-center">{loading ? <Loader2 className="animate-spin" /> : (view === 'login' ? 'Iniciar Sesión' : 'Registrarme')}</button>
        </form>
      </div>
    </div>
  );
};

// --- VISTAS PRINCIPALES ---

const DashboardView = ({ totalIncome, totalExpenses, healthScore, categoryStats, expenses, members, toggleStatus, deleteExpense, currency, onOpenUpdateModal }) => {
  const [viewMode, setViewMode] = useState('family');
  const [advice, setAdvice] = useState(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = expenses.filter(e => {
    const d = new Date(e.dueDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const pendingAmount = monthlyExpenses.filter(e => e.status !== 'paid').reduce((acc, e) => acc + (e.amount || 0), 0);
  const totalMonthly = monthlyExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const paymentProgress = totalMonthly > 0 ? ((totalMonthly - pendingAmount) / totalMonthly) * 100 : 0;

  // Alerta gastos variables pendientes de valor
  const variableAlerts = monthlyExpenses.filter(e => e.recurrenceType === 'variable' && e.amount === 0 && e.status !== 'paid');

  const handleGenerateAdvice = async () => {
    setLoadingAdvice(true);
    const prompt = `Actúa como asesor financiero. Contexto: Ingresos ${totalIncome}, Gastos ${totalExpenses}. Salud financiera: ${healthScore}%. Dame un consejo corto y motivador.`;
    const result = await callGeminiAPI(prompt);
    setAdvice(result);
    setLoadingAdvice(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* HEADER CARD */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-3xl p-6 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2 text-emerald-200"><CalendarDays className="w-4 h-4" /><span className="text-xs font-bold uppercase">{getMonthName()} {currentYear}</span></div>
            <div className="flex bg-black/30 rounded-lg p-0.5">
              <button onClick={() => setViewMode('family')} className={`px-2 py-1 rounded text-[10px] font-bold transition ${viewMode === 'family' ? 'bg-white text-emerald-900' : 'text-emerald-300'}`}>Familia</button>
              <button onClick={() => setViewMode('individual')} className={`px-2 py-1 rounded text-[10px] font-bold transition ${viewMode === 'individual' ? 'bg-white text-emerald-900' : 'text-emerald-300'}`}>Individual</button>
            </div>
          </div>

          {viewMode === 'family' ? (
            <>
              <div className="flex items-start justify-between">
                <div><p className="text-emerald-200 text-sm">Por Pagar (Este Mes)</p><h1 className="text-4xl font-extrabold mt-1">{currency} {formatCurrencyInput(pendingAmount)}</h1></div>
                <button onClick={onOpenUpdateModal} className="bg-emerald-600/50 hover:bg-emerald-600 text-white p-2.5 rounded-xl border border-emerald-400/30 flex flex-col items-center justify-center gap-1"><ListChecks className="w-5 h-5" /><span className="text-[9px] uppercase font-bold">Ingresar</span></button>
              </div>
              <div className="mt-6 mb-2">
                <div className="flex justify-between text-xs text-emerald-200 mb-1"><span>Progreso</span><span>{Math.round(paymentProgress)}%</span></div>
                <div className="w-full bg-emerald-900/50 rounded-full h-3 overflow-hidden border border-white/5"><div className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-1000" style={{ width: `${paymentProgress}%` }}></div></div>
              </div>
            </>
          ) : (
            <div className="space-y-2 mt-2 max-h-[200px] overflow-y-auto custom-scrollbar">
              {members.map(m => {
                const mExp = monthlyExpenses.filter(e => e.responsibleId === m.id).reduce((acc, e) => acc + (e.amount || 0), 0);
                return (<div key={m.id} className="flex justify-between items-center p-2 bg-white/10 rounded-lg"><span>{m.name}</span><span className="font-bold">{currency} {formatCurrencyInput(mExp)}</span></div>);
              })}
            </div>
          )}
        </div>
      </div>

      {/* ALERTAS */}
      {variableAlerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 shadow-sm animate-gentle-pulse flex gap-3">
          <div className="bg-orange-100 p-2 rounded-full h-fit text-orange-600"><BellRing className="w-5 h-5" /></div>
          <div><h3 className="font-bold text-orange-900 text-sm">Facturas Pendientes</h3><p className="text-xs text-orange-700">Tienes {variableAlerts.length} servicios variables sin valor definido.</p></div>
        </div>
      )}

      {/* GEMINI AI */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-indigo-600 p-2 rounded-full animate-pulse-ring"><Sparkles className="w-5 h-5 text-white" /></div>
          <div><h3 className="text-indigo-900 font-bold text-sm">Asesor IA</h3><p className="text-indigo-700 text-sm mt-1">{advice || "Analizo tus finanzas para darte consejos."}</p></div>
        </div>
        {!advice && !loadingAdvice && <button onClick={handleGenerateAdvice} className="ml-auto bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 self-start"><Sparkles className="w-3 h-3" /> Analizar</button>}
        {loadingAdvice && <div className="ml-auto flex items-center text-indigo-400 text-xs font-medium"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Pensando...</div>}
      </div>

      {/* VENCIMIENTOS */}
      <div>
        <h3 className="font-bold text-gray-800 text-lg mb-3">Próximos Vencimientos</h3>
        <div className="space-y-3">
          {monthlyExpenses.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 3).map(e => <ExpenseCard key={e.id} expense={e} members={members} currency={currency} toggleStatus={toggleStatus} deleteExpense={deleteExpense} />)}
          {monthlyExpenses.length === 0 && <p className="text-gray-400 text-center text-sm">No hay gastos este mes.</p>}
        </div>
      </div>
    </div>
  );
};

const ExpenseCard = ({ expense, members, currency, toggleStatus, deleteExpense, showActions = false }) => {
  const CategoryIcon = CATEGORIES[expense.category]?.icon || CATEGORIES.otros.icon;
  const responsible = members.find(m => m.id === expense.responsibleId)?.name || 'N/A';
  const isOverdue = new Date(expense.dueDate) < new Date() && expense.status !== 'paid';

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 relative ${expense.status === 'paid' ? 'opacity-70' : ''}`}>
      {expense.recurrenceType && <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-bl-lg text-[10px] font-bold border-b border-l border-emerald-100">{expense.recurrenceType === 'variable' ? 'VARIABLE' : 'FIJO'}</div>}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${CATEGORIES[expense.category]?.color || 'bg-gray-100'}`}><CategoryIcon className="w-5 h-5" /></div>
          <div>
            <h4 className={`font-semibold text-gray-900 ${expense.status === 'paid' ? 'line-through text-gray-400' : ''}`}>{expense.title}</h4>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
              <span className={`flex items-center ${isOverdue ? 'text-red-600 font-bold' : ''}`}><Calendar className="w-3 h-3 mr-1" />{formatDate(expense.dueDate)}</span>
              <span>• {responsible}</span>
            </div>
            {expense.paymentUrl && <a href={expense.paymentUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[10px] text-blue-600 font-bold hover:underline flex items-center mt-1"><ExternalLink className="w-3 h-3 mr-1" /> Pagar Online</a>}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-bold text-lg text-gray-900">{currency} {formatCurrencyInput(expense.amount)}</span>
          <div className="flex gap-2 mt-1">
            <button onClick={() => toggleStatus(expense.id, expense.status)} className={`p-1.5 rounded-full ${expense.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400 hover:bg-emerald-100'}`}><CheckCircle className="w-4 h-4" /></button>
            {showActions && <button onClick={() => deleteExpense(expense.id)} className="p-1.5 rounded-full bg-gray-50 text-gray-400 hover:bg-red-100 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- APP COMPONENT MAIN ---
export default function App() {
  const [view, setView] = useState('auth');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  // Data State
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [profile, setProfile] = useState(null);
  const [currency, setCurrency] = useState('COP');

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'servicios', dueDate: '', responsibleId: '', isAutoDebit: false, isRecurring: false, recurrenceType: 'fixed', type: 'bill' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setView('loader');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setView('loader'); else setView('auth');
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (view === 'loader') {
      fetchData().then(() => setTimeout(() => setView('app'), 1500));
    }
  }, [view]);

  const fetchData = async () => {
    if (!session?.user) return;
    try {
      // Fetch Profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) {
        setProfile(profile);
        setCurrency(profile.currency || 'COP');
      }

      // Fetch Family Members
      const familyId = profile?.family_id;
      if (familyId) {
        const { data: famMembers } = await supabase.from('profiles').select('*').eq('family_id', familyId);
        setMembers(famMembers || []);
        // Fetch Expenses
        const { data: exps } = await supabase.from('expenses').select('*').eq('family_id', familyId); // Assumes RLS handles this, but explicit check good
        // Note: Our RLS is setup so 'select * from expenses' returns family rows.
        const { data: allExpenses } = await supabase.from('expenses').select('*');
        setExpenses(allExpenses || []);
      } else {
        // Fallback for user without family yet
        setMembers([profile]);
      }
    } catch (e) {
      console.error("Error fetching data", e);
    }
  };

  const handleLogin = async (email, password) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  const handleRegister = async (formData) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
          country: formData.country.code,
          currency: formData.country.currency
        }
      }
    });
    if (error) alert(error.message);
    else alert("Registro exitoso! Revisa tu email.");
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('auth');
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newExpense,
        amount: parseFloat(newExpense.amount) || 0,
        user_id: session.user.id,
        status: 'pending'
      };
      const { error } = await supabase.from('expenses').insert([payload]);
      if (error) throw error;
      fetchData();
      setIsAddModalOpen(false);
      setNewExpense({ title: '', amount: '', category: 'servicios', dueDate: '', responsibleId: members[0]?.id, isAutoDebit: false, isRecurring: false, recurrenceType: 'fixed', type: 'bill' });
    } catch (err) { alert(err.message); }
  };

  const handleBatchUpdate = async (updates, newExpenses) => {
    try {
      const promises = [];
      // Update existing
      updates.forEach(u => {
        promises.push(supabase.from('expenses').update({ amount: u.amount }).eq('id', u.id));
      });
      // Insert new ones (Card payments)
      if (newExpenses.length > 0) {
        const enriched = newExpenses.map(e => ({ ...e, user_id: session.user.id }));
        promises.push(supabase.from('expenses').insert(enriched));
      }
      await Promise.all(promises);
      fetchData();
      alert("Valores actualizados correctamente.");
    } catch (e) { console.error(e); alert("Error actualizando"); }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    await supabase.from('expenses').update({ status: newStatus }).eq('id', id);
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm("¿Eliminar gasto?")) return;
    await supabase.from('expenses').delete().eq('id', id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Vistas Placeholder para que compile, eventualmente traeremos todo el código V4.0 para Income/Debts/Family
  const PlaceholderView = ({ title }) => <div className="p-6"><h2 className="text-2xl font-bold">{title}</h2><p className="text-gray-500">Próximamente con lógica V4.0...</p></div>;

  return (
    <>
      <style>{styles}</style>
      {view === 'auth' && <AuthScreen onLogin={handleLogin} onRegister={handleRegister} loading={loading} />}
      {view === 'loader' && <LoaderScreen />}
      {view === 'app' && (
        <div className="bg-gray-50 min-h-screen font-sans text-gray-900 w-full flex flex-col md:flex-row relative animate-fade-in">
          {/* SIDEBAR */}
          <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
            <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-sm"><Feather className="w-5 h-5" /></div>
              <div><h1 className="text-xl font-bold tracking-tight text-emerald-900">Nido</h1><p className="text-xs text-emerald-600/70">Finanzas Familiares</p></div>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={Home} label="HOME" variant="sidebar" />
              <NavButton active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} icon={DollarSign} label="Gastos" variant="sidebar" />
              <NavButton active={activeTab === 'family'} onClick={() => setActiveTab('family')} icon={Users} label="Miembros" variant="sidebar" />
            </nav>
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">{profile?.emoji || '👤'}</div>
                <div className="text-xs"><p className="font-bold">{profile?.name}</p><p className="text-gray-500">{profile?.email}</p></div>
              </div>
              <button onClick={handleLogout} className="w-full flex items-center text-red-600 text-sm hover:bg-red-50 p-2 rounded-lg transition"><LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión</button>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <header className="md:hidden bg-white px-6 pt-12 pb-4 flex justify-between items-center border-b border-gray-100 sticky top-0 z-10 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-sm"><Feather className="w-5 h-5" /></div>
                <div><h1 className="text-xl font-bold tracking-tight text-emerald-900">Nido</h1><p className="text-xs text-emerald-600/70">Finanzas</p></div>
              </div>
              <button onClick={handleLogout} className="p-2 bg-gray-100 rounded-full"><LogOut className="w-4 h-4 text-gray-600" /></button>
            </header>

            <main className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24 md:pb-6">
              {activeTab === 'dashboard' && <DashboardView totalIncome={0} totalExpenses={0} healthScore={100} categoryStats={[]} expenses={expenses} members={members} currency={currency} toggleStatus={handleToggleStatus} deleteExpense={handleDeleteExpense} onOpenUpdateModal={() => setIsUpdateModalOpen(true)} />}
              {activeTab === 'expenses' && (
                <div className="space-y-4">
                  <div className="flex justify-between"><h2 className="text-2xl font-bold">Gastos</h2><button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 text-white p-2 rounded-full"><Plus /></button></div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {expenses.map(e => <ExpenseCard key={e.id} expense={e} members={members} currency={currency} toggleStatus={handleToggleStatus} deleteExpense={handleDeleteExpense} showActions />)}
                  </div>
                </div>
              )}
              {activeTab === 'family' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Familia</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {members.map(m => (
                      <div key={m.id} className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">{m.emoji || '👤'}</div>
                        <div><p className="font-bold">{m.name}</p><p className="text-xs text-gray-500">{m.role || 'Miembro'}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>
          </div>

          {/* MOBILE NAV */}
          <nav className="md:hidden bg-white border-t border-gray-200 h-20 px-6 flex justify-between items-center absolute bottom-0 w-full z-10 shrink-0">
            <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={Home} label="Home" />
            <NavButton active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} icon={DollarSign} label="Gastos" />
            <NavButton active={activeTab === 'family'} onClick={() => setActiveTab('family')} icon={Users} label="Familia" />
          </nav>

          {/* FLOATING ACTION BUTTON */}
          {activeTab === 'expenses' && (
            <div className="absolute bottom-24 right-6 z-20 md:bottom-10 md:right-10">
              <button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-800 hover:bg-emerald-900 text-white p-4 rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95 border-2 border-emerald-400/30"><Plus className="w-6 h-6" /></button>
            </div>
          )}

          {/* MODALS */}
          {isUpdateModalOpen && <MonthlyValuesModal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} expenses={expenses} members={members} onBatchUpdate={handleBatchUpdate} currency={currency} />}

          {isAddModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
              <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-gray-900">Nuevo Gasto</h3><button onClick={() => setIsAddModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button></div>
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Concepto</label><input required className="w-full border p-2.5 rounded-lg" value={newExpense.title} onChange={e => setNewExpense({ ...newExpense, title: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Monto</label><input required type="text" className="w-full border p-2.5 rounded-lg" value={formatCurrencyInput(newExpense.amount)} onChange={e => setNewExpense({ ...newExpense, amount: parseCurrencyInput(e.target.value) })} /></div>
                    <div><label className="block text-sm font-medium mb-1">Fecha</label><input required type="date" className="w-full border p-2.5 rounded-lg" value={newExpense.dueDate} onChange={e => setNewExpense({ ...newExpense, dueDate: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Categoría</label><select className="w-full border p-2.5 rounded-lg bg-white" value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}>{Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{CATEGORIES[c].label}</option>)}</select></div>
                    <div><label className="block text-sm font-medium mb-1">Responsable</label><select className="w-full border p-2.5 rounded-lg bg-white" value={newExpense.responsibleId} onChange={e => setNewExpense({ ...newExpense, responsibleId: e.target.value })}>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between border border-gray-100">
                    <span>Recurrente?</span><input type="checkbox" checked={newExpense.isRecurring} onChange={e => setNewExpense({ ...newExpense, isRecurring: e.target.checked })} className="w-5 h-5 accent-emerald-500" />
                  </div>
                  {newExpense.isRecurring && (
                    <div className="flex gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                      <button type="button" onClick={() => setNewExpense({ ...newExpense, recurrenceType: 'fixed' })} className={`flex-1 text-xs py-1 rounded ${newExpense.recurrenceType === 'fixed' ? 'bg-emerald-100 text-emerald-700 font-bold' : ''}`}>Fijo</button>
                      <button type="button" onClick={() => setNewExpense({ ...newExpense, recurrenceType: 'variable' })} className={`flex-1 text-xs py-1 rounded ${newExpense.recurrenceType === 'variable' ? 'bg-yellow-100 text-yellow-700 font-bold' : ''}`}>Variable</button>
                    </div>
                  )}
                  <button type="submit" className="w-full bg-emerald-900 text-white py-3.5 rounded-xl font-bold shadow-lg mt-4">Guardar Gasto</button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
