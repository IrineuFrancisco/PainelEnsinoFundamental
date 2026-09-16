import React, { useState, useEffect } from 'react';
import { Megaphone, Sparkles, BookMarked, Newspaper, Heart, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AvisosCarrossel({ 
  avisos = [], 
  alfabetizacao = {}, 
  projetoSemana = {}, 
  noticiasJoca = [], 
  selectedGradeGroup 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filtramos apenas avisos ativos
  const activeAvisos = avisos.filter(a => a.ativo !== false);

  // Montamos o deck de slides conforme a turma selecionada (1º/2º ano vs 3º-5º ano)
  const slides = [];

  // Slide 1: Avisos Cadastrados
  activeAvisos.forEach(a => {
    slides.push({
      type: 'aviso',
      title: a.titulo,
      body: a.mensagem,
      category: a.categoria || 'Aviso Escolar',
      color: a.cor || '#20B2AA',
      badge: 'Recado Institucional'
    });
  });

  // Slide 2: Alfabetização Visual (RF006) - Exclusivo 1º/2º ano
  if (selectedGradeGroup === '1_2_ano' && alfabetizacao?.familiaDestaque) {
    slides.push({
      type: 'alfabetizacao',
      title: 'Cantinho da Alfabetização',
      subtitle: alfabetizacao.familiaDestaque,
      palavras: alfabetizacao.palavras || [],
      dica: alfabetizacao.dica,
      color: '#7209B7',
      category: 'Alfabetização Visual (1º Ano)'
    });
  }

  // Slide 3: Projeto Preferido da Semana (RF007) - Exclusivo 2º ano / 1º-2º ano
  if (selectedGradeGroup === '1_2_ano' && projetoSemana?.titulo) {
    slides.push({
      type: 'projeto',
      title: projetoSemana.titulo,
      subtitle: projetoSemana.subtitulo,
      body: projetoSemana.descricao,
      progresso: projetoSemana.progresso,
      color: '#F77F00',
      category: 'Projeto da Semana (2º Ano)'
    });
  }

  // Slide 4: Notícias JOCA / CHC (RF007 3º-5º) - Exclusivo 3º ao 5º ano
  if (selectedGradeGroup === '3_4_5_ano' && noticiasJoca.length > 0) {
    noticiasJoca.forEach(n => {
      slides.push({
        type: 'noticia',
        title: n.titulo,
        body: n.resumo,
        fonte: n.fonte,
        data: n.data,
        color: '#00A896',
        category: `Notícia Infantil - ${n.fonte}`
      });
    });
  }

  // Rotação automática a cada 8 segundos
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="panel-card" style={{ height: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#94A3B8' }}>Nenhum aviso disponível no momento.</p>
      </div>
    );
  }

  const currentSlide = slides[currentIndex % slides.length];

  return (
    <div className="panel-card" style={{ height: '100%', borderTop: `6px solid ${currentSlide.color || '#E30613'}` }}>
      {/* Header com Categorização e Navegação */}
      <div className="card-header">
        <h2 className="card-title">
          <Megaphone size={22} color={currentSlide.color} />
          {currentSlide.category}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
            style={{ border: 'none', background: 'rgba(0,0,0,0.06)', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>
            {currentIndex + 1} / {slides.length}
          </span>
          <button 
            onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
            style={{ border: 'none', background: 'rgba(0,0,0,0.06)', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Conteúdo Dinâmico dos Slides */}
      <div className="card-body" style={{ justifyContent: 'center', padding: '24px' }}>
        {currentSlide.type === 'aviso' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="font-momo" style={{ fontSize: '1.8rem', color: currentSlide.color, lineHeight: '1.2' }}>
              {currentSlide.title}
            </h3>
            <p style={{ fontSize: '1.2rem', color: '#334155', lineHeight: '1.5', fontWeight: 500 }}>
              {currentSlide.body}
            </p>
          </div>
        )}

        {currentSlide.type === 'alfabetizacao' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#F3E8FF', padding: '16px', borderRadius: '16px', border: '2px solid #8A2BE2' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#6B21A8', textAlign: 'center' }}>
                {currentSlide.subtitle}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {currentSlide.palavras.map((p, idx) => (
                <span key={idx} style={{ 
                  background: 'white', 
                  border: '2px solid #7209B7', 
                  color: '#7209B7', 
                  fontWeight: 900, 
                  fontSize: '1.3rem', 
                  padding: '8px 18px', 
                  borderRadius: '30px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {p}
                </span>
              ))}
            </div>

            <p style={{ fontSize: '0.95rem', color: '#64748B', textAlign: 'center', fontStyle: 'italic', marginTop: '8px' }}>
              💡 {currentSlide.dica}
            </p>
          </div>
        )}

        {currentSlide.type === 'projeto' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <span style={{ color: '#F77F00', fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase' }}>
              🌟 {currentSlide.subtitle}
            </span>
            <h3 className="font-momo" style={{ fontSize: '1.7rem', color: '#C2410C' }}>
              {currentSlide.title}
            </h3>
            <p style={{ fontSize: '1.1rem', color: '#431407', lineHeight: '1.4' }}>
              {currentSlide.body}
            </p>
            <div style={{ background: '#FFF3E0', padding: '10px 14px', borderRadius: '12px', borderLeft: '4px solid #F77F00', fontSize: '0.9rem', fontWeight: 700, color: '#9A3412' }}>
              📌 {currentSlide.progresso}
            </div>
          </div>
        )}

        {currentSlide.type === 'noticia' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ background: '#CCFBF1', color: '#0F766E', padding: '4px 10px', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem' }}>
                📰 {currentSlide.fonte}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{currentSlide.data}</span>
            </div>
            <h3 className="font-momo" style={{ fontSize: '1.6rem', color: '#0F766E', lineHeight: '1.2' }}>
              {currentSlide.title}
            </h3>
            <p style={{ fontSize: '1.15rem', color: '#334155', lineHeight: '1.5' }}>
              {currentSlide.body}
            </p>
          </div>
        )}

        {/* Rodapé Visual do Carrossel com Mascote */}
        <div style={{ 
          marginTop: 'auto', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          background: 'rgba(241, 245, 249, 0.7)', 
          padding: '10px 16px', 
          borderRadius: '16px' 
        }}>
          <img src="/images/Mascote.png" alt="Mascote" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
            Dica do Mascote: Respeite os colegas e mantenha os espaços da escola sempre limpos!
          </span>
        </div>
      </div>

      {/* Progress Bar de Autoplay */}
      <div style={{ height: '4px', background: '#E2E8F0', width: '100%' }}>
        <div 
          key={currentIndex}
          style={{ 
            height: '100%', 
            background: currentSlide.color || 'var(--sesi-red)', 
            width: '100%', 
            animation: 'progressBar 8s linear infinite' 
          }} 
        />
      </div>

      <style>{`
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
