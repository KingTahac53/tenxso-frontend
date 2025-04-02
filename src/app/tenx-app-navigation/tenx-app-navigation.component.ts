import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  NgZone,
} from "@angular/core";
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
    private ngZone: NgZone,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // On app initialization, always force a refresh by calling getUser.
    const userId = localStorage.getItem("userId") || this.getCookie("userId");
    if (userId) {
      this.getUser(userId, true);
      this.signedIn = true;
    } else {
      this.generateAndStoreUser(true);
      this.signedIn = false;
    }
    this.signalRService.notificationCounter.subscribe((resp) => {
      this.notificationCounter += Number(resp);
    });
  }

  ngAfterViewInit(): void {
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
          this.sharedService.setUserInfo(
            this.generatedUserData.userId,
            this.generatedUserData.firstName && this.generatedUserData.lastName
              ? this.generatedUserData.firstName +
                  " " +
                  this.generatedUserData.lastName
              : this.generatedUserData.username
              ? this.formatUsername(this.generatedUserData.username)
              : "",
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
        this.sharedService.setUserInfo(
          this.generatedUserData.userId,
          this.generatedUserData.firstName && this.generatedUserData.lastName
            ? this.generatedUserData.firstName +
                " " +
                this.generatedUserData.lastName
            : this.generatedUserData.username
            ? this.formatUsername(this.generatedUserData.username)
            : "",
          this.generatedUserData.profilePic
        );
        this.signedIn = true;
        this.cd.detectChanges();
      },
      (error) => console.error("Error generating user data:", error)
    );
  }

  setPersistentData(userData: UserData): void {
    // Store in cookies.
    this.setCookie("userId", userData.userId, 365);
    this.setCookie("firstName", userData.firstName, 365);
    this.setCookie("lastName", userData.lastName, 365);
    this.setCookie("profilePic", userData.profilePic, 365);
    this.setCookie("isVerified", userData.isVerified, 365);
    this.setCookie("username", userData.username, 365);
    // Store in localStorage.
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

  initializeGoogleSignIn(): void {
    if (typeof google === "undefined") {
      console.error("Google Identity Services script not loaded");
      return;
    }
    const clientId = environment.GOOGLE_CLIENT_ID;
    google.accounts.id.initialize({
      client_id: clientId,
      callback: this.handleCredentialResponse.bind(this),
      auto_select: true,
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
          this.sharedService.setUserInfo(
            mappedUser.userId,
            mappedUser.firstName && mappedUser.lastName
              ? mappedUser.firstName + " " + mappedUser.lastName
              : mappedUser.username
              ? this.formatUsername(mappedUser.username)
              : "",
            mappedUser.profilePic
          );
          this.generatedUserData = mappedUser;
          this.signedIn = true;
          this.profileDropdownOpen = false;
          // Refresh immediately to get updated profile picture.
          this.getUser(mappedUser.userId, true);
          this.cd.detectChanges();
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
