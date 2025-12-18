import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { Zap, User, Printer, Share2, FilePlus, Settings, AlertCircle, Briefcase, Eye, Edit3, MessageCircle, Download, Plus, Trash2, GripVertical, Save, Upload, X } from 'lucide-react';

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
  logo?: string; // Base64 ou URL (./logo.png)
}

// --- SERVICE: Gemini ---
// Função auxiliar para pegar a chave do LocalStorage ou do ambiente
const getApiKey = () => localStorage.getItem('eo_api_key') || (window as any).process?.env?.API_KEY || '';

// Criamos o cliente apenas quando necessário para evitar erro se a chave não existir no inicio
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
    if (!ai) return `Olá ${clientName}, segue o orçamento no valor de R$ ${totalValue.toFixed(2)}.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Crie uma mensagem curta, educada e profissional para enviar pelo WhatsApp junto com o PDF do orçamento.
            Cliente: ${clientName}
            Valor Total: R$ ${totalValue.toFixed(2)}
            Qtd Itens: ${itemsCount}
            Observações extras: ${notes}
            
            A mensagem deve convidar o cliente a fechar o serviço. Não use hashtags.`,
        });
        return response.text || "";
    } catch (e) {
        console.error(e);
        return `Olá ${clientName}, aqui está seu orçamento detalhado. Valor total: R$ ${totalValue.toFixed(2)}. Aguardo seu retorno!`;
    }
}

// --- COMPONENTS ---

// QuoteForm Component
interface QuoteFormProps {
  items: ServiceItem[];
  setItems: React.Dispatch<React.SetStateAction<ServiceItem[]>>;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ items, setItems }) => {
  const [newItem, setNewItem] = useState<Partial<ServiceItem>>({
    description: '',
    quantity: 1,
    unitPrice: 0,
    unit: 'un'
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.description) return;

    const item: ServiceItem = {
      id: crypto.randomUUID(),
      description: newItem.description,
      quantity: newItem.quantity || 1,
      unitPrice: newItem.unitPrice || 0,
      unit: newItem.unit || 'un'
    };

    setItems([...items, item]);
    setNewItem({ description: '', quantity: 1, unitPrice: 0, unit: 'un' });
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof ServiceItem, value: any) => {
      setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <GripVertical className="text-electric-500" />
        Itens do Serviço
      </h2>

      <div className="space-y-4 mb-6">
        {items.length === 0 && (
            <p className="text-gray-400 text-center py-4 italic">Nenhum item adicionado ainda.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 p-3 rounded-lg group">
            <div className="flex-1 w-full">
              <input 
                value={item.description}
                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                className="w-full bg-transparent border-b border-transparent focus:border-electric-400 outline-none font-medium text-gray-700"
                placeholder="Descrição"
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex gap-2 flex-1 sm:flex-none">
                  <div className="flex flex-col w-full sm:w-20">
                    <label className="text-[10px] text-gray-400 uppercase">Qtd</label>
                    <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                        className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex flex-col w-full sm:w-20">
                     <label className="text-[10px] text-gray-400 uppercase">Unid.</label>
                     <select
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm"
                     >
                         <option value="un">un</option>
                         <option value="m">m</option>
                         <option value="h">h</option>
                         <option value="kit">kit</option>
                         <option value="vb">vb</option>
                     </select>
                  </div>
              </div>
              
              <div className="flex gap-2 items-end">
                  <div className="flex flex-col w-28 sm:w-28">
                    <label className="text-[10px] text-gray-400 uppercase">Preço (R$)</label>
                    <input
                        type="number"
                        step="0.50"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                        className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <button 
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddItem} className="bg-gray-100 p-4 rounded-lg flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-gray-500 mb-1">Novo Item / Serviço</label>
          <input
            type="text"
            required
            placeholder="Ex: Instalação de Tomada"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-electric-400 outline-none"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="w-1/2 sm:w-20">
              <label className="block text-xs font-medium text-gray-500 mb-1">Qtd</label>
              <input
                type="number"
                min="1"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-electric-400 outline-none"
              />
            </div>
            <div className="w-1/2 sm:w-28">
              <label className="block text-xs font-medium text-gray-500 mb-1">Valor Unit.</label>
              <input
                type="number"
                step="0.50"
                placeholder="0.00"
                value={newItem.unitPrice || ''}
                onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-electric-400 outline-none"
              />
            </div>
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto bg-electric-600 hover:bg-electric-700 text-white px-4 py-2 rounded font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" /> <span className="sm:hidden">Adicionar</span> <span className="hidden sm:inline">Add</span>
        </button>
      </form>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [client, setClient] = useState<ClientData>(() => {
    const saved = localStorage.getItem('eo_client');
    return saved ? JSON.parse(saved) : {
      name: '',
      phone: '',
      address: '',
      date: new Date().toISOString().split('T')[0],
      validity: '15 dias',
      notes: ''
    };
  });
  
  const [professional, setProfessional] = useState<ProfessionalData>(() => {
    const saved = localStorage.getItem('eo_professional');
    const parsed = saved ? JSON.parse(saved) : {};
    
    // Configuração inicial com valores padrão
    return {
      name: parsed.name || 'Seu Nome', 
      title: parsed.title || 'Eletricista Profissional',
      phone: parsed.phone || '',
      // Se tiver uma logo salva (base64) usa ela, senão tenta usar o arquivo fixo logo.png
      logo: parsed.logo || './logo.png'
    };
  });

  const [items, setItems] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem('eo_items');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Estado para armazenar a chave da API
  const [apiKey, setApiKey] = useState<string>(getApiKey());
  const [tempKey, setTempKey] = useState('');

  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [isGeneratingMsg, setIsGeneratingMsg] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'edit' | 'preview'>('edit');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
      const handler = (e: any) => {
          e.preventDefault();
          setDeferredPrompt(e);
          setShowInstallBtn(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
          setShowInstallBtn(false);
      }
      setDeferredPrompt(null);
  };

  const handleSaveKey = () => {
      if(tempKey.trim()){
          localStorage.setItem('eo_api_key', tempKey.trim());
          setApiKey(tempKey.trim());
          setTempKey('');
          alert("Chave salva com sucesso!");
      }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        // Verifica tamanho (limite seguro para localStorage ~2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert("A imagem é muito grande. Tente uma menor que 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setProfessional(prev => ({ ...prev, logo: base64 }));
            setLogoError(false);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
      if (confirm("Voltar para a logo padrão (logo.png)?")) {
          setProfessional(prev => {
              const newData = { ...prev };
              // Força o retorno para o arquivo padrão
              newData.logo = './logo.png';
              return newData;
          });
          setLogoError(false); // Reseta erro para tentar carregar o arquivo padrão novamente
      }
  };

  useEffect(() => {
    localStorage.setItem('eo_client', JSON.stringify(client));
  }, [client]);

  useEffect(() => {
    localStorage.setItem('eo_professional', JSON.stringify(professional));
  }, [professional]);

  useEffect(() => {
    localStorage.setItem('eo_items', JSON.stringify(items));
  }, [items]);

  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleNewQuote = () => {
    if (window.confirm("Deseja iniciar um novo orçamento?")) {
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

  const handleGenerateMessage = async () => {
    if (!apiKey) {
        alert("Por favor, configure sua API Key no topo da página primeiro.");
        return;
    }
    setIsGeneratingMsg(true);
    const msg = await generateProfessionalMessage(
        client.name, 
        subtotal, 
        items.length, 
        client.notes
    );
    setGeneratedMessage(msg);
    setIsGeneratingMsg(false);
  };

  const getMessageText = () => {
    return generatedMessage || `Olá ${client.name || 'Cliente'}, orçamento: R$ ${subtotal.toFixed(2)}`;
  };

  const copyToClipboard = () => {
    const text = getMessageText();
    navigator.clipboard.writeText(text);
    alert('Mensagem copiada!');
  };

  const handleSendWhatsApp = () => {
    const text = getMessageText();
    const cleanPhone = client.phone.replace(/\D/g, '');
    let url = '';
    
    if (cleanPhone.length >= 10) {
        const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`;
    } else {
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    }
    
    window.open(url, '_blank');
  };

  // Helper para renderizar a logo com tratamento de erro
  const renderLogo = (className: string) => {
    if (professional.logo && !logoError) {
        return (
            <img 
                src={professional.logo} 
                alt="Logo Profissional" 
                className={className} 
                onError={() => setLogoError(true)}
            />
        );
    }
    // Fallback se não tiver logo ou der erro (ex: arquivo logo.png não existe)
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <nav className="bg-electric-600 text-white shadow-lg sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white rounded-full">
                 <Zap className="h-6 w-6 text-electric-600" />
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:inline">Eletro App</span>
              <span className="font-bold text-lg tracking-tight sm:hidden">Eletro App</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {showInstallBtn && (
                  <button 
                    onClick={handleInstallClick}
                    className="flex items-center gap-2 px-3 py-2 bg-electric-700 hover:bg-electric-800 rounded-lg transition-colors text-sm font-bold animate-pulse" 
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Instalar App</span>
                    <span className="sm:hidden">Instalar</span>
                  </button>
              )}
              <button onClick={handleNewQuote} className="flex items-center gap-2 px-3 py-2 hover:bg-electric-700 rounded-lg transition-colors text-sm font-medium">
                <FilePlus className="h-5 w-5" />
              </button>
              <div className="h-6 w-px bg-electric-500 mx-2"></div>
              <button onClick={handlePrint} className="p-2 hover:bg-electric-700 rounded-full transition-colors">
                <Printer className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-16 z-40 no-print">
        <div className="grid grid-cols-2">
          <button 
            onClick={() => setActiveMobileTab('edit')}
            className={`py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeMobileTab === 'edit' ? 'border-electric-600 text-electric-700' : 'border-transparent text-gray-500'}`}
          >
            <Edit3 className="w-4 h-4" /> Editar
          </button>
          <button 
            onClick={() => setActiveMobileTab('preview')}
            className={`py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeMobileTab === 'preview' ? 'border-electric-600 text-electric-700' : 'border-transparent text-gray-500'}`}
          >
            <Eye className="w-4 h-4" /> Visualizar
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Banner de Aviso e Configuração da API Key */}
        {!apiKey && (
           <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 rounded-r shadow-sm no-print">
             <div className="flex flex-col gap-2">
               <div className="flex items-center">
                 <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
                 <p className="text-orange-700 text-sm font-bold">
                   Configuração Necessária
                 </p>
               </div>
               <p className="text-sm text-orange-800">
                 Para usar a Inteligência Artificial (melhoria de texto), você precisa de uma chave API do Google Gemini.
               </p>
               <div className="flex gap-2 mt-2">
                 <input 
                    type="text" 
                    placeholder="Cole sua API Key aqui (começa com AIza...)" 
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    className="flex-1 p-2 border border-orange-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                 />
                 <button 
                    onClick={handleSaveKey}
                    className="bg-orange-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-orange-700 flex items-center gap-2"
                 >
                    <Save className="w-4 h-4" /> Salvar
                 </button>
               </div>
               <p className="text-xs text-orange-600 mt-1">
                 * A chave ficará salva apenas no seu celular/navegador. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold">Obter chave grátis aqui.</a>
               </p>
             </div>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={`space-y-6 no-print ${activeMobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Briefcase className="text-electric-500" />
                Seus Dados
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Logo Uploader */}
                <div className="col-span-1 md:col-span-2 mb-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Sua Logo / Marca</label>
                    <div className="flex items-center gap-4">
                        {(!logoError && professional.logo) ? (
                            <div className="relative">
                                {renderLogo("h-16 w-auto object-contain border rounded p-1")}
                                <button 
                                    onClick={handleRemoveLogo}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"
                                    title="Voltar para logo padrão"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="h-16 w-16 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                <Zap className="w-6 h-6" />
                            </div>
                        )}
                        <div>
                            <input 
                                type="file" 
                                accept="image/*" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleLogoUpload}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded font-medium flex items-center gap-2 transition-colors"
                            >
                                <Upload className="w-4 h-4" /> 
                                {professional.logo !== './logo.png' && !logoError ? 'Trocar Logo' : 'Enviar Logo Personalizada'}
                            </button>
                            <p className="text-[10px] text-gray-500 mt-1">Dica: Salve uma imagem chamada <b>logo.png</b> no GitHub para usar como padrão.</p>
                        </div>
                    </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Seu Nome</label>
                  <input
                    type="text"
                    value={professional.name}
                    onChange={(e) => setProfessional({...professional, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-electric-500 focus:border-electric-500"
                    placeholder="Seu Nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Título</label>
                  <input
                    type="text"
                    value={professional.title}
                    onChange={(e) => setProfessional({...professional, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Seu Telefone</label>
                  <input
                    type="tel"
                    value={professional.phone}
                    onChange={(e) => setProfessional({...professional, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="text-electric-500" />
                Dados do Cliente
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nome do Cliente</label>
                  <input
                    type="text"
                    value={client.name}
                    onChange={(e) => setClient({...client, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={client.phone}
                    onChange={(e) => setClient({...client, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-600 mb-1">Data</label>
                   <input
                    type="date"
                    value={client.date}
                    onChange={(e) => setClient({...client, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                   />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Endereço</label>
                  <input
                    type="text"
                    value={client.address}
                    onChange={(e) => setClient({...client, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            <QuoteForm items={items} setItems={setItems} />
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                   <Settings className="text-electric-500 w-5 h-5" /> Detalhes Finais
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Validade</label>
                        <select 
                            value={client.validity}
                            onChange={(e) => setClient({...client, validity: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                        >
                            <option>7 dias</option>
                            <option>10 dias</option>
                            <option>15 dias</option>
                            <option>30 dias</option>
                        </select>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Observações</label>
                        <textarea
                            rows={3}
                            value={client.notes}
                            onChange={(e) => setClient({...client, notes: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-100 p-4 sm:p-6 mb-20 lg:mb-0">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                        <Share2 className="text-indigo-600 w-5 h-5" /> Enviar
                    </h2>
                    <button 
                        onClick={handleGenerateMessage}
                        disabled={isGeneratingMsg}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded transition-colors"
                    >
                        {isGeneratingMsg ? 'Gerando...' : 'Melhorar texto (IA)'}
                    </button>
                </div>
                
                <textarea
                    value={generatedMessage}
                    onChange={(e) => setGeneratedMessage(e.target.value)}
                    className="w-full p-3 text-sm border border-indigo-200 rounded-lg bg-white h-24 mb-4"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                        onClick={handleSendWhatsApp}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                        <MessageCircle className="w-5 h-5" />
                        WhatsApp
                    </button>
                    <button 
                        onClick={copyToClipboard}
                        className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium"
                    >
                        Copiar
                    </button>
                </div>
            </div>
          </div>

          <div className={`lg:sticky lg:top-24 h-fit ${activeMobileTab === 'edit' ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-white shadow-2xl rounded-none sm:rounded-lg overflow-hidden border border-gray-200 print-section" id="quote-preview">
                <div className="bg-gray-800 text-white p-4 sm:p-6 border-b-4 border-electric-500">
                    <div className="flex justify-between items-center">
                        <div>
                             {/* Lógica de exibição da logo: Customizada ou Padrão ou Texto */}
                             {(!logoError && professional.logo) ? (
                                <div className="mb-2">
                                    {renderLogo("h-16 w-auto object-contain")}
                                </div>
                             ) : (
                                <>
                                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">ORÇAMENTO</h1>
                                    <p className="text-electric-400 font-medium mt-1 text-sm sm:text-base">SERVIÇOS ELÉTRICOS</p>
                                </>
                             )}
                        </div>
                        <div className="text-right">
                             {/* Se não tiver logo na esquerda (ou se deu erro no load), mostra o raio na direita */}
                            {(logoError || !professional.logo) && (
                                <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-electric-400 ml-auto mb-2" />
                            )}
                            <p className="text-xs sm:text-sm text-gray-300">Data: {new Date(client.date).toLocaleDateString('pt-BR')}</p>
                            <p className="text-xs sm:text-sm text-gray-300">Validade: {client.validity}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-8">
                    <div className="flex flex-col md:flex-row justify-between gap-6 sm:gap-8 mb-8">
                        <div className="flex-1">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cliente</h3>
                            <p className="font-bold text-gray-800 text-lg">{client.name || 'Nome do Cliente'}</p>
                            {client.address && <p className="text-gray-600 text-sm sm:text-base">{client.address}</p>}
                            {client.phone && <p className="text-gray-600 text-sm sm:text-base">{client.phone}</p>}
                        </div>
                        <div className="flex-1 md:text-right">
                             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Prestador</h3>
                             <p className="font-bold text-gray-800 text-lg">{professional.name}</p>
                             <p className="text-gray-600 text-sm sm:text-base">{professional.title}</p>
                             {professional.phone && <p className="text-gray-600 text-sm sm:text-base">{professional.phone}</p>}
                        </div>
                    </div>

                    <div className="mb-8 overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-0">
                            <thead>
                                <tr className="border-b-2 border-gray-800">
                                    <th className="py-3 text-sm font-bold text-gray-700 uppercase">Descrição</th>
                                    <th className="py-3 text-sm font-bold text-gray-700 uppercase text-center w-16 sm:w-20">Qtd</th>
                                    <th className="py-3 text-sm font-bold text-gray-700 uppercase text-right w-24 sm:w-32">Unit.</th>
                                    <th className="py-3 text-sm font-bold text-gray-700 uppercase text-right w-24 sm:w-32">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-400 italic">Adicione itens...</td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="py-3 text-gray-700 text-sm sm:text-base">
                                                <span className="font-medium">{item.description}</span>
                                                <span className="text-xs text-gray-400 ml-1">({item.unit})</span>
                                            </td>
                                            <td className="py-3 text-center text-gray-600 text-sm sm:text-base">{item.quantity}</td>
                                            <td className="py-3 text-right text-gray-600 text-sm sm:text-base">{item.unitPrice.toFixed(2)}</td>
                                            <td className="py-3 text-right font-medium text-gray-800 text-sm sm:text-base">
                                                {(item.quantity * item.unitPrice).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3} className="pt-6 text-right font-bold text-gray-800 text-base sm:text-lg">TOTAL ESTIMADO</td>
                                    <td className="pt-6 text-right font-bold text-electric-600 text-xl sm:text-2xl">
                                        R$ {subtotal.toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {(client.notes) && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-8">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Observações</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{client.notes}</p>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-4 text-center no-print">
               <p className="text-xs text-gray-400 mb-2">Orçamento emitido via Eletro App</p>
               <button 
                onClick={handlePrint}
                className="lg:hidden w-full py-3 bg-electric-600 hover:bg-electric-700 text-white rounded-lg font-bold shadow-lg flex items-center justify-center gap-2"
               >
                 <Printer className="w-5 h-5" /> Imprimir / Salvar PDF
               </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => console.log('SW registered'))
      .catch(err => console.log('SW failed', err));
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);