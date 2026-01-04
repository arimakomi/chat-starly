
import React, { useState, useMemo } from 'react';
import { User, Chat, FolderType } from '../types';
import { Menu, Search, LogOut, Bookmark, Users, Settings, ChevronRight, Pin, Megaphone, Plus, X, ChevronLeft, Check, Folder, Image as ImageIcon } from 'lucide-react';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  setActiveChatId: (id: string) => void;
  currentUser: User;
  activeFolder: FolderType;
  setActiveFolder: (f: FolderType) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onStartChat: (user: User) => void;
  onCreateGroup: (name: string, desc: string, members: User[]) => void;
  onCreateChannel: (name: string, desc: string, members: User[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  chats, activeChatId, setActiveChatId, currentUser, activeFolder, setActiveFolder, onOpenSettings, onLogout, onStartChat, onCreateGroup, onCreateChannel
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState<'group' | 'channel' | null>(null);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);

  const allUsers = useMemo(() => {
    const usersObj = JSON.parse(localStorage.getItem('starly_users') || '{}');
    return Object.values(usersObj).filter((u: any) => u && u.id !== currentUser.id) as User[];
  }, [currentUser.id]);

  const filteredChats = useMemo(() => {
    return chats.filter(c => {
      const other = c.participants.find(p => p && p.id !== currentUser.id);
      const title = c.id === 'saved-messages' ? 'پیام‌های ذخیره شده' : (c.type === 'group' || c.type === 'channel' ? c.groupName : other?.displayName);
      const matchesSearch = title?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (searchQuery) return matchesSearch;

      if (activeFolder === 'saved') return c.id === 'saved-messages';
      if (activeFolder === 'private') return c.type === 'private';
      if (activeFolder === 'groups') return c.type === 'group';
      if (activeFolder === 'channels') return c.type === 'channel';
      return true;
    }).sort((a,b) => (b.isPinnedInSidebar ? 1 : 0) - (a.isPinnedInSidebar ? 1 : 0));
  }, [chats, activeFolder, searchQuery, currentUser.id]);

  const globalResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return allUsers.filter(u => 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
  }, [allUsers, searchQuery]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    if (showCreateModal === 'group') onCreateGroup(newName, newDesc, selectedMembers);
    else onCreateChannel(newName, newDesc, selectedMembers);
    setShowCreateModal(null);
    setCreateStep(1);
    setNewName('');
    setNewDesc('');
    setSelectedMembers([]);
  };

  return (
    <div className="w-full md:w-[380px] lg:w-[420px] flex flex-col bg-[#17212b] border-l border-black/20 h-screen transition-all relative z-30">
      {/* Search Header */}
      <div className="p-3 flex items-center gap-2">
        <button onClick={() => setShowDrawer(true)} className="p-2 hover:bg-[#242f3d] rounded-full text-[#708499] transition-all active:scale-90"><Menu size={22}/></button>
        <div className="flex-1 relative group">
          <Search className="absolute right-3 top-2.5 text-[#708499] group-focus-within:text-[#3390ec] transition-colors" size={16}/>
          <input 
            value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} 
            className="w-full bg-[#242f3d] rounded-2xl py-2 pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-[#3390ec]/20 transition-all text-white placeholder:text-[#708499]" 
            placeholder="جستجو..." 
          />
          {searchQuery && <button onClick={()=>setSearchQuery('')} className="absolute left-3 top-2.5 text-[#708499]"><X size={16}/></button>}
        </div>
      </div>

      {/* Folders */}
      {!searchQuery && (
        <div className="flex px-2 border-b border-black/10 overflow-x-auto no-scrollbar scroll-smooth bg-[#17212b]/50">
          {[
            { id: 'all', label: 'همه' },
            { id: 'private', label: 'شخصی' },
            { id: 'groups', label: 'گروه‌ها' },
            { id: 'channels', label: 'کانال‌ها' },
            { id: 'saved', label: 'ذخیره' }
          ].map(f => (
            <button key={f.id} onClick={() => setActiveFolder(f.id as FolderType)} className={`px-5 py-3 text-[13px] font-bold whitespace-nowrap relative transition-all ${activeFolder === f.id ? 'text-[#3390ec]' : 'text-[#708499] hover:text-white'}`}>
              {f.label}
              {activeFolder === f.id && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#3390ec] rounded-t-full animate-in slide-in-from-bottom-1"/>}
            </button>
          ))}
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {searchQuery.length > 0 && globalResults.length > 0 && (
          <div className="animate-in fade-in slide-in-from-top-1">
             <div className="px-5 py-2 text-[10px] font-bold text-[#3390ec] uppercase tracking-widest">نتایج جهانی</div>
             {globalResults.map(u => (
               <div key={u.id} onClick={() => { onStartChat(u); setSearchQuery(''); }} className="flex items-center gap-3 p-3 mx-2 rounded-xl hover:bg-[#242f3d] cursor-pointer group transition-all">
                  <img src={u.avatar} className="w-11 h-11 rounded-full border border-white/5 object-cover shadow-lg bg-[#242f3d]"/>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-white group-hover:text-[#3390ec]">{u.displayName}</h4>
                    <p className="text-xs text-[#708499]">@{u.username}</p>
                  </div>
                  <ChevronRight size={16} className="text-[#708499] opacity-0 group-hover:opacity-100 transition-all rotate-180"/>
               </div>
             ))}
          </div>
        )}

        <div className="mt-2">
          {filteredChats.length === 0 && !searchQuery ? (
             <div className="flex flex-col items-center justify-center h-40 opacity-20 text-[#708499]"><Plus size={40}/><p className="text-xs mt-2">هنوز گفتگویی ندارید</p></div>
          ) : filteredChats.map(chat => {
            const isSaved = chat.id === 'saved-messages';
            const other = chat.participants.find(p => p && p.id !== currentUser.id);
            const title = isSaved ? 'پیام‌های ذخیره شده' : (chat.type === 'group' || chat.type === 'channel' ? chat.groupName : other?.displayName);
            const avatar = isSaved ? null : (chat.type === 'group' || chat.type === 'channel' ? chat.groupAvatar : other?.avatar);
            const isActive = chat.id === activeChatId;

            return (
              <div key={chat.id} onClick={() => setActiveChatId(chat.id)} className={`flex items-center gap-3 p-3 mx-2 mb-1 rounded-2xl cursor-pointer transition-all relative ${isActive ? 'bg-[#3390ec] text-white shadow-xl scale-[1.02] z-10' : 'hover:bg-[#242f3d]'}`}>
                <div className="relative flex-shrink-0">
                  {isSaved ? <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-[#3390ec] shadow-inner ${isActive?'bg-white/20':''}`}><Bookmark size={26} className="fill-current text-white"/></div>
                           : <img src={avatar || ''} className="w-14 h-14 rounded-full object-cover shadow-md border border-white/5 bg-[#242f3d]" alt={title}/>}
                  {!isSaved && other?.status === 'online' && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#17212b]"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h3 className="font-bold text-[15px] truncate text-white">{title}</h3>
                    <span className={`text-[10px] ${isActive ? 'text-white/70' : 'text-[#708499]'}`}>
                      {chat.lastMessage ? new Date(chat.lastMessage.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-[13px] truncate flex-1 ${isActive ? 'text-white/80' : 'text-[#708499]'}`}>
                      {chat.lastMessage?.text || 'هنوز پیامی ارسال نشده'}
                    </p>
                    {chat.unreadCount > 0 && <span className="bg-[#3390ec] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center border border-white/10">{chat.unreadCount}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setShowDrawer(false)}>
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"/>
           <div className="relative w-[300px] h-full bg-[#17212b] shadow-2xl animate-in slide-in-from-right duration-300" onClick={e=>e.stopPropagation()}>
              <div className="bg-[#242f3d] p-6 pb-4 border-b border-white/5">
                 <img src={currentUser.avatar} className="w-16 h-16 rounded-full border-2 border-[#3390ec] mb-4 object-cover shadow-xl"/>
                 <h4 className="font-bold text-lg leading-tight text-white">{currentUser.displayName}</h4>
                 <p className="text-xs text-[#708499]">@{currentUser.username}</p>
              </div>
              <nav className="p-2 space-y-1">
                <MenuBtn icon={<Bookmark size={20}/>} label="پیام‌های ذخیره شده" onClick={() => {setActiveChatId('saved-messages'); setShowDrawer(false);}}/>
                <MenuBtn icon={<Users size={20}/>} label="ایجاد گروه جدید" onClick={() => { setShowCreateModal('group'); setShowDrawer(false); }}/>
                <MenuBtn icon={<Megaphone size={20}/>} label="ایجاد کانال جدید" onClick={() => { setShowCreateModal('channel'); setShowDrawer(false); }}/>
                <MenuBtn icon={<Settings size={20}/>} label="تنظیمات" onClick={() => {onOpenSettings(); setShowDrawer(false);}}/>
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
                 <button onClick={onLogout} className="w-full flex items-center gap-4 p-3 text-red-400 font-bold hover:bg-red-500/10 rounded-xl transition-all active:scale-95"><LogOut size={20}/> خروج از حساب</button>
              </div>
           </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
           <div className="bg-[#17212b] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in border border-white/10">
              <div className="p-4 bg-[#242f3d] flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   {createStep === 2 && <button onClick={()=>setCreateStep(1)}><ChevronLeft className="rotate-180"/></button>}
                   <h3 className="font-bold text-white">{showCreateModal === 'group' ? 'گروه جدید' : 'کانال جدید'}</h3>
                 </div>
                 <button onClick={()=>setShowCreateModal(null)}><X className="text-[#708499]"/></button>
              </div>
              <div className="p-6 space-y-4">
                 {createStep === 1 ? (
                   <>
                     <div className="flex justify-center mb-2"><div className="w-20 h-20 bg-[#242f3d] rounded-full flex items-center justify-center border-2 border-dashed border-[#3390ec]/50"><ImageIcon className="text-[#3390ec]"/></div></div>
                     <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="نام" className="w-full bg-[#242f3d] p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#3390ec] text-white" autoFocus/>
                     <textarea value={newDesc} onChange={e=>setNewDesc(e.target.value)} placeholder="توضیحات (اختیاری)" className="w-full bg-[#242f3d] p-3 rounded-xl outline-none focus:ring-1 focus:ring-[#3390ec] h-24 resize-none text-white"/>
                     <button onClick={()=>setCreateStep(2)} disabled={!newName.trim()} className="w-full py-4 bg-[#3390ec] rounded-xl font-bold hover:bg-[#2881d9] transition-all disabled:opacity-50 active:scale-95 text-white">بعدی</button>
                   </>
                 ) : (
                   <div className="flex flex-col h-[400px]">
                      <h4 className="text-xs font-bold text-[#3390ec] mb-2 uppercase tracking-widest">افزودن اعضا</h4>
                      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 mb-4">
                         {allUsers.length === 0 && <p className="text-center text-sm text-[#708499] mt-10">کاربر دیگری یافت نشد.</p>}
                         {allUsers.map(u => {
                           const isSelected = selectedMembers.some(m => m.id === u.id);
                           return (
                             <div key={u.id} onClick={() => setSelectedMembers(isSelected ? selectedMembers.filter(m=>m.id!==u.id) : [...selectedMembers, u])} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected?'bg-[#3390ec]/10 border-[#3390ec]':'hover:bg-[#242f3d] border-transparent'}`}>
                                <img src={u.avatar} className="w-10 h-10 rounded-full object-cover bg-[#242f3d]"/>
                                <div className="flex-1"><p className="text-sm font-bold text-white">{u.displayName}</p><p className="text-[10px] text-[#708499]">@{u.username}</p></div>
                                {isSelected && <Check size={18} className="text-[#3390ec]"/>}
                             </div>
                           );
                         })}
                      </div>
                      <button onClick={handleCreate} className="w-full py-4 bg-[#3390ec] rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 text-white"><Check size={20}/> ایجاد نهایی</button>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const MenuBtn = ({icon, label, onClick}: any) => (
  <button onClick={onClick} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#242f3d] transition-all text-white/90 group active:scale-95">
    <span className="text-[#708499] group-hover:text-[#3390ec] transition-colors">{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export default Sidebar;
