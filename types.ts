
export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // User IDs
}

export interface Poll {
  question: string;
  options: PollOption[];
  isMultipleChoice: boolean;
  totalVotes: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isAi?: boolean;
  replyToId?: string;
  isEdited?: boolean;
  reactions?: Reaction[];
  imageUrl?: string;
  audioUrl?: string;
  poll?: Poll;
  isRead?: boolean;
  forwardedFrom?: string;
}

export interface AdminPermissions {
  canChangeInfo: boolean;
  canDeleteMessages: boolean;
  canBanUsers: boolean;
  canInviteUsers: boolean;
  canPinMessages: boolean;
  canAddAdmins: boolean;
}

export interface Permissions {
  canSendMessages: boolean;
  canSendMedia: boolean;
  canAddUsers: boolean;
  canPinMessages: boolean;
  canChangeInfo: boolean;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  password?: string;
  avatar: string;
  status: 'online' | 'offline' | 'typing...';
  bio?: string;
  twoFactorEnabled?: boolean;
  passcode?: string;
  theme: 'day' | 'night' | 'oled' | 'arctic';
  wallpaper: string;
  privacy: {
    showStatus: 'all' | 'none';
    showAvatar: 'all' | 'none';
  };
}

export interface Chat {
  id: string;
  type: 'private' | 'group' | 'channel' | 'saved' | 'bot';
  participants: User[];
  messages: Message[];
  lastMessage?: Message;
  pinnedMessageIds: string[];
  isPinnedInSidebar?: boolean;
  unreadCount: number;
  groupName?: string;
  groupAvatar?: string;
  description?: string;
  adminId?: string;
  admins?: Record<string, AdminPermissions>;
  permissions?: Permissions;
  inviteLink?: string;
  slowMode?: number;
}

export type FolderType = 'all' | 'private' | 'groups' | 'channels' | 'saved';
