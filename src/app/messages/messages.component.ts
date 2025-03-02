import { Component, OnInit } from "@angular/core";
import { FeedService } from "../services/feed.service"; // if still needed for other feed functions
import { SharedService } from "../services/shared.service";
import { SignalRService } from "../services/signal-r.service";
import { ChatService } from "../services/chat.service";
import { Feed } from "../models/feed.model";
// (Optional) Uncomment if you wish to use Angular Signals for reactive state
// import { signal } from '@angular/core';

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

  // New property to track call state (could also use Angular Signals)
  callState: "idle" | "calling" | "inCall" = "idle";
  // New property to toggle sidebar visibility (especially for mobile)
  sidebarVisible: boolean = true;

  constructor(
    private feedService: FeedService,
    private sharedService: SharedService,
    private signalRService: SignalRService,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    // Get userId and username from sharedService
    this.sharedService.getUserId().subscribe((userId) => {
      this.userId = userId;
    });
    this.sharedService.getUserId().subscribe((username) => {
      this.username = username;
    });

    // Retrieve userId from cookie if available
    let uId = this.sharedService.getCookie("userId");
    if (uId) {
      this.userId = uId;
      this.checkNewChat();
      this.getChats(uId);
    }

    // Listen for incoming messages via SignalR
    this.signalRService.currentMessage.subscribe((msg) => {
      console.log("Received message:", msg);
      if (msg) {
        let obj = {
          message: msg,
          type: "sender",
          msgtime: new Date().toLocaleTimeString(),
        };
        this.receivedMessages.push(obj);
      }
    });

    // (Example) Subscribe to call events (if implemented in your SignalR service)
    // this.signalRService.currentCall.subscribe(callInfo => {
    // console.log("Incoming call:", callInfo);
    // Here you could update the call state or open a call modal, etc.
    // });
  }

  // Send a text message and clear the input field afterward
  // Send a text message and clear the input field afterward
  sendMessage(): void {
    if (!this.chatId) {
      // New chat: call the new-chat API
      this.chatService
        .createNewChat(this.userId, this.chat_with_userId, this.message)
        .subscribe(
          (response) => {
            // Assume response returns a ChatId
            this.chatId = response.chatId;
            // Push the message into the local array
            const obj = {
              message: this.message,
              type: "reply",
              msgtime: new Date().toLocaleTimeString(),
            };
            this.receivedMessages.push(obj);
            // Optionally, send via SignalR for real-time update
            this.signalRService.sendMessage(
              this.userId,
              this.chat_with_userId,
              this.message
            );
            this.message = "";
          },
          (error) => {
            console.error("Error creating new chat", error);
          }
        );
    } else {
      // Existing chat: call the send-message API
      this.chatService
        .sendMessage(
          this.chatId,
          this.userId,
          this.chat_with_userId,
          this.message
        )
        .subscribe(
          (response) => {
            // On success, update the chat window
            const obj = {
              message: this.message,
              type: "reply",
              msgtime: new Date().toLocaleTimeString(),
            };
            this.receivedMessages.push(obj);
            // Also notify via SignalR if needed
            this.signalRService.sendMessage(
              this.userId,
              this.chat_with_userId,
              this.message
            );
            this.message = "";
          },
          (error) => {
            console.error("Error sending message", error);
          }
        );
    }
  }

  // Load messages for the selected chat using the new API
  loadChatHistory(chatId: string) {
    this.chatService.getChatHistory(chatId).subscribe(
      (history: any[]) => {
        // Map the API response to your message format.
        this.receivedMessages = history.map((msg) => ({
          message: msg.content,
          type: msg.senderId === this.userId ? "reply" : "sender",
          msgtime: new Date(msg.timestamp).toLocaleTimeString(),
        }));
        // Update current chatId
        this.chatId = chatId;
      },
      (error) => {
        console.error("Error loading chat history:", error);
      }
    );
  }
  // Subscribe to new chat information from shared service
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

  // Retrieve chat users list using the new API
  getChats(uid: any) {
    if (this.loading) return;
    this.loading = true;
    this.chatService.getChatUsers(uid).subscribe(
      (response: any[]) => {
        // response should be an array of chat user objects
        this.chatList = response;
        this.loading = false;

        // Optionally load the first chat in the list
        if (this.chatList && this.chatList.length > 0) {
          let chatUser = this.chatList[0];
          this.chat_with_userId = chatUser.userId;
          // If your API returns a chatId with the chat user, set it; else, null indicates a new chat.
          this.chatId = chatUser.chatId || null;
          // Load chat history if a chatId exists
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

  // Add this method to handle the click event on a user in the chat list.
  selectChatUser(user: any): void {
    console.log("User clicked:", user); // Debug log
    // Use the correct property names from the API response:
    this.chat_with_userId = user.userId;
    this.chat_with_username = user.username;
    this.chat_with_profilepic = user.profilePicUrl; // Correct property from API

    // If the API provided a chatId, load the chat history; otherwise, clear the chat window.
    if (user.chatId) {
      this.chatId = "ejkRfs"; // user.chatId
      this.loadChatHistory(this.chatId);
    } else {
      this.chatId = null;
      this.receivedMessages = [];
      // Optionally, you can show a placeholder message in the chat window here.
      // this.receivedMessages.push({
      //   message: "No previous messages. Start the conversation!",
      //   type: "placeholder",
      //   msgtime: ""
      // });
    }
  }

  // Toggle sidebar visibility (useful on mobile)
  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  // Initiate an audio call by updating call state and invoking SignalR call request
  startAudioCall(): void {
    console.log("Starting audio call with user:", this.chat_with_userId);
    this.callState = "calling";
    // this.signalRService.sendCallRequest(this.userId, this.chat_with_userId, 'audio');
    // Optionally, open a modal or update the UI to reflect the call status.
  }

  // Initiate a video call by updating call state and invoking SignalR call request
  startVideoCall(): void {
    console.log("Starting video call with user:", this.chat_with_userId);
    this.callState = "calling";
    // this.signalRService.sendCallRequest(this.userId, this.chat_with_userId, 'video');
    // For video calls, you might display a video element overlay.
  }
}
