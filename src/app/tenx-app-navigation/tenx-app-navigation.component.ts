import { Component, OnInit, AfterViewInit, NgZone } from "@angular/core";
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
  generatedUserData: UserData = new UserData("", "", "", "", "", "false");
  profileDropdownOpen: boolean = false;
  signedIn: boolean = false;
  notificationCounter: number = 0;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private sharedService: SharedService,
    private signalRService: SignalRService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    // First check localStorage for persistence
    const userId = localStorage.getItem("userId") || this.getCookie("userId");
    const firstName =
      localStorage.getItem("firstName") || this.getCookie("firstName");
    const lastName =
      localStorage.getItem("lastName") || this.getCookie("lastName");
    const profilePic =
      localStorage.getItem("profilePic") || this.getCookie("profilePic");
    const googleVerified =
      localStorage.getItem("googleVerified") ||
      this.getCookie("googleVerified");

    if (userId && firstName && lastName && profilePic) {
      this.generatedUserData = new UserData(
        userId,
        "",
        firstName,
        lastName,
        profilePic,
        googleVerified || "false"
      );
      this.signedIn = true;
      this.getUser(userId, true);
    } else {
      this.generateAndStoreUser(true);
      this.signedIn = false;
    }

    // Subscribe to notification updates
    this.signalRService.notificationCounter.subscribe((resp) => {
      this.notificationCounter += Number(resp);
    });
  }

  ngAfterViewInit(): void {
    // Render Google Sign-In button if the user is not signed in
    if (!this.signedIn) {
      this.initializeGoogleSignIn();
    }
  }

  // Helper method to format username by splitting underscores and capitalizing each word
  formatUsername(username: string): string {
    return username
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  getUser(userId: any, storePersistence: boolean) {
    this.userService.getUser(userId).subscribe(
      (response: UserData) => {
        if (!response.userId) {
          this.generateAndStoreUser(true);
        } else {
          this.generatedUserData = response;
          if (storePersistence) {
            this.setPersistentData(this.generatedUserData);
          }
          this.sharedService.setUserInfo(
            this.generatedUserData.userId,
            this.generatedUserData.firstName +
              " " +
              this.generatedUserData.lastName,
            this.generatedUserData.profilePic
          );
        }
      },
      (error) => console.error("Error fetching user data:", error)
    );
  }

  generateAndStoreUser(storePersistence: boolean) {
    this.userService.generateUserId().subscribe(
      (response: UserData) => {
        this.generatedUserData = response;
        if (storePersistence) {
          // Default unverified user
          this.setPersistentData({
            ...this.generatedUserData,
            isVerified: "false",
          });
        }
        this.sharedService.setUserInfo(
          this.generatedUserData.userId,
          this.generatedUserData.firstName +
            " " +
            this.generatedUserData.lastName,
          this.generatedUserData.profilePic
        );
        this.signedIn = true;
      },
      (error) => console.error("Error generating user data:", error)
    );
  }

  // Helper to set cookies and localStorage for persistence
  setPersistentData(userData: UserData): void {
    // Cookies
    this.setCookie("userId", userData.userId, 365);
    this.setCookie("firstName", userData.firstName, 365);
    this.setCookie("lastName", userData.lastName, 365);
    this.setCookie("profilePic", userData.profilePic, 365);
    this.setCookie("googleVerified", userData.isVerified, 365);
    // LocalStorage
    localStorage.setItem("userId", userData.userId);
    localStorage.setItem("firstName", userData.firstName);
    localStorage.setItem("lastName", userData.lastName);
    localStorage.setItem("profilePic", userData.profilePic);
    localStorage.setItem("googleVerified", userData.isVerified);
  }

  // Cookie helper methods
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

  toggleProfileDropdown(): void {
    this.profileDropdownOpen = !this.profileDropdownOpen;
  }

  // Initialize Google Sign-In: render button in the div with id "googleSignInDiv"
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

  handleCredentialResponse(response: any): void {
    console.log("Google JWT token:", response.credential);
    this.userService.verifyGoogleToken(response.credential).subscribe(
      (userData: UserData) => {
        this.ngZone.run(() => {
          this.setPersistentData(userData);
          this.sharedService.setUserInfo(
            userData.userId,
            userData.firstName + " " + userData.lastName,
            userData.profilePic
          );
          this.generatedUserData = userData;
          this.signedIn = true;
          this.profileDropdownOpen = false;
        });
      },
      (error: any) => console.error("Error verifying Google token:", error)
    );
  }

  signInWithGoogleCustom(): void {
    if (typeof google !== "undefined") {
      google.accounts.id.prompt();
    }
  }
}
