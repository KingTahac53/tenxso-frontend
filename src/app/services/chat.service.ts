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

  /**
   * Sends a message using the send-message API.
   * If chatId is null, the backend creates a new chat; if chatId is provided,
   * the message is added to the existing chat.
   */
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

  // Get list of existing chat users (now returns chatId as well)
  getChatUsers(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/Messages/chat-users/${userId}`);
  }

  // Get chat history by ChatId
  getChatHistory(chatId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/Messages/chat-history/${chatId}`);
  }
}
