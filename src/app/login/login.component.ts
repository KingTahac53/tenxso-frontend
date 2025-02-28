import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { UserData } from '../models/user-data.model';
import { SharedService } from '../services/shared.service';
import { environment } from '../environment';

// Declare the global google object for TypeScript
declare const google: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  message: any;
  secretKey: string | null = null;
  generatedUserData: UserData = new UserData('', '', '');

  constructor(
    private userService: UserService,
    private sharedService: SharedService,
    private ngZone: NgZone,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Initialize any existing secret key flow if needed
    this.initializeGoogleSignIn();
  }

  verifySecretKey(): void {
    this.userService.getUser(this.secretKey).subscribe(
      (response: UserData) => {
        if (response.userId === '') {
          this.message = 'Invalid Key';
        } else {
          this.generatedUserData = response;
          this.sharedService.setCookie('userId', this.generatedUserData.userId, 365);
          this.sharedService.setCookie('username', this.generatedUserData.username, 365);
          this.sharedService.setCookie('profilePic', this.generatedUserData.profilePic, 365);
          this.sharedService.setUserInfo(
            this.generatedUserData.userId,
            this.generatedUserData.username,
            this.generatedUserData.profilePic
          );
          this.router.navigate(['/create']);
        }
      },
      (error: any) => console.error('Error generating user ID:', error)
    );
  }

  // Google SSO Integration
  initializeGoogleSignIn(): void {
    const clientId = environment.GOOGLE_CLIENT_ID; // Replace with your actual Google Client ID

    // Initialize the Google Identity Services library
    google.accounts.id.initialize({
      client_id: clientId,
      callback: this.handleCredentialResponse.bind(this)
    });

    // Render the Google Sign-In button in the div with id 'googleSignInDiv'
    google.accounts.id.renderButton(
      document.getElementById('googleSignInDiv'),
      { theme: 'outline', size: 'large' }
    );

    // Optionally, display the One Tap dialog
    // google.accounts.id.prompt();
  }

  handleCredentialResponse(response: any): void {
    // response.credential contains the JWT token from Google
    console.log('Google JWT token:', response.credential);

    // Send the token to your backend for verification
    this.userService.verifyGoogleToken(response.credential).subscribe(
      (userData: UserData) => {
        this.ngZone.run(() => {
          this.sharedService.setCookie('userId', userData.userId, 365);
          this.sharedService.setCookie('username', userData.username, 365);
          this.sharedService.setCookie('profilePic', userData.profilePic, 365);
          this.sharedService.setUserInfo(userData.userId, userData.username, userData.profilePic);
          this.router.navigate(['/create']);
        });
      },
      (error: any) => console.error('Error verifying Google token:', error)
    );
  }
}
