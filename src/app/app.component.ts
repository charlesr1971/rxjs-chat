import { Component, Inject, OnInit, Renderer2 } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

import { ChatExampleData } from './data/chat-example-data';
import { User } from './user/user.model';
import { UsersService } from './user/users.service';
import { ThreadsService } from './thread/threads.service';
import { ChatThreadService } from './chat-thread/chat-thread.service';
import { MessagesService } from './message/messages.service';
import { GlobalsService } from './globals/globals.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit  {

  currentUser: User;
  debug: boolean = false;

  constructor(public messagesService: MessagesService,
            public threadsService: ThreadsService,
            public chatThreadService: ChatThreadService,
            public usersService: UsersService,
            public globalsService: GlobalsService,
            public cookieService: CookieService,
            private renderer: Renderer2) {       

    ChatExampleData.init(messagesService, threadsService, usersService, globalsService, cookieService, chatThreadService);

    this.messagesService.setThreadsService(threadsService);
    this.globalsService.setThreadsService(threadsService);
    this.globalsService.setChatThreadService(chatThreadService);
    
  }

  ngOnInit() {    
    this.usersService.currentUser.subscribe( (user: User) => {
      this.currentUser = user;
      if(this.debug) {
        console.log('APP: this.currentUser: ',this.currentUser);
      }
      if(this.currentUser && this.currentUser.isAdmin) {
        this.renderer.setStyle(
          document.body,
          'background',
          '#ffffff'
        );
        this.renderer.setStyle(
          document.body,
          'background-color',
          '#ffffff'
        );
      }
    });
  }

}
