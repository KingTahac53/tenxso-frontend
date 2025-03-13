import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpParams,
  HttpEvent,
  HttpRequest,
  HttpHeaders,
} from "@angular/common/http";
import { Observable } from "rxjs";
import { Feed } from "../models/feed.model";
import { environment } from "../environment"; // Ensure the path is correct

@Injectable({
  providedIn: "root",
})
export class FeedService {
  private apiUrl = environment.apiUrl; // Backend API base URL

  constructor(private http: HttpClient) {}

  /**
   * Fetch paginated feeds with support for infinite scrolling.
   * @param pageNumber The current page number to fetch.
   * @param pageSize The number of feeds to fetch per page.
   * @param userId Optional userId to fetch feeds for a specific user.
   * @returns An Observable containing the paginated feeds.
   */
  getFeeds(
    pageNumber: number,
    pageSize: number,
    userId?: string
  ): Observable<Feed[]> {
    let params = new HttpParams()
      .set("pageNumber", pageNumber.toString()) // Set the current page number
      .set("pageSize", pageSize.toString()); // Set the number of items per page

    if (userId) {
      params = params.set("userId", userId); // Add userId if provided
    }
    // Add caching headers
    const headers = new HttpHeaders({
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      Pragma: "cache",
    });
    // Return the API call observable for paginated feeds
    return this.http.get<Feed[]>(`${this.apiUrl}/Feeds/getUserFeeds`, {
      params,
    });
  }

  /**
   * Like or Unlike a post.
   * @param data The like/unlike request payload.
   * @returns An Observable for tracking the HTTP request status.
   */
  likeUnlikePost(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/UserPost/like-unlike-post`, data);
  }

  /**
   * Fetch all likes for a specific post.
   * @param postId The ID of the post to fetch likes for.
   * @returns An Observable containing the list of likes.
   */
  getPostLikes(postId: string): Observable<any[]> {
    let params = new HttpParams().set("postId", postId.toString());
    return this.http.get<any[]>(`${this.apiUrl}/UserPost/post-likes`, {
      params,
    });
  }

  /**
   * Fetch all comments for a specific post.
   * @param postId The ID of the post to fetch comments for.
   * @returns An Observable containing the list of comments.
   */
  getPostComments(postId: string): Observable<any[]> {
    let params = new HttpParams().set("postId", postId.toString());
    return this.http.get<any[]>(`${this.apiUrl}/UserPost/post-comments`, {
      params,
    });
  }

  /**
   * Post a new comment.
   * @param data The comment request payload.
   * @returns An Observable for tracking the HTTP request status.
   */
  postComment(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/UserPost/create-post-comment`, data);
  }

  /**
   * Update an existing comment.
   * @param commentId The ID of the comment to update.
   * @param data The updated comment content.
   * @returns An Observable for tracking the HTTP request status.
   */
  updatePostComment(commentId: string, data: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/UserPost/update-post-comment/${commentId}`,
      data
    );
  }

  /**
   * Delete a comment.
   * @param commentId The ID of the comment to delete.
   * @returns An Observable for tracking the HTTP request status.
   */
  deletePostComment(commentId: string): Observable<any> {
    let params = new HttpParams().set("commentId", commentId.toString());
    return this.http.delete(`${this.apiUrl}/UserPost/delete-post-comment`, {
      params,
    });
  }

  /**
   * Fetch chat messages for a specific user.
   * @param userId The ID of the user to fetch chats for.
   * @returns An Observable containing the chat messages.
   */
  getChats(userId: string): Observable<Feed[]> {
    let params = new HttpParams().set("userId", userId.toString());
    return this.http.get<any[]>(`${this.apiUrl}/Feeds/getChats`, { params });
  }
}
