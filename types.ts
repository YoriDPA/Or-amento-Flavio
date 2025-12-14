export interface ServiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string; // e.g., 'un', 'm', 'h'
}

export interface ClientData {
  name: string;
  address: string;
  phone: string;
  date: string;
  validity: string; // e.g., "15 dias"
  notes: string;
}

export interface ProfessionalData {
  name: string;
  title: string;
  phone: string;
}

export interface GeneratedSuggestion {
  description: string;
  estimatedPrice: number;
  unit: string;
  reasoning?: string;
}