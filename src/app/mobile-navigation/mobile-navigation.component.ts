import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mobile-navigation',
  templateUrl: './mobile-navigation.component.html',
  styleUrls: ['./mobile-navigation.component.css']
})
export class MobileNavigationComponent {
  routes = [
    { link: '/feeds', icon: 'fas fa-home' },
    { link: '/messages', icon: 'fas fa-envelope' },
    { link: '/create', icon: 'fas fa-plus-circle' },
    { link: '/notifications', icon: 'fas fa-bell' },
    { link: '/edit-profile', icon: 'fas fa-user' }
  ];

  constructor(public router: Router) { }
}
