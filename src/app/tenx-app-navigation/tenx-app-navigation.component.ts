import { Component, OnInit, NgZone, AfterViewInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { SharedService } from "../services/shared.service";
import { SignalRService } from "../services/signal-r.service";
import { UserService } from "../services/user.service";
import { UserData } from "../models/user-data.model";
import { environment } from "../environment";

// Declare the global google object for TypeScript
declare const google: any;

@Component({
  selector: "tenx-app-navigation",
  templateUrl: "./tenx-app-navigation.component.html",
})
export class TenxAppNavigationComponent implements OnInit, AfterViewInit {
  notificationCounter: number = 0;
  generatedUserData: UserData = new UserData("", "", "");
  profileDropdownOpen: boolean = false;
  signedIn: boolean = false;
  isVerified: boolean = false; // True if Google-verified

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private sharedService: SharedService,
    private signalRService: SignalRService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    // Load user data from cookies
    const userId = this.getCookie("userId");
    const username = this.getCookie("username");
    const profilePic = this.getCookie("profilePic");
    const googleVerified = this.getCookie("googleVerified");
    if (userId && username && profilePic) {
      this.generatedUserData = new UserData(userId, username, profilePic);
      this.signedIn = true;
      this.isVerified = googleVerified === "true";
      this.getUser(userId, true);
    } else {
      this.generateAndStoreUser(true);
      this.signedIn = false;
      this.isVerified = false;
    }

    // Subscribe to notification updates
    this.signalRService.notificationCounter.subscribe((resp) => {
      this.notificationCounter += Number(resp);
    });
  }

  ngAfterViewInit(): void {
    // Render the Google Sign-In button if user is unverified
    if (!this.isVerified) {
      this.initializeGoogleSignIn();
    }
  }

  // Trigger the custom Google sign-in when the button is clicked
  // Trigger custom Google sign in
  signInWithGoogleCustom(): void {
    if (typeof google === "undefined") {
      console.error("Google Identity Services script not loaded");
      return;
    }
    // Ensure initialization (if not already initialized)
    this.initializeGoogleSignIn();
    // Trigger the Google One Tap prompt
    google.accounts.id.prompt();
  }

  // Fetch user data from the server
  getUser(userId: any, storeCookies: boolean) {
    this.userService.getUser(userId).subscribe(
      (response: UserData) => {
        if (response.userId === "") {
          this.generateAndStoreUser(true);
        } else {
          this.generatedUserData = response;
          if (storeCookies) {
            this.setCookie("userId", this.generatedUserData.userId, 365);
            this.setCookie("username", this.generatedUserData.username, 365);
            this.setCookie(
              "profilePic",
              this.generatedUserData.profilePic,
              365
            );
          }
          this.sharedService.setUserInfo(
            this.generatedUserData.userId,
            this.generatedUserData.username,
            this.generatedUserData.profilePic
          );
        }
      },
      (error) => console.error("Error fetching user data:", error)
    );
  }

  // Generate a new user if none exists (default unverified)
  generateAndStoreUser(storeCookies: boolean) {
    this.userService.generateUserId().subscribe(
      (response: UserData) => {
        this.generatedUserData = response;
        if (storeCookies) {
          this.setCookie("userId", this.generatedUserData.userId, 365);
          this.setCookie("username", this.generatedUserData.username, 365);
          this.setCookie("profilePic", this.generatedUserData.profilePic, 365);
          this.setCookie("googleVerified", "false", 365);
        }
        this.sharedService.setUserInfo(
          this.generatedUserData.userId,
          this.generatedUserData.username,
          this.generatedUserData.profilePic
        );
        this.signedIn = true;
        this.isVerified = false;
      },
      (error) => console.error("Error generating user data:", error)
    );
  }

  // Cookie helpers
  setCookie(name: string, value: string, days: number) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
  }
  getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
    }
    return null;
  }
  deleteCookie(name: string): void {
    document.cookie = name + "=; Max-Age=0; path=/;";
  }

  // Toggle the profile dropdown
  toggleProfileDropdown(): void {
    this.profileDropdownOpen = !this.profileDropdownOpen;
    // When opening and unverified, re-render the Google button
    if (this.profileDropdownOpen && !this.isVerified) {
      const btnContainer = document.getElementById("googleSignInDiv");
      if (btnContainer && typeof google !== "undefined") {
        btnContainer.innerHTML = "";
        google.accounts.id.renderButton(btnContainer, {
          theme: "outline",
          size: "large",
        });
      }
    }
  }

  // Initialize Google Sign-In
  initializeGoogleSignIn(): void {
    if (typeof google === "undefined") {
      console.error("Google Identity Services script not loaded");
      return;
    }
    const clientId = environment.GOOGLE_CLIENT_ID;
    google.accounts.id.initialize({
      client_id: clientId,
      callback: this.handleCredentialResponse.bind(this),
    });
    const btnContainer = document.getElementById("googleSignInDiv");
    if (btnContainer) {
      btnContainer.innerHTML = "";
      google.accounts.id.renderButton(btnContainer, {
        theme: "outline",
        size: "large",
      });
    }
  }

  // Handle the Google credential response
  handleCredentialResponse(response: any): void {
    console.log("Google JWT token:", response.credential);
    this.userService.verifyGoogleToken(response.credential).subscribe(
      (userData: UserData) => {
        this.ngZone.run(() => {
          this.sharedService.setCookie("userId", userData.userId, 365);
          this.sharedService.setCookie("username", userData.username, 365);
          this.sharedService.setCookie("profilePic", userData.profilePic, 365);
          this.sharedService.setCookie("googleVerified", "true", 365);
          this.sharedService.setUserInfo(
            userData.userId,
            userData.username,
            userData.profilePic
          );
          this.generatedUserData = userData;
          this.signedIn = true;
          this.isVerified = true;
          this.profileDropdownOpen = false;
        });
      },
      (error: any) => console.error("Error verifying Google token:", error)
    );
  }

  // Trigger the Google One Tap prompt
  signInWithGoogle(): void {
    if (typeof google !== "undefined") {
      google.accounts.id.prompt();
    }
  }

  // For now, logout is commented out; you can uncomment if needed.
  logout(): void {
    console.log("Logging out...");
    this.deleteCookie("userId");
    this.deleteCookie("username");
    this.deleteCookie("profilePic");
    this.deleteCookie("googleVerified");
    this.generatedUserData = new UserData("", "", "");
    this.signedIn = false;
    this.isVerified = false;
    // Optionally navigate to login page:
    // this.router.navigate(['/login']);
  }
}
