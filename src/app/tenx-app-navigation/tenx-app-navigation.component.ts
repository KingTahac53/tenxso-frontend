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
  // Instantiate with empty strings and "false" for isVerified
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
    // Load user data from cookies
    const userId = this.getCookie("userId");
    const firstName = this.getCookie("firstName");
    const lastName = this.getCookie("lastName");
    const profilePic = this.getCookie("profilePic");
    const googleVerified = this.getCookie("googleVerified");

    if (userId && firstName && lastName && profilePic) {
      // Username field is unused; full name is displayed
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
    // Render the Google sign-in button if the user is not signed in
    if (!this.signedIn) {
      this.initializeGoogleSignIn();
    }
  }

  // Helper method to format username if full name is not available.
  formatUsername(username: string): string {
    return username
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  getUser(userId: any, storeCookies: boolean) {
    this.userService.getUser(userId).subscribe(
      (response: UserData) => {
        if (!response.userId) {
          this.generateAndStoreUser(true);
        } else {
          this.generatedUserData = response;
          if (storeCookies) {
            this.setCookie("userId", this.generatedUserData.userId, 365);
            this.setCookie("firstName", this.generatedUserData.firstName, 365);
            this.setCookie("lastName", this.generatedUserData.lastName, 365);
            this.setCookie(
              "profilePic",
              this.generatedUserData.profilePic,
              365
            );
            this.setCookie(
              "googleVerified",
              this.generatedUserData.isVerified,
              365
            );
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

  generateAndStoreUser(storeCookies: boolean) {
    this.userService.generateUserId().subscribe(
      (response: UserData) => {
        this.generatedUserData = response;
        if (storeCookies) {
          this.setCookie("userId", this.generatedUserData.userId, 365);
          this.setCookie("firstName", this.generatedUserData.firstName, 365);
          this.setCookie("lastName", this.generatedUserData.lastName, 365);
          this.setCookie("profilePic", this.generatedUserData.profilePic, 365);
          this.setCookie("googleVerified", "false", 365);
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

  // Initialize Google Sign-In: render button in div with id "googleSignInDiv"
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
          this.sharedService.setCookie("userId", userData.userId, 365);
          this.sharedService.setCookie("firstName", userData.firstName, 365);
          this.sharedService.setCookie("lastName", userData.lastName, 365);
          this.sharedService.setCookie("profilePic", userData.profilePic, 365);
          this.sharedService.setCookie(
            "googleVerified",
            userData.isVerified,
            365
          );
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

  // Trigger the sign-in prompt when needed
  signInWithGoogleCustom(): void {
    if (typeof google !== "undefined") {
      google.accounts.id.prompt();
    }
  }
}
