// chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  // Base URL for your messages API endpoints
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // 1. Create new chat (when first message is sent)
  createNewChat(senderId: string, recipientId: string, content: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/Messages/new-chat`, { senderId, recipientId, content });
  }

  // 2. Send message in an existing chat
  sendMessage(chatId: string, senderId: string, recipientId: string, content: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/Messages/send-message`, { chatId, senderId, recipientId, content });
  }

  // 3. Get list of existing chat users for the logged in user
  getChatUsers(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/Messages/chat-users/${userId}`);
  }

  // 4. Get chat history by ChatId
  getChatHistory(chatId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/Messages/chat-history/${chatId}`);
  }
}