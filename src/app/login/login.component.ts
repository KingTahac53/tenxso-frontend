import { Component, OnInit, NgZone } from '@angular/core';
import { UserService } from '../services/user.service';
import { UserData } from '../models/user-data.model';
import { SharedService } from '../services/shared.service';

// Declare the global 'google' variable
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
    private ngZone: NgZone  // NgZone can be useful to run UI updates
  ) { }

  ngOnInit(): void {
    // Optionally, initialize your secret key login here

    // Initialize Google Sign-In after view has loaded
    this.initializeGoogleSignIn();
  }

  verifySecretKey(): void {
    this.userService.getUser(this.secretKey).subscribe(
      (response: UserData) => {
        if(response.userId === ''){
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
          location.reload();
        }
      },
      error => console.error('Error generating user ID:', error)
    );
  }

  // ---------------------------
  // Google SSO Integration Code
  // ---------------------------
  initializeGoogleSignIn(): void {
    // Replace with your actual Google Client ID
    const clientId = 'YOUR_GOOGLE_CLIENT_ID';

    // Initialize the Google Identity Services library
    google.accounts.id.initialize({
      client_id: clientId,
      callback: this.handleCredentialResponse.bind(this)
    });

    // Render the Google Sign-In button into the div with id 'googleSignInDiv'
    google.accounts.id.renderButton(
      document.getElementById('googleSignInDiv'),
      { theme: 'outline', size: 'large' }  // Customize button style as needed
    );

    // Optionally, prompt the One Tap dialog
    // google.accounts.id.prompt();
  }

  handleCredentialResponse(response: any): void {
    // response.credential contains the JWT token returned by Google
    console.log('Google JWT token:', response.credential);

    // Send the token to your backend for verification if needed.
    // For example, you might have a method in your userService:
    this.userService.verifyGoogleToken(response.credential).subscribe(
      (userData: UserData) => {
        // Use NgZone to ensure UI updates occur inside Angular's zone
        this.ngZone.run(() => {
          // Save user info in cookies or shared state as in your secret key flow
          this.sharedService.setCookie('userId', userData.userId, 365);
          this.sharedService.setCookie('username', userData.username, 365);
          this.sharedService.setCookie('profilePic', userData.profilePic, 365);
          this.sharedService.setUserInfo(userData.userId, userData.username, userData.profilePic);
          location.reload();
        });
      },
      error => console.error('Error verifying Google token:', error)
    );
  }
}
