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
  feeds: any[] = [];
  players: { [key: string]: VideoJsPlayer } = {};
  userId: string | undefined;
  username: string | undefined;
  loading = false;
  noFeedsMessage = '';
  pageNumber = 1;
  pageSize = 5;
  allFeedsLoaded = false;

  constructor(
    private feedService: FeedService,
    private sharedService: SharedService,
    private signalRService: SignalRService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sharedService.getUserId().subscribe((userId) => (this.userId = userId || undefined));
    this.sharedService.getUsername().subscribe((username) => (this.username = username || undefined));
    this.loadFeeds();
    window.addEventListener('scroll', this.onScroll.bind(this));
  }

  loadFeeds(): void {
    if (this.loading || this.allFeedsLoaded) return;

    this.loading = true;
    this.feedService.getFeeds(this.pageNumber, this.pageSize, this.userId).subscribe(
      (response: any) => {
        const newFeeds = response.blogPostsMostRecent || [];
        if (newFeeds.length > 0) {
          this.feeds = [...this.feeds, ...newFeeds];
          this.pageNumber++;
          setTimeout(() => this.initializeVideoPlayers(), 0);
        } else {
          this.allFeedsLoaded = true;
          if (this.feeds.length === 0) {
            this.noFeedsMessage = 'No feeds available at the moment.';
          }
        }
        this.loading = false;
      },
      (error) => {
        console.error('Error loading feeds:', error);
        this.noFeedsMessage = 'An error occurred while fetching feeds. Please try again later.';
        this.loading = false;
      }
    );
  }

  initializeVideoPlayers(): void {
    this.feeds.forEach((feed) => {
      const playerId = `video-player-${feed.postId}`;
      const playerElement = document.getElementById(playerId);

      if (this.isVideo(feed.content)) {
        if (playerElement && !this.players[playerId]) {
          this.players[playerId] = videojs(playerElement, {
            autoplay: true,
            controls: true,
            muted: true,
            preload: 'auto',
            loop: true,
          });
        }
      }
    });
  }



  likePost(feed: any): void {
    if (!this.userId || !this.username) return;

    feed.likeFlag = feed.likeFlag === 0 ? 1 : 0;
    feed.likeCount = feed.likeFlag ? feed.likeCount + 1 : feed.likeCount - 1;

    const formData = new FormData();
    formData.append('LikeAuthorId', this.userId);
    formData.append('LikeAuthorUsername', this.username);
    formData.append('postId', feed.postId);

    this.sharedService.getProfilePic().subscribe((pic) => {
      formData.append('UserProfileUrl', pic as string);
      this.feedService.likePost(formData).subscribe();
    });
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

  disposeVideoPlayers(): void {
    Object.values(this.players).forEach((player) => player.dispose());
    this.players = {};
  }

  onScroll(): void {
    if (document.documentElement.scrollTop + document.documentElement.clientHeight >= document.documentElement.scrollHeight - 100) {
      this.loadFeeds();
    }
  }

  ngOnDestroy(): void {
    this.disposeVideoPlayers();
    window.removeEventListener('scroll', this.onScroll.bind(this));
  }

  isVideo(contentUrl: string): boolean {
    return /\.(mp4|mov|webm|ogg|avi|mkv)$/i.test(contentUrl);
  }
}
