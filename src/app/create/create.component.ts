import { Component, OnInit } from '@angular/core';
import { UploadService } from '../services/upload.service';
import { SharedService } from '../services/shared.service';
import { HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css']
})
export class CreateComponent implements OnInit {
  selectedFile: File | null = null;
  uploadProgress: number = 0;
  userId: string | null = null;
  username: string | null = null;
  profilePic: string | null = null;
  caption: string = '';
  imgPreview: any;
  isUploading: boolean = false;
  uploadSuccess: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private uploadService: UploadService,
    private sharedService: SharedService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sharedService.getUserId().subscribe(userId => this.userId = userId);
    this.sharedService.getUsername().subscribe(username => this.username = username);
    this.sharedService.getProfilePic().subscribe(profilePic => this.profilePic = profilePic);
  }

  onFileSelected(event: any): void {
    this.errorMessage = null;
    this.selectedFile = event.target.files[0] || null;

    if (this.selectedFile) {
      if (this.selectedFile.size > 200 * 1024 * 1024) {
        this.errorMessage = 'File size exceeds 200 MB. Please select a smaller file.';
        this.selectedFile = null;
        this.imgPreview = null;
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imgPreview = e.target.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  uploadFile(): void {
    if (this.selectedFile && this.userId && this.username) {
      this.isUploading = true;
      this.errorMessage = null;
      const formData = new FormData();

      formData.append('file', this.selectedFile);
      formData.append('userId', this.userId);
      formData.append('userName', this.username);
      formData.append('fileName', this.selectedFile.name);
      formData.append('caption', this.caption || '');
      if (this.profilePic) {
        formData.append('profilePic', this.profilePic);
      }

      console.log('FormData fields:', Array.from((formData as any).entries()));

      this.uploadService.uploadFile(formData).subscribe(
        event => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress = Math.round((100 * event.loaded) / event.total);
            console.log(`Upload Progress: ${this.uploadProgress}%`);
          } else if (event.type === HttpEventType.Response) {
            console.log('Upload successful:', event.body);
            this.uploadSuccess = true;
            this.isUploading = false;
            setTimeout(() => {
              this.router.navigate(['/feeds']);
            }, 3000);
          }
        },
        (error: HttpErrorResponse) => {
          console.error('Upload failed:', error);
          if (error.status === 400 && error.error?.errors) {
            this.errorMessage = 'Validation Error: ' + Object.values(error.error.errors).join(', ');
          } else {
            this.errorMessage = 'Upload failed. Please try again later.';
          }
          this.isUploading = false;
        }
      );
    } else {
      this.errorMessage = 'User data or file is missing. Please select a file and try again.';
      console.error('User data or file is missing');
    }
  }
}
