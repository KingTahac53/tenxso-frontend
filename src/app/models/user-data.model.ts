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
    this.firstName = firstName;
    this.lastName = lastName;
    this.profilePic = profilePic;
    this.isVerified = isVerified;
  }
}
