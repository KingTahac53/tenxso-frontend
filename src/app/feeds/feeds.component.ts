import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { FeedService } from "../services/feed.service";
import { SharedService } from "../services/shared.service";
// import { SignalRService } from "../services/signal-r.service";
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

  // --- Report Popup Properties ---
  reportPopupOpen: boolean = false;
  selectedFeedForReport: any = null;
  selectedReportReason: string = "";
  reportReasons: string[] = [
    "Spam",
    "Inappropriate Content",
    "Harassment",
    "Hate Speech",
  ];
  reportSubmitted: boolean = false;
  reportedFeed: any = null;

  private scrollListener!: () => void;

  constructor(
    private feedService: FeedService,
    private sharedService: SharedService,
    // private signalRService: SignalRService,
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
          const newFeeds = response.blogPostsMostRecent || [];
          if (newFeeds.length > 0) {
            newFeeds.forEach((feed: any) => {
              feed.showComments = false;
              feed.newComment = "";
              feed.dropdownOpen = false; // For post-level dropdown
              // For each comment, add inline editing properties:
              if (feed.comments && feed.comments.length > 0) {
                feed.comments.forEach((comment: any) => {
                  comment.editing = false;
                  comment.editingContent = "";
                  comment.dropdownOpen = false; // For comment dropdown
                });
              }
              // Load comments for each feed.
              this.feedService
                .getPostComments(feed.postId)
                .subscribe((comments: any) => {
                  feed.comments = comments;
                  feed.commentCount = comments.length;
                  feed.comments.forEach((comment: any) => {
                    comment.editing = false;
                    comment.editingContent = "";
                    comment.dropdownOpen = false;
                  });
                });
            });
            this.feeds = [...this.feeds, ...newFeeds];
            this.pageNumber++;
            setTimeout(() => this.initializeVideoPlayers(), 0);
          } else {
            this.allFeedsLoaded = true;
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
    this.feedService.getFeeds(pageNumber, pageSize, this.userId).subscribe(
      (response: any) => {
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
              feed.comments.forEach((comment: any) => {
                comment.editing = false;
                comment.editingContent = "";
                comment.dropdownOpen = false;
              });
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
    this.feeds.forEach((feed) => {
      const playerId = `video-player-${feed.postId}`;
      if (!this.players[feed.postId]) {
        const playerElement = document.getElementById(playerId);
        if (playerElement) {
          try {
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
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;
    if (scrollTop + clientHeight >= scrollHeight - 100 && !this.loading) {
      this.loadFeeds();
    }
  }

  disposeVideoPlayers(): void {
    Object.values(this.players).forEach((player) => player && player.dispose());
    this.players = {};
  }

  ngOnDestroy(): void {
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
    // this.signalRService.sendBellCount(feed.authorId, "1");
    this.feedService.likeUnlikePost(formData).subscribe(
      () => {},
      (error) => console.error("Error liking/unliking post:", error)
    );
  }

  // --- Inline Comment Editing Functions ---

  startEditingComment(comment: any): void {
    comment.editing = true;
    comment.dropdownOpen = false;
    comment.editingContent = comment.commentContent;
  }

  cancelEditingComment(comment: any): void {
    comment.editing = false;
    comment.editingContent = "";
  }

  saveEditedComment(comment: any, feed: any): void {
    if (!comment.editingContent.trim()) return;
    // Directly send the updated comment text as plain text (wrapped in a JSON object)
    this.feedService
      .updatePostComment(comment.commentId, comment.editingContent)
      .subscribe(
        () => {
          comment.editing = false;
          comment.editingContent = "";
          comment.dropdownOpen = false;
          this.feedService
            .getPostComments(feed.postId)
            .subscribe((comments: any[]) => {
              feed.comments = comments;
              feed.commentCount = comments.length;
            });
        },
        (error) => console.error("Error updating comment:", error)
      );
  }

  downloadFile(filePath: string): void {
    fetch(filePath, { mode: "cors" })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Network error: ${response.statusText}`);
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
      .catch((error) => console.error("Error downloading file:", error));
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
      (error) => console.error("Error posting comment:", error)
    );
  }

  // Updated editComment method: now sends the updated comment as a plain text string.
  editComment(feed: any, comment: any): void {
    // For instance, use a prompt to get the new comment text.
    const newContent = prompt("Edit your comment:", comment.commentContent);
    if (newContent !== null && newContent.trim().length > 0) {
      this.feedService
        .updatePostComment(comment.commentId, newContent)
        .subscribe(
          () => {
            // Optionally, refresh comments for this feed.
            this.feedService
              .getPostComments(feed.postId)
              .subscribe((comments: any[]) => {
                feed.comments = comments;
              });
          },
          (error) => console.error("Error updating comment:", error)
        );
    }
  }

  // Delete comment method remains similar, using commentId.
  deleteComment(feed: any, comment: any): void {
    this.feedService.deletePostComment(comment.commentId).subscribe(
      () => {
        feed.comments = feed.comments.filter(
          (c: any) => c.commentId !== comment.commentId
        );
        feed.commentCount = feed.comments.length;
      },
      (error) => console.error("Error deleting comment:", error)
    );
  }

  toggleDropdown(feed: any): void {
    feed.dropdownOpen = !feed.dropdownOpen;
  }

  goToChatBox(feed: any): void {
    this.sharedService.setChatUserInfo(
      feed.authorId,
      feed.authorUsername,
      feed.title
    );
    this.router.navigate(["/messages"]);
  }

  reportFeed(feed: any): void {
    console.log("Reporting feed:", feed.postId);
    // (Reporting logic will be implemented in the Report Popup.)
  }

  // --- Report Popup Functions ---

  openReportPopup(feed: any): void {
    this.selectedFeedForReport = feed;
    this.selectedReportReason = "";
    this.reportPopupOpen = true;
    this.reportSubmitted = false;
    this.reportedFeed = feed;
  }

  closeReportPopup(): void {
    this.reportPopupOpen = false;
    this.selectedFeedForReport = null;
    this.reportSubmitted = false;
    this.selectedReportReason = "";
    this.reportedFeed = null;
  }

  submitReport(): void {
    if (!this.selectedFeedForReport || !this.selectedReportReason.trim()) {
      return;
    }
    if (!this.userId) {
      console.error("User ID is undefined. Cannot report post.");
      return;
    }
    const reportData = {
      postId: this.selectedFeedForReport.postId,
      reportedUserId: this.userId,
      reason: this.selectedReportReason.trim(),
    };
    this.feedService.reportPost(reportData).subscribe(
      () => {
        this.reportSubmitted = true;
        // Optionally refresh feeds
        this.refreshFeeds();
        setTimeout(() => {
          this.closeReportPopup();
        }, 3000);
      },
      (error) => {
        console.error("Error reporting post:", error);
      }
    );
  }
}
