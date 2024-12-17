import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpEvent, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Feed } from '../models/feed.model';
import { environment } from '../environment'; // Ensure the path is correct

@Injectable({
  providedIn: 'root',
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
  getFeeds(pageNumber: number, pageSize: number, userId?: string): Observable<Feed[]> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString()) // Set the current page number
      .set('pageSize', pageSize.toString()); // Set the number of items per page

    if (userId) {
      params = params.set('userId', userId); // Add userId if provided
    }
    // Add caching headers
    const headers = new HttpHeaders({
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      Pragma: 'cache',
    });
    // Return the API call observable for paginated feeds
    return this.http.get<Feed[]>(`${this.apiUrl}/Feeds/getUserFeeds`, { params });
  }

  /**
   * Like a post by sending the necessary form data.
   * @param formData FormData containing the details of the like action.
   * @returns An Observable for tracking the HTTP request status.
   */
  likePost(formData: FormData): Observable<HttpEvent<any>> {
    const req = new HttpRequest('POST', `${this.apiUrl}/UserPost/postLike`, formData);
    return this.http.request(req); // Return an observable for the HTTP request
  }

  /**
   * Post a new comment on a feed.
   * @param formData FormData containing the comment details.
   * @returns An Observable for tracking the HTTP request status.
   */
  postCommentNew(formData: FormData): Observable<HttpEvent<any>> {
    const req = new HttpRequest('POST', `${this.apiUrl}/UserPost/PostCommentNew`, formData, {
      reportProgress: true, // Track upload progress
      responseType: 'json', // Expect JSON response
    });
    return this.http.request(req);
  }

  /**
   * Fetch all likes for a specific post.
   * @param postId The ID of the post to fetch likes for.
   * @returns An Observable containing the list of likes.
   */
  getPostLikes(postId: string): Observable<any[]> {
    let params = new HttpParams().set('postId', postId.toString());
    return this.http.get<any[]>(`${this.apiUrl}/UserPost/PostLikes`, { params });
  }

  /**
   * Fetch all comments for a specific post.
   * @param postId The ID of the post to fetch comments for.
   * @returns An Observable containing the list of comments.
   */
  getPostComments(postId: string): Observable<any[]> {
    let params = new HttpParams().set('postId', postId.toString());
    return this.http.get<any[]>(`${this.apiUrl}/UserPost/PostComments`, { params });
  }

  /**
   * Fetch chat messages for a specific user.
   * @param userId The ID of the user to fetch chats for.
   * @returns An Observable containing the chat messages.
   */
  getChats(userId: string): Observable<Feed[]> {
    let params = new HttpParams().set('userId', userId.toString());
    return this.http.get<any[]>(`${this.apiUrl}/Feeds/getChats`, { params });
  }
}
