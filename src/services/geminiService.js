const { GoogleGenAI } = require('@google/genai');

/**
 * Obtém a lista de chaves de API do Gemini configuradas nas variáveis de ambiente.
 * Suporta GEMINI_API_KEYS (separadas por vírgula) ou GEMINI_API_KEY (única ou múltiplas).
 * @returns {string[]}
 */
function getGeminiApiKeys() {
  const raw = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

let currentKeyIndex = 0;

/**
 * Retorna uma chave da lista de chaves disponíveis com rotação round-robin.
 * @returns {string|null}
 */
function getNextApiKey() {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) return null;
  const key = keys[currentKeyIndex % keys.length];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
}

/**
 * Instancia o cliente da Google GenAI SDK.
 * @param {string} [apiKey]
 * @returns {GoogleGenAI}
 */
function getAiClient(apiKey) {
  const key = apiKey || getNextApiKey();
  if (!key) {
    throw new Error('Nenhuma chave de API do Gemini configurada (GEMINI_API_KEY ou GEMINI_API_KEYS ausente)');
  }
  return new GoogleGenAI({ apiKey: key });
}

/**
 * Processa a consulta do usuário utilizando o modelo Gemini para refinar a escrita.
 * 
 * @param {string} transcription Pergunta original do usuário
 * @returns {Promise<{ is_accounting: boolean, texto_corrigido: string }>}
 */
async function processApiQuery(transcription) {
  console.log('[API Agent] Processando consulta de dados...');

  const keys = getGeminiApiKeys();
  if (keys.length === 0) {
    console.warn('[API Agent] Nenhuma chave do Gemini configurada no .env. Utilizando pergunta original.');
    return {
      is_accounting: true,
      texto_corrigido: transcription
    };
  }

  const prompt = `Você é um especialista em dados orçamentários do estado do Amapá.
O usuário quer consultar dados, valores, saldos ou registros da execução orçamentária.
Sua única responsabilidade é REESCREVER a pergunta original do usuário ('transcricao') em uma frase mais clara e concisa (um 'texto_corrigido') que o nosso backend usará como input (query) para buscar os dados no banco/API.

PERGUNTA DO USUÁRIO:
"${transcription}"

REGRAS:
1. NUNCA invente valores. Não tente "responder" a pergunta.
2. Apenas formate e limpe a intenção de busca.
3. Se o usuário falar de "dotação", "empenho", "liquidação" ou "pagamento", certifique-se de manter esses termos claros na query.
4. as siglas geralmente são de órgaos e secretarias, entao siglas como CEPLAN, CULT, CESA, devem ser reescritas como SEPLAN, SECULT, SESA.
5. Retorne is_accounting como true.

Exemplo:
Entrada: "Ah, eu queria saber quanto que foi pago pra obra da escola estadual"
Saída texto_corrigido: "Valor pago para obra da escola estadual"`;

  const config = {
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'OBJECT',
      properties: {
        is_accounting: { type: 'BOOLEAN' },
        texto_corrigido: { type: 'STRING' }
      },
      required: ['is_accounting', 'texto_corrigido']
    }
  };

  const makeRequest = async (modelName) => {
    const ai = getAiClient();

    let timeoutId;
    const generatePromise = ai.models.generateContent({
      model: modelName,
      contents: [prompt],
      config
    });

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), 10000);
      if (timeoutId?.unref) timeoutId.unref();
    });

    try {
      const response = await Promise.race([generatePromise, timeoutPromise]);
      const texto = response?.text?.trim() ?? '{}';

      let parsed = {};
      try {
        parsed = JSON.parse(texto);
      } catch {
        const cleaned = texto
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/, '')
          .replace(/\s*```$/, '')
          .trim();
        parsed = JSON.parse(cleaned);
      }

      return {
        is_accounting: true,
        texto_corrigido: parsed.texto_corrigido ?? transcription
      };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  try {
    return await makeRequest('gemini-3.1-flash-lite');
  } catch (err) {
    console.warn(`[API Agent] Falha no 3.1-flash-lite (${err.message}). Acionando fallback 1...`);
    try {
      return await makeRequest('gemini-3.5-flash-lite');
    } catch (err2) {
      console.warn(`[API Agent] Falha no 3.5-flash-lite (${err2.message}). Acionando fallback 2...`);
      try {
        return await makeRequest('gemini-3.1-flash-lite');
      } catch (err3) {
        console.error(`[API Agent] Falha em todos os modelos (${err3.message}).`);
        return { is_accounting: true, texto_corrigido: transcription };
      }
    }
  }
}

module.exports = {
  getAiClient,
  processApiQuery,
  getGeminiApiKeys
};
