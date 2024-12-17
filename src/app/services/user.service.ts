import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserData } from '../models/user-data.model';
import { environment } from '../environment';  // Ensure the path is correct

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl; // Make sure environment.ts is configured with the correct API URL

  constructor(private http: HttpClient) {}

  generateUserId(): Observable<UserData> {
    const sanitizedUrl = `${this.apiUrl}/Users/create`.trim().replace(/\s+/g, '');
    //console.log('Calling API (GET):', sanitizedUrl);
    return this.http.get<UserData>(sanitizedUrl);
  }

  getUser(userId:any): Observable<UserData> {
    const sanitizedUrl = this.apiUrl+"/Users/getUser/?userId="+userId;
    //console.log('Calling API (GET):', sanitizedUrl);
    return this.http.get<UserData>(sanitizedUrl);
  }

  // Method to upload a feed with form data
  updateUser(formData: FormData): Observable<HttpEvent<any>> {
    const req = new HttpRequest('POST', this.apiUrl+'/Users/updateUser', formData, {
      reportProgress: true,   // Report upload progress
      responseType: 'json'
    });
    
    return this.http.request(req);  // Return an observable for the HTTP request
  }
}
