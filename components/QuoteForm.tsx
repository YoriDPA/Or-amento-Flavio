import React, { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { ServiceItem } from '../types.ts';

interface QuoteFormProps {
  items: ServiceItem[];
  setItems: React.Dispatch<React.SetStateAction<ServiceItem[]>>;
}

export const QuoteForm: React.FC<QuoteFormProps> = ({ items, setItems }) => {
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

      {/* List of existing items */}
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
            
            {/* Controls Row */}
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

      {/* Add new item form */}
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