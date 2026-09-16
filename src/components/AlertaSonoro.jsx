import React, { useEffect } from 'react';
import { Volume2, X, Bell, Sparkles } from 'lucide-react';
import { playChimeWithFadeIn } from '../utils/mediaHelpers';

export default function AlertaSonoro({ currentAlert, onCloseAlert }) {
  useEffect(() => {
    if (currentAlert) {
      // Dispara o som suave com fade-in ao abrir o alerta
      playChimeWithFadeIn({ durationSecs: 5, maxVolume: 0.8 });
    }
  }, [currentAlert]);

  if (!currentAlert) return null;

  const imageMap = {
    'Alerta café da manhã': '/images/Alerta café da manhã.png',
    'Alerta almoço': '/images/Alerta almoço.png',
    'Alerta café da tarde': '/images/Alerta café da tarde.png',
    'Alerta segunda aula': '/images/Alerta segunda aula.png',
    'Alerta saida': '/images/Alerta saida.png'
  };

  const alertImg = imageMap[currentAlert.titulo] || '/images/Tela principal.png';

  return (
    <div className="event-alert-overlay">
      <div className="alert-modal-card animate-pulse-slow">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--sesi-red)', fontWeight: 800 }}>
          <Bell size={24} className="animate-float" />
          <span>SINAL ESCOLAR</span>
        </div>

        <img src={alertImg} alt={currentAlert.titulo} className="alert-img" />

        <h2 className="alert-title">
          {currentAlert.titulo || 'Troca de Horário!'}
        </h2>

        <p className="alert-desc">
          {currentAlert.mensagem || 'Atenção alunos: acompanhem a orientação dos professores e inspetores.'}
        </p>

        <button className="close-alert-btn" onClick={onCloseAlert}>
          Entendido / Fechar Alerta
        </button>
      </div>
    </div>
  );
}
