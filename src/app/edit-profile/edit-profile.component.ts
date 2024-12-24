import { Component, OnInit } from '@angular/core';
import { SharedService } from '../services/shared.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {
  userId: string | null = null;
  username: string | null = null;
  profilePic: string | null = null;
  imgPreview: string | null = null;

  constructor(private sharedService: SharedService) { }

  ngOnInit(): void {
    this.userId = this.getCookie('userId');
    this.username = this.getCookie('username');
    this.profilePic = this.getCookie('profilePic');
    this.imgPreview = this.profilePic;
  }

  getCookie(name: string): string | null {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  }
}
