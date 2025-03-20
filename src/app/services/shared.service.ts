import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SharedService {
  private userIdSubject = new BehaviorSubject<string | null>(null);
  private usernameSubject = new BehaviorSubject<string | null>(null);
  private profilePicSubject = new BehaviorSubject<string | null>(null);

  private chat_userIdSubject = new BehaviorSubject<string | null>(null);
  private chat_usernameSubject = new BehaviorSubject<string | null>(null);
  private chat_profilePicSubject = new BehaviorSubject<string | null>(null);

  constructor() {
    // Check for an existing userId in the cookie when the service initializes.
    const cookieUserId = this.getCookie("userId");
    if (cookieUserId) {
      this.userIdSubject.next(cookieUserId);
    } else {
      // If not present, generate a new userId, store it in a cookie, and update the subject.
      const newId = this.generateRandomUserId();
      this.setCookie("userId", newId, 365); // Persist for 1 year (or adjust as needed)
      this.userIdSubject.next(newId);
    }
  }

  setUserId(userId: string): void {
    this.userIdSubject.next(userId);
  }

  // Methods to set user info
  setUserInfo(userId: string, username: string, profilePic: string): void {
    this.userIdSubject.next(userId);
    this.usernameSubject.next(username);
    this.profilePicSubject.next(profilePic);

    // Also update the cookies for persistence
    this.setCookie("userId", userId, 365);
    this.setCookie("username", username, 365);
    this.setCookie("profilePic", profilePic, 365);
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

  // Set a cookie with the given name, value, and expiration in days
  setCookie(name: string, value: string, days: number) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
  }

  // Retrieve the cookie value by name
  getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length);
      }
    }
    return null;
  }

  // Generates a simple random user id. Replace with a more robust method if needed.
  private generateRandomUserId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
