import { Component, OnInit, NgZone } from "@angular/core";
import { Router } from "@angular/router";
import { UserService } from "../services/user.service";
import { SharedService } from "../services/shared.service";
import { environment } from "../environment";

// Declare the global google object for TypeScript
declare const google: any;

@Component({
  selector: "app-mobile-navigation",
  templateUrl: "./mobile-navigation.component.html",
})
export class MobileNavigationComponent implements OnInit {
  // We'll keep only the basic data here; mobile view may show only profilePic and username.
  profileDropdownOpen = false;
  signedIn = false;
  generatedUserData: { profilePic?: string; username?: string } | null = null;

  constructor(
    public router: Router,
    private userService: UserService,
    private sharedService: SharedService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // Check sign-in status via cookies
    const userId = this.getCookie("userId");
    this.signedIn = !!userId;
    const username = this.getCookie("username");
    const profilePic =
      this.getCookie("profilePic") || "assets/images/default-profile.png";
    if (username) {
      this.generatedUserData = { username, profilePic };
    }
    // Initialize Google Sign-In after a slight delay for mobile
    setTimeout(() => {
      this.initializeGoogleSignIn();
    }, 1000);
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
    });
  }

  handleCredentialResponse(response: any): void {
    console.log("Google JWT token:", response.credential);
    this.userService.verifyGoogleToken(response.credential).subscribe(
      (userData: any) => {
        this.ngZone.run(() => {
          this.sharedService.setCookie("userId", userData.userId, 365);
          this.sharedService.setCookie("username", userData.username, 365);
          this.sharedService.setCookie("profilePic", userData.profilePic, 365);
          this.signedIn = true;
          this.generatedUserData = {
            username: userData.username,
            profilePic: userData.profilePic,
          };
          this.router.navigate(["/feeds"]);
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

  logout(): void {
    console.log("Logging out...");
    this.signedIn = false;
    this.deleteCookie("userId");
    this.deleteCookie("username");
    this.deleteCookie("profilePic");
    this.generatedUserData = null;
    this.router.navigate(["/login"]);
  }
}
