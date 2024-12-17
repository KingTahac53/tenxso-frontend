import { Component, OnInit, Optional,Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog,MatDialogRef,MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FeedService } from '../../services/feed.service';
import { SharedService } from '../../services/shared.service';
import { LikesPopupComponent } from '../likes-popup/likes-popup.component';
import { convertActionBinding } from '@angular/compiler/src/compiler_util/expression_converter';

@Component({
  selector: 'app-comments-popup',
  templateUrl: './comments-popup.component.html',
  styleUrls: ['./comments-popup.component.css']
})
export class CommentsPopupComponent implements OnInit {

  commentData:any;
  loading: boolean = false;
  feed:any;
  comment:any;

  constructor(
    private sharedService: SharedService,
    private feedService: FeedService,
    private router: Router,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    console.log(data);
    this.feed=data;
    this.getPostComments(data.postId);
  }

  ngOnInit(): void {
  }

  getPostComments(postId:any) {

    this.feedService.getPostComments(postId).subscribe(
      (response: any) => {
        this.commentData=response;
        this.loading = false;
        //console.log(this.feeds);
      },
      error => {
        this.loading = false;
        console.error('Error loading feeds:', error);
      }
    );
  
  }

  commentPost() {
   
      const formData = new FormData();
      formData.append('PostId', this.feed.postId);  // Required field
      formData.append('CommentContent', this.comment);  // Required field
      

      this.sharedService.getUserId().subscribe(userId => {
        formData.append('CommentAuthorId',userId as string);  // Required field
      });
      this.sharedService.getUsername().subscribe(username => {
        formData.append('CommentAuthorUsername', username as string);  // Required field
      });
      this.sharedService.getProfilePic().subscribe(pic => {
        formData.append('UserProfileUrl', pic as string);  // Required field
      });

      this.feedService.postCommentNew(formData).subscribe(
        (newFeeds: any) => {
          // this.feedData=[];
          // this.feedData=newFeeds.blogPostsMostRecent;
          this.loading = false;
          this.comment='';
          this.getPostComments(this.feed.postId);
        },
        error => {
          this.loading = false;
          console.error('Error loading feeds:', error);
        }
      );
    
  }

  goToChatBox(feedInfo:any){
    console.log(feedInfo);
     this.sharedService.setChatUserInfo(
       feedInfo.authorId,
       feedInfo.authorUsername,
       feedInfo.title
     );
     this.router.navigate(['/messages']);
   }

   showLikes(feedInfo:any){

    const dialogRef = this.dialog.open(LikesPopupComponent, {
      width: '400px', // You can adjust the size as needed
      data: {
          postId:feedInfo.postId 
    } // If you need to pass any data, do so here
    });

    dialogRef.afterClosed().subscribe(result => {
    
      // Handle result if needed
    });

  }

  likePost(feedInfo:any) {
    
   }
}
