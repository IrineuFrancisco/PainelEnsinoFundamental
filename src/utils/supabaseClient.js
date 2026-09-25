import { createClient } from '@supabase/supabase-js';
import { savePanelDataToLocal } from './mediaHelpers';

// Configuração Supabase com fallback gracioso para resiliência offline em Smart TVs
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key-fallback';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Busca o Cardápio atualizado no banco de dados Supabase.
 * Se a requisição falhar ou estiver offline, mantém o cache local intacto.
 */
export async function fetchCardapioSupabase(currentPanelData) {
  try {
    console.log('[Supabase] Consultando tabela cardapio...');
    
    // Tenta buscar na tabela 'cardapio' do Supabase
    const { data, error } = await supabase
      .from('cardapio')
      .select('*');

    if (error) {
      console.warn('[Supabase] Tabela cardapio indisponível ou sem credenciais ativas. Mantendo dados locais:', error.message);
      return { success: false, data: currentPanelData?.cardapio };
    }

    if (data && data.length > 0) {
      // Converte linhas da tabela Supabase para o formato do painel (segunda, terca...)
      const cardapioFormatado = { ...currentPanelData?.cardapio };

      data.forEach((item) => {
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

      // Atualiza o cache offline local resiliente
      const updatedFullData = {
        ...currentPanelData,
        cardapio: cardapioFormatado,
        ultimaAtualizacaoCardapio: new Date().toISOString()
      };
      savePanelDataToLocal(updatedFullData);

      console.log('[Supabase] Cardápio sincronizado e salvo no cache resiliente com sucesso!');
      return { success: true, data: cardapioFormatado };
    }
  } catch (err) {
    console.warn('[Supabase] Conexão indisponível. Recorrendo ao cache offline:', err);
  }

  return { success: false, data: currentPanelData?.cardapio };
}
