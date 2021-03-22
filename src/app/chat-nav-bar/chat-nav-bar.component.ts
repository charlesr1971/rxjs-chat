import { Component, Inject, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { MatProgressSpinnerModule, MatProgressBarModule } from '@angular/material';

import { User } from '../user/user.model';
import { UsersService } from '../user/users.service';
import { ThreadsService } from './../thread/threads.service';
import { MessagesService } from './../message/messages.service';
import { Thread } from './../thread/thread.model';
import { Message } from './../message/message.model';
import { environment } from '../../environments/environment';
import { GlobalsService } from '../globals/globals.service';

@Component({
  selector: 'chat-nav-bar',
  templateUrl: './chat-nav-bar.component.html',
  styleUrls: ['./chat-nav-bar.component.css']
})

export class ChatNavBarComponent implements OnInit {

  currentThread: Thread;
  currentUser: User;
  unreadMessagesCount: number;
  imgsrc: string;
  hideElement: boolean;
  debug: boolean = false;

  constructor(public messagesService: MessagesService,
              public UsersService: UsersService,
              public threadsService: ThreadsService,
              public globalsService: GlobalsService) {

  }

  ngOnInit(): void {
    this.hideElement = true;
    this.imgsrc = '';
    this.globalsService.fetchCacheFile('brand-logo-mobile').subscribe((data: any) => {
      this.imgsrc = data['src'];
    });
    if(this.imgsrc.trim() !== '') {
      this.hideElement = false;
    }
    this.threadsService.currentThread.subscribe( (thread: Thread) => {
      this.currentThread = thread;
    });
    this.UsersService.currentUser.subscribe( (user: User) => {
      this.currentUser = user;
    });
    this.messagesService.messages.combineLatest( this.threadsService.currentThread, (messages: Message[], currentThread: Thread) => [currentThread, messages] ).subscribe( ([currentThread, messages]: [Thread, Message[]]) => {
      this.unreadMessagesCount = _.reduce( messages, (sum: number, m: Message) => {
        const messageIsInCurrentThread: boolean = m.thread &&
          currentThread &&
          (currentThread.id === m.thread.id);
        // note: in a "real" app you should also exclude
        // messages that were authored by the current user b/c they've
        // already been "read"
        if (m && !m.isRead && !messageIsInCurrentThread) {
          sum = sum + 1;
        }
        return sum;
      },0);
    });
  }

  findThreads(event: any): void {
    const message =  new Message({
      author: this.currentUser,
      text: 'Ping from admin',
      thread: this.currentThread,
      ping: true,
      display: false
    });
    if(this.debug) {
      console.log('CHAT-NAV-BAR: findThreads: message: ',message);
    }
    this.messagesService.addMessage(message);
  }

}
