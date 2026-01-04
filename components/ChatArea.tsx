
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Chat, User, Message, Permissions, AdminPermissions } from '../types';
import { Send, Paperclip, Smile, MessageCircle, Bookmark, CheckCheck, Trash, Mic, Info, Settings, Shield, UserMinus, UserPlus, Clock, X, ChevronLeft, Link, UserCheck, Image as ImageIcon, Copy, Check } from 'lucide-react';

interface ChatAreaProps {
  chat: Chat | null;
  currentUser: User;
  isTyping: boolean;
  onAction: (action: any, payload: any) => void;
  onMentionClick: (username: string) => void;
  onDeleteChat: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chat, currentUser, isTyping, onAction, onMentionClick, onDeleteChat }) => {
  const [inputText, setInputText] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState<User | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowInfo(false);
    setShowAdminSettings(false);
    setShowAddMember(false);
  }, [chat?.id]);

  const allUsers = useMemo(() => {
    const usersObj = JSON.parse(localStorage.getItem('starly_users') || '{}');
    return Object.values(usersObj).filter(Boolean) as User[];
  }, []);

  if (!chat) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0e1621]">
      <div className="p-10 text-center">
         <div className="w-20 h-20 bg-[#1c2732] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
           <MessageCircle className="text-[#2b5278]" size={32}/>
         </div>
         <h2 className="text-2xl font-bold mb-2">Starly Chat Pro</h2>
         <p className="text-[#708499] max-w-xs mx-auto">یک گفتگو را انتخاب کنید تا چت را شروع کنیم.</p>
      </div>
    </div>
  );

  const isAdmin = chat.adminId === currentUser.id || (chat.admins && chat.admins[currentUser.id]);
  const isOwner = chat.adminId === currentUser.id;
  const isSaved = chat.id === 'saved-messages';
  const other = chat.participants.find(p => p && p.id !== currentUser.id);
  const title = isSaved ? 'پیام‌های ذخیره شده' : (chat.type === 'group' || chat.type === 'channel' ? chat.groupName : other?.displayName);
  const isReadOnly = chat.type === 'channel' && !isAdmin;

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputText.trim()) {
      onAction('send', { text: inputText });
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const updateSettings = (key: string, value: any) => {
    if (!isAdmin) return;
    onAction('updateSettings', { [key]: value });
  };

  const promoteToAdmin = (targetUser: User) => {
    const defaultPerms: AdminPermissions = {
      canChangeInfo: true,
      canDeleteMessages: true,
      canBanUsers: true,
      canInviteUsers: true,
      canPinMessages: true,
      canAddAdmins: false
    };
    const newAdmins = { ...(chat.admins || {}), [targetUser.id]: defaultPerms };
    onAction('updateSettings', { admins: newAdmins });
    setShowPromoteModal(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isAdmin) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSettings('groupAvatar', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderText = (text: string) => {
    const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span 
            key={i} 
            className="text-[#3390ec] cursor-pointer hover:underline font-bold" 
            onClick={() => onMentionClick(part)}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const filteredNewMembers = allUsers.filter(u => 
    !chat.participants.some(p => p.id === u.id) &&
    (u.username.toLowerCase().includes(memberSearch.toLowerCase()) || 
     u.displayName.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0e1621] relative overflow-hidden">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 bg-[#17212b]/90 backdrop-blur-md border-b border-[#0e1621] z-10">
        <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setShowInfo(!showInfo)}>
          {isSaved ? <div className="w-10 h-10 bg-[#3390ec] rounded-full flex items-center justify-center shadow-lg"><Bookmark size={20}/></div>
                  : <img src={chat.type === 'group' || chat.type === 'channel' ? chat.groupAvatar : other?.avatar} className="w-10 h-10 rounded-full object-cover border border-white/10" />}
          <div className="flex-1">
            <h3 className="font-bold text-sm truncate">{title}</h3>
            <p className="text-[10px] text-[#708499]">{isTyping ? 'درحال نوشتن...' : (chat.type === 'channel' ? `${chat.participants.length} مشترک` : 'آنلاین')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (chat.type === 'group' || chat.type === 'channel') && (
            <button onClick={() => setShowAdminSettings(true)} className="p-2 text-[#708499] hover:text-[#3390ec] transition-colors"><Settings size={20}/></button>
          )}
          <button onClick={onDeleteChat} className="p-2 text-[#708499] hover:text-red-400 transition-colors"><Trash size={20}/></button>
        </div>
      </div>

      <div className="flex-1 relative flex">
        {/* Messages Container */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 no-scrollbar bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-fixed opacity-90">
          {chat.messages.map(msg => {
            const isMe = msg.senderId === currentUser.id;
            const isSystem = msg.senderId === 'system';
            const sender = chat.participants.find(p => p.id === msg.senderId);

            if (isSystem) return (
              <div key={msg.id} className="flex justify-center w-full my-2">
                <span className="bg-black/40 px-3 py-1 rounded-full text-[10px] text-white/60">{msg.text}</span>
              </div>
            );

            return (
              <div key={msg.id} className={`flex w-full ${isMe ? 'justify-start' : 'justify-end'}`}>
                <div className={`relative max-w-[80%] px-4 py-2 rounded-2xl shadow-md group ${isMe ? 'bg-[#2b5278] rounded-tr-none' : 'bg-[#182533] rounded-tl-none'}`}>
                  {!isMe && (chat.type === 'group' || chat.type === 'channel') && (
                    <p className="text-[10px] font-bold text-[#3390ec] mb-1">{sender?.displayName || 'نامعلوم'}</p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderText(msg.text)}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[9px] opacity-50">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    {isMe && <CheckCheck size={12} className="text-[#3390ec]" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={msgEndRef} />
        </div>

        {/* Sliding Right Panels (Info / Admin) */}
        <div className={`absolute left-0 top-0 bottom-0 w-full md:w-[350px] bg-[#17212b] border-r border-[#0e1621] z-20 transition-transform duration-300 ${showInfo || showAdminSettings ? 'translate-x-0' : '-translate-x-full'}`}>
           <div className="p-4 flex items-center gap-4 border-b border-[#0e1621] bg-[#242f3d]">
              <button onClick={() => {setShowInfo(false); setShowAdminSettings(false);}} className="p-2 text-[#708499] hover:text-white"><ChevronLeft size={22} className="rotate-180"/></button>
              <h3 className="font-bold">{showAdminSettings ? 'مدیریت گفتگو' : 'اطلاعات'}</h3>
           </div>
           
           <div className="overflow-y-auto h-[calc(100%-64px)] p-6 no-scrollbar space-y-8">
              {showAdminSettings ? (
                <>
                  <section className="space-y-4">
                    <h4 className="text-xs font-bold text-[#3390ec] uppercase tracking-widest flex items-center gap-2"><Shield size={14}/> امنیت و دسترسی</h4>
                    <PermissionToggle label="ارسال پیام" value={chat.permissions?.canSendMessages} onChange={v => updateSettings('permissions', {...chat.permissions, canSendMessages: v})} />
                    <PermissionToggle label="افزودن کاربر" value={chat.permissions?.canAddUsers} onChange={v => updateSettings('permissions', {...chat.permissions, canAddUsers: v})} />
                  </section>
                  
                  <section className="space-y-4">
                    <h4 className="text-xs font-bold text-[#3390ec] uppercase tracking-widest flex items-center gap-2"><Link size={14}/> لینک دعوت</h4>
                    <div className="p-4 bg-[#242f3d] rounded-2xl flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2 overflow-hidden">
                        <p className="text-[10px] font-mono text-white/80 truncate flex-1">{chat.inviteLink || 'لینکی وجود ندارد'}</p>
                        {chat.inviteLink && (
                          <button onClick={() => copyToClipboard(chat.inviteLink!)} className="p-2 hover:bg-white/10 rounded-lg">
                            {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14} className="text-[#3390ec]"/>}
                          </button>
                        )}
                      </div>
                      <button onClick={() => updateSettings('inviteLink', `https://starly.chat/j/${chat.id.slice(-6)}`)} className="w-full py-2 text-xs text-[#3390ec] font-bold border border-[#3390ec]/30 rounded-lg hover:bg-[#3390ec]/10">ساخت لینک جدید</button>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="text-xs font-bold text-[#3390ec] uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14}/> ویرایش پروفایل</h4>
                    <div className="flex flex-col gap-3">
                       <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-3 bg-[#242f3d] rounded-xl text-sm border border-white/5 hover:border-[#3390ec]/40 transition-all">
                        <ImageIcon size={18} className="text-[#3390ec]"/> تغییر عکس پروفایل
                       </button>
                       <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                       <input defaultValue={chat.groupName} onBlur={e => updateSettings('groupName', e.target.value)} placeholder="نام گفتگو" className="w-full bg-[#242f3d] p-3 rounded-xl outline-none text-sm border border-white/5 focus:border-[#3390ec]/40" />
                       <textarea defaultValue={chat.description} onBlur={e => updateSettings('description', e.target.value)} placeholder="توضیحات گفتگو" className="w-full bg-[#242f3d] p-3 rounded-xl outline-none text-sm h-24 resize-none border border-white/5 focus:border-[#3390ec]/40" />
                    </div>
                    <button onClick={() => {setShowAdminSettings(false); setShowInfo(true);}} className="w-full py-3 bg-[#3390ec] rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">ذخیره و بازگشت</button>
                  </section>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-4 group cursor-pointer" onClick={() => isAdmin && fileInputRef.current?.click()}>
                      <img src={chat.type === 'group' || chat.type === 'channel' ? chat.groupAvatar : other?.avatar} className="w-24 h-24 rounded-full border-2 border-[#3390ec] object-cover shadow-2xl" />
                      {isAdmin && (
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <ImageIcon size={24}/>
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl font-bold">{title}</h2>
                    <p className="text-sm text-[#708499]">{chat.type === 'private' ? `@${other?.username}` : (chat.type === 'channel' ? 'کانال عمومی' : 'گروه خصوصی')}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h4 className="text-xs font-bold text-[#3390ec] uppercase tracking-wider">اعضا ({chat.participants.length})</h4>
                       {isAdmin && (
                         <button onClick={() => setShowAddMember(true)} className="text-xs text-[#3390ec] flex items-center gap-1 font-bold hover:underline">
                          <UserPlus size={14}/> افزودن کاربر
                         </button>
                       )}
                    </div>
                    <div className="space-y-1">
                      {chat.participants.map(p => (
                        <div key={p.id} className="flex items-center justify-between group/member p-2 hover:bg-[#242f3d] rounded-xl transition-all">
                           <div className="flex items-center gap-3">
                              <img src={p.avatar} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                              <div className="flex flex-col">
                                 <span className="text-sm font-medium">{p.displayName}</span>
                                 <span className="text-[10px] text-[#708499]">@{p.username}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                             {chat.adminId === p.id && <Shield size={12} className="text-[#3390ec]"/>}
                             {chat.admins?.[p.id] && chat.adminId !== p.id && <UserCheck size={12} className="text-green-400"/>}
                             
                             {isOwner && p.id !== currentUser.id && (
                               <div className="flex opacity-0 group-hover/member:opacity-100 transition-all gap-1">
                                 {!chat.admins?.[p.id] && (
                                   <button onClick={() => setShowPromoteModal(p)} className="p-1 text-green-400 hover:bg-green-400/10 rounded" title="ارتقا به ادمین"><UserCheck size={16}/></button>
                                 )}
                                 <button className="p-1 text-red-400 hover:bg-red-400/10 rounded" title="حذف کاربر"><UserMinus size={16}/></button>
                               </div>
                             )}
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
           </div>
        </div>
      </div>

      {/* Footer / Input Area */}
      <div className="p-4 bg-[#17212b]/95 backdrop-blur-md border-t border-[#0e1621]">
        {isReadOnly ? (
          <div className="p-3 text-center text-[#708499] text-sm bg-[#242f3d] rounded-2xl border border-[#3390ec]/10">فقط مدیران می‌توانند در این کانال پیام بفرستند.</div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-end gap-3">
            <div className="flex-1 bg-[#242f3d] rounded-2xl flex items-center px-4 py-2 border border-transparent focus-within:border-[#3390ec]/30 transition-all relative">
              <Smile className="text-[#708499] cursor-pointer hover:text-white" size={24}/>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="پیام خود را بنویسید..."
                className="flex-1 bg-transparent border-none outline-none text-white resize-none mx-2 py-2 text-sm max-h-32 no-scrollbar scrollbar-hide"
                rows={1}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              />
              <Paperclip className="text-[#708499] cursor-pointer hover:text-white" size={24}/>
            </div>
            <button type="submit" className="p-4 bg-[#3390ec] text-white rounded-full shadow-lg hover:bg-[#2881d9] transition-all transform active:scale-90">
              {inputText.trim() ? <Send size={22} className="rotate-180" /> : <Mic size={22} />}
            </button>
          </form>
        )}
      </div>

      {/* Admin Promotion Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-[#17212b] w-full max-w-xs rounded-3xl p-6 border border-[#242f3d] shadow-2xl animate-in zoom-in">
              <h3 className="font-bold text-center mb-4">ارتقا {showPromoteModal.displayName} به مدیر</h3>
              <p className="text-xs text-[#708499] text-center mb-6">آیا مایلید به این کاربر دسترسی‌های مدیریتی بدهید؟</p>
              <div className="flex gap-2">
                 <button onClick={() => setShowPromoteModal(null)} className="flex-1 py-3 text-sm font-bold bg-[#242f3d] rounded-xl hover:bg-[#2b3949] transition-colors">انصراف</button>
                 <button onClick={() => promoteToAdmin(showPromoteModal)} className="flex-1 py-3 text-sm font-bold bg-[#3390ec] rounded-xl hover:bg-[#2881d9] transition-colors">تایید ارتقا</button>
              </div>
           </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-[#17212b] w-full max-w-sm rounded-3xl p-6 border border-[#242f3d] shadow-2xl animate-in zoom-in flex flex-col h-[500px]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold">افزودن کاربر به گفتگو</h3>
                 <button onClick={() => setShowAddMember(false)} className="p-1 hover:bg-white/10 rounded-full"><X size={20}/></button>
              </div>
              <div className="relative mb-4">
                <Search className="absolute right-3 top-2.5 text-[#708499]" size={16}/>
                <input value={memberSearch} onChange={e=>setMemberSearch(e.target.value)} className="w-full bg-[#242f3d] rounded-xl py-2 pr-10 pl-4 text-sm text-white focus:ring-1 focus:ring-[#3390ec] outline-none" placeholder="جستجوی کاربر..." />
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                {filteredNewMembers.map(u => (
                  <div key={u.id} onClick={() => { onAction('addParticipant', u); setShowAddMember(false); }} className="flex items-center gap-3 p-3 hover:bg-[#242f3d] rounded-xl cursor-pointer transition-all border border-transparent hover:border-[#3390ec]/30 group">
                    <img src={u.avatar} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-bold group-hover:text-[#3390ec]">{u.displayName}</p>
                      <p className="text-[10px] text-[#708499]">@{u.username}</p>
                    </div>
                    <UserPlus size={16} className="text-[#3390ec] opacity-0 group-hover:opacity-100 transition-all"/>
                  </div>
                ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const PermissionToggle = ({label, value, onChange}: {label: string, value?: boolean, onChange: (v: boolean) => void}) => (
  <div className="flex items-center justify-between p-3 bg-[#242f3d] rounded-xl border border-white/5 hover:border-white/10 transition-all">
    <span className="text-sm font-medium">{label}</span>
    <button onClick={() => onChange(!value)} className={`w-10 h-5 rounded-full relative transition-all duration-200 ${value ? 'bg-[#3390ec]' : 'bg-gray-600'}`}>
      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${value ? 'left-6' : 'left-1'}`} />
    </button>
  </div>
);

const Search = ({ className, size }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

export default ChatArea;
