
import React, { useState, useEffect } from 'react';
import { User, Message, Chat, FolderType } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import { gemini } from './services/geminiService';

const AI_BOT: User = {
  id: 'ai-assistant',
  username: 'gemini_ai',
  displayName: 'هوش مصنوعی استارلی',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=starli',
  status: 'online',
  bio: 'دستیار هوشمند شما در استارلی جت'
};

const SAVED_MESSAGES_ID = 'saved-messages';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeFolder, setActiveFolder] = useState<FolderType>('all');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (currentUser && e.key === `chats_${currentUser.id}`) {
        setChats(JSON.parse(e.newValue || '[]'));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser]);

  useEffect(() => {
    const savedSession = localStorage.getItem('gram_session');
    if (savedSession) {
      setCurrentUser(JSON.parse(savedSession));
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      const savedChats = localStorage.getItem(`chats_${currentUser.id}`);
      if (savedChats) {
        setChats(JSON.parse(savedChats));
      } else {
        const initialChats: Chat[] = [
          {
            id: SAVED_MESSAGES_ID,
            type: 'saved',
            participants: [currentUser],
            messages: [{ id: 'm1', senderId: 'system', text: 'خوش آمدید به استارلی جت! اینجا فضای امن شماست.', timestamp: Date.now() }],
            unreadCount: 0,
            pinnedMessages: []
          },
          {
            id: AI_BOT.id,
            type: 'bot',
            participants: [currentUser, AI_BOT],
            messages: [{ id: 'm2', senderId: AI_BOT.id, text: 'سلام! من هوش مصنوعی استارلی هستم. چه خدمتی از من ساخته است؟', timestamp: Date.now() }],
            unreadCount: 1,
            pinnedMessages: []
          }
        ];
        setChats(initialChats);
        setActiveChatId(AI_BOT.id);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && chats.length > 0) {
      localStorage.setItem(`chats_${currentUser.id}`, JSON.stringify(chats));
    }
  }, [chats, currentUser]);

  const handleAuth = (data: { username: string; password?: string; displayName?: string; isNew: boolean }) => {
    const users = JSON.parse(localStorage.getItem('gram_users') || '{}');
    let user: User;

    if (data.isNew) {
      user = {
        id: Math.random().toString(36).substr(2, 9),
        username: data.username.toLowerCase(),
        displayName: data.displayName || data.username,
        password: data.password,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
        status: 'online',
        privacy: { showStatus: 'all', showAvatar: 'all', showBio: 'all' }
      };
      users[user.username] = user;
      localStorage.setItem('gram_users', JSON.stringify(users));
    } else {
      user = users[data.username.toLowerCase()];
    }

    setCurrentUser(user);
    localStorage.setItem('gram_session', JSON.stringify(user));
  };

  const startChatWithUsername = (targetUsername: string) => {
    if (!currentUser) return;
    const cleanUsername = targetUsername.replace('@', '').toLowerCase();
    if (cleanUsername === currentUser.username) {
        setActiveChatId(SAVED_MESSAGES_ID);
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('gram_users') || '{}');
    const targetUser = users[cleanUsername];

    if (!targetUser) {
        alert("کاربری با این یوزرنیم پیدا نشد!");
        return;
    }

    const existingChat = chats.find(c => c.type === 'private' && c.participants.some(p => p.username === cleanUsername));
    if (existingChat) {
        setActiveChatId(existingChat.id);
    } else {
        const newChat: Chat = {
            id: `chat_${Math.random().toString(36).substr(2, 9)}`,
            type: 'private',
            participants: [currentUser, targetUser],
            messages: [],
            unreadCount: 0,
            pinnedMessages: []
        };
        setChats(prev => [newChat, ...prev]);
        setActiveChatId(newChat.id);
    }
  };

  const createGroup = (name: string, selectedUsernames: string[]) => {
    if (!currentUser) return;
    const users = JSON.parse(localStorage.getItem('gram_users') || '{}');
    const participants = [currentUser, ...selectedUsernames.map(u => users[u]).filter(Boolean)];
    
    const newGroup: Chat = {
        id: `group_${Math.random().toString(36).substr(2, 9)}`,
        type: 'group',
        groupName: name,
        groupAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
        participants,
        messages: [{ id: 'sys1', senderId: 'system', text: `گروه ${name} ایجاد شد.`, timestamp: Date.now() }],
        unreadCount: 0,
        pinnedMessages: []
    };
    setChats(prev => [newGroup, ...prev]);
    setActiveChatId(newGroup.id);
  };

  const sendMessage = async (text: string, replyTo?: string) => {
    if (!currentUser || !activeChatId) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUser.id,
      text,
      timestamp: Date.now(),
      replyTo
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return { 
          ...chat, 
          messages: [...chat.messages, newMessage], 
          lastMessage: newMessage,
          unreadCount: 0 
        };
      }
      return chat;
    }));

    if (activeChatId === AI_BOT.id) {
      setIsTyping(true);
      const activeChat = chats.find(c => c.id === AI_BOT.id);
      const history = (activeChat?.messages || []).slice(-15).map(m => ({
        role: m.senderId === currentUser.id ? 'user' as const : 'model' as const,
        text: m.text
      }));

      const aiMsgId = Math.random().toString(36).substr(2, 9);
      let fullText = "";

      setChats(prev => prev.map(chat => {
        if (chat.id === AI_BOT.id) {
          const aiPlaceholder: Message = { id: aiMsgId, senderId: AI_BOT.id, text: "", timestamp: Date.now(), isAi: true };
          return { ...chat, messages: [...chat.messages, aiPlaceholder] };
        }
        return chat;
      }));

      const stream = gemini.getChatResponseStream(text, history);
      for await (const chunk of stream) {
        fullText += chunk;
        setChats(prev => prev.map(chat => {
          if (chat.id === AI_BOT.id) {
            return {
              ...chat,
              messages: chat.messages.map(m => m.id === aiMsgId ? { ...m, text: fullText } : m)
            };
          }
          return chat;
        }));
      }
      setIsTyping(false);
    }
  };

  if (!currentUser) return <Login onLogin={handleAuth} />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0e1621] text-white font-sans selection:bg-[#3390ec]/30" dir="rtl">
      <Sidebar 
        chats={chats} 
        activeChatId={activeChatId} 
        setActiveChatId={setActiveChatId} 
        currentUser={currentUser}
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
        onOpenSettings={() => setShowSettings(true)}
        onLogout={() => { setCurrentUser(null); localStorage.removeItem('gram_session'); }}
        onCreateGroup={createGroup}
      />
      <div className="flex-1 flex flex-col min-w-0 bg-[#0e1621]">
        <ChatArea 
          chat={chats.find(c => c.id === activeChatId) || null} 
          currentUser={currentUser} 
          onSendMessage={sendMessage}
          isTyping={isTyping}
          onTogglePin={(id) => {
            setChats(prev => prev.map(c => c.id === activeChatId ? {...c, pinnedMessages: c.pinnedMessages.includes(id) ? c.pinnedMessages.filter(x => x!==id) : [...c.pinnedMessages, id]} : c))
          }}
          onDeleteMessage={(id) => {
            setChats(prev => prev.map(c => c.id === activeChatId ? {...c, messages: c.messages.filter(m => m.id !== id)} : c))
          }}
          onDeleteHistory={() => setChats(prev => prev.map(c => c.id === activeChatId ? {...c, messages: [], lastMessage: undefined} : c))}
          onMentionClick={startChatWithUsername}
        />
      </div>

      {showSettings && (
        <SettingsModal 
          user={currentUser} 
          onClose={() => setShowSettings(false)} 
          onLogout={() => { setCurrentUser(null); localStorage.removeItem('gram_session'); }}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            localStorage.setItem('gram_session', JSON.stringify(updated));
            const users = JSON.parse(localStorage.getItem('gram_users') || '{}');
            users[updated.username] = updated;
            localStorage.setItem('gram_users', JSON.stringify(users));
          }}
        />
      )}
    </div>
  );
};

export default App;
