/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Paca } from './types';

export const INITIAL_PACAS: Paca[] = [
  { 
    id: 1, 
    nome: "Gordinha", 
    local: "Manaus, AM", 
    data: "2025-05-10", 
    descricao: "Paca grande, pelagem escura com manchas brancas", 
    status: "aguardando",
    criador: "admin"
  },
  { 
    id: 2, 
    nome: "Não identificada", 
    local: "Belém, PA", 
    data: "2025-05-12", 
    descricao: "Paca média, encontrada perto do mercado local", 
    status: "resolvido",
    criador: "admin"
  },
  { 
    id: 3, 
    nome: "Pipoca", 
    local: "Cuiabá, MT", 
    data: "2025-05-14", 
    descricao: "Filhote de paca bem pequeno, dócil, rasteja baixinho", 
    status: "aguardando",
    criador: "admin"
  },
  { 
    id: 4, 
    nome: "Farofa", 
    local: "Porto Velho, RO", 
    data: "2025-05-15", 
    descricao: "Adulta, com coleira vermelha discreta de identificação", 
    status: "aguardando",
    criador: "admin"
  },
  { 
    id: 5, 
    nome: "Não identificada", 
    local: "Macapá, AP", 
    data: "2025-05-17", 
    descricao: "Encontrada saudável perto da beira do rio, estava assustada", 
    status: "resolvido",
    criador: "admin"
  },
  { 
    id: 6, 
    nome: "Clarinha", 
    local: "São Luís, MA", 
    data: "2025-05-18", 
    descricao: "Paca jovem de pelagem marrom levemente pálida", 
    status: "aguardando",
    criador: "admin"
  }
];

const LOCAL_STORAGE_KEY = 'lostpaca_pacas_data';

// Fetch current list
export function getSavedPacas(): Paca[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Erro ao carregar do localStorage", error);
  }
  // Initialize on first-time load
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_PACAS));
  return INITIAL_PACAS;
}

// Persist the list
export function savePacas(pacas: Paca[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(pacas));
  } catch (error) {
    console.error("Erro ao salvar no localStorage", error);
  }
}
