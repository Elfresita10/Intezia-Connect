import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'keia';
    timestamp: Date;
}

const KeiaChat: React.FC = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: `¡Hola ${user?.name || 'Consultor'}! Soy KEIA, tu asistente virtual. ¿En qué puedo apoyarte hoy?`,
            sender: 'keia',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        const newUserMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');
        setIsTyping(true);

        // Simulate KEIA Intelligence
        setTimeout(() => {
            const response = getKeiaResponse(inputValue);
            const keiaMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: response,
                sender: 'keia',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, keiaMessage]);
            setIsTyping(false);
        }, 1500);
    };

    const getKeiaResponse = (input: string): string => {
        const lowerInput = input.toLowerCase();

        if (lowerInput.includes('hola') || lowerInput.includes('buen')) {
            return "¡Hola! Estoy aquí para ayudarte a navegar por el sistema de Intezia. ¿Tienes alguna duda sobre tus proyectos o capacitaciones?";
        }

        if (lowerInput.includes('proyecto') || lowerInput.includes('roadmap')) {
            return "En la pestaña 'Proyectos' puedes ver tus asignaciones actuales. Si haces clic en uno, verás el Roadmap detallado con las tareas pendientes.";
        }

        if (lowerInput.includes('perfil') || lowerInput.includes('foto') || lowerInput.includes('avatar')) {
            return "Puedes actualizar tu foto profesional y datos de contacto en 'Mi Perfil'. Recuerda que si eres Super Admin, también puedes gestionar a otros consultores.";
        }

        if (lowerInput.includes('capacitación') || lowerInput.includes('curso') || lowerInput.includes('educación')) {
            return "En 'Educación' encontrarás los cursos disponibles y realizados. Los Super Admins suben nuevos recursos y clases en video allí periódicamente.";
        }

        if (lowerInput.includes('fundamentos') || lowerInput.includes('proceso') || lowerInput.includes('sistema operativo')) {
            return "La sección 'Fundamentos' contiene la 'Biblia del Desarrollo' y todos los flujos de trabajo de Intezia. Es ideal para resolver dudas operativas.";
        }

        if (lowerInput.includes('gracias') || lowerInput.includes('ok')) {
            return "¡De nada! Siempre es un gusto apoyarte. ¿Algo más en lo que pueda asistirte?";
        }

        return "Entiendo. Puedo ayudarte con información sobre proyectos, perfiles, educación o los fundamentos del sistema. ¿Te gustaría saber más sobre alguno de estos temas?";
    };

    return (
        <div style={{ position: 'fixed', bottom: '115px', right: '20px', zIndex: 9999 }}>
            {/* Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    border: 'none',
                    boxShadow: '0 8px 24px var(--accent-glow)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    transform: isOpen ? 'rotate(90deg)' : 'none',
                    position: 'relative',
                    overflow: 'visible'
                }}
                className="keia-bubble"
            >
                {isOpen ? <X size={28} /> : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Bot size={28} />
                    <span style={{ fontSize: '10px', fontWeight: 'bold' }}>KEIA</span>
                </div>}

                {/* Visual pulse effect when closed */}
                {!isOpen && (
                    <div className="pulse-ring" style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        borderRadius: '50%',
                        border: '2px solid var(--accent)',
                        animation: 'pulse 2s infinite'
                    }} />
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fade-in" style={{
                    position: 'absolute',
                    bottom: '80px',
                    right: 0,
                    width: '350px',
                    height: '500px',
                    maxHeight: 'calc(100vh - 120px)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                    overflow: 'hidden',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: '#121212', // Solid dark background
                    borderRadius: '16px'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '20px',
                        background: 'linear-gradient(135deg, var(--accent), #0056b3)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>KEIA AI</h3>
                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>En línea y lista para ayudar</span>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        background: '#1a1a1a' // Slightly lighter solid background for message area
                    }}>
                        {messages.map(msg => (
                            <div key={msg.id} style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                            }}>
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: msg.sender === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                                    background: msg.sender === 'user' ? 'var(--accent)' : '#2c2c2c', // Solid background for Keia messages
                                    color: '#fff',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.4',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}>
                                    {msg.text}
                                </div>
                                <span style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '4px' }}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                        {isTyping && (
                            <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '18px' }}>
                                <div className="typing-dots">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} style={{
                        padding: '15px',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        gap: '10px'
                    }}>
                        <input
                            type="text"
                            placeholder="Escribe tu duda aquí..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '10px 15px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '20px',
                                color: '#fff',
                                outline: 'none'
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'var(--accent)',
                                border: 'none',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s'
                            }}
                            disabled={!inputValue.trim()}
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.8; }
                   70% { transform: scale(1.4); opacity: 0; }
                    100% { transform: scale(1.4); opacity: 0; }
                }
                .keia-bubble:hover {
                    transform: scale(1.1) ${isOpen ? 'rotate(90deg)' : ''} !important;
                }
                .typing-dots {
                    display: flex;
                    gap: 4px;
                }
                .typing-dots span {
                    width: 6px;
                    height: 6px;
                    background: #fff;
                    border-radius: 50%;
                    display: inline-block;
                    opacity: 0.4;
                    animation: typing 1.4s infinite ease-in-out both;
                }
                .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
                .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
                @keyframes typing {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default KeiaChat;
