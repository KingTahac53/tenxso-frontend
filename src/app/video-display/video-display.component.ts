import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-video-display',
  templateUrl: './video-display.component.html',
  styleUrls: ['./video-display.component.css'],
})
export class VideoDisplayComponent implements OnInit {
  @Input() videoUrl: string = '';

  // List of supported video formats
  readonly videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'mkv', 'avi'];

  isVideo: boolean = false;

  ngOnInit(): void {
    this.checkIfVideo(this.videoUrl);
  }

  /**
   * Checks if the file is a video based on its extension.
   * @param url The URL of the file.
   */
  private checkIfVideo(url: string): void {
    const fileExtension = url.split('.').pop()?.toLowerCase();
    this.isVideo = this.videoExtensions.includes(fileExtension || '');
  }
}
