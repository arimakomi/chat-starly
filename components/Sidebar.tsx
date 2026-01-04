
import React, { useState } from 'react';
import { User, Chat, FolderType } from '../types';
import { Menu, Search, LogOut, Bookmark, Users, Settings, Bot, MessageCircle, X, ChevronRight, Moon, Sun, Shield, Bell, Plus, Check } from 'lucide-react';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  setActiveChatId: (id: string) => void;
  currentUser: User;
  activeFolder: FolderType;
  setActiveFolder: (f: FolderType) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onCreateGroup: (name: string, members: string[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  chats, 
  activeChatId, 
  setActiveChatId, 
  currentUser, 
  activeFolder, 
  setActiveFolder,
  onOpenSettings,
  onLogout,
  onCreateGroup
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleNightMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('oled-theme');
  };

  const filteredChats = chats.filter(chat => {
    const chatName = chat.type === 'group' ? chat.groupName : (chat.type === 'saved' ? 'saved' : chat.participants.find(p => p.id !== currentUser.id)?.displayName);
    const matchesSearch = chatName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (activeFolder === 'all') return true;
    if (activeFolder === 'saved') return chat.type === 'saved';
    if (activeFolder === 'private') return chat.type === 'private';
    if (activeFolder === 'groups') return chat.type === 'group';
    if (activeFolder === 'bots') return chat.type === 'bot';
    return true;
  });

  const allAvailableUsers = Object.values(JSON.parse(localStorage.getItem('gram_users') || '{}')) as User[];
  const contacts = allAvailableUsers.filter(u => u.id !== currentUser.id);

  const handleCreateGroup = () => {
    if (groupName.trim() && selectedMembers.length > 0) {
        onCreateGroup(groupName, selectedMembers);
        setShowNewGroup(false);
        setGroupName('');
        setSelectedMembers([]);
    }
  };

  return (
    <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col bg-[#17212b] border-l border-[#0e1621] h-screen relative z-30 transition-colors duration-500">
      <div className="p-2 flex items-center gap-2">
        <button onClick={() => setShowDrawer(true)} className="p-2.5 hover:bg-[#242f3d] rounded-full text-[#708499] transition-colors"><Menu className="w-6 h-6" /></button>
        <div className="flex-1 relative group">
          <Search className="absolute right-3 top-2.5 w-4.5 h-4.5 text-[#708499]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#242f3d] rounded-full py-2.5 pr-10 pl-4 text-[14px] focus:outline-none text-white placeholder-[#708499]"
            placeholder="جستجو در استارلی جت..."
          />
        </div>
      </div>

      <div className="flex px-2 border-b border-[#0e1621] bg-[#17212b]">
        {['all', 'private', 'groups', 'bots', 'saved'].map(id => (
          <button key={id} onClick={() => setActiveFolder(id as any)} className={`flex-1 py-3 text-[13px] font-bold relative ${activeFolder === id ? 'text-[#3390ec]' : 'text-[#708499]'}`}>
            {id === 'all' ? 'همه' : id === 'private' ? 'شخصی' : id === 'groups' ? 'گروه‌ها' : id === 'bots' ? 'بات‌ها' : 'ذخیره'}
            {activeFolder === id && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#3390ec] rounded-t-full" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar bg-[#17212b]">
        {filteredChats.map(chat => {
          const isSaved = chat.type === 'saved';
          const isGroup = chat.type === 'group';
          const title = isGroup ? chat.groupName : (isSaved ? 'پیام‌های ذخیره شده' : chat.participants.find(p => p.id !== currentUser.id)?.displayName);
          const avatar = isGroup ? chat.groupAvatar : (isSaved ? '' : chat.participants.find(p => p.id !== currentUser.id)?.avatar);
          const isActive = chat.id === activeChatId;

          return (
            <div key={chat.id} onClick={() => setActiveChatId(chat.id)} className={`flex items-center gap-3 p-3 mx-2 my-1 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-[#3390ec] text-white' : 'hover:bg-[#242f3d]'}`}>
              <div className="relative flex-shrink-0">
                {isSaved ? <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-[#3390ec] text-white ${isActive ? 'bg-white/20' : ''}`}><Bookmark className="w-7 h-7" /></div>
                        : <img src={avatar} className="w-14 h-14 rounded-full border border-black/10 object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline"><h3 className="font-bold truncate text-[16px]">{title}</h3></div>
                <p className={`text-[14px] truncate ${isActive ? 'text-blue-50' : 'text-[#708499]'}`}>{chat.lastMessage?.text || (isGroup ? 'تاریخچه خالی است' : 'هنوز پیامی ارسال نشده')}</p>
              </div>
            </div>
          );
        })}
      </div>

      {showDrawer && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setShowDrawer(false)}>
           <div className="absolute inset-0 bg-black/50" />
           <div className="relative w-[300px] h-full bg-[#17212b] animate-in slide-in-from-right flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="bg-[#242f3d] p-6">
                 <img src={currentUser.avatar} className="w-16 h-16 rounded-full border-2 border-[#3390ec] mb-4" />
                 <h4 className="font-bold text-lg text-white">{currentUser.displayName}</h4>
                 <p className="text-[#708499] text-sm">@{currentUser.username}</p>
              </div>
              <div className="flex-1 py-3 overflow-y-auto">
                 <MenuButton icon={<Bookmark />} label="پیام‌های ذخیره شده" onClick={() => { setActiveFolder('saved'); setShowDrawer(false); }} />
                 <MenuButton icon={<Users />} label="گروه جدید" onClick={() => { setShowNewGroup(true); setShowDrawer(false); }} />
                 <div className="h-px bg-[#0e1621] my-2 mx-4" />
                 <MenuButton icon={<Settings />} label="تنظیمات" onClick={() => { onOpenSettings(); setShowDrawer(false); }} />
                 <MenuButton icon={isDarkMode ? <Sun /> : <Moon />} label={isDarkMode ? "حالت روشن" : "حالت شب"} onClick={toggleNightMode} />
              </div>
              <div className="p-4 border-t border-[#0e1621]">
                 <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-3 text-red-400 font-bold"><LogOut /> خروج</button>
              </div>
           </div>
        </div>
      )}

      {showNewGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
           <div className="w-full max-w-[400px] bg-[#17212b] rounded-3xl p-6 border border-[#242f3d]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold">گروه جدید</h3>
                 <button onClick={() => setShowNewGroup(false)}><X /></button>
              </div>
              <div className="space-y-4">
                 <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="نام گروه" className="w-full bg-[#242f3d] p-3 rounded-xl border-none text-white focus:ring-2 focus:ring-[#3390ec]" />
                 <p className="text-sm text-[#708499]">انتخاب اعضا ({selectedMembers.length}):</p>
                 <div className="max-h-60 overflow-y-auto space-y-2 no-scrollbar">
                    {contacts.map(u => (
                       <div key={u.id} onClick={() => setSelectedMembers(prev => prev.includes(u.username) ? prev.filter(x => x!==u.username) : [...prev, u.username])} className="flex items-center gap-3 p-2 hover:bg-[#242f3d] rounded-xl cursor-pointer">
                          <img src={u.avatar} className="w-10 h-10 rounded-full" />
                          <div className="flex-1"><p className="text-sm font-bold">{u.displayName}</p><p className="text-xs text-[#708499]">@{u.username}</p></div>
                          {selectedMembers.includes(u.username) && <div className="bg-[#3390ec] rounded-full p-1"><Check size={12}/></div>}
                       </div>
                    ))}
                 </div>
                 <button onClick={handleCreateGroup} className="w-full py-3 bg-[#3390ec] rounded-xl font-bold">ایجاد گروه</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const MenuButton: React.FC<{ icon: any, label: string, onClick?: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-[#242f3d] text-white/90">
    <span className="text-[#708499]">{icon}</span>
    <span className="text-[14px] font-medium">{label}</span>
  </button>
);

export default Sidebar;
