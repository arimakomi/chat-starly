
import React, { useState, useMemo } from 'react';
import { User, Chat, FolderType } from '../types';
import { Menu, Search, LogOut, Bookmark, Users, Settings, Globe, ChevronRight, Pin, Megaphone, Plus, X } from 'lucide-react';

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
  onCreateGroup: (name: string, desc: string) => void;
  onCreateChannel: (name: string, desc: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  chats, activeChatId, setActiveChatId, currentUser, activeFolder, setActiveFolder, onOpenSettings, onLogout, onStartChat, onCreateGroup, onCreateChannel
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState<'group' | 'channel' | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const allUsers = useMemo(() => {
    const usersObj = JSON.parse(localStorage.getItem('starly_users') || '{}');
    return Object.values(usersObj).filter(Boolean) as User[];
  }, [searchQuery]);

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
    }).sort((a,b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [chats, activeFolder, searchQuery, currentUser.id]);

  const globalSearchUsers = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return allUsers.filter(u => 
      u.id !== currentUser.id && 
      (u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
       u.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allUsers, searchQuery, currentUser.id]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    if (showCreateModal === 'group') onCreateGroup(newName, newDesc);
    else onCreateChannel(newName, newDesc);
    setShowCreateModal(null);
    setNewName('');
    setNewDesc('');
  };

  return (
    <div className="w-full md:w-[380px] lg:w-[420px] flex flex-col bg-[#17212b] border-l border-[#0e1621] h-screen transition-all relative z-30">
      <div className="p-3 flex items-center gap-2">
        <button onClick={() => setShowDrawer(true)} className="p-2 hover:bg-[#242f3d] rounded-full text-[#708499] transition-colors"><Menu size={22}/></button>
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-2.5 text-[#708499]" size={16}/>
          <input 
            value={searchQuery} 
            onChange={e=>setSearchQuery(e.target.value)} 
            className="w-full bg-[#242f3d] rounded-2xl py-2 pr-10 pl-4 text-sm text-white focus:ring-1 focus:ring-[#3390ec] outline-none transition-all" 
            placeholder="جستجو..." 
          />
        </div>
      </div>

      {!searchQuery && (
        <div className="flex px-2 border-b border-[#0e1621] overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { id: 'all', label: 'همه' },
            { id: 'private', label: 'شخصی' },
            { id: 'groups', label: 'گروه‌ها' },
            { id: 'channels', label: 'کانال‌ها' },
            { id: 'saved', label: 'ذخیره' }
          ].map(folder => (
            <button key={folder.id} onClick={() => setActiveFolder(folder.id as FolderType)} className={`px-5 py-3 text-[13px] font-bold whitespace-nowrap relative transition-colors ${activeFolder === folder.id ? 'text-[#3390ec]' : 'text-[#708499] hover:text-white'}`}>
              {folder.label}
              {activeFolder === folder.id && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#3390ec] rounded-t-full" />}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {searchQuery.length > 0 && (
          <div className="px-5 py-2 text-[10px] font-bold text-[#3390ec] uppercase tracking-wider">نتایج جستجو</div>
        )}

        {filteredChats.map(chat => {
          const isSaved = chat.id === 'saved-messages';
          const other = chat.participants.find(p => p && p.id !== currentUser.id);
          const title = isSaved ? 'پیام‌های ذخیره شده' : (chat.type === 'group' || chat.type === 'channel' ? chat.groupName : other?.displayName);
          const avatar = isSaved ? null : (chat.type === 'group' || chat.type === 'channel' ? chat.groupAvatar : other?.avatar);
          const isActive = chat.id === activeChatId;

          return (
            <div key={chat.id} onClick={() => {setActiveChatId(chat.id); setSearchQuery('');}} className={`flex items-center gap-3 p-3 mx-2 my-1 rounded-2xl cursor-pointer transition-all ${isActive ? 'bg-[#3390ec] text-white shadow-lg' : 'hover:bg-[#242f3d]'}`}>
              <div className="relative flex-shrink-0">
                {isSaved ? (
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-[#3390ec] border border-white/20 ${isActive ? 'bg-white/20' : ''}`}>
                    <Bookmark size={26} className="fill-current"/>
                  </div>
                ) : (
                  <img src={avatar || ''} className="w-14 h-14 rounded-full object-cover border border-white/5" alt={title || ''} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <h3 className="font-bold text-[15px] truncate">{title}</h3>
                  <span className={`text-[10px] ${isActive ? 'text-white/70' : 'text-[#708499]'}`}>
                    {chat.lastMessage ? new Date(chat.lastMessage.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}
                  </span>
                </div>
                <p className={`text-[13px] truncate ${isActive ? 'text-white/80' : 'text-[#708499]'}`}>
                  {chat.lastMessage?.text || 'هنوز پیامی ارسال نشده است'}
                </p>
              </div>
            </div>
          );
        })}

        {globalSearchUsers.length > 0 && (
          <div className="mt-4">
            <div className="px-5 py-2 text-[10px] font-bold text-[#3390ec] uppercase tracking-wider">یافتن کاربران جهانی</div>
            {globalSearchUsers.map(u => (
               <div key={u.id} onClick={() => { onStartChat(u); setSearchQuery(''); }} className="flex items-center gap-3 p-3 mx-2 rounded-xl hover:bg-[#242f3d] cursor-pointer group">
                  <img src={u.avatar} className="w-12 h-12 rounded-full border border-white/5 object-cover" />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{u.displayName}</h4>
                    <p className="text-xs text-[#708499]">@{u.username}</p>
                  </div>
                  <ChevronRight size={16} className="text-[#708499] opacity-0 group-hover:opacity-100 transition-all"/>
               </div>
            ))}
          </div>
        )}
      </div>

      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-start" onClick={() => setShowDrawer(false)}>
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" />
           <div className="relative w-[300px] h-full bg-[#17212b] shadow-2xl animate-in slide-in-from-right duration-300" onClick={e=>e.stopPropagation()}>
              <div className="bg-[#242f3d] p-6 mb-4">
                 <div className="relative inline-block mb-4">
                    <img src={currentUser.avatar} className="w-16 h-16 rounded-full border-2 border-[#3390ec] shadow-xl object-cover" alt={currentUser.displayName} />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#242f3d]" />
                 </div>
                 <h4 className="font-bold text-white text-lg">{currentUser.displayName}</h4>
                 <p className="text-xs text-[#708499]">@{currentUser.username}</p>
              </div>
              <nav className="space-y-1">
                <MenuBtn icon={<Bookmark size={20}/>} label="پیام‌های ذخیره شده" onClick={() => {setActiveChatId('saved-messages'); setShowDrawer(false);}} />
                <MenuBtn icon={<Users size={20}/>} label="گروه جدید" onClick={() => { setShowCreateModal('group'); setShowDrawer(false); }} />
                <MenuBtn icon={<Megaphone size={20}/>} label="کانال جدید" onClick={() => { setShowCreateModal('channel'); setShowDrawer(false); }} />
                <MenuBtn icon={<Settings size={20}/>} label="تنظیمات" onClick={() => {onOpenSettings(); setShowDrawer(false);}} />
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#0e1621]">
                 <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 text-red-400 font-bold hover:bg-red-500/10 rounded-xl transition-all active:scale-95"><LogOut size={20}/> خروج از حساب</button>
              </div>
           </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#17212b] w-full max-w-sm rounded-3xl p-6 border border-[#242f3d] shadow-2xl animate-in zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">{showCreateModal === 'group' ? 'ساخت گروه جدید' : 'ساخت کانال جدید'}</h3>
              <button onClick={() => setShowCreateModal(null)} className="p-2 text-[#708499] hover:text-white"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="نام" className="w-full bg-[#242f3d] p-4 rounded-xl outline-none focus:ring-1 focus:ring-[#3390ec]" />
              <textarea value={newDesc} onChange={e=>setNewDesc(e.target.value)} placeholder="توضیحات (اختیاری)" className="w-full bg-[#242f3d] p-4 rounded-xl outline-none focus:ring-1 focus:ring-[#3390ec] h-24 resize-none" />
              <button onClick={handleCreate} className="w-full py-4 bg-[#3390ec] rounded-xl font-bold hover:bg-[#2881d9] transition-all">ایجاد</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuBtn = ({icon, label, onClick}: any) => (
  <button onClick={onClick} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#242f3d] transition-colors text-white/90">
    <span className="text-[#708499]">{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export default Sidebar;
