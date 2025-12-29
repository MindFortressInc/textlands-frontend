"use client";

import { useState, useEffect, useCallback } from "react";
import * as api from "@/lib/api";
import type {
  Friend,
  FriendRequest,
  Conversation,
  DirectMessage,
} from "@/lib/api";
import type {
  FriendOnlineEvent,
  FriendOfflineEvent,
  FriendRequestReceivedEvent,
  DMReceivedEvent,
} from "@/lib/useWebSocket";

interface SocialPanelProps {
  playerId?: string;
  onSelectConversation?: (friendId: string, friendName: string) => void;
  // WebSocket events
  lastFriendOnline?: FriendOnlineEvent | null;
  lastFriendOffline?: FriendOfflineEvent | null;
  lastFriendRequest?: FriendRequestReceivedEvent | null;
  lastDMReceived?: DMReceivedEvent | null;
  // WebSocket DM sending
  onSendDM?: (targetPlayerId: string, content: string) => void;
}

type Tab = "friends" | "requests" | "messages";

export function SocialPanel({
  playerId,
  onSelectConversation,
  lastFriendOnline,
  lastFriendOffline,
  lastFriendRequest,
  lastDMReceived,
  onSendDM,
}: SocialPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // DM view state
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    playerId: string;
    name: string;
  } | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadSocialData = useCallback(async () => {
    if (!playerId) return;

    setLoading(true);
    setError(null);

    try {
      const [friendsRes, requestsRes, convosRes, unreadRes] = await Promise.all([
        api.getFriends().catch(() => ({ friends: [], count: 0 })),
        api.getIncomingRequests().catch(() => ({ requests: [], count: 0 })),
        api.getConversations().catch(() => ({ conversations: [], count: 0 })),
        api.getUnreadCount().catch(() => ({ unread_count: 0 })),
      ]);

      setFriends(friendsRes.friends);
      setRequests(requestsRes.requests);
      setConversations(convosRes.conversations);
      setUnreadCount(unreadRes.unread_count);
    } catch {
      setError("Failed to load social data");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    loadSocialData();
    // Poll for updates every 30 seconds (reduced when WebSocket is active)
    const interval = setInterval(loadSocialData, 30000);
    return () => clearInterval(interval);
  }, [loadSocialData]);

  // Handle friend coming online
  useEffect(() => {
    if (lastFriendOnline) {
      setFriends((prev) =>
        prev.map((f) =>
          f.friend_id === lastFriendOnline.friend_player_id
            ? { ...f, is_online: true }
            : f
        )
      );
    }
  }, [lastFriendOnline]);

  // Handle friend going offline
  useEffect(() => {
    if (lastFriendOffline) {
      setFriends((prev) =>
        prev.map((f) =>
          f.friend_id === lastFriendOffline.friend_player_id
            ? { ...f, is_online: false, last_seen_at: new Date().toISOString() }
            : f
        )
      );
    }
  }, [lastFriendOffline]);

  // Handle new friend request
  useEffect(() => {
    if (lastFriendRequest) {
      const newRequest: FriendRequest = {
        request_id: lastFriendRequest.request_id,
        player_id: lastFriendRequest.from_player_id,
        player_name: lastFriendRequest.from_player_name,
        requested_at: lastFriendRequest.timestamp,
      };
      setRequests((prev) => {
        // Don't add if already exists
        if (prev.some((r) => r.request_id === newRequest.request_id)) {
          return prev;
        }
        return [newRequest, ...prev];
      });
    }
  }, [lastFriendRequest]);

  // Handle new DM received
  useEffect(() => {
    if (lastDMReceived) {
      // Increment unread count
      setUnreadCount((prev) => prev + 1);

      // If viewing this conversation, add message
      if (selectedConversation?.id === lastDMReceived.conversation_id) {
        const newMsg: DirectMessage = {
          id: lastDMReceived.message_id,
          sender_id: lastDMReceived.sender_id,
          sender_name: lastDMReceived.sender_name,
          content: lastDMReceived.content,
          created_at: lastDMReceived.timestamp,
        };
        setMessages((prev) => [...prev, newMsg]);
      }

      // Update conversation preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === lastDMReceived.conversation_id
            ? {
                ...c,
                last_message_preview: lastDMReceived.content,
                last_message_at: lastDMReceived.timestamp,
                unread_count: c.unread_count + 1,
              }
            : c
        )
      );
    }
  }, [lastDMReceived, selectedConversation?.id]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.acceptFriendRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
      loadSocialData();
    } catch {
      // Silently fail - could add toast notification
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await api.declineFriendRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
    } catch {
      // Silently fail
    }
  };

  const openConversation = async (friend: Friend) => {
    // Find existing conversation or create new
    const existingConvo = conversations.find(
      (c) => c.other_player_id === friend.friend_id
    );

    setSelectedConversation({
      id: existingConvo?.id || "",
      playerId: friend.friend_id,
      name: friend.name,
    });

    if (existingConvo?.id) {
      setLoadingMessages(true);
      try {
        const res = await api.getMessages(existingConvo.id);
        setMessages(res.messages.reverse());
        await api.markConversationRead(existingConvo.id);
        loadSocialData(); // Refresh unread count
      } catch {
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    } else {
      setMessages([]);
    }

    onSelectConversation?.(friend.friend_id, friend.name);
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || sendingMessage) return;

    const content = messageInput.trim();
    setSendingMessage(true);

    // Optimistically add message
    const optimisticMsg: DirectMessage = {
      id: `temp-${Date.now()}`,
      sender_id: playerId || "",
      sender_name: "You",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setMessageInput("");

    try {
      // Use WebSocket if available, otherwise REST
      if (onSendDM) {
        onSendDM(selectedConversation.playerId, content);
      } else {
        const res = await api.sendDirectMessage(selectedConversation.playerId, content);
        if (res.conversation_id && !selectedConversation.id) {
          setSelectedConversation((prev) =>
            prev ? { ...prev, id: res.conversation_id! } : null
          );
        }
      }
    } catch {
      // Could show error - remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const onlineFriends = friends.filter((f) => f.is_online);
  const offlineFriends = friends.filter((f) => !f.is_online);

  if (!playerId) {
    return (
      <div className="w-56 bg-[var(--shadow)] border-l border-[var(--slate)] p-4">
        <div className="text-[var(--mist)] text-xs">
          Sign in to use social features
        </div>
      </div>
    );
  }

  // DM conversation view
  if (selectedConversation) {
    return (
      <div className="w-56 bg-[var(--shadow)] border-l border-[var(--slate)] flex flex-col text-sm h-full">
        {/* Header */}
        <div className="p-3 border-b border-[var(--slate)] flex items-center gap-2">
          <button
            onClick={() => setSelectedConversation(null)}
            className="text-[var(--mist)] hover:text-[var(--text)] transition-colors"
            title="Back"
          >
            &lt;
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[var(--amber)] font-medium truncate">
              {selectedConversation.name}
            </div>
            <div className="text-[10px] text-[var(--mist)]">Direct Message</div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
          {loadingMessages ? (
            <div className="text-[var(--mist)] text-xs animate-pulse p-2">
              Loading...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-[var(--mist)] text-xs p-2 text-center">
              No messages yet.
              <br />
              <span className="text-[var(--fog)]">Start the conversation!</span>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === playerId;
              return (
                <div
                  key={msg.id}
                  className={`text-xs ${isMe ? "text-right" : ""}`}
                >
                  <div
                    className={`inline-block max-w-[90%] px-2 py-1.5 rounded ${
                      isMe
                        ? "bg-[var(--amber-dim)] text-[var(--text)]"
                        : "bg-[var(--stone)] text-[var(--fog)]"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className="text-[10px] text-[var(--mist)] mt-0.5">
                    {formatTimeAgo(msg.created_at)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <div className="p-2 border-t border-[var(--slate)]">
          <div className="flex gap-1">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type message..."
              maxLength={2000}
              disabled={sendingMessage}
              className="flex-1 px-2 py-1.5 text-xs bg-[var(--void)] border border-[var(--slate)] rounded text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!messageInput.trim() || sendingMessage}
              className="px-2 py-1 text-xs bg-[var(--stone)] border border-[var(--slate)] rounded text-[var(--mist)] hover:text-[var(--amber)] hover:border-[var(--amber-dim)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sendingMessage ? "..." : ">"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-56 bg-[var(--shadow)] border-l border-[var(--slate)] flex flex-col text-sm">
      {/* Tab Header */}
      <div className="flex border-b border-[var(--slate)]">
        <TabButton
          active={activeTab === "friends"}
          onClick={() => setActiveTab("friends")}
          badge={onlineFriends.length}
        >
          Online
        </TabButton>
        <TabButton
          active={activeTab === "requests"}
          onClick={() => setActiveTab("requests")}
          badge={requests.length}
          badgeColor="crimson"
        >
          Requests
        </TabButton>
        <TabButton
          active={activeTab === "messages"}
          onClick={() => setActiveTab("messages")}
          badge={unreadCount}
          badgeColor="arcane"
        >
          DMs
        </TabButton>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="p-3 text-[var(--mist)] text-xs animate-pulse">
            Loading...
          </div>
        ) : error ? (
          <div className="p-3 text-[var(--crimson)] text-xs">{error}</div>
        ) : (
          <>
            {activeTab === "friends" && (
              <FriendsTab
                online={onlineFriends}
                offline={offlineFriends}
                onSelect={openConversation}
                formatTimeAgo={formatTimeAgo}
              />
            )}
            {activeTab === "requests" && (
              <RequestsTab
                requests={requests}
                onAccept={handleAcceptRequest}
                onDecline={handleDeclineRequest}
                formatTimeAgo={formatTimeAgo}
              />
            )}
            {activeTab === "messages" && (
              <MessagesTab
                conversations={conversations}
                friends={friends}
                onSelect={(convo) => {
                  const friend = friends.find(
                    (f) => f.friend_id === convo.other_player_id
                  );
                  if (friend) openConversation(friend);
                }}
                formatTimeAgo={formatTimeAgo}
              />
            )}
          </>
        )}
      </div>

      {/* Footer - Online count */}
      <div className="px-3 py-2 border-t border-[var(--slate)] bg-[var(--stone)]">
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--mist)]">
          <span className="online-indicator" />
          <span>
            {onlineFriends.length} online / {friends.length} friends
          </span>
        </div>
      </div>
    </div>
  );
}

// Tab button component
function TabButton({
  active,
  onClick,
  children,
  badge,
  badgeColor = "amber",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
  badgeColor?: "amber" | "crimson" | "arcane";
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-2 py-2 text-xs font-medium transition-colors relative ${
        active
          ? "text-[var(--amber)] bg-[var(--stone)]"
          : "text-[var(--mist)] hover:text-[var(--fog)]"
      }`}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span
          className={`absolute top-1 right-1 min-w-[14px] h-[14px] px-1 text-[9px] font-bold rounded-full flex items-center justify-center ${
            badgeColor === "crimson"
              ? "bg-[var(--crimson)] text-white"
              : badgeColor === "arcane"
              ? "bg-[var(--arcane)] text-[var(--void)]"
              : "bg-[var(--amber)] text-[var(--void)]"
          }`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {active && (
        <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[var(--amber)]" />
      )}
    </button>
  );
}

// Friends tab content
function FriendsTab({
  online,
  offline,
  onSelect,
  formatTimeAgo,
}: {
  online: Friend[];
  offline: Friend[];
  onSelect: (friend: Friend) => void;
  formatTimeAgo: (date: string) => string;
}) {
  if (online.length === 0 && offline.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-[var(--mist)] text-xs mb-2">No friends yet</div>
        <div className="text-[10px] text-[var(--mist)]">
          Meet players in-game to add them!
        </div>
      </div>
    );
  }

  return (
    <div className="stagger-fade-in">
      {/* Online friends */}
      {online.length > 0 && (
        <div>
          <div className="px-3 py-1.5 text-[10px] text-[var(--mist)] uppercase tracking-wider bg-[var(--stone)]">
            Online — {online.length}
          </div>
          {online.map((friend) => (
            <FriendRow
              key={friend.friend_id}
              friend={friend}
              onClick={() => onSelect(friend)}
            />
          ))}
        </div>
      )}

      {/* Offline friends */}
      {offline.length > 0 && (
        <div>
          <div className="px-3 py-1.5 text-[10px] text-[var(--mist)] uppercase tracking-wider bg-[var(--stone)]">
            Offline — {offline.length}
          </div>
          {offline.map((friend) => (
            <FriendRow
              key={friend.friend_id}
              friend={friend}
              onClick={() => onSelect(friend)}
              formatTimeAgo={formatTimeAgo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Individual friend row
function FriendRow({
  friend,
  onClick,
  formatTimeAgo,
}: {
  friend: Friend;
  onClick: () => void;
  formatTimeAgo?: (date: string) => string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-[var(--stone)] transition-colors text-left group"
    >
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          friend.is_online
            ? "bg-green-500 online-pulse"
            : "bg-[var(--slate)]"
        }`}
      />
      <div className="flex-1 min-w-0">
        <div
          className={`text-xs truncate ${
            friend.is_online ? "text-[var(--text)]" : "text-[var(--mist)]"
          } group-hover:text-[var(--amber)]`}
        >
          {friend.name}
        </div>
        {friend.level && (
          <div className="text-[10px] text-[var(--mist)]">
            Lv.{friend.level}
          </div>
        )}
        {!friend.is_online && friend.last_seen_at && formatTimeAgo && (
          <div className="text-[10px] text-[var(--mist)]">
            {formatTimeAgo(friend.last_seen_at)} ago
          </div>
        )}
      </div>
      <span className="text-[var(--mist)] text-xs opacity-0 group-hover:opacity-100 transition-opacity">
        &gt;
      </span>
    </button>
  );
}

// Requests tab content
function RequestsTab({
  requests,
  onAccept,
  onDecline,
  formatTimeAgo,
}: {
  requests: FriendRequest[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  formatTimeAgo: (date: string) => string;
}) {
  if (requests.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-[var(--mist)] text-xs">No pending requests</div>
      </div>
    );
  }

  return (
    <div className="stagger-fade-in">
      {requests.map((req) => (
        <div
          key={req.request_id}
          className="px-3 py-2 border-b border-[var(--slate)] last:border-0"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--text)] truncate">
              {req.player_name}
            </span>
            <span className="text-[10px] text-[var(--mist)]">
              {formatTimeAgo(req.requested_at)}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onAccept(req.request_id)}
              className="flex-1 px-2 py-1 text-[10px] bg-[var(--amber-dim)] text-[var(--text)] rounded hover:bg-[var(--amber)] transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => onDecline(req.request_id)}
              className="flex-1 px-2 py-1 text-[10px] bg-[var(--stone)] text-[var(--mist)] border border-[var(--slate)] rounded hover:border-[var(--crimson)] hover:text-[var(--crimson)] transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Messages tab content
function MessagesTab({
  conversations,
  friends,
  onSelect,
  formatTimeAgo,
}: {
  conversations: Conversation[];
  friends: Friend[];
  onSelect: (convo: Conversation) => void;
  formatTimeAgo: (date: string) => string;
}) {
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-[var(--mist)] text-xs mb-2">No messages</div>
        <div className="text-[10px] text-[var(--mist)]">
          Click a friend to start a conversation
        </div>
      </div>
    );
  }

  return (
    <div className="stagger-fade-in">
      {conversations.map((convo) => {
        const friend = friends.find(
          (f) => f.friend_id === convo.other_player_id
        );
        const isOnline = friend?.is_online || convo.is_online;

        return (
          <button
            key={convo.id}
            onClick={() => onSelect(convo)}
            className="w-full px-3 py-2 flex items-start gap-2 hover:bg-[var(--stone)] transition-colors text-left border-b border-[var(--slate)] last:border-0"
          >
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${
                isOnline ? "bg-green-500 online-pulse" : "bg-[var(--slate)]"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-xs truncate ${
                    convo.unread_count > 0
                      ? "text-[var(--text)] font-medium"
                      : "text-[var(--fog)]"
                  }`}
                >
                  {convo.other_player_name}
                </span>
                <span className="text-[10px] text-[var(--mist)] flex-shrink-0">
                  {formatTimeAgo(convo.last_message_at)}
                </span>
              </div>
              {convo.last_message_preview && (
                <div
                  className={`text-[10px] truncate mt-0.5 ${
                    convo.unread_count > 0
                      ? "text-[var(--fog)]"
                      : "text-[var(--mist)]"
                  }`}
                >
                  {convo.last_message_preview}
                </div>
              )}
            </div>
            {convo.unread_count > 0 && (
              <span className="min-w-[16px] h-[16px] px-1 text-[9px] font-bold bg-[var(--arcane)] text-[var(--void)] rounded-full flex items-center justify-center flex-shrink-0">
                {convo.unread_count > 9 ? "9+" : convo.unread_count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
