import { Component, OnInit, Optional,Inject } from '@angular/core';
import { MatDialogRef,MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FeedService } from '../../services/feed.service';

@Component({
  selector: 'app-likes-popup',
  templateUrl: './likes-popup.component.html',
  styleUrls: ['./likes-popup.component.css']
})
export class LikesPopupComponent implements OnInit {
  likeData:any;
  inputData:any;
  loading: boolean = false;

  constructor(private feedService: FeedService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.getPostLikes(data.postId);
  }

  ngOnInit(): void {
    
  }

  getPostLikes(postId:any) {

      this.feedService.getPostLikes(postId).subscribe(
        (likes: any) => {
          this.likeData=likes;
          this.loading = false;
          //console.log(this.feeds);
        },
        error => {
          this.loading = false;
          console.error('Error loading feeds:', error);
        }
      );
    
  }

}
