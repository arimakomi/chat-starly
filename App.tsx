
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Message, Chat, FolderType, Permissions } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import { gemini } from './services/geminiService';

const AI_BOT: User = {
  id: 'ai-assistant',
  username: 'starly_ai',
  displayName: 'هوش مصنوعی استارلی',
  avatar: 'https://ui-avatars.com/api/?name=Starly+AI&background=3390ec&color=fff',
  status: 'online',
  bio: 'دستیار هوشمند chat.starly.ir',
  theme: 'night',
  wallpaper: 'default',
  privacy: { showStatus: 'all', showAvatar: 'all' }
};

const SAVED_MESSAGES_ID = 'saved-messages';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeFolder, setActiveFolder] = useState<FolderType>('all');
  const [showSettings, setShowSettings] = useState(false);
  
  const syncChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    syncChannelRef.current = new BroadcastChannel('starly_chat_sync');
    const savedSession = localStorage.getItem('starly_session');
    if (savedSession) {
      try {
        const user = JSON.parse(savedSession);
        setCurrentUser(user);
        document.body.className = `${user.theme}-theme`;
      } catch (e) { console.error(e); }
    }
    return () => syncChannelRef.current?.close();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const savedChats = localStorage.getItem(`chats_${currentUser.id}`);
    if (savedChats) {
      try { setChats(JSON.parse(savedChats)); } catch (e) { console.error(e); }
    }
    const handleSync = (event: MessageEvent) => {
      if (event.data.type === 'SYNC_ALL' && event.data.userId === currentUser.id) {
        setChats(event.data.chats);
      }
    };
    if (syncChannelRef.current) syncChannelRef.current.onmessage = handleSync;
  }, [currentUser]);

  const updateChats = useCallback((newChats: Chat[]) => {
    setChats(newChats);
    if (currentUser) {
      localStorage.setItem(`chats_${currentUser.id}`, JSON.stringify(newChats));
      syncChannelRef.current?.postMessage({ type: 'SYNC_ALL', chats: newChats, userId: currentUser.id });
    }
  }, [currentUser]);

  const handleAuth = (data: any) => {
    const users = JSON.parse(localStorage.getItem('starly_users') || '{}');
    let user: User;
    if (data.isNew) {
      user = {
        id: `u_${Date.now()}`,
        username: data.username.toLowerCase(),
        displayName: data.displayName || data.username,
        password: data.password,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.displayName || data.username)}&background=random&color=fff`,
        status: 'online',
        theme: 'night',
        wallpaper: 'default',
        privacy: { showStatus: 'all', showAvatar: 'all' }
      };
      users[user.username] = user;
      localStorage.setItem('starly_users', JSON.stringify(users));
    } else {
      user = users[data.username.toLowerCase()];
    }
    setCurrentUser(user);
    localStorage.setItem('starly_session', JSON.stringify(user));
    document.body.className = `${user.theme}-theme`;
  };

  const handleUsernameClick = (username: string) => {
    // Remove @ if present
    const cleanUsername = username.replace('@', '').toLowerCase();
    
    // Find chat with this user
    const existingChat = chats.find(c => 
      c.type === 'private' && 
      c.participants.some(p => p.username.toLowerCase() === cleanUsername && p.id !== currentUser?.id)
    );

    if (existingChat) {
      setActiveChatId(existingChat.id);
    } else {
      // Check if user exists in database to create new chat
      const allUsers = JSON.parse(localStorage.getItem('starly_users') || '{}');
      const foundUser = Object.values(allUsers).find((u: any) => u.username === cleanUsername) as User;
      
      if (foundUser && currentUser) {
        const newChat: Chat = { 
          id: `c_${Date.now()}`, 
          type: 'private', 
          participants: [currentUser, foundUser], 
          messages: [], 
          pinnedMessageIds: [], 
          unreadCount: 0 
        };
        updateChats([newChat, ...chats]);
        setActiveChatId(newChat.id);
      } else {
        alert('کاربری با این آیدی یافت نشد یا شما هنوز گفتگویی با او ندارید.');
      }
    }
  };

  const handleMessageAction = async (action: string, payload: any) => {
    if (!currentUser || !activeChatId) return;

    let updatedChats = chats.map(chat => {
      if (chat.id !== activeChatId) return chat;
      const newChat = { ...chat };

      switch(action) {
        case 'send':
          const msg: Message = {
            id: `m_${Date.now()}`,
            senderId: currentUser.id,
            text: payload.text,
            imageUrl: payload.imageUrl,
            audioUrl: payload.audioUrl,
            poll: payload.poll,
            replyToId: payload.replyToId,
            forwardedFrom: payload.forwardedFrom,
            timestamp: Date.now(),
            isRead: false
          };
          newChat.messages = [...newChat.messages, msg];
          newChat.lastMessage = msg;
          newChat.unreadCount = 0;
          break;
        case 'edit':
          newChat.messages = newChat.messages.map(m => m.id === payload.id ? { ...m, text: payload.text, isEdited: true } : m);
          break;
        case 'delete':
          newChat.messages = newChat.messages.filter(m => m.id !== payload.id);
          break;
        case 'pinMessage':
          newChat.pinnedMessageIds = [...(newChat.pinnedMessageIds || []), payload.id];
          break;
        case 'unpinMessage':
          newChat.pinnedMessageIds = newChat.pinnedMessageIds.filter(id => id !== payload.id);
          break;
        case 'votePoll':
          newChat.messages = newChat.messages.map(m => {
            if (m.id !== payload.messageId || !m.poll) return m;
            const newPoll = { ...m.poll };
            newPoll.options = newPoll.options.map(opt => {
              const alreadyVoted = opt.votes.includes(currentUser.id);
              if (opt.id === payload.optionId) {
                return { ...opt, votes: alreadyVoted ? opt.votes.filter(v => v !== currentUser.id) : [...opt.votes, currentUser.id] };
              }
              return alreadyVoted && !newPoll.isMultipleChoice ? { ...opt, votes: opt.votes.filter(v => v !== currentUser.id) } : opt;
            });
            newPoll.totalVotes = new Set(newPoll.options.flatMap(o => o.votes)).size;
            return { ...m, poll: newPoll };
          });
          break;
        case 'toggleSidebarPin':
          newChat.isPinnedInSidebar = !newChat.isPinnedInSidebar;
          break;
        case 'updateSettings':
          return { ...newChat, ...payload };
        case 'addParticipant':
          if (!newChat.participants.some(p => p.id === payload.id)) {
            newChat.participants = [...newChat.participants, payload];
          }
          break;
        case 'removeParticipant':
          newChat.participants = newChat.participants.filter(p => p.id !== payload.id);
          break;
        case 'clearHistory':
          newChat.messages = [];
          newChat.lastMessage = undefined;
          break;
        case 'updateChatInfo': // Admin action
          newChat.groupName = payload.groupName;
          newChat.description = payload.description;
          if (payload.slowMode !== undefined) newChat.slowMode = payload.slowMode;
          break;
      }
      return newChat;
    });

    if (activeChatId === SAVED_MESSAGES_ID && !chats.find(c => c.id === SAVED_MESSAGES_ID)) {
      const savedChat: Chat = {
        id: SAVED_MESSAGES_ID, 
        type: 'saved', 
        participants: [currentUser],
        messages: [], 
        pinnedMessageIds: [], 
        unreadCount: 0,
        groupName: 'پیام‌های ذخیره شده', 
        groupAvatar: '' 
      };
      if (action === 'send') {
          const msg: Message = {
            id: `m_${Date.now()}`,
            senderId: currentUser.id,
            text: payload.text,
            imageUrl: payload.imageUrl,
            audioUrl: payload.audioUrl,
            timestamp: Date.now(),
            isRead: true
          };
          savedChat.messages = [msg];
          savedChat.lastMessage = msg;
      }
      updatedChats = [savedChat, ...chats];
    }

    updateChats(updatedChats);

    // AI logic
    if (action === 'send' && activeChatId === AI_BOT.id) {
      setIsTyping(true);
      const chatObj = updatedChats.find(c => c.id === AI_BOT.id);
      const history = (chatObj?.messages || []).slice(-6).map(m => ({
        role: m.senderId === currentUser.id ? 'user' as const : 'model' as const,
        text: m.text
      }));
      const aiMsgId = `ai_${Date.now()}`;
      let fullText = "";
      try {
        const stream = gemini.getChatResponseStream(payload.text, history);
        for await (const chunk of stream) {
          fullText += chunk;
          setChats(prev => prev.map(c => c.id === AI_BOT.id ? {
            ...c,
            messages: c.messages.some(m => m.id === aiMsgId)
              ? c.messages.map(m => m.id === aiMsgId ? { ...m, text: fullText } : m)
              : [...c.messages, { id: aiMsgId, senderId: AI_BOT.id, text: fullText, timestamp: Date.now(), isAi: true }]
          } : c));
        }
      } catch (e) { console.error(e); } finally {
        setIsTyping(false);
        updateChats(JSON.parse(localStorage.getItem(`chats_${currentUser.id}`) || '[]'));
      }
    }
  };

  const getActiveChat = () => {
    if (!activeChatId || !currentUser) return null;
    
    if (activeChatId === SAVED_MESSAGES_ID) {
      return chats.find(c => c.id === SAVED_MESSAGES_ID) || { 
        id: SAVED_MESSAGES_ID, 
        type: 'saved', 
        participants: [currentUser], 
        messages: [], 
        pinnedMessageIds: [], 
        unreadCount: 0,
        groupName: 'پیام‌های ذخیره شده' 
      } as Chat;
    }
    
    if (activeChatId === AI_BOT.id) {
      return chats.find(c => c.id === AI_BOT.id) || { 
        id: AI_BOT.id, 
        type: 'bot', 
        participants: [currentUser, AI_BOT], 
        messages: [], 
        pinnedMessageIds: [], 
        unreadCount: 0 
      } as Chat;
    }

    return chats.find(c => c.id === activeChatId) || null;
  };

  if (!currentUser) return <Login onLogin={handleAuth} />;

  return (
    <div className="flex h-screen w-full bg-[#0e1621] text-white overflow-hidden font-['Vazirmatn']" dir="rtl">
      {/* 
         Mobile Responsive Logic:
         - Mobile: Show Sidebar if no activeChatId. Show ChatArea if activeChatId.
         - Desktop (md+): Always show Sidebar (width fixed), Always show ChatArea (flex-1).
      */}
      <div className={`flex-1 flex w-full h-full ${activeChatId ? 'md:flex' : ''}`}>
        
        {/* Sidebar Wrapper */}
        <div className={`w-full md:w-[380px] lg:w-[420px] flex-shrink-0 h-full border-l border-black/20 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
          <Sidebar 
            chats={chats} activeChatId={activeChatId} setActiveChatId={setActiveChatId} 
            currentUser={currentUser} activeFolder={activeFolder} setActiveFolder={setActiveFolder}
            onOpenSettings={() => setShowSettings(true)}
            onLogout={() => { localStorage.removeItem('starly_session'); setCurrentUser(null); }}
            onStartChat={(u) => {
              const existing = chats.find(c => c.type === 'private' && c.participants.some(p => p.id === u.id));
              if (existing) setActiveChatId(existing.id);
              else {
                const newChat: Chat = { id: `c_${Date.now()}`, type: 'private', participants: [currentUser, u], messages: [], pinnedMessageIds: [], unreadCount: 0 };
                updateChats([newChat, ...chats]);
                setActiveChatId(newChat.id);
              }
            }}
            onCreateGroup={(name, desc, members) => {
              const id = `g_${Date.now()}`;
              const newChat: Chat = { 
                id, type: 'group', groupName: name, description: desc, 
                participants: [currentUser, ...members], messages: [], pinnedMessageIds: [], 
                unreadCount: 0, adminId: currentUser.id,
                groupAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
                inviteLink: `https://chat.starly.ir/join/${id.substring(2)}`
              };
              updateChats([newChat, ...chats]);
              setActiveChatId(newChat.id);
            }}
            onCreateChannel={(name, desc, members) => {
              const id = `ch_${Date.now()}`;
              const newChat: Chat = { 
                id, type: 'channel', groupName: name, description: desc, 
                participants: [currentUser, ...members], messages: [], pinnedMessageIds: [], 
                unreadCount: 0, adminId: currentUser.id,
                groupAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&rounded=true`,
                inviteLink: `https://chat.starly.ir/join/${id.substring(3)}`
              };
              updateChats([newChat, ...chats]);
              setActiveChatId(newChat.id);
            }}
          />
        </div>

        {/* Chat Area Wrapper */}
        <div className={`flex-1 h-full w-full ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
           <ChatArea 
            chat={getActiveChat()} currentUser={currentUser} isTyping={isTyping} 
            onAction={handleMessageAction}
            onDeleteChat={() => {
              updateChats(chats.filter(c => c.id !== activeChatId));
              setActiveChatId(null);
            }}
            onBack={() => setActiveChatId(null)}
            onUsernameClick={handleUsernameClick}
          />
        </div>
      </div>

      {showSettings && (
        <SettingsModal 
          user={currentUser} onClose={() => setShowSettings(false)} 
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            localStorage.setItem('starly_session', JSON.stringify(updated));
            document.body.className = `${updated.theme}-theme`;
          }}
        />
      )}
    </div>
  );
};

export default App;
