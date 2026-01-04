
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
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=starly',
  status: 'online',
  bio: 'دستیار هوشمند شما در Starly Chat Pro'
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
    if (savedSession && savedSession !== 'undefined' && savedSession !== 'null') {
      try {
        const parsed = JSON.parse(savedSession);
        setCurrentUser(parsed);
      } catch (e) {
        console.error("Session error", e);
      }
    }

    return () => {
      syncChannelRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const savedChats = localStorage.getItem(`chats_${currentUser.id}`);
    if (savedChats) {
      try {
        setChats(JSON.parse(savedChats));
      } catch (e) {
        console.error("Chats error", e);
      }
    }

    const handleSync = (event: MessageEvent) => {
      if (event.data.type === 'SYNC_ALL' && event.data.userId === currentUser.id) {
        setChats(event.data.chats);
      }
    };

    if (syncChannelRef.current) {
      syncChannelRef.current.onmessage = handleSync;
    }
  }, [currentUser]);

  const updateChats = useCallback((newChats: Chat[]) => {
    setChats(newChats);
    if (currentUser) {
      localStorage.setItem(`chats_${currentUser.id}`, JSON.stringify(newChats));
      if (syncChannelRef.current) {
        try {
          syncChannelRef.current.postMessage({ type: 'SYNC_ALL', chats: newChats, userId: currentUser.id });
        } catch (e) {
          console.warn("Sync channel closed, re-opening...");
          syncChannelRef.current = new BroadcastChannel('starly_chat_sync');
          syncChannelRef.current.postMessage({ type: 'SYNC_ALL', chats: newChats, userId: currentUser.id });
        }
      }
    }
  }, [currentUser]);

  const handleAuth = (data: { username: string; password?: string; displayName?: string; isNew: boolean }) => {
    const users = JSON.parse(localStorage.getItem('starly_users') || '{}');
    let user: User | null = null;
    if (data.isNew) {
      user = {
        id: `u_${Math.random().toString(36).substr(2, 9)}`,
        username: data.username.toLowerCase(),
        displayName: data.displayName || data.username,
        password: data.password,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
        status: 'online',
        privacy: { showStatus: 'all', showAvatar: 'all', showBio: 'all' }
      };
      users[user.username] = user;
      localStorage.setItem('starly_users', JSON.stringify(users));
    } else {
      user = users[data.username.toLowerCase()] || null;
    }
    
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('starly_session', JSON.stringify(user));
    }
  };

  const startChat = (targetUser: User) => {
    if (!currentUser || !targetUser) return;
    if (targetUser.username === currentUser.username || targetUser.id === SAVED_MESSAGES_ID) {
      setActiveChatId(SAVED_MESSAGES_ID);
      return;
    }
    const existing = chats.find(c => c.type === 'private' && c.participants.some(p => p && p.id === targetUser.id));
    if (existing) {
      setActiveChatId(existing.id);
    } else {
      const newChat: Chat = {
        id: targetUser.id === AI_BOT.id ? AI_BOT.id : `c_${Date.now()}`,
        type: targetUser.id === AI_BOT.id ? 'bot' : 'private',
        participants: [currentUser, targetUser],
        messages: [],
        unreadCount: 0,
        pinnedMessages: []
      };
      updateChats([newChat, ...chats]);
      setActiveChatId(newChat.id);
    }
  };

  const handleMessageAction = async (action: any, payload: any) => {
    if (!currentUser || !activeChatId) return;

    let updatedChats = chats.map(chat => {
      if (chat.id !== activeChatId) return chat;
      const newChat = { ...chat };
      if (action === 'send') {
        const msg: Message = {
          id: `m_${Date.now()}`,
          senderId: currentUser.id,
          text: payload.text,
          imageUrl: payload.imageUrl,
          replyToId: payload.replyToId,
          timestamp: Date.now(),
          isRead: false
        };
        newChat.messages = [...newChat.messages, msg];
        newChat.lastMessage = msg;
        newChat.unreadCount = 0;
      } else if (action === 'delete') {
        newChat.messages = newChat.messages.filter(m => m.id !== payload.id);
      } else if (action === 'react') {
        newChat.messages = newChat.messages.map(m => {
          if (m.id !== payload.id) return m;
          const reactions = m.reactions || [];
          const idx = reactions.findIndex(r => r.emoji === payload.emoji);
          if (idx > -1) {
             const r = reactions[idx];
             if (r.users.includes(currentUser.id)) {
               r.users = r.users.filter(u => u !== currentUser.id);
               r.count--;
             } else {
               r.users.push(currentUser.id);
               r.count++;
             }
             if (r.count <= 0) reactions.splice(idx, 1);
          } else {
            reactions.push({ emoji: payload.emoji, count: 1, users: [currentUser.id] });
          }
          return { ...m, reactions: [...reactions] };
        });
      } else if (action === 'updateSettings') {
        return { ...newChat, ...payload };
      } else if (action === 'addParticipant') {
        const alreadyIn = newChat.participants.some(p => p.id === payload.id);
        if (!alreadyIn) {
          newChat.participants = [...newChat.participants, payload];
          newChat.messages = [...newChat.messages, {
            id: `sys_${Date.now()}`,
            senderId: 'system',
            text: `${payload.displayName} به گفتگو پیوست.`,
            timestamp: Date.now()
          }];
        }
      }
      return newChat;
    });

    if (activeChatId === SAVED_MESSAGES_ID && !chats.find(c => c.id === SAVED_MESSAGES_ID)) {
      const savedChat: Chat = {
        id: SAVED_MESSAGES_ID,
        type: 'saved',
        participants: [currentUser],
        messages: action === 'send' ? [{
          id: `m_${Date.now()}`,
          senderId: currentUser.id,
          text: payload.text,
          timestamp: Date.now()
        }] : [],
        unreadCount: 0,
        pinnedMessages: []
      };
      updatedChats = [savedChat, ...chats];
    }

    updateChats(updatedChats);

    if (action === 'send' && activeChatId === AI_BOT.id) {
      setIsTyping(true);
      const history = (updatedChats.find(c => c.id === AI_BOT.id)?.messages || []).slice(-10).map(m => ({
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
        const saved = JSON.parse(localStorage.getItem(`chats_${currentUser.id}`) || '[]');
        updateChats(saved);
      }
    }
  };

  const getActiveChat = () => {
    if (!activeChatId || !currentUser) return null;
    if (activeChatId === SAVED_MESSAGES_ID) {
      const chat = chats.find(c => c.id === SAVED_MESSAGES_ID);
      if (chat) return chat;
      return { 
        id: SAVED_MESSAGES_ID, 
        type: 'saved', 
        participants: [currentUser], 
        messages: [], 
        pinnedMessages: [], 
        unreadCount: 0 
      } as Chat;
    }
    const found = chats.find(c => c.id === activeChatId);
    if (found) return found;
    if (activeChatId === AI_BOT.id) {
      return { 
        id: AI_BOT.id, 
        type: 'bot', 
        participants: [currentUser, AI_BOT], 
        messages: [], 
        pinnedMessages: [], 
        unreadCount: 0 
      } as Chat;
    }
    return null;
  };

  const createGroupOrChannel = (type: 'group' | 'channel', name: string, description: string) => {
    if (!currentUser) return;
    const newChat: Chat = {
      id: `${type === 'group' ? 'g' : 'ch'}_${Date.now()}`,
      type: type,
      groupName: name,
      description: description,
      groupAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
      participants: [currentUser],
      adminId: currentUser.id,
      admins: { [currentUser.id]: {
        canChangeInfo: true,
        canDeleteMessages: true,
        canBanUsers: true,
        canInviteUsers: true,
        canPinMessages: true,
        canAddAdmins: true
      }},
      messages: [{ id: `m_${Date.now()}`, senderId: 'system', text: `${type === 'group' ? 'گروه' : 'کانال'} "${name}" ایجاد شد.`, timestamp: Date.now() }],
      unreadCount: 0,
      pinnedMessages: [],
      permissions: {
        canSendMessages: true,
        canSendMedia: true,
        canAddUsers: true,
        canPinMessages: true,
        canChangeInfo: true
      },
      isReadOnlyForMembers: type === 'channel' ? true : false
    };
    updateChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
  };

  if (!currentUser) return <Login onLogin={handleAuth} />;

  return (
    <div className="flex h-screen w-full bg-[#0e1621] text-white overflow-hidden" dir="rtl">
      <Sidebar 
        chats={chats} 
        activeChatId={activeChatId} 
        setActiveChatId={setActiveChatId} 
        currentUser={currentUser}
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
        onOpenSettings={() => setShowSettings(true)}
        onLogout={() => { 
          localStorage.removeItem('starly_session');
          setCurrentUser(null);
        }}
        onStartChat={startChat}
        onCreateGroup={(name, desc) => createGroupOrChannel('group', name, desc)}
        onCreateChannel={(name, desc) => createGroupOrChannel('channel', name, desc)}
      />
      
      <ChatArea 
        chat={getActiveChat()} 
        currentUser={currentUser} 
        isTyping={isTyping}
        onAction={handleMessageAction}
        onMentionClick={(username) => {
          const usersObj = JSON.parse(localStorage.getItem('starly_users') || '{}');
          const cleanUsername = username.replace('@','').toLowerCase();
          const u = Object.values(usersObj).find((user: any) => user && user.username.toLowerCase() === cleanUsername) as User;
          if (u) startChat(u);
        }}
        onDeleteChat={() => updateChats(chats.filter(c => c.id !== activeChatId))}
      />

      {showSettings && (
        <SettingsModal 
          user={currentUser} 
          onClose={() => setShowSettings(false)} 
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            const users = JSON.parse(localStorage.getItem('starly_users') || '{}');
            users[updated.username] = updated;
            localStorage.setItem('starly_users', JSON.stringify(users));
            localStorage.setItem('starly_session', JSON.stringify(updated));
          }}
        />
      )}
    </div>
  );
};

export default App;
