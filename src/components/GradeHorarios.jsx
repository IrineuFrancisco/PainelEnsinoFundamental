import React from 'react';
import { Calendar, Clock, Bath, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getDiaSemanaChave } from '../utils/timeSync';

export default function GradeHorarios({ horarios = [], gradeBanheiro = [], lembretesMaterial = {}, selectedGradeGroup, syncedDate }) {
  const currentHM = `${String(syncedDate.getHours()).padStart(2, '0')}:${String(syncedDate.getMinutes()).padStart(2, '0')}`;
  const diaChave = getDiaSemanaChave(syncedDate);
  const materialDoDia = lembretesMaterial[diaChave] || "Estojo completo e Cadernos de Rotina";

  const isCurrentEvent = (inicio, fim) => {
    return currentHM >= inicio && currentHM < fim;
  };

  return (
    <div className="panel-card" style={{ height: '100%' }}>
      <div className="card-header" style={{ background: 'linear-gradient(90deg, #1E293B 0%, #0F172A 100%)', color: 'white' }}>
        <h2 className="card-title" style={{ color: '#FFD700' }}>
          <Clock size={22} color="#FFD700" />
          Rotina de Horários
        </h2>
        <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: '10px' }}>
          {selectedGradeGroup === '1_2_ano' ? '1º / 2º Ano' : '3º ao 5º Ano'}
        </span>
      </div>

      <div className="card-body" style={{ gap: '14px', overflowY: 'auto' }}>
        {/* Lista de Aulas e Horários */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {horarios.map((item) => {
            const active = isCurrentEvent(item.inicio, item.fim);
            return (
              <div 
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: active 
                    ? 'linear-gradient(90deg, rgba(227,6,19,0.12) 0%, rgba(255,183,3,0.18) 100%)' 
                    : '#F8FAFC',
                  borderLeft: active ? '5px solid var(--sesi-red)' : '4px solid #CBD5E1',
                  boxShadow: active ? '0 4px 12px rgba(227,6,19,0.15)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ minWidth: '80px', fontWeight: 800, fontSize: '0.88rem', color: active ? 'var(--sesi-red)' : '#475569' }}>
                  {item.inicio}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: active ? '#0F172A' : '#334155' }}>
                    {item.evento}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {item.descricao}
                  </div>
                </div>
                {active && (
                  <span style={{
                    background: 'var(--sesi-red)',
                    color: 'white',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '10px',
                    animation: 'pulse-subtle 2s infinite'
                  }}>
                    AGORA
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Bloco RF004: Grade de Banheiro Programada */}
        <div style={{ 
          background: 'linear-gradient(135deg, #E6F7F5 0%, #CCFBF1 100%)', 
          border: '1.5px solid #20B2AA', 
          borderRadius: '14px', 
          padding: '12px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#0F766E', fontWeight: 800, fontSize: '0.9rem' }}>
            <Bath size={18} />
            Grade de Banheiro Programada
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {gradeBanheiro.map((gb, i) => (
              <div key={i} style={{ 
                background: 'white', 
                padding: '4px 8px', 
                borderRadius: '8px', 
                fontSize: '0.75rem', 
                fontWeight: 600,
                border: '1px solid #99F6E4',
                color: '#134E4A'
              }}>
                <strong>{gb.turma}:</strong> {gb.horario} ({gb.inspetor})
              </div>
            ))}
          </div>
        </div>

        {/* Bloco RF003: Lembrete de Material do Dia */}
        <div style={{ 
          background: '#FFF8E1', 
          border: '1.5px solid #FFB703', 
          borderRadius: '14px', 
          padding: '12px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: '#B45309', fontWeight: 800, fontSize: '0.88rem' }}>
            <BookOpen size={18} />
            Lembrete de Material do Dia
          </div>
          <p style={{ fontSize: '0.82rem', color: '#78350F', fontWeight: 600 }}>
            {materialDoDia}
          </p>
        </div>

        {/* Bloco RF005: Alerta Hora da Tarefa (Exclusivo 1º ano) */}
        {selectedGradeGroup === '1_2_ano' && (
          <div style={{ 
            background: '#F3E8FF', 
            border: '1.5px dashed #8A2BE2', 
            borderRadius: '14px', 
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={20} color="#7E22CE" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#6B21A8' }}>
                Bloco "Hora da Tarefa"
              </div>
              <div style={{ fontSize: '0.75rem', color: '#7E22CE' }}>
                Organize seu estojo e guarde os materiais no término da 4ª aula.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
