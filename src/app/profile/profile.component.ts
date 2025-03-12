import { Component, OnInit } from "@angular/core";
import { SharedService } from "../services/shared.service";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"],
})
export class ProfileComponent implements OnInit {
  profilePic: string | null = null;

  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    // Subscribe to profile picture updates
    this.sharedService.getProfilePic().subscribe((pic) => {
      this.profilePic = pic;
    });
  }
}
