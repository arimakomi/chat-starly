
export interface User {
  id: string;
  username: string;
  displayName: string;
  password?: string;
  avatar: string;
  status: 'online' | 'offline' | 'typing...';
  bio?: string;
  privacy?: {
    showStatus: 'all' | 'contacts' | 'none';
    showAvatar: 'all' | 'contacts' | 'none';
    showBio: 'all' | 'contacts' | 'none';
  };
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isAi?: boolean;
  replyTo?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
}

export interface Chat {
  id: string;
  type: 'private' | 'group' | 'channel' | 'bot' | 'saved';
  participants: User[];
  messages: Message[];
  lastMessage?: Message;
  pinnedMessages: string[];
  unreadCount: number;
  groupName?: string;
  groupAvatar?: string;
}

export type FolderType = 'all' | 'private' | 'groups' | 'bots' | 'channels' | 'saved';
