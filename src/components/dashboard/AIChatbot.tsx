'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  sources?: Array<{ title: string; category: string }>;
  timestamp: Date;
}

interface AIChatbotProps {
  role?: string;
}

export default function AIChatbot({ role = 'guest' }: AIChatbotProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Normalize role string
  const activeRole = role?.toLowerCase() || 'guest';

  // Customized Suggested Prompts based on User Roles
  const getSuggestedPrompts = () => {
    switch (activeRole) {
      case 'dps':
        return [
          { text: "Cara pembersihan dana non-halal", icon: "🕌" },
          { text: "Beda rukun Murabahah vs Ijarah", icon: "⚖️" },
          { text: "Fatwa DSN-MUI tentang Musyarakah", icon: "📜" }
        ];
      case 'ao':
      case 'account_officer':
        return [
          { text: "Rekomendasi akad modal usaha mikro", icon: "🎯" },
          { text: "Mitigasi risiko pembiayaan Murabahah", icon: "🛡️" },
          { text: "Kriteria objek barang sah dalam Ijarah", icon: "📦" }
        ];
      case 'accounting':
        return [
          { text: "Klasifikasi PSAK 101 Neraca Syariah", icon: "📊" },
          { text: "Jurnal double-entry setoran Wadiah", icon: "✒️" },
          { text: "Cara hitung nisbah bagi hasil bersih", icon: "📈" }
        ];
      case 'teller':
        return [
          { text: "Berapa batas cash-on-hand harian?", icon: "🏪" },
          { text: "Langkah input setoran tunai Wadiah", icon: "💵" },
          { text: "Cara rekonsiliasi kas akhir shift", icon: "🔑" }
        ];
      case 'member':
        return [
          { text: "Mekanisme Simpanan Wadiah", icon: "💚" },
          { text: "Bagaimana cara kerja Bagi Hasil?", icon: "📈" },
          { text: "Apakah ada bunga riba di Koperasi?", icon: "🚫" }
        ];
      default:
        return [
          { text: "Prinsip dasar Koperasi Syariah", icon: "🕌" },
          { text: "Penjelasan Akad Murabahah ringkas", icon: "🤝" },
          { text: "Apa itu RAG AI Syariah?", icon: "🤖" }
        ];
    }
  };

  // Get Role Badge Styling and Title
  const getRoleHeader = () => {
    switch (activeRole) {
      case 'dps':
        return { title: 'Audit Syariah AI', badge: 'DEWAN PENGAWAS' };
      case 'ao':
      case 'account_officer':
        return { title: 'Consultant AO AI', badge: 'ACCOUNT OFFICER' };
      case 'accounting':
        return { title: 'Finance Advisor AI', badge: 'AKUNTANSI & PSAK' };
      case 'teller':
        return { title: 'Teller Assistant AI', badge: 'OPERASIONAL KAS' };
      case 'member':
        return { title: 'Konsultan Syariah AI', badge: 'ANGGOTA KOPERASI' };
      default:
        return { title: 'Asisten Syariah AI', badge: 'SISTEM IQ-RA' };
    }
  };

  // Initialize Greeting Message based on Role
  useEffect(() => {
    let greeting = "";
    switch (activeRole) {
      case 'dps':
        greeting = "Assalamualaikum Dewan Pengawas Syariah. Saya siap mendampingi Anda dalam mengaudit kepatuhan fatwa DSN-MUI, menganalisis status pembersihan kas ta'zir, serta menelaah kesesuaian PSAK Syariah. Ada dokumen atau transaksi yang ingin Anda telaah hari ini?";
        break;
      case 'ao':
      case 'account_officer':
        greeting = "Assalamualaikum Account Officer. Saya siap membantu Anda menyaring kelayakan prospek pembiayaan nasabah, merekomendasikan skema akad (Murabahah/Mudharabah/Ijarah/Istishna) yang halal, serta memandu mitigasi risiko hukum kontrak. Ada calon mitra yang ingin dianalisis?";
        break;
      case 'accounting':
        greeting = "Assalamualaikum Rekan Akuntan. Saya siap membantu Anda menyusun jurnal penyesuaian double-entry, memetakan Chart of Accounts (COA) SAK EP, menganalisis perhitungan porsi nisbah bagi hasil, atau meninjau pos laporan ZISWAF. Ada kendala pembukuan?";
        break;
      case 'teller':
        greeting = "Assalamualaikum Rekan Teller. Saya siap memandu Anda terkait operasional kasir harian, batasan kas brankas (*cash-on-hand*), langkah slip setoran Wadiah, otorisasi supervisor, serta verifikasi selisih shift closing. Ada yang ingin ditanyakan?";
        break;
      case 'member':
        greeting = "Assalamualaikum Anggota KSPPS IQ-RA yang dirahmati Allah. Saya adalah asisten keuangan syariah pribadi Anda. Saya siap membantu menjelaskan cara kerja bagi hasil syariah yang adil (tanpa bunga riba), produk tabungan wadiah, atau cara mengajukan pembiayaan usaha mikro. Apa yang bisa saya bantu hari ini?";
        break;
      default:
        greeting = "Assalamualaikum. Saya adalah Asisten Pakar Syariah AI KSPPS IQ-RA. Saya siap memberikan konsultasi fikih muamalah kontemporer, penafsiran fatwa DSN-MUI, serta informasi operasional koperasi syariah. Silakan ajukan pertanyaan Anda.";
    }

    setMessages([
      {
        sender: 'bot',
        text: greeting,
        timestamp: new Date()
      }
    ]);
  }, [activeRole]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Gather chat history for conversation context (limit to last 4 turns)
      const chatHistory = messages
        .slice(-8)
        .map(msg => ({
          sender: msg.sender,
          text: msg.text
        }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          role: activeRole,
          history: chatHistory
        })
      });

      const data = await res.json();

      if (res.ok && data.text) {
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: data.text,
          sources: data.sources,
          timestamp: new Date()
        }]);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: "Maaf, koneksi server AI sedang sibuk. Pastikan parameter syariah Anda sudah benar dan coba kirimkan pesan Anda sekali lagi.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Full markdown renderer — handles headers, bold, lists, paragraphs correctly
  const renderMessageText = (text: string) => {
    if (!text) return null;

    // Split into blocks by double newline (paragraphs)
    const blocks = text.split(/\n{2,}/);

    const renderInline = (line: string) => {
      // Bold+Italic
      let result = line
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#ffffff;font-weight:800">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em style="color:#e2e8f0">$1</em>')
        .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.12);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>');
      return result;
    };

    const elements: React.ReactNode[] = [];

    blocks.forEach((block, blockIdx) => {
      const lines = block.split('\n');
      const listItems: string[] = [];
      const regularLines: string[] = [];

      // Check if this block is a heading
      const firstLine = lines[0]?.trim();
      if (firstLine?.startsWith('# ')) {
        elements.push(<h3 key={blockIdx} style={{color:'#f3c653',fontWeight:900,margin:'14px 0 6px',fontSize:'16px',borderBottom:'1px solid rgba(204,163,52,0.3)',paddingBottom:'4px'}} dangerouslySetInnerHTML={{__html: renderInline(firstLine.slice(2))}} />);
        return;
      }
      if (firstLine?.startsWith('## ')) {
        elements.push(<h4 key={blockIdx} style={{color:'#f3c653',fontWeight:800,margin:'12px 0 5px',fontSize:'14px'}} dangerouslySetInnerHTML={{__html: renderInline(firstLine.slice(3))}} />);
        return;
      }
      if (firstLine?.startsWith('### ')) {
        elements.push(<h5 key={blockIdx} style={{color:'#cca334',fontWeight:700,margin:'10px 0 4px',fontSize:'13px',textTransform:'uppercase',letterSpacing:'0.4px'}} dangerouslySetInnerHTML={{__html: renderInline(firstLine.slice(4))}} />);
        return;
      }

      // Separate list items from regular lines
      lines.forEach(line => {
        if (/^\s*[\*\-\•]\s+/.test(line)) {
          listItems.push(line.replace(/^\s*[\*\-\•]\s+/, ''));
        } else if (/^\s*\d+\.\s+/.test(line)) {
          listItems.push(line.replace(/^\s*\d+\.\s+/, ''));
        } else {
          if (line.trim()) regularLines.push(line);
        }
      });

      // Render list items as <ul>
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${blockIdx}`} style={{margin:'6px 0',paddingLeft:'18px',listStyleType:'disc'}}>
            {listItems.map((item, i) => (
              <li key={i} style={{color:'#e2e8f0',fontSize:'13.5px',marginBottom:'4px',lineHeight:1.6}} dangerouslySetInnerHTML={{__html: renderInline(item)}} />
            ))}
          </ul>
        );
      }

      // Render regular lines as paragraph
      if (regularLines.length > 0) {
        elements.push(
          <p key={`p-${blockIdx}`} style={{margin:'5px 0',color:'#e2e8f0',fontSize:'13.5px',lineHeight:1.65}} dangerouslySetInnerHTML={{__html: renderInline(regularLines.join('<br/>'))}} />
        );
      }
    });

    return <div style={{lineHeight:1.65}}>{elements}</div>;
  };

  const headerInfo = getRoleHeader();
  const suggestedPrompts = getSuggestedPrompts();

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: 'system-ui, sans-serif' }}>
      
      {/* 🟢 FLOATING FLOATING BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #043121 0%, #084b35 100%)',
            border: '2.5px solid var(--gold-bright, #cca334)',
            color: '#cca334',
            cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(4, 49, 33, 0.6), 0 0 15px rgba(204, 163, 52, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            position: 'relative'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'scale(1.1) translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(4, 49, 33, 0.8), 0 0 25px rgba(253, 198, 83, 0.6)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(4, 49, 33, 0.6), 0 0 15px rgba(204, 163, 52, 0.4)';
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateY(-1px)' }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="10" r="1.5" fill="currentColor"></circle>
            <circle cx="16" cy="10" r="1.5" fill="currentColor"></circle>
            <circle cx="8" cy="10" r="1.5" fill="currentColor"></circle>
          </svg>
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: '#10b981',
            border: '2px solid #043121',
            boxShadow: '0 0 8px #10b981'
          }} />
        </button>
      )}

      {/* 🕋 CHAT WINDOW DRAWER */}
      {isOpen && (
        <div style={{
          width: '390px',
          height: '580px',
          background: 'rgba(4, 49, 33, 0.92)',
          backdropFilter: 'blur(20px)',
          border: '2.5px solid #cca334',
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(204, 163, 52, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          color: '#ffffff'
        }}>
          
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'rgba(2, 23, 15, 0.75)',
            borderBottom: '2px solid rgba(204, 163, 52, 0.4)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '24px', color: '#cca334', display: 'flex', alignItems: 'center' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: 900, fontSize: '15px', color: '#f3c653', letterSpacing: '-0.3px' }}>{headerInfo.title}</h4>
                <span style={{ fontSize: '9px', background: 'rgba(243, 198, 83, 0.15)', color: '#f3c653', border: '1px solid rgba(243, 198, 83, 0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 900, letterSpacing: '0.8px', display: 'inline-block', marginTop: '4px' }}>
                  {headerInfo.badge}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1.5px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              ✕
            </button>
          </div>

          {/* Messages List Area */}
          <div style={{
            flexGrow: 1,
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'radial-gradient(circle at top left, rgba(8,75,53,0.3) 0%, transparent 80%)'
          }}>
            {messages.map((msg, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                width: '100%',
                animation: 'fadeIn 0.25s ease-out'
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: msg.sender === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                  background: msg.sender === 'user' 
                    ? 'linear-gradient(135deg, #084b35 0%, #043121 100%)' 
                    : 'rgba(255, 255, 255, 0.07)',
                  border: msg.sender === 'user'
                    ? '1.5px solid rgba(204, 163, 52, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                }}>
                  {/* Bubble text */}
                  {renderMessageText(msg.text)}

                  {/* RAG Reference Sources Badge list */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '10px',
                      color: '#94a3b8'
                    }}>
                      <div style={{ fontWeight: 800, color: '#f3c653', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📚 Referensi Fatwa/Aturan:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {msg.sources.map((src, sIdx) => (
                          <div key={sIdx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(204, 163, 52, 0.08)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(204, 163, 52, 0.2)',
                            color: '#e2e8f0',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden'
                          }}>
                            <span>📌</span>
                            <span style={{ fontWeight: 700 }}>{src.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time badge */}
                  <div style={{
                    textAlign: 'right',
                    fontSize: '9px',
                    opacity: 0.5,
                    marginTop: '6px'
                  }}>
                    {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {/* Pulsing loading indicator */}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '12px 20px',
                  borderRadius: '18px 18px 18px 2px',
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                }}>
                  <div className="dot" style={{ width: '8px', height: '8px', background: '#cca334', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }} />
                  <div className="dot" style={{ width: '8px', height: '8px', background: '#cca334', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }} />
                  <div className="dot" style={{ width: '8px', height: '8px', background: '#cca334', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Panel */}
          {messages.length === 1 && !loading && (
            <div style={{
              padding: '0 20px 16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ fontSize: '11px', color: '#f3c653', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>💡 Rekomendasi Pertanyaan:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.text)}
                    style={{
                      background: 'rgba(204, 163, 52, 0.05)',
                      border: '1.5px solid rgba(204, 163, 52, 0.25)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = 'rgba(204, 163, 52, 0.12)';
                      e.currentTarget.style.borderColor = '#cca334';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'rgba(204, 163, 52, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(204, 163, 52, 0.25)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span>{p.icon}</span>
                    <span>{p.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Input Area */}
          <form
            onSubmit={e => { e.preventDefault(); handleSendMessage(input); }}
            style={{
              padding: '14px 20px',
              background: 'rgba(2, 23, 15, 0.85)',
              borderTop: '2px solid rgba(204, 163, 52, 0.4)',
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={loading ? 'Memikirkan analisis syariah...' : 'Tanyakan aturan fikih/koperasi...'}
              disabled={loading}
              style={{
                flexGrow: 1,
                background: 'rgba(255,255,255,0.06)',
                border: '1.5px solid rgba(204, 163, 52, 0.3)',
                borderRadius: '14px',
                padding: '12px 16px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                transition: 'all 0.25s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#f3c653'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(204, 163, 52, 0.3)'}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: input.trim() ? '#cca334' : 'rgba(204, 163, 52, 0.2)',
                color: '#02130e',
                border: 'none',
                borderRadius: '12px',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                fontSize: '18px',
                transition: 'all 0.2s'
              }}
            >
              ➔
            </button>
          </form>

        </div>
      )}

      {/* Embedded Animations */}
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </div>
  );
}
