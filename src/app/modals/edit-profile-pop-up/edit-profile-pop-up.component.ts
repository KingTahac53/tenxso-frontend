import { Component, OnInit } from '@angular/core';
import { UploadService } from '../../services/upload.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-edit-profile-pop-up',
  templateUrl: './edit-profile-pop-up.component.html',
  styleUrls: ['./edit-profile-pop-up.component.css']
})
export class EditProfilePopUpComponent implements OnInit {
  selectedFile: File | null = null;
  uploadProgress: number = 0;
  userId: string | null = null;
  username: string | null = null;
  profilePic: string | null = null;
  imgPreview: string | null = null;
  CopyKey:any='Copy Your Social Key';

  constructor(private uploadService: UploadService,
    private userService:UserService,
     private sharedService: SharedService) {}

  ngOnInit(): void {
    this.sharedService.getUserId().subscribe(userId => this.userId = userId);
    this.sharedService.getUsername().subscribe(username => this.username = username);
    this.sharedService.getProfilePic().subscribe(profilePic => this.profilePic = profilePic);
    this.imgPreview=this.profilePic;
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] || null;
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imgPreview = e.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  updateUser(): void {
    if (this.selectedFile && this.userId && this.username) {
      const formData = new FormData();
  
      // Add required fields to formData
      formData.append('file', this.selectedFile);
      formData.append('userId', this.userId);  // Required field
      formData.append('userName', this.username);  // Required field
      formData.append('fileName', this.selectedFile.name);  // Required field: use the actual file name
      formData.append('description', 'Sample description'); // Add a description or make it dynamic
      formData.append('contentType', this.selectedFile.type); // Optional: File's content type
      formData.append('fileSize', this.selectedFile.size.toString()); // Optional: File's size
      if (this.profilePic) {
        formData.append('profilePic', this.profilePic); // Optional profile pic
      }
  
      this.userService.updateUser(formData).subscribe(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round((100 * event.loaded) / event.total);
          location.reload();
        } else if (event.type === HttpEventType.Response) {
          //console.log('File uploaded successfully:', event.body);
        }
      }, error => {
        console.error('Upload failed:', error);
      });
    } else {
      console.error('User data or file is missing');
    }
  }

  copyKey(){
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = this.userId as string;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this.CopyKey='Copied';
  }
}
