
export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isAi?: boolean;
  replyToId?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  reactions?: Reaction[];
  imageUrl?: string;
  isRead?: boolean;
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
  twoFactorSecret?: string;
  privacy?: {
    showStatus: 'all' | 'contacts' | 'none';
    showAvatar: 'all' | 'contacts' | 'none';
    showBio: 'all' | 'contacts' | 'none';
  };
}

export interface Chat {
  id: string;
  type: 'private' | 'group' | 'channel' | 'saved' | 'bot';
  participants: User[];
  messages: Message[];
  lastMessage?: Message;
  pinnedMessages: string[];
  isPinned?: boolean;
  unreadCount: number;
  groupName?: string;
  groupAvatar?: string;
  description?: string;
  adminId?: string; // Owner
  admins?: Record<string, AdminPermissions>; // Map of UserID to Permissions
  permissions?: Permissions;
  inviteLink?: string;
  slowMode?: number;
  isReadOnlyForMembers?: boolean;
}

export type FolderType = 'all' | 'private' | 'groups' | 'channels' | 'saved';
