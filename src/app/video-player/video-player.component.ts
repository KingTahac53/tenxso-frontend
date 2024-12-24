import {
  Component,
  OnInit,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent implements OnInit, AfterViewInit {
  @Input() src!: string;            // Video source URL
  @Input() poster?: string;         // Optional poster
  @Input() loop = false;            // Loop the video
  @Input() muted = true;            // Start video muted

  @ViewChild('videoElement', { static: false }) videoElementRef!: ElementRef<HTMLVideoElement>;

  isMuted = true;                   // For toggling icon display
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    // Keep local state in sync with @Input() "muted"
    this.isMuted = this.muted;
  }

  ngAfterViewInit(): void {
    // IntersectionObserver to autoplay/pause on scroll
    if ('IntersectionObserver' in window) {
      this.setupIntersectionObserver();
    }
  }

  setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoEl = this.videoElementRef.nativeElement;
          if (entry.isIntersecting) {
            // Attempt to play
            videoEl.play().catch((err) => {
              console.warn('Autoplay error:', err);
            });
          } else {
            // Pause when leaving viewport
            videoEl.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    this.observer.observe(this.videoElementRef.nativeElement);
  }

  toggleMute(event: MouseEvent): void {
    // Prevent click from, for example, pausing or playing the video if you also have click handlers
    event.stopPropagation();

    const videoEl = this.videoElementRef.nativeElement;
    videoEl.muted = !videoEl.muted;
    this.isMuted = videoEl.muted;
  }
  // @Input() src!: string;           // The URL of the video
  // @Input() poster?: string;        // Poster image for the video (optional)
  // @Input() muted: boolean = true;  // Typically, Instagram videos autoplay muted
  // @Input() loop: boolean = false;  // Whether to loop the video
  // @ViewChild('videoElement', { static: false }) videoElementRef!: ElementRef<HTMLVideoElement>;

  // private observer?: IntersectionObserver;

  // constructor() { }

  // ngOnInit(): void { }

  // ngAfterViewInit(): void {
  //   // Create an IntersectionObserver to watch the video element
  //   // and toggle play/pause based on viewport visibility
  //   if ('IntersectionObserver' in window) {
  //     this.setupIntersectionObserver();
  //   }
  // }

  // setupIntersectionObserver(): void {
  //   this.observer = new IntersectionObserver(
  //     (entries) => {
  //       entries.forEach((entry) => {
  //         const videoEl = this.videoElementRef.nativeElement;
  //         if (entry.isIntersecting) {
  //           // Autoplay if the video is in the viewport
  //           videoEl.play().catch((err) => {
  //             console.warn('Autoplay error:', err);
  //           });
  //         } else {
  //           // Pause if the video leaves the viewport
  //           videoEl.pause();
  //         }
  //       });
  //     },
  //     { threshold: 0.5 }
  //     // threshold=0.5 means the observer will consider the video "visible"
  //     // if at least 50% is within the viewport.
  //   );

  //   this.observer.observe(this.videoElementRef.nativeElement);
  // }
}
