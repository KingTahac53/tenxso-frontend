import { Component, OnInit } from '@angular/core';
import { UserService } from './services/user.service';
import { UserData } from './models/user-data.model';
import { DeviceService } from './services/device.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  generatedUserData: UserData = new UserData('', '', ''); // Initialize UserData object with profilePic
  isMobileView: boolean = false; // Flag to track if the view is mobile

  constructor(private userService: UserService, private deviceService: DeviceService) { }

  ngOnInit() {

    const userId = this.getCookie('userId');
    const username = this.getCookie('username');
    const profilePic = this.getCookie('profilePic'); // Retrieve profile pic from cookies

    if (userId && username && profilePic) {
      this.generatedUserData = new UserData(userId, username, profilePic);
    } else {
      this.generateAndStoreUser(true); // Generate new data if no cookies
    }
    this.isMobileView = this.deviceService.isMobile(); // Check if the device is mobile
  }

  generateAndStoreUser(storeCookies: boolean) {
    this.userService.generateUserId().subscribe(
      (response: UserData) => {
        this.generatedUserData = response;
        if (storeCookies) {
          this.setCookie('userId', this.generatedUserData.userId, 365);
          this.setCookie('username', this.generatedUserData.username, 365);
          this.setCookie('profilePic', this.generatedUserData.profilePic, 365);
        }
      },
      error => {
        console.error('Error generating user ID:', error);
      }
    );
  }

  setCookie(name: string, value: string, days: number) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${d.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
  }

  getCookie(name: string): string | null {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  }
}
