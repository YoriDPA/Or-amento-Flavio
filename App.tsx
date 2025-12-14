import React, { useState, useEffect } from 'react';
import { Zap, User, Printer, Share2, FilePlus, Settings, AlertCircle, Briefcase, Eye, Edit3, MessageCircle, Download } from 'lucide-react';
import { ClientData, ServiceItem, ProfessionalData } from './types.ts';
import { AIAssistant } from './components/AIAssistant.tsx';
import { QuoteForm } from './components/QuoteForm.tsx';
import { generateProfessionalMessage } from './services/geminiService.ts';

const App: React.FC = () => {
  // State with LocalStorage Initialization
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
    return saved ? JSON.parse(saved) : {
      name: 'Flavio',
      title: 'Eletricista Profissional',
      phone: ''
    };
  });

  const [items, setItems] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem('eo_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [isGeneratingMsg, setIsGeneratingMsg] = useState(false);
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false);
  
  // Mobile Tab State ('edit' or 'preview')
  const [activeMobileTab, setActiveMobileTab] = useState<'edit' | 'preview'>('edit');
  
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

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

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('eo_client', JSON.stringify(client));
  }, [client]);

  useEffect(() => {
    localStorage.setItem('eo_professional', JSON.stringify(professional));
  }, [professional]);

  useEffect(() => {
    localStorage.setItem('eo_items', JSON.stringify(items));
  }, [items]);

  // Totals
  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setShowApiKeyWarning(true);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleNewQuote = () => {
    if (window.confirm("Deseja iniciar um novo orçamento? Isso limpará os dados do cliente e os itens atuais.")) {
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
      setActiveMobileTab('edit'); // Return to edit mode
      // Não limpamos 'professional' intencionalmente para facilitar
    }
  };

  const handleGenerateMessage = async () => {
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
    return generatedMessage || `Olá ${client.name || 'Cliente'}, aqui está o orçamento solicitado.\n\n*Resumo:*\n${items.map(i => `- ${i.description}: R$ ${(i.quantity * i.unitPrice).toFixed(2)}`).join('\n')}\n\n*Total: R$ ${subtotal.toFixed(2)}*\n\nFico à disposição!`;
  };

  const copyToClipboard = () => {
    const text = getMessageText();
    navigator.clipboard.writeText(text);
    alert('Mensagem copiada!');
  };

  const handleSendWhatsApp = () => {
    const text = getMessageText();
    // Limpa o telefone deixando apenas números
    const cleanPhone = client.phone.replace(/\D/g, '');
    
    // Se não tiver telefone, abre o WhatsApp sem número específico (usuário escolhe)
    // Se tiver, adiciona o 55 (Brasil) se não parecer ter código de país
    let url = '';
    
    if (cleanPhone.length >= 10) {
        // Assume Brasil (55) se o usuário não digitou DDI
        const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`;
    } else {
        // Apenas abre com o texto para o usuário selecionar o contato
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        if (!cleanPhone) {
            alert("Dica: Preencha o telefone do cliente lá em cima para abrir a conversa direto!");
        }
    }
    
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      
      {/* Navbar */}
      <nav className="bg-electric-600 text-white shadow-lg sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white rounded-full">
                 <Zap className="h-6 w-6 text-electric-600" />
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:inline">EletroOrça AI</span>
              <span className="font-bold text-lg tracking-tight sm:hidden">EletroOrça</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {showInstallBtn && (
                  <button 
                    onClick={handleInstallClick}
                    className="flex items-center gap-2 px-3 py-2 bg-electric-700 hover:bg-electric-800 rounded-lg transition-colors text-sm font-bold animate-pulse" 
                    title="Instalar App no Celular">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Instalar App</span>
                    <span className="sm:hidden">Instalar</span>
                  </button>
              )}
              <button 
                onClick={handleNewQuote}
                className="flex items-center gap-2 px-3 py-2 hover:bg-electric-700 rounded-lg transition-colors text-sm font-medium" 
                title="Limpar e Iniciar Novo">
                <FilePlus className="h-5 w-5" />
                <span className="hidden sm:inline">Novo</span>
              </button>
              <div className="h-6 w-px bg-electric-500 mx-2"></div>
              <button 
                onClick={handlePrint}
                className="p-2 hover:bg-electric-700 rounded-full transition-colors" title="Imprimir / Salvar PDF">
                <Printer className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Tabs (Visible only on small screens) */}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {showApiKeyWarning && (
           <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r shadow-sm no-print">
             <div className="flex items-center">
               <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
               <p className="text-red-700 text-sm">
                 <strong>Atenção:</strong> A chave de API do Gemini não foi detectada. As funcionalidades de IA não funcionarão. Adicione a chave no arquivo <code>.env</code> ou configuração.
               </p>
             </div>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Editor */}
          {/* Hidden on mobile if tab is 'preview' */}
          <div className={`space-y-6 no-print ${activeMobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
            
            {/* Professional Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Briefcase className="text-electric-500" />
                Seus Dados
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-600 mb-1">Título / Profissão</label>
                  <input
                    type="text"
                    value={professional.title}
                    onChange={(e) => setProfessional({...professional, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-electric-500 focus:border-electric-500"
                    placeholder="Eletricista Profissional"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Seu Telefone</label>
                  <input
                    type="tel"
                    value={professional.phone}
                    onChange={(e) => setProfessional({...professional, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-electric-500 focus:border-electric-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            {/* Client Info Card */}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-electric-500 focus:border-electric-500"
                    placeholder="Sr. João da Silva"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Telefone (WhatsApp)</label>
                  <input
                    type="tel"
                    value={client.phone}
                    onChange={(e) => setClient({...client, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-electric-500 focus:border-electric-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-600 mb-1">Data</label>
                   <input
                    type="date"
                    value={client.date}
                    onChange={(e) => setClient({...client, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-electric-500 focus:border-electric-500"
                   />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Endereço do Serviço</label>
                  <input
                    type="text"
                    value={client.address}
                    onChange={(e) => setClient({...client, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-electric-500 focus:border-electric-500"
                    placeholder="Rua das Flores, 123 - Centro"
                  />
                </div>
              </div>
            </div>

            {/* AI Assistant */}
            <AIAssistant onAddItems={(newItems) => setItems([...items, ...newItems])} />

            {/* Service Items */}
            <QuoteForm items={items} setItems={setItems} />
            
            {/* Notes & Validity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                   <Settings className="text-electric-500 w-5 h-5" /> Detalhes Finais
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Validade do Orçamento</label>
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
                        <label className="block text-sm font-medium text-gray-600 mb-1">Observações / Condições</label>
                        <textarea
                            rows={3}
                            value={client.notes}
                            onChange={(e) => setClient({...client, notes: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-electric-500 focus:border-electric-500"
                            placeholder="Ex: Pagamento 50% entrada e 50% na conclusão. Materiais por conta do cliente."
                        />
                    </div>
                </div>
            </div>

            {/* Final Actions / WhatsApp */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-100 p-4 sm:p-6 mb-20 lg:mb-0">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                        <Share2 className="text-indigo-600 w-5 h-5" /> Enviar Orçamento
                    </h2>
                    <button 
                        onClick={handleGenerateMessage}
                        disabled={isGeneratingMsg}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded transition-colors"
                    >
                        {isGeneratingMsg ? 'Gerando...' : 'Melhorar texto com IA'}
                    </button>
                </div>
                
                <textarea
                    value={generatedMessage}
                    onChange={(e) => setGeneratedMessage(e.target.value)}
                    className="w-full p-3 text-sm border border-indigo-200 rounded-lg bg-white h-24 mb-4 focus:ring-2 focus:ring-indigo-300 outline-none"
                    placeholder="Texto que será enviado no WhatsApp..."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                        onClick={handleSendWhatsApp}
                        disabled={items.length === 0}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors text-sm flex items-center justify-center gap-2"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Enviar no WhatsApp
                    </button>
                    <button 
                        onClick={copyToClipboard}
                        disabled={items.length === 0}
                        className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors text-sm"
                    >
                        Copiar Texto
                    </button>
                </div>

                <div className="mt-4 pt-4 border-t border-indigo-100">
                  <p className="text-xs text-indigo-800 font-semibold mb-1 flex items-center gap-1">
                    <Download className="w-3 h-3" /> Como enviar o PDF no WhatsApp?
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    1. Clique no botão <strong>Imprimir / Salvar PDF</strong> lá no topo.<br/>
                    2. Escolha "Salvar como PDF" no seu celular ou computador.<br/>
                    3. No WhatsApp, anexe o arquivo PDF salvo.
                  </p>
                </div>
            </div>

          </div>

          {/* Right Column: Preview (Printable Area) */}
          {/* Hidden on mobile if tab is 'edit' */}
          <div className={`lg:sticky lg:top-24 h-fit ${activeMobileTab === 'edit' ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-white shadow-2xl rounded-none sm:rounded-lg overflow-hidden border border-gray-200 print-section" id="quote-preview">
                
                {/* Header Strip */}
                <div className="bg-gray-800 text-white p-4 sm:p-6 border-b-4 border-electric-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">ORÇAMENTO</h1>
                            <p className="text-electric-400 font-medium mt-1 text-sm sm:text-base">SERVIÇOS ELÉTRICOS</p>
                        </div>
                        <div className="text-right">
                            <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-electric-400 ml-auto mb-2" />
                            <p className="text-xs sm:text-sm text-gray-300">Data: {new Date(client.date).toLocaleDateString('pt-BR')}</p>
                            <p className="text-xs sm:text-sm text-gray-300">Válido por: {client.validity}</p>
                        </div>
                    </div>
                </div>

                {/* Client & Professional Info */}
                <div className="p-4 sm:p-8">
                    <div className="flex flex-col md:flex-row justify-between gap-6 sm:gap-8 mb-8">
                        <div className="flex-1">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cliente</h3>
                            <p className="font-bold text-gray-800 text-lg">{client.name || 'Nome do Cliente'}</p>
                            {client.address && <p className="text-gray-600 text-sm sm:text-base">{client.address}</p>}
                            {client.phone && <p className="text-gray-600 text-sm sm:text-base">{client.phone}</p>}
                        </div>
                        <div className="flex-1 md:text-right">
                             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Prestador de Serviço</h3>
                             <p className="font-bold text-gray-800 text-lg">{professional.name}</p>
                             <p className="text-gray-600 text-sm sm:text-base">{professional.title}</p>
                             {professional.phone && <p className="text-gray-600 text-sm sm:text-base">{professional.phone}</p>}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mb-8 overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-0">
                            <thead>
                                <tr className="border-b-2 border-gray-800">
                                    <th className="py-3 text-sm font-bold text-gray-700 uppercase">Descrição</th>
                                    <th className="py-3 text-sm font-bold text-gray-700 uppercase text-center w-16 sm:w-20">Qtd</th>
                                    <th className="py-3 text-sm font-bold text-gray-700 uppercase text-right w-24 sm:w-32">Unit. (R$)</th>
                                    <th className="py-3 text-sm font-bold text-gray-700 uppercase text-right w-24 sm:w-32">Total (R$)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-400 italic">Adicione itens para visualizar</td>
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

                    {/* Notes Footer */}
                    {(client.notes) && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-8">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Observações & Condições</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{client.notes}</p>
                        </div>
                    )}
                    
                    <div className="text-center pt-8 border-t border-gray-100">
                        <p className="text-xs text-gray-400">Orçamento gerado via EletroOrça AI</p>
                    </div>

                </div>
            </div>
            
            <div className="mt-4 text-center no-print">
               <p className="text-sm text-gray-500 hidden lg:block">Visualize como ficará a impressão acima.</p>
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

export default App;