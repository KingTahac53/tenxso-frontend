import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { Feed } from "../models/feed.model";
import { environment } from "../environment"; // Ensure the path is correct

@Injectable({
  providedIn: "root",
})
export class FeedService {
  private apiUrl = environment.apiUrl; // Backend API base URL

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

  // Updated: Now sends the updated comment as a plain text payload.
  // In feed.service.ts
  updatePostComment(
    commentId: string,
    updatedComment: string
  ): Observable<any> {
    // Trim the input
    const trimmed = updatedComment.trim();
    // Check if the string is already wrapped in double quotes.
    const body =
      trimmed.startsWith('"') && trimmed.endsWith('"')
        ? trimmed
        : JSON.stringify(trimmed);

    const headers = new HttpHeaders({ "Content-Type": "text/plain" });
    return this.http.put(
      `${this.apiUrl}/UserPost/update-post-comment/${commentId}`,
      body,
      { headers, responseType: "text" } // adjust responseType if needed
    );
  }

  // New: Delete comment API (unchanged, uses commentId in URL)
  deletePostComment(commentId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/UserPost/delete-post-comment/${commentId}`
    );
  }

  getChats(userId: string): Observable<Feed[]> {
    let params = new HttpParams().set("userId", userId.toString());
    return this.http.get<any[]>(`${this.apiUrl}/Feeds/getChats`, { params });
  }
}
