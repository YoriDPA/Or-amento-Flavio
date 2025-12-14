import React, { useState } from 'react';
import { Sparkles, Loader2, Plus } from 'lucide-react';
import { suggestServices } from '../services/geminiService.ts';
import { GeneratedSuggestion, ServiceItem } from '../types.ts';

interface AIAssistantProps {
  onAddItems: (items: ServiceItem[]) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ onAddItems }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GeneratedSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSuggest = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const results = await suggestServices(prompt);
      setSuggestions(results);
    } catch (err) {
      setError("Erro ao conectar com a IA. Verifique sua chave API ou tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAll = () => {
    const newItems: ServiceItem[] = suggestions.map((s) => ({
      id: crypto.randomUUID(),
      description: s.description,
      quantity: 1,
      unitPrice: s.estimatedPrice,
      unit: s.unit
    }));
    onAddItems(newItems);
    setSuggestions([]);
    setPrompt('');
  };

  return (
    <div className="bg-electric-50 border border-electric-200 rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-electric-800">
        <Sparkles className="w-5 h-5" />
        <h3 className="font-semibold">Assistente Inteligente (Gemini)</h3>
      </div>
      
      <div className="space-y-3">
        <label className="block text-sm text-electric-700">
          Descreva o trabalho (ex: "Instalar 3 ventiladores de teto e trocar 2 tomadas")
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSuggest()}
            placeholder="Digite aqui o que precisa ser feito..."
            className="flex-1 px-4 py-2 border border-electric-300 rounded-lg focus:ring-2 focus:ring-electric-500 outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSuggest}
            disabled={isLoading || !prompt.trim()}
            className="bg-electric-500 hover:bg-electric-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sugerir Itens'}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        {suggestions.length > 0 && (
          <div className="mt-4 bg-white p-4 rounded-lg border border-electric-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Sugestões da IA:</h4>
            <ul className="space-y-2 mb-3">
              {suggestions.map((s, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex justify-between border-b border-gray-50 pb-1">
                  <span>{s.description}</span>
                  <span className="font-mono text-gray-500">R$ {s.estimatedPrice.toFixed(2)} / {s.unit}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
                <button 
                    onClick={handleAddAll}
                    className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded flex items-center gap-1"
                >
                    <Plus className="w-3 h-3" /> Adicionar Tudo ao Orçamento
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};