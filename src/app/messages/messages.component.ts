import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from "@angular/core";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { FeedService } from "../services/feed.service";
import { SharedService } from "../services/shared.service";
import { SignalRService } from "../services/signal-r.service";
import { ChatService } from "../services/chat.service";
import { Feed } from "../models/feed.model";
import { interval, Subscription } from "rxjs";
import { exhaustMap } from "rxjs/operators";

@Component({
  selector: "messagespage",
  templateUrl: "./messages.component.html",
  styleUrls: ["./messages.component.css"],
})
export class MessagesComponent implements OnInit, OnDestroy, AfterViewChecked {
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

  private newMessagesSub!: Subscription;
  private chatUsersSub!: Subscription;

  // Reference to the chat body container.
  @ViewChild("chatBody") chatBody!: ElementRef;

  constructor(
    private feedService: FeedService,
    private sharedService: SharedService,
    private signalRService: SignalRService,
    private chatService: ChatService,
    private router: Router,
    private dialog: MatDialog
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

    // Poll the new messages endpoint every 10 seconds.
    this.newMessagesSub = interval(2500)
      .pipe(exhaustMap(() => this.chatService.getNewMessages()))
      .subscribe((messages: any[]) => {
        if (messages && messages.length > 0) {
          messages.forEach((msg) => {
            const incomingChatId = msg.chatId ? msg.chatId.trim() : "";
            const currentChatId = this.chatId ? this.chatId.trim() : "";
            if (currentChatId && incomingChatId === currentChatId) {
              const obj = {
                message: msg.content,
                type: msg.senderId === this.userId ? "reply" : "sender",
                msgtime: new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              };
              this.receivedMessages.push(obj);
              // Force scroll if the user is near the bottom.
              this.scrollToBottom(true);
            } else {
              const index = this.chatList.findIndex((item) => {
                return item.chatId && item.chatId.trim() === incomingChatId;
              });
              if (index > -1) {
                this.chatList[index].newMessage = true;
              } else {
                this.getChats(this.userId);
              }
            }
          });
        }
      });

    // Poll the chat users API every 5 seconds to update the chat list order.
    this.chatUsersSub = interval(5000)
      .pipe(exhaustMap(() => this.chatService.getChatUsers(this.userId)))
      .subscribe((response: any[]) => {
        this.chatList = response;
      });
  }

  ngAfterViewChecked(): void {
    // Scroll to bottom only if the user is near the bottom.
    this.scrollToBottom();
  }

  // Auto-scroll only if the user is near the bottom (within 100px) or if forced.
  private scrollToBottom(force: boolean = false): void {
    try {
      if (this.chatBody && this.chatBody.nativeElement) {
        const element = this.chatBody.nativeElement;
        if (
          force ||
          element.scrollHeight - element.scrollTop - element.clientHeight < 100
        ) {
          element.scrollTop = element.scrollHeight;
        }
      }
    } catch (err) {
      console.error("Error scrolling chat to bottom:", err);
    }
  }

  ngOnDestroy(): void {
    if (this.newMessagesSub) this.newMessagesSub.unsubscribe();
    if (this.chatUsersSub) this.chatUsersSub.unsubscribe();
  }

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
          if (!this.chatId && response.chatId) {
            this.chatId = response.chatId;
            this.getChats(this.userId);
          }
          const obj = {
            message: this.message,
            type: "reply",
            msgtime: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
          this.receivedMessages.push(obj);
          this.message = "";
          // Force scroll after sending a message.
          setTimeout(() => this.scrollToBottom(true), 0);
        },
        error: (error) => {
          console.error("Error sending message", error);
        },
      });
  }

  loadChatHistory(chatId: string) {
    this.chatService.getChatHistory(chatId).subscribe(
      (history: any[]) => {
        this.receivedMessages = history.map((msg) => ({
          message: msg.content,
          type: msg.senderId === this.userId ? "reply" : "sender",
          msgtime: new Date(msg.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        this.chatId = chatId;
        // Force scroll after loading history.
        setTimeout(() => this.scrollToBottom(true), 0);
      },
      (error) => {
        console.error("Error loading chat history:", error);
      }
    );
  }

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
  }

  getChats(uid: any) {
    if (this.loading) return;
    this.loading = true;
    this.chatService.getChatUsers(uid).subscribe(
      (response: any[]) => {
        this.chatList = response;
        this.loading = false;
        // Auto-select the first chat if no recipient is already set.
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

  selectChatUser(user: any): void {
    console.log("User clicked:", user);
    this.chat_with_userId = user.userId;
    this.chat_with_username = user.username;
    this.chat_with_profilepic = user.profilePicUrl;
    if (user.chatId) {
      user.newMessage = false;
      this.chatId = user.chatId;
      this.loadChatHistory(this.chatId!);
    } else {
      this.chatId = null;
      this.receivedMessages = [];
    }
  }

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  startAudioCall(): void {
    console.log("Starting audio call with user:", this.chat_with_userId);
    this.callState = "calling";
  }

  startVideoCall(): void {
    console.log("Starting video call with user:", this.chat_with_userId);
    this.callState = "calling";
  }
}
