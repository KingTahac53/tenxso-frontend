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

  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    this.sharedService.getUserId().subscribe((userId) => (this.userId = userId));
    this.sharedService.getUsername().subscribe((username) => (this.username = username));
    this.sharedService.getProfilePic().subscribe((profilePic) => {
      this.profilePic = profilePic;
      this.imgPreview = this.profilePic; // Show profile picture preview
    });
  }
}
