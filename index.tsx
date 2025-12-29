import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { 
  Zap, User, Printer, Share2, FilePlus, Settings, AlertCircle, 
  Briefcase, Eye, Edit3, MessageCircle, Download, Plus, Trash2, 
  GripVertical, Save, Upload, X, Home, History, CheckCircle2, 
  ChevronRight, Search, LayoutDashboard, Copy, MoreVertical
} from 'lucide-react';

// --- TYPES ---
interface ServiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
}

interface ClientData {
  name: string;
  address: string;
  phone: string;
  date: string;
  validity: string;
  notes: string;
}

interface ProfessionalData {
  name: string;
  title: string;
  phone: string;
  logo?: string;
}

interface QuoteHistoryItem {
  id: string;
  client: ClientData;
  items: ServiceItem[];
  total: number;
  createdAt: string;
}

// --- UTILS ---
const getApiKey = () => localStorage.getItem('eo_api_key') || (window as any).process?.env?.API_KEY || '';

const getGenAI = () => {
  const key = getApiKey();
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};

const generateProfessionalMessage = async (
  clientName: string,
  totalValue: number,
  itemsCount: number,
  notes: string
): Promise<string> => {
    const ai = getGenAI();
    if (!ai) return `Olá ${clientName}, segue o orçamento no valor de R$ ${totalValue.toFixed(2).replace('.', ',')}.`;

    try {
        const response = await ai.getGenerativeModel({ model: "gemini-2.0-flash" }).generateContent({
            contents: [{ role: 'user', parts: [{ text: `Crie uma mensagem curta, educada e profissional para enviar pelo WhatsApp junto com o PDF do orçamento.
            Cliente: ${clientName}
            Valor Total: R$ ${totalValue.toFixed(2).replace('.', ',')}
            Qtd Itens: ${itemsCount}
            Observações extras: ${notes}
            
            A mensagem deve convidar o cliente a fechar o serviço. Não use hashtags.` }] }],
        });
        return response.response.text() || "";
    } catch (e) {
        console.error(e);
        return `Olá ${clientName}, aqui está seu orçamento detalhado. Valor total: R$ ${totalValue.toFixed(2).replace('.', ',')}. Aguardo seu retorno!`;
    }
}

// --- COMPONENTS ---

// 1. Button Component
const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}> = ({ children, onClick, variant = 'primary', className = '', disabled, type = 'button' }) => {
  const base = "px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    primary: "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200",
    secondary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200",
    outline: "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-100",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600",
    success: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200"
  };
  
  return (
    <button type={type} onClick={onClick} className={`${base} ${variants[variant]} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
};

// 2. Input Component
const Input: React.FC<{
  label?: string;
  placeholder?: string;
  type?: string;
  value: string | number;
  onChange: (value: any) => void;
  className?: string;
  icon?: React.ReactNode;
}> = ({ label, placeholder, type = 'text', value, onChange, className = '', icon }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
        <input 
          type={type} 
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder:text-slate-300 text-slate-700`}
        />
      </div>
    </div>
  );
};

// 3. Card Component
const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
}> = ({ children, className = '', title, icon, headerAction }) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
      {(title || icon) && (
        <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-2">
            {icon && <span className="text-amber-500">{icon}</span>}
            {title && <h3 className="font-bold text-slate-800">{title}</h3>}
          </div>
          {headerAction}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

// --- MAIN APP ---

const App: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new' | 'history' | 'settings'>('new');
  const [activeMobileTab, setActiveMobileTab] = useState<'edit' | 'preview'>('edit');
  
  // Professional Data
  const [professional, setProfessional] = useState<ProfessionalData>(() => {
    const saved = localStorage.getItem('eo_professional');
    return saved ? JSON.parse(saved) : {
      name: 'Seu Nome',
      title: 'Eletricista Profissional',
      phone: '',
      logo: './logo.png'
    };
  });

  // Quote Data
  const [client, setClient] = useState<ClientData>({
    name: '',
    phone: '',
    address: '',
    date: new Date().toISOString().split('T')[0],
    validity: '15 dias',
    notes: ''
  });

  const [items, setItems] = useState<ServiceItem[]>([]);
  const [history, setHistory] = useState<QuoteHistoryItem[]>(() => {
    const saved = localStorage.getItem('eo_history');
    return saved ? JSON.parse(saved) : [];
  });

  // AI & Sharing
  const [apiKey, setApiKey] = useState<string>(getApiKey());
  const [tempKey, setTempKey] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // PWA & UI
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [logoError, setLogoError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('eo_professional', JSON.stringify(professional));
  }, [professional]);

  useEffect(() => {
    localStorage.setItem('eo_history', JSON.stringify(history));
  }, [history]);

  // PWA Logic
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0), [items]);

  // Handlers
  const handleSaveQuote = () => {
    if (!client.name || items.length === 0) {
      alert("Preencha o nome do cliente e adicione pelo menos um item.");
      return;
    }
    const newQuote: QuoteHistoryItem = {
      id: crypto.randomUUID(),
      client: { ...client },
      items: [...items],
      total: subtotal,
      createdAt: new Date().toISOString()
    };
    setHistory([newQuote, ...history]);
    alert("Orçamento salvo no histórico!");
  };

  const handleNewQuote = () => {
    if (confirm("Iniciar novo orçamento?")) {
      setClient({
        name: '',
        phone: '',
        address: '',
        date: new Date().toISOString().split('T')[0],
        validity: '15 dias',
        notes: ''
      });
      setItems([]);
      setGeneratedMessage('');
      setActiveMobileTab('edit');
    }
  };

  const handleSendWhatsApp = () => {
    const text = generatedMessage || `Olá ${client.name}, segue o orçamento: R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    const phone = client.phone.replace(/\D/g, '');
    const url = `https://wa.me/${phone.length >= 10 ? (phone.startsWith('55') ? phone : '55' + phone) : ''}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleGenerateAI = async () => {
    if (!apiKey) {
      alert("Configure a API Key nas configurações.");
      return;
    }
    setIsGenerating(true);
    const msg = await generateProfessionalMessage(client.name, subtotal, items.length, client.notes);
    setGeneratedMessage(msg);
    setIsGenerating(false);
  };

  // Renderers
  const renderLogo = (className: string) => {
    if (professional.logo && !logoError) {
      return <img src={professional.logo} alt="Logo" className={className} onError={() => setLogoError(true)} />;
    }
    return <Zap className="w-10 h-10 text-amber-500" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Sidebar / Top Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
               <Zap className="w-6 h-6 fill-white" />
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight hidden sm:block">ELETRO<span className="text-amber-500">PRO</span></h1>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
               <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Dashboard</button>
               <button onClick={() => setActiveTab('new')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'new' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Novo</button>
               <button onClick={() => setActiveTab('history')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Histórico</button>
               <button onClick={() => setActiveTab('settings')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Ajustes</button>
             </div>
             
             {showInstallBtn && (
               <Button onClick={() => deferredPrompt.prompt()} variant="success" className="h-10 px-3 py-1 text-xs sm:text-sm animate-pulse">
                 Instalar
               </Button>
             )}
             
             <button onClick={() => window.print()} className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
               <Printer className="w-5 h-5" />
             </button>
          </div>
        </div>
      </nav>

      {/* Main Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-amber-500 text-white border-none shadow-amber-100">
                   <p className="text-amber-100 text-xs font-bold uppercase tracking-wider">Total de Orçamentos</p>
                   <h2 className="text-3xl font-black mt-1">{history.length}</h2>
                </Card>
                <Card className="bg-indigo-600 text-white border-none shadow-indigo-100">
                   <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider">Volume Projetado</p>
                   <h2 className="text-3xl font-black mt-1">R$ {history.reduce((a, b) => a + b.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                </Card>
                <Card className="bg-emerald-500 text-white border-none shadow-emerald-100">
                   <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Média por Orçamento</p>
                   <h2 className="text-3xl font-black mt-1">R$ {history.length ? (history.reduce((a, b) => a + b.total, 0) / history.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</h2>
                </Card>
                <Card className="bg-white border-slate-200">
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Último Orçamento</p>
                   <h2 className="text-xl font-bold text-slate-800 mt-1 truncate">{history[0]?.client.name || 'Nenhum'}</h2>
                </Card>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                    <History className="w-6 h-6 text-amber-500" /> Atividade Recente
                  </h3>
                  {history.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                       <FilePlus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                       <h4 className="text-slate-500 font-bold">Nenhum histórico encontrado</h4>
                       <p className="text-slate-400 text-sm mt-1">Comece criando seu primeiro orçamento profissional.</p>
                       <Button onClick={() => setActiveTab('new')} className="mt-6 mx-auto">Criar Novo Orçamento</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.slice(0, 5).map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-amber-200 transition-all group">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-amber-500 group-hover:bg-amber-50 transition-all">
                                 <User className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800">{item.client.name}</h4>
                                <p className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString('pt-BR')} • {item.items.length} itens</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="font-black text-slate-800">R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              <button onClick={() => { setClient(item.client); setItems(item.items); setActiveTab('new'); }} className="text-amber-500 text-xs font-bold hover:underline">Reutilizar</button>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                   <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-amber-500" /> Dicas Pro
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                       <h4 className="font-bold text-indigo-900 text-sm">Use IA para vender mais</h4>
                       <p className="text-xs text-indigo-700 mt-1 leading-relaxed">Mensagens personalizadas pelo Gemini aumentam sua taxa de conversão em até 40%.</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                       <h4 className="font-bold text-amber-900 text-sm">Salve em PDF</h4>
                       <p className="text-xs text-amber-700 mt-1 leading-relaxed">Sempre envie o orçamento em PDF para transmitir mais profissionalismo ao cliente.</p>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'new' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            
            {/* Left Form */}
            <div className={`lg:col-span-7 space-y-6 no-print ${activeMobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
              
              <div className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-slate-100 sm:hidden">
                 <button onClick={() => setActiveMobileTab('edit')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeMobileTab === 'edit' ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' : 'text-slate-500'}`}>Editar</button>
                 <button onClick={() => setActiveMobileTab('preview')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeMobileTab === 'preview' ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' : 'text-slate-500'}`}>Visualizar</button>
              </div>

              <Card title="Dados do Cliente" icon={<User className="w-5 h-5" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Nome Completo" placeholder="Ex: João da Silva" value={client.name} onChange={v => setClient({...client, name: v})} className="sm:col-span-2" />
                  <Input label="WhatsApp" placeholder="(00) 00000-0000" type="tel" value={client.phone} onChange={v => setClient({...client, phone: v})} />
                  <Input label="Data" type="date" value={client.date} onChange={v => setClient({...client, date: v})} />
                  <Input label="Endereço do Serviço" placeholder="Rua, Número, Bairro..." value={client.address} onChange={v => setClient({...client, address: v})} className="sm:col-span-2" />
                </div>
              </Card>

              <Card title="Itens do Serviço" icon={<LayoutDashboard className="w-5 h-5" />} headerAction={<Button onClick={handleSaveQuote} variant="outline" className="py-1 px-3 text-xs"><Save className="w-4 h-4" /> Salvar</Button>}>
                <div className="space-y-4">
                   {items.map((item, idx) => (
                      <div key={item.id} className="relative group bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-amber-200 transition-all">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                           <div className="sm:col-span-6">
                              <Input label="Descrição" value={item.description} onChange={v => {
                                const newItems = [...items];
                                newItems[idx].description = v;
                                setItems(newItems);
                              }} />
                           </div>
                           <div className="sm:col-span-2">
                              <Input label="Qtd" type="number" value={item.quantity} onChange={v => {
                                const newItems = [...items];
                                newItems[idx].quantity = parseFloat(v);
                                setItems(newItems);
                              }} />
                           </div>
                           <div className="sm:col-span-3">
                              <Input label="Valor (R$)" type="number" value={item.unitPrice} onChange={v => {
                                const newItems = [...items];
                                newItems[idx].unitPrice = parseFloat(v);
                                setItems(newItems);
                              }} />
                           </div>
                           <div className="sm:col-span-1 flex justify-center pb-1">
                              <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-5 h-5" />
                              </button>
                           </div>
                        </div>
                        <div className="mt-2 flex gap-2">
                           <select 
                            value={item.unit} 
                            onChange={e => {
                               const newItems = [...items];
                               newItems[idx].unit = e.target.value;
                               setItems(newItems);
                            }}
                            className="bg-transparent text-[10px] font-bold text-slate-400 uppercase outline-none"
                           >
                              <option value="un">unid</option>
                              <option value="m">metros</option>
                              <option value="h">horas</option>
                              <option value="kit">kit</option>
                           </select>
                        </div>
                      </div>
                   ))}
                   
                   <Button onClick={() => setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, unit: 'un' }])} variant="outline" className="w-full py-4 border-dashed border-2 hover:border-amber-400 hover:text-amber-600 transition-all">
                      <Plus className="w-5 h-5" /> Adicionar Item
                   </Button>
                </div>
              </Card>

              <Card title="Observações Finais" icon={<Settings className="w-5 h-5" />}>
                 <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Validade do Orçamento</label>
                      <select value={client.validity} onChange={e => setClient({...client, validity: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none">
                        <option>7 dias</option>
                        <option>10 dias</option>
                        <option>15 dias</option>
                        <option>30 dias</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Notas / Observações</label>
                      <textarea rows={3} value={client.notes} onChange={e => setClient({...client, notes: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Ex: Pagamento facilitado, materiais não inclusos..."></textarea>
                    </div>
                 </div>
              </Card>

              {/* Share Card */}
              <div className="bg-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-black flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-amber-400" /> Vender Orçamento
                      </h3>
                      <p className="text-indigo-200 text-sm mt-1">Gere uma mensagem profissional e envie pelo WhatsApp</p>
                    </div>
                    <Button onClick={handleGenerateAI} disabled={isGenerating} variant="primary" className="bg-white text-indigo-900 shadow-none hover:bg-amber-100 h-10 py-1 px-4 text-xs font-black">
                      {isGenerating ? 'IA PENSANDO...' : 'MELHORAR COM IA'}
                    </Button>
                  </div>
                  
                  <textarea 
                    value={generatedMessage} 
                    onChange={e => setGeneratedMessage(e.target.value)}
                    className="w-full h-32 bg-indigo-950/50 border border-indigo-700/50 rounded-2xl p-4 text-sm text-indigo-100 placeholder:text-indigo-800 focus:ring-2 focus:ring-amber-500 outline-none mb-6 leading-relaxed"
                    placeholder="Sua mensagem de fechamento aparecerá aqui..."
                  ></textarea>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <Button onClick={handleSendWhatsApp} variant="success" className="h-14 rounded-2xl font-black text-lg bg-emerald-500 hover:bg-emerald-600">
                        <MessageCircle className="w-6 h-6" /> ENVIAR WHATSAPP
                     </Button>
                     <Button onClick={() => { navigator.clipboard.writeText(generatedMessage); alert("Copiado!"); }} variant="outline" className="h-14 rounded-2xl bg-indigo-800 border-indigo-700 text-white hover:bg-indigo-700">
                        <Copy className="w-6 h-6" /> COPIAR TEXTO
                     </Button>
                  </div>
              </div>
            </div>

            {/* Right Preview */}
            <div className={`lg:col-span-5 lg:sticky lg:top-24 h-fit ${activeMobileTab === 'edit' ? 'hidden lg:block' : 'block'}`}>
               <div id="print-area" className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-200 print-card">
                  {/* Header */}
                  <div className="bg-slate-900 text-white p-8 border-b-8 border-amber-500">
                     <div className="flex justify-between items-start">
                        <div>
                           <div className="mb-4">
                              {renderLogo("h-12 w-auto object-contain")}
                           </div>
                           <h2 className="text-3xl font-black tracking-tighter">ORÇAMENTO</h2>
                           <p className="text-amber-500 font-bold text-sm tracking-widest">{professional.title.toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                           <div className="bg-amber-500 p-2 rounded-xl inline-block mb-2 shadow-lg shadow-amber-500/20">
                              <Zap className="w-6 h-6 text-white" />
                           </div>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Emitido em</p>
                           <p className="text-sm font-bold">{new Date(client.date).toLocaleDateString('pt-BR')}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">Válido por</p>
                           <p className="text-sm font-bold">{client.validity}</p>
                        </div>
                     </div>
                  </div>

                  <div className="p-8 space-y-8">
                     {/* Client/Pro Info */}
                     <div className="grid grid-cols-2 gap-8 text-sm">
                        <div className="space-y-2">
                           <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Contratante</h4>
                           <p className="font-bold text-slate-900 leading-tight">{client.name || 'Nome do Cliente'}</p>
                           <p className="text-slate-500 leading-relaxed italic">{client.address || 'Endereço não informado'}</p>
                           <p className="font-bold text-slate-600">{client.phone}</p>
                        </div>
                        <div className="space-y-2 text-right">
                           <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Prestador</h4>
                           <p className="font-bold text-slate-900 leading-tight">{professional.name}</p>
                           <p className="text-slate-500 leading-relaxed italic">{professional.title}</p>
                           <p className="font-bold text-slate-600">{professional.phone}</p>
                        </div>
                     </div>

                     {/* Table */}
                     <div>
                        <table className="w-full text-left">
                           <thead>
                              <tr className="border-b-2 border-slate-900">
                                 <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Serviço/Item</th>
                                 <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-16">Qtd</th>
                                 <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-24">Unit.</th>
                                 <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-24">Subtotal</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {items.length === 0 ? (
                                 <tr><td colSpan={4} className="py-12 text-center text-slate-300 italic">Adicione os serviços no formulário...</td></tr>
                              ) : (
                                items.map(item => (
                                  <tr key={item.id}>
                                    <td className="py-4">
                                       <p className="font-bold text-slate-800 text-sm">{item.description}</p>
                                       <p className="text-[10px] text-slate-400 font-bold uppercase">{item.unit}</p>
                                    </td>
                                    <td className="py-4 text-center text-slate-600 text-sm">{item.quantity}</td>
                                    <td className="py-4 text-right text-slate-600 text-sm">{item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td className="py-4 text-right font-black text-slate-800 text-sm">{(item.quantity * item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                  </tr>
                                ))
                              )}
                           </tbody>
                        </table>
                     </div>

                     {/* Total Area */}
                     <div className="bg-slate-50 p-6 rounded-3xl flex justify-between items-center border border-slate-100">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Investimento Total</h3>
                        <div className="text-right">
                           <h2 className="text-3xl font-black text-amber-600 leading-none">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                        </div>
                     </div>

                     {client.notes && (
                       <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 text-sm italic text-amber-900 border-l-8">
                          <h4 className="font-black text-[10px] uppercase tracking-widest mb-2 not-italic text-amber-700">Observações</h4>
                          "{client.notes}"
                       </div>
                     )}

                     <div className="pt-8 border-t border-slate-100 text-center">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">Obrigado pela preferência</p>
                     </div>
                  </div>
               </div>
               
               <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
                 <Button onClick={handleNewQuote} variant="outline" className="h-12 border-2"><Trash2 className="w-4 h-4" /> LIMPAR</Button>
                 <Button onClick={() => window.print()} variant="primary" className="h-12"><Printer className="w-4 h-4" /> IMPRIMIR PDF</Button>
               </div>
            </div>

          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
             <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                   <History className="w-6 h-6 text-amber-500" /> Histórico de Vendas
                </h2>
                <div className="flex gap-2">
                   <Button onClick={() => { if(confirm("Limpar todo o histórico?")) setHistory([]); }} variant="danger" className="text-xs h-9">Limpar Tudo</Button>
                </div>
             </div>
             
             {history.length === 0 ? (
               <Card className="p-12 text-center text-slate-400">
                  Nenhum registro encontrado.
               </Card>
             ) : (
               <div className="grid grid-cols-1 gap-4">
                  {history.map(item => (
                    <Card key={item.id} className="p-0 overflow-hidden hover:border-amber-200 transition-all">
                       <div className="p-6 flex flex-col sm:flex-row justify-between gap-4">
                          <div className="flex gap-4">
                             <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 font-black text-xl">
                                {item.client.name.charAt(0)}
                             </div>
                             <div>
                                <h4 className="font-black text-slate-800 text-lg">{item.client.name}</h4>
                                <p className="text-sm text-slate-500">{new Date(item.createdAt).toLocaleString('pt-BR')} • {item.items.length} itens</p>
                             </div>
                          </div>
                          <div className="flex flex-row sm:flex-col justify-between items-end gap-2">
                             <p className="text-2xl font-black text-amber-600">R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                             <div className="flex gap-2">
                                <Button onClick={() => { setClient(item.client); setItems(item.items); setActiveTab('new'); }} variant="outline" className="h-8 px-3 text-xs">Abrir</Button>
                                <Button onClick={() => setHistory(history.filter(h => h.id !== item.id))} variant="ghost" className="h-8 px-2 text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                             </div>
                          </div>
                       </div>
                    </Card>
                  ))}
               </div>
             )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
             <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <Settings className="w-6 h-6 text-amber-500" /> Configurações
             </h2>
             
             <Card title="Seus Dados Profissionais" icon={<Briefcase className="w-5 h-5" />}>
                <div className="space-y-6">
                  <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                     <div className="relative group">
                       <div className="w-24 h-24 bg-slate-100 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center">
                          {renderLogo("w-full h-full object-contain")}
                       </div>
                       <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-2 rounded-xl shadow-lg hover:scale-110 transition-transform">
                          <Upload className="w-4 h-4" />
                       </button>
                       <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                             const reader = new FileReader();
                             reader.onloadend = () => setProfessional({ ...professional, logo: reader.result as string });
                             reader.readAsDataURL(file);
                          }
                       }} />
                     </div>
                     <div>
                        <h4 className="font-black text-slate-800">Sua Marca / Logo</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Formatos aceitos: PNG, JPG ou SVG. Tamanho recomendado: 512x512px.</p>
                        <button onClick={() => setProfessional({...professional, logo: './logo.png'})} className="mt-2 text-[10px] font-black text-amber-500 uppercase tracking-widest hover:underline">Resetar para Padrão</button>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <Input label="Seu Nome" value={professional.name} onChange={v => setProfessional({...professional, name: v})} />
                     <Input label="Título Profissional" value={professional.title} onChange={v => setProfessional({...professional, title: v})} />
                     <Input label="Seu Telefone" value={professional.phone} onChange={v => setProfessional({...professional, phone: v})} className="sm:col-span-2" />
                  </div>
                </div>
             </Card>

             <Card title="Segurança & IA" icon={<Zap className="w-5 h-5" />}>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Google Gemini API Key</label>
                    <div className="flex gap-2">
                       <input 
                        type="password" 
                        value={tempKey || (apiKey ? '********' : '')} 
                        onChange={e => setTempKey(e.target.value)} 
                        placeholder="AIza..." 
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none" 
                       />
                       <Button onClick={() => { localStorage.setItem('eo_api_key', tempKey); setApiKey(tempKey); setTempKey(''); alert("Salvo!"); }}>Salvar</Button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 italic">* A chave fica salva apenas no seu dispositivo.</p>
                  </div>
                </div>
             </Card>
             
             <div className="bg-slate-200 h-px w-full my-8"></div>
             
             <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200">
                <div>
                   <h4 className="font-black text-slate-800">Versão Pro</h4>
                   <p className="text-xs text-slate-400">Você está usando a versão Offline (LocalStorage).</p>
                </div>
                <div className="text-xs font-black px-3 py-1 bg-amber-100 text-amber-600 rounded-full tracking-tighter">V 1.2.0</div>
             </div>
          </div>
        )}
      </main>

      {/* Footer Nav Mobile */}
      <footer className="md:hidden bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 z-50 no-print">
         <div className="grid grid-cols-4 h-16">
            <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'dashboard' ? 'text-amber-500' : 'text-slate-400'}`}>
               <Home className="w-5 h-5" />
               <span className="text-[10px] font-bold">Início</span>
            </button>
            <button onClick={() => setActiveTab('new')} className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'new' ? 'text-amber-500' : 'text-slate-400'}`}>
               <Plus className="w-6 h-6 p-1 bg-amber-500 text-white rounded-lg" />
               <span className="text-[10px] font-bold">Novo</span>
            </button>
            <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'history' ? 'text-amber-500' : 'text-slate-400'}`}>
               <History className="w-5 h-5" />
               <span className="text-[10px] font-bold">Histórico</span>
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center justify-center gap-1 ${activeTab === 'settings' ? 'text-amber-500' : 'text-slate-400'}`}>
               <Settings className="w-5 h-5" />
               <span className="text-[10px] font-bold">Ajustes</span>
            </button>
         </div>
      </footer>
    </div>
  );
};

// --- RENDER ---
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);