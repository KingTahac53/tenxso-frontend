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
    // Load user data from persistence (localStorage or cookies)
    const userId = localStorage.getItem("userId") || this.getCookie("userId");
    const firstName =
      localStorage.getItem("firstName") || this.getCookie("firstName");
    const lastName =
      localStorage.getItem("lastName") || this.getCookie("lastName");
    const profilePic =
      localStorage.getItem("profilePic") || this.getCookie("profilePic");
    const isVerified =
      localStorage.getItem("isVerified") || this.getCookie("isVerified");

    if (userId && firstName && lastName && profilePic) {
      this.generatedUserData = new UserData(
        userId,
        "",
        firstName,
        lastName,
        profilePic,
        isVerified || "false"
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
    // Wait until the Google script is loaded before initializing the button
    this.waitForGoogleScriptAndInitialize();
  }

  // Repeatedly check if google.accounts is available, then initialize.
  private waitForGoogleScriptAndInitialize() {
    if (
      typeof google !== "undefined" &&
      google.accounts &&
      google.accounts.id
    ) {
      this.initializeGoogleSignIn();
    } else {
      setTimeout(() => this.waitForGoogleScriptAndInitialize(), 500);
    }
  }

  // Helper method to format a username (splitting underscores and capitalizing)
  formatUsername(username: string): string {
    return username
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  getUser(userId: any, storePersistence: boolean) {
    this.userService.getUser(userId).subscribe(
      (response: any) => {
        if (!response.userId) {
          this.generateAndStoreUser(true);
        } else {
          // Map backend keys: "firstname" and "lastname" → firstName, lastName.
          this.generatedUserData = new UserData(
            response.userId,
            response.username,
            response.firstname,
            response.lastname,
            response.profilePic,
            response.isVerified.toString()
          );
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
      (response: any) => {
        // Assume the generated response has keys: userId, username, firstname, lastname, profilePic
        this.generatedUserData = new UserData(
          response.userId,
          response.username,
          response.firstname,
          response.lastname,
          response.profilePic,
          "false"
        );
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
        this.signedIn = true;
      },
      (error) => console.error("Error generating user data:", error)
    );
  }

  // Save user data in cookies and localStorage for persistence
  setPersistentData(userData: UserData): void {
    // Cookies
    this.setCookie("userId", userData.userId, 365);
    this.setCookie("firstName", userData.firstName, 365);
    this.setCookie("lastName", userData.lastName, 365);
    this.setCookie("profilePic", userData.profilePic, 365);
    this.setCookie("isVerified", userData.isVerified, 365);
    // LocalStorage
    localStorage.setItem("userId", userData.userId);
    localStorage.setItem("firstName", userData.firstName);
    localStorage.setItem("lastName", userData.lastName);
    localStorage.setItem("profilePic", userData.profilePic);
    localStorage.setItem("isVerified", userData.isVerified);
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

  // Initialize Google Sign-In by rendering the button in the div with id "googleSignInDiv"
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
      (userData: any) => {
        this.ngZone.run(() => {
          // Map the backend keys and convert isVerified to string.
          const mappedUser = new UserData(
            userData.userId,
            userData.username,
            userData.firstname,
            userData.lastname,
            userData.profilePic,
            userData.isVerified.toString()
          );
          this.setPersistentData(mappedUser);
          this.sharedService.setUserInfo(
            mappedUser.userId,
            mappedUser.firstName + " " + mappedUser.lastName,
            mappedUser.profilePic
          );
          this.generatedUserData = mappedUser;
          this.signedIn = true;
          this.profileDropdownOpen = false;
        });
      },
      (error: any) => console.error("Error verifying Google token:", error)
    );
  }

  // Trigger the Google sign-in prompt when needed
  signInWithGoogleCustom(): void {
    if (typeof google !== "undefined") {
      google.accounts.id.prompt();
    }
  }
}
