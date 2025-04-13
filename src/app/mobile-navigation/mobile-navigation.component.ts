import { Component, OnInit, NgZone, ChangeDetectorRef } from "@angular/core";
import { Router } from "@angular/router";
import { UserService } from "../services/user.service";
import { SharedService } from "../services/shared.service";
import { environment } from "../environment";
import { UserData } from "../models/user-data.model";
import { MatDialog } from "@angular/material/dialog";

// Declare the global google object for TypeScript
declare const google: any;

@Component({
  selector: "app-mobile-navigation",
  templateUrl: "./mobile-navigation.component.html",
})
export class MobileNavigationComponent implements OnInit {
  generatedUserData: UserData = new UserData("", "", "", "", "", "false");
  profileDropdownOpen: boolean = false;
  signedIn: boolean = false;
  notificationCounter: number = 0;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private sharedService: SharedService,
    // private signalRService: SignalRService,
    private ngZone: NgZone,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // First, try to retrieve user data from persistent storage.
    const userId = localStorage.getItem("userId") || this.getCookie("userId");
    const firstName =
      localStorage.getItem("firstName") || this.getCookie("firstName");
    const lastName =
      localStorage.getItem("lastName") || this.getCookie("lastName");
    const profilePic =
      localStorage.getItem("profilePic") || this.getCookie("profilePic");
    const isVerified =
      localStorage.getItem("isVerified") || this.getCookie("isVerified");
    const username =
      localStorage.getItem("username") || this.getCookie("username");

    if (userId && profilePic) {
      // Use the cached data from the create user response.
      this.generatedUserData = new UserData(
        userId,
        username || "",
        firstName || "",
        lastName || "",
        profilePic,
        isVerified || "false"
      );
      this.sharedService.setUserInfo(
        this.generatedUserData.userId,
        this.getDisplayName(this.generatedUserData),
        this.generatedUserData.profilePic
      );
      this.getUser(userId, true);
      this.signedIn = true;
    } else {
      // If no persistent data exists, call generateAndStoreUser to create a new user.
      this.generateAndStoreUser(true);
    }
    // this.signalRService.notificationCounter.subscribe((resp) => {
    //   this.notificationCounter += Number(resp);
    // });
  }

  ngAfterViewInit(): void {
    // Initialize Google sign-in if needed.
    this.waitForGoogleScriptAndInitialize();
  }

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

  // Cookie helper
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

  deleteCookie(name: string): void {
    document.cookie = name + "=; Max-Age=0; path=/;";
  }

  toggleProfileDropdown(): void {
    this.profileDropdownOpen = !this.profileDropdownOpen;
  }

  formatUsername(username: string): string {
    if (!username) return "";
    return username
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  getDisplayName(user: UserData): string {
    // If first and/or last name exist, combine them. Otherwise, use the formatted username.
    if (user.firstName.trim() || user.lastName.trim()) {
      return (user.firstName + " " + user.lastName).trim();
    }
    return user.username ? this.formatUsername(user.username) : "";
  }

  getUser(userId: any, storePersistence: boolean) {
    this.userService.getUser(userId).subscribe(
      (response: any) => {
        if (!response.userId) {
          // If getUser returns no data, do nothing.
          return;
        } else {
          this.generatedUserData = new UserData(
            response.userId,
            response.username,
            response.firstname || "",
            response.lastname || "",
            response.profilePic,
            response.isVerified.toString()
          );
          if (storePersistence) {
            this.setPersistentData(this.generatedUserData);
          }
          const displayName = this.getDisplayName(this.generatedUserData);
          this.sharedService.setUserInfo(
            this.generatedUserData.userId,
            displayName,
            this.generatedUserData.profilePic
          );
          this.cd.detectChanges();
        }
      },
      (error) => console.error("Error fetching user data:", error)
    );
  }
  generateAndStoreUser(storePersistence: boolean) {
    this.userService.generateUserId().subscribe(
      (response: any) => {
        // Use the create user response directly.
        this.generatedUserData = new UserData(
          response.userId,
          response.username,
          response.firstname || "",
          response.lastname || "",
          response.profilePic,
          "false"
        );
        if (storePersistence) {
          this.setPersistentData(this.generatedUserData);
        }
        const displayName = this.getDisplayName(this.generatedUserData);
        this.sharedService.setUserInfo(
          this.generatedUserData.userId,
          displayName,
          this.generatedUserData.profilePic
        );
        this.signedIn = true;
        this.cd.detectChanges();
      },
      (error) => console.error("Error generating user data:", error)
    );
  }

  setPersistentData(userData: UserData): void {
    // Save in cookies
    this.setCookie("userId", userData.userId, 365);
    this.setCookie("firstName", userData.firstName, 365);
    this.setCookie("lastName", userData.lastName, 365);
    this.setCookie("profilePic", userData.profilePic, 365);
    this.setCookie("isVerified", userData.isVerified, 365);
    this.setCookie("username", userData.username, 365);
    // Save in localStorage
    localStorage.setItem("userId", userData.userId);
    localStorage.setItem("firstName", userData.firstName);
    localStorage.setItem("lastName", userData.lastName);
    localStorage.setItem("profilePic", userData.profilePic);
    localStorage.setItem("isVerified", userData.isVerified);
    localStorage.setItem("username", userData.username);
  }

  setCookie(name: string, value: string, days: number) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
  }

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
          const mappedUser = new UserData(
            userData.userId,
            userData.username,
            userData.firstname || "",
            userData.lastname || "",
            userData.profilePic,
            userData.isVerified.toString()
          );
          this.setPersistentData(mappedUser);
          const displayName = this.getDisplayName(mappedUser);
          this.sharedService.setUserInfo(
            mappedUser.userId,
            displayName,
            mappedUser.profilePic
          );
          this.generatedUserData = mappedUser;
          this.signedIn = true;
          this.profileDropdownOpen = false;
          this.getUser(mappedUser.userId, true);
          this.cd.detectChanges();
        });
      },
      (error: any) => console.error("Error verifying Google token:", error)
    );
  }

  signInWithGoogle(): void {
    if (typeof google !== "undefined") {
      google.accounts.id.prompt();
    }
  }

  // logout(): void {
  //   console.log("Logging out...");
  //   this.signedIn = false;
  //   this.deleteCookie("userId");
  //   this.deleteCookie("username");
  //   this.deleteCookie("profilePic");
  //   this.generatedUserData = null;
  //   this.router.navigate(["/login"]);
  // }
}
