import React, { useState, useEffect } from 'react';
import { 
  Settings, Plus, Trash2, Edit2, Save, Download, RefreshCw, X, Volume2, Bell, 
  Cloud, CloudOff, CheckCircle2, AlertCircle, UploadCloud, Database
} from 'lucide-react';
import { savePanelDataToLocal } from '../utils/mediaHelpers';
import { 
  isSupabaseConfigured, 
  testSupabaseConnection, 
  fetchCardapioSupabase, 
  saveCardapioSupabase, 
  fetchAvisosSupabase, 
  saveAvisosSupabase 
} from '../utils/supabaseClient';

export default function AdminAvisos({ data, onSaveData, onClose, onSimulateAlert }) {
  const [activeTab, setActiveTab] = useState('avisos');
  const [panelData, setPanelData] = useState(JSON.parse(JSON.stringify(data)));
  const [editingAviso, setEditingAviso] = useState(null);

  // Estados de status do Supabase
  const [supabaseStatus, setSupabaseStatus] = useState({
    checked: false,
    loading: false,
    configured: isSupabaseConfigured(),
    connected: false,
    message: ''
  });
  const [syncLoading, setSyncLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Form states para novo aviso
  const [novoAviso, setNovoAviso] = useState({
    titulo: '',
    mensagem: '',
    categoria: 'Pedagógico',
    cor: '#20B2AA',
    duracao: 8,
    ativo: true
  });

  // Checa conexão com Supabase ao abrir
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setSupabaseStatus(prev => ({ ...prev, loading: true }));
    const res = await testSupabaseConnection();
    setSupabaseStatus({
      checked: true,
      loading: false,
      configured: res.configured,
      connected: res.success,
      message: res.message
    });
  };

  const showFeedback = (type, text) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handleSaveAll = () => {
    savePanelDataToLocal(panelData);
    onSaveData(panelData);
    showFeedback('success', 'Dados salvos no armazenamento local com sucesso!');
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

  // Sincronizar (baixar) tudo da nuvem
  const handleSyncFromSupabase = async () => {
    setSyncLoading(true);
    try {
      const [cardapioRes, avisosRes] = await Promise.all([
        fetchCardapioSupabase(panelData),
        fetchAvisosSupabase(panelData)
      ]);

      const updated = {
        ...panelData,
        ...(cardapioRes.success && cardapioRes.data ? { cardapio: cardapioRes.data } : {}),
        ...(avisosRes.success && avisosRes.data ? { avisos: avisosRes.data } : {})
      };

      setPanelData(updated);
      savePanelDataToLocal(updated);
      onSaveData(updated);
      showFeedback('success', 'Cardápio e Avisos sincronizados com sucesso do Supabase!');
    } catch (err) {
      showFeedback('error', `Erro ao sincronizar: ${err.message}`);
    } finally {
      setSyncLoading(false);
    }
  };

  // Publicar (enviar) dados locais atuais para o Supabase
  const handleUploadToSupabase = async () => {
    setSyncLoading(true);
    try {
      const [cardapioRes, avisosRes] = await Promise.all([
        saveCardapioSupabase(panelData.cardapio),
        saveAvisosSupabase(panelData.avisos)
      ]);

      if (cardapioRes.success && avisosRes.success) {
        showFeedback('success', 'Cardápio e Avisos publicados no Supabase com sucesso!');
      } else {
        const errorMsg = [cardapioRes.message, avisosRes.message].filter(Boolean).join(' | ');
        showFeedback('error', `Erro ao salvar no Supabase: ${errorMsg}`);
      }
    } catch (err) {
      showFeedback('error', `Falha ao enviar: ${err.message}`);
    } finally {
      setSyncLoading(false);
    }
  };

  // Salvar Cardápio no Supabase diretamente da aba Cardápio
  const handleSaveCardapioSupabase = async () => {
    setSyncLoading(true);
    try {
      savePanelDataToLocal(panelData);
      onSaveData(panelData);

      const res = await saveCardapioSupabase(panelData.cardapio);
      if (res.success) {
        showFeedback('success', 'Cardápio salvo localmente e na nuvem Supabase!');
      } else {
        showFeedback('error', `Salvo localmente, mas erro no Supabase: ${res.message}`);
      }
    } catch (err) {
      showFeedback('error', `Erro ao salvar cardápio: ${err.message}`);
    } finally {
      setSyncLoading(false);
    }
  };

  // Salvar Avisos no Supabase diretamente da aba Avisos
  const handleSaveAvisosSupabase = async () => {
    setSyncLoading(true);
    try {
      savePanelDataToLocal(panelData);
      onSaveData(panelData);

      const res = await saveAvisosSupabase(panelData.avisos);
      if (res.success) {
        showFeedback('success', 'Avisos salvos localmente e na nuvem Supabase!');
      } else {
        showFeedback('error', `Salvo localmente, mas erro no Supabase: ${res.message}`);
      }
    } catch (err) {
      showFeedback('error', `Erro ao salvar avisos: ${err.message}`);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleAddAviso = (e) => {
    e.preventDefault();
    if (!novoAviso.titulo || !novoAviso.mensagem) return;
    const created = {
      ...novoAviso,
      id: `av-${Date.now()}`
    };
    const updatedAvisos = [...(panelData.avisos || []), created];
    setPanelData((prev) => ({
      ...prev,
      avisos: updatedAvisos
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
      <div className="alert-modal-card" style={{ maxWidth: '960px', width: '95%', maxHeight: '92vh', overflow: 'hidden', padding: 0, border: '3px solid var(--sesi-red)' }}>
        {/* Admin Topbar */}
        <div style={{ background: 'var(--sesi-red)', color: 'white', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={24} />
            <h2 style={{ fontFamily: 'MomoTrust, sans-serif', fontSize: '1.35rem', margin: 0 }}>
              Painel Administrativo - Ensino Fundamental
            </h2>
          </div>

          {/* Supabase Status Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: 'rgba(0, 0, 0, 0.25)', 
                padding: '4px 12px', 
                borderRadius: '20px', 
                fontSize: '0.8rem',
                fontWeight: 600
              }}
              title={supabaseStatus.message || 'Status Supabase'}
            >
              {supabaseStatus.loading ? (
                <>
                  <RefreshCw size={14} className="spin" /> Verificando...
                </>
              ) : supabaseStatus.connected ? (
                <>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80' }}></span>
                  <span>Supabase Online</span>
                </>
              ) : supabaseStatus.configured ? (
                <>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F87171' }}></span>
                  <span>Supabase Offline</span>
                </>
              ) : (
                <>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94A3B8' }}></span>
                  <span>Supabase (.env pendente)</span>
                </>
              )}
            </div>

            <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: 'white', cursor: 'pointer', padding: 4 }}>
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Feedback Alert Bar if any */}
        {feedbackMsg && (
          <div style={{
            padding: '8px 24px',
            fontSize: '0.9rem',
            fontWeight: 700,
            background: feedbackMsg.type === 'success' ? '#DCFCE7' : '#FEE2E2',
            color: feedbackMsg.type === 'success' ? '#15803D' : '#B91C1C',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {feedbackMsg.text}
          </div>
        )}

        {/* Tab Selector & Action Buttons */}
        <div style={{ background: '#F1F5F9', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #CBD5E1', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              className={`grade-btn ${activeTab === 'avisos' ? 'active' : ''}`}
              onClick={() => setActiveTab('avisos')}
              style={{ background: activeTab === 'avisos' ? 'var(--sesi-red)' : '#CBD5E1', color: activeTab === 'avisos' ? 'white' : '#334155' }}
            >
              Avisos ({panelData.avisos?.length || 0})
            </button>
            <button 
              className={`grade-btn ${activeTab === 'cardapio' ? 'active' : ''}`}
              onClick={() => setActiveTab('cardapio')}
              style={{ background: activeTab === 'cardapio' ? 'var(--sesi-red)' : '#CBD5E1', color: activeTab === 'cardapio' ? 'white' : '#334155' }}
            >
              Cardápio da Semana
            </button>
            <button 
              className={`grade-btn ${activeTab === 'nuvem' ? 'active' : ''}`}
              onClick={() => setActiveTab('nuvem')}
              style={{ background: activeTab === 'nuvem' ? '#0F766E' : '#CBD5E1', color: activeTab === 'nuvem' ? 'white' : '#334155' }}
            >
              <Cloud size={15} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Supabase / Nuvem
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
              <Download size={16} /> avisos.json
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: 'calc(92vh - 150px)', width: '100%' }}>
          {/* ABA AVISOS */}
          {activeTab === 'avisos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Gerenciar Avisos e Recados</h3>
                {supabaseStatus.connected && (
                  <button
                    onClick={handleSaveAvisosSupabase}
                    disabled={syncLoading}
                    style={{ background: '#0F766E', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <UploadCloud size={16} /> {syncLoading ? 'Salvando...' : 'Salvar Avisos no Supabase'}
                  </button>
                )}
              </div>

              {/* Form de Inserção de Novo Aviso */}
              <form onSubmit={handleAddAviso} style={{ background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Cadastrar Novo Aviso</h4>
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
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Avisos Cadastrados</h4>
                {panelData.avisos?.map((aviso) => (
                  <div key={aviso.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', background: '#F1F5F9', borderLeft: `6px solid ${aviso.cor || '#20B2AA'}` }}>
                    <div style={{ flex: 1, marginRight: '16px' }}>
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

          {/* ABA CARDAPIO */}
          {activeTab === 'cardapio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>
                  Edite os pratos principais do almoço e lanches da semana para o Ensino Fundamental:
                </p>
                {supabaseStatus.connected && (
                  <button 
                    onClick={handleSaveCardapioSupabase}
                    disabled={syncLoading}
                    style={{ background: '#0F766E', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <UploadCloud size={16} /> {syncLoading ? 'Salvando...' : 'Salvar Cardápio no Supabase'}
                  </button>
                )}
              </div>

              {['segunda', 'terca', 'quarta', 'quinta', 'sexta'].map((dia) => (
                <div key={dia} style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ textTransform: 'capitalize', fontWeight: 800, color: 'var(--sesi-red)', margin: '0 0 10px 0' }}>
                    {dia}-feira
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    {/* Almoço */}
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>
                        Almoço - Prato Principal:
                      </label>
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

                    {/* Café da Tarde */}
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>
                        Lanche da Tarde:
                      </label>
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

                    {/* Fruta da Tarde */}
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>
                        Fruta do Lanche:
                      </label>
                      <input 
                        type="text" 
                        value={panelData.cardapio?.[dia]?.cafe_tarde?.fruta || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPanelData(prev => ({
                            ...prev,
                            cardapio: {
                              ...prev.cardapio,
                              [dia]: {
                                ...prev.cardapio?.[dia],
                                cafe_tarde: { ...prev.cardapio?.[dia]?.cafe_tarde, fruta: val }
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

          {/* ABA SUPABASE / NUVEM */}
          {activeTab === 'nuvem' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '14px', border: '1px solid #CBD5E1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Database size={24} color="#0F766E" />
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Status da Conexão Supabase</h3>
                      <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
                        Sincronização em nuvem e atualizações em tempo real para as Smart TVs
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={checkConnection}
                    disabled={supabaseStatus.loading}
                    style={{ background: '#0284C7', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <RefreshCw size={14} className={supabaseStatus.loading ? 'spin' : ''} /> Testar Conexão
                  </button>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', background: supabaseStatus.connected ? '#DCFCE7' : supabaseStatus.configured ? '#FEE2E2' : '#F1F5F9', border: `1px solid ${supabaseStatus.connected ? '#86EFAC' : supabaseStatus.configured ? '#FCA5A5' : '#CBD5E1'}` }}>
                  <div style={{ fontWeight: 800, color: supabaseStatus.connected ? '#15803D' : supabaseStatus.configured ? '#B91C1C' : '#475569', marginBottom: 4 }}>
                    {supabaseStatus.connected ? '✅ Supabase Conectado e Operando' : supabaseStatus.configured ? '⚠️ Erro na Conexão' : 'ℹ️ Supabase não configurado localmente'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                    {supabaseStatus.message || (supabaseStatus.configured ? 'Verifique a chave ou se as tabelas foram criadas.' : 'Para conectar, preencha o arquivo .env na raiz do projeto com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')}
                  </div>
                </div>
              </div>

              {/* Botões de Ação Nuvem */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem' }}>Baixar da Nuvem</h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                    Puxa os dados mais recentes do Supabase (cardápio e avisos) e atualiza o painel e o cache local.
                  </p>
                  <button
                    onClick={handleSyncFromSupabase}
                    disabled={!supabaseStatus.connected || syncLoading}
                    style={{ marginTop: 'auto', background: supabaseStatus.connected ? '#0284C7' : '#94A3B8', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 800, cursor: supabaseStatus.connected ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Download size={16} /> {syncLoading ? 'Sincronizando...' : 'Sincronizar do Supabase'}
                  </button>
                </div>

                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem' }}>Publicar Dados Locais</h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                    Envia o cardápio e todos os avisos cadastrados nesta tela para o Supabase (carga inicial ou atualização em lote).
                  </p>
                  <button
                    onClick={handleUploadToSupabase}
                    disabled={!supabaseStatus.connected || syncLoading}
                    style={{ marginTop: 'auto', background: supabaseStatus.connected ? '#0F766E' : '#94A3B8', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 800, cursor: supabaseStatus.connected ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <UploadCloud size={16} /> {syncLoading ? 'Enviando...' : 'Enviar Tudo para o Supabase'}
                  </button>
                </div>
              </div>

              {/* Guia Rápido de Configuração */}
              <div style={{ background: '#EFF6FF', padding: '16px', borderRadius: '14px', border: '1px solid #BFDBFE' }}>
                <h4 style={{ margin: '0 0 8px 0', fontWeight: 800, color: '#1E40AF', fontSize: '0.95rem' }}>
                  Passo a Passo para Configurar o Supabase:
                </h4>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#1E3A8A', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>
                    <strong>Criar Tabelas no Supabase:</strong> Copie o conteúdo do arquivo <code>supabase_schema.sql</code> (já criado na raiz do projeto) e cole no <em>SQL Editor</em> do Supabase, depois clique em <strong>Run</strong>.
                  </li>
                  <li>
                    <strong>Pegar as Credenciais:</strong> No Supabase, vá em <em>Project Settings → API</em> e copie a <code>URL</code> e a <code>anon public key</code>.
                  </li>
                  <li>
                    <strong>Preencher o .env:</strong> Insira os valores no arquivo <code>.env</code> na raiz do projeto:
                    <pre style={{ background: '#DBEAFE', padding: '6px 10px', borderRadius: '6px', marginTop: 4, fontFamily: 'monospace' }}>
                      VITE_SUPABASE_URL=https://seu-projeto.supabase.co{'\n'}
                      VITE_SUPABASE_ANON_KEY=sua-chave-anonima
                    </pre>
                  </li>
                  <li>
                    <strong>Reiniciar o servidor Vite:</strong> Reinicie o comando <code>npm run dev</code> para carregar as novas variáveis de ambiente.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* ABA TESTES */}
          {activeTab === 'testes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Simulação de Alertas Sonoros e Visuais</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748B' }}>
                Clique nos botões abaixo para simular o disparo de sinal escolar com fade-in e overlay visual em tela cheia:
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button 
                  onClick={() => onSimulateAlert('entrada')}
                  style={{ background: '#E0F2FE', border: '2px solid #0284C7', padding: '14px', borderRadius: '12px', fontWeight: 800, color: '#0369A1', cursor: 'pointer', textAlign: 'left' }}
                >
                  ☀️ 07:00 - Simular Entrada (bom dia.mp3)
                </button>

                <button 
                  onClick={() => onSimulateAlert('cafe_manha')}
                  style={{ background: '#FFF3E0', border: '2px solid #F77F00', padding: '14px', borderRadius: '12px', fontWeight: 800, color: '#C2410C', cursor: 'pointer', textAlign: 'left' }}
                >
                  ☕ 07:50 - Simular Café da Manhã (comer comer.mp3)
                </button>

                <button 
                  onClick={() => onSimulateAlert('segunda_aula')}
                  style={{ background: '#F3E8FF', border: '2px solid #7209B7', padding: '14px', borderRadius: '12px', fontWeight: 800, color: '#6B21A8', cursor: 'pointer', textAlign: 'left' }}
                >
                  🔔 09:00 - Simular Fim da 2ª Aula (Sinal Escolar)
                </button>

                <button 
                  onClick={() => onSimulateAlert('almoco')}
                  style={{ background: '#FFEBEE', border: '2px solid #E30613', padding: '14px', borderRadius: '12px', fontWeight: 800, color: '#B3000B', cursor: 'pointer', textAlign: 'left' }}
                >
                  🍲 10:40 - Simular Almoço (taNaHoraDoPaPa.mp3)
                </button>

                <button 
                  onClick={() => onSimulateAlert('cafe_tarde')}
                  style={{ background: '#E6F7F5', border: '2px solid #00A896', padding: '14px', borderRadius: '12px', fontWeight: 800, color: '#0F766E', cursor: 'pointer', textAlign: 'left' }}
                >
                  🍎 14:00 - Simular Café da Tarde (comer comer.mp3)
                </button>

                <button 
                  onClick={() => onSimulateAlert('saida')}
                  style={{ background: '#FEF2F2', border: '2px solid #DC2626', padding: '14px', borderRadius: '12px', fontWeight: 800, color: '#991B1B', cursor: 'pointer', textAlign: 'left' }}
                >
                  🚌 16:00 - Simular Saída (tchau.mp3)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
