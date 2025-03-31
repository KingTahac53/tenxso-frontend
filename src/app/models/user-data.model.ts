export class UserData {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePic: string;
  isVerified: string;

  constructor(
    userId: string,
    username: string,
    firstName: string,
    lastName: string,
    profilePic: string,
    isVerified: string
  ) {
    this.userId = userId;
    this.username = username;
    this.profilePic = profilePic;
    this.firstName = firstName;
    this.lastName = lastName;
    this.isVerified = isVerified;
  }
}
