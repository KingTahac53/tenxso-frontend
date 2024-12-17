import { Component, OnInit } from '@angular/core';
import { SignalRService } from '../services/signal-r.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  message: string = "";
  fromuser: string = "";
  touser: string = "";
  connectionId:any;
  receivedMessages: string[] = [];

  constructor(private signalRService: SignalRService) { }
  
  ngOnInit(): void {
   
    this.signalRService.currentMessage.subscribe(message => {
      if (message) {
        this.receivedMessages.push(message);
      }
    }); 
  }

  sendMessage(): void {
    this.signalRService.sendMessage(this.fromuser,this.touser, this.message);
    this.message = '';
  }
}
