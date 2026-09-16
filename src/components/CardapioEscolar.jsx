import React from 'react';
import { Utensils, Sun, Coffee, Apple, Award } from 'lucide-react';
import { getDiaSemanaChave } from '../utils/timeSync';

export default function CardapioEscolar({ cardapio = {}, syncedDate }) {
  const diaChave = getDiaSemanaChave(syncedDate);
  const cardapioHoje = cardapio[diaChave] || cardapio['segunda'] || {};

  const hour = syncedDate.getHours();
  
  // Determina qual refeição destacar conforme o horário atual
  let activeMealKey = 'almoco';
  if (hour < 10) {
    activeMealKey = 'cafe_manha';
  } else if (hour >= 10 && hour < 14) {
    activeMealKey = 'almoco';
  } else {
    activeMealKey = 'cafe_tarde';
  }

  const meals = [
    {
      key: 'cafe_manha',
      title: 'Café da Manhã',
      time: '07:15 - 07:45',
      icon: Coffee,
      color: '#F77F00',
      bgColor: '#FFF3E0',
      data: cardapioHoje.cafe_manha
    },
    {
      key: 'almoco',
      title: 'Almoço Nutritivo',
      time: '11:25 - 12:30',
      icon: Utensils,
      color: '#E30613',
      bgColor: '#FFEBEE',
      data: cardapioHoje.almoco
    },
    {
      key: 'cafe_tarde',
      title: 'Lanche da Tarde',
      time: '15:00 - 15:20',
      icon: Sun,
      color: '#00A896',
      bgColor: '#E6F7F5',
      data: cardapioHoje.cafe_tarde
    }
  ];

  return (
    <div className="panel-card" style={{ height: '100%' }}>
      <div className="card-header" style={{ background: 'linear-gradient(90deg, #E30613 0%, #B3000B 100%)', color: 'white' }}>
        <h2 className="card-title" style={{ color: 'white' }}>
          <Utensils size={22} color="white" />
          Cardápio do Dia
        </h2>
        <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '10px', textTransform: 'capitalize' }}>
          {diaChave}
        </span>
      </div>

      <div className="card-body" style={{ gap: '12px', overflowY: 'auto' }}>
        {meals.map((meal) => {
          const isActive = activeMealKey === meal.key;
          const Icon = meal.icon;
          const info = meal.data || {};

          return (
            <div 
              key={meal.key}
              style={{
                borderRadius: '16px',
                padding: '12px 14px',
                background: isActive ? meal.bgColor : '#F8FAFC',
                border: isActive ? `2px solid ${meal.color}` : '1px solid #E2E8F0',
                boxShadow: isActive ? '0 6px 16px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: meal.color, fontWeight: 800, fontSize: '0.95rem' }}>
                  <Icon size={18} />
                  {meal.title}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
                  {meal.time}
                </span>
              </div>

              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1E293B', marginBottom: '4px', lineHeight: '1.3' }}>
                {info.prato || 'Prato não informado'}
              </div>

              {info.salada && (
                <div style={{ fontSize: '0.78rem', color: '#2E7D32', fontWeight: 600 }}>
                  🥗 {info.salada}
                </div>
              )}

              {info.fruta && (
                <div style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 600 }}>
                  🍎 Fruta: {info.fruta}
                </div>
              )}

              {info.sobremesa && (
                <div style={{ fontSize: '0.78rem', color: '#7C3AED', fontWeight: 600 }}>
                  🍮 Sobremesa: {info.sobremesa}
                </div>
              )}

              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: meal.color,
                  color: 'white',
                  borderRadius: '50%',
                  padding: '3px'
                }}>
                  <Award size={14} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
