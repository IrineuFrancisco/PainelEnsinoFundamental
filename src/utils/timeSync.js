/**
 * Relógio & Sincronização HTTP de Alta Precisão (Herdado do NovoPainelSesi)
 * 
 * Sincroniza o relógio do cliente com o servidor web via HTTP HEAD/GET,
 * calculando a latência de rede (end - start) / 2 a partir do cabeçalho Date.
 * Mantém um relógio interno incrementado a cada 1s e ressincroniza a cada 5 min.
 */

let timeOffsetMs = 0;
let isSynced = false;
let lastSyncTime = null;

export async function syncTimeWithServer() {
  const startTime = Date.now();
  try {
    // Usamos parâmetro anti-cache _t=timestamp
    const response = await fetch(`/avisos.json?_t=${startTime}`, { method: 'HEAD' });
    const endTime = Date.now();
    const serverDateHeader = response.headers.get('date');

    if (serverDateHeader) {
      const serverTimeMs = new Date(serverDateHeader).getTime();
      const roundTripLatencyMs = (endTime - startTime) / 2;
      const accurateServerTime = serverTimeMs + roundTripLatencyMs;
      
      timeOffsetMs = accurateServerTime - endTime;
      isSynced = true;
      lastSyncTime = new Date(accurateServerTime);
      console.log(`[TimeSync] Sincronizado com sucesso! Latência: ${roundTripLatencyMs.toFixed(1)}ms | Offset: ${timeOffsetMs.toFixed(0)}ms`);
      return { success: true, offset: timeOffsetMs, latency: roundTripLatencyMs };
    }
  } catch (error) {
    console.warn('[TimeSync] Falha na sincronização com servidor HTTP. Usando relógio local:', error);
  }
  return { success: false, offset: 0, latency: 0 };
}

export function getSyncedDate() {
  return new Date(Date.now() + timeOffsetMs);
}

export function formatTimeBR(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function formatDateExtenso(date) {
  const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const str = date.toLocaleDateString('pt-BR', opcoes);
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getDiaSemanaChave(date) {
  const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return dias[date.getDay()];
}

export function isTimeSyncActive() {
  return isSynced;
}

export function getLastSyncTime() {
  return lastSyncTime;
}
