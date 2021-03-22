import { Component, Inject, ElementRef, ViewChild, OnInit, OnDestroy, ChangeDetectionStrategy, AfterViewChecked, AfterViewInit, Renderer2 } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { AnimationTransitionEvent } from '@angular/core';
import { easeOutBounce } from 'easing-utils';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/Subscription';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { DeviceDetectorService } from 'ngx-device-detector';
import * as _ from 'lodash';

import { User } from '../user/user.model';
import { UsersService } from '../user/users.service';
import { Thread } from '../thread/thread.model';
import { ThreadsService } from '../thread/threads.service';
import { Message } from '../message/message.model';
import { MessagesService } from '../message/messages.service';
import { ChatThreadService } from '../chat-thread/chat-thread.service';
import { File } from '../file/file.model';
import { GlobalsService } from '../globals/globals.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css'],
  animations: [
    trigger('closeChatWindow', [
        state('up', style({
          bottom: '0px',
        })),
        state('down', style({
          bottom: '-{{chatWindowHeight}}px',
        }),{params: {chatWindowHeight: 146}}),
        transition('up => down', animate('250ms ease-in')),
        transition('down => up', animate('250ms ease-out'))
    ]),
  ]
})

export class ChatWindowComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('chatWindow') chatWindowView: ElementRef;
  @ViewChild('appBase64Upload') appBase64Upload;
  @ViewChild('fetchMessages') fetchMessagesBtn: ElementRef;

  messages: Observable<any>;
  toggleMessages: Observable<any>;
  currentThread: Thread;
  draftMessage: Message;
  currentUser: User;
  state: string = 'down';
  chatWindowHeight: number;
  chatWindowCloseIconClass: string = 'glyphicon glyphicon-chevron-up';
  messagesCount: number = 0;
  file: File;
  selectionAnimationState: any = {};
  newMessage: boolean;
  threadHasPreviousMessages: boolean;
  limitMessages: boolean;
  chatWindowHeightDefault: number = environment.chat_window_height;
  msgContainerBaseHeight: number = 0;
  msgInputHeight: number = environment.message_input_height;
  showMessageLoader: boolean;
  mobileFormat: boolean = false;
  deviceInfo = null;
  debug: boolean = false;

  private subscriptionAnimationState: Subscription;
  private subscriptionBadgeState: Subscription;
  private subscriptionThreadHasPreviousMessageState: Subscription;
  private subscriptionMessages: Subscription;
  private subscriptionShowMessageLoader: Subscription;
  
  constructor(public messagesService: MessagesService,
              public threadsService: ThreadsService,
              public UsersService: UsersService,
              public globalsService: GlobalsService,
              public el: ElementRef,
              private chatThreadService: ChatThreadService,
              private deviceService: DeviceDetectorService,
              private renderer: Renderer2) {

    this.subscriptionAnimationState = this.chatThreadService.getAnimationState().subscribe( selectionAnimationState => {
      this.state = selectionAnimationState;
    });

    this.subscriptionBadgeState = this.chatThreadService.badgeChatWindowState.subscribe( badgeState => {
      this.newMessage = this.state === 'down' && this.messagesCount > 0 ? true : false;
      if(this.debug) {
        console.log('chat-window: this.newMessage 1: ',this.newMessage);
      }
    });

    this.subscriptionThreadHasPreviousMessageState = this.chatThreadService.threadHasPreviousMessageState.subscribe( threadHasPreviousMessageState => {
      this.threadHasPreviousMessages = threadHasPreviousMessageState;
      this.limitMessages = false;
      if(this.debug) {
        console.log('CHAT-WINDOW: this.threadHasPreviousMessages: ',this.threadHasPreviousMessages);
      }
    });

    this.subscriptionShowMessageLoader = this.chatThreadService.showMessageLoader.subscribe( state => {
      this.showMessageLoader = state;
      if(this.debug) {
        console.log('CHAT-WINDOW: this.showThreadLoader: ',this.showMessageLoader);
      }
    });

    const chatWindowHeightDefault = this.globalsService.chatWindowHeight;            
    if(chatWindowHeightDefault > 0) {            
      this.chatWindowHeightDefault = chatWindowHeightDefault;   
      if(this.debug) {
        console.log('CHAT-WINDOW.SERVICE: this.chatWindowHeightDefault: ',this.chatWindowHeightDefault); 
      }
      this.msgContainerBaseHeight = this.chatWindowHeightDefault - 96;
      if(this.debug) {
        console.log('CHAT-WINDOW.SERVICE: this.msgContainerBaseHeight: ',this.msgContainerBaseHeight);
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
    this.draftMessage = new Message();
    this.threadsService.currentThread.subscribe( (thread: Thread) => {
      this.currentThread = thread;
    });
    this.UsersService.currentUser.subscribe( (user: User) => {
      this.currentUser = user;
    });
    this.messages.subscribe( (messages: Array<Message>) => {
      this.chatThreadService.showMessageLoader.next(false);
      if(this.debug) {
        console.log('CHAT-WINDOW: messages: ',messages);
      }
      setTimeout( () => {
        this.scrollToBottom();
        this.messagesCount = messages.length;
        this.chatThreadService.badgeChatWindowState.next();
        if(this.state === 'down' && this.chatWindowHeightDefault > 0) {
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
    // "@angular/cli": "1.5.0", "@angular/compiler-cli": "5.0.0"
    // this is a production bug fix that allows events to register within input fields, including textarea
    if(environment.production) {
      setTimeout( () => {
        var ngchatmessageinput = this.el.nativeElement.querySelector('#ng-chat-message-input');
        if(ngchatmessageinput) {
          this.renderer.listen(ngchatmessageinput, 'focus', (event: any) => {
            if(this.debug) {
              console.log('CHAT-WINDOW: focus: ',ngchatmessageinput);
            }
            this.onFocus(event);
          });
        }
      });
    }
  }

  ngAfterViewInit() {
  }

  onFocus(event: any): void {
    // console.log('CHAT-WINDOW: onFocus: ',event);
    this.chatThreadService.badgeChatWindowState.next();
    event.preventDefault();
  }

  onEnter(event: any): void {
    // console.log('CHAT-WINDOW: onEnter: ',event);
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
    this.threadsService.currentThread.next(this.currentThread);
  }

  hideMessage(event: any): void {
    this.limitMessages = false;
    this.threadsService.setLimit(environment.max_messages);
    this.threadsService.currentThread.next(this.currentThread);
  }

  sendMessage(): void {
    this.showMessageLoader = true;
    const m: Message = this.draftMessage;
    m.author = this.currentUser;
    m.sentAt = new Date();
    m.thread = this.currentThread;
    m.isRead = true;
    m.file = this.file;
    this.messagesService.addMessage(m);
    this.draftMessage = new Message();
    this.appBase64Upload.clearFile();
    this.file = null;
  }

  scrollToBottom(): void {
    const scrollPane: any = this.el.nativeElement.querySelector('.msg-container-base');
    scrollPane.scrollTop = scrollPane.scrollHeight;
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

  closeChatWindow(): void {
    this.chatWindowHeight = this.getChatWindowHeight();
    this.state = (this.state === 'up' ? 'down' : 'up');
  }

  removeMutateArrayElement(array, element): void {
    const index = array.indexOf(element);
    if (index !== -1) {
      array.splice(index, 1);
      if(this.debug) {
        console.log('CHAT-WINDOW: removeArrayElement(): array: ',array);
      }
    }
  }

  removeNonMutateArrayElement(array, element): any {
    return array.filter(e => e !== element);
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
      console.log('chat-window: chat window height: ',height);
    }
    return height;
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

  getFileAttachment(file: any): void{
    const _file: File = file ? new File(file.value['clientfilename'], file.value['filename'], file.value['filetype'], file.value['binaryFiletype'], file.value['filesize'], file.value['value']) : null;
    this.file = _file;
    if(this.debug) {
      console.log('this.file: ',this.file);
    }
  }

  ngOnDestroy() {
    if (this.subscriptionAnimationState) {
      this.subscriptionAnimationState.unsubscribe();
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
