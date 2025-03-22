import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { FeedService } from "../services/feed.service";
import { SharedService } from "../services/shared.service";
import { SignalRService } from "../services/signal-r.service";
import videojs from "video.js";

type VideoJsPlayer = ReturnType<typeof videojs>;

@Component({
  selector: "feedspage",
  templateUrl: "./feeds.component.html",
  styleUrls: ["./feeds.component.css"],
})
export class FeedsComponent implements OnInit, OnDestroy {
  feeds: any[] = [];
  players: { [key: string]: VideoJsPlayer } = {};
  pageNumber = 1;
  pageSize = 5;
  loading = false;
  allFeedsLoaded = false;
  userId: string | undefined;
  username: string | undefined;
  profilePic: string | undefined;

  private scrollListener!: () => void;

  constructor(
    private feedService: FeedService,
    private sharedService: SharedService,
    private signalRService: SignalRService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log("Initializing FeedsComponent...");
    this.sharedService.getUserId().subscribe((userId) => {
      this.userId = userId || undefined;
      console.log("User ID:", this.userId);
    });
    this.sharedService.getUsername().subscribe((username) => {
      this.username = username || undefined;
      console.log("Username:", this.username);
    });
    // Retrieve the logged in user's profile pic from cookies
    this.profilePic =
      this.getCookie("profilePic") || "assets/images/default-avatar.jpg";

    this.scrollListener = this.onScroll.bind(this);
    window.addEventListener("scroll", this.scrollListener);
    this.loadFeeds();
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

  loadFeeds(): void {
    if (this.loading || this.allFeedsLoaded) {
      console.log("Already loading or all feeds loaded.");
      return;
    }
    this.loading = true;
    console.log(
      `Loading feeds - Page: ${this.pageNumber}, Size: ${this.pageSize}`
    );
    this.feedService
      .getFeeds(this.pageNumber, this.pageSize, this.userId)
      .subscribe(
        (response: any) => {
          console.log("Feed response:", response);
          const newFeeds = response.blogPostsMostRecent || [];
          if (newFeeds.length > 0) {
            newFeeds.forEach((feed: any) => {
              feed.showComments = false;
              feed.newComment = "";
              feed.dropdownOpen = false; // Initialize dropdown toggle
              this.feedService
                .getPostComments(feed.postId)
                .subscribe((comments: any) => {
                  feed.comments = comments;
                  feed.commentCount = comments.length;
                });
            });
            this.feeds = [...this.feeds, ...newFeeds];
            console.log("New feeds added:", newFeeds);
            this.pageNumber++;
            setTimeout(() => this.initializeVideoPlayers(), 0);
          } else {
            this.allFeedsLoaded = true;
            console.log("No more feeds to load.");
          }
          this.loading = false;
        },
        (error) => {
          console.error("Error loading feeds:", error);
          this.loading = false;
        }
      );
  }

  refreshFeeds(): void {
    const pageSize = this.feeds.length;
    const pageNumber = 1;
    this.loading = true;
    console.log(`Loading feeds - Page: ${pageNumber}, Size: ${pageSize}`);
    this.feedService.getFeeds(pageNumber, pageSize, this.userId).subscribe(
      (response: any) => {
        console.log("Feed response:", response);
        const newFeeds = response.blogPostsMostRecent || [];
        this.feeds = newFeeds;
        newFeeds.forEach((feed: any) => {
          feed.showComments = false;
          feed.newComment = "";
          feed.dropdownOpen = false;
          this.feedService
            .getPostComments(feed.postId)
            .subscribe((comments: any) => {
              feed.comments = comments;
              feed.commentCount = comments.length;
            });
        });
        setTimeout(() => this.initializeVideoPlayers(), 0);
        this.loading = false;
      },
      (error) => {
        console.error("Error loading feeds:", error);
        this.loading = false;
      }
    );
  }

  initializeVideoPlayers(): void {
    console.log("Initializing video players...");
    this.feeds.forEach((feed) => {
      const playerId = `video-player-${feed.postId}`;
      if (!this.players[feed.postId]) {
        const playerElement = document.getElementById(playerId);
        if (playerElement) {
          try {
            console.log(
              `Initializing Video.js player for feed: ${feed.postId}`
            );
            this.players[feed.postId] = videojs(playerElement, {
              autoplay: true,
              controls: true,
              muted: true,
              preload: "auto",
              loop: true,
            });
          } catch (error) {
            console.error(
              `Error initializing Video.js for feed ${feed.postId}:`,
              error
            );
          }
        } else {
          console.warn(`Player element not found for feed: ${feed.postId}`);
        }
      }
    });
  }

  onScroll(): void {
    console.log("Scroll event triggered...");
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;
    if (scrollTop + clientHeight >= scrollHeight - 100 && !this.loading) {
      console.log("Scrolled near the bottom, loading more feeds...");
      this.loadFeeds();
    }
  }

  disposeVideoPlayers(): void {
    console.log("Disposing all video players...");
    Object.values(this.players).forEach((player) => {
      if (player) {
        console.log("Disposing player:", player);
        player.dispose();
      }
    });
    this.players = {};
  }

  ngOnDestroy(): void {
    console.log("Cleaning up FeedsComponent...");
    window.removeEventListener("scroll", this.scrollListener);
    this.disposeVideoPlayers();
  }

  likePost(feed: any): void {
    if (!this.userId || !this.username) return;
    if (feed.likeFlag == 0) {
      feed.likeFlag = 1;
      feed.likeCount = Number(feed.likeCount) + 1;
    } else {
      feed.likeFlag = 0;
      feed.likeCount = Math.max(Number(feed.likeCount) - 1, 0);
    }
    const formData = new FormData();
    formData.append("LikeAuthorId", this.userId);
    formData.append("LikeAuthorUsername", this.username);
    formData.append("postId", feed.postId);
    this.sharedService.getProfilePic().subscribe((pic) => {
      formData.append("UserProfileUrl", pic as string);
    });
    console.log("likePostStart");
    this.signalRService.sendBellCount(feed.authorId, "1");
    this.feedService.likeUnlikePost(formData).subscribe(
      (response: any) => {},
      (error) => {
        this.loading = false;
        console.error("Error liking/unliking post:", error);
      }
    );
  }

  downloadFile(filePath: string): void {
    console.log(`Attempting to download file from: ${filePath}`);
    fetch(filePath, { mode: "cors" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Network error: ${response.statusText}`);
        }
        return response.blob();
      })
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = blobUrl;
        const parts = filePath.split("/");
        a.download = parts[parts.length - 1] || "download";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((error) => {
        console.error("Error downloading file:", error);
      });
  }

  isVideo(url: string): boolean {
    const videoExtensions = ["mp4", "webm", "ogg", "mov", "mkv", "avi"];
    const fileExtension = url.split(".").pop()?.toLowerCase();
    return videoExtensions.includes(fileExtension || "");
  }

  toggleComments(feed: any): void {
    feed.showComments = !feed.showComments;
    if (feed.showComments && (!feed.comments || feed.comments.length === 0)) {
      this.feedService
        .getPostComments(feed.postId)
        .subscribe((comments: any) => {
          feed.comments = comments;
          feed.commentCount = comments.length;
        });
    }
  }

  postComment(feed: any): void {
    if (!feed.newComment || !feed.newComment.trim()) return;
    const commentData = {
      postId: feed.postId,
      commentAuthorId: this.userId,
      commentAuthorUsername: this.username,
      userProfileUrl: this.getCookie("profilePic") || "",
      commentContent: feed.newComment,
    };
    this.feedService.postComment(commentData).subscribe(
      () => {
        this.feedService
          .getPostComments(feed.postId)
          .subscribe((comments: any) => {
            feed.comments = comments;
            feed.commentCount = comments.length;
            feed.newComment = "";
          });
      },
      (error) => {
        console.error("Error posting comment:", error);
      }
    );
  }

  toggleDropdown(feed: any): void {
    feed.dropdownOpen = !feed.dropdownOpen;
  }

  goToChatBox(feed: any): void {
    console.log(feed);
    this.sharedService.setChatUserInfo(
      feed.authorId,
      feed.authorUsername,
      feed.authorProfilePic || feed.content
    );
    localStorage.setItem("userId", feed.authorId);
    localStorage.setItem("username", feed.authorUsername);
    localStorage.setItem("profilePic", feed.authorProfilePic || feed.content);
    this.router.navigate(["/messages"]);
  }

  reportFeed(feed: any): void {
    console.log("Reporting feed:", feed.postId);
    // Implement further report logic as needed.
  }
}
