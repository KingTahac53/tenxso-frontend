import { Component, OnInit } from "@angular/core";
import { FeedService } from "../services/feed.service";
import { SharedService } from "../services/shared.service";
import { ChatService } from "../services/chat.service";
import { ServiceBusService } from "../services/service-bus.service"; // NEW: Import the Service Bus polling service
import { Feed } from "../models/feed.model";

@Component({
  selector: "messagespage",
  templateUrl: "./messages.component.html",
  styleUrls: ["./messages.component.css"],
})
export class MessagesComponent implements OnInit {
  feeds: Feed[] = [];
  pageNumber: number = 1;
  loading: boolean = false;
  userId: any;
  username: any;
  chatData: any[] = [];
  public receivedMessages: any[] = [];
  public chatList: any[] = [];
  message: string = "";
  fromuser: string = "";
  touser: string = "";

  backup_userId: any;
  backup_username: any;
  backup_profilepic: any;

  chat_with_userId: any;
  chat_with_username: any;
  chat_with_profilepic: any;
  chatId: string | null = null;

  callState: "idle" | "calling" | "inCall" = "idle";
  sidebarVisible: boolean = true;

  constructor(
    private feedService: FeedService,
    private sharedService: SharedService,
    private chatService: ChatService,
    private serviceBusService: ServiceBusService // NEW: Inject the Service Bus service
  ) {}

  ngOnInit() {
    // Get userId and username from shared service (or cookie)
    this.sharedService.getUserId().subscribe((userId) => {
      this.userId = userId;
    });
    this.sharedService.getUserId().subscribe((username) => {
      this.username = username;
    });

    let uId = this.sharedService.getCookie("userId");
    if (uId) {
      this.userId = uId;
      this.checkNewChat();
      this.getChats(uId);
    }

    // NEW: Start polling Service Bus for messages
    // Poll every 10 seconds (adjust as needed)
    this.serviceBusService.startPolling(10000).subscribe((message) => {
      if (message) {
        console.log("Message from Service Bus:", message);
        // Parse the returned XML message.
        // This example uses DOMParser and assumes the message XML contains <chatId>, <senderId>, <content>, <timestamp>
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(message, "application/xml");

        const chatIdNode = xmlDoc.getElementsByTagName("chatId")[0];
        const senderIdNode = xmlDoc.getElementsByTagName("senderId")[0];
        const contentNode = xmlDoc.getElementsByTagName("content")[0];
        const timestampNode = xmlDoc.getElementsByTagName("timestamp")[0];

        if (chatIdNode && senderIdNode && contentNode) {
          const msgObj = {
            chatId: chatIdNode.textContent,
            senderId: senderIdNode.textContent,
            content: contentNode.textContent,
            timestamp: timestampNode ? timestampNode.textContent : Date.now(),
          };

          // If the message belongs to the currently open chat, update the chat window.
          if (this.chatId && msgObj.chatId === this.chatId) {
            const obj = {
              message: msgObj.content,
              type: msgObj.senderId === this.userId ? "reply" : "sender",
              msgtime: new Date(
                msgObj.timestamp || Date.now()
              ).toLocaleTimeString(),
            };
            this.receivedMessages.push(obj);
          } else {
            // Otherwise, update the chat list: mark the corresponding chat as having a new message.
            const index = this.chatList.findIndex(
              (item) => item.chatId === msgObj.chatId
            );
            if (index > -1) {
              this.chatList[index].newMessage = true;
            }
          }
        } else {
          console.warn("Invalid message format received from Service Bus.");
        }
      }
    });
  }

  // Send a text message using the send-message API.
  // Pass chatId as null if it's a new chat.
  sendMessage(): void {
    if (!this.userId || !this.chat_with_userId || !this.message.trim()) {
      return;
    }

    this.chatService
      .sendMessage(
        this.chatId,
        this.userId,
        this.chat_with_userId,
        this.message
      )
      .subscribe({
        next: (response: any) => {
          // If chatId was null and backend returns a new chatId, update it.
          if (!this.chatId && response.chatId) {
            this.chatId = response.chatId;
            // Refresh chat users list so that the new chat appears in the left pane.
            this.getChats(this.userId);
          }
          const obj = {
            message: this.message,
            type: "reply",
            msgtime: new Date().toLocaleTimeString(),
          };
          this.receivedMessages.push(obj);
          // Optionally, you could also trigger a service bus send if your backend requires it.
          this.message = "";
        },
        error: (error) => {
          console.error("Error sending message", error);
        },
      });
  }

  // Load messages for the selected chat using the chat-history API.
  loadChatHistory(chatId: string) {
    this.chatService.getChatHistory(chatId).subscribe(
      (history: any[]) => {
        this.receivedMessages = history.map((msg) => ({
          message: msg.content,
          type: msg.senderId === this.userId ? "reply" : "sender",
          msgtime: new Date(msg.timestamp).toLocaleTimeString(),
        }));
        this.chatId = chatId;
      },
      (error) => {
        console.error("Error loading chat history:", error);
      }
    );
  }

  // Subscribe to default chat user info if needed.
  // Ensure this doesn't override the recipient set via the sidebar.
  checkNewChat() {
    this.sharedService
      .getchat_UserId()
      .subscribe(
        (chat_with_userId) => (this.chat_with_userId = chat_with_userId)
      );
    this.sharedService
      .getchat_Username()
      .subscribe(
        (chat_with_username) => (this.chat_with_username = chat_with_username)
      );
    this.sharedService
      .getchat_ProfilePic()
      .subscribe(
        (chat_with_profilepic) =>
          (this.chat_with_profilepic = chat_with_profilepic)
      );

    this.backup_userId = this.chat_with_userId;
    this.backup_username = this.chat_with_username;
    this.backup_profilepic = this.chat_with_profilepic;
  }

  // Retrieve chat users list using the updated API (which returns chatId too).
  getChats(uid: any) {
    if (this.loading) return;
    this.loading = true;
    this.chatService.getChatUsers(uid).subscribe(
      (response: any[]) => {
        this.chatList = response;
        this.loading = false;

        // Auto-select the first chat ONLY if no recipient is already set (e.g. coming from feed page).
        if (
          !this.chat_with_userId &&
          this.chatList &&
          this.chatList.length > 0
        ) {
          let chatUser = this.chatList[0];
          this.chat_with_userId = chatUser.userId;
          this.chat_with_username = chatUser.username;
          this.chat_with_profilepic = chatUser.profilePicUrl;
          this.chatId = chatUser.chatId || null;
          if (this.chatId) {
            this.loadChatHistory(this.chatId);
          }
        }
      },
      (error) => {
        this.loading = false;
        console.error("Error loading chat users:", error);
      }
    );
  }

  // Called when a user is clicked in the sidebar.
  // Updates recipient details, clears any new-message flag, and loads chat history if chatId exists.
  selectChatUser(user: any): void {
    console.log("User clicked:", user);
    this.chat_with_userId = user.userId;
    this.chat_with_username = user.username;
    this.chat_with_profilepic = user.profilePicUrl;
    if (user.chatId) {
      user.newMessage = false; // Clear new message flag.
      this.chatId = user.chatId;
      this.loadChatHistory(this.chatId!);
    } else {
      this.chatId = null;
      this.receivedMessages = [];
    }
  }

  // Toggle sidebar visibility (useful for mobile).
  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  // Initiate an audio call (dummy implementation).
  startAudioCall(): void {
    console.log("Starting audio call with user:", this.chat_with_userId);
    this.callState = "calling";
  }

  // Initiate a video call (dummy implementation).
  startVideoCall(): void {
    console.log("Starting video call with user:", this.chat_with_userId);
    this.callState = "calling";
  }
}
