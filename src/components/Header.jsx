import React from 'react';
import { Clock, Wifi, ShieldAlert, Volume2, Settings, Sparkles } from 'lucide-react';
import { formatTimeBR, formatDateExtenso } from '../utils/timeSync';

export default function Header({ 
  syncedDate, 
  isSynced, 
  selectedGradeGroup, 
  setSelectedGradeGroup,
  onOpenAdmin,
  onTestSound
}) {
  return (
    <header className="app-header">
      {/* Header Left: Logo + Mascote + Title */}
      <div className="header-left">
        <div className="sesi-badge">
          <span style={{ fontWeight: 900, color: 'var(--sesi-red)', fontSize: '1.4rem', fontFamily: 'MomoTrust, sans-serif' }}>
            SESI
          </span>
        </div>

        <div className="mascot-head-container">
          <img src="/images/Mascote.png" alt="Mascote SESI" className="mascot-head-img animate-float" />
          <div className="header-title-text">
            <h1>Ensino Fundamental</h1>
            <p>Painel Interativo de Sinalização</p>
          </div>
        </div>
      </div>

      {/* Header Center: Turma Selector */}
      <div className="header-center">
        <div className="grade-pill-toggle">
          <button 
            className={`grade-btn ${selectedGradeGroup === '1_2_ano' ? 'active' : ''}`}
            onClick={() => setSelectedGradeGroup('1_2_ano')}
          >
            <Sparkles size={14} style={{ display: 'inline', marginRight: 4 }} />
            1º e 2º Ano
          </button>
          <button 
            className={`grade-btn ${selectedGradeGroup === '3_4_5_ano' ? 'active' : ''}`}
            onClick={() => setSelectedGradeGroup('3_4_5_ano')}
          >
            3º, 4º e 5º Ano
          </button>
        </div>
      </div>

      {/* Header Right: Audio Test, Admin, High Precision Clock */}
      <div className="header-right">
        <button 
          onClick={onTestSound} 
          title="Testar Sinal Sonoro com Fade-In"
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <Volume2 size={18} />
          Sinal
        </button>

        <button 
          onClick={onOpenAdmin}
          title="Abrir Gerenciador Administrativo"
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <Settings size={18} />
          Admin
        </button>

        {/* High Precision Clock Container */}
        <div className="clock-box">
          <div className="time-display">
            {formatTimeBR(syncedDate)}
          </div>
          <div className="date-display">
            {formatDateExtenso(syncedDate)}
          </div>
          <div className="sync-badge">
            <Wifi size={10} />
            {isSynced ? 'HTTP Sync OK' : 'Local Clock'}
          </div>
        </div>
      </div>
    </header>
  );
}
