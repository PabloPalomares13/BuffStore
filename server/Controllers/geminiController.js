const { getTextModel, getVisionModel, generateSystemPrompt } = require('../config/geminiConfig');

exports.processTextMessage = async (req, res) => {
    try {
        const { message } = req.body; 

        if (!message) {
            return res.status(400).json({ error: 'No se proporcionó un mensaje' });
        }
        const model = getTextModel();
        const systemPrompt = generateSystemPrompt(); 

        const chat = model.startChat({
            history:[
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

        const result = await chat.sendMessage(message); 
        const response = result.response.text();

        return res.json({ response });
    } catch (error){
        console.error("error al procesar mensaje de texto:", error);
        return res.status(500).json({ error: 'Error al procesar el mensaje ', details: error.message });
    }
};

exports.processImage = async (req,res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: "la imagen es requerida"});
        }

        let imageData;
        if (image.startsWith("data:image")){
            imageData = image.split(",")[1];
        } else {
            imageData = image;
        }
        const model = getVisionModel();

        const prompt = `Identifica el videojuego que aparece en esta carátula o imagen.
    
    Por favor proporciona la siguiente información:
    1. Nombre completo del juego
    2. Plataforma (si es visible)
    3. Género del juego
    4. Una breve descripción de 2-3 frases sobre el juego
    5. Año de lanzamiento (si es visible)
    
    Si no puedes identificar con certeza que se trata de un videojuego, indica que la imagen no parece ser la carátula de un videojuego y sugiere que el usuario intente con otra imagen más clara.`;

    // Procesar la imagen con Gemini
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData
        }
      }
    ]);

    const response = result.response.text();
    
    return res.json({ response });
    } catch (error){
        console.error("error al procesar imagen:", error);
        return res.status(500).json({ error: 'Error al procesar la imagen ', details: error.message });
    }
};
