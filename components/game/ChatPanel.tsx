"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as api from "@/lib/api";
import type { ChatMessage, LandKey } from "@/lib/api";
import type {
  ChatMessageEvent,
  LandChatMessageEvent,
  GlobalChatMessageEvent,
} from "@/lib/useWebSocket";

interface ChatPanelProps {
  playerId?: string;
  playerName?: string;
  zoneId?: string;
  zoneName?: string;
  landKey?: LandKey;
  worldName?: string;
  // WebSocket integration
  isConnected?: boolean;
  onSendChat?: (message: string) => void;
  onSendLandChat?: (message: string) => void;
  onSendGlobalChat?: (message: string) => void;
  onSubscribeLand?: (landKey: LandKey) => void;
  onUnsubscribeLand?: (landKey: LandKey) => void;
  onSubscribeGlobal?: () => void;
  onUnsubscribeGlobal?: () => void;
  // Real-time events
  lastZoneMessage?: ChatMessageEvent | null;
  lastLandMessage?: LandChatMessageEvent | null;
  lastGlobalMessage?: GlobalChatMessageEvent | null;
}

type ChatTab = "zone" | "land" | "global";

const LAND_NAMES: Record<LandKey, string> = {
  fantasy: "Fantasy",
  scifi: "Sci-Fi",
  contemporary: "Contemporary",
  historical: "Historical",
  horror: "Horror",
  adults_only: "Adults Only",
};

export function ChatPanel({
  playerId,
  playerName,
  zoneId,
  zoneName,
  landKey,
  worldName,
  isConnected = false,
  onSendChat,
  onSendLandChat,
  onSendGlobalChat,
  onSubscribeLand,
  onUnsubscribeLand,
  onSubscribeGlobal,
  onUnsubscribeGlobal,
  lastZoneMessage,
  lastLandMessage,
  lastGlobalMessage,
}: ChatPanelProps) {
  const [activeTab, setActiveTab] = useState<ChatTab>("zone");
  const [zoneMessages, setZoneMessages] = useState<ChatMessage[]>([]);
  const [landMessages, setLandMessages] = useState<ChatMessage[]>([]);
  const [globalMessages, setGlobalMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);

  // Subscription state
  const [landSubscribed, setLandSubscribed] = useState(false);
  const [globalSubscribed, setGlobalSubscribed] = useState(false);

  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get messages for current tab
  const messages = activeTab === "zone" ? zoneMessages : activeTab === "land" ? landMessages : globalMessages;

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Handle incoming zone messages
  useEffect(() => {
    if (lastZoneMessage && activeTab === "zone") {
      const newMsg: ChatMessage = {
        id: `ws-${Date.now()}-${Math.random()}`,
        sender_id: lastZoneMessage.sender_id,
        sender_name: lastZoneMessage.sender_name,
        message: lastZoneMessage.message,
        timestamp: lastZoneMessage.timestamp,
      };
      setZoneMessages((prev) => [...prev.slice(-99), newMsg]);
      setTimeout(scrollToBottom, 50);
    }
  }, [lastZoneMessage, activeTab, scrollToBottom]);

  // Handle incoming land messages
  useEffect(() => {
    if (lastLandMessage && activeTab === "land") {
      const newMsg: ChatMessage = {
        id: `ws-${Date.now()}-${Math.random()}`,
        sender_id: lastLandMessage.sender_id,
        sender_name: lastLandMessage.sender_name,
        sender_realm: lastLandMessage.sender_realm,
        message: lastLandMessage.message,
        timestamp: lastLandMessage.timestamp,
      };
      setLandMessages((prev) => [...prev.slice(-99), newMsg]);
      setTimeout(scrollToBottom, 50);
    }
  }, [lastLandMessage, activeTab, scrollToBottom]);

  // Handle incoming global messages
  useEffect(() => {
    if (lastGlobalMessage && activeTab === "global") {
      const newMsg: ChatMessage = {
        id: `ws-${Date.now()}-${Math.random()}`,
        sender_id: lastGlobalMessage.sender_id,
        sender_name: lastGlobalMessage.sender_name,
        sender_realm: lastGlobalMessage.sender_realm,
        sender_land: lastGlobalMessage.sender_land,
        message: lastGlobalMessage.message,
        timestamp: lastGlobalMessage.timestamp,
      };
      setGlobalMessages((prev) => [...prev.slice(-99), newMsg]);
      setTimeout(scrollToBottom, 50);
    }
  }, [lastGlobalMessage, activeTab, scrollToBottom]);

  // Load initial messages for current tab
  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      switch (activeTab) {
        case "zone":
          if (!zoneId) {
            setZoneMessages([]);
            break;
          }
          const zoneResult = await api.getZoneChat(zoneId);
          setZoneMessages(zoneResult.messages.reverse());
          break;
        case "land":
          if (!landKey) {
            setLandMessages([]);
            break;
          }
          const landResult = await api.getLandChat(landKey);
          setLandMessages(landResult.messages.reverse());
          break;
        case "global":
          const globalResult = await api.getGlobalChat();
          setGlobalMessages(globalResult.messages.reverse());
          break;
      }
      setTimeout(scrollToBottom, 100);
    } catch {
      setError("Failed to load chat");
    } finally {
      setLoading(false);
    }
  }, [activeTab, zoneId, landKey, scrollToBottom]);

  // Load messages on tab change
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto-subscribe to land chat when switching to land tab
  useEffect(() => {
    if (activeTab === "land" && landKey && !landSubscribed && onSubscribeLand) {
      onSubscribeLand(landKey);
      setLandSubscribed(true);
    }
  }, [activeTab, landKey, landSubscribed, onSubscribeLand]);

  // Auto-subscribe to global chat when switching to global tab
  useEffect(() => {
    if (activeTab === "global" && !globalSubscribed && onSubscribeGlobal) {
      onSubscribeGlobal();
      setGlobalSubscribed(true);
    }
  }, [activeTab, globalSubscribed, onSubscribeGlobal]);

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Send message
  const handleSend = async () => {
    if (!messageInput.trim() || sending || !playerId) return;

    const msg = messageInput.trim();
    setSending(true);
    setMessageInput("");

    // Optimistic update
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender_id: playerId,
      sender_name: playerName || "You",
      message: msg,
      timestamp: new Date().toISOString(),
      sender_realm: worldName,
      sender_land: landKey,
    };

    // Add to appropriate list
    switch (activeTab) {
      case "zone":
        setZoneMessages((prev) => [...prev, optimisticMessage]);
        if (onSendChat) {
          onSendChat(msg);
        }
        break;
      case "land":
        setLandMessages((prev) => [...prev, optimisticMessage]);
        if (onSendLandChat) {
          onSendLandChat(msg);
        }
        break;
      case "global":
        setGlobalMessages((prev) => [...prev, optimisticMessage]);
        if (onSendGlobalChat) {
          onSendGlobalChat(msg);
        }
        break;
    }

    setTimeout(scrollToBottom, 50);
    setSending(false);
  };

  const getTabLabel = (tab: ChatTab) => {
    switch (tab) {
      case "zone":
        return zoneName || "Zone";
      case "land":
        return landKey ? LAND_NAMES[landKey] : "Land";
      case "global":
        return "Global";
    }
  };

  const getTabScope = (tab: ChatTab) => {
    switch (tab) {
      case "zone":
        return "Local area";
      case "land":
        return "All " + (landKey ? LAND_NAMES[landKey] : "Land") + " realms";
      case "global":
        return "Everyone online";
    }
  };

  if (!playerId) {
    return (
      <div className="flex flex-col h-full bg-[var(--shadow)] border-l border-[var(--slate)]">
        <div className="p-4 text-[var(--mist)] text-xs text-center">
          Sign in to use chat
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--shadow)] border-l border-[var(--slate)]">
      {/* Tab Header */}
      <div className="flex border-b border-[var(--slate)] shrink-0">
        {(["zone", "land", "global"] as ChatTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-2 py-2 text-xs font-medium transition-colors relative ${
              activeTab === tab
                ? "text-[var(--amber)] bg-[var(--stone)]"
                : "text-[var(--mist)] hover:text-[var(--fog)]"
            }`}
          >
            {getTabLabel(tab)}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[var(--amber)]" />
            )}
          </button>
        ))}
      </div>

      {/* Scope indicator + connection status */}
      <div className="px-3 py-1.5 text-[10px] bg-[var(--stone)] border-b border-[var(--slate)] shrink-0 flex items-center justify-between">
        <span className="text-[var(--mist)]">{getTabScope(activeTab)}</span>
        <span className={`flex items-center gap-1 ${isConnected ? "text-green-500" : "text-[var(--mist)]"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500 online-pulse" : "bg-[var(--slate)]"}`} />
          {isConnected ? "Live" : "Polling"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
        {loading && messages.length === 0 ? (
          <div className="text-[var(--mist)] text-xs animate-pulse p-2">
            Loading...
          </div>
        ) : error ? (
          <div className="text-[var(--crimson)] text-xs p-2">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-[var(--mist)] text-xs p-2 text-center">
            No messages yet.
            <br />
            <span className="text-[var(--fog)]">Be the first to say something!</span>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isMe = msg.sender_id === playerId;
              return (
                <div key={msg.id} className="text-xs group">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] text-[var(--mist)]">
                      {formatTime(msg.timestamp)}
                    </span>
                    <span
                      className={`font-medium ${
                        isMe ? "text-[var(--amber)]" : "text-[var(--arcane)]"
                      }`}
                    >
                      {msg.sender_name}
                    </span>
                    {/* Show realm/land for land/global chat */}
                    {activeTab !== "zone" && msg.sender_realm && (
                      <span className="text-[10px] text-[var(--mist)]">
                        [{msg.sender_realm}]
                      </span>
                    )}
                  </div>
                  <div className="pl-12 text-[var(--text)] break-words">
                    {msg.message}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-2 border-t border-[var(--slate)] shrink-0">
        <div className="flex gap-1">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={`Chat in ${getTabLabel(activeTab)}...`}
            maxLength={500}
            disabled={sending}
            className="flex-1 px-2 py-1.5 text-xs bg-[var(--void)] border border-[var(--slate)] rounded text-[var(--text)] placeholder-[var(--mist)] focus:border-[var(--amber-dim)] focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!messageInput.trim() || sending}
            className="px-3 py-1 text-xs bg-[var(--stone)] border border-[var(--slate)] rounded text-[var(--mist)] hover:text-[var(--amber)] hover:border-[var(--amber-dim)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
        <div className="mt-1 text-[10px] text-[var(--mist)] text-right">
          {messageInput.length}/500
        </div>
      </div>

      {/* Online count footer */}
      <OnlineCounter />
    </div>
  );
}

// Separate component for online count to avoid re-rendering chat
function OnlineCounter() {
  const [stats, setStats] = useState<{ websocket_connections: number; total_players: number } | null>(null);

  useEffect(() => {
    const loadStats = () => {
      api.getOnlineStats()
        .then(setStats)
        .catch(() => setStats(null));
    };

    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div className="px-3 py-2 border-t border-[var(--slate)] bg-[var(--stone)] shrink-0">
      <div className="flex items-center gap-1.5 text-[10px] text-[var(--mist)]">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 online-pulse" />
        <span>{stats.websocket_connections} online now</span>
      </div>
    </div>
  );
}
