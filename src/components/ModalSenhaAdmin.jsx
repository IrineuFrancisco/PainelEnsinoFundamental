import React, { useState } from 'react';
import { Lock, Key, X, Check } from 'lucide-react';

export default function ModalSenhaAdmin({ isOpen, onClose, onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Senha padrão administrativa: 1234 ou admin
    if (pin === '1234' || pin.toLowerCase() === 'admin' || pin === 'sesi') {
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="event-alert-overlay" style={{ zIndex: 10000 }}>
      <div className="alert-modal-card" style={{ maxWidth: '420px', border: '3px solid #1E293B' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#1E293B' }}>
            <Lock size={22} color="var(--sesi-red)" />
            <span>Acesso Administrativo</span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.9rem', color: '#64748B' }}>
          Digite a senha ou PIN de segurança para gerenciar os avisos e cardápios (Senha padrão: <strong>1234</strong>).
        </p>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input 
            type="password"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            placeholder="Digite o PIN (ex: 1234)"
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: error ? '2px solid #E30613' : '2px solid #CBD5E1',
              fontSize: '1.2rem',
              textAlign: 'center',
              letterSpacing: '4px',
              outline: 'none'
            }}
          />

          {error && (
            <span style={{ color: '#E30613', fontSize: '0.85rem', fontWeight: 700 }}>
              Senha incorreta! Tente 1234.
            </span>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                background: '#F1F5F9',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--sesi-red)',
                color: 'white',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
