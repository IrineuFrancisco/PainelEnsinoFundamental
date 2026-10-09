import { createClient } from '@supabase/supabase-js';
import { savePanelDataToLocal } from './mediaHelpers';

// Credenciais do Supabase (Vite / React env + fallback)
const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_URL) || 'https://qfnibnhjdnczxoublxif.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_ANON_KEY) || 'sb_publishable_rZf4HnUkAiO16oaQwserjg_Axj-2BwL';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

function normalizarDiaChave(titulo = '') {
  const t = String(titulo).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (t.includes('segunda')) return 'segunda';
  if (t.includes('terca')) return 'terca';
  if (t.includes('quarta')) return 'quarta';
  if (t.includes('quinta')) return 'quinta';
  if (t.includes('sexta')) return 'sexta';
  return null;
}

function parseMensagemCardapio(mensagem = '') {
  const result = {
    cafe_manha: { prato: '' },
    almoco: { prato: '' },
    cafe_tarde: { prato: '' }
  };

  if (!mensagem) return result;

  const partes = mensagem.split('|').map((p) => p.trim());

  partes.forEach((parte) => {
    const parteLower = parte.toLowerCase();
    if (parteLower.startsWith('manhã:') || parteLower.startsWith('manha:')) {
      result.cafe_manha.prato = parte.replace(/^manh[ãa]:\s*/i, '').trim();
    } else if (parteLower.startsWith('almoço:') || parteLower.startsWith('almoco:')) {
      result.almoco.prato = parte.replace(/^almo[çc]o:\s*/i, '').trim();
    } else if (parteLower.startsWith('tarde:')) {
      result.cafe_tarde.prato = parte.replace(/^tarde:\s*/i, '').trim();
    }
  });

  // Se não foi separado por |, tenta extração por regex
  if (!result.cafe_manha.prato && !result.almoco.prato && !result.cafe_tarde.prato) {
    const manhaMatch = mensagem.match(/MANH[ÃA]:\s*([^|]+?)(?=(ALMO[ÇC]O:|TARDE:|$))/i);
    const almocoMatch = mensagem.match(/ALMO[ÇC]O:\s*([^|]+?)(?=(TARDE:|$))/i);
    const tardeMatch = mensagem.match(/TARDE:\s*([^|]+?)$/i);

    if (manhaMatch) result.cafe_manha.prato = manhaMatch[1].trim();
    if (almocoMatch) result.almoco.prato = almocoMatch[1].trim();
    if (tardeMatch) result.cafe_tarde.prato = tardeMatch[1].trim();
  }

  // Fallback se a mensagem não tiver marcadores
  if (!result.cafe_manha.prato && !result.almoco.prato && !result.cafe_tarde.prato) {
    result.almoco.prato = mensagem;
  }

  return result;
}

/**
 * Busca o Cardápio atualizado no banco de dados Supabase (tabela 'avisos' com tipo = 'cardapio').
 * Se a requisição falhar ou estiver offline, mantém o cache local intacto.
 */
export async function fetchCardapioSupabase(currentPanelData) {
  try {
    console.log('[Supabase] Consultando cardápio na tabela avisos (tipo = cardapio)...');

    // 1. Tenta buscar na tabela 'avisos' onde tipo = 'cardapio'
    const { data: avisosData, error: avisosError } = await supabase
      .from('avisos')
      .select('*')
      .eq('tipo', 'cardapio');

    if (!avisosError && avisosData && avisosData.length > 0) {
      const cardapioFormatado = { ...currentPanelData?.cardapio };

      avisosData.forEach((item) => {
        const dia = normalizarDiaChave(item.titulo);
        if (dia) {
          const parsed = parseMensagemCardapio(item.mensagem);
          cardapioFormatado[dia] = {
            cafe_manha: {
              prato: parsed.cafe_manha.prato || cardapioFormatado[dia]?.cafe_manha?.prato || '',
              suco: cardapioFormatado[dia]?.cafe_manha?.suco || '',
              fruta: cardapioFormatado[dia]?.cafe_manha?.fruta || ''
            },
            almoco: {
              prato: parsed.almoco.prato || cardapioFormatado[dia]?.almoco?.prato || '',
              salada: cardapioFormatado[dia]?.almoco?.salada || '',
              sobremesa: cardapioFormatado[dia]?.almoco?.sobremesa || ''
            },
            cafe_tarde: {
              prato: parsed.cafe_tarde.prato || cardapioFormatado[dia]?.cafe_tarde?.prato || '',
              bebida: cardapioFormatado[dia]?.cafe_tarde?.bebida || '',
              fruta: cardapioFormatado[dia]?.cafe_tarde?.fruta || ''
            }
          };
        }
      });

      // Atualiza o cache offline local
      const updatedFullData = {
        ...currentPanelData,
        cardapio: cardapioFormatado,
        ultimaAtualizacaoCardapio: new Date().toISOString()
      };
      savePanelDataToLocal(updatedFullData);

      console.log('[Supabase] Cardápio sincronizado da tabela avisos com sucesso!');
      return { success: true, data: cardapioFormatado };
    }

    // 2. Fallback: Tenta buscar na tabela 'cardapio' direta caso exista
    const { data: cardapioData, error: cardapioError } = await supabase
      .from('cardapio')
      .select('*');

    if (!cardapioError && cardapioData && cardapioData.length > 0) {
      const cardapioFormatado = { ...currentPanelData?.cardapio };

      cardapioData.forEach((item) => {
        const dia = String(item.dia_semana || item.dia || '').toLowerCase();
        if (dia) {
          cardapioFormatado[dia] = {
            cafe_manha: {
              prato: item.cafe_manha_prato || item.cafe_prato || cardapioFormatado[dia]?.cafe_manha?.prato,
              suco: item.cafe_manha_suco || item.cafe_suco || cardapioFormatado[dia]?.cafe_manha?.suco,
              fruta: item.cafe_manha_fruta || item.cafe_fruta || cardapioFormatado[dia]?.cafe_manha?.fruta
            },
            almoco: {
              prato: item.almoco_prato || item.prato_principal || cardapioFormatado[dia]?.almoco?.prato,
              salada: item.almoco_salada || item.salada || cardapioFormatado[dia]?.almoco?.salada,
              sobremesa: item.almoco_sobremesa || item.sobremesa || cardapioFormatado[dia]?.almoco?.sobremesa
            },
            cafe_tarde: {
              prato: item.cafe_tarde_prato || item.lanche_prato || cardapioFormatado[dia]?.cafe_tarde?.prato,
              bebida: item.cafe_tarde_bebida || item.lanche_bebida || cardapioFormatado[dia]?.cafe_tarde?.bebida,
              fruta: item.cafe_tarde_fruta || item.lanche_fruta || cardapioFormatado[dia]?.cafe_tarde?.fruta
            }
          };
        }
      });

      const updatedFullData = {
        ...currentPanelData,
        cardapio: cardapioFormatado,
        ultimaAtualizacaoCardapio: new Date().toISOString()
      };
      savePanelDataToLocal(updatedFullData);

      console.log('[Supabase] Cardápio sincronizado da tabela cardapio com sucesso!');
      return { success: true, data: cardapioFormatado };
    }
  } catch (err) {
    console.warn('[Supabase] Erro ao sincronizar cardápio:', err);
  }

  return { success: false, data: currentPanelData?.cardapio };
}

/**
 * Envia/importa as informações do Cardápio local para a tabela 'avisos' no Supabase.
 */
export async function uploadCardapioToSupabase(cardapioData) {
  if (!cardapioData) return { success: false, error: 'Sem dados de cardápio' };

  try {
    const diasMap = [
      { chave: 'segunda', titulo: 'Segunda-feira', ordem: 2 },
      { chave: 'terca', titulo: 'Terça-feira', ordem: 3 },
      { chave: 'quarta', titulo: 'Quarta-feira', ordem: 4 },
      { chave: 'quinta', titulo: 'Quinta-feira', ordem: 5 },
      { chave: 'sexta', titulo: 'Sexta-feira', ordem: 6 }
    ];

    // Busca IDs das linhas existentes na tabela 'avisos'
    const { data: existingRows } = await supabase
      .from('avisos')
      .select('*')
      .eq('tipo', 'cardapio');

    for (const d of diasMap) {
      const info = cardapioData[d.chave] || {};
      const manha = info.cafe_manha?.prato || '';
      const almoco = info.almoco?.prato || '';
      const tarde = info.cafe_tarde?.prato || '';

      const mensagemText = `MANHÃ: ${manha} | ALMOÇO: ${almoco} | TARDE: ${tarde}`;

      const matched = existingRows?.find((r) => normalizarDiaChave(r.titulo) === d.chave);

      if (matched) {
        // Atualiza a linha existente no Supabase
        await supabase
          .from('avisos')
          .update({
            mensagem: mensagemText,
            updated_at: new Date().toISOString()
          })
          .eq('id', matched.id);
      } else {
        // Insere nova linha se não existir
        await supabase.from('avisos').insert({
          tipo: 'cardapio',
          icone: '🍽️',
          titulo: d.titulo,
          mensagem: mensagemText,
          cor: '#06D6A0',
          ativo: true,
          ordem: d.ordem,
          duracao: 10
        });
      }
    }

    console.log('[Supabase Import] Cardápio atualizado na tabela avisos do Supabase!');
    return { success: true };
  } catch (err) {
    console.error('[Supabase Import Exception]:', err);
    return { success: false, error: err.message };
  }
}


