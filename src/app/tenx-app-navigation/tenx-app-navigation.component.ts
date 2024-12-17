import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SharedService } from '../services/shared.service';
import { SignalRService } from '../services/signal-r.service';
import { UserService } from '../services/user.service';
import { UserData } from '../models/user-data.model';

@Component({
  selector: 'tenx-app-navigation',
  templateUrl: './tenx-app-navigation.component.html',
  styleUrls: ['./tenx-app-navigation.component.css'],
})
export class TenxAppNavigationComponent implements OnInit {
  notificationCounter: any = 0; // Tracks notifications count
  generatedUserData: UserData = new UserData('', '', ''); // Stores user information

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private sharedService: SharedService,
    private signalRService: SignalRService
  ) {}

  ngOnInit() {
    // Load user data from cookies or generate new user data
    const userId = this.getCookie('userId');
    const username = this.getCookie('username');
    const profilePic = this.getCookie('profilePic');

    if (userId && username && profilePic) {
      this.generatedUserData = new UserData(userId, username, profilePic);
      this.getUser(userId, true);
    } else {
      this.generateAndStoreUser(true);
    }

    // Subscribe to notification updates
    this.signalRService.notificationCounter.subscribe((resp) => {
      this.notificationCounter += Number(resp);
    });
  }

  // Fetch user data from the server
  getUser(userId: any, storeCookies: boolean) {
    this.userService.getUser(userId).subscribe(
      (response: UserData) => {
        if (response.userId === '') {
          this.generateAndStoreUser(true);
        } else {
          this.generatedUserData = response;

          // Store cookies if required
          if (storeCookies) {
            this.setCookie('userId', this.generatedUserData.userId, 365);
            this.setCookie('username', this.generatedUserData.username, 365);
            this.setCookie('profilePic', this.generatedUserData.profilePic, 365);
          }

          // Update shared service
          this.sharedService.setUserInfo(
            this.generatedUserData.userId,
            this.generatedUserData.username,
            this.generatedUserData.profilePic
          );
        }
      },
      (error) => console.error('Error fetching user data:', error)
    );
  }

  // Generate a new user if none exists
  generateAndStoreUser(storeCookies: boolean) {
    this.userService.generateUserId().subscribe(
      (response: UserData) => {
        this.generatedUserData = response;

        // Store cookies if required
        if (storeCookies) {
          this.setCookie('userId', this.generatedUserData.userId, 365);
          this.setCookie('username', this.generatedUserData.username, 365);
          this.setCookie('profilePic', this.generatedUserData.profilePic, 365);
        }

        // Update shared service
        this.sharedService.setUserInfo(
          this.generatedUserData.userId,
          this.generatedUserData.username,
          this.generatedUserData.profilePic
        );
      },
      (error) => console.error('Error generating user data:', error)
    );
  }

  // Set cookies
  setCookie(name: string, value: string, days: number) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
  }

  // Get cookies
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
