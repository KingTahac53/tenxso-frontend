import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
//import { environment } from '../environment.prod';  // Ensure the correct path to environment file
import { environment } from '../environment';  // Ensure the correct path to environment file

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private apiUrl = `${environment.apiUrl}/Feeds/uploadFeed`;  // Use the environment API URL for feeds

  constructor(private http: HttpClient) {}

  // Method to upload a feed with form data
  uploadFile(formData: FormData): Observable<HttpEvent<any>> {

    const req = new HttpRequest('POST', this.apiUrl, formData, {
      reportProgress: true,   // Report upload progress
      responseType: 'json'
    });
    console.log(req);
    return this.http.request(req);  // Return an observable for the HTTP request
  }

    

  // Optional: Method to delete an uploaded feed (if needed)
  deleteFile(feedUrl: string): Observable<any> {
    const url = `${this.apiUrl}/delete?feedUrl=${encodeURIComponent(feedUrl)}`;
    return this.http.delete(url);
  }
}
