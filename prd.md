# Product Requirements Document (PRD) - Slack Clone

## 1. Product Vision
To build a **lightweight, high-performance Slack clone** for a single workspace that replicates the core "Slack experience" including real-time messaging, threads, emoji reactions, file sharing, and high-quality video/audio huddles with screen sharing. The focus is on **speed**, **real-time responsiveness**, and **clean UI**.

## 2. Target Audience
*   **Small Teams/Communities**: Looking for a free/self-hosted alternative to Slack.
*   **Developers**: Wanting to understand how to build complex real-time applications.

## 3. Core Features (MVP Scope)

### 3.1 Authentication & User Management
*   **Sign Up / Login**: Email & Password (via Supabase Auth).
*   **User Profile**: Display Name, Avatar, Online Status (Online, Away, DND).
*   **Single Workspace**: All users belong to the same "Community" workspace.

### 3.2 Real-time Messaging
*   **Channels**: Public and Private channels (e.g., `#general`, `#random`).
*   **Direct Messages (DMs)**: 1:1 and Multi-person Group DMs.
*   **Threads**: Reply to specific messages to keep context (Sidebar view).
*   **Reactions**: Emoji picker to react to messages (👍, ❤️, etc.).
*   **Rich Text**: formatting (Bold, Italic, Code Blocks, Lists).
*   **File Sharing**: Drag & drop images/PDFs (Supabase Storage).
*   **Editing/Deleting**: Users can edit or delete their own messages.

### 3.3 Video & Audio Huddles (Powered by LiveKit)
*   **Channel Huddles**: One-click to join a voice/video room associated with a channel.
*   **Screen Sharing**: Share entire screen or specific window.
*   **Active Speaker Grid**: Auto-switching layout based on who is talking.
*   **Mute/Video Toggle**: Standard controls.

### 3.4 Search & discovery
*   **Search**: Full-text search across message history.
*   **Channel Browser**: View and join available public channels.

---

## 4. Technical Architecture

### 4.1 Tech Stack
*   **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Shadcn UI.
*   **Backend & Database**: Supabase (PostgreSQL, Realtime, Auth, Storage).
*   **Real-time Media**: **LiveKit** (WebRTC SFU for scalable Video/Audio).
*   **State Management**: React Query (Server State), Zustand (Client UI State).

### 4.2 Database Schema (Supabase PostgreSQL)
*   `users`: Stores profile info and status.
*   `channels`: Stores channel metadata (`name`, `type`, `is_private`).
*   `messages`: Stores content, `channel_id`, `user_id`, `parent_id` (for threads).
*   `reactions`: Stores `message_id`, `user_id`, `emoji`.
*   `members`: Junction table for Channel Memberships (`user_id`, `channel_id`, `role`).
*   `attachments`: (Optional) Metadata for uploaded files if not stored directly in `messages`.

---

## 5. Implementation Plan

### Phase 1: Foundation & Auth
*   [ ] Initialize Next.js project with Tailwind & Shadcn UI.
*   [ ] Setup Supabase project (Auth, DB, Storage).
*   [ ] Implement specific "Slack-like" Layout (Sidebar + Main Content Area).
*   [ ] Build Auth Screens (Login/Register).

### Phase 2: Core Messaging (The "Chat" Engine)
*   [ ] Create & List Channels (Public/Private).
*   [ ] Implement Real-time Message Subscription (using Supabase Realtime).
*   [ ] Build Message Input (optimistic updates for speed).
*   [ ] Presence System: Show who is online in the Sidebar.

### Phase 3: Video & Audio (The "Zoom" Engine)
*   [ ] Configure LiveKit Project.
*   [ ] Add "Start Huddle" toggle in Channel Header.
*   [ ] Build the "Active Call" UI (Grid of video tiles).
*   [ ] Implement Screen Sharing capability.

### Phase 4: Advanced Interactions
*   [ ] **Threads**: Implement the "Reply in Thread" sidebar view.
*   [ ] **Reactions**: Add Emoji Picker and render aggregate reactions.
*   [ ] **Direct Messages**: UI for starting 1:1 conversations.
*   [ ] **File Uploads**: Drag & drop integration with Supabase Storage.

### Phase 5: Polish & Refinement
*   [ ] **Rich Text**: Integrate a lightweight editor (e.g., TipTap or simple Slate).
*   [ ] **Search**: Implement search bar with SQL `ILIKE` filter.
*   [ ] **Responsive Design**: Ensure mobile-friendly/PWA readiness.
*   [ ] **UX Polish**: Loading skeletons, smooth transitions, error states.

---

## 6. Success Metrics
*   **Latency**: Messages appear in < 100ms.
*   **Video Quality**: Stable 720p video with < 300ms latency (via LiveKit).
*   **Usability**: A new user can join a channel and send a message in < 30 seconds.
