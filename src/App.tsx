/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Paca, PageRoute, UserSession, ToastMessage } from './types';
import { getSavedPacas, savePacas, INITIAL_PACAS } from './mockData';

export default function App() {
  // Navigation & Session
  const [currentRoute, setCurrentRoute] = useState<PageRoute>('landing');
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const savedUser = localStorage.getItem('lostpaca_session');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Database State (bound to localStorage via mockData helper)
  const [pacas, setPacas] = useState<Paca[]>([]);

  // Toast notifications State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Registration Form
  const [newPacaName, setNewPacaName] = useState('');
  const [newPacaLocal, setNewPacaLocal] = useState('');
  const [newPacaData, setNewPacaData] = useState(() => {
    // Default to current local date
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [newPacaDesc, setNewPacaDesc] = useState('');
  const [newPacaPhoto, setNewPacaPhoto] = useState<string>('');
  const [pacaFormError, setPacaFormError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Administrative Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'aguardando' | 'resolvido'>('Todos');

  // Trigger loading database on mount
  useEffect(() => {
    const stored = getSavedPacas();
    setPacas(stored);
    
    // Auto-restore route if session exists
    const savedSession = localStorage.getItem('lostpaca_session');
    if (savedSession) {
      try {
        const user: UserSession = JSON.parse(savedSession);
        setCurrentRoute(user.role === 'admin' ? 'admin' : 'visitor');
      } catch (err) {
        // Safe fallback
      }
    }
  }, []);

  // Utility to push Toast messages
  const addToast = (text: string, type: ToastMessage['type'] = 'success') => {
    const id = Date.now().toString() + Math.random();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Synchronized state persistence helper
  const updatePacasDatabase = (updatedList: Paca[]) => {
    setPacas(updatedList);
    savePacas(updatedList);
  };

  // Reset core database to original demo seeds
  const handleResetDatabase = () => {
    if (window.confirm("Deseja restaurar as 6 pacas pré-cadastradas originais? Novos cadastros locais serão mesclados ou substituídos.")) {
      updatePacasDatabase(INITIAL_PACAS);
      addToast("Banco de dados restaurado com os dados originais! 🦫✨", "info");
    }
  };

  // Login handler
  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    const emailLower = loginEmail.trim().toLowerCase();
    const pass = loginPassword.trim();

    if (!emailLower || !pass) {
      addToast("Por favor, preencha todos os campos do e-mail e da senha.", "error");
      return;
    }

    if (emailLower === 'admin@lostpaca.com' && pass === '123456') {
      const adminSession: UserSession = { email: 'admin@lostpaca.com', role: 'admin' };
      setCurrentUser(adminSession);
      localStorage.setItem('lostpaca_session', JSON.stringify(adminSession));
      setCurrentRoute('admin');
      addToast("Bem-vindo de volta, Administrador! Painel carregado com sucesso.", "success");
      setLoginEmail('');
      setLoginPassword('');
    } else if (emailLower === 'visitante@lostpaca.com' && pass === '123456') {
      const visitorSession: UserSession = { email: 'visitante@lostpaca.com', role: 'visitor' };
      setCurrentUser(visitorSession);
      localStorage.setItem('lostpaca_session', JSON.stringify(visitorSession));
      setCurrentRoute('visitor');
      addToast("Acesso concedido como Visitante! Reporte e gerencie pacas perdidas.", "success");
      setLoginEmail('');
      setLoginPassword('');
    } else {
      addToast("E-mail ou senha incorretos! Dica: use o Acesso Rápido abaixo.", "error");
    }
  };

  // Fill quickaccess accounts
  const handleQuickLogin = (role: 'admin' | 'visitor') => {
    if (role === 'admin') {
      setLoginEmail('admin@lostpaca.com');
      setLoginPassword('123456');
      addToast("Credenciais de Admin inseridas. Clique em Entrar!", "info");
    } else {
      setLoginEmail('visitante@lostpaca.com');
      setLoginPassword('123456');
      addToast("Credenciais de Visitante inseridas. Clique em Entrar!", "info");
    }
  };

  // Sign out handler
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('lostpaca_session');
    setCurrentRoute('landing');
    addToast("Você saiu da sua conta com segurança. Até a próxima!", "info");
  };

  // Registration upload image preview helper
  const handlePhotoUploadChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPacaPhoto(reader.result as string);
        addToast("Foto carregada para visualização temporária! 📸", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  // Paca Registration form submit
  const handleRegisterPacaSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPacaFormError('');

    if (!newPacaLocal.trim()) {
      setPacaFormError("A localização onde a paca foi avistada é obrigatória.");
      addToast("Erro no cadastro: Informe a localização.", "error");
      return;
    }
    if (!newPacaData) {
      setPacaFormError("A data do encontro é obrigatória.");
      addToast("Erro no cadastro: Selecione a data.", "error");
      return;
    }
    if (!newPacaDesc.trim()) {
      setPacaFormError("Adicione uma breve descrição física sobre a paca avistada.");
      addToast("Erro no cadastro: Forneça a descrição.", "error");
      return;
    }

    // Determine name fallback
    const resolvedName = newPacaName.trim() || "Não identificada";

    // Create item
    const nextId = pacas.length > 0 ? Math.max(...pacas.map(p => p.id)) + 1 : 1;
    const newPaca: Paca = {
      id: nextId,
      nome: resolvedName,
      local: newPacaLocal.trim(),
      data: newPacaData,
      descricao: newPacaDesc.trim(),
      status: 'aguardando',
      criador: currentUser?.email || 'visitante@lostpaca.com',
      fotoUrl: newPacaPhoto || undefined
    };

    const updatedList = [newPaca, ...pacas];
    updatePacasDatabase(updatedList);
    
    // Clear forms and show spectacular visual success
    setNewPacaName('');
    setNewPacaLocal('');
    setNewPacaDesc('');
    setNewPacaPhoto('');
    setRegistrationSuccess(true);
    addToast(`Alerta emitido! Paca "${resolvedName}" registrada sob código #${nextId}! 🚨`, "success");
  };

  // Delete Paca (Admin task)
  const handleDeletePaca = (id: number) => {
    const target = pacas.find(p => p.id === id);
    if (!target) return;
    
    if (window.confirm(`Tem certeza que deseja remover o registro da paca "${target.nome}" (ID #${target.id}) permanentemente?`)) {
      const updated = pacas.filter(p => p.id !== id);
      updatePacasDatabase(updated);
      addToast(`Registro da paca #${id} removido definitivamente.`, "warning");
    }
  };

  // Settle / Toggle Status (Admin task)
  const handleToggleResolved = (id: number) => {
    const updated = pacas.map(p => {
      if (p.id === id) {
        const nextStatus: Paca['status'] = p.status === 'aguardando' ? 'resolvido' : 'aguardando';
        addToast(`Registro #${id} status alterado para "${nextStatus.toUpperCase()}"! 🎉`, "success");
        return { ...p, status: nextStatus };
      }
      return p;
    });
    updatePacasDatabase(updated);
  };

  // Filter calculations
  const filteredPacas = pacas.filter(item => {
    // String search match
    const textToSearch = `${item.nome} ${item.local} ${item.descricao} ${item.data} #${item.id}`.toLowerCase();
    const matchesSearch = textToSearch.includes(searchQuery.toLowerCase());
    
    // Status filter match
    const matchesStatus = statusFilter === 'Todos' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Dynamic statistics calculations combined with user database state
  const totalPacasRegistered = pacas.length;
  const totalSolved = pacas.filter(p => p.status === 'resolvido').length;
  const totalWaiting = pacas.filter(p => p.status === 'aguardando').length;
  
  // States mapped
  const uniqueStatesCount = Array.from(new Set(pacas.map(p => {
    const parts = p.local.split(',');
    return parts[parts.length - 1]?.trim() || '';
  }))).filter(Boolean).length;

  return (
    <div className="bg-ambient font-sans text-stone-100 min-h-screen relative flex flex-col selection:bg-paca-green-lime/35 selection:text-white">
      {/* Bioluminescent Background Vectors */}
      <div className="bg-particles"></div>
      
      {/* Dynamic ambient blur blobs mapping Natural Tones theme */}
      <div className="absolute top-10 right-20 w-64 h-64 bg-[#4A7C2F] rounded-full blur-[120px] opacity-20 pointer-events-none z-0"></div>
      <div className="absolute bottom-10 left-20 w-80 h-80 bg-[#6B3A2A] rounded-full blur-[140px] opacity-20 pointer-events-none z-0"></div>

      {/* Dynamic Toast Alerts Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`glass-panel p-4 rounded-xl flex items-start gap-3 shadow-2xl border-l-[6px] animate-fade-in transition-all duration-300 ${
              t.type === 'error' ? 'border-red-500 bg-red-950/40' :
              t.type === 'warning' ? 'border-orange-500 bg-orange-950/40' :
              t.type === 'info' ? 'border-amber-400 bg-stone-900/60' :
              'border-paca-green-lime bg-stone-900/60'
            }`}
          >
            <div className="text-xl">
              {t.type === 'error' ? '❌' :
               t.type === 'warning' ? '⚠️' :
               t.type === 'info' ? 'ℹ️' : '✅'}
            </div>
            <div className="text-sm font-medium leading-normal flex-1">
              {t.text}
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 1. LANDING PAGE VIEW */}
      {/* ========================================================================= */}
      {currentRoute === 'landing' && (
        <div className="flex-1 flex flex-col z-10">
          {/* Header */}
          <header className="sticky top-0 left-0 w-full z-40 px-10 h-20 flex items-center justify-between bg-white/5 backdrop-blur-lg border-b border-white/10">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentRoute('landing')}>
              <img 
                src="https://cdn.prod.website-files.com/5b44edefca321a1e2d0c2aa6/5f2565fdd9b79a7503e19888_Dimensions-Animals-Rodents-Lowland-Paca-Icon.svg" 
                alt="Lost Paca Logo" 
                className="w-10 h-10 object-contain filter invert opacity-90 [filter:drop-shadow(0_0_8px_rgba(122,182,72,0.5))]" 
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Lost Paca<span className="text-paca-green-lime text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-paca-green-forest/40 border border-paca-green-lime/20">SPA</span>
                </h1>
                <p className="text-[10px] text-paca-brown-gold font-medium tracking-wide uppercase hidden sm:block">
                  Nenhuma paca se perde para sempre
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <span className="text-stone-300 text-xs hidden md:inline-block">
                    Conectado como: <strong className="text-paca-brown-gold">{currentUser.email}</strong>
                  </span>
                  <button 
                    onClick={() => setCurrentRoute(currentUser.role === 'admin' ? 'admin' : 'visitor')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-paca-green-forest hover:bg-paca-green-light border border-paca-green-lime/30 text-white cursor-pointer transition-all duration-200"
                  >
                    🚀 Ir para Meu Painel
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="p-2 rounded-xl hover:bg-red-950/30 text-red-400 border border-red-900/30 text-sm flex items-center justify-center cursor-pointer transition-all duration-200"
                    title="Sair da Conta"
                  >
                    🚪
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setCurrentRoute('login')}
                  className="px-6 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all text-white cursor-pointer text-xs sm:text-sm shadow-md"
                >
                  Login / Admin
                </button>
              )}
            </div>
          </header>

          {/* Main Hero Section */}
          <main className="flex-1 max-w-7xl mx-auto px-6 py-10 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 flex flex-col gap-6 text-center lg:text-left">
              <div className="inline-flex self-center lg:self-start items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-paca-brown-medium/30 border border-paca-brown-gold/30 text-paca-brown-gold">
                <span>🌳</span> Portal Oficial de Busca e Resgate de Roedores
              </div>
              
              <h2 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
                Nenhuma paca se <br className="hidden sm:inline" />
                <span className="text-paca-green-lime font-bold">perde para sempre</span>
              </h2>
              
              <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans">
                A primeira plataforma dedicada ao resgate e monitoramento de pacas perdidas. Conectamos heróis anônimos a donos preocupados, unindo biólogos e apaixonados pela fauna para reatar esses laços.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-4">
                <button 
                  onClick={() => {
                    if (currentUser) {
                      setCurrentRoute('visitor');
                    } else {
                      addToast("Por favor, faça o login para preencher o formulário de avistamento.", "info");
                      setCurrentRoute('login');
                    }
                  }}
                  className="px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-transform flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(to right, #8B5E3C, #4A7C2F)' }}
                >
                  <span>📢</span> Reportar Paca Encontrada
                </button>
                
                <a 
                  href="#pacas-list-anchor"
                  className="px-8 py-4 rounded-xl font-bold text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🔍</span> Ver Pacas Perdidas
                </a>
              </div>
            </div>

            {/* Hero Right Decorative Paca Character */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-72 h-72 sm:w-85 sm:h-85 flex items-center justify-center animate-pulse duration-4000">
                {/* Backlighting effect container */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-paca-brown-medium/40 to-paca-green-light/40 blur-[40px] z-0 animate-spin duration-10000"></div>
                
                {/* Glassmorphic sphere for logo layout */}
                <div className="w-64 h-64 sm:w-72 sm:h-72 glass-panel rounded-full flex flex-col items-center justify-center border-white/15 relative z-10 shadow-2xl p-8">
                  {/* High Quality SVG Lowland Paca Mascot */}
                  <img 
                    src="https://cdn.prod.website-files.com/5b44edefca321a1e2d0c2aa6/5f2565fdd9b79a7503e19888_Dimensions-Animals-Rodents-Lowland-Paca-Icon.svg" 
                    alt="Lowland Paca Mascot" 
                    className="w-40 h-40 object-contain filter invert opacity-95 transition-transform duration-500 hover:rotate-6 [filter:drop-shadow(0_15px_15px_rgba(0,0,0,0.6))_drop-shadow(0_0_20px_rgba(122,182,72,0.3))]" 
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Subtle caption bubble */}
                  <div className="absolute -bottom-2 bg-gradient-to-r from-paca-brown-medium to-paca-green-forest border border-white/20 px-4 py-1.5 rounded-full shadow-lg text-center">
                    <p className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase">
                      #LOSTPACA-MASCOT
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Statistics Section (Fake stats requested but updating with real Local database numbers) */}
          <section className="py-12 bg-black/20 border-y border-white/5 relative z-10">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                
                <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center">
                  <img 
                    src="https://cdn.prod.website-files.com/5b44edefca321a1e2d0c2aa6/5f2565fdd9b79a7503e19888_Dimensions-Animals-Rodents-Lowland-Paca-Icon.svg" 
                    alt="Paca Icon" 
                    className="w-10 h-10 object-contain filter invert opacity-80 mb-1" 
                    referrerPolicy="no-referrer"
                  />
                  <h4 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {totalPacasRegistered + 41}
                  </h4>
                  <p className="text-xs sm:text-sm text-paca-brown-gold font-medium mt-1">Pacas Cadastradas</p>
                </div>

                <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center">
                  <span className="text-3xl mb-1">🏡</span>
                  <h4 className="text-3xl sm:text-4xl font-extrabold text-paca-green-lime tracking-tight">
                    {totalSolved + 10}
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-200 font-medium mt-1">Reunidas com Donos</p>
                </div>

                <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center">
                  <span className="text-3xl mb-1">⏳</span>
                  <h4 className="text-3xl sm:text-4xl font-extrabold text-amber-400 tracking-tight">
                    {totalWaiting}
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-200 font-medium mt-1">Buscas Ativas</p>
                </div>

                <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center">
                  <span className="text-3xl mb-1">🗺️</span>
                  <h4 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {Math.max(5, uniqueStatesCount)}
                  </h4>
                  <p className="text-xs sm:text-sm text-paca-brown-gold font-medium mt-1">Estados Cobertos</p>
                </div>

              </div>
            </div>
          </section>

          {/* How It Works Section (3 glass cards requested: Encontrou → Cadastre → Conecte) */}
          <section className="py-16 max-w-7xl mx-auto px-6 z-10">
            <div className="text-center max-w-xl mx-auto mb-12">
              <h3 className="font-serif text-3xl font-bold text-white mb-3">Como Funciona a Lost Paca?</h3>
              <p className="text-stone-400 text-sm">Praticidade absoluta para conectar quem localiza o roedor ao detentor cadastrado.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="glass-panel glass-panel-hover p-8 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-paca-brown-medium/20 to-transparent rounded-tr-3xl"></div>
                <div className="w-12 h-12 rounded-2xl bg-paca-brown-medium/30 border border-paca-brown-gold/40 flex items-center justify-center text-2xl mb-6">
                  🧭
                </div>
                <h4 className="text-xl font-bold text-white mb-2">1. Encontrou</h4>
                <p className="text-stone-300 text-sm leading-relaxed">
                  Avistou uma paca assustada em local atípico ou resgatou uma paca perdida na sua propriedade? Anote os dados do local com carinho.
                </p>
              </div>

              {/* Card 2 */}
              <div className="glass-panel glass-panel-hover p-8 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-paca-green-forest/20 to-transparent rounded-tr-3xl"></div>
                <div className="w-12 h-12 rounded-2xl bg-paca-green-forest/30 border border-paca-green-lime/40 flex items-center justify-center text-2xl mb-6">
                  📝
                </div>
                <h4 className="text-xl font-bold text-white mb-2">2. Cadastre</h4>
                <p className="text-stone-300 text-sm leading-relaxed">
                  Escreva os detalhes no formulário: mencione marcas especiais do pelo, tamanho, anexe uma imagem se tiver e especifique a cidade e data.
                </p>
              </div>

              {/* Card 3 */}
              <div className="glass-panel glass-panel-hover p-8 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-paca-brown-gold/20 to-transparent rounded-tr-3xl"></div>
                <div className="w-12 h-12 rounded-2xl bg-paca-brown-gold/20 border border-paca-brown-gold/40 flex items-center justify-center text-2xl mb-6">
                  🤝
                </div>
                <h4 className="text-xl font-bold text-white mb-2">3. Conecte</h4>
                <p className="text-stone-300 text-sm leading-relaxed">
                  O painel administrativo consolida a paca de forma pública. Biólogos ou os devidos donos entram em contato para proceder o resgate assistido.
                </p>
              </div>
            </div>
          </section>

          {/* Interactive Public Search List Section */}
          <section id="pacas-list-anchor" className="py-16 bg-stone-950/25 border-t border-white/5 relative z-10 scroll-mt-20">
            <div className="max-w-7xl mx-auto px-6">
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                  <h3 className="font-serif text-3xl font-bold text-white mb-2">🔍 Pacas Sob Monitoramento</h3>
                  <p className="text-stone-400 text-sm">Pesquise em tempo real os avistamentos anunciados no território nacional.</p>
                </div>
                
                {/* Embedded dynamic real-time filter bar */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <input 
                      type="text"
                      placeholder="Pesquisar local, nome, id..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full glass-input px-4 py-2.5 rounded-xl text-stone-100 text-xs pr-10"
                    />
                    <span className="absolute right-3.5 top-3 text-stone-400 text-xs">🔍</span>
                  </div>

                  <div className="flex bg-stone-900/50 p-1 rounded-xl border border-white/5">
                    {(['Todos', 'aguardando', 'resolvido'] as const).map(pill => (
                      <button
                        key={pill}
                        onClick={() => setStatusFilter(pill)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all duration-200 ${
                          statusFilter === pill 
                            ? 'bg-gradient-to-r from-paca-brown-medium to-paca-green-forest text-white shadow-md' 
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {pill === 'Todos' ? 'Todos' : pill === 'aguardando' ? 'Aguardando' : 'Resolvido'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pacas Output List Grid */}
              {filteredPacas.length === 0 ? (
                <div className="glass-panel text-center py-16 rounded-3xl border-dashed border-white/10 max-w-md mx-auto">
                  <span className="text-5xl mb-4 block">🦦</span>
                  <p className="text-stone-300 font-bold text-lg">Nenhuma paca encontrada</p>
                  <p className="text-stone-500 text-xs mt-2">Dica: Reduza o filtro ou procure por outro termo para avistar registros cadastrados.</p>
                  {searchQuery && (
                    <button 
                      onClick={() => { setSearchQuery(''); setStatusFilter('Todos'); }}
                      className="mt-4 px-4 py-2 rounded-xl text-xs bg-paca-brown-medium hover:bg-paca-brown-light text-white"
                    >
                      Limpar Filtro
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPacas.map(paca => (
                    <div 
                      key={paca.id} 
                      className="glass-panel rounded-2xl overflow-hidden hover:scale-102 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between border-white/10"
                    >
                      {/* Photo Header block */}
                      <div className="relative h-44 bg-gradient-to-tr from-paca-brown-dark to-paca-green-dark flex items-center justify-center overflow-hidden border-b border-white/5">
                        {paca.fotoUrl ? (
                          <img 
                            src={paca.fotoUrl} 
                            alt={paca.nome} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                            <img 
                              src="https://cdn.prod.website-files.com/5b44edefca321a1e2d0c2aa6/5f2565fdd9b79a7503e19888_Dimensions-Animals-Rodents-Lowland-Paca-Icon.svg" 
                              alt="Sem foto" 
                              className="w-16 h-16 object-contain filter invert opacity-50 [filter:drop-shadow(0_4px_6px_rgba(0,0,0,0.3))]" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2 right-2 text-[9px] font-mono bg-white/10 border border-white/10 text-stone-300 px-2 py-0.5 rounded-full">
                              Sem foto anexada
                            </div>
                          </div>
                        )}
                        
                        {/* Status absolute tag */}
                        <div className="absolute top-3 left-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg border ${
                            paca.status === 'resolvido' 
                              ? 'bg-paca-green-forest/90 border-paca-green-lime text-white' 
                              : 'bg-stone-900/90 border-amber-400 text-amber-400'
                          }`}>
                            {paca.status === 'resolvido' ? '✅ Resolvido' : '⏳ Aguardando'}
                          </span>
                        </div>

                        {/* ID tag absolute */}
                        <div className="absolute bottom-3 right-3 bg-black/50 border border-white/10 px-2.5 py-0.5 rounded-md text-[10px] text-stone-300 font-mono">
                          ID #{paca.id}
                        </div>
                      </div>

                      {/* Info body */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h4 className="font-serif text-xl font-bold text-white text-ellipsis overflow-hidden">
                              {paca.nome}
                            </h4>
                          </div>
                          
                          <p className="text-stone-300 text-xs leading-relaxed line-clamp-3 mb-4">
                            {paca.descricao}
                          </p>
                        </div>

                        <div className="space-y-2 pt-3 border-t border-white/5 text-[11px] text-stone-400">
                          <div className="flex items-center gap-2">
                            <span>📍</span>
                            <span className="font-medium text-stone-200">{paca.local}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>📅</span>
                            <span>Data do Encontro: <strong className="text-stone-300">{paca.data}</strong></span>
                          </div>
                          {paca.criador && (
                            <div className="text-[9px] font-mono text-stone-500 text-right">
                              Por: {paca.criador === 'admin' ? '🛡️ Administrador' : paca.criador}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Footer view */}
          <footer className="mt-auto border-t border-white/5 py-10 bg-black/40 z-10 text-center relative">
            <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <img 
                    src="https://cdn.prod.website-files.com/5b44edefca321a1e2d0c2aa6/5f2565fdd9b79a7503e19888_Dimensions-Animals-Rodents-Lowland-Paca-Icon.svg" 
                    alt="Paca Logo" 
                    className="w-5 h-5 object-contain filter invert opacity-70" 
                    referrerPolicy="no-referrer"
                  />
                  <p className="text-sm font-serif font-semibold text-white">Lost Paca</p>
                </div>
                <p className="text-stone-500 text-xs mt-1">"Nenhuma paca se perde para sempre" — Criado para a preservação local.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleResetDatabase}
                  className="px-3.5 py-1.5 rounded-lg text-[10px] font-mono text-paca-brown-gold border border-paca-brown-gold/40 hover:bg-paca-brown-gold/10 hover:text-white cursor-pointer transition-all duration-200"
                >
                  ⚙️ Restaurar Originais Mockados
                </button>
                <p className="text-stone-600 text-xs ml-4">
                  © 2026 Lost Paca.
                </p>
              </div>
            </div>
          </footer>
        </div>
      )}


      {/* ========================================================================= */}
      {/* 2. TELA DE LOGIN VIEW */}
      {/* ========================================================================= */}
      {currentRoute === 'login' && (
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-16 z-10">
          
          <div className="w-full max-w-sm flex flex-col gap-6">
            
            {/* Main Glass login card */}
            <div className="glass-panel p-8 rounded-3xl shadow-2xl relative overflow-hidden border-white/10">
              {/* Back to home float */}
              <button 
                onClick={() => setCurrentRoute('landing')}
                className="absolute top-4 right-4 text-xs font-semibold text-paca-brown-gold hover:text-white cursor-pointer flex items-center gap-1 transition-colors"
              >
                ↩ Voltar
              </button>

              <div className="text-center mb-6 mt-2">
                <img 
                  src="https://cdn.prod.website-files.com/5b44edefca321a1e2d0c2aa6/5f2565fdd9b79a7503e19888_Dimensions-Animals-Rodents-Lowland-Paca-Icon.svg" 
                  alt="Lost Paca Logo" 
                  className="w-14 h-14 object-contain mx-auto filter invert opacity-90 animate-pulse mb-2" 
                  referrerPolicy="no-referrer"
                />
                <h3 className="font-serif text-2xl font-bold text-white mt-3">Acesso à Plataforma</h3>
                <p className="text-stone-400 text-xs mt-1">Entre para reportar ou gerenciar avistamentos</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-stone-300 text-xs font-semibold mb-1.5 pl-1 uppercase tracking-wider">
                    E-mail de Acesso
                  </label>
                  <input 
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ex: visitante@lostpaca.com"
                    className="w-full glass-input px-4 py-2.5 rounded-xl text-xs placeholder:text-stone-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 text-xs font-semibold mb-1.5 pl-1 uppercase tracking-wider">
                    Senha de Segurança
                  </label>
                  <input 
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="******"
                    className="w-full glass-input px-4 py-2.5 rounded-xl text-xs placeholder:text-stone-500"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-paca-brown-light to-paca-green-light hover:brightness-110 shadow-lg text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all duration-200 cursor-pointer text-center"
                  >
                    🔑 Entrar
                  </button>
                </div>
              </form>

              <div className="text-center mt-6 pt-4 border-t border-white/5">
                <button 
                  onClick={() => setCurrentRoute('landing')}
                  className="text-stone-400 hover:text-white text-xs underline cursor-pointer"
                >
                  Voltar para o início
                </button>
              </div>
            </div>

            {/* Quick access shortcut cards (requested by user) */}
            <div className="glass-panel p-5 rounded-2xl text-center border-white/10 flex flex-col gap-3">
              <h4 className="text-[10px] font-mono tracking-widest uppercase text-paca-brown-gold font-bold">
                🛡️ Acesso Rápido Simulado
              </h4>
              <p className="text-stone-400 text-[11px] leading-snug">
                Utilize os atalhos abaixo para preencher as credenciais exigidas e testar os perfis.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button 
                  onClick={() => handleQuickLogin('visitor')}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-stone-200 transition-colors cursor-pointer text-ellipsis overflow-hidden"
                >
                  👤 Visitante
                </button>
                <button 
                  onClick={() => handleQuickLogin('admin')}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-stone-200 transition-colors cursor-pointer text-ellipsis overflow-hidden"
                >
                  🛡️ Admin
                </button>
              </div>
            </div>

          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* 3. ÁREA DO VISITANTE VIEW */}
      {/* ========================================================================= */}
      {currentRoute === 'visitor' && (
        <div className="flex-1 flex flex-col z-10">
          
          {/* Visitor Header */}
          <header className="glass-panel sticky top-0 left-0 w-full z-40 px-6 py-4 flex items-center justify-between border-t-0 border-x-0 rounded-b-2xl">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentRoute('landing')}>
              <img 
                src="https://cdn.prod.website-files.com/5b44edefca321a1e2d0c2aa6/5f2565fdd9b79a7503e19888_Dimensions-Animals-Rodents-Lowland-Paca-Icon.svg" 
                alt="Lost Paca Logo" 
                className="w-10 h-10 object-contain filter invert opacity-90 [filter:drop-shadow(0_0_8px_rgba(122,182,72,0.5))]" 
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Área do Visitante
                </h1>
                <p className="text-[10px] text-paca-brown-gold font-medium tracking-wide uppercase">
                  Central de Reportes Locais
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-stone-300 text-xs hidden sm:inline-block font-mono">
                Sessão: <span className="text-paca-green-lime">{currentUser?.email}</span>
              </span>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-red-950/20 hover:text-red-400 border border-white/10 cursor-pointer transition-colors"
              >
                🚪 Sair
              </button>
            </div>
          </header>

          <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Form Column - Left */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              {/* Form card */}
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border-white/10 relative">
                <div className="mb-6">
                  <span className="text-3xl">🚨</span>
                  <h3 className="font-serif text-2xl font-bold text-white mt-2">Reportar Paca Encontrada</h3>
                  <p className="text-stone-400 text-xs mt-1">Forneça os dados honestos para ajudar os biólogos e localizadores.</p>
                </div>

                {pacaFormError && (
                  <div className="bg-red-950/40 border border-red-900/40 text-red-400 p-3.5 rounded-xl text-xs font-semibold mb-4 animate-shake">
                    ⚠️ {pacaFormError}
                  </div>
                )}

                <form onSubmit={handleRegisterPacaSubmit} className="space-y-4">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-300 text-xs font-semibold mb-1 uppercase tracking-wider pl-1">
                        Nome/Apelido <span className="text-stone-500 text-[10px]">(Opcional)</span>
                      </label>
                      <input 
                        type="text"
                        value={newPacaName}
                        onChange={(e) => setNewPacaName(e.target.value)}
                        placeholder="Ex: Gordinha"
                        className="w-full glass-input px-3.5 py-2 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-300 text-xs font-semibold mb-1 uppercase tracking-wider pl-1">
                        Data do Encontro
                      </label>
                      <input 
                        type="date"
                        required
                        value={newPacaData}
                        onChange={(e) => setNewPacaData(e.target.value)}
                        className="w-full glass-input px-3.5 py-2 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-300 text-xs font-semibold mb-1 uppercase tracking-wider pl-1">
                      Localização do Encontro
                    </label>
                    <input 
                      type="text"
                      required
                      value={newPacaLocal}
                      onChange={(e) => setNewPacaLocal(e.target.value)}
                      placeholder="Ex: Manaus, AM (Cidade, Bairro ou Estado)"
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-300 text-xs font-semibold mb-1 uppercase tracking-wider pl-1">
                      Descrição Física e Comportamento
                    </label>
                    <textarea 
                      required
                      value={newPacaDesc}
                      onChange={(e) => setNewPacaDesc(e.target.value)}
                      rows={3}
                      placeholder="Relate traços físicos, pelagem, manchas, tamanho estimado e se o roedor aparentava estar manso ou machucado..."
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs leading-relaxed resize-none"
                    />
                  </div>

                  {/* UI Photo Upload mimicking action with instant base64 parsing */}
                  <div>
                    <label className="block text-stone-300 text-xs font-semibold mb-1 uppercase tracking-wider pl-1">
                      Anexar Foto da Paca <span className="text-stone-500 text-[10px]">(Opcional)</span>
                    </label>
                    
                    <div className="flex items-center gap-4">
                      <label className="flex flex-col items-center justify-center pointer-events-auto px-4 py-3 bg-stone-900/60 border border-white/10 rounded-xl cursor-pointer hover:bg-stone-900 text-xs text-stone-300 hover:text-white transition-colors">
                        <span>📸 Selecionar Arquivo</span>
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUploadChange}
                          className="hidden"
                        />
                      </label>
                      
                      {newPacaPhoto ? (
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-paca-green-lime/40 group">
                          <img 
                            src={newPacaPhoto} 
                            alt="Miniatura"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <button 
                            type="button"
                            onClick={() => setNewPacaPhoto('')}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-red-400 font-bold transition-opacity"
                          >
                            Excluir
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-stone-500 italic">Nenhum arquivo de imagem anexado.</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-paca-brown-light to-paca-green-light hover:brightness-110 shadow-lg text-white font-bold text-xs uppercase tracking-widest rounded-xl cursor-pointer"
                    >
                      🚀 Cadastrar Paca Encontrada
                    </button>
                  </div>
                </form>
              </div>

            </div>

            {/* List Column - Right */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              {/* Form success popup inside visitor panel if they register */}
              {registrationSuccess && (
                <div className="glass-panel p-6 rounded-3xl bg-paca-green-forest/20 border-paca-green-lime/40 animate-fade-in relative flex items-start gap-4">
                  <span className="text-4xl">🎉</span>
                  <div className="flex-1">
                    <h4 className="text-white font-sans font-bold text-base">Cadastro Concluído com Sucesso!</h4>
                    <p className="text-stone-300 text-xs mt-1">
                      O registro foi catalogado com sucesso. Ele passará agora pela avaliação dos administradores e já está listado publicamente no website.
                    </p>
                    <button 
                      onClick={() => setRegistrationSuccess(false)}
                      className="mt-3 px-3 py-1 bg-paca-green-forest hover:bg-paca-green-light text-white font-mono text-[10px] rounded-lg transition-colors"
                    >
                      Dispensar Mensagem [x]
                    </button>
                  </div>
                </div>
              )}

              {/* Visitor List Panel */}
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border-white/10 flex-1 flex flex-col">
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-white">Seus Cadastros Ativos</h3>
                    <p className="text-stone-400 text-xs">Pistas reportadas por você nesta sessão local</p>
                  </div>
                  <span className="text-3xl">🗂️</span>
                </div>

                {/* Filter list where creator matches visitor session email */}
                {pacas.filter(p => p.criador === currentUser?.email).length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 text-center border-dashed border-2 border-white/5 rounded-2xl min-h-[250px]">
                    <span className="text-4xl mb-3">📍</span>
                    <p className="text-stone-300 font-bold text-sm">Você ainda não enviou reportes</p>
                    <p className="text-stone-500 text-[11px] max-w-xs mt-1.5 leading-relaxed">
                      Utilize o formulário ao lado para cadastrar sua primeira paca encontrada e visualize o status de monitoramento aqui.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                    {pacas.filter(p => p.criador === currentUser?.email).map(visitorPaca => (
                      <div 
                        key={visitorPaca.id} 
                        className="glass-panel p-4 rounded-xl border-white/5 bg-stone-900/40 hover:bg-stone-900/60 transition-colors flex items-start gap-4"
                      >
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-xl bg-paca-brown-medium/20 border border-paca-brown-gold/20 flex-shrink-0 flex items-center justify-center text-xl">
                          {visitorPaca.fotoUrl ? (
                            <img 
                              src={visitorPaca.fotoUrl} 
                              alt="Paca" 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <img 
                              src="https://cdn.prod.website-files.com/5b44edefca321a1e2d0c2aa6/5f2565fdd9b79a7503e19888_Dimensions-Animals-Rodents-Lowland-Paca-Icon.svg" 
                              alt="Paca Thumbnail" 
                              className="w-8 h-8 object-contain filter invert opacity-60" 
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>

                        {/* Text Information */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-white truncate">{visitorPaca.nome}</h4>
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                              {visitorPaca.status === 'resolvido' ? '✅ Resolvido' : '⏳ Aguardando'}
                            </span>
                          </div>
                          
                          <p className="text-stone-400 text-[11px] leading-normal line-clamp-2 mt-1">
                            {visitorPaca.descricao}
                          </p>

                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5 text-[9px] text-stone-500">
                            <span>Local: <strong className="text-stone-300">{visitorPaca.local}</strong></span>
                            <span>Encontrada: <strong className="text-stone-300">{visitorPaca.data}</strong></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
              </div>
            </div>

          </main>
        </div>
      )}


      {/* ========================================================================= */}
      {/* 4. PAINEL ADMINISTRATIVO (ADMIN CENTER) VIEW */}
      {/* ========================================================================= */}
      {currentRoute === 'admin' && (
        <div className="flex-1 flex flex-col z-10">
          
          {/* Admin Header */}
          <header className="glass-panel sticky top-0 left-0 w-full z-40 px-6 py-4 flex items-center justify-between border-t-0 border-x-0 rounded-b-2xl">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentRoute('landing')}>
              <span className="text-3xl">🛡️</span>
              <div>
                <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Painel Administrativo
                </h1>
                <p className="text-[10px] text-paca-brown-gold font-medium tracking-wide uppercase">
                  Sistema de Triagem & Auditoria
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-stone-300 text-xs hidden md:inline-block font-mono">
                Admin Auth: <span className="text-paca-green-lime">Gerencial Ativo</span>
              </span>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-red-950/20 hover:text-red-400 border border-white/10 cursor-pointer transition-colors"
              >
                🚪 Sair do Painel
              </button>
            </div>
          </header>

          <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full flex flex-col gap-8">
            
            {/* Metric Board (requested by user: Total, Resolvido, Aguardando, Regiões) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              <div className="glass-panel p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group border-white/10">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-paca-brown-gold font-bold">Total Cadastrado</p>
                  <h4 className="text-3xl font-extrabold text-white">{totalPacasRegistered}</h4>
                  <p className="text-[9px] text-stone-400">Registros em memória</p>
                </div>
                <span className="text-4xl filter saturate-75 group-hover:scale-110 transition-transform">🗂️</span>
              </div>

              <div className="glass-panel p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group border-white/10">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-paca-green-lime font-bold">Casos Resolvidos</p>
                  <h4 className="text-3xl font-extrabold text-paca-green-lime">{totalSolved}</h4>
                  <p className="text-[9px] text-stone-400">Famílias reunidas</p>
                </div>
                <span className="text-4xl filter saturate-75 group-hover:scale-110 transition-transform">✅</span>
              </div>

              <div className="glass-panel p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group border-white/10">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold">Casos Ativos</p>
                  <h4 className="text-3xl font-extrabold text-amber-400">{totalWaiting}</h4>
                  <p className="text-[9px] text-stone-400">Aguardando contato</p>
                </div>
                <span className="text-4xl filter saturate-75 group-hover:scale-110 transition-transform">⏳</span>
              </div>

              <div className="glass-panel p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group border-white/10">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-stone-300 font-bold">Regiões Ativas</p>
                  <h4 className="text-3xl font-extrabold text-stone-100">{uniqueStatesCount}</h4>
                  <p className="text-[9px] text-stone-400">Pistas estaduais</p>
                </div>
                <span className="text-4xl filter saturate-75 group-hover:scale-110 transition-transform">📍</span>
              </div>

            </div>

            {/* Central Table Box */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border-white/10 flex-1 flex flex-col">
              
              {/* Filter controls and searching */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
                
                <div>
                  <h2 className="font-serif text-2xl font-bold text-white">Triagem de Avistamentos</h2>
                  <p className="text-stone-400 text-xs">Aprovação, alteração de status operacional ou eliminação de registros.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Pesquisar registros..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-60 glass-input px-3 py-2 rounded-xl text-stone-100 text-xs pr-10"
                    />
                    <span className="absolute right-3.5 top-2.5 text-stone-400 text-xs">🔍</span>
                  </div>

                  <div className="flex bg-stone-900/50 p-1 rounded-xl border border-white/5">
                    {(['Todos', 'aguardando', 'resolvido'] as const).map(pill => (
                      <button
                        key={pill}
                        onClick={() => setStatusFilter(pill)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 ${
                          statusFilter === pill 
                            ? 'bg-gradient-to-r from-paca-brown-medium to-paca-green-forest text-white shadow-md' 
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {pill === 'Todos' ? 'Todos' : pill === 'aguardando' ? 'Aguardando' : 'Resolvido'}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Responsive Container: vira cards no mobile/small, tabela no large */}
              {filteredPacas.length === 0 ? (
                <div className="text-center py-16">
                  <img 
                    src="https://cdn.prod.website-files.com/5b44edefca321a1e2d0c2aa6/5f2565fdd9b79a7503e19888_Dimensions-Animals-Rodents-Lowland-Paca-Icon.svg" 
                    alt="Paca Fallback" 
                    className="w-16 h-16 object-contain mx-auto filter invert opacity-50 mb-2" 
                    referrerPolicy="no-referrer"
                  />
                  <p className="text-stone-300 font-bold">Nenhum registro encontrado</p>
                  <p className="text-stone-500 text-xs mt-1">Nenhum cadastro de paca bate com essas diretrizes de busca.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table Layout - Hidden on mobile, block on MD */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-paca-brown-gold">
                          <th className="py-3 px-4">ID</th>
                          <th className="py-3 px-4">Nome/Apelido</th>
                          <th className="py-3 px-4">Localização</th>
                          <th className="py-3 px-4">Data do Registro</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Ações Gerenciais</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredPacas.map(paca => (
                          <tr key={paca.id} className="hover:bg-white/5 transition-colors text-xs text-stone-200">
                            <td className="py-4 px-4 font-mono font-bold text-stone-400">#{paca.id}</td>
                            
                            <td className="py-4 px-4 font-semibold text-white">
                              <div className="flex items-center gap-2">
                                {paca.fotoUrl ? (
                                  <img 
                                    src={paca.fotoUrl} 
                                    alt="Foto" 
                                    referrerPolicy="no-referrer"
                                    className="w-7 h-7 rounded-md object-cover border border-white/10"
                                  />
                                ) : (
                                  <img 
                                    src="https://cdn.prod.website-files.com/5b44edefca321a1e2d0c2aa6/5f2565fdd9b79a7503e19888_Dimensions-Animals-Rodents-Lowland-Paca-Icon.svg" 
                                    alt="Sem foto" 
                                    className="w-7 h-7 object-contain filter invert opacity-60 border border-white/10 rounded-md p-0.5" 
                                    referrerPolicy="no-referrer"
                                    title="Sem foto"
                                  />
                                )}
                                <span>{paca.nome}</span>
                              </div>
                            </td>
                            
                            <td className="py-4 px-4">{paca.local}</td>
                            <td className="py-4 px-4 font-mono text-stone-400">{paca.data}</td>
                            
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-1 text-[9px] uppercase font-bold tracking-wider rounded-full border ${
                                paca.status === 'resolvido'
                                  ? 'bg-paca-green-forest/40 border-paca-green-lime text-paca-green-lime'
                                  : 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                              }`}>
                                {paca.status === 'resolvido' ? '✓ Resolvido' : '⏳ Aguardando'}
                              </span>
                            </td>

                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleToggleResolved(paca.id)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold tracking-wider cursor-pointer text-white transition-colors duration-200 ${
                                    paca.status === 'resolvido' 
                                      ? 'bg-stone-800 hover:bg-stone-700 border border-white/10' 
                                      : 'bg-paca-green-forest hover:bg-paca-green-light border border-paca-green-lime/30'
                                  }`}
                                  title={paca.status === 'resolvido' ? "Reabrir Caso" : "Marcar como Resolvido"}
                                >
                                  {paca.status === 'resolvido' ? ' Reabrir' : ' Resolvido'}
                                </button>
                                
                                <button
                                  onClick={() => handleDeletePaca(paca.id)}
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-red-950/40 hover:bg-red-900 border border-red-900/40 text-red-100 cursor-pointer transition-colors duration-200"
                                  title="Remover Registro"
                                >
                                  ❌ Remover
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tablet/Mobile Responsive Card layout (vira cards no mobile/tablet) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden mt-2">
                    {filteredPacas.map(paca => (
                      <div key={paca.id} className="glass-panel p-5 rounded-2xl border-white/5 bg-stone-950/35 relative flex flex-col gap-3">
                        {/* Title area and ID */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <div className="flex items-center gap-2">
                            <img 
                              src="https://cdn.prod.website-files.com/5b44edefca321a1e2d0c2aa6/5f2565fdd9b79a7503e19888_Dimensions-Animals-Rodents-Lowland-Paca-Icon.svg" 
                              alt="Paca Icon" 
                              className="w-5 h-5 object-contain filter invert opacity-80" 
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-sm font-bold text-white">{paca.nome}</span>
                          </div>
                          <span className="font-mono text-xs text-stone-500">ID #{paca.id}</span>
                        </div>

                        {/* Location / Date info */}
                        <div className="space-y-1.5 text-xs text-stone-300">
                          <p>📍 <strong>Local:</strong> {paca.local}</p>
                          <p>📅 <strong>Data:</strong> {paca.data}</p>
                          <p className="text-[11px] text-stone-400 mt-1 italic font-sans">
                            📝 {paca.descricao}
                          </p>
                        </div>

                        {/* Status absolute pill on card bottom row */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
                          <span className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded-lg border ${
                            paca.status === 'resolvido' 
                              ? 'bg-paca-green-forest/40 border-paca-green-lime text-paca-green-lime' 
                              : 'bg-amber-400/10 border-amber-400/30 text-amber-500'
                          }`}>
                            {paca.status === 'resolvido' ? 'Resolvido' : 'Aguardando'}
                          </span>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleToggleResolved(paca.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                paca.status === 'resolvido' ? 'bg-stone-800 text-stone-300' : 'bg-paca-green-forest text-white'
                              }`}
                            >
                              {paca.status === 'resolvido' ? '🔓 Reabrir' : '✓ Solucionar'}
                            </button>
                            <button
                              onClick={() => handleDeletePaca(paca.id)}
                              className="p-1 px-2 bg-red-950/60 border border-red-900/40 text-red-400 hover:bg-red-900 hover:text-white rounded-lg text-[10px]"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

            </div>
          </main>
        </div>
      )}


    </div>
  );
}
