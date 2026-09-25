import { createClient } from '@supabase/supabase-js';
import { savePanelDataToLocal } from './mediaHelpers';

// Configuração Supabase com fallback gracioso para resiliência offline em Smart TVs
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const SUPABASE_URL = rawUrl && rawUrl.startsWith('http') ? rawUrl : 'https://xyzcompany.supabase.co';
const SUPABASE_ANON_KEY = rawKey && rawKey.length > 10 ? rawKey : 'public-anon-key-fallback';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Verifica se as credenciais do Supabase foram preenchidas no .env
 */
export function isSupabaseConfigured() {
  return (
    Boolean(rawUrl) &&
    rawUrl.startsWith('http') &&
    !rawUrl.includes('xyzcompany') &&
    Boolean(rawKey) &&
    rawKey !== 'public-anon-key-fallback'
  );
}

/**
 * Testa a conexão com o Supabase e checa se as tabelas existem
 */
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      configured: false,
      message: 'Chaves do Supabase não configuradas no arquivo .env'
    };
  }

  try {
    const { count, error } = await supabase
      .from('cardapio')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        success: false,
        configured: true,
        message: `Erro na tabela 'cardapio': ${error.message}`,
        error
      };
    }

    return {
      success: true,
      configured: true,
      message: `Conexão bem-sucedida! Tabela 'cardapio' acessível (${count ?? 0} registros encontrados).`
    };
  } catch (err) {
    return {
      success: false,
      configured: true,
      message: `Falha de rede ou CORS: ${err.message}`,
      error: err
    };
  }
}

/**
 * Busca o Cardápio atualizado no banco de dados Supabase.
 * Se a requisição falhar ou estiver offline, mantém o cache local intacto.
 */
export async function fetchCardapioSupabase(currentPanelData) {
  if (!isSupabaseConfigured()) {
    return { success: false, data: currentPanelData?.cardapio };
  }

  try {
    console.log('[Supabase] Consultando tabela cardapio...');
    const { data, error } = await supabase.from('cardapio').select('*');

    if (error) {
      console.warn('[Supabase] Erro ao consultar cardapio:', error.message);
      return { success: false, data: currentPanelData?.cardapio };
    }

    if (data && data.length > 0) {
      const cardapioFormatado = { ...currentPanelData?.cardapio };

      data.forEach((item) => {
        const dia = String(item.dia_semana || item.dia || '').toLowerCase();
        if (dia) {
          cardapioFormatado[dia] = {
            cafe_manha: {
              prato: item.cafe_manha_prato ?? item.cafe_prato ?? cardapioFormatado[dia]?.cafe_manha?.prato ?? '',
              suco: item.cafe_manha_suco ?? item.cafe_suco ?? cardapioFormatado[dia]?.cafe_manha?.suco ?? '',
              fruta: item.cafe_manha_fruta ?? item.cafe_fruta ?? cardapioFormatado[dia]?.cafe_manha?.fruta ?? ''
            },
            almoco: {
              prato: item.almoco_prato ?? item.prato_principal ?? cardapioFormatado[dia]?.almoco?.prato ?? '',
              salada: item.almoco_salada ?? item.salada ?? cardapioFormatado[dia]?.almoco?.salada ?? '',
              sobremesa: item.almoco_sobremesa ?? item.sobremesa ?? cardapioFormatado[dia]?.almoco?.sobremesa ?? ''
            },
            cafe_tarde: {
              prato: item.cafe_tarde_prato ?? item.lanche_prato ?? cardapioFormatado[dia]?.cafe_tarde?.prato ?? '',
              bebida: item.cafe_tarde_bebida ?? item.lanche_bebida ?? cardapioFormatado[dia]?.cafe_tarde?.bebida ?? '',
              fruta: item.cafe_tarde_fruta ?? item.lanche_fruta ?? cardapioFormatado[dia]?.cafe_tarde?.fruta ?? ''
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

      console.log('[Supabase] Cardápio sincronizado com sucesso!');
      return { success: true, data: cardapioFormatado };
    }
  } catch (err) {
    console.warn('[Supabase] Conexão indisponível ao buscar cardapio:', err);
  }

  return { success: false, data: currentPanelData?.cardapio };
}

/**
 * Salva o Cardápio no banco de dados Supabase via Upsert.
 */
export async function saveCardapioSupabase(cardapio) {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase não configurado no .env' };
  }

  try {
    const rows = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'].map((dia) => {
      const dayData = cardapio?.[dia] || {};
      return {
        dia_semana: dia,
        cafe_manha_prato: dayData.cafe_manha?.prato || '',
        cafe_manha_suco: dayData.cafe_manha?.suco || '',
        cafe_manha_fruta: dayData.cafe_manha?.fruta || '',
        almoco_prato: dayData.almoco?.prato || '',
        almoco_salada: dayData.almoco?.salada || '',
        almoco_sobremesa: dayData.almoco?.sobremesa || '',
        cafe_tarde_prato: dayData.cafe_tarde?.prato || '',
        cafe_tarde_bebida: dayData.cafe_tarde?.bebida || '',
        cafe_tarde_fruta: dayData.cafe_tarde?.fruta || '',
        updated_at: new Date().toISOString()
      };
    });

    const { data, error } = await supabase
      .from('cardapio')
      .upsert(rows, { onConflict: 'dia_semana' })
      .select();

    if (error) {
      console.error('[Supabase] Erro ao salvar cardapio:', error);
      return { success: false, message: error.message };
    }

    console.log('[Supabase] Cardápio salvo no Supabase com sucesso!', data);
    return { success: true, data };
  } catch (err) {
    console.error('[Supabase] Exceção ao salvar cardapio:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Busca avisos no Supabase com fallback para os dados locais
 */
export async function fetchAvisosSupabase(currentPanelData) {
  if (!isSupabaseConfigured()) {
    return { success: false, data: currentPanelData?.avisos };
  }

  try {
    console.log('[Supabase] Consultando avisos...');
    const { data, error } = await supabase
      .from('avisos')
      .select('*')
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] Erro ao consultar avisos:', error.message);
      return { success: false, data: currentPanelData?.avisos };
    }

    if (data && data.length > 0) {
      const avisosFormatados = data.map((item, index) => ({
        id: item.id || `av-${index + 1}`,
        titulo: item.titulo,
        mensagem: item.mensagem,
        categoria: item.categoria || 'Pedagógico',
        cor: item.cor || '#20B2AA',
        duracao: item.duracao || 8,
        icone: item.icone || 'sparkles',
        ativo: item.ativo !== false
      }));

      // Salva no cache local resiliente
      const updatedFullData = {
        ...currentPanelData,
        avisos: avisosFormatados,
        ultimaAtualizacaoAvisos: new Date().toISOString()
      };
      savePanelDataToLocal(updatedFullData);

      console.log('[Supabase] Avisos sincronizados com sucesso!');
      return { success: true, data: avisosFormatados };
    }
  } catch (err) {
    console.warn('[Supabase] Conexão indisponível ao buscar avisos:', err);
  }

  return { success: false, data: currentPanelData?.avisos };
}

/**
 * Salva avisos no Supabase
 */
export async function saveAvisosSupabase(avisosList) {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase não configurado no .env' };
  }

  try {
    const rows = (avisosList || []).map((a, idx) => ({
      id: a.id || `av-${Date.now()}-${idx}`,
      titulo: a.titulo,
      mensagem: a.mensagem,
      categoria: a.categoria || 'Pedagógico',
      cor: a.cor || '#20B2AA',
      duracao: a.duracao || 8,
      icone: a.icone || 'sparkles',
      ativo: a.ativo !== false,
      ordem: idx + 1,
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('avisos')
      .upsert(rows, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('[Supabase] Erro ao salvar avisos:', error);
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[Supabase] Exceção ao salvar avisos:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Remove um aviso no Supabase
 */
export async function deleteAvisoSupabase(id) {
  if (!isSupabaseConfigured()) return { success: false };
  try {
    const { error } = await supabase.from('avisos').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[Supabase] Erro ao deletar aviso:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Assina atualizações em tempo real (Supabase Realtime)
 * para que edições no painel/dashboard reflitam instantaneamente nas Smart TVs.
 */
export function subscribeToSupabaseChanges({ onCardapioChange, onAvisosChange }) {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  console.log('[Supabase Realtime] Conectando ao canal de atualizações em tempo real...');

  const channel = supabase
    .channel('painel-realtime-fundamental')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'cardapio' },
      (payload) => {
        console.log('[Supabase Realtime] Alteração detectada em cardapio:', payload);
        if (typeof onCardapioChange === 'function') {
          onCardapioChange(payload);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'avisos' },
      (payload) => {
        console.log('[Supabase Realtime] Alteração detectada em avisos:', payload);
        if (typeof onAvisosChange === 'function') {
          onAvisosChange(payload);
        }
      }
    )
    .subscribe((status) => {
      console.log(`[Supabase Realtime] Status da conexão: ${status}`);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
