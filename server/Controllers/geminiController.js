const { ai, TEXT_MODEL, VISION_MODEL, generateSystemPrompt } = require('../config/geminiConfig');
const { TOOLS_BY_ROLE } = require('../config/geminiTools');
const { executeTool } = require('../config/geminiToolExecutor');
 
const MAX_TOOL_ROUNDS = 5; // evita loops infinitos si el modelo insiste en llamar funciones
 
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
 
        const chat = ai.chats.create({
            model: TEXT_MODEL,
            config: { tools },
            history: [
                {
                    role: 'user',
                    parts: [{ text: 'Por favor, actúa como el asistente virtual de BuffStore según estas instrucciones' }],
                },
                {
                    role: 'model',
                    parts: [{ text: 'Entendido. Actuaré como el asistente virtual de BuffStore según las instrucciones proporcionadas.' }],
                },
                {
                    role: 'user',
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: 'model',
                    parts: [{ text: 'Estoy listo para ayudar como el asistente virtual de BuffStore. ¿En qué puedo ayudarte hoy?' }],
                },
            ]
        });
 
        let result = await chat.sendMessage({ message });
 
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
 
            result = await chat.sendMessage({ message: responseParts });
            rounds += 1;
        }
 
        const response = result.text;
 
        return res.json({ response });
    } catch (error) {
        console.error("error al procesar mensaje de texto:", error);
        return res.status(500).json({ error: 'Error al procesar el mensaje ', details: error.message });
    }
};
 
exports.processImage = async (req, res) => {
    try {
        const { image } = req.body;
 
        if (!image) {
            return res.status(400).json({ error: "la imagen es requerida" });
        }
 
        let imageData;
        if (image.startsWith("data:image")) {
            imageData = image.split(",")[1];
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
 
        const result = await ai.models.generateContent({
            model: VISION_MODEL,
            contents: [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: imageData
                    }
                }
            ]
        });
 
        const response = result.text;
 
        return res.json({ response });
    } catch (error) {
        console.error("error al procesar imagen:", error);
        return res.status(500).json({ error: 'Error al procesar la imagen ', details: error.message });
    }
};