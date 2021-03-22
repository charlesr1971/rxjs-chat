import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable, Subscription } from 'rxjs';
import * as Rx from 'rx-dom';
import { HttpClient, HttpHeaders, HttpEventType, HttpRequest, HttpErrorResponse, HttpEvent } from '@angular/common/http';

import { User } from '../user/user.model';
import { UsersService } from '../user/users.service';
import { Thread } from '../thread/thread.model';
import { Message } from '../message/message.model';
import { File } from '../file/file.model';
import { LoaderService } from '../loader/loader.service';
import { environment } from '../../environments/environment';

const ladycap: User = new User('Lady Capulet', 'assets/images/avatars/female-avatar-2.png', 0, 0, '', false);
const echo: User = new User('Default Thread', 'assets/images/avatars/male-avatar-1.png', 0, 0, '', false);
const rev: User = new User('Reverse Bot', 'assets/images/avatars/female-avatar-4.png', 0, 0, '', false);
const wait: User = new User('Waiting Bot', 'assets/images/avatars/male-avatar-2.png', 0, 0, '', false);

const tLadycap: Thread = new Thread('tLadycap', ladycap.name, ladycap.avatarSrc);
const lastLogin = new Date().toUTCString();
const tEcho: Thread = new Thread('tEcho', echo.name, echo.avatarSrc, '', false, lastLogin);
const tRev: Thread = new Thread('tRev', rev.name, rev.avatarSrc);
const tWait: Thread = new Thread('tWait', wait.name, wait.avatarSrc);

declare var iframeMutationObserver: any;

@Injectable()
export class GlobalsService implements OnDestroy {

  threadOwners: Array<{user: User, thread: Thread}>;
  threadsService: any;
  chatThreadService: any;
  defaultLimit: number = environment.max_messages;
  reviveSession: any;
  chatWindowHeight: number = environment.chat_window_height;
  showLoaderDefault: boolean = environment.show_loader;
  baseUrl: string = '';
  wsUrl: string = '';
  mobileFormat: boolean = false;
  iframeId: string = '';
  iframe: any;
  corsDomain: string = '';
  msgInputHeight: number = environment.message_input_height;
  defaultMessageText: string = environment.default_message_text;
  maxFilesPerSession: number = environment.max_files_per_session;
  maxFileSize: number = environment.max_file_size;
  iframeAvatarSrcMutation = new Subject<any>();
  debug: boolean = false;

  private iframeObserver: any;
  private subscriptionIframeAvatarSrc: Subscription;

  constructor(private http: HttpClient,
              public usersService: UsersService,
              public loaderService: LoaderService) {

    
    this.defaultLimit = this.getUrlParameter('limit');
    if(this.debug) {
      console.log('GLOBALS.SERVICE: this.defaultLimit: ',this.defaultLimit);
    }
    this.reviveSession = (this.getUrlParameter('reviveSession') === 'true');
    if(this.debug) {
      console.log('GLOBALS.SERVICE: this.reviveSession 1: ',this.reviveSession);
    }
    this.chatWindowHeight = this.getUrlParameter('chatWindowHeight');
    if(environment.message_input_height > 30) {
      this.chatWindowHeight = Number(this.chatWindowHeight) + (Number(this.msgInputHeight) - 30);
    }
    if(this.debug) {
      console.log('GLOBALS.SERVICE: this.chatWindowHeight: ',this.chatWindowHeight);
    }
    this.showLoaderDefault = this.getUrlParameter('showLoader');
    if(this.debug) {
      console.log('GLOBALS.SERVICE: this.showLoaderDefault: ',this.showLoaderDefault);
    }
    this.baseUrl = decodeURIComponent(this.getUrlParameter('baseUrl'));
    if(this.debug) {
      console.log('GLOBALS.SERVICE: this.baseUrl: ',this.baseUrl);
    }
    this.wsUrl = decodeURIComponent(this.getUrlParameter('wsUrl'));
    if(this.debug) {
      console.log('GLOBALS.SERVICE: this.wsUrl: ',this.wsUrl);
    }
    this.iframeId = this.getUrlParameter('iframeid');
    if(this.debug) {
      console.log('GLOBALS.SERVICE: this.iframeId: ',this.iframeId);
    }
    const domain = this.extractRootDomain(this.baseUrl).split(':')[0];
    this.corsDomain = domain;
    if(this.debug) {
      console.log('GLOBALS.SERVICE: domain: ',domain);
    }
    this.mobileFormat = (this.getUrlParameter('mobileFormat') === 'true');
    if(this.debug) {
      console.log('GLOBALS.SERVICE: this.mobileFormat: ',this.mobileFormat);
    }
    this.defaultMessageText = decodeURIComponent(this.getUrlParameter('defaultMessageText'));
    if(this.debug) {
      console.log('GLOBALS.SERVICE: this.defaultMessageText: ',this.defaultMessageText);
    }
    this.maxFilesPerSession = this.getUrlParameter('maxFilesPerSession');
    if(this.debug) {
      console.log('GLOBALS.SERVICE: this.maxFilesPerSession: ',this.maxFilesPerSession);
    }
    this.maxFileSize = this.getUrlParameter('maxFileSize');
    if(this.debug) {
      console.log('GLOBALS.SERVICE: this.maxFileSize: ',this.maxFileSize);
    }

    document.domain = domain;
    this.iframe = parent.document.getElementById('ng-chat-' + this.iframeId) || window.document.getElementById('ng-chat-' + this.iframeId) || window.frameElement;
    if(this.debug) {
      console.log('GLOBALS.SERVICE: this.iframe: ',this.iframe);
    }

    if(this.iframe) {
      if(this.debug) {
        console.log('GLOBALS.SERVICE: iframe exists');
      }
      // "@angular/cli": "1.5.0", "@angular/compiler-cli": "5.0.0"
      // this is a production bug fix to allow MutationObserver to register correctly
      const MutationObserver: new(callback) => MutationObserver = ((window as any).MutationObserver as any).__zone_symbol__OriginalDelegate;
      this.iframeObserver = new MutationObserver( (mutations: MutationRecord[]) => {
        if(this.debug) {
          console.log('GLOBALS.SERVICE: MutationObserver exists');
        }
        mutations.forEach( (mutation: MutationRecord) =>  {
          const src = (mutation.target as HTMLInputElement).getAttribute(mutation.attributeName);
          if(this.debug) {
            console.log('GLOBALS.SERVICE: src: ',src);
          }
          return this.iframeAvatarSrcMutation.next(src);
        });
      });
      this.iframeObserver.observe(this.iframe, {
        attributes: true,
        childList: true,
        characterData: true,
        attributeFilter:['data-role-ng-chat-avatar-src-in']
      });
    }

    this.subscriptionIframeAvatarSrc = this.iframeAvatarSrcMutation.subscribe( src => {
      this.usersService.currentThreadUser.subscribe( (user: User) => {
        if(this.debug) {
          console.log('GLOBALS.SERVICE: usersService.currentThreadUser.subscribe');
          console.log('GLOBALS.SERVICE: user: ',user);
        }
        if(user) {
          if(this.debug) {
            console.log('src: ',src);
          }
          if(src && src.trim() !== '') {
            user.avatarSrc = src;
            this.threadsService.currentThread.subscribe( (currentThread: Thread) => {
              currentThread.avatarSrc = src;
              this.threadOwners.forEach( (threadOwner: any): void => {
                if(threadOwner.thread.id === currentThread.id) {
                  threadOwner.user.avatarSrc = src;
                  threadOwner.thread.avatarSrc = src;
                }
              });
            }); 
          }
        }
      });
      this.chatThreadService.doCloseChatThreadWindow.next(null);
    });

    const threadOwners: Array<{user: User, thread: Thread}> = [
      {user: ladycap, thread: tLadycap},
      {user: echo, thread: tEcho},
      {user: rev, thread: tRev},
      {user: wait, thread: tWait}
    ];
    
    this.fetchUsers().subscribe( (data: any) => {
      let thread = tEcho;
      let user = null;
      if(data['contactid'] > 0 && data['name'].trim() !== '') {
        let avatar = 'assets/images/avatars/avatar-no-gender.png';
        if(data['avatarSrc'].trim() !== '') {
          avatar = data['avatarSrc'].trim();
        }
        else {
          if(data['isAdmin']) {
            avatar = 'assets/images/avatars/avatar-admin.png';
          }
        }
        if(data['isAdmin']) {
          user = new User(data['name'], avatar, data['contactid'], data['contactid'], data['rxjschatid'], data['isAdmin']);
        }
        else {
          user = new User(data['name'], avatar, data['contactid'], 0, '', data['isAdmin']);
        }
        if(!data['isAdmin']) {
          const _lastLogin = new Date(data['lastLogin']).toUTCString();
          const lastLogout = new Date(data['lastLogout']).toUTCString();
          const threadStartDateTime = new Date(data['threadStartDateTime']).toUTCString();
          thread = new Thread(data['contactid'], data['name'], avatar, data['email'], false, _lastLogin, lastLogout, threadStartDateTime, '', data['rxjschatid'], data['domain']);
        }
        threadOwners.push({user: user, thread: thread});
        if(this.debug) {
          console.log('global: thread: ', thread);
        }
        this.threadOwners = threadOwners;
      }
    });

    this.threadOwners = threadOwners;

  }


  fetchUsers(): Observable<any> {
    let contactid = this.getUrlParameter('contactid');
    if(isNaN(contactid)) {
      contactid = 0;
    }
    if(this.debug) {
      console.log('contactid: ',contactid);
    }
    const rxjschatid = this.getUrlParameter('rxjschatid');
    if(this.debug) {
      console.log('rxjschatid: ',rxjschatid);
    }
    const domain = this.getUrlParameter('domain');
    if(this.debug) {
      console.log('domain: ',domain);
    }
    this.showLoader();
    return this.http.get(this.baseUrl + environment.ajax_dir + '/ajax-ng-get-contact-module.cfm?contactid=' + contactid + '&rxjschatid=' + rxjschatid + '&domain=' + domain).map(
      (res: Response) => {
        this.hideLoader();
        return res;
      });
  }

  fetchCacheFile(dir): Observable<any> {
    return this.http.get(this.baseUrl + environment.ajax_dir + '/ajax-ng-get-cache-file-module.cfm?dir=' + dir).map(
      (res: Response) => {
        return res;
      });
  }

  fetchFile(id): Observable<any> {
    return this.http.get(this.baseUrl + environment.ajax_dir + '/ajax-ng-get-file-module.cfm?messageid=' + id).map(
      (res: Response) => {
        return res;
      });
  }

  fetchMessages(limit: number, params: any): Observable<any> {
    if(this.debug) {
      console.log('GLOBALS.SERVICE: this.reviveSession 2: ',this.reviveSession);
      console.log('GLOBALS.SERVICES: fetchMessages(): params',params);
    }
    return this.http.get(this.baseUrl + environment.ajax_dir + '/ajax-ng-get-message-module.cfm?contactid=' + params.contactid + '&adminid=' + params.adminid + '&sessionid=' + params.sessionid + '&domain=' + params.domain + '&limit=' + limit).map(
      (res: Response) => {
        const data = res;
        const dbMessages = [];
        data['messages'].map( (message: any) => {
          let avatarSrc = message.author.avatarSrc;
          if(avatarSrc.indexOf('/cache/file/user-files/') !== -1 || avatarSrc.indexOf('/cache/file/ng-chat/ng-chat-admin-avatar/') !== -1) {
            avatarSrc = this.baseUrl + avatarSrc;
          }
          const author = new User(message.author.name, avatarSrc, message.author.contactid, message.author.adminid, message.author.adminsessionid, message.author.isAdmin, message.author.id);
          let file = null;
          if(message.file) {
            file = new File(message.file.clientfilename, message.file.filename, message.file.filetype, message.file.filetype, message.file.filesize, message.file.value, message.file.id);
          }
          avatarSrc = message.thread.lastMessage.author.avatarSrc;
          if(avatarSrc.indexOf('/cache/file/user-files/') !== -1 || avatarSrc.indexOf('/cache/file/ng-chat/ng-chat-admin-avatar/') !== -1) {
            avatarSrc = this.baseUrl + avatarSrc;
          }
          const lastMessageAuthor = new User(message.thread.lastMessage.author.name,avatarSrc, message.thread.lastMessage.author.contactid, message.thread.lastMessage.author.adminid, message.thread.lastMessage.author.adminsessionid, message.thread.lastMessage.author.isAdmin, message.thread.lastMessage.author.id);
          let lastMessageFile = null;
          if(message.thread.lastMessage.file) {
            lastMessageFile = new File(message.thread.lastMessage.file.clientfilename, message.thread.lastMessage.file.filename, message.thread.lastMessage.file.filetype, message.thread.lastMessage.file.filetype, message.thread.lastMessage.file.filesize, message.thread.lastMessage.file.value, message.thread.lastMessage.file.id);
          }
          const lastMessage = new Message({id: message.thread.lastMessage.id, sentAt: message.thread.lastMessage.sentAt, isRead: message.thread.lastMessage.isRead, author: lastMessageAuthor, text: message.thread.lastMessage.text, file: lastMessageFile});
          const thread = new Thread(message.thread.id, message.thread.name, message.thread.avatarSrc, message.thread.email, message.thread.isVisible, message.thread.lastLogin, message.thread.lastLogout, message.thread.threadStartDateTime, message.thread.threadTime, message.thread.sessionId, message.thread.domain, message.thread.newThreadId, message.thread.maxFilesPerSession);
          thread.lastMessage = lastMessage;
          if(thread.lastMessage.thread) {
            delete thread.lastMessage.thread;
          }
          if(this.debug) {
            console.log('GLOBALS.SERVICES: fetchMessages(): message: ',message);
          }
          const dbMessage = new Message({id: message.id, sentAt: message.sentAt, isRead: message.isRead, author: author, text: message.text, thread: thread, file: file});
          dbMessages.push(dbMessage);
        });
        if(this.debug) {
          console.log('GLOBALS.SERVICES: fetchMessages(): dbMessages: ',dbMessages);
        }
        return dbMessages;
      });
  }

  getUrlParameter(sParam): any {
    if(this.debug) {
      console.log('iframe src: ',decodeURIComponent(window.location.search.substring(1)));
    }
    return decodeURIComponent(window.location.search.substring(1)).split('&')
     .map((v) => { 
        return v.split('='); 
      })
     .filter((v) => { 
        return (v[0] === sParam) ? true : false; 
      })
     .reduce((acc:any,curr:any) => { 
        return curr[1]; 
      },0);
  };

  extractHostname(url): string {
    let hostname;
    // find & remove protocol (http, ftp, etc.) and get hostname
    if (url.indexOf('://') > -1) {
      hostname = url.split('/')[2];
    }
    else {
      hostname = url.split('/')[0];
    }
    // find & remove port number
    hostname = hostname.split(':')[0];
    // find & remove "?"
    hostname = hostname.split('?')[0];
    return hostname;
  }
    
  extractRootDomain(url): string {
    let domain = this.extractHostname(url);
    const splitArr = domain.split('.');
    const arrLen = splitArr.length;
    // extracting the root domain here
    // if there is a subdomain 
    if (arrLen > 2) {
      domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
      // check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
      if (splitArr[arrLen - 1].length === 2) {
      // this is using a ccTLD
      domain = splitArr[arrLen - 3] + '.' + domain;
      }
    }
    return domain;
  }

  setThreadsService(threadsService: any): void {
    this.threadsService = threadsService;
  }

  getThreadsService(): any {
    return this.threadsService;
  }

  setChatThreadService(chatThreadService: any): void {
    this.chatThreadService = chatThreadService;
  }

  getChatThreadService(): any {
    return this.chatThreadService;
  }

  private showLoader(): void {
    this.loaderService.show();
  }

  private hideLoader(): void {
    this.loaderService.hide();
  }

  ngOnDestroy() {
    if (this.subscriptionIframeAvatarSrc) {
      this.subscriptionIframeAvatarSrc.unsubscribe();
    }
  }

  
}
