"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { LandKey } from "./api";

// ============ MESSAGE TYPES ============

// Outgoing messages (client → server)
export type OutgoingMessage =
  | { type: "chat"; message: string }
  | { type: "emote"; emote: string }
  | { type: "zone_change"; zone_id: string }
  | { type: "land_chat"; message: string }
  | { type: "global_chat"; message: string }
  | { type: "subscribe_land_chat"; land_key: LandKey }
  | { type: "unsubscribe_land_chat"; land_key: LandKey }
  | { type: "subscribe_global_chat" }
  | { type: "unsubscribe_global_chat" }
  | { type: "get_chat_subscriptions" }
  | { type: "dm_send"; target_player_id: string; content: string }
  | { type: "dm_typing_start"; conversation_id: string }
  | { type: "dm_typing_stop"; conversation_id: string }
  | { type: "dm_mark_read"; conversation_id: string }
  | { type: "ping" };

// Incoming messages (server → client)
export interface ChatMessageEvent {
  type: "chat_message";
  sender_id: string;
  sender_name: string;
  message: string;
  timestamp: string;
}

export interface LandChatMessageEvent {
  type: "land_chat_message";
  sender_id: string;
  sender_name: string;
  sender_realm: string;
  message: string;
  timestamp: string;
}

export interface GlobalChatMessageEvent {
  type: "global_chat_message";
  sender_id: string;
  sender_name: string;
  sender_realm: string;
  sender_land: string;
  message: string;
  timestamp: string;
}

export interface PlayerEnteredEvent {
  type: "player_entered";
  player_id: string;
  player_name: string;
}

export interface PlayerLeftEvent {
  type: "player_left";
  player_id: string;
  player_name?: string;
}

export interface EmoteEvent {
  type: "emote";
  sender_id: string;
  sender_name: string;
  emote: string;
  timestamp: string;
}

export interface FriendRequestReceivedEvent {
  type: "friend_request_received";
  from_player_id: string;
  from_player_name: string;
  request_id: string;
  timestamp: string;
}

export interface FriendRequestAcceptedEvent {
  type: "friend_request_accepted";
  friend_player_id: string;
  friend_player_name: string;
  timestamp: string;
}

export interface FriendOnlineEvent {
  type: "friend_online";
  friend_player_id: string;
  friend_player_name: string;
  timestamp: string;
}

export interface FriendOfflineEvent {
  type: "friend_offline";
  friend_player_id: string;
  friend_player_name: string;
  timestamp: string;
}

export interface DMReceivedEvent {
  type: "dm_received";
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: string;
}

export interface DMTypingEvent {
  type: "dm_typing";
  conversation_id: string;
  sender_id: string;
  sender_name: string;
}

export interface DMReadReceiptEvent {
  type: "dm_read_receipt";
  conversation_id: string;
  reader_id: string;
}

export interface ChatSubscriptionsEvent {
  type: "chat_subscriptions";
  subscriptions: string[];
  current_land?: string;
}

export interface PongEvent {
  type: "pong";
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

export type IncomingMessage =
  | ChatMessageEvent
  | LandChatMessageEvent
  | GlobalChatMessageEvent
  | PlayerEnteredEvent
  | PlayerLeftEvent
  | EmoteEvent
  | FriendRequestReceivedEvent
  | FriendRequestAcceptedEvent
  | FriendOnlineEvent
  | FriendOfflineEvent
  | DMReceivedEvent
  | DMTypingEvent
  | DMReadReceiptEvent
  | ChatSubscriptionsEvent
  | PongEvent
  | ErrorEvent;

// ============ EVENT HANDLERS ============

export interface WebSocketEventHandlers {
  onChatMessage?: (event: ChatMessageEvent) => void;
  onLandChatMessage?: (event: LandChatMessageEvent) => void;
  onGlobalChatMessage?: (event: GlobalChatMessageEvent) => void;
  onPlayerEntered?: (event: PlayerEnteredEvent) => void;
  onPlayerLeft?: (event: PlayerLeftEvent) => void;
  onEmote?: (event: EmoteEvent) => void;
  onFriendRequestReceived?: (event: FriendRequestReceivedEvent) => void;
  onFriendRequestAccepted?: (event: FriendRequestAcceptedEvent) => void;
  onFriendOnline?: (event: FriendOnlineEvent) => void;
  onFriendOffline?: (event: FriendOfflineEvent) => void;
  onDMReceived?: (event: DMReceivedEvent) => void;
  onDMTyping?: (event: DMTypingEvent) => void;
  onDMReadReceipt?: (event: DMReadReceiptEvent) => void;
  onChatSubscriptions?: (event: ChatSubscriptionsEvent) => void;
  onError?: (event: ErrorEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

// ============ HOOK ============

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
const WS_BASE = API_BASE.replace(/^http/, "ws");

interface UseWebSocketOptions {
  playerId: string | null;
  handlers?: WebSocketEventHandlers;
  autoConnect?: boolean;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  send: (message: OutgoingMessage) => void;
  // Convenience methods
  sendChat: (message: string) => void;
  sendLandChat: (message: string) => void;
  sendGlobalChat: (message: string) => void;
  sendEmote: (emote: string) => void;
  sendDM: (targetPlayerId: string, content: string) => void;
  subscribeLandChat: (landKey: LandKey) => void;
  unsubscribeLandChat: (landKey: LandKey) => void;
  subscribeGlobalChat: () => void;
  unsubscribeGlobalChat: () => void;
  changeZone: (zoneId: string) => void;
}

export function useWebSocket({
  playerId,
  handlers = {},
  autoConnect = true,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const handlersRef = useRef(handlers);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;
  const baseReconnectDelay = 1000;

  // Keep handlers ref updated
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    clearTimers();
    if (wsRef.current) {
      wsRef.current.close(1000, "Client disconnect");
      wsRef.current = null;
    }
    setIsConnected(false);
  }, [clearTimers]);

  const connect = useCallback(() => {
    if (!playerId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = new WebSocket(`${WS_BASE}/realtime/ws/${playerId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.debug("[WebSocket] Connected");
      setIsConnected(true);
      reconnectAttempts.current = 0;
      handlersRef.current.onConnect?.();

      // Start ping interval (every 30s)
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);
    };

    ws.onclose = (event) => {
      console.debug("[WebSocket] Disconnected:", event.code, event.reason);
      setIsConnected(false);
      clearTimers();
      handlersRef.current.onDisconnect?.();

      // Auto-reconnect unless intentionally closed
      if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(
          baseReconnectDelay * Math.pow(2, reconnectAttempts.current),
          30000
        );
        console.debug(`[WebSocket] Reconnecting in ${delay}ms...`);
        reconnectAttempts.current++;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = (error) => {
      console.error("[WebSocket] Error:", error);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as IncomingMessage;
        const h = handlersRef.current;

        switch (data.type) {
          case "chat_message":
            h.onChatMessage?.(data);
            break;
          case "land_chat_message":
            h.onLandChatMessage?.(data);
            break;
          case "global_chat_message":
            h.onGlobalChatMessage?.(data);
            break;
          case "player_entered":
            h.onPlayerEntered?.(data);
            break;
          case "player_left":
            h.onPlayerLeft?.(data);
            break;
          case "emote":
            h.onEmote?.(data);
            break;
          case "friend_request_received":
            h.onFriendRequestReceived?.(data);
            break;
          case "friend_request_accepted":
            h.onFriendRequestAccepted?.(data);
            break;
          case "friend_online":
            h.onFriendOnline?.(data);
            break;
          case "friend_offline":
            h.onFriendOffline?.(data);
            break;
          case "dm_received":
            h.onDMReceived?.(data);
            break;
          case "dm_typing":
            h.onDMTyping?.(data);
            break;
          case "dm_read_receipt":
            h.onDMReadReceipt?.(data);
            break;
          case "chat_subscriptions":
            h.onChatSubscriptions?.(data);
            break;
          case "error":
            h.onError?.(data);
            break;
          case "pong":
            // Heartbeat response, no action needed
            break;
          default:
            console.log("[WebSocket] Unknown message type:", data);
        }
      } catch (err) {
        console.error("[WebSocket] Failed to parse message:", err);
      }
    };
  }, [playerId, clearTimers]);

  // Auto-connect when playerId is available
  useEffect(() => {
    if (autoConnect && playerId) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [playerId, autoConnect, connect, disconnect]);

  const send = useCallback((message: OutgoingMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("[WebSocket] Cannot send - not connected");
    }
  }, []);

  // Convenience methods
  const sendChat = useCallback((message: string) => {
    send({ type: "chat", message });
  }, [send]);

  const sendLandChat = useCallback((message: string) => {
    send({ type: "land_chat", message });
  }, [send]);

  const sendGlobalChat = useCallback((message: string) => {
    send({ type: "global_chat", message });
  }, [send]);

  const sendEmote = useCallback((emote: string) => {
    send({ type: "emote", emote });
  }, [send]);

  const sendDM = useCallback((targetPlayerId: string, content: string) => {
    send({ type: "dm_send", target_player_id: targetPlayerId, content });
  }, [send]);

  const subscribeLandChat = useCallback((landKey: LandKey) => {
    send({ type: "subscribe_land_chat", land_key: landKey });
  }, [send]);

  const unsubscribeLandChat = useCallback((landKey: LandKey) => {
    send({ type: "unsubscribe_land_chat", land_key: landKey });
  }, [send]);

  const subscribeGlobalChat = useCallback(() => {
    send({ type: "subscribe_global_chat" });
  }, [send]);

  const unsubscribeGlobalChat = useCallback(() => {
    send({ type: "unsubscribe_global_chat" });
  }, [send]);

  const changeZone = useCallback((zoneId: string) => {
    send({ type: "zone_change", zone_id: zoneId });
  }, [send]);

  return {
    isConnected,
    connect,
    disconnect,
    send,
    sendChat,
    sendLandChat,
    sendGlobalChat,
    sendEmote,
    sendDM,
    subscribeLandChat,
    unsubscribeLandChat,
    subscribeGlobalChat,
    unsubscribeGlobalChat,
    changeZone,
  };
}
