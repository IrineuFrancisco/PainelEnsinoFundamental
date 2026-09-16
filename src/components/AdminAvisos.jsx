import React, { useState } from 'react';
import { Settings, Plus, Trash2, Edit2, Save, Download, RefreshCw, X, Volume2, Bell } from 'lucide-react';
import { savePanelDataToLocal, playChimeWithFadeIn } from '../utils/mediaHelpers';

export default function AdminAvisos({ data, onSaveData, onClose, onSimulateAlert }) {
  const [activeTab, setActiveTab] = useState('avisos');
  const [panelData, setPanelData] = useState(JSON.parse(JSON.stringify(data)));
  const [editingAviso, setEditingAviso] = useState(null);

  // Form states para novo aviso
  const [novoAviso, setNovoAviso] = useState({
    titulo: '',
    mensagem: '',
    categoria: 'Pedagógico',
    cor: '#20B2AA',
    duracao: 8,
    ativo: true
  });

  const handleSaveAll = () => {
    savePanelDataToLocal(panelData);
    onSaveData(panelData);
    alert('Dados salvos no armazenamento local resiliente com sucesso!');
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(panelData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'avisos.json';
    a.click();
  };

  const handleAddAviso = (e) => {
    e.preventDefault();
    if (!novoAviso.titulo || !novoAviso.mensagem) return;
    const created = {
      ...novoAviso,
      id: `av-${Date.now()}`
    };
    setPanelData((prev) => ({
      ...prev,
      avisos: [...(prev.avisos || []), created]
    }));
    setNovoAviso({
      titulo: '',
      mensagem: '',
      categoria: 'Pedagógico',
      cor: '#20B2AA',
      duracao: 8,
      ativo: true
    });
  };

  const handleDeleteAviso = (id) => {
    setPanelData((prev) => ({
      ...prev,
      avisos: prev.avisos.filter((a) => a.id !== id)
    }));
  };

  const handleToggleAviso = (id) => {
    setPanelData((prev) => ({
      ...prev,
      avisos: prev.avisos.map((a) => a.id === id ? { ...a, ativo: !a.ativo } : a)
    }));
  };

  return (
    <div className="event-alert-overlay" style={{ zIndex: 9000 }}>
      <div className="alert-modal-card" style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', overflow: 'hidden', padding: 0, border: '3px solid var(--sesi-red)' }}>
        {/* Admin Topbar */}
        <div style={{ background: 'var(--sesi-red)', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={24} />
            <h2 style={{ fontFamily: 'MomoTrust, sans-serif', fontSize: '1.4rem' }}>
              Painel Administrativo - Ensino Fundamental
            </h2>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: 'white', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Tab Selector & Action Buttons */}
        <div style={{ background: '#F1F5F9', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #CBD5E1' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className={`grade-btn ${activeTab === 'avisos' ? 'active' : ''}`}
              onClick={() => setActiveTab('avisos')}
              style={{ background: activeTab === 'avisos' ? 'var(--sesi-red)' : '#CBD5E1', color: activeTab === 'avisos' ? 'white' : '#334155' }}
            >
              Gerenciar Avisos ({panelData.avisos?.length || 0})
            </button>
            <button 
              className={`grade-btn ${activeTab === 'cardapio' ? 'active' : ''}`}
              onClick={() => setActiveTab('cardapio')}
              style={{ background: activeTab === 'cardapio' ? 'var(--sesi-red)' : '#CBD5E1', color: activeTab === 'cardapio' ? 'white' : '#334155' }}
            >
              Gerenciar Cardápios
            </button>
            <button 
              className={`grade-btn ${activeTab === 'testes' ? 'active' : ''}`}
              onClick={() => setActiveTab('testes')}
              style={{ background: activeTab === 'testes' ? 'var(--sesi-red)' : '#CBD5E1', color: activeTab === 'testes' ? 'white' : '#334155' }}
            >
              Testes & Alertas
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleSaveAll}
              style={{ background: '#2E7D32', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Save size={16} /> Salvar Local
            </button>
            <button 
              onClick={handleExportJSON}
              style={{ background: '#0284C7', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={16} /> Baixar avisos.json
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: 'calc(90vh - 140px)', width: '100%' }}>
          {activeTab === 'avisos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Form de Inserção de Novo Aviso */}
              <form onSubmit={handleAddAviso} style={{ background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>Cadastrar Novo Aviso</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input 
                    type="text" 
                    placeholder="Título do Aviso" 
                    value={novoAviso.titulo}
                    onChange={(e) => setNovoAviso({ ...novoAviso, titulo: e.target.value })}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    required
                  />
                  <select 
                    value={novoAviso.categoria}
                    onChange={(e) => setNovoAviso({ ...novoAviso, categoria: e.target.value })}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  >
                    <option value="Pedagógico">Pedagógico</option>
                    <option value="Informativo">Informativo</option>
                    <option value="Higiene & Saúde">Higiene & Saúde</option>
                    <option value="Convivência">Convivência</option>
                  </select>
                </div>

                <textarea 
                  placeholder="Mensagem do Aviso para as crianças"
                  value={novoAviso.mensagem}
                  onChange={(e) => setNovoAviso({ ...novoAviso, mensagem: e.target.value })}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', minHeight: '60px' }}
                  required
                />

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    Cor do Destaque: 
                    <input 
                      type="color" 
                      value={novoAviso.cor}
                      onChange={(e) => setNovoAviso({ ...novoAviso, cor: e.target.value })}
                      style={{ marginLeft: '8px', border: 'none', cursor: 'pointer' }}
                    />
                  </label>
                  <button 
                    type="submit" 
                    style={{ background: 'var(--sesi-red)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', marginLeft: 'auto' }}
                  >
                    + Adicionar Aviso
                  </button>
                </div>
              </form>

              {/* Lista de Avisos Existentes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>Avisos Cadastrados</h3>
                {panelData.avisos?.map((aviso) => (
                  <div key={aviso.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', background: '#F1F5F9', borderLeft: `6px solid ${aviso.cor || '#20B2AA'}` }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>
                        {aviso.titulo} <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({aviso.categoria})</span>
                      </div>
                      <div style={{ fontSize: '0.88rem', color: '#475569' }}>
                        {aviso.mensagem}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button 
                        onClick={() => handleToggleAviso(aviso.id)}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', background: aviso.ativo ? '#DCFCE7' : '#FEE2E2', color: aviso.ativo ? '#15803D' : '#B91C1C' }}
                      >
                        {aviso.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                      <button 
                        onClick={() => handleDeleteAviso(aviso.id)}
                        style={{ background: '#EF4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'cardapio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.9rem', color: '#475569' }}>
                Edite os pratos principais do almoço e lanches da semana para o Ensino Fundamental:
              </p>
              {['segunda', 'terca', 'quarta', 'quinta', 'sexta'].map((dia) => (
                <div key={dia} style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ textTransform: 'capitalize', fontWeight: 800, color: 'var(--sesi-red)', marginBottom: '8px' }}>
                    {dia}-feira
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Almoço - Prato Principal:</label>
                      <input 
                        type="text" 
                        value={panelData.cardapio?.[dia]?.almoco?.prato || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPanelData(prev => ({
                            ...prev,
                            cardapio: {
                              ...prev.cardapio,
                              [dia]: {
                                ...prev.cardapio?.[dia],
                                almoco: { ...prev.cardapio?.[dia]?.almoco, prato: val }
                              }
                            }
                          }));
                        }}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Lanche da Tarde:</label>
                      <input 
                        type="text" 
                        value={panelData.cardapio?.[dia]?.cafe_tarde?.prato || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPanelData(prev => ({
                            ...prev,
                            cardapio: {
                              ...prev.cardapio,
                              [dia]: {
                                ...prev.cardapio?.[dia],
                                cafe_tarde: { ...prev.cardapio?.[dia]?.cafe_tarde, prato: val }
                              }
                            }
                          }));
                        }}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'testes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Simulação de Alertas Sonoros e Visuais</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748B' }}>
                Clique nos botões abaixo para simular o disparo de sinal escolar com fade-in e overlay visual em tela cheia:
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button 
                  onClick={() => {
                    playChimeWithFadeIn({ durationSecs: 4 });
                    onSimulateAlert({ titulo: 'Alerta café da manhã', mensagem: 'Horário do Café da Manhã das crianças!' });
                  }}
                  style={{ background: '#FFF3E0', border: '2px solid #F77F00', padding: '14px', borderRadius: '12px', fontWeight: 800, color: '#C2410C', cursor: 'pointer', textAlign: 'left' }}
                >
                  ☕ Simular Alerta Café da Manhã
                </button>

                <button 
                  onClick={() => {
                    playChimeWithFadeIn({ durationSecs: 4 });
                    onSimulateAlert({ titulo: 'Alerta almoço', mensagem: 'Hora do Almoço Nutritivo!' });
                  }}
                  style={{ background: '#FFEBEE', border: '2px solid #E30613', padding: '14px', borderRadius: '12px', fontWeight: 800, color: '#B3000B', cursor: 'pointer', textAlign: 'left' }}
                >
                  🍲 Simular Alerta Almoço
                </button>

                <button 
                  onClick={() => {
                    playChimeWithFadeIn({ durationSecs: 4 });
                    onSimulateAlert({ titulo: 'Alerta café da tarde', mensagem: 'Horário do Lanche da Tarde!' });
                  }}
                  style={{ background: '#E6F7F5', border: '2px solid #00A896', padding: '14px', borderRadius: '12px', fontWeight: 800, color: '#0F766E', cursor: 'pointer', textAlign: 'left' }}
                >
                  🍎 Simular Alerta Lanche da Tarde
                </button>

                <button 
                  onClick={() => {
                    playChimeWithFadeIn({ durationSecs: 4 });
                    onSimulateAlert({ titulo: 'Alerta segunda aula', mensagem: 'Sinal de Troca de Aula!' });
                  }}
                  style={{ background: '#F3E8FF', border: '2px solid #7209B7', padding: '14px', borderRadius: '12px', fontWeight: 800, color: '#6B21A8', cursor: 'pointer', textAlign: 'left' }}
                >
                  🔔 Simular Troca de Aula
                </button>

                <button 
                  onClick={() => {
                    playChimeWithFadeIn({ durationSecs: 4 });
                    onSimulateAlert({ titulo: 'Alerta saida', mensagem: 'Atenção alunos: Horário de Saída!' });
                  }}
                  style={{ background: '#FEF2F2', border: '2px solid #DC2626', padding: '14px', borderRadius: '12px', fontWeight: 800, color: '#991B1B', cursor: 'pointer', textAlign: 'left', gridColumn: 'span 2' }}
                >
                  🚌 Simular Horário de Saída
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
