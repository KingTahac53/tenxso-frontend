import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { Feed } from "../models/feed.model";
import { environment } from "../environment";

@Injectable({
  providedIn: "root",
})
export class FeedService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getFeeds(
    pageNumber: number,
    pageSize: number,
    userId?: string
  ): Observable<Feed[]> {
    let params = new HttpParams()
      .set("pageNumber", pageNumber.toString())
      .set("pageSize", pageSize.toString());
    if (userId) {
      params = params.set("userId", userId);
    }
    const headers = new HttpHeaders({
      "Cache-Control": "public, max-age=3600",
      Pragma: "cache",
    });
    return this.http.get<Feed[]>(`${this.apiUrl}/Feeds/getUserFeeds`, {
      params,
      headers,
    });
  }

  likeUnlikePost(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/UserPost/like-unlike-post`, data);
  }

  getPostLikes(postId: string): Observable<any[]> {
    let params = new HttpParams().set("postId", postId.toString());
    return this.http.get<any[]>(`${this.apiUrl}/UserPost/post-likes`, {
      params,
    });
  }

  getPostComments(postId: string): Observable<any[]> {
    let params = new HttpParams().set("postId", postId.toString());
    return this.http.get<any[]>(`${this.apiUrl}/UserPost/post-comments`, {
      params,
    });
  }

  postComment(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/UserPost/create-post-comment`, data);
  }

  updatePostComment(
    commentId: string,
    updatedComment: string
  ): Observable<any> {
    // Send the updated comment as JSON with key "commentContent"
    const body = { commentContent: updatedComment.trim() };
    const headers = new HttpHeaders({ "Content-Type": "application/json" });
    return this.http.put(
      `${this.apiUrl}/UserPost/update-post-comment/${commentId}`,
      body,
      { headers, responseType: "text" }
    );
  }

  deletePostComment(commentId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/UserPost/delete-post-comment/${commentId}`
    );
  }

  getChats(userId: string): Observable<Feed[]> {
    let params = new HttpParams().set("userId", userId.toString());
    return this.http.get<any[]>(`${this.apiUrl}/Feeds/getChats`, { params });
  }

  reportPost(reportData: {
    postId: string;
    reportedUserId: string;
    reason: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/UserPost/report-post`, reportData);
  }
}
