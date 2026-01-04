
import React, { useState, useRef, useEffect } from 'react';
import { Chat, User, Message } from '../types';
import { Send, Phone, MoreVertical, Paperclip, Smile, MessageCircle, Pin, Reply, X, CheckCheck, Trash2, ArrowDown, Bookmark, Volume2, VolumeX, Image, ShieldAlert, Ban, Trash } from 'lucide-react';

interface ChatAreaProps {
  chat: Chat | null;
  currentUser: User;
  onSendMessage: (text: string, replyTo?: string) => void;
  isTyping: boolean;
  onTogglePin: (msgId: string) => void;
  onDeleteMessage: (msgId: string) => void;
  onDeleteHistory: () => void;
  onMentionClick: (username: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chat, currentUser, onSendMessage, isTyping, onTogglePin, onDeleteMessage, onDeleteHistory, onMentionClick }) => {
  const [inputText, setInputText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chat) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages.length, isTyping]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputText.trim() && chat) {
      onSendMessage(inputText.trim());
      setInputText('');
      setShowEmojis(false);
    }
  };

  if (!chat) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0e1621] text-center">
      <div className="w-24 h-24 bg-[#1c2732] rounded-full flex items-center justify-center mb-6 shadow-2xl"><MessageCircle className="w-12 h-12 text-[#2b5278]" /></div>
      <h2 className="text-white text-xl font-bold mb-2">استارلی جت وب</h2>
      <p className="text-[#708499] text-sm max-w-xs">پیام‌رسان هوشمند و پرسرعت نسل جدید</p>
    </div>
  );

  const isSaved = chat.type === 'saved';
  const isGroup = chat.type === 'group';
  const title = isGroup ? chat.groupName : (isSaved ? 'پیام‌های ذخیره شده' : chat.participants.find(p => p.id !== currentUser.id)?.displayName);
  const avatar = isGroup ? chat.groupAvatar : (isSaved ? '' : chat.participants.find(p => p.id !== currentUser.id)?.avatar);
  const status = isGroup ? `${chat.participants.length} عضو` : (isSaved ? 'فضای ابری شما' : chat.participants.find(p => p.id !== currentUser.id)?.status);

  const renderMessageText = (text: string) => {
    const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
    return parts.map((part, i) => {
        if (part.startsWith('@')) {
            return <span key={i} onClick={() => onMentionClick(part)} className="text-[#3390ec] cursor-pointer hover:underline font-bold">{part}</span>;
        }
        return part;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-screen relative overflow-hidden bg-[#0e1621]">
      {/* Call Overlay */}
      {isCalling && (
        <div className="fixed inset-0 z-[200] bg-[#17212b]/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in">
          <img src={avatar} className="w-32 h-32 rounded-full border-4 border-[#3390ec] mb-6 animate-pulse" />
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-[#3390ec] animate-bounce">در حال تماس...</p>
          <button onClick={() => setIsCalling(false)} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mt-12 hover:scale-110 transition-transform"><Phone className="w-8 h-8 text-white rotate-[135deg]" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 bg-[#17212b] border-b border-[#0e1621] z-20">
        <div className="flex items-center gap-3">
          {isSaved ? <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#3390ec] text-white"><Bookmark className="w-5 h-5" /></div> : <img src={avatar} className="w-10 h-10 rounded-full object-cover" />}
          <div className="flex flex-col">
            <h2 className="text-white font-bold text-[15px]">{title}</h2>
            <p className={`text-[12px] ${isTyping ? 'text-[#3390ec]' : 'text-[#708499]'}`}>{isTyping ? 'در حال نوشتن...' : status}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[#708499]">
          {!isSaved && (
            <button onClick={() => setIsCalling(true)} className="hover:text-white transition-colors"><Phone className="w-5 h-5" /></button>
          )}
          <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="hover:text-white transition-colors"><MoreVertical className="w-5 h-5" /></button>
          {showMoreMenu && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-[#1c2732] rounded-xl shadow-2xl border border-[#0e1621] p-1 z-50">
              <button onClick={() => {onDeleteHistory(); setShowMoreMenu(false);}} className="w-full text-right px-4 py-2 hover:bg-[#242f3d] rounded-lg text-red-400 flex items-center gap-2"><Trash size={16}/> پاک کردن چت</button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: '450px' }}>
        <div className="absolute inset-0 bg-[#0e1621]/94 pointer-events-none" />
        <div className="relative z-10">
          {chat.messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const sender = isGroup ? chat.participants.find(p => p.id === msg.senderId) : null;
            return (
              <div key={msg.id} className={`flex w-full mb-1 ${isMe ? 'justify-start' : 'justify-end'}`}>
                <div className={`relative max-w-[85%] px-3 py-1.5 shadow-md rounded-2xl ${isMe ? 'bg-[#2b5278]' : 'bg-[#182533]'}`}>
                  {isGroup && !isMe && sender && <p className="text-[12px] font-bold text-[#3390ec] mb-1">{sender.displayName}</p>}
                  <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap">{renderMessageText(msg.text)}</p>
                  <div className="flex items-center justify-end gap-1.5 h-3 mt-1">
                    <span className="text-[9px] opacity-50">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && <CheckCheck className="w-3 h-3 text-[#3390ec]" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-3 bg-[#17212b] border-t border-[#0e1621]">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-5xl mx-auto w-full">
          <div className="flex-1 flex items-end gap-3 bg-[#242f3d] rounded-2xl px-4 py-3 focus-within:ring-1 focus-within:ring-[#3390ec]/50">
            <button type="button" onClick={() => setShowEmojis(!showEmojis)}><Smile className="text-[#708499]" /></button>
            <textarea value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); handleSubmit(); } }} placeholder="پیام..." className="flex-1 bg-transparent border-none text-white focus:outline-none resize-none py-0.5" rows={1} />
            <Paperclip className="text-[#708499] cursor-pointer" />
          </div>
          <button type="submit" disabled={!inputText.trim()} className={`p-3.5 rounded-full ${inputText.trim() ? 'bg-[#3390ec] text-white shadow-lg' : 'text-[#708499]'}`}><Send className="rotate-180" /></button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;
