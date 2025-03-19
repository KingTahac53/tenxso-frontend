import { Component, OnInit, EventEmitter, Output, Inject } from "@angular/core";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FeedService } from "../../services/feed.service";
import { SharedService } from "../../services/shared.service";
import { LikesPopupComponent } from "../likes-popup/likes-popup.component";

@Component({
  selector: "app-comments-popup",
  templateUrl: "./comments-popup.component.html",
  styleUrls: ["./comments-popup.component.css"],
})
export class CommentsPopupComponent implements OnInit {
  @Output() commentPosted = new EventEmitter<any>();
  commentData: any[] = [];
  likesData: any[] = [];
  comment: string = "";
  loading: boolean = false;
  feed: any;
  userId: string | null;
  username: string | null;
  profilePic: string | null;
  isLiked: boolean = false;

  constructor(
    private sharedService: SharedService,
    private feedService: FeedService,
    private router: Router,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.feed = data;
    this.userId = this.getCookie("userId");
    this.username = this.getCookie("username");
    this.profilePic = this.getCookie("profilePic");
  }

  ngOnInit(): void {
    this.getPostComments(this.feed.postId);
    this.getPostLikes(this.feed.postId);
  }

  getPostComments(postId: string): void {
    this.feedService.getPostComments(postId).subscribe(
      (response: any) => {
        this.commentData = response;
      },
      (error) => console.error("Error fetching comments:", error)
    );
  }

  getPostLikes(postId: string): void {
    this.feedService.getPostLikes(postId).subscribe(
      (response: any) => {
        this.likesData = response;
        this.isLiked = this.likesData.some(
          (like) => like.likeAuthorId === this.userId
        );
      },
      (error) => console.error("Error fetching likes:", error)
    );
  }

  commentPost(): void {
    if (!this.comment.trim()) return;
    const commentData = {
      postId: this.feed.postId,
      commentAuthorId: this.userId,
      commentAuthorUsername: this.username,
      userProfileUrl: this.profilePic,
      commentContent: this.comment,
    };
    this.feedService.postComment(commentData).subscribe(
      () => {
        this.comment = "";
        this.getPostComments(this.feed.postId);
        this.commentPosted.emit({ postId: this.feed.postId });
      },
      (error) => console.error("Error posting comment:", error)
    );
  }

  updateComment(commentId: string, newContent: string): void {
    const updateData = { commentContent: newContent };
    this.feedService.updatePostComment(commentId, updateData).subscribe(
      () => this.getPostComments(this.feed.postId),
      (error) => console.error("Error updating comment:", error)
    );
  }

  deleteComment(commentId: string): void {
    this.feedService.deletePostComment(commentId).subscribe(
      () => this.getPostComments(this.feed.postId),
      (error) => console.error("Error deleting comment:", error)
    );
  }

  likePost(): void {
    const likeData = {
      postId: this.feed.postId,
      likeAuthorId: this.userId,
      likeAuthorUsername: this.username,
      userProfileUrl: this.profilePic,
    };
    this.feedService.likeUnlikePost(likeData).subscribe(
      () => this.getPostLikes(this.feed.postId),
      (error) => console.error("Error liking/unliking post:", error)
    );
  }

  showLikes(): void {
    this.dialog
      .open(LikesPopupComponent, {
        width: "400px",
        data: { postId: this.feed.postId },
      })
      .afterClosed()
      .subscribe(() => this.getPostLikes(this.feed.postId));
  }

  getCookie(name: string): string | null {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(";");
    for (let c of ca) {
      c = c.trim();
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length);
      }
    }
    return null;
  }
}
