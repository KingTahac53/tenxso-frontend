import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeedsComponent } from './feeds/feeds.component';
import { MessagesComponent } from './messages/messages.component';
import { ChatComponent } from './chat/chat.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { AboutComponent } from './about/about.component';
import { LoginComponent } from './login/login.component';
import { CreateComponent } from './create/create.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { ProfileComponent } from './profile/profile.component';

const routes: Routes = [
  { path: '', redirectTo: '/feeds', pathMatch: 'full' },  // Default route
  { path: 'feeds', component: FeedsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'create', component: CreateComponent },
  { path: 'notifications', component: NotificationsComponent },
  { path: 'profile', component: EditProfileComponent },
  { path: 'messages', component: MessagesComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'edit-profile', component: EditProfileComponent },
  { path: 'about', component: AboutComponent },
  { path: '**', redirectTo: '/feeds' }  // Wildcard route
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { useHash: true }) // Enable hash-based routing
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
