import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CookieService } from 'ngx-cookie-service';
import { MaterialModule } from './material.module';
import { FromNowPipe } from './pipes/from-now.pipe';
import { LightboxModule } from 'angular2-lightbox';
import { DeviceDetectorModule } from 'ngx-device-detector';

import { TippyDirective } from './directives/tippy.directive';
import { HammertimeDirective } from './directives/hammertime.directive';

import { WebsocketService } from './websocket/websocket.service';
import { UsersService } from './user/users.service';
import { ThreadsService } from './thread/threads.service';
import { MessagesService } from './message/messages.service';
import { ChatThreadService } from './chat-thread/chat-thread.service';
import { LoaderService } from './loader/loader.service';
import { FileClientService } from './file-client/file-client.service';
import { GlobalsService } from './globals/globals.service';
import { AvatarService } from './avatar/avatar.service';
import { SnackBarService } from './snack-bar/snack-bar.service';

import { AppComponent } from './app.component';
import { ChatMessageComponent } from './chat-message/chat-message.component';
import { ChatThreadComponent } from './chat-thread/chat-thread.component';
import { ChatNavBarComponent } from './chat-nav-bar/chat-nav-bar.component';
import { ChatThreadsComponent } from './chat-threads/chat-threads.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { ChatPageComponent } from './chat-page/chat-page.component';
import { ChatLoaderComponent } from './chat-loader/chat-loader.component';
import { ChatAvatarsComponent } from './chat-avatars/chat-avatars.component';
import { ChatAvatarComponent } from './chat-avatar/chat-avatar.component';
import { Base64UploadComponent } from './base64-upload/base64-upload.component';
import { SnackBarComponent } from './snack-bar/snack-bar.component';

@NgModule({
  declarations: [
    AppComponent,
    ChatMessageComponent,
    ChatThreadComponent,
    ChatNavBarComponent,
    ChatThreadsComponent,
    ChatWindowComponent,
    ChatPageComponent,
    ChatLoaderComponent,
    ChatAvatarsComponent,
    ChatAvatarComponent,
    FromNowPipe,
    Base64UploadComponent,
    SnackBarComponent,
    TippyDirective,
    HammertimeDirective
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    HttpClientModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MaterialModule,
    LightboxModule,
    DeviceDetectorModule.forRoot() 
  ],
  providers: [
    WebsocketService, 
    MessagesService, 
    ThreadsService, 
    UsersService, 
    GlobalsService, 
    ChatThreadService, 
    CookieService, 
    LoaderService,
    FileClientService,
    AvatarService,
    SnackBarService   
  ],

  bootstrap: [AppComponent]
})
export class AppModule { }
