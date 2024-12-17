import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { UserData } from '../models/user-data.model';
import { SharedService } from '../services/shared.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  
  message:any;
  secretKey: string | null = null;
  generatedUserData: UserData = new UserData('', '', '');

   constructor(
     private userService:UserService,
     private sharedService: SharedService) {}

  ngOnInit(): void {
  }

  verifySecretKey(): void {
   
    this.userService.getUser(this.secretKey).subscribe(
      (response: UserData) => {

        if(response.userId=='')
        {
          this.message='Invalid Key';
        }
        else{

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
}
