import { Component, OnInit } from '@angular/core';
import { FeedService } from '../services/feed.service';
import { SharedService } from '../services/shared.service';
import { SignalRService } from '../services/signal-r.service';
import { Feed } from '../models/feed.model';
// (Optional) Uncomment if you wish to use Angular Signals for reactive state
// import { signal } from '@angular/core';

@Component({
  selector: 'messagespage',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
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

  // New property to track call state (could also use Angular Signals)
  callState: 'idle' | 'calling' | 'inCall' = 'idle';
  // New property to toggle sidebar visibility (especially for mobile)
  sidebarVisible: boolean = true;

  constructor(
    private feedService: FeedService, 
    private sharedService: SharedService,
    private signalRService: SignalRService
  ) {}

  ngOnInit() {
    // Get userId and username from sharedService
    this.sharedService.getUserId().subscribe(userId => {
      this.userId = userId;
    });
    this.sharedService.getUserId().subscribe(username => {
      this.username = username;
    });

    // Retrieve userId from cookie if available
    let uId = this.sharedService.getCookie('userId');
    if(uId) {
      this.userId = uId;
      this.checkNewChat();
      this.getChats(uId);
    }
    
    // Listen for incoming messages via SignalR
    this.signalRService.currentMessage.subscribe(msg => {
      console.log("Received message:", msg);
      if (msg) {
        let obj = {
          message: msg,
          type: "sender",
          msgtime: new Date().toLocaleTimeString()
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
  sendMessage(): void {
    let obj = {
      message: this.message,
      type: "reply",
      msgtime: new Date().toLocaleTimeString()
    };
    this.receivedMessages.push(obj);
    this.signalRService.sendMessage(this.userId, this.chat_with_userId, this.message);
    this.message = '';
  }

  // Subscribe to new chat information from shared service
  checkNewChat() {
    this.sharedService.getchat_UserId().subscribe(chat_with_userId => this.chat_with_userId = chat_with_userId);
    this.sharedService.getchat_Username().subscribe(chat_with_username => this.chat_with_username = chat_with_username);
    this.sharedService.getchat_ProfilePic().subscribe(chat_with_profilepic => this.chat_with_profilepic = chat_with_profilepic);
    
    this.backup_userId = this.chat_with_userId;
    this.backup_username = this.chat_with_username;
    this.backup_profilepic = this.chat_with_profilepic;
  }

  // Retrieve chat history and populate the chat list
  getChats(uid: any) {
    if (this.loading) return;
    this.loading = true;
    this.feedService.getChats(uid).subscribe(
      (response: any) => {
        this.chatData = response;
        for (let i = 0; i < this.chatData.length; i++) {
          let obj = {
            toUserName: this.chatData[i].toUserName,
            toUserId: this.chatData[i].toUserId,
            toUserProfilePic: this.chatData[i].toUserProfilePic,
            isActive: true  // Initially assume user is active; update later as needed
          };
          this.chatList.push(obj);
          // Automatically load the first chat in the list
          if(i === 0) {
            this.chat_with_profilepic = this.chatData[i].toUserProfilePic;
            this.chat_with_username = this.chatData[i].toUserName;
            this.chat_with_userId = this.chatData[i].toUserId;
            for (let k = 0; k < this.chatData[i].chatWindow.length; k++){
              let objMsg = {
                message: this.chatData[i].chatWindow[k].message,
                type: this.chatData[i].chatWindow[k].type,
                msgtime: this.chatData[i].chatWindow[k].msgtime,
              };
              this.receivedMessages.push(objMsg);
            }
          }
        } 
        this.loading = false;
        if(this.chatList.length === 0) {
          let obj = {
            toUserId: this.chat_with_userId,
            toUserName: this.chat_with_username,
            toUserProfilePic: this.chat_with_profilepic,
            isActive: true
          };
          this.chatList.push(obj);
        }
        const index = this.chatList.findIndex(role => role.toUserId === this.backup_userId);
        if(index === -1 && this.backup_userId != null) {
          let obj = {
            toUserId: this.backup_userId,
            toUserName: this.backup_username,
            toUserProfilePic: this.backup_profilepic,
            isActive: true
          };
          this.chatList.push(obj);
        }
      },
      error => {
        this.loading = false;
        console.error('Error loading chats:', error);
      }
    );
  }

  // Load messages for the selected user
  displayChats(toUserId: any) {
    this.chat_with_userId = toUserId;
    this.receivedMessages = [];
    for (let i = 0; i < this.chatData.length; i++) {
      if (toUserId === this.chatData[i].toUserId) {
        for (let k = 0; k < this.chatData[i].chatWindow.length; k++){
          let objMsg = {
            message: this.chatData[i].chatWindow[k].message,
            type: this.chatData[i].chatWindow[k].type,
            msgtime: this.chatData[i].chatWindow[k].msgtime,
          };
          this.receivedMessages.push(objMsg);
        }
      }
    }
  }

  // Toggle sidebar visibility (useful on mobile)
  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  // Initiate an audio call by updating call state and invoking SignalR call request
  startAudioCall(): void {
    console.log("Starting audio call with user:", this.chat_with_userId);
    this.callState = 'calling';
    // this.signalRService.sendCallRequest(this.userId, this.chat_with_userId, 'audio');
    // Optionally, open a modal or update the UI to reflect the call status.
  }

  // Initiate a video call by updating call state and invoking SignalR call request
  startVideoCall(): void {
    console.log("Starting video call with user:", this.chat_with_userId);
    this.callState = 'calling';
    // this.signalRService.sendCallRequest(this.userId, this.chat_with_userId, 'video');
    // For video calls, you might display a video element overlay.
  }
}
