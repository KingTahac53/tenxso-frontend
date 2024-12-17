import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FeedService } from '../services/feed.service';
import { SharedService } from '../services/shared.service';
import { SignalRService } from '../services/signal-r.service';
import { Feed } from '../models/feed.model';
import { LikesPopupComponent } from '../modals/likes-popup/likes-popup.component';
import { CommentsPopupComponent } from '../modals/comments-popup/comments-popup.component';


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
  username:any;
  chatData:any[]=[];
  public receivedMessages: any[]=[];
  public chatList: any[]=[];
  message: string = "";
  fromuser: string = "";
  touser: string = "";


  backup_userId:any;
  backup_username:any;
  backup_profilepic:any;

  chat_with_userId:any;
  chat_with_username:any;
  chat_with_profilepic:any;

  constructor(private feedService: FeedService, 
    private sharedService: SharedService,
    private signalRService: SignalRService) {}

  ngOnInit() {

    this.sharedService.getUserId().subscribe(userId => {
      this.userId = userId;
    });
    this.sharedService.getUserId().subscribe(username => {
      this.username = username;
    });

    var uId=this.sharedService.getCookie('userId');
    if(uId){
      this.userId=uId;
      this.checkNewChat();
      this.getChats(uId);
    }
    
   
    this.signalRService.currentMessage.subscribe(msg => {
      console.log(msg);
      if (msg) {
        var obj={
          message:msg,
          type:"sender",
          msgtime:""
        }
        this.receivedMessages.push(obj);
      }
    }); 
  }

  sendMessage(): void {
    var obj={
      message:this.message,
      type:"reply",
      msgtime:""
    }
    this.receivedMessages.push(obj);
    this.signalRService.sendMessage(this.userId,this.chat_with_userId, this.message);
      this.message = '';
  }

  checkNewChat(){

    this.sharedService.getchat_UserId().subscribe(
      chat_with_userId =>this.chat_with_userId = chat_with_userId);
    this.sharedService.getchat_Username().subscribe(
      chat_with_username => this.chat_with_username = chat_with_username);
    this.sharedService.getchat_ProfilePic().subscribe(
        chat_with_profilepic => this.chat_with_profilepic = chat_with_profilepic);
    
     this.backup_userId=this.chat_with_userId;
     this.backup_username=   this.chat_with_username;
     this.backup_profilepic =this.chat_with_profilepic;

  }

  getChats(uid:any) {
    if (this.loading) return;

    this.feedService.getChats(uid).subscribe(
      (response: any) => {

        this.chatData=response;
        for (let i = 0; i < this.chatData.length; i++) {

          var obj={
            toUserName:this.chatData[i].toUserName,
            toUserId:this.chatData[i].toUserId,
            toUserProfilePic:this.chatData[i].toUserProfilePic
          }
          this.chatList.push(obj);

          if(i==0){
            this.chat_with_profilepic=this.chatData[i].toUserProfilePic;
            this.chat_with_username=this.chatData[i].toUserName;
            this.chat_with_userId=this.chatData[i].toUserId;

            for (let k = 0; k < this.chatData[i].chatWindow.length; k++){
               
              var objMsg={
                message:this.chatData[i].chatWindow[k].message,
                type:this.chatData[i].chatWindow[k].type,
                msgtime:this.chatData[i].chatWindow[k].msgtime,
              }
              this.receivedMessages.push(objMsg);
            }
          }
        } 
       
        this.loading = false;

        if(this.chatList.length==0){
          var obj={
            toUserId:this.chat_with_userId,
            toUserName:this.chat_with_username,
            toUserProfilePic:this.chat_with_profilepic
          }
          this.chatList.push(obj);
        }
        
        const index = this.chatList.findIndex(role=> role.toUserId === this.backup_userId);
      
        if (index ===-1 && this.backup_userId!=null) {
          //alert("NotAvailable");
          var obj={
            toUserId:this.backup_userId,
            toUserName:this.backup_username,
            toUserProfilePic:this.backup_profilepic
          }
          this.chatList.push(obj);
        }
      },
      error => {
        this.loading = false;
        console.error('Error loading chats:', error);
      }
    );
  }

  displayChats(toUserId:any){



    for (let i = 0; i < this.chatList.length; i++) {
      if(toUserId==this.chatList[i].toUserId){

        this.chat_with_profilepic=this.chatList[i].toUserProfilePic;
        this.chat_with_username=this.chatList[i].toUserName;
        this.chat_with_userId=this.chatList[i].toUserId;
      }
    }


    this.receivedMessages=[];

    for (let i = 0; i < this.chatData.length; i++) {

      if(toUserId==this.chatData[i].toUserId){

        for (let k = 0; k < this.chatData[i].chatWindow.length; k++){
           
          var objMsg={
            message:this.chatData[i].chatWindow[k].message,
            type:this.chatData[i].chatWindow[k].type,
            msgtime:this.chatData[i].chatWindow[k].msgtime,
          }
          this.receivedMessages.push(objMsg);
        }
      }
    } 

  }
}
