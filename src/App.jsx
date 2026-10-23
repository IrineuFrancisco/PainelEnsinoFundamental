import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ModalSenhaAdmin from './components/ModalSenhaAdmin';
import AdminAvisos from './components/AdminAvisos';

import { syncTimeWithServer, getSyncedDate, formatDateExtenso, formatTimeBR, getDiaSemanaChave } from './utils/timeSync';
import { loadPanelData, playChimeWithFadeIn, playAlertAudio, stopAlertAudio } from './utils/mediaHelpers';
import { fetchCardapioSupabase, fetchAvisosSupabase } from './utils/supabaseClient';
import { Volume2, Settings, X, Bell, RefreshCw, BookOpen } from 'lucide-react';

import './App.css';

export function getAlertDetails(keyOrTitle, customLabel = null, displayTime = null) {
  const str = String(keyOrTitle || '').toLowerCase();

  if (str.includes('bomdia') || str.includes('bom_dia') || str.includes('entrada') || displayTime === '07:00' || displayTime === '7:00') {
    return {
      key: 'entrada',
      titulo: 'Alerta bom dia',
      label: 'BOM DIA!',
      displayTime: displayTime || '7:00',
      audio: './sons/bom dia.mp3',
      cropImg: './images/crop_bom_dia.png',
      fullImg: './images/crop_bom_dia.png'
    };
  }

  if (str.includes('manhã') || str.includes('manha') || str.includes('cafe_manha') || displayTime === '07:50' || displayTime === '7:50') {
    return {
      key: 'cafe_manha',
      titulo: 'Alerta café da manhã',
      label: 'CAFÉ DA MANHÃ',
      displayTime: displayTime || '7:50',
      audio: './sons/comer comer.mp3',
      cropImg: './images/crop_cafe_manha.png',
      fullImg: './images/Alerta café da manhã.png'
    };
  }

  if (str.includes('segunda') || str.includes('aula') || str.includes('segunda_aula') || displayTime === '09:00' || displayTime === '9:00') {
    return {
      key: 'segunda_aula',
      titulo: 'Alerta segunda aula',
      label: 'FIM DA 2º AULA',
      displayTime: displayTime || '9:00',
      audio: null,
      cropImg: './images/crop_segunda_aula.png',
      fullImg: './images/Alerta segunda aula.png'
    };
  }

  if (str.includes('almoço') || str.includes('almoco') || displayTime === '10:40') {
    return {
      key: 'almoco',
      titulo: 'Alerta almoço',
      label: 'ALMOÇO',
      displayTime: displayTime || '10:40',
      audio: './sons/taNaHoraDoPaPa.mp3',
      cropImg: './images/crop_almoco.png',
      fullImg: './images/Alerta almoço.png'
    };
  }

  if (str.includes('tarde') || str.includes('cafe_tarde') || displayTime === '14:00') {
    return {
      key: 'cafe_tarde',
      titulo: 'Alerta café da tarde',
      label: 'CAFÉ DA TARDE',
      displayTime: displayTime || '14:00',
      audio: './sons/comer comer.mp3',
      cropImg: './images/crop_cafe_tarde.png',
      fullImg: './images/Alerta café da tarde.png'
    };
  }

  if (str.includes('saida') || str.includes('saída') || displayTime === '16:00') {
    return {
      key: 'saida',
      titulo: 'Alerta saida',
      label: 'HORA DA SAÍDA',
      displayTime: displayTime || '16:00',
      audio: './sons/tchau.mp3',
      cropImg: './images/crop_saida.png',
      fullImg: './images/Alerta saida.png'
    };
  }

  if (str.includes('saida_quarta') || str.includes('quarta') || displayTime === '11:30') {
    return {
      key: 'saida_quarta',
      titulo: 'Saída Quarta-Feira',
      label: 'HORA DA SAÍDA – QUARTA-FEIRA',
      displayTime: displayTime || '11:30',
      audio: '/sons/tchau.mp3',
      cropImg: '/images/crop_saida.png',
      fullImg: '/images/Alerta saida.png'
    };
  }

  return {
    key: 'custom',
    titulo: keyOrTitle || 'Alerta',
    label: customLabel || 'ALERTA ESCOLAR',
    displayTime: displayTime || '00:00',
    audio: null,
    cropImg: './images/crop_segunda_aula.png',
    fullImg: './images/Alerta segunda aula.png'
  };
}

export default function App() {
  const [syncedDate, setSyncedDate] = useState(getSyncedDate());
  const [isSynced, setIsSynced] = useState(false);
  const [panelData, setPanelData] = useState(null);
  const [selectedGradeGroup, setSelectedGradeGroup] = useState('1_2_ano');

  // Modals, Alerts & Avisos Carousel
  const [isModalSenhaOpen, setIsModalSenhaOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAlertMenuOpen, setIsAlertMenuOpen] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [avisoIndex, setAvisoIndex] = useState(0);
  const [currentView, setCurrentView] = useState('principal'); // 'principal' | 'leitura'
  const [periodoOverride, setPeriodoOverride] = useState(null); // null (automático por horário) | 'manha' | 'tarde'

  // 1. Load panel data (Offline First via /avisos.json) + Supabase Sync (Cardápio & Avisos)
  useEffect(() => {
    async function fetchData() {
      const res = await loadPanelData();
      if (res.data) {
        let current = res.data;
        setPanelData(current);

        // Sincronização inicial do Cardápio via Supabase
        const supCardapio = await fetchCardapioSupabase(current);
        if (supCardapio.success && supCardapio.data) {
          current = { ...current, cardapio: supCardapio.data };
        }

        // Sincronização inicial dos Avisos via Supabase
        const supAvisos = await fetchAvisosSupabase(current);
        if (supAvisos.success && supAvisos.data) {
          current = { ...current, avisos: supAvisos.data };
        }

        setPanelData(current);
      }
    }
    fetchData();
  }, []);

  // Polling periódico para atualizar cardápio do Supabase (a cada 60 segundos)
  useEffect(() => {
    if (!panelData) return;

    const interval = setInterval(async () => {
      console.log('[Polling] Verificando atualizações de cardápio no Supabase...');
      const supRes = await fetchCardapioSupabase(panelData);
      if (supRes.success && supRes.data) {
        setPanelData((prev) => ({ ...prev, cardapio: supRes.data }));
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Rotação dos avisos ativos a cada 12 segundos no card Lembrete
  useEffect(() => {
    const activeList = (panelData?.avisos || []).filter((a) => a.ativo !== false);
    if (activeList.length <= 1) return;

    const interval = setInterval(() => {
      setAvisoIndex((prev) => (prev + 1) % activeList.length);
    }, 12000);

    return () => clearInterval(interval);
  }, [panelData?.avisos]);

  // Alternância automática de exibição a cada 30 minutos (Painel Inicial <-> Treino de Leitura)
  useEffect(() => {
    const ROTATION_INTERVAL_MS = 30 * 1000; // 30 segundos
    const timer = setInterval(() => {
      setCurrentView((prev) => (prev === 'principal' ? 'leitura' : 'principal'));
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  // 2. High-precision HTTP Time Sync (NovoPainelSesi Architecture)
  useEffect(() => {
    async function sync() {
      const res = await syncTimeWithServer();
      setIsSynced(res.success);
    }
    sync();
    const interval = setInterval(sync, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. Smart TV Kiosk Mode Resilience (Screen WakeLock + Fully Kiosk API + Audio Autoplay Unlock + 03:00 AM Refresh)
  useEffect(() => {
    let wakeLock = null;

    // Integramos a API nativa do Fully Kiosk Browser se disponível no Android TV
    if (typeof window.fully !== 'undefined' && window.fully) {
      try {
        if (typeof window.fully.keepScreenOn === 'function') window.fully.keepScreenOn(true);
        if (typeof window.fully.turnScreenOn === 'function') window.fully.turnScreenOn();
        if (typeof window.fully.hideNavigationBar === 'function') window.fully.hideNavigationBar();
        if (typeof window.fully.hideStatusBar === 'function') window.fully.hideStatusBar();
        console.log('[FullyKiosk] API nativa acionada com sucesso!');
      } catch (e) {
        console.warn('[FullyKiosk] Aviso ao aplicar comandos nativos:', e);
      }
    }

    // HTML5 Screen WakeLock API com proteções contra exceções não tratadas
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator && navigator.wakeLock && typeof navigator.wakeLock.request === 'function') {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.log('WakeLock HTML5 indisponível no navegador:', err);
      }
    }
    requestWakeLock();

    // Auto unlock audio on any touch/click/remote key press
    const unlockAudio = () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const dummyCtx = new AudioCtx();
          if (dummyCtx.state === 'suspended') {
            dummyCtx.resume();
          }
        }
      } catch (e) {}
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });

    return () => {
      if (wakeLock && typeof wakeLock.release === 'function') {
        wakeLock.release().catch(() => {});
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  const handleCloseAlert = () => {
    stopAlertAudio();
    setCurrentAlert(null);
  };

  const triggerAlert = (key, customTime = null) => {
    const details = getAlertDetails(key, null, customTime);
    if (details.audio) {
      playAlertAudio(details.audio, {
        onEnded: () => {
          handleCloseAlert();
        }
      });
    } else {
      playChimeWithFadeIn({ durationSecs: 5 });
    }
    setCurrentAlert(details);
    setIsAlertMenuOpen(false);
  };

  // 4. Tick 1s + check event boundary at :00 seconds + Cardápio routines (07:10, 08:00, 11:00) + 03:00 AM reload
  useEffect(() => {
    const timer = setInterval(() => {
      const now = getSyncedDate();
      setSyncedDate(now);

      // Memory flush & clean reload at 03:00 AM for long-running Smart TVs
      if (now.getHours() === 3 && now.getMinutes() === 0 && now.getSeconds() === 0) {
        window.location.reload();
        return;
      }

      if (now.getSeconds() === 0) {
        const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // Rotinas de atualização do Cardápio via Supabase às 7:10, 8:00 e 11:00
        if (hm === '07:10' || hm === '08:00' || hm === '11:00') {
          console.log(`[Rotina Cardápio] Executando atualização programada das ${hm}h via Supabase...`);
          fetchCardapioSupabase(panelData).then((supRes) => {
            if (supRes.success && supRes.data) {
              setPanelData((prev) => ({
                ...prev,
                cardapio: supRes.data
              }));
            }
          });
        }

        let matchedAlert = null;
        const isWednesday = now.getDay() === 3;

        if (hm === '07:00') {
          matchedAlert = getAlertDetails('entrada', 'BOM DIA!', '7:00');
        } else if (hm === '07:50') {
          matchedAlert = getAlertDetails('cafe_manha', 'CAFÉ DA MANHÃ', '7:50');
        } else if (hm === '09:00') {
          matchedAlert = getAlertDetails('segunda_aula', 'FIM DA 2º AULA', '9:00');
        } else if (hm === '10:40') {
          matchedAlert = getAlertDetails('almoco', 'ALMOÇO', '10:40');
        } else if (hm === '11:30' && isWednesday) {
          // Quarta-feira: saída antecipada às 11:30
          matchedAlert = getAlertDetails('saida_quarta', 'HORA DA SAÍDA', '11:30');
        } else if (hm === '14:00' && !isWednesday) {
          // Não dispara café da tarde em quarta-feira (saída às 11:30)
          matchedAlert = getAlertDetails('cafe_tarde', 'CAFÉ DA TARDE', '14:00');
        } else if (hm === '16:00' && !isWednesday) {
          // Não dispara saída normal em quarta-feira (saída às 11:30)
          matchedAlert = getAlertDetails('saida', 'HORA DA SAÍDA', '16:00');
        } else if (panelData?.horarios) {
          const match = panelData.horarios.find((h) => h.inicio === hm);
          if (match) {
            matchedAlert = getAlertDetails(
              match.chaveAlerta || match.tituloAlerta || match.evento,
              match.labelAlerta || match.evento,
              match.inicio
            );
          }
        }

        if (matchedAlert) {
          triggerAlert(matchedAlert.key, matchedAlert.displayTime);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [panelData]);

  // Auto close alert overlay after 30 seconds
  useEffect(() => {
    if (currentAlert) {
      const autoClose = setTimeout(() => {
        handleCloseAlert();
      }, 30000);
      return () => clearTimeout(autoClose);
    }
  }, [currentAlert]);

  if (!panelData) {
    return (
      <div className="tv-frame-container">
        <div className="tv-canvas" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <img src="./images/Mascote.png" alt="Mascote" style={{ width: '100px', marginBottom: '16px' }} />
          <h2 style={{ fontFamily: 'MomoTrust, sans-serif', fontSize: '2rem' }}>Carregando Painel SESI...</h2>
        </div>
      </div>
    );
  }

  const diaChave = getDiaSemanaChave(syncedDate);
  const cardapioHoje = panelData.cardapio?.[diaChave] || panelData.cardapio?.['segunda'] || {};
  const activeAvisos = (panelData.avisos || []).filter((a) => a.ativo !== false);
  const currentAviso = activeAvisos.length > 0 ? activeAvisos[avisoIndex % activeAvisos.length] : null;

  // Determina automaticamente o período (Manhã até 11:59 / Tarde a partir das 12:00)
  const isTardeAuto = syncedDate.getHours() >= 12;
  const isTarde = periodoOverride !== null ? periodoOverride === 'tarde' : isTardeAuto;

  const aulasManha = panelData?.aulas?.manha || [
    { disciplina: 'PORTUGUÊS', horario: '7:00 ÀS 7:50' },
    { disciplina: 'CIÊNCIAS', horario: '8:10 ÀS 9:00' },
    { disciplina: 'MATEMÁTICA', horario: '9:00 ÀS 9:50' }
  ];

  const aulasTarde = panelData?.aulas?.tarde || [
    { disciplina: 'PORTUGUÊS', horario: '13:00 ÀS 13:50' },
    { disciplina: 'CIÊNCIAS', horario: '14:20 ÀS 15:10' },
    { disciplina: 'MATEMÁTICA', horario: '15:10 ÀS 16:00' }
  ];

  const aulasExibidas = isTarde ? aulasTarde : aulasManha;

  return (
    <div className="tv-frame-container">
      <div className="tv-canvas">
        {/* Top Header Row matching Tela principal.png */}
        <header className="header-row">
          <div className="sesi-logo-block">
            <img src="./images/Sesi-SP.jpg" alt="Logo SESI" className="sesi-logo-img" />
          </div>

          <div className="header-pill-container">
            <div className="date-time-pill">
              <span className="date-pill-text">
                {formatDateExtenso(syncedDate)}
              </span>
              <span className="time-pill-text">
                {`${syncedDate.getHours()}:${String(syncedDate.getMinutes()).padStart(2, '0')}`}
              </span>
            </div>

            <div className="header-actions">
              <button
                className="action-btn-circle"
                title={currentView === 'principal' ? 'Mudar para Treino de Leitura (Alternância de 30min)' : 'Voltar para Painel Principal'}
                onClick={() => setCurrentView((prev) => (prev === 'principal' ? 'leitura' : 'principal'))}
                style={currentView === 'leitura' ? { background: '#EBD9FF', color: '#6B21A8' } : {}}
              >
                <BookOpen size={20} />
              </button>
              <button
                className="action-btn-circle"
                title="Testar Alertas de Horários"
                onClick={() => setIsAlertMenuOpen(!isAlertMenuOpen)}
              >
                <Bell size={20} />
              </button>
              <button
                className="action-btn-circle"
                title="Abrir Gerenciador Administrativo"
                onClick={() => setIsModalSenhaOpen(true)}
              >
                <Settings size={20} />
              </button>
            </div>

            {/* Floating Quick Alert Menu */}
            {isAlertMenuOpen && (
              <div className="alert-dropdown-menu">
                <div className="dropdown-title">Ações e Telas</div>
                <button 
                  onClick={() => {
                    setCurrentView((prev) => (prev === 'principal' ? 'leitura' : 'principal'));
                    setIsAlertMenuOpen(false);
                  }}
                  style={{ background: '#F3E8FF', color: '#6B21A8', fontWeight: 800 }}
                >
                  📖 {currentView === 'principal' ? 'Exibir Treino de Leitura' : 'Exibir Painel Principal'}
                </button>

                <div className="dropdown-title" style={{ marginTop: 4 }}>Testar Alertas Programados</div>
                <button onClick={() => triggerAlert('entrada', '7:00')}>
                  ☀️ 07:00 - Entrada (bom dia.mp3)
                </button>
                <button onClick={() => triggerAlert('cafe_manha', '7:50')}>
                  ☕ 07:50 - Café da Manhã (comer comer.mp3)
                </button>
                <button onClick={() => triggerAlert('segunda_aula', '9:00')}>
                  🔔 09:00 - Fim da 2ª Aula (Sinal Escolar)
                </button>
                <button onClick={() => triggerAlert('almoco', '10:40')}>
                  🍲 10:40 - Almoço (taNaHoraDoPaPa.mp3)
                </button>
                <button onClick={() => triggerAlert('cafe_tarde', '14:00')}>
                  🍎 14:00 - Café da Tarde (comer comer.mp3)
                </button>
                <button onClick={() => triggerAlert('saida', '16:00')}>
                  🚌 16:00 - Hora da Saída (tchau.mp3)
                </button>
                <button
                  onClick={() => triggerAlert('saida_quarta', '11:30')}
                  style={{ background: '#FEF3C7', color: '#92400E', fontWeight: 800 }}
                >
                  📅 11:30 - Saída Quarta-Feira (tchau.mp3)
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main View: Alternates every 30 minutes between Principal and Treino de Leitura */}
        {currentView === 'principal' ? (
          <main className="principal-grid">
          {/* Column 1: AULAS DA MANHÃ: */}
          <section className="column-section">
            <h2 className="section-title">AULAS DA MANHÃ:</h2>
            <div className="aulas-stack">
              {/* Pink Card - Português */}
              <div className="aula-card pink">
                <div className="aula-icon-wrapper">
                  <img
                    src="/images/imagem-português.png"
                    alt="Português ABC"
                    className="aula-icon-img"
                  />
                </div>
                <div className="aula-card-text">
                  PORTUGUÊS 7:00 ÀS 7:50
                </div>
              </div>

              {/* Green Card - Ciências */}
              <div className="aula-card green">
                <div className="aula-icon-wrapper">
                  <img
                    src="/images/ciencias (2).png"
                    alt="Ciências"
                    className="aula-icon-img"
                  />
                </div>
                <div className="aula-card-text">
                  CIÊNCIAS 8:10 ÀS 9:00
                </div>
              </div>

              {/* Yellow Card - Matemática */}
              <div className="aula-card yellow">
                <div className="aula-icon-wrapper">
                  <img
                    src="/images/imagem-matemática.png"
                    alt="Matemática"
                    className="aula-icon-img"
                  />
                </div>
                <div className="aula-card-text">
                  MATEMÁTICA 9:00 ÀS 9:50
                </div>
              </div>
            </div>
          </section>

          {/* Column 2: CARDÁPIO: */}
          <section className="column-section">
            <h2 className="section-title">CARDÁPIO:</h2>
            <div className="cardapio-card-large">
              {/* Café da Manhã */}
              <div className="cardapio-section">
                <h3 className="cardapio-sub-title">CAFÉ DA MANHÃ:</h3>
                <ul className="cardapio-bullet-list">
                  <li>• {cardapioHoje.cafe_manha?.suco || 'SUCO DE MORANGO'}</li>
                  <li>• {cardapioHoje.cafe_manha?.prato || 'PÃO DE BATATA'}</li>
                  <li>• {cardapioHoje.cafe_manha?.fruta || 'MAMÃO'}</li>
                </ul>
              </div>

              {/* Almoço */}
              <div className="cardapio-section">
                <h3 className="cardapio-sub-title">ALMOÇO:</h3>
                <ul className="cardapio-bullet-list">
                  {cardapioHoje.almoco?.prato ? (
                    <>
                      <li>• {cardapioHoje.almoco.prato}</li>
                      {cardapioHoje.almoco.salada && <li>• {cardapioHoje.almoco.salada}</li>}
                      {cardapioHoje.almoco.sobremesa && <li>• {cardapioHoje.almoco.sobremesa}</li>}
                    </>
                  ) : (
                    <>
                      <li>• ARROZ</li>
                      <li>• FEIJÃO</li>
                      <li>• BIFE A MILANESA</li>
                      <li>• SALADA</li>
                      <li>• PUDIM</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Café da Tarde */}
              <div className="cardapio-section">
                <h3 className="cardapio-sub-title">CAFÉ DA TARDE:</h3>
                <ul className="cardapio-bullet-list">
                  <li>• {cardapioHoje.cafe_tarde?.prato || 'POLVILHO'}</li>
                  <li>• LEITE COM CAFÉ</li>
                  <li>• {cardapioHoje.cafe_tarde?.fruta || 'MELANCIA'}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Column 3: LEMBRETE: & Mascote */}
          <section className="column-section">
            <h2 className="section-title">
              {currentAviso ? 'AVISO / LEMBRETE:' : 'LEMBRETE:'}
            </h2>

            <div 
              className="lembrete-card"
              style={currentAviso?.cor ? { borderLeft: `6px solid ${currentAviso.cor}`, transition: 'all 0.4s ease' } : {}}
            >
              <div className="lembrete-text">
                {currentAviso ? (
                  <>
                    <div style={{ fontSize: '0.82rem', color: currentAviso.cor || '#0284C7', marginBottom: '6px', fontWeight: 900 }}>
                      {currentAviso.titulo}
                    </div>
                    <div style={{ fontSize: '1.02rem', lineHeight: 1.35 }}>
                      {currentAviso.mensagem}
                    </div>
                  </>
                ) : (
                  panelData?.lembreteMaterial?.[diaChave]
                    ? `LEMBRETE: ${panelData.lembreteMaterial[diaChave].toUpperCase()}`
                    : 'PEGAR OS MATERIAS AO CHEGAR!!'
                )}
              </div>
            </div>

            <div className="mascote-container-bottom">
              <img
                src="./images/Mascote.png"
                alt="Mascote SESI"
                className="mascote-img-full"
              />
            </div>
          </section>
        </main>
        ) : (
          <main className="leitura-view-container">
            <h2 className="section-title">VAMOS TREINAR A LEITURA:</h2>
            <div className="leitura-card-large">
              <div className="leitura-row">
                <div className="leitura-pill">BOM DIA</div>
                <div className="leitura-pill">BOA TARDE</div>
                <div className="leitura-pill">ORGANIZE A SALA</div>
              </div>
              <div className="leitura-row">
                <div className="leitura-pill">RESPEITE OS COLEGAS</div>
                <div className="leitura-pill">RESPEITE A PROFESSORA</div>
              </div>
              <div className="leitura-row">
                <div className="leitura-pill">BOA AULA HOJE</div>
                <div className="leitura-pill">FOCO NOS ESTUDOS</div>
              </div>
            </div>
          </main>
        )}

        {/* Fullscreen Event Overlay Alert matching Alerta café da manhã.png, Alerta segunda aula.png, etc */}
        {currentAlert && (
          <div className="alert-fullscreen-overlay">
            <div className="alert-canvas">
              <header className="header-row">
                <div className="sesi-logo-block">
                  <img src="./images/Sesi-SP.jpg" alt="Logo SESI" className="sesi-logo-img" />
                </div>
                <div className="date-time-pill">
                  <span className="date-pill-text">
                    {formatDateExtenso(syncedDate)}
                  </span>
                  <span className="time-pill-text">
                    {currentAlert.displayTime || formatTimeBR(syncedDate)}
                  </span>
                </div>
              </header>

              <div className="alert-center-circle">
                <img
                  src={currentAlert.cropImg}
                  alt={currentAlert.label}
                  className="alert-cropped-circle-img"
                />
              </div>

              <button
                className="alert-close-btn"
                onClick={handleCloseAlert}
              >
                Entendido <X size={20} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>
        )}

        {/* Password Modal for Admin */}
        <ModalSenhaAdmin
          isOpen={isModalSenhaOpen}
          onClose={() => setIsModalSenhaOpen(false)}
          onSuccess={() => {
            setIsModalSenhaOpen(false);
            setIsAdminOpen(true);
          }}
        />

        {/* Admin Management Panel */}
        {isAdminOpen && (
          <AdminAvisos
            data={panelData}
            onSaveData={(updated) => setPanelData(updated)}
            onClose={() => setIsAdminOpen(false)}
            onSimulateAlert={(alertKey) => triggerAlert(alertKey)}
          />
        )}
      </div>
    </div>
  );
}
