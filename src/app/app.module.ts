import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AppComponent } from './app.component';
import { UserService } from './services/user.service';


import { AppRoutingModule } from './app-routing.module';

import { FormsModule } from '@angular/forms';
import { TenxAppNavigationComponent } from './tenx-app-navigation/tenx-app-navigation.component';
import { FeedsComponent } from './feeds/feeds.component';
import { NotificationsPopupComponent } from './modals/notifications-popup/notifications-popup.component';
import { EditProfilePopUpComponent } from './modals/edit-profile-pop-up/edit-profile-pop-up.component';
import { MessagesPopupComponent } from './modals/messages-popup/messages-popup.component';
import { LoginPopupComponent } from './modals/login-popup/login-popup.component';
import { LikesPopupComponent } from './modals/likes-popup/likes-popup.component';
import { CommentsPopupComponent } from './modals/comments-popup/comments-popup.component';
import { MessagesComponent } from './messages/messages.component';
import { ChatComponent } from './chat/chat.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { AboutComponent } from './about/about.component';
import { VideoDisplayComponent } from './video-display/video-display.component';
import { LoginComponent } from './login/login.component';
import { CreateComponent } from './create/create.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { ProfileComponent } from './profile/profile.component';
import { MobileNavigationComponent } from './mobile-navigation/mobile-navigation.component';
import { VideoPlayerComponent } from './video-player/video-player.component';  // Import your components


@NgModule({
  declarations: [
    AppComponent,
    TenxAppNavigationComponent,
    FeedsComponent,
    MessagesComponent,
    CommentsPopupComponent,
    NotificationsPopupComponent,
    EditProfilePopUpComponent,
    MessagesPopupComponent,
    LoginPopupComponent,
    LikesPopupComponent,
    ChatComponent,
    EditProfileComponent,
    AboutComponent,
    VideoDisplayComponent,
    LoginComponent,
    CreateComponent,
    NotificationsComponent,
    ProfileComponent,
    MobileNavigationComponent,
    VideoPlayerComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressBarModule,
    AppRoutingModule
  ],
  providers: [UserService],
  bootstrap: [AppComponent]
})
export class AppModule { }
