import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, of, interval } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";
import * as CryptoJS from "crypto-js";

@Injectable({
  providedIn: "root",
})
export class ServiceBusService {
  // These values should come from a secure configuration or Key Vault
  private connectionString =
    "Endpoint=sb://<your-namespace>.servicebus.windows.net/;SharedAccessKeyName=<your-key-name>;SharedAccessKey=<your-key>";
  private queueName = "sn-messages-queue";

  // Parsed values
  private namespaceUrl: string | undefined; // e.g. "https://<your-namespace>.servicebus.windows.net/"
  private sharedAccessKeyName: string | undefined;
  private sharedAccessKey: string | undefined;

  constructor(private http: HttpClient) {
    this.parseConnectionString();
  }

  private parseConnectionString(): void {
    // Example connection string:
    // "Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=abc123..."
    const parts = this.connectionString.split(";");
    let endpoint = "";
    let keyName = "";
    let key = "";
    parts.forEach((part) => {
      if (part.startsWith("Endpoint=")) {
        endpoint = part.replace("Endpoint=", "").trim();
        // Change sb:// to https:// for REST calls
        this.namespaceUrl = endpoint.replace("sb://", "https://");
        // Ensure trailing slash
        if (!this.namespaceUrl.endsWith("/")) {
          this.namespaceUrl += "/";
        }
      } else if (part.startsWith("SharedAccessKeyName=")) {
        keyName = part.replace("SharedAccessKeyName=", "").trim();
        this.sharedAccessKeyName = keyName;
      } else if (part.startsWith("SharedAccessKey=")) {
        key = part.replace("SharedAccessKey=", "").trim();
        this.sharedAccessKey = key;
      }
    });
  }

  /**
   * Generates a Shared Access Signature (SAS) token for the given URI.
   * @param uri The resource URI (e.g., namespaceUrl + queueName).
   * @param expiryInSeconds Token expiry time in seconds.
   */
  private generateSasToken(
    uri: string,
    expiryInSeconds: number = 3600
  ): string {
    const targetUri = encodeURIComponent(uri.toLowerCase());
    const expiry = Math.floor(Date.now() / 1000) + expiryInSeconds;
    const stringToSign = targetUri + "\n" + expiry;
    const hash = CryptoJS.HmacSHA256(stringToSign, this.sharedAccessKey);
    const signature = encodeURIComponent(hash.toString(CryptoJS.enc.Base64));
    const token = `SharedAccessSignature sr=${targetUri}&sig=${signature}&se=${expiry}&skn=${this.sharedAccessKeyName}`;
    return token;
  }

  /**
   * Polls the Service Bus queue for a message.
   * Uses the "ReceiveAndDelete" mode by default.
   * @returns An observable of the message payload (or null if none).
   */
  pollMessage(): Observable<any> {
    const resourceUri = `${this.namespaceUrl}${this.queueName}`;
    const sasToken = this.generateSasToken(resourceUri);
    // The REST endpoint to receive (delete) the message from the head of the queue.
    const url = `${resourceUri}/messages/head?timeout=60`;
    const headers = new HttpHeaders({
      Authorization: sasToken,
      "Content-Type": "application/atom+xml;type=entry;charset=utf-8",
    });
    // Using POST as per Service Bus REST API for ReceiveAndDelete.
    return this.http.post(url, null, { headers, responseType: "text" }).pipe(
      catchError((err) => {
        console.error("Error polling Service Bus:", err);
        return of(null);
      })
    );
  }

  /**
   * Starts polling the queue every given interval (in milliseconds).
   * This example polls every 10 seconds.
   */
  startPolling(intervalMs: number = 10000): Observable<any> {
    return interval(intervalMs).pipe(switchMap(() => this.pollMessage()));
  }
}
