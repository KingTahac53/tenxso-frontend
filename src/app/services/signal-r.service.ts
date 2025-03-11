import { Injectable } from "@angular/core";
import * as signalR from "@microsoft/signalr";
import { BehaviorSubject } from "rxjs";
import { SharedService } from "../services/shared.service";

@Injectable({
  providedIn: "root",
})
export class SignalRService {
  public hubConnection: signalR.HubConnection;
  // Use any to allow message objects (or define an interface if you prefer)
  private messageSource = new BehaviorSubject<any>(null);
  private counterSource = new BehaviorSubject<string>("");
  currentMessage = this.messageSource.asObservable();
  notificationCounter = this.counterSource.asObservable();
  public connectionId: any;
  public userId: string | null = null;

  constructor(private sharedService: SharedService) {
    // Pass { withCredentials: false } in the connection options.
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl("https://snappservice.azurewebsites.net/chatHub", {
        withCredentials: false,
      })
      .build();

    this.hubConnection
      .start()
      .then(() => console.log("Connection started"))
      .then(() => this.getConnectionId())
      .catch((err) => console.log("Error while starting connection: " + err));

    // Listen for full message objects from the hub.
    this.hubConnection.on("ReceiveMessage", (message: any) => {
      // Pass the raw message object.
      this.messageSource.next(message);
    });

    this.hubConnection.on("ReceiveBellCount", (counter: any) => {
      this.counterSource.next(`${counter}`);
    });
  }

  private getConnectionId = () => {
    this.sharedService
      .getUserId()
      .subscribe((userId) => (this.userId = userId));
    if (this.userId == null) {
      this.userId = this.sharedService.getCookie("userId");
    }
    this.hubConnection.invoke("getconnectionid", this.userId).then((data) => {
      console.log(data);
      this.connectionId = data;
    });
  };

  sendMessage(fromuser: string, touser: string, message: string) {
    this.hubConnection
      .invoke("SendMessage", fromuser, touser, message, this.connectionId)
      .catch((err) => console.error(err));
  }

  sendBellCount(postAuthorId: string, count: string) {
    this.hubConnection
      .invoke("SendBellCount", postAuthorId, count)
      .catch((err) => console.error(err));
  }
}
