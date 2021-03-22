import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ElementRef, ViewChild, Renderer2} from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { Subscription } from 'rxjs/Subscription';
import { interval } from 'rxjs/observable/interval';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { AnimationTransitionEvent } from '@angular/core';
import { easeOutBounce } from 'easing-utils';
import * as _ from 'lodash';
import * as moment from 'moment';

import { User } from '../user/user.model';
import { UsersService } from '../user/users.service';
import { ThreadsService } from '../thread/threads.service';
import { AvatarService } from '../avatar/avatar.service';
import { Thread } from '../thread/thread.model';
import { Message } from '../message/message.model';
import { File } from '../file/file.model';
import { MessagesService } from '../message/messages.service';
import { ChatThreadService } from '../chat-thread/chat-thread.service';
import { environment } from '../../environments/environment';
import { GlobalsService } from '../globals/globals.service';

@Component({
  selector: 'chat-thread',
  templateUrl: './chat-thread.component.html',
  styleUrls: ['./chat-thread.component.css'],
  animations: [
    trigger('closeAvatarSelectionContainer', [
        state('up', style({
          bottom: '0px',
        })),
        state('down', style({
          bottom: '-{{avatarSelectionContainerHeight}}px',
        }),{params: {avatarSelectionContainerHeight: 90}}),
        transition('up => down', animate('500ms cubic-bezier(0.680, -0.550, 0.265, 1.550)')),
        transition('down => up', animate('500ms cubic-bezier(0.680, -0.550, 0.265, 1.550)'))
    ]),
  ]
})

export class ChatThreadComponent implements OnInit, OnDestroy{

  @Output() onSent = new EventEmitter();
  @Input() file: File;
  @Input() thread: Thread;
  @ViewChild('mediaConversation') mediaConversation: ElementRef;
  @ViewChild('avatarSelectionContainer') avatarSelectionContainer: ElementRef;

  messages: Observable<any>;
  threads: Observable<any>;
  currentThread: Thread;
  currentThreadUser: User;
  draftMessage: Message;
  currentUser: User;
  $currentUser: BehaviorSubject<User> = new BehaviorSubject<User>(null);
  showElement: boolean;
  selected = false;  
  state: string = 'down';
  avatarSelectionContainerHeight: number = 0;
  messageCount: number = 0;
  newMessage: boolean;
  threadHasPreviousMessages: boolean;
  limitMessages: boolean;
  msgContainerBaseHeight: number = 0;
  currentMessageText: string = environment.default_message_text;
  msgInputHeight: number = environment.message_input_height;
  showMessageLoader: boolean;
  debug: boolean = false;

  private threadSubscription: Subscription;
  private threadTimeSubscription: Subscription;
  private newThreadIdSubscription: Subscription;
  private avatarSelectedSubscription: Subscription;
  private subscriptionBadgeState: Subscription;
  private subscriptionThreadHasPreviousMessageState: Subscription;
  private subscriptionShowMessageLoader: Subscription;

  constructor(public messagesService: MessagesService,
              public threadsService: ThreadsService,
              public usersService: UsersService,
              public globalsService: GlobalsService,
              public avatarService: AvatarService,
              private chatThreadService: ChatThreadService,
              private renderer: Renderer2,
              public el: ElementRef) {

    this.subscriptionBadgeState = this.chatThreadService.badgeChatThreadState.subscribe( badgeState => {
      this.threadsService.currentThread.subscribe( (currentThread: Thread) => {
        if(this.thread.id !== currentThread.id && this.messageCount > 0) {
          this.newMessage = badgeState;
          if(this.debug) {
            console.log('chat-thread: this.newMessage 1: ',this.newMessage);
          }
        }
      });
    });

    this.subscriptionThreadHasPreviousMessageState = this.chatThreadService.threadHasPreviousMessageState.subscribe( threadHasPreviousMessageState => {
      this.threadHasPreviousMessages = threadHasPreviousMessageState;
      if(this.debug) {
        console.log('CHAT-THREAD: this.threadHasPreviousMessages: ',this.threadHasPreviousMessages);
      }
    });

    this.subscriptionShowMessageLoader = this.chatThreadService.showMessageLoader.subscribe( state => {
      this.showMessageLoader = state;
      if(this.debug) {
        console.log('CHAT-THREAD: this.showThreadLoader: ',this.showMessageLoader);
      }
    });

    if(this.globalsService.chatWindowHeight > 0) {            
      this.msgContainerBaseHeight = this.globalsService.chatWindowHeight - 96;
      if(this.debug) {
        console.log('CHAT-THREAD: this.msgContainerBaseHeight: ',this.msgContainerBaseHeight);
      }
    } 

    this.currentMessageText = this.globalsService.defaultMessageText;

  }

  ngOnInit(): void {
    this.$currentUser = this.usersService.currentUser;
    this.showElement = environment.use_thread_input;
    if(environment.split_ui) {
      this.showElement = false;
    }
    this.messages = this.threadsService.currentThreadMessages;
    this.draftMessage = new Message();
    this.threadSubscription = this.threadsService.$visible.subscribe( (thread: Thread) => {
      if(this.debug) {
        console.log('CHAT-THREAD: this.thread.isVisible',this.thread.isVisible);
      }
      this.thread.isVisible = thread.id === this.thread.id;
    });
    this.threadTimeSubscription = this.threadsService.$threadTime.subscribe( (thread: Thread) => {
      if(this.thread.id === thread.id) {
        const startDate: number = new Date(thread.lastLogin).getTime();
        const endDate: number = new Date().getTime();
        const threadTime: number = endDate - startDate;
        if(!isNaN(threadTime)) {
          const date = this.convertMS(threadTime);
          this.thread.threadTime = date.h + ':' + date.m + ':' + date.s;
        }
      }
    });
    this.usersService.currentUser.subscribe( (user: User) => {
      this.currentUser = user;
      if(this.debug) {
        console.log('CHAT-THREAD: this.currentUser: ',this.currentUser);
      }
    });
    this.threadsService.currentThread.subscribe( (currentThread: Thread) => {
      this.selected = currentThread &&
        this.thread &&
        (currentThread.id === this.thread.id);
      }
    );
    this.newThreadIdSubscription = this.messagesService.newThreadId.subscribe( id => {
      this.thread.newThreadId = this.thread.id === id ? id : '';
      if(this.debug) {
        console.log('CHAT-THREAD: this.thread.newThreadId: chat-thread.component.ts: ',id);
      }
    });
    this.avatarSelectedSubscription = this.avatarService.avatarSelected.subscribe( target => {
      const avatars = this.el.nativeElement.querySelectorAll('.avatar-image');
      avatars.forEach(avatar => {
        this.renderer.setStyle(
          avatar,
          'opacity',
          0.5
        );
        this.renderer.removeClass(avatar, 'animated');
        this.renderer.removeClass(avatar, 'bounceIn');
      });
      if(target) {
        this.renderer.setStyle(
          target,
          'opacity',
          1
        );
        this.renderer.addClass(target, 'animated');
        this.renderer.addClass(target, 'bounceIn');
        if(this.debug) {
          console.log('CHAT-THREAD: avatarSelected: target: ',target);
        }
        if(this.debug) { 
          console.log('CHAT-THREAD: target: ',target);
        }
        const srcAttr = target.attributes.src;
        if(this.debug) { 
          console.log('CHAT-THREAD: srcAttr: ',srcAttr);
        }
        const src = srcAttr.nodeValue;
        const obj = {
          origin: this.globalsService.corsDomain,
          avatarSrc: src
        };
        this.renderer.setAttribute(this.globalsService.iframe, 'data-role-ng-chat-avatar-src-out', JSON.stringify(obj));
      }
    });
    this.messages.subscribe( (messages: Array<Message>) => {
      this.chatThreadService.showMessageLoader.next(false);
      setTimeout( () => {
        if(!this.currentUser.isAdmin) {
          this.scrollToBottom();
          this.avatarSelectionContainerHeight = this.mediaConversation.nativeElement.offsetHeight;
          if(this.debug) {
            console.log('this.avatarSelectionContainerHeight: ',this.avatarSelectionContainerHeight);
          }
          this.renderer.setStyle(
            this.avatarSelectionContainer.nativeElement,
            'bottom',
            '-' + this.avatarSelectionContainerHeight + 'px'
          );
        }
      });
    });
    this.messagesService.messages.subscribe( (messages: Array<Message>) => {
      this.messageCount =
      _.reduce( messages, (sum: number, message: Message) => {
        if(message.thread.id === this.thread.id) {
          sum = sum + 1;
          if(this.debug) {
            console.log('CHAT-THREAD: sum',sum);
          }
        }
        return sum;
      },0);
      this.chatThreadService.badgeChatThreadState.next(true);
    });
    this.messagesService.messages.subscribe( (messages: Array<Message>) => {
      const threadMessages = messages
      .filter ( (message: Message, index: number) => {
        return message.thread.id === this.thread.id && !message.author.isAdmin && !message.ping;
      });
      if(this.debug) {
        console.log('CHAT-THREAD: threadMessages',threadMessages);
      }
      threadMessages.map( (message: Message, index: number) => {
        if(index === (threadMessages.length - 1)) {
          if(this.debug) {
            console.log('CHAT-THREAD: message',message);
          }
          this.thread.avatarSrc = message.author.avatarSrc;
          // lets place the latest thread message into the admin's thread list panel, only when the message is coming from a thread user. This also has the added benefit that admin messages do not get displayed in the admin's thread list panel
          // this.thread.lastMessage = message;
          // lets display the current message text into the admin's thread list panel
          this.currentMessageText = message.text;
        }
      });
    });
    this.messagesService.messages.subscribe( (messages: Array<Message>) => {
      if(this.debug) {
        console.log('CHAT-THREAD: message sent');
      }
      if(this.globalsService.maxFilesPerSession > 0) {
        if(this.debug) {
          console.log('CHAT-THREAD: this.thread.maxFilesPerSession: ',this.thread.maxFilesPerSession);
          console.log('CHAT-THREAD: this.thread: ',this.thread);
        }
        if(this.thread.maxFilesPerSession >= this.globalsService.maxFilesPerSession){
          this.chatThreadService.showFileChangeIcon.next(false);
          if(this.debug) {
            console.log('CHAT-THREAD: this.chatThreadService.showFileChangeIcon.next: ',false);
          }
        }
      }
    });
    // "@angular/cli": "1.5.0", "@angular/compiler-cli": "5.0.0"
    // this is a production bug fix that allows events to register within input fields, including textarea
    if(environment.production) {
      setTimeout( () => {
        var ngchatmessageinput = this.el.nativeElement.querySelector('#ng-chat-message-input');
        if(ngchatmessageinput) {
          this.renderer.listen(ngchatmessageinput, 'focus', (event: any) => {
            if(this.debug) {
              console.log('CHAT-THREAD: focus: ',ngchatmessageinput);
            }
            this.onFocus(event);
          });
        }
      });
    }
  }

  scrollToBottom(): void {
    const scrollPane: any = this.el.nativeElement.querySelector('.msg-container-base');
    scrollPane.scrollTop = scrollPane.scrollHeight;
  }

  clicked(event: any): void {
    this.chatThreadService.badgeChatThreadState.next(false);
    this.threadsService.setCurrentThread(this.thread);
    this.chatThreadService.setAnimationState('up');
    this.thread.newThreadId = '';
    event.preventDefault();
  }

  onFocus(event: any): void {
    this.chatThreadService.badgeChatThreadsState.next();
    this.threadsService.setCurrentThread(this.thread);
    this.chatThreadService.setAnimationState('up');
    this.state = 'down';
    event.preventDefault();
  }

  onEnter(event: any): void {
    this.threadsService.setCurrentThread(this.thread);
    this.sendMessage();
    event.preventDefault();
  }

  fetchMessages(event: any): void {
    const message = this.threadsService.currentThreadFirstMessage.value;
    const params = {
      contactid: message.thread.id,
      adminid: message.author.adminid,
      sessionid: message.thread.sessionId,
      domain: message.thread.domain
    };
    this.globalsService.fetchMessages(this.globalsService.defaultLimit, params).subscribe( (dbMessages: any) => {
      if(dbMessages.length > 0) {
        this.threadHasPreviousMessages = false;
        this.limitMessages = true;
        this.threadsService.setLimit(0);
        dbMessages.map( (message: Message) => this.messagesService.addMessage(message) );
      }
    });
  }

  showMessages(event: any): void {
    this.threadHasPreviousMessages = false;
    this.limitMessages = true;
    this.threadsService.setLimit(0);
    this.threadsService.currentThread.next(this.thread);
  }

  hideMessage(event: any): void {
    this.limitMessages = false;
    this.threadsService.setLimit(this.globalsService.defaultLimit);
    this.threadsService.currentThread.next(this.thread);
  }

  sendMessage(): void {
    this.showMessageLoader = true;
    const m: Message = this.draftMessage;
    m.author = this.threadOwner(this.thread);
    m.thread = this.thread;
    m.isRead = true;
    m.file = this.file;
    this.messagesService.addMessage(m);
    this.draftMessage = new Message();
    this.onSent.emit();
    this.file = null;
  }

  threadOwner(thread: Thread): any {
    let user = this.currentUser;
    this.globalsService.threadOwners.forEach( (threadOwner: any): void => {
      if(threadOwner.thread.id === thread.id) {
        user = threadOwner.user;
      }
    });
    return user;
  }

  toggleThreadData(event: any): void {
    if(typeof this.thread.isVisible === 'undefined' || (typeof this.thread.isVisible !== 'undefined' && !this.thread.isVisible)) {
      this.threadsService.$visible.next(this.thread);
    }
    else{
      this.thread.isVisible = false;
    }
    event.preventDefault();
  }

  toggleThreadTime(event: any): void {
    this.threadsService.$threadTime.next(this.thread);
    event.preventDefault();
  }

  convertMS(ms): any {
    let d, h, m, s;
    s = Math.floor(ms / 1000);
    m = Math.floor(s / 60);
    s = s % 60;
    h = Math.floor(m / 60);
    m = m % 60;
    d = Math.floor(h / 24);
    h = h % 24;
    d = (d < 10) ? '0' + d : d;
    h = (h < 10) ? '0' + h : h;
    m = (m < 10) ? '0' + m : m;
    s = (s < 10) ? '0' + s : s;
    return { d: d, h: h, m: m, s: s };
  }

  closeAvatarSelectionContainer(): void {
    this.state = (this.state === 'up' ? 'down' : 'up');
    this.chatThreadService.avatarSelectionContainerAnimationState.next(this.state);
    if(this.state === 'up') {
      this.chatThreadService.avatarsAnimateSafari.next(true);
    }
  }

  closeAvatarSelectionContainerStarted(event: AnimationTransitionEvent): void {
    if(this.debug) {
      console.log('closeAvatarSelectionContainerStarted: this.state: ',this.state);
    }
  }

  closeAvatarSelectionContainerDone(event: AnimationTransitionEvent): void {
    if(this.debug) {
      console.log('closeAvatarSelectionContainerDone: this.state: ',this.state);
    }
    if(this.state === 'up') {
      this.avatarService.avatarAnimationStart.next(true);
    }
  }

  ngOnDestroy() {
    if (this.threadSubscription) {
      this.threadSubscription.unsubscribe();
    }
    if (this.threadTimeSubscription) {
      this.threadTimeSubscription.unsubscribe();
    }
    if (this.newThreadIdSubscription) {
      this.newThreadIdSubscription.unsubscribe();
    }
    if (this.avatarSelectedSubscription) {
      this.avatarSelectedSubscription.unsubscribe();
    }
    if (this.subscriptionBadgeState) {
      this.subscriptionBadgeState.unsubscribe();
    }
    if (this.subscriptionThreadHasPreviousMessageState) {
      this.subscriptionThreadHasPreviousMessageState.unsubscribe();
    }
    if (this.subscriptionShowMessageLoader) {
      this.subscriptionShowMessageLoader.unsubscribe();
    }
  }

}
