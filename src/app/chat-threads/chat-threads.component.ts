import { Component, Inject, ElementRef, ViewChild, OnInit, OnDestroy, ChangeDetectionStrategy, Renderer2, Renderer } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { AnimationTransitionEvent } from '@angular/core';
import { easeOutBounce } from 'easing-utils';
import { Subject, Observable, BehaviorSubject, Subscription } from 'rxjs';
import { DeviceDetectorService } from 'ngx-device-detector';

import { User } from '../user/user.model';
import { UsersService } from '../user/users.service';
import { Thread } from '../thread/thread.model';
import { ThreadsService } from './../thread/threads.service';
import { ChatThreadService } from '../chat-thread/chat-thread.service';
import { Message } from '../message/message.model';
import { MessagesService } from '../message/messages.service';
import { File } from '../file/file.model';
import { GlobalsService } from '../globals/globals.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'chat-threads',
  templateUrl: './chat-threads.component.html',
  styleUrls: ['./chat-threads.component.css'],
  animations: [
    trigger('closeChatWindow', [
        state('up', style({
          bottom: '0px',
        })),
        state('down', style({
          bottom: '-{{chatWindowHeight}}px',
        }),{params: {chatWindowHeight: 135}}),
        transition('up => down', animate('250ms ease-in')),
        transition('down => up', animate('250ms ease-out'))
    ]),
  ]
})

export class ChatThreadsComponent implements OnInit, OnDestroy  {

  @ViewChild('chatThreadWindow') chatWindowView: ElementRef;
  @ViewChild('appBase64Upload') appBase64Upload;
  @ViewChild('chatThread') chatThread;
  @ViewChild('glyphiconChevronUp') glyphiconChevronUp:ElementRef;

  messages: Observable<any>;
  threads: Observable<any>;
  currentUser: BehaviorSubject<User> = new BehaviorSubject<User>(null);
  currentThread: Thread;
  state: string = 'down';
  chatWindowHeight: number;
  chatWindowCloseIconClass: string = 'glyphicon glyphicon-chevron-up';
  file: File;
  messagesCount: number = 0;
  newMessage: boolean;
  threadInitState: number = 0;
  threadInitDbMessagesLength: number = 0;
  threadInitDbMessageCount: number = 1;
  chatWindowHeightDefault: number = environment.chat_window_height;
  mobileFormat: boolean = false;
  deviceInfo = null;
  showFileChangeIcon: boolean = true;
  debug: boolean = false;

  private subscriptionBadgeState: Subscription;
  private subscriptionChatThreadInitState: Subscription;
  private subscriptionChatThreadInitDbMessagesLength: Subscription;
  private subscriptionDoCloseChatThreadWindow: Subscription;

  constructor(public messagesService: MessagesService,
              public threadsService: ThreadsService, 
              public usersService: UsersService,
              public chatThreadService: ChatThreadService,
              public globalsService: GlobalsService,
              private deviceService: DeviceDetectorService,
              private renderer: Renderer2,
              private _renderer: Renderer,
              public el: ElementRef) {

    this.threads = this.threadsService.orderedThreads;

    this.threadsService.orderedThreads.subscribe( (threads: Array<Thread>) => {
      if(this.debug) {
        console.log('CHAT-THREADS: threads',threads);
      }
    });

    this.subscriptionBadgeState = this.chatThreadService.badgeChatThreadsState.subscribe( badgeState => {
      this.newMessage = this.state === 'down' && this.messagesCount > 0 ? true : false;
      if(this.debug) {
        console.log('CHAT-THREADS: this.newMessage 1: ',this.newMessage);
      }
    });

    this.subscriptionChatThreadInitState = this.chatThreadService.chatThreadInitState.subscribe( initState => {
      this.threadInitState = initState;
      if(this.debug) {
        console.log('CHAT-THREADS: this.threadInitState: ',this.threadInitState);
      }
    });

    this.subscriptionChatThreadInitDbMessagesLength = this.chatThreadService.chatThreadInitDbMessagesLength.subscribe( initDbMessagesLength => {
      this.threadInitDbMessagesLength = initDbMessagesLength;
      if(this.debug) {
        console.log('CHAT-THREADS: this.threadInitDbMessagesLength: ',this.threadInitDbMessagesLength);
      }
    });

    this.subscriptionDoCloseChatThreadWindow = this.chatThreadService.doCloseChatThreadWindow.subscribe( action => {
      if(this.state === 'down') {
        this._renderer.invokeElementMethod(this.glyphiconChevronUp.nativeElement, 'click', []); 
      }
    });

    const chatWindowHeightDefault = this.globalsService.chatWindowHeight;            
    if(chatWindowHeightDefault > 0) {            
      this.chatWindowHeightDefault = chatWindowHeightDefault;
      if(this.debug) {   
        console.log('CHAT-THREADS: this.chatWindowHeightDefault: ',this.chatWindowHeightDefault); 
      }
    } 

    this.mobileFormat = this.globalsService.mobileFormat;

    if(this.debug) {
      console.log('CHAT-THREADS: this.mobileFormat: ',this.mobileFormat);
    }

    this.deviceInfo = this.deviceService.getDeviceInfo();
    if(this.debug) {
      console.log('CHAT-THREADS: this.deviceInfo: ',this.deviceInfo);
    }
    
  }

  ngOnInit(): void {
    this.messages = this.threadsService.currentThreadMessages;
    this.currentUser = this.usersService.currentUser;
    this.threadsService.currentThread.subscribe( (thread: Thread) => {
      this.currentThread = thread;
    });
    this.messages.subscribe( (messages: Array<Message>) => {
      setTimeout( () => {
        //this.messagesCount = messages.length;
        const _messages = messages
        .filter( (message: Message) => {
          return message.text !== this.globalsService.defaultMessageText;
        })
        this.messagesCount = _messages.length;
        if(this.debug) {
          console.log('CHAT-THREADS: this.messagesCount',this.messagesCount);
        }
        this.chatThreadService.badgeChatThreadsState.next();
        if(this.chatWindowView && this.chatWindowView.nativeElement && this.state === 'down' && this.chatWindowHeightDefault > 0) {
          this.renderer.setStyle(
            this.chatWindowView.nativeElement,
            'bottom',
            '-' + this.getChatWindowHeight() + 'px'
          );
        }
        else{
          this.chatWindowHeight = this.getChatWindowHeight();
        }
      });
    });
  }

  close(event: any): void {
    this.closeChatWindow();
  }

  hideNgChat(event: any): void {
    if(this.debug) {
      console.log('CHAT-THREADS: this.globalsService.iframe: ',this.globalsService.iframe);
    }
    if(this.globalsService.iframe) {
      const obj = {
        origin: this.globalsService.corsDomain,
        hideNgChat: true
      };
      this.renderer.setAttribute(this.globalsService.iframe, 'data-role-ng-chat', JSON.stringify(obj));
    }
  }

  getChatWindowHeight(): any {
    let height = 0;
    if(this.chatWindowView && this.chatWindowView.nativeElement) {
      height = this.chatWindowView.nativeElement.offsetHeight;
    }
    if(this.chatWindowHeightDefault > 0) {
      height = this.chatWindowHeightDefault;
    }
    const windowHeaderHeight = 50;
    if(isNaN(height)) {
      height = 0;
    }
    if(height > windowHeaderHeight) {
      height = height - windowHeaderHeight;
    }
    if(this.debug) {
      console.log('CHAT-THREADS: chat window height: ',height);
    }
    return height;
  }

  getFileAttachment(file: any): void{
    const _file: File = file ? new File(file.value['clientfilename'], file.value['filename'], file.value['filetype'], file.value['binaryFiletype'], file.value['filesize'], file.value['value']) : null;
    this.file = _file;
    if(this.debug) {
      console.log('CHAT-THREADS: this.file: ',this.file);
    }
  }

  clearFile(): void{
    if(this.debug) {
      console.log('CHAT-THREADS: clearFile()');
    }
    this.appBase64Upload.clearFile();
  }

  closeAvatarSelectionContainer(event: any): void {
    this.chatThread.closeAvatarSelectionContainer();
  }

  closeChatWindow(): void {
    this.chatWindowHeight = this.getChatWindowHeight();
    this.state = (this.state === 'up' ? 'down' : 'up');
    if(this.debug) {
      console.log('CHAT-THREADS: this.state: ',this.state);
    }
  }

  closeChatWindowStarted(event: AnimationTransitionEvent): void {
    if(this.debug) {
      console.log('closeChatWindowStarted: this.state: ',this.state);
    }
  }

  closeChatWindowDone(event: AnimationTransitionEvent): void {
    if(this.debug) {
      console.log('closeChatWindowDone: this.state: ',this.state);
    }
    this.chatWindowCloseIconClass = (this.state === 'down' ? 'glyphicon glyphicon-chevron-up' : 'glyphicon glyphicon-chevron-down');
  }

  ngOnDestroy() {
    if (this.subscriptionBadgeState) {
      this.subscriptionBadgeState.unsubscribe();
    }
    if(this.subscriptionChatThreadInitState) {
      this.subscriptionChatThreadInitState.unsubscribe();
    }
    if(this.subscriptionChatThreadInitDbMessagesLength) {
      this.subscriptionChatThreadInitDbMessagesLength.unsubscribe();
    }
    if(this.subscriptionDoCloseChatThreadWindow) {
      this.subscriptionDoCloseChatThreadWindow.unsubscribe();
    }
  }

}
