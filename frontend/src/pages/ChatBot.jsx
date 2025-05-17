import { useState, useRef, useEffect } from 'react';
import { Camera, X, Send, Maximize2, Minimize2 } from 'lucide-react';
import geminiService from '../services/geminiService';
import ReactMarkdown from 'react-markdown';


const storeInfo = {
    name: "BuffStore",
    description: "Tienda especializada en venta de codigo de videojuegos y microtransacciones digitales dentro de los videojuegos",
    products: "Vendemos videojuegos digitales para todas las plataformas y consolas de videojuegos",
    shipping: "Envíos a todo el mundo, de manera instantanea en menos de 5 minutos a tu correo",
    returns: "Política de devoluciones de 14 días",
    contact: "soporte@buffstore.com",
  };

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot' , content: '¡Hola! Soy el asistente de BuffStore. ¿En qué puedo ayudarte hoy?'}
    ]);

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);


    useEffect(() => {
        if (!isCameraOpen && streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());   
            streamRef.current = null;        
        }
    }, [isCameraOpen]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
        
        if (isOpen && isCameraOpen) {
            setIsCameraOpen(false);
        }

    }

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    }

    const handleInputChange = (e) => {
        setInput(e.target.value);
    }


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
    
        // Añadir mensaje del usuario
        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
    
        try {
          // Aquí conectamos con la API de Gemini
          const response = await sendMessageToGemini(input);
          setMessages(prev => [...prev, { role: 'bot', content: response }]);
        } catch (error) {
          console.error("Error al comunicarse con Gemini AI:", error);
          setMessages(prev => [...prev, { role: 'bot', content: 'Lo siento, ha ocurrido un error al procesar tu solicitud.' }]);
        } finally {
          setIsLoading(false);
        }
      };

const sendMessageToGemini = async (message) => {
    try {
      // Usar nuestro servicio para enviar el mensaje a la API de Gemini
      const data = await geminiService.sendTextMessage(message);
      return data.response;
    } catch (error) {
      console.error("Error al comunicarse con Gemini AI:", error);
      // Como fallback, devolvemos respuestas básicas basadas en palabras clave
      if (message.toLowerCase().includes('precio')) {
        return 'Puedes ver los precios de nuestros productos en la sección de catálogo.';
      } else if (message.toLowerCase().includes('envío') || message.toLowerCase().includes('envio')) {
        return storeInfo.shipping;
      } else if (message.toLowerCase().includes('devolución') || message.toLowerCase().includes('devolucion')) {
        return storeInfo.returns;
      } else {
        return 'En BuffStore ofrecemos los mejores videojuegos para todas las plataformas. ¿Puedo ayudarte con algo específico?';
      }
    }
  };

const toggleCamera = async () => {
    if (isCameraOpen){
        setIsCameraOpen(false);
        return
    }
    try{
        setIsCameraOpen(true);

        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" } 
        });

        streamRef.current = stream;

        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    } catch (error) {
        console.error("Error al acceder a la camara:", error);
        setMessages(prev => [...prev,
        { role: 'bot', content: 'No se pudo acceder a la cámara. Asegúrate de que has dado los permisos necesarios' }]);
        setIsCameraOpen(false);
    }
};

const captureImage = async () => {
    if (!videoRef.current) return;

    try {
      // Crea un canvas para capturar la imagen
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Convertir a base64
      const imageData = canvas.toDataURL('image/jpeg');
      
      // Cerrar la cámara
      setIsCameraOpen(false);
      
      // Añadir mensaje con imagen capturada
      setMessages(prev => [...prev, { 
        role: 'user', 
        content: 'He tomado una foto para identificar un juego',
        image: imageData
      }]);
      
      setIsLoading(true);
      
      // Enviar la imagen a Gemini para análisis
      try {
        // Lógica para enviar la imagen a Gemini AI
        const response = await analyzeImageWithGemini(imageData);
        setMessages(prev => [...prev, { role: 'bot', content: response }]);
      } catch (error) {
        console.error("Error al analizar la imagen con Gemini AI:", error);
        setMessages(prev => [...prev, { 
          role: 'bot', 
          content: 'Lo siento, ha ocurrido un error al analizar la imagen.'
        }]);
      } finally {
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error("Error al capturar imagen:", error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'Ha ocurrido un error al capturar la imagen.'
      }]);
      setIsCameraOpen(false);
    }
  };

    const analyzeImageWithGemini = async (imageData) => {
    try {
      // Usar nuestro servicio para enviar la imagen a la API de Gemini
      const data = await geminiService.sendImageForAnalysis(imageData);
      return data.response;
    } catch (error) {
      console.error("Error al analizar imagen con Gemini AI:", error);
      return 'No he podido identificar el juego en la imagen. Por favor, intenta con una foto más clara o pregúntame directamente por el juego.';
    }
  };

      return (
        <div className="fixed bottom-12 right-4 z-50">
          {/* Botón para abrir el chat */}
          {!isOpen && (
            <button
              onClick={toggleChat}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </button>
          )}
    
          {/* Ventana del chat */}
          {isOpen && (
            <div className={`bg-white rounded-lg shadow-xl flex flex-col ${isExpanded ? 'w-96 h-128' : 'w-80 h-96'} transition-all duration-300`}>
              {/* Cabecera del chat */}
              <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
                <h3 className="font-medium">Asistente BuffStore</h3>
                <div className="flex gap-2">
                  <button onClick={toggleExpand} className="hover:bg-blue-700 rounded-full p-1">
                    {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                  <button onClick={toggleChat} className="hover:bg-blue-700 rounded-full p-1">
                    <X size={18} />
                  </button>
                </div>
              </div>
    
              {/* Cuerpo del chat */}
              <div className="flex-1 p-3 overflow-y-auto">
                {/* Ventana de la cámara */}
                {isCameraOpen && (
                  <div className="mb-4 relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 bg-black rounded-lg"
                    />
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                      <button
                        onClick={captureImage}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 mx-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={toggleCamera}
                        className="bg-gray-500 hover:bg-gray-600 text-white rounded-full p-3 mx-2"
                      >
                        <X size={24} />
                      </button>
                    </div>
                  </div>
                )}
    
                {/* Mensajes de interaccion */}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    <div
                      className={`inline-block px-4 py-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      } max-w-[80%]`}
                    >
                      <div className={msg.role === 'bot' ? 'prose prose-sm max-w-none' : ''}> 
                                     {msg.role === 'bot' ? (
                                         // Si es del bot, renderiza usando el ReactMarkdown
                                          <ReactMarkdown>
                                              {msg.content}
                                          </ReactMarkdown>
                                     ) : (
                                         // Si es del usuario, solo muestra el texto plano 
                                         <span>{msg.content}</span>
                                     )}
                                 </div>
                    </div>
                    {msg.image && (
                      <div className="mt-2 max-w-[80%] ml-auto">
                        <img 
                          src={msg.image} 
                          alt="Imagen capturada" 
                          className="rounded-lg w-full h-auto"
                        />
                      </div>
                    )}
                  </div>
                ))}
    
                {/* Indicador de carga */}
                {isLoading && (
                  <div className="text-left mb-3">
                    <div className="inline-block px-4 py-2 rounded-lg bg-gray-200">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
    
                <div ref={messagesEndRef} />
              </div>
    
              {/* Formulario de entrada */}
              <form onSubmit={handleSubmit} className="p-3 border-t">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 flex-shrink-0"
                  >
                    <Camera size={20} />
                  </button>
                  <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className={`rounded-full p-2 flex-shrink-0 ${
                      isLoading || !input.trim()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      );
    };
    
    export default ChatBot;