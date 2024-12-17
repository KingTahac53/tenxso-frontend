import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {

  private userIdSubject = new BehaviorSubject<string | null>(null);
  private usernameSubject = new BehaviorSubject<string | null>(null);
  private profilePicSubject = new BehaviorSubject<string | null>(null);

  private chat_userIdSubject = new BehaviorSubject<string | null>(null);
  private chat_usernameSubject = new BehaviorSubject<string | null>(null);
  private chat_profilePicSubject = new BehaviorSubject<string | null>(null);

  setUserId(userId: string): void {
    this.userIdSubject.next(userId);
  }


  // Methods to set user info
  setUserInfo(userId: string, username: string, profilePic: string): void {
    this.userIdSubject.next(userId);
    this.usernameSubject.next(username);
    this.profilePicSubject.next(profilePic);
  }

  setChatUserInfo(userId: string, username: string, profilePic: string): void {
    this.chat_userIdSubject.next(userId);
    this.chat_usernameSubject.next(username);
    this.chat_profilePicSubject.next(profilePic);
  }

  // Methods to get user info as observables
  getUserId(): Observable<string | null> {
    return this.userIdSubject.asObservable();
  }

  getUsername(): Observable<string | null> {
    return this.usernameSubject.asObservable();
  }

  getProfilePic(): Observable<string | null> {
    return this.profilePicSubject.asObservable();
  }

  getchat_UserId(): Observable<string | null> {
    return this.chat_userIdSubject.asObservable();
  }

  getchat_Username(): Observable<string | null> {
    return this.chat_usernameSubject.asObservable();
  }

  getchat_ProfilePic(): Observable<string | null> {
    return this.chat_profilePicSubject.asObservable();
  }

  setCookie(name: string, value: string, days: number) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
  }

  getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length);
      }
    }
    return null;
  }
}
