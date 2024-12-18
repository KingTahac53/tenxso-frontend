import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { FeedService } from '../services/feed.service';
import { SharedService } from '../services/shared.service';
import { SignalRService } from '../services/signal-r.service';
import videojs from 'video.js';
import { CommentsPopupComponent } from '../modals/comments-popup/comments-popup.component';

type VideoJsPlayer = ReturnType<typeof videojs>;

@Component({
  selector: 'feedspage',
  templateUrl: './feeds.component.html',
  styleUrls: ['./feeds.component.css'],
})
export class FeedsComponent implements OnInit, OnDestroy {
  feeds: any[] = []; // Array to store feed data
  players: { [key: string]: VideoJsPlayer } = {}; // Map to store Video.js players
  pageNumber = 1; // Current page number
  pageSize = 8; // Number of feeds to load per API call
  loading = false; // Loading state
  allFeedsLoaded = false; // Flag for no more feeds
  userId: string | undefined;
  username: string | undefined;
  private scrollListener!: () => void; // Fixed with non-null assertion operator

  constructor(
    private feedService: FeedService,
    private sharedService: SharedService,
    private signalRService: SignalRService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('Initializing FeedsComponent...');

    // Fetch user data
    this.sharedService.getUserId().subscribe((userId) => {
      this.userId = userId || undefined;
      console.log('User ID:', this.userId);
    });

    this.sharedService.getUsername().subscribe((username) => {
      this.username = username || undefined;
      console.log('Username:', this.username);
    });

    // Bind scroll event for infinite scroll
    this.scrollListener = this.onScroll.bind(this);
    window.addEventListener('scroll', this.scrollListener);

    // Load initial feeds
    this.loadFeeds();
  }

  /**
   * Load feeds from the server.
   */
  loadFeeds(): void {
    if (this.loading || this.allFeedsLoaded) {
      console.log('Already loading or all feeds loaded.');
      return;
    }

    this.loading = true; // Set loading state
    console.log(`Loading feeds - Page: ${this.pageNumber}, Size: ${this.pageSize}`);

    this.feedService.getFeeds(this.pageNumber, this.pageSize, this.userId).subscribe(
      (response: any) => {
        console.log('Feed response:', response);
        const newFeeds = response.blogPostsMostRecent || [];
        if (newFeeds.length > 0) {
          this.feeds = [...this.feeds, ...newFeeds];
          console.log('New feeds added:', newFeeds);
          this.pageNumber++; // Increment page for next call
          setTimeout(() => this.initializeVideoPlayers(), 0); // Initialize video players after DOM updates
        } else {
          this.allFeedsLoaded = true;
          console.log('No more feeds to load.');
        }
        this.loading = false;
      },
      (error) => {
        console.error('Error loading feeds:', error);
        this.loading = false; // Reset loading even on error
      }
    );
  }

  /**
   * Initialize Video.js players for new feeds.
   */
  initializeVideoPlayers(): void {
    console.log('Initializing video players...');
    this.feeds.forEach((feed) => {
      const playerId = `video-player-${feed.postId}`;
      if (!this.players[feed.postId]) {
        const playerElement = document.getElementById(playerId);
        if (playerElement) {
          try {
            console.log(`Initializing Video.js player for feed: ${feed.postId}`);
            this.players[feed.postId] = videojs(playerElement, {
              autoplay: true,
              controls: true,
              muted: true,
              preload: 'auto',
              loop: true,
            });
          } catch (error) {
            console.error(`Error initializing Video.js for feed ${feed.postId}:`, error);
          }
        } else {
          console.warn(`Player element not found for feed: ${feed.postId}`);
        }
      }
    });
  }

  /**
   * Infinite scroll: Load more feeds when nearing the bottom of the page.
   */
  onScroll(): void {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 100 && !this.loading) {
      console.log('Scrolled near the bottom, loading more feeds...');
      this.loadFeeds(); // Load next set of feeds
    }
  }

  /**
   * Dispose Video.js players.
   */
  disposeVideoPlayers(): void {
    console.log('Disposing all video players...');
    Object.values(this.players).forEach((player) => {
      if (player) {
        console.log('Disposing player:', player);
        player.dispose();
      }
    });
    this.players = {}; // Clear the players map
  }

  /**
   * Clean up resources on component destruction.
   */
  ngOnDestroy(): void {
    console.log('Cleaning up FeedsComponent...');
    window.removeEventListener('scroll', this.scrollListener);
    this.disposeVideoPlayers();
  }

  likePost(feedInfo:any) {
  
    if (this.userId && this.username) {

      if(feedInfo.likeFlag==0){
        feedInfo.likeFlag=1;
        feedInfo.likeCount=Number(feedInfo.likeCount) + 1;
      }
      else{
        feedInfo.likeFlag=0;
        feedInfo.likeCount=Number(feedInfo.likeCount) - 1;
      }
     
    const formData = new FormData();
  
    // Add required fields to formData
      formData.append('LikeAuthorId', this.userId);  // Required field
      formData.append('LikeAuthorUsername', this.username);  // Required field
      formData.append('postId', feedInfo.postId);  // Required field
     
      this.sharedService.getProfilePic().subscribe(pic => {
        formData.append('UserProfileUrl', pic as string);  // Required field
      });
      console.log("likePostStart");
      this.signalRService.sendBellCount(feedInfo.authorId,"1"); 
      this.feedService.likePost(formData).subscribe(
        (response: any) => {
          if(response!=null)
          {
            //console.log("JustOnce");
          }

          //for (let i = 0; i < this.feedData.length; i++) {
           //if(feedInfo.postId==this.feedData[i].postId){
            //this.feedData[i].likeFlag=1;
            //this.feedData[i].likeCount= this.feedData[i].likeCount + 1;
           //}
          //}

        },
        error => {
          this.loading = false;
          console.error('Error loading feeds:', error);
        }
      );
    }
  }
  

  /**
   * Download a file.
   */
  downloadFile(filePath: string): void {
    console.log(`Downloading file from path: ${filePath}`);
    const link = document.createElement('a');
    link.href = filePath;
    link.download = filePath.split('/').pop() || 'download';
    link.click();
  }



  /**
   * Check if a URL points to a video.
   */
  isVideo(url: string): boolean {
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'mkv', 'avi'];
    const fileExtension = url.split('.').pop()?.toLowerCase();
    const isVideoFile = videoExtensions.includes(fileExtension || '');
    console.log(`URL: ${url}, Is Video: ${isVideoFile}`);
    return isVideoFile;
  }

  showComments(feedInfo:any){

    const dialogRef = this.dialog.open(CommentsPopupComponent, {
      width: 'auto%', // You can adjust the size as needed
      data: feedInfo // If you need to pass any data, do so here
    });

    dialogRef.afterClosed().subscribe(result => {
      // Handle result if needed
    });
  }

  goToChatBox(feedInfo:any){
    console.log(feedInfo);
     this.sharedService.setChatUserInfo(
       feedInfo.authorId,
       feedInfo.authorUsername,
       feedInfo.title
     );
 
     localStorage.setItem('userId', feedInfo.authorId);
     localStorage.setItem('username', feedInfo.authorUsername);
     localStorage.setItem('profilePic', feedInfo.title);
     this.router.navigate(['/messages']);
   }
}
