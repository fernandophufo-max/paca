/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Paca {
  id: number;
  nome: string;
  local: string;
  data: string;
  descricao: string;
  status: 'aguardando' | 'resolvido';
  criador?: string; // e.g. "admin", "visitante@lostpaca.com"
  fotoUrl?: string; // Optional image data representing upload
}

export type PageRoute = 'landing' | 'login' | 'visitor' | 'admin';

export interface UserSession {
  email: string;
  role: 'admin' | 'visitor';
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'error' | 'warning';
}
