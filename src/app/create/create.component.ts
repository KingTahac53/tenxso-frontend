import { Component, OnInit } from "@angular/core";
import { UploadService } from "../services/upload.service";
import { SharedService } from "../services/shared.service";
import { HttpEventType, HttpErrorResponse } from "@angular/common/http";
import { Router } from "@angular/router";

@Component({
  selector: "app-create",
  templateUrl: "./create.component.html",
  styleUrls: ["./create.component.css"],
})
export class CreateComponent implements OnInit {
  // Show modal on component load
  isModalOpen: boolean = true;

  selectedFile: File | null = null;
  uploadProgress: number = 0;
  userId: string | null = null;
  username: string | null = null;
  profilePic: string | null = null;
  caption: string = "";
  // We use one preview property for both image and video
  imgPreview: any;
  isUploading: boolean = false;
  uploadSuccess: boolean = false;
  errorMessage: string | null = null;

  private readonly MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

  private readonly ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  private readonly ALLOWED_VIDEO_TYPES = [
    "video/mp4",
    "video/ogg",
    "video/webm",
    "video/avi",
    "video/mpeg",
  ];

  videoExtensions =
    /\.(mp4|m4v|mov|wmv|avi|flv|mkv|webm|3gp|3g2|ts|m2ts|mts|vob|ogv|rm|divx|asf|f4v|mpeg|mpg)$/i;
  audioExtensions =
    /\.(mp3|wav|aac|ogg|m4a|flac|wma|aiff|alac|amr|opus|mid|midi|caf|ra|mka)$/i;
  imageExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;

  constructor(
    private uploadService: UploadService,
    private sharedService: SharedService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = this.getCookie("userId");
    this.username = this.getCookie("username");
    this.profilePic =
      localStorage.getItem("profilePic") || this.getCookie("profilePic");
  }

  onFileSelected(event: any): void {
    this.errorMessage = null;
    this.selectedFile = event.target.files[0] || null;
    this.imgPreview = null;

    if (!this.selectedFile) {
      return;
    }

    if (this.selectedFile.size > this.MAX_FILE_SIZE) {
      this.errorMessage = `File size exceeds ${
        this.MAX_FILE_SIZE / (1024 * 1024)
      } MB. Please select a smaller file.`;
      this.selectedFile = null;
      return;
    }

    if (
      !(
        this.imageExtensions.test(this.selectedFile.name.toLowerCase()) ||
        this.videoExtensions.test(this.selectedFile.name.toLowerCase()) ||
        this.audioExtensions.test(this.selectedFile.name.toLowerCase())
      )
    ) {
      this.errorMessage =
        "Invalid file type. Only images and videos are allowed.";
      this.selectedFile = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      // For both images and videos, set the preview DataURL
      this.imgPreview = e.target.result;
    };
    reader.readAsDataURL(this.selectedFile);
  }

  onCaptionChange(): void {
    this.caption = this.caption.replace(/[<>]/g, "");
  }

  getCookie(name: string): string | null {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length);
      }
    }
    return null;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.router.navigate(["/feeds"]);
  }

  uploadFile(): void {
    const userId = this.getCookie("userId");
    const username = this.getCookie("username");
    if (this.selectedFile && userId && username) {
      this.isUploading = true;
      this.errorMessage = null;
      const formData = new FormData();

      formData.append("file", this.selectedFile);
      formData.append("userId", userId);
      formData.append("userName", username);
      formData.append("fileName", this.selectedFile.name);

      // Only append caption if it's not empty
      if (this.caption && this.caption.length > 0) {
        formData.append("caption", this.caption);
      }

      if (this.profilePic) {
        formData.append("profilePic", this.profilePic);
      }

      this.uploadService.uploadFile(formData).subscribe(
        (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress = Math.round(
              (100 * event.loaded) / event.total
            );
          } else if (event.type === HttpEventType.Response) {
            this.uploadSuccess = true;
            this.isUploading = false;
            setTimeout(() => {
              this.router.navigate(["/feeds"]);
            }, 3000);
          }
        },
        (error: HttpErrorResponse) => {
          if (error.status === 400 && error.error?.errors) {
            this.errorMessage =
              "Validation Error: " +
              Object.values(error.error.errors).join(", ");
          } else {
            this.errorMessage = "Upload failed. Please try again later.";
          }
          this.isUploading = false;
        }
      );
    } else {
      this.errorMessage =
        "User data or file is missing. Please select a file and try again.";
    }
  }
}
