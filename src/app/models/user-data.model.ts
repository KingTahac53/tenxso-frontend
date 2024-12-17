export class UserData {
  userId: string;
  username: string;
  profilePic: string;

  constructor(userId: string, username: string, profilePic: string) {
    this.userId = userId;
    this.username = username;
    this.profilePic = profilePic;
  }
}
