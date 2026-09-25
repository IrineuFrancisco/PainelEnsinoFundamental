import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ModalSenhaAdmin from './components/ModalSenhaAdmin';
import AdminAvisos from './components/AdminAvisos';
import { AbcIcon, ScienceIcon, NumbersIcon } from './components/SubjectIcons';

import { syncTimeWithServer, getSyncedDate, formatDateExtenso, formatTimeBR, getDiaSemanaChave } from './utils/timeSync';
import { loadPanelData, playChimeWithFadeIn, playAlertAudio, stopAlertAudio } from './utils/mediaHelpers';
import { fetchCardapioSupabase } from './utils/supabaseClient';
import { Volume2, Settings, X, Bell, RefreshCw } from 'lucide-react';

import './App.css';

export function getAlertDetails(keyOrTitle, customLabel = null, displayTime = null) {
  const str = String(keyOrTitle || '').toLowerCase();

  if (str.includes('bomdia') || str.includes('bom_dia') || str.includes('entrada') || displayTime === '07:00' || displayTime === '7:00') {
    return {
      key: 'entrada',
      titulo: 'Alerta bom dia',
      label: 'BOM DIA!',
      displayTime: displayTime || '7:00',
      audio: '/sons/bom dia.mp3',
      cropImg: '/images/crop_bom_dia.png',
      fullImg: '/images/crop_bom_dia.png'
    };
  }

  if (str.includes('manhã') || str.includes('manha') || str.includes('cafe_manha') || displayTime === '07:50' || displayTime === '7:50') {
    return {
      key: 'cafe_manha',
      titulo: 'Alerta café da manhã',
      label: 'CAFÉ DA MANHÃ',
      displayTime: displayTime || '7:50',
      audio: '/sons/comer comer.mp3',
      cropImg: '/images/crop_cafe_manha.png',
      fullImg: '/images/Alerta café da manhã.png'
    };
  }

  if (str.includes('segunda') || str.includes('aula') || str.includes('segunda_aula') || displayTime === '09:00' || displayTime === '9:00') {
    return {
      key: 'segunda_aula',
      titulo: 'Alerta segunda aula',
      label: 'FIM DA 2º AULA',
      displayTime: displayTime || '9:00',
      audio: null,
      cropImg: '/images/crop_segunda_aula.png',
      fullImg: '/images/Alerta segunda aula.png'
    };
  }

  if (str.includes('almoço') || str.includes('almoco') || displayTime === '10:40') {
    return {
      key: 'almoco',
      titulo: 'Alerta almoço',
      label: 'ALMOÇO',
      displayTime: displayTime || '10:40',
      audio: '/sons/taNaHoraDoPaPa.mp3',
      cropImg: '/images/crop_almoco.png',
      fullImg: '/images/Alerta almoço.png'
    };
  }

  if (str.includes('tarde') || str.includes('cafe_tarde') || displayTime === '14:00') {
    return {
      key: 'cafe_tarde',
      titulo: 'Alerta café da tarde',
      label: 'CAFÉ DA TARDE',
      displayTime: displayTime || '14:00',
      audio: '/sons/comer comer.mp3',
      cropImg: '/images/crop_cafe_tarde.png',
      fullImg: '/images/Alerta café da tarde.png'
    };
  }

  if (str.includes('saida') || str.includes('saída') || displayTime === '16:00') {
    return {
      key: 'saida',
      titulo: 'Alerta saida',
      label: 'HORA DA SAÍDA',
      displayTime: displayTime || '16:00',
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
    cropImg: '/images/crop_segunda_aula.png',
    fullImg: '/images/Alerta segunda aula.png'
  };
}

export default function App() {
  const [syncedDate, setSyncedDate] = useState(getSyncedDate());
  const [isSynced, setIsSynced] = useState(false);
  const [panelData, setPanelData] = useState(null);
  const [selectedGradeGroup, setSelectedGradeGroup] = useState('1_2_ano');

  // Modals & Alerts
  const [isModalSenhaOpen, setIsModalSenhaOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAlertMenuOpen, setIsAlertMenuOpen] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);

  // 1. Load panel data (Offline First via /avisos.json) + Supabase Cardápio Sync
  useEffect(() => {
    async function fetchData() {
      const res = await loadPanelData();
      if (res.data) {
        setPanelData(res.data);
        // Sincronização inicial do Cardápio via Supabase
        const supRes = await fetchCardapioSupabase(res.data);
        if (supRes.success && supRes.data) {
          setPanelData((prev) => ({
            ...prev,
            cardapio: supRes.data
          }));
        }
      }
    }
    fetchData();
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

  // 3. Smart TV Kiosk Mode Resilience (Screen WakeLock + Audio Autoplay Unlock + 03:00 AM Refresh)
  useEffect(() => {
    let wakeLock = null;
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.log('WakeLock indisponível:', err);
      }
    }
    requestWakeLock();

    // Auto unlock audio on any touch/click/remote key press
    const unlockAudio = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const dummyCtx = new AudioContext();
          dummyCtx.resume();
        }
      } catch (e) {}
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });

    return () => {
      if (wakeLock) wakeLock.release().catch(() => {});
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
        window.location.reload(true);
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

        if (hm === '07:00') {
          matchedAlert = getAlertDetails('entrada', 'BOM DIA!', '7:00');
        } else if (hm === '07:50') {
          matchedAlert = getAlertDetails('cafe_manha', 'CAFÉ DA MANHÃ', '7:50');
        } else if (hm === '09:00') {
          matchedAlert = getAlertDetails('segunda_aula', 'FIM DA 2º AULA', '9:00');
        } else if (hm === '10:40') {
          matchedAlert = getAlertDetails('almoco', 'ALMOÇO', '10:40');
        } else if (hm === '14:00') {
          matchedAlert = getAlertDetails('cafe_tarde', 'CAFÉ DA TARDE', '14:00');
        } else if (hm === '16:00') {
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
          <img src="/images/Mascote.png" alt="Mascote" style={{ width: '100px', marginBottom: '16px' }} />
          <h2 style={{ fontFamily: 'MomoTrust, sans-serif', fontSize: '2rem' }}>Carregando Painel SESI...</h2>
        </div>
      </div>
    );
  }

  const diaChave = getDiaSemanaChave(syncedDate);
  const cardapioHoje = panelData.cardapio?.[diaChave] || panelData.cardapio?.['segunda'] || {};

  return (
    <div className="tv-frame-container">
      <div className="tv-canvas">
        {/* Top Header Row matching Tela principal.png */}
        <header className="header-row">
          <div className="sesi-logo-block">
            <img src="/images/Sesi-SP.jpg" alt="Logo SESI" className="sesi-logo-img" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <div className="date-time-pill">
              <span className="date-pill-text">
                {formatDateExtenso(syncedDate)}
              </span>
              <span className="time-pill-text">
                {String(syncedDate.getHours()).padStart(2, '0')}:{String(syncedDate.getMinutes()).padStart(2, '0')}
              </span>
            </div>

            <div className="header-actions">
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
                <div className="dropdown-title">Testar Alertas Programados</div>
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
              </div>
            )}
          </div>
        </header>

        {/* Main 3 Column Grid matching Tela principal.png */}
        <main className="principal-grid">
          {/* Column 1: AULAS DA MANHÃ: */}
          <section className="column-section">
            <h2 className="section-title">AULAS DA MANHÃ:</h2>
            <div className="aulas-stack">
              {/* Pink Card - Português */}
              <div className="aula-card pink">
                <div className="aula-icon-wrapper">
                  <AbcIcon />
                </div>
                <div className="aula-card-text">
                  PORTUGUÊS 7:00 ÀS 7:50
                </div>
              </div>

              {/* Green Card - Ciências */}
              <div className="aula-card green">
                <div className="aula-icon-wrapper">
                  <ScienceIcon />
                </div>
                <div className="aula-card-text">
                  CIÊNCIAS 8:10 ÀS 9:00
                </div>
              </div>

              {/* Yellow Card - Matemática */}
              <div className="aula-card yellow">
                <div className="aula-icon-wrapper">
                  <NumbersIcon />
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
            <h2 className="section-title">LEMBRETE:</h2>

            <div className="lembrete-card">
              <div className="lembrete-text">
                PEGAR OS MATERIAS AO CHEGAR!!
              </div>
            </div>

            <div className="mascote-container-bottom">
              <img
                src="/images/Mascote.png"
                alt="Mascote SESI"
                className="mascote-img-full"
              />
            </div>
          </section>
        </main>

        {/* Fullscreen Event Overlay Alert matching Alerta café da manhã.png, Alerta segunda aula.png, etc */}
        {currentAlert && (
          <div className="alert-fullscreen-overlay">
            <div className="alert-canvas">
              <header className="header-row">
                <div className="sesi-logo-block">
                  <img src="/images/Sesi-SP.jpg" alt="Logo SESI" className="sesi-logo-img" />
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
