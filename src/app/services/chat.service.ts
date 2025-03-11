import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../environment";

@Injectable({
  providedIn: "root",
})
export class ChatService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Send message API.
  sendMessage(
    chatId: string | null,
    senderId: string,
    recipientId: string,
    content: string
  ): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/Messages/send-message`, {
      chatId,
      senderId,
      recipientId,
      content,
    });
  }

  // Get chat users API.
  getChatUsers(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/Messages/chat-users/${userId}`);
  }

  // Get chat history API.
  getChatHistory(chatId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/Messages/chat-history/${chatId}`);
  }

  // NEW: Get new messages API (returns up to 10 new messages).
  getNewMessages(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Messages/get-new-messages`);
  }
}
