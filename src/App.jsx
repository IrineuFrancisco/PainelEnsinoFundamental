import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ModalSenhaAdmin from './components/ModalSenhaAdmin';
import AdminAvisos from './components/AdminAvisos';
import { AbcIcon, ScienceIcon, NumbersIcon } from './components/SubjectIcons';

import { syncTimeWithServer, getSyncedDate, formatDateExtenso, formatTimeBR, getDiaSemanaChave } from './utils/timeSync';
import { loadPanelData, playChimeWithFadeIn } from './utils/mediaHelpers';
import { Volume2, Settings, X, Bell } from 'lucide-react';

import './App.css';

export default function App() {
  const [syncedDate, setSyncedDate] = useState(getSyncedDate());
  const [isSynced, setIsSynced] = useState(false);
  const [panelData, setPanelData] = useState(null);
  const [selectedGradeGroup, setSelectedGradeGroup] = useState('1_2_ano');

  // Modals & Alerts
  const [isModalSenhaOpen, setIsModalSenhaOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);

  // 1. Load panel data (Offline First via /avisos.json)
  useEffect(() => {
    async function fetchData() {
      const res = await loadPanelData();
      if (res.data) {
        setPanelData(res.data);
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

  // 3. Tick 1s + check event boundary at :00 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = getSyncedDate();
      setSyncedDate(now);

      if (now.getSeconds() === 0 && panelData?.horarios) {
        const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const match = panelData.horarios.find((h) => h.inicio === hm);
        
        if (match) {
          let alertTitle = 'Alerta segunda aula';
          if (match.tipo === 'refeicao') {
            if (hm < '10:00') alertTitle = 'Alerta café da manhã';
            else if (hm < '14:00') alertTitle = 'Alerta almoço';
            else alertTitle = 'Alerta café da tarde';
          } else if (match.tipo === 'saida') {
            alertTitle = 'Alerta saida';
          }

          playChimeWithFadeIn({ durationSecs: 5 });
          setCurrentAlert({
            titulo: alertTitle,
            label: match.evento,
            mensagem: match.descricao
          });
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [panelData]);

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
            <span className="sesi-logo-text">SESI</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
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
                title="Testar Sinal Sonoro com Fade-In"
                onClick={() => {
                  playChimeWithFadeIn({ durationSecs: 4 });
                  setCurrentAlert({
                    titulo: 'Alerta café da manhã',
                    label: 'CAFÉ DA MANHÃ',
                    mensagem: 'Sinal escolar com efeito Fade-In!'
                  });
                }}
              >
                <Volume2 size={20} />
              </button>
              <button 
                className="action-btn-circle"
                title="Abrir Gerenciador Administrativo"
                onClick={() => setIsModalSenhaOpen(true)}
              >
                <Settings size={20} />
              </button>
            </div>
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
                  <li>• ARROZ</li>
                  <li>• FEIJÃO</li>
                  <li>• BIFE A MILANESA</li>
                  <li>• SALADA</li>
                  <li>• PUDIM</li>
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

        {/* Fullscreen Event Overlay Alert matching Alerta café da manhã.png, etc */}
        {currentAlert && (
          <div className="alert-fullscreen-overlay">
            <div className="alert-canvas">
              <header className="header-row">
                <div className="sesi-logo-block">
                  <span className="sesi-logo-text">SESI</span>
                </div>
                <div className="date-time-pill">
                  <span className="date-pill-text">
                    {formatDateExtenso(syncedDate)}
                  </span>
                  <span className="time-pill-text">
                    {String(syncedDate.getHours()).padStart(2, '0')}:{String(syncedDate.getMinutes()).padStart(2, '0')}
                  </span>
                </div>
              </header>

              <div className="alert-center-circle">
                <div className="alert-circle-badge">
                  <img 
                    src={
                      currentAlert.titulo.includes('almoço') ? '/images/Alerta almoço.png' :
                      currentAlert.titulo.includes('café da manhã') ? '/images/Alerta café da manhã.png' :
                      currentAlert.titulo.includes('café da tarde') ? '/images/Alerta café da tarde.png' :
                      currentAlert.titulo.includes('saida') ? '/images/Alerta saida.png' :
                      '/images/Alerta segunda aula.png'
                    } 
                    alt="Alerta" 
                    className="alert-circle-img" 
                  />
                  <h2 className="alert-circle-title">
                    {currentAlert.label || currentAlert.titulo.replace('Alerta ', '')}
                  </h2>
                </div>

                <button 
                  onClick={() => setCurrentAlert(null)}
                  style={{
                    background: 'var(--sesi-red)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 32px',
                    borderRadius: '30px',
                    fontWeight: 900,
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(227, 6, 19, 0.4)'
                  }}
                >
                  Entendido / Voltar
                </button>
              </div>
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
            onSimulateAlert={(alertObj) => setCurrentAlert(alertObj)}
          />
        )}
      </div>
    </div>
  );
}
