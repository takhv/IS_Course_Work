import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from './api';

export interface DraftRoomState {
  sessionId: number;
  matchId: number;
  status: string;
  teamA: TeamInfo;
  teamB: TeamInfo;
  currentTurn: string;
  currentPhase: string;
  phaseNumber: number;
  actions: DraftAction[];
  startedAt?: string;
  message?: string;
}

export interface TeamInfo {
  teamId: number;
  teamName: string;
  joined: boolean;
  captainLogin: string;
}

export interface DraftAction {
  side: string;
  actionType: string;
  championId: number;
  championName: string;
  orderNumber: number;
}

export class DraftWebSocketService {
  private client: Client | null = null;
  private matchId: number | null = null;
  private onStateUpdate: ((state: DraftRoomState) => void) | null = null;

  connect(
    matchId: number,
    playerLogin: string,
    onStateUpdate: (state: DraftRoomState) => void,
    onError?: (error: any) => void
  ): Promise<void> {
    this.matchId = matchId;
    this.onStateUpdate = onStateUpdate;

    return new Promise((resolve, reject) => {
      const socket = new SockJS(`${API_BASE_URL}/ws`);

      this.client = new Client({
        webSocketFactory: () => socket as any,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          this.client?.subscribe(`/topic/draft/${matchId}`, (message: IMessage) => {
            try {
              const state: DraftRoomState = JSON.parse(message.body);
              this.onStateUpdate?.(state);
            } catch (e) {
              console.error('[ws] Failed to parse message:', e, message.body);
            }
          });

          this.send('/app/draft/' + matchId + '/join', {
            matchId,
            playerLogin,
          });

          resolve();
        },
        onStompError: (frame: any) => {
          const errorMsg = frame.headers['message'] || 'Unknown STOMP error';
          console.error('[ws] STOMP error:', errorMsg);
          console.error('[ws] Details:', frame.body);
          onError?.(frame);
          reject(new Error(errorMsg));
        },
        onWebSocketError: (event: any) => {
          console.error('[ws] WebSocket error:', event);
          onError?.(event);
          reject(event);
        },
      });

      this.client.activate();
    });
  }

  performAction(playerLogin: string, championName: string, actionType: 'PICK' | 'BAN') {
    if (!this.matchId) {
      throw new Error('Not connected to a draft room');
    }

    this.send(`/app/draft/${this.matchId}/action`, {
      matchId: this.matchId,
      playerLogin,
      championName,
      actionType,
    });
  }

  private send(destination: string, body: any) {
    if (!this.client?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.matchId = null;
      this.onStateUpdate = null;
    }
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}
