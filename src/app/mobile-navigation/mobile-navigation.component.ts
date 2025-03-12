import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { SharedService } from "../services/shared.service";

@Component({
  selector: "app-mobile-navigation",
  templateUrl: "./mobile-navigation.component.html",
  styleUrls: ["./mobile-navigation.component.css"],
})
export class MobileNavigationComponent implements OnInit {
  profilePic: string | null = null;

  routes = [
    { link: "/feeds", icon: "fas fa-home" },
    { link: "/messages", icon: "fas fa-envelope" },
    { link: "/create", icon: "fas fa-plus-circle" },
    { link: "/notifications", icon: "fas fa-bell" },
    { link: "/edit-profile", icon: "fas fa-user" },
    { link: "/login", icon: "fas fa-sign-in-alt" },
  ];

  constructor(public router: Router, private sharedService: SharedService) {}

  ngOnInit(): void {
    // Subscribe to profile picture updates
    this.sharedService.getProfilePic().subscribe((updatedPic) => {
      this.profilePic = updatedPic;
    });
  }
}
