
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Chat, User, Message } from '../types';
import { 
  Send, Paperclip, Smile, MessageCircle, Trash, Mic, Info, X, 
  ChevronLeft, UserMinus, UserPlus, Image as ImageIcon, 
  Pin, Reply, BarChart2, Volume2, Square, Plus, CheckCheck, MoreVertical,
  Link as LinkIcon, Edit3, Shield, Copy, Users, Bookmark, RotateCcw, Clock, Lock, ArrowRight, Link, Search
} from 'lucide-react';

interface ChatAreaProps {
  chat: Chat | null;
  currentUser: User;
  isTyping: boolean;
  onAction: (action: string, payload: any) => void;
  onDeleteChat: () => void;
  onBack: () => void;
  onUsernameClick: (username: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chat, currentUser, isTyping, onAction, onDeleteChat, onBack, onUsernameClick }) => {
  const [inputText, setInputText] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  // Admin Edit States
  const [editTab, setEditTab] = useState<'info' | 'permissions'>('info');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSlowMode, setEditSlowMode] = useState(0);
  
  // Add Member State
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberQuery, setAddMemberQuery] = useState('');

  const msgEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if(chat) {
       setEditName(chat.groupName || '');
       setEditDesc(chat.description || '');
       setEditSlowMode(chat.slowMode || 0);
    }
  }, [chat?.messages.length, isTyping, chat?.id]);

  // Derived State for Chat Info
  const chatInfo = useMemo(() => {
    if (!chat) return null;
    if (chat.type === 'saved') {
      return {
        title: 'پیام‌های ذخیره شده',
        avatar: null, // Will render bookmark icon
        status: 'پیام‌های شخصی شما',
        isSaved: true
      };
    }
    const otherParticipant = chat.participants.find(p => p.id !== currentUser.id);
    if (chat.type === 'private') {
      return {
        title: otherParticipant?.displayName || 'کاربر حذف شده',
        avatar: otherParticipant?.avatar,
        status: isTyping ? 'درحال نوشتن...' : (otherParticipant?.status === 'online' ? 'آنلاین' : 'آخرین بازدید به تازگی'),
        isSaved: false
      };
    }
    return {
      title: chat.groupName,
      avatar: chat.groupAvatar,
      status: isTyping ? 'درحال نوشتن...' : `${chat.participants.length} عضو`,
      isSaved: false
    };
  }, [chat, currentUser, isTyping]);

  if (!chat || !chatInfo) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0e1621] text-[#708499]">
      <div className="bg-[#17212b] p-8 rounded-full mb-4 shadow-2xl animate-pulse">
        <MessageCircle size={64} className="opacity-30 text-[#3390ec]" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">به استارلی چت خوش آمدید</h2>
      <p className="text-sm font-medium opacity-60">یک گفتگو را برای شروع پیام‌رسانی انتخاب کنید</p>
    </div>
  );

  const isAdmin = chat.adminId === currentUser.id;
  const isChannel = chat.type === 'channel';
  const isGroup = chat.type === 'group';
  const other = chat.participants.find(p => p.id !== currentUser.id);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onAction('send', { text: inputText, replyToId: replyingTo?.id });
    setInputText('');
    setReplyingTo(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        onAction('send', { text: 'تصویر', imageUrl: canvas.toDataURL('image/jpeg', 0.8) });
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => onAction('send', { text: 'پیام صوتی', audioUrl: reader.result });
          reader.readAsDataURL(blob);
          stream.getTracks().forEach(t => t.stop());
        };
        recorder.start();
        setIsRecording(true);
      } catch (err) {
        alert('دسترسی به میکروفون مسدود است.');
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  const saveInfo = () => {
    onAction('updateChatInfo', { 
      groupName: editName, 
      description: editDesc,
      slowMode: editSlowMode 
    });
    setIsEditingInfo(false);
  };

  const regenerateInviteLink = () => {
    const newLink = `https://chat.starly.ir/join/${Math.random().toString(36).substring(2, 12)}`;
    onAction('updateSettings', { inviteLink: newLink });
  };

  const copyMessageLink = (msgId: string) => {
    const link = `https://chat.starly.ir/c/${chat.id}/${msgId}`;
    navigator.clipboard.writeText(link);
    alert('لینک پیام با موفقیت کپی شد!');
  };

  const handleAddMember = () => {
    if (!addMemberQuery.trim()) return;
    const users = JSON.parse(localStorage.getItem('starly_users') || '{}');
    const cleanQuery = addMemberQuery.trim().toLowerCase().replace('@', '');
    const found = Object.values(users).find((u: any) => u.username === cleanQuery);
    
    if (found) {
      // @ts-ignore
      if (chat.participants.some(p => p.id === found.id)) {
        alert('این کاربر قبلا در گروه عضو است.');
      } else {
        onAction('addParticipant', found);
        setShowAddMember(false);
        setAddMemberQuery('');
        alert(`${cleanQuery} با موفقیت اضافه شد.`);
      }
    } else {
      alert('کاربر یافت نشد. لطفا نام کاربری صحیح را وارد کنید.');
    }
  };

  const renderMessageText = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.match(/@\w+/)) {
        return (
          <span 
            key={index} 
            className="text-[#3390ec] font-bold cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onUsernameClick(part);
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0e1621] relative overflow-hidden chat-wallpaper">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 bg-[#17212b]/95 backdrop-blur-lg border-b border-black/20 z-20 shadow-sm">
        <div className="flex items-center gap-1 overflow-hidden">
          <button onClick={onBack} className="md:hidden p-2 mr-1 text-[#708499] hover:text-white">
            <ArrowRight size={24} />
          </button>
          
          <div className="flex items-center gap-3 cursor-pointer group flex-1" onClick={() => setShowInfo(true)}>
            <div className="relative shrink-0">
              {chatInfo.isSaved ? (
                <div className="w-10 h-10 rounded-full bg-[#3390ec] flex items-center justify-center border border-white/10 shadow-lg">
                  <Bookmark size={20} className="text-white fill-current"/>
                </div>
              ) : (
                <img src={chatInfo.avatar || ''} className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:scale-105 transition-transform" />
              )}
              {chat.type === 'private' && chat.participants.find(p=>p.id!==currentUser.id)?.status === 'online' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#17212b]" />}
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-[15px] leading-tight text-white truncate">{chatInfo.title}</h3>
              <p className="text-[11px] text-[#3390ec] font-medium truncate">{chatInfo.status}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setShowInfo(true)} className="p-2.5 text-[#708499] hover:bg-white/5 rounded-full transition-colors"><MoreVertical size={20}/></button>
        </div>
      </header>

      {/* Messages List */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-10">
        {chat.messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={`flex w-full animate-msg ${isMe ? 'justify-start' : 'justify-end'}`}>
              <div className="flex items-end gap-2 max-w-[85%] group">
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                  <button 
                    onClick={() => setReplyingTo(msg)} 
                    className="p-1.5 bg-[#17212b]/50 hover:bg-[#3390ec] rounded-full text-[#708499] hover:text-white transition-colors shadow-sm"
                    title="پاسخ"
                  >
                    <Reply size={14} className="scale-x-[-1]" />
                  </button>
                  <button 
                    onClick={() => copyMessageLink(msg.id)} 
                    className="p-1.5 bg-[#17212b]/50 hover:bg-[#3390ec] rounded-full text-[#708499] hover:text-white transition-colors shadow-sm"
                    title="کپی لینک"
                  >
                    <LinkIcon size={14} />
                  </button>
                </div>

                <div className={`message-bubble p-2.5 shadow-md relative flex-1 ${isMe ? 'bg-[#2b5278] rounded-2xl rounded-tr-none' : 'bg-[#182533] rounded-2xl rounded-tl-none text-white'}`}>
                  {msg.replyToId && (
                    <div className="mb-2 p-2 bg-black/20 rounded-lg border-r-2 border-[#3390ec] text-[10px] opacity-80 cursor-pointer hover:bg-black/30 transition-colors">
                      <span className="text-[#3390ec] font-bold block mb-0.5">پاسخ به پیام</span>
                      <span className="truncate block opacity-70">{chat.messages.find(m => m.id === msg.replyToId)?.text || 'پیام حذف شده'}</span>
                    </div>
                  )}
                  {msg.imageUrl && <img src={msg.imageUrl} className="rounded-xl mb-2 max-h-[400px] w-full object-cover shadow-inner" />}
                  {msg.audioUrl && (
                    <div className="flex items-center gap-3 min-w-[200px] py-2 px-1">
                      <button className="bg-[#3390ec] p-2.5 rounded-full text-white shadow-lg hover:bg-[#2881d9] transition-colors"><Volume2 size={18}/></button>
                      <div className="flex flex-col flex-1">
                        <div className="h-1 bg-white/20 rounded-full overflow-hidden w-full mb-1">
                          <div className="h-full bg-white/60 w-1/3" />
                        </div>
                        <span className="text-[10px] opacity-60">پیام صوتی</span>
                      </div>
                    </div>
                  )}
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap font-light">
                    {renderMessageText(msg.text)}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1 opacity-50 select-none">
                    {msg.isEdited && <span className="text-[9px]">ویرایش شده</span>}
                    <span className="text-[9px]">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    {isMe && <CheckCheck size={12} className="text-[#3390ec]" />}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
        <div ref={msgEndRef} />
      </main>

      {/* Input Bar */}
      <footer className="p-3 bg-[#17212b]/95 backdrop-blur-xl border-t border-black/20 z-20">
        {replyingTo && (
          <div className="flex items-center justify-between bg-black/20 p-2 mb-2 rounded-xl border-r-4 border-[#3390ec] animate-in slide-in-from-bottom">
            <div className="px-2 overflow-hidden">
              <p className="text-[10px] text-[#3390ec] font-bold">پاسخ به {chat.participants.find(p=>p.id===replyingTo.senderId)?.displayName}</p>
              <p className="text-xs truncate opacity-60 italic text-white">{replyingTo.text}</p>
            </div>
            <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-white/10 rounded-full"><X size={14} className="text-[#708499]"/></button>
          </div>
        )}
        {(!isChannel || isAdmin || chatInfo.isSaved) ? (
          <div className="flex items-end gap-2 max-w-5xl mx-auto">
            <div className="flex-1 bg-[#242f3d] rounded-[22px] flex items-center px-3 py-1.5 shadow-lg border border-white/5 focus-within:border-[#3390ec]/30 transition-all">
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-[#708499] hover:text-[#3390ec] transition-colors"><Smile size={24}/></button>
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="پیام خود را بنویسید..."
                className="flex-1 bg-transparent border-none outline-none text-[15px] mx-2 py-2 max-h-40 resize-none no-scrollbar placeholder:text-[#708499]"
              />
              <button onClick={() => fileInputRef.current?.click()} className="p-2 text-[#708499] hover:text-[#3390ec] transition-colors"><Paperclip size={24}/></button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
            
            <button 
              onClick={() => inputText.trim() ? handleSend() : toggleRecording()}
              className={`p-3.5 rounded-full shadow-xl transition-all active:scale-90 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-[#3390ec] hover:bg-[#2881d9]'}`}
            >
              {inputText.trim() ? <Send size={22} className="text-white rotate-180" /> : (isRecording ? <Square size={22} className="text-white fill-white" /> : <Mic size={22} className="text-white" />)}
            </button>
          </div>
        ) : (
          <div className="text-center p-2 text-[#708499] text-sm bg-[#17212b] rounded-xl border border-white/5">
            فقط ادمین‌ها می‌توانند در این کانال پیام ارسال کنند.
          </div>
        )}
      </footer>

      {/* Info Sidebar */}
      <div className={`absolute left-0 top-0 bottom-0 w-full md:w-[400px] bg-[#17212b] border-r border-black/30 z-50 transition-transform duration-300 shadow-2xl flex flex-col ${showInfo ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 flex items-center gap-4 bg-[#242f3d] border-b border-black/20 shrink-0">
          <button onClick={() => setShowInfo(false)} className="p-2 hover:bg-white/5 rounded-full text-[#708499]"><ChevronLeft className="rotate-180"/></button>
          <h3 className="font-bold text-lg text-white">
             {chatInfo.isSaved ? 'پیام‌های ذخیره شده' : (isGroup ? 'مدیریت گروه' : (isChannel ? 'مدیریت کانال' : 'اطلاعات کاربر'))}
          </h3>
          {isAdmin && (isGroup || isChannel) && (
             <div className="mr-auto flex bg-[#17212b] rounded-lg p-0.5 border border-white/10">
                <button onClick={() => setEditTab('info')} className={`p-1.5 rounded-md ${editTab==='info'?'bg-[#3390ec] text-white':'text-[#708499]'}`}><Info size={18}/></button>
                <button onClick={() => setEditTab('permissions')} className={`p-1.5 rounded-md ${editTab==='permissions'?'bg-[#3390ec] text-white':'text-[#708499]'}`}><Shield size={18}/></button>
             </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
          <div className="text-center relative">
            {chatInfo.isSaved ? (
              <div className="w-32 h-32 rounded-full bg-[#3390ec] flex items-center justify-center mx-auto shadow-2xl mb-4 border-4 border-white/10">
                <Bookmark size={48} className="text-white fill-current"/>
              </div>
            ) : (
              <img src={chatInfo.avatar || ''} className="w-32 h-32 rounded-full mx-auto border-4 border-[#3390ec] object-cover shadow-2xl mb-4" />
            )}

            {isEditingInfo ? (
              <div className="space-y-3 animate-in fade-in">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3390ec] text-right block">نام گروه/کانال</label>
                    <input value={editName} onChange={e=>setEditName(e.target.value)} className="w-full bg-[#242f3d] p-3 rounded-xl border border-white/10 text-center font-bold outline-none focus:border-[#3390ec] text-white"/>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3390ec] text-right block">توضیحات</label>
                    <textarea value={editDesc} onChange={e=>setEditDesc(e.target.value)} className="w-full bg-[#242f3d] p-3 rounded-xl border border-white/10 text-center text-sm resize-none outline-none focus:border-[#3390ec] text-white" placeholder="توضیحات..."/>
                 </div>
                 <button onClick={saveInfo} className="w-full py-2 bg-[#3390ec] rounded-lg font-bold text-sm shadow-lg flex items-center justify-center gap-2 text-white"><CheckCheck size={16}/> ذخیره تغییرات</button>
                 <button onClick={()=>setIsEditingInfo(false)} className="w-full py-2 bg-red-500/10 text-red-400 rounded-lg font-bold text-sm">لغو</button>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{chatInfo.title}</h2>
                <p className="text-sm text-[#708499] leading-relaxed">{chat.type === 'private' && !chatInfo.isSaved ? `@${other?.username}` : (chat.description || (chatInfo.isSaved ? '' : 'بدون توضیحات'))}</p>
                {isAdmin && (isGroup || isChannel) && editTab === 'info' && (
                  <button onClick={() => setIsEditingInfo(true)} className="mt-4 text-[#3390ec] text-xs font-bold bg-[#3390ec]/10 px-4 py-2 rounded-full hover:bg-[#3390ec]/20">ویرایش اطلاعات</button>
                )}
              </div>
            )}
          </div>

          {isAdmin && (isGroup || isChannel) && editTab === 'permissions' && (
             <div className="space-y-4 animate-in slide-in-from-left">
                <div className="bg-[#242f3d] p-4 rounded-2xl border border-white/5">
                   <h4 className="text-[#3390ec] font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><Clock size={14}/> حالت آرام (Slow Mode)</h4>
                   <input type="range" min="0" max="60" step="5" value={editSlowMode} onChange={e=>setEditSlowMode(Number(e.target.value))} className="w-full accent-[#3390ec]"/>
                   <div className="flex justify-between text-[10px] text-[#708499] mt-2">
                      <span>خاموش</span>
                      <span>{editSlowMode > 0 ? `${editSlowMode} ثانیه` : ''}</span>
                      <span>60 ثانیه</span>
                   </div>
                </div>

                <div className="bg-[#242f3d] p-4 rounded-2xl border border-white/5 space-y-3">
                   <h4 className="text-[#3390ec] font-bold text-xs uppercase tracking-widest flex items-center gap-2"><Lock size={14}/> دسترسی‌ها</h4>
                   {isGroup && (
                     <div className="flex items-center justify-between p-2">
                        <span className="text-sm text-white">ارسال پیام توسط اعضا</span>
                        <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${true ? 'bg-[#3390ec]' : 'bg-[#17212b] border border-white/10'}`}>
                           <div className="w-4 h-4 bg-white rounded-full shadow-sm"/>
                        </div>
                     </div>
                   )}
                   <div className="flex items-center justify-between p-2">
                        <span className="text-sm text-white">افزودن عضو جدید</span>
                        <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${true ? 'bg-[#3390ec]' : 'bg-[#17212b] border border-white/10'}`}>
                           <div className="w-4 h-4 bg-white rounded-full shadow-sm"/>
                        </div>
                   </div>
                   <button onClick={saveInfo} className="w-full mt-2 py-2 bg-[#3390ec]/10 text-[#3390ec] rounded-lg text-xs font-bold">ذخیره تنظیمات</button>
                </div>
             </div>
          )}

          {editTab === 'info' && (
          <>
            {(isGroup || isChannel) && chat.inviteLink && (
              <div className="bg-[#242f3d] p-4 rounded-2xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#3390ec] font-bold text-xs uppercase tracking-widest">
                    <LinkIcon size={14}/> لینک دعوت
                  </div>
                  {isAdmin && <button onClick={regenerateInviteLink} className="text-[10px] text-red-400 hover:bg-red-500/10 px-2 py-1 rounded flex items-center gap-1"><RotateCcw size={10}/> بازنشانی لینک</button>}
                </div>
                <div className="flex items-center gap-2 bg-[#0e1621] p-3 rounded-xl border border-dashed border-[#3390ec]/30 cursor-pointer hover:bg-[#0e1621]/80 group" onClick={() => navigator.clipboard.writeText(chat.inviteLink!)}>
                  <span className="text-sm flex-1 truncate text-[#708499] font-mono select-all" dir="ltr">{chat.inviteLink}</span>
                  <Copy size={16} className="text-[#3390ec]"/>
                </div>
                <p className="text-[10px] text-[#708499] pr-1">هر کسی با این لینک می‌تواند عضو شود.</p>
              </div>
            )}

            {(isGroup || isChannel) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[#3390ec] font-bold text-xs uppercase tracking-widest flex items-center gap-2"><Users size={14}/> اعضا ({chat.participants.length})</h4>
                  {isAdmin && <button onClick={() => setShowAddMember(true)} className="text-[10px] bg-[#3390ec]/10 text-[#3390ec] px-2 py-1 rounded-lg hover:bg-[#3390ec]/20 transition-colors">افزودن عضو</button>}
                </div>
                
                {/* Add Member Input Area */}
                {showAddMember && (
                  <div className="bg-[#242f3d] p-3 rounded-xl border border-[#3390ec]/50 flex items-center gap-2 animate-in fade-in">
                    <Search size={16} className="text-[#708499]"/>
                    <input 
                      autoFocus
                      value={addMemberQuery}
                      onChange={e=>setAddMemberQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddMember()}
                      placeholder="نام کاربری را وارد کنید..." 
                      className="flex-1 bg-transparent outline-none text-sm text-white"
                    />
                    <button onClick={handleAddMember} className="text-[#3390ec] text-xs font-bold px-2">افزودن</button>
                    <button onClick={() => setShowAddMember(false)} className="text-[#708499]"><X size={14}/></button>
                  </div>
                )}

                <div className="bg-[#242f3d] rounded-2xl overflow-hidden border border-white/5">
                  {chat.participants.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 hover:bg-[#2b3949] transition-colors border-b border-white/5 last:border-0 group/user">
                      <div className="flex items-center gap-3">
                        <img src={p.avatar} className="w-10 h-10 rounded-full bg-[#17212b]"/>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">{p.displayName}</p>
                          <p className="text-[10px] text-[#708499]">@{p.username} {p.id === chat.adminId && <span className="text-[#3390ec]">(مالک)</span>}</p>
                        </div>
                      </div>
                      {isAdmin && p.id !== currentUser.id && (
                        <button onClick={() => onAction('removeParticipant', p)} className="p-2 text-red-500/50 hover:text-red-500 opacity-0 group-hover/user:opacity-100 transition-all hover:bg-red-500/10 rounded-lg">
                          <UserMinus size={18}/>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
          )}

          {!chatInfo.isSaved && (
            <div className="pt-4 space-y-3">
              <button onClick={() => { onDeleteChat(); setShowInfo(false); }} className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all shadow-sm border border-red-500/20">
                <Trash size={20}/> {isAdmin ? 'حذف کامل گفتگو' : 'ترک گفتگو'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
