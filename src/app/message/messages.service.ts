import { Injectable, OnDestroy } from '@angular/core';
import { WebsocketService } from '../websocket/websocket.service';
import { Subject, Observable, BehaviorSubject, Subscription } from 'rxjs';
import { HttpClient, HttpHeaders, HttpEventType, HttpRequest, HttpErrorResponse, HttpEvent, HttpParams } from '@angular/common/http';
import * as _ from 'lodash';

import { User } from '../user/user.model';
import { UsersService } from '../user/users.service';
import { Thread } from '../thread/thread.model';
import { ChatThreadService } from '../chat-thread/chat-thread.service';
import { Message } from '../message/message.model';
import { GlobalsService } from '../globals/globals.service';
import { environment } from '../../environments/environment';

const initialMessages: Message[] = [];

interface IMessagesOperation extends Function {
  (messages: Message[]): Message[];
}

@Injectable()
export class MessagesService implements OnDestroy {

  currentThread: Thread;
  threadsService: any;
  currentUser: User;
  messagesCount: number = 0;
  newThreadId: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  // a stream that publishes new messages only once
  newMessages: Subject<Message> = new Subject<Message>();
  // `messages` is a stream that emits an array of the most up to date messages
  messages: Observable<Message[]>;
  postMessages: Observable<Message[]>;
  // `updates` receives _operations_ to be applied to our `messages`
  // it's a way we can perform changes on *all* messages (that are currently
  // stored in `messages`)
  updates: Subject<any> = new Subject<any>();
  // action streams
  create: Subject<Message> = new Subject<Message>();
  markThreadAsRead: Subject<any> = new Subject<any>();
  // websocket intercepts each new message and passes it back to the client via the remote server
  websocket: Subject<any> = new Subject<any>();
  debug: boolean = false;

  subscriptionPostMessages: Subscription;

  constructor(public http: HttpClient,
              public websocketService: WebsocketService, 
              public globalsService: GlobalsService,
              public chatThreadService: ChatThreadService,
              public usersService: UsersService) {

    this.websocket = <Subject<any>>websocketService.connect().map( (response: any): any => {
      const message = JSON.parse(response['text']);
      let contactid = 0;
      if(this.debug) {
        console.log('message: ',message); 
      }
      this.usersService.currentThreadUser.subscribe( (threadUser: User) => {
        if(this.debug) {
          console.log('MESSAGES.SERVICE: usersService.currentThreadUser.subscribe');
        }
        if(this.debug) {
          console.log('websocket: threadUser: ',threadUser);
        }
        this.usersService.currentUser.subscribe( (user: User) => {
          if(this.debug) {
            console.log('websocket: user: ',user);
          }
          let addMessage = true;
          let postMessage = true;
          if(this.debug) {
            console.log('user.isAdmin: ',user.isAdmin);
          }
          if(environment.split_ui) {
            if(!user.isAdmin) {
              if(this.debug) {
                console.log('threadUser.contactid admin=false: ',threadUser.contactid);
                console.log('message.thread.id admin=false: ',message.thread.id);
              }
              contactid = message.author.contactid;
              if(threadUser.adminid === 0 && message.author.isAdmin) {
                threadUser.adminid = message.author.adminid;
                threadUser.adminsessionid = message.author.adminsessionid;
                this.globalsService.threadOwners.forEach( (threadOwner: any): void => {
                  if(this.debug) {
                    console.log('threadOwner.thread.id: ',threadOwner.thread.id);
                    console.log('threadUser.id: ',threadUser.id);
                  }
                  if(threadOwner.thread.id === threadUser.contactid) {
                    threadOwner.user.adminid = message.author.adminid;
                    threadOwner.user.adminsessionid = message.author.adminsessionid;
                    if(this.debug) {
                      console.log('match: threadOwner.user.adminid: ',threadOwner.user.adminid);
                    }
                  }
                });
                if(this.debug) {
                  console.log('threadUser.adminid: ',threadUser.adminid);
                }
              }
              if(!message.author.isAdmin && message.author.contactid !== threadUser.contactid || message.author.isAdmin && message.thread.id !== threadUser.contactid) {
                addMessage = false;
              }
              if(message.author.isAdmin && message.ping) {
                addMessage = true;
              }
            }
            else{
              message.display = true;
              if(message.author.adminid !== 0) {
                if(user.adminid !== message.author.adminid) {
                  addMessage = false;
                }
              }
              if(message.author.isAdmin && message.ping && isNaN(message.thread.id)) {
                addMessage = false;
              }
              if(!message.author.isAdmin && message.ping) {
                this.threadsService.currentThreads.value.map( (thread: Thread) => {
                  if(this.debug) {
                    console.log('MESSAGES.SERVICE: thread: ',thread);
                  }
                  if(thread.id === message.thread.id) {
                    addMessage = false;
                  }
                });
              }
            }
          }
          if(environment.split_ui) {
            if(this.debug) {
              console.log('message.author.contactid: ',message.author.contactid);
            }
            const threadusercontactid = threadUser ? threadUser.contactid : 0;
            if(this.debug) {
              console.log('threadusercontactid: ',threadusercontactid);
              console.log('user.contactid: ',user.contactid);
            }
            if((message.author.contactid === (threadusercontactid || user.contactid)) || message.ping) {
              postMessage = false;
            }
          }
          if(this.debug) {
            console.log('addMessage: ',addMessage);
            console.log('postMessage: ',postMessage);
          }
          this.getThreadsService().currentThread.subscribe( (thread: Thread) => {
            if(this.debug) {
              console.log('thread getter: ',thread);
            }
            if(environment.split_ui && user.isAdmin && !message.author.isAdmin) {
              this.newThreadId.next('');
              if(message.author.contactid !== thread.id) {
                this.newThreadId.next(message.author.contactid);
                if(this.debug) {
                  console.log('this.newThreadId: ',message.author.contactid);
                }
              }
            }
          });
          if(addMessage) {
            if(this.debug) {
              console.log('MESSAGES.SERVICE: message',message);
            }
            this.newMessages.next(message);
            // now we know the message has been delivered to the client via the websocket and added the new message subject, lets add the message data to the database
            if(postMessage) {
              this.postMessage(message);
            }
          }
        });
      });
    });

    this.messages = this.updates
    // watch the updates and accumulate operations on the messages
    .scan((messages: Message[],
            operation: IMessagesOperation) => {
            return operation(messages);
            },
          initialMessages)
    // make sure we can share the most recent list of messages across anyone
    // who's interested in subscribing and cache the last known list of
    .map( (message: Message) => {
      const messages: Message[] = _.values(message);
      return _.sortBy(messages, (t: Message) => t.sentAt);
    })
    .publishReplay(1)
    .refCount();

    // `create` takes a Message and then puts an operation (the inner function)
    // on the `updates` stream to add the Message to the list of messages.
    //
    // That is, for each item that gets added to `create` (by using `next`)
    // this stream emits a concat operation function.
    //
    // Next we subscribe `this.updates` to listen to this stream, which means
    // that it will receive each operation that is created
    //
    // Note that it would be perfectly acceptable to simply modify the
    // "addMessage" function below to simply add the inner operation function to
    // the update stream directly and get rid of this extra action stream
    // entirely. The pros are that it is potentially clearer. The cons are that
    // the stream is no longer composable.
    this.create
      // prevent message flooding by thread users
      .distinctUntilChanged( (m1: Message, m2: Message) => {
        return m1.author.contactid === m2.author.contactid && m1.text === m2.text;
      })
      .map( (message: Message): IMessagesOperation => {
        return (messages: Message[]) => {
          let _messages = messages;
          if(!messages.find( (_message: Message) => _message.id === message.id)) {
            _messages = messages.concat(message);
            if(this.debug) {
              console.log('MESSAGES.SERVICE: messages.concat(message)',_messages);
            }
          }
          return _messages;
        };
      })
      .subscribe(this.updates);

    this.newMessages.subscribe(this.create);

    // similarly, `markThreadAsRead` takes a Thread and then puts an operation
    // on the `updates` stream to mark the Messages as read
    this.markThreadAsRead.map( (thread: Thread) => {
      return (messages: Message[]) => {
        return messages.map( (message: Message) => {
          // note that we're manipulating `message` directly here. Mutability
          // can be confusing and there are lots of reasons why you might want
          // to, say, copy the Message object or some other 'immutable' here
          if (message.thread.id === thread.id) {
            if(this.debug) {
              console.log('message.isRead: ',message.isRead);
            }
            message.isRead = true;
          }
          return message;
        });
      };
    })
    .subscribe(this.updates);

    this.messages.subscribe( (messages: Array<Message>) => {
      setTimeout(() => {
        this.messagesCount = messages.length;
        if(this.debug) {
          console.log('this.messagesCount: ',this.messagesCount);
        }
      });
    });

  }

  // an imperative function call to this action stream
  addMessage(message: Message): void {
    this.websocket.next(message);
  }

  messagesForThreadUser(thread: Thread, user: User): Observable<Message> {
    return this.newMessages
      .filter( (message: Message) => {
        if(this.debug) {
          console.log('messagesForThreadUser: ',(message.thread.id === thread.id) && (message.author.id !== user.id));
        }
        // belongs to this thread and isn't authored by this user
        return (message.thread.id === thread.id) && (message.author.id !== user.id);
      });
  }

  postMessage(message: Message): void {
    const regex = new RegExp(this.globalsService.baseUrl,'i');
    const authorAvatarSrc = message.author.avatarSrc.replace(regex,'');
    const threadAvatarSrc = message.thread.avatarSrc.replace(regex,'');
    const body = {
      contactid: message.author.contactid,
      threadid: message.thread.id,
      sessionid: message.thread.sessionId,
      adminsessionid: message.author.adminsessionid,
      messageid: message.id,
      authorid: message.author.id,
      fileid: message.file ? message.file.id : '',
      message: message.text,
      authorAvatarSrc: authorAvatarSrc,
      threadAvatarSrc: threadAvatarSrc,
      domain: message.thread.domain,
      clientfilename: message.file ? message.file.clientfilename : '',
      filename: '',
      filetype: message.file ? message.file.filetype : '',
      filesize: message.file ? message.file.filesize : 0,
      filedata: message.file ? message.file.value : ''
    };
    const requestHeaders = new HttpHeaders().set('Content-Type', 'application/json');
    const headers = {
      headers: requestHeaders
    };
    this.http.post(this.globalsService.baseUrl + environment.ajax_dir + '/ajax-ng-post-message-module.cfm', body, headers).map(
      (res: Response) => {
        if(this.debug) {
          console.log('res: ',res);
        }
        if('filename' in res && res['filename'] !== ''){
          if(this.debug) {
            console.log('MESSAGES.SERVICES: filename: ',res['filename']);
          }
          this.postMessages = this.addFileNameToMessage(res['messageid'], res['filename']);
          this.subscriptionPostMessages = this.postMessages.subscribe( (messages: Message[]) => {
            if(this.debug) {
              console.log('MESSAGES.SERVICES: postMessages: ',messages);
            }
          });
          // this.subscriptionPostMessages.unsubscribe();
        }
        return res;
      })
      .subscribe();
  }

  addFileNameToMessage(id: string, filename: string): Observable<Message[]> {
    return this.messages.map( (messages: Message[]) => {
      if(this.debug) {
        console.log('MESSAGES.SERVICES: messages: ',messages);
      }
      messages.map( (message: Message) => {
        if(this.debug) {
          console.log('MESSAGES.SERVICES: message.id: ',message.id);
          console.log('MESSAGES.SERVICES: id: ',id);
        }
        if(message.id === id){
          message.file.filename = filename;
          message.file.value = '';
          if(this.debug) {
           console.log('MESSAGES.SERVICES: message: ',message);
          }
        }
      });
      return messages;
    });
  }

  serializeData( data ) {
    // If this is not an object, defer to native stringification.
    if ( ! _.isObject( data ) ) {
      return( ( data === null ) ? '' : data.toString() );
    }
    const buffer = [];
    // Serialize each key in the object.
    for ( const name in data ) {
        if ( ! data.hasOwnProperty( name ) ) {
          continue;
        }
        const value = data[ name ];
        buffer.push( encodeURIComponent( name ) + '=' + encodeURIComponent( ( value === null ) ? '' : value ));
    }
    // Serialize the buffer and clean it up for transportation.
    const source = buffer.join( '&' ).replace( /%20/g, '+' );
    return( source );
  }

  setThreadsService(threadsService: any): void {
    this.threadsService = threadsService;
  }

  getThreadsService(): any {
    return this.threadsService;
  }

  ngOnDestroy() {
    if (this.subscriptionPostMessages) {
      this.subscriptionPostMessages.unsubscribe();
    }
  }
  
}

export const messagesServiceInjectables: Array<any> = [
  MessagesService
];
