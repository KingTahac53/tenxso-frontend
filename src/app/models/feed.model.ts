export class Feed {
  id: string;
  userId: string;
  username: string;
  userProfilePic: string;
  feedUrl: string;
  description: string;
  uploadDate: Date;

  constructor(
    id: string,
    userId: string,
    username: string,
    userProfilePic: string,
    feedUrl: string,
    description: string,
    uploadDate: Date
  ) {
    this.id = id;
    this.userId = userId;
    this.username = username;
    this.userProfilePic = userProfilePic;
    this.feedUrl = feedUrl;
    this.description = description;
    this.uploadDate = uploadDate;
  }
}
