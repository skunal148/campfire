export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  status: string | null;
  is_global_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  is_dm: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface Conversation {
  channel_id: string;
  other_user_id: string;
  display_name: string;
  avatar_url: string | null;
  status: string | null;
  last_message_at: string;
}

export interface UnreadCount {
  channel_id: string;
  unread_count: number;
}

export interface ChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: string;
}

export interface ChannelMemberWithProfile extends ChannelMember {
  profiles: Profile;
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
}

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface MessageWithAuthor extends Message {
  profiles: Profile;
}

export interface ReactionGroup {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface TypingUser {
  userId: string;
  displayName: string;
}

export interface PinnedMessage {
  id: string;
  channel_id: string;
  message_id: string;
  pinned_by: string | null;
  created_at: string;
}

export interface PinnedMessageWithDetails extends PinnedMessage {
  messages: MessageWithAuthor;
}

export interface HuddleSession {
  id: string;
  channel_id: string;
  started_by: string | null;
  started_at: string;
  ended_at: string | null;
  livekit_room_name: string;
}

export interface HuddleParticipant {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  joinedAt: string;
}

export interface SearchResult {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  channel_name: string;
  display_name: string;
  avatar_url: string | null;
}
