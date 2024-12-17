import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { SharedService } from '../services/shared.service';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  public hubConnection: signalR.HubConnection;
  private messageSource = new BehaviorSubject<string>('');
  private counterSource = new BehaviorSubject<string>('');
  currentMessage = this.messageSource.asObservable();
  notificationCounter = this.counterSource.asObservable();
  public connectionId: any;
  public userId: string | null = null;

  constructor( private sharedService: SharedService) {

    this.hubConnection = new signalR.HubConnectionBuilder()
    .withUrl('https://tenxs.azurewebsites.net/chatHub')
    .build();

  this.hubConnection.start()
    .then(() => console.log('Connection started'))
    .then(() => console.log(this.getConnectionId()))
    .catch(err => console.log('Error while starting connection: ' + err));
  
  this.hubConnection.on('ReceiveMessage', (message:any) => {
    this.messageSource.next(`${message}`);
  });

  this.hubConnection.on('ReceiveBellCount', (counter:any) => {
    this.counterSource.next(`${counter}`);
  });

  }

  public startSignalRHub(){

    this.hubConnection = new signalR.HubConnectionBuilder()
    .withUrl('https://tenxs.azurewebsites.net/api/chatHub')
    .build();

  this.hubConnection.start()
    .then(() => console.log('Connection started'))
    .then(() => console.log(this.getConnectionId()))
    .catch(err => console.log('Error while starting connection: ' + err));
  
  this.hubConnection.on('ReceiveMessage', (user:any, message:any) => {
    this.messageSource.next(`${user}: ${message}`);
  });

  this.hubConnection.on('ReceiveBellCount', (counter:any) => {
    this.counterSource.next(`${counter}`);
  });

  }

  private getConnectionId = () => {
  //var userId=this.sharedService.getCookie('userId');
  //console.log("this.sharedService.getUserId()");
  //console.log(this.sharedService.getUserId());
  this.sharedService.getUserId().subscribe(userId => this.userId = userId);
  if(this.userId==null)
  {
      this.userId=this.sharedService.getCookie('userId')
  } 
  this.hubConnection.invoke('getconnectionid',this.userId)
    .then((data) => {
      console.log(data);
      this.connectionId = data;
    });
  }

 
  sendMessage(fromuser: string,touser: string, message: string) {
    this.hubConnection.invoke('SendMessage', fromuser,touser, message,this.connectionId)
      .catch(err => console.error(err));
  }

  sendBellCount(postAuthorId: string,count: string) {
    this.hubConnection.invoke('SendBellCount', postAuthorId, count)
      .catch(err => console.error(err));
  }
}