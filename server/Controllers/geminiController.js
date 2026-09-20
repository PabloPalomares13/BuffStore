const {
    ai,
    TEXT_MODELS,
    VISION_MODELS,
    runWithFallback,
    generateSystemPrompt
} = require('../config/geminiConfig');
const { TOOLS_BY_ROLE } = require('../config/geminiTools');
const { executeTool } = require('../config/geminiToolExecutor');

const MAX_TOOL_ROUNDS = 5; // evita loops infinitos si el modelo insiste en llamar funciones

// Errores temporales de Gemini (para responder 503 al frontend en vez de 500)
const isTemporaryGeminiError = (error) => {
    const status = Number(error?.status ?? error?.code ?? error?.error?.code);
    const msg = String(error?.message || '');
    return (
        [429, 500, 502, 503, 504].includes(status) ||
        /UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded|timeout/i.test(msg)
    );
};

exports.processTextMessage = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'No se proporcionó un mensaje' });
        }

        // req.chatRole / req.chatUser los pone el middleware identifyChatUser
        const role = req.chatRole || 'guest';
        const systemPrompt = generateSystemPrompt(role);
        const tools = TOOLS_BY_ROLE[role] || TOOLS_BY_ROLE.guest;

        // Estado del chat: si hay que cambiar de modelo, se recrea con el historial acumulado.
        let chat = null;
        let chatModel = null;
        let startIdx = 0; // desde qué modelo de la cadena seguir intentando

        const buildChat = (model, history = []) =>
            ai.chats.create({
                model,
                config: { tools, systemInstruction: systemPrompt },
                history
            });

        // Envía un mensaje con reintentos/fallback. Cada sendMessage se protege por separado,
        // así que si falla, NO se vuelven a ejecutar herramientas que ya corrieron
        // (createReport, deleteProduct, etc.).
        const sendWithFallback = async (msg) => {
            const models = TEXT_MODELS.slice(startIdx);

            const { result, model } = await runWithFallback(models, async (m) => {
                if (!chat) {
                    chat = buildChat(m);
                    chatModel = m;
                } else if (chatModel !== m) {
                    // cambio de modelo: conservar la conversación hasta ahora
                    chat = buildChat(m, chat.getHistory());
                    chatModel = m;
                }
                return chat.sendMessage({ message: msg });
            });

            // Recordar el modelo que funcionó para no volver a golpear al saturado
            startIdx = TEXT_MODELS.indexOf(model);
            return result;
        };

        let result = await sendWithFallback(message);

        // Bucle de function calling: mientras Gemini pida ejecutar funciones,
        // las corremos contra la DB (con permisos revalidados) y le devolvemos
        // el resultado, hasta que responda con texto final.
        let rounds = 0;
        while (result.functionCalls && result.functionCalls.length > 0 && rounds < MAX_TOOL_ROUNDS) {
            const responseParts = [];

            for (const call of result.functionCalls) {
                const toolResult = await executeTool(call.name, call.args, req);
                responseParts.push({
                    functionResponse: {
                        name: call.name,
                        response: toolResult
                    }
                });
            }

            result = await sendWithFallback(responseParts);
            rounds += 1;
        }

        console.log(`[Gemini chat] respondió ${chatModel}`);
        return res.json({ response: result.text });
    } catch (error) {
        console.error('error al procesar mensaje de texto:', error);

        if (isTemporaryGeminiError(error)) {
            return res.status(503).json({
                error: 'El asistente está muy ocupado en este momento. Inténtalo de nuevo en unos segundos.'
            });
        }
        return res.status(500).json({ error: 'Error al procesar el mensaje' });
    }
};

exports.processImage = async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'la imagen es requerida' });
        }

        let imageData;
        if (image.startsWith('data:image')) {
            imageData = image.split(',')[1];
        } else {
            imageData = image;
        }

        const prompt = `Identifica el videojuego que aparece en esta carátula o imagen.
    
    Por favor proporciona la siguiente información:
    1. Nombre completo del juego
    2. Plataforma (si es visible)
    3. Género del juego
    4. Una breve descripción de 2-3 frases sobre el juego
    5. Año de lanzamiento (si es visible)
    
    Si no puedes identificar con certeza que se trata de un videojuego, indica que la imagen no parece ser la carátula de un videojuego y sugiere que el usuario intente con otra imagen más clara.`;

        const { result, model } = await runWithFallback(VISION_MODELS, (m) =>
            ai.models.generateContent({
                model: m,
                contents: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: imageData
                        }
                    }
                ]
            })
        );

        console.log(`[Gemini vision] respondió ${model}`);
        return res.json({ response: result.text });
    } catch (error) {
        console.error('error al procesar imagen:', error);

        if (isTemporaryGeminiError(error)) {
            return res.status(503).json({
                error: 'El asistente está muy ocupado en este momento. Inténtalo de nuevo en unos segundos.'
            });
        }
        return res.status(500).json({ error: 'Error al procesar la imagen' });
    }
};