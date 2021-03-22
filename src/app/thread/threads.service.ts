import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, ReplaySubject, Observable, Subscription} from 'rxjs';
import * as _ from 'lodash';

import { Thread } from './thread.model';
import { Message } from '../message/message.model';
import { MessagesService } from '../message/messages.service';
import { ChatThreadService } from '../chat-thread/chat-thread.service';
import { GlobalsService } from '../globals/globals.service';
import { environment } from '../../environments/environment';

interface IMessagesOperation extends Function {
  (messages: Message[]): Message[];
}

@Injectable()
export class ThreadsService {

  $visible = new Subject<Thread>();
  $threadTime = new Subject<Thread>();
  // `threads` is a observable that contains the most up to date list of threads
  threads: Observable<{ [key: string]: Thread }>;
  // `orderedThreads` contains a newest-first chronological list of threads
  orderedThreads: Observable<Thread[]>;
  // `currentThread` contains the currently selected thread
  currentThread: BehaviorSubject<Thread> = new BehaviorSubject<Thread>(new Thread());
  // `currentThreads` allow imperative 'value' call to access last threads array
  currentThreads: BehaviorSubject<Thread[]> = new BehaviorSubject<Thread[]>(null);
  // `currentThreadMessages` contains the set of messages for the currently
  currentThreadMessages: Observable<Message[]>;
  // `currentThreadMessages` contains the last current thread message
  currentThreadFirstMessage: BehaviorSubject<Message> = new BehaviorSubject<Message>(new Message());
  threadLastMessage: Subject<any> = new Subject<any>();
  limit: number = environment.max_messages;
  debug: boolean = false;

  constructor(public messagesService: MessagesService,
              private chatThreadService: ChatThreadService,
              public globalsService: GlobalsService,) {
    
    const limit = this.globalsService.defaultLimit;            
    if(limit > 0) {            
      this.limit = limit;  
      if(this.debug) { 
        console.log('THREADS.SERVICE: this.limit: ',this.limit); 
      }
    }       

    this.threads = this.messagesService.messages.map( (messages: Message[]) => {
      const threads: {[key: string]: Thread} = {};
      // Store the message's thread in our accumulator `threads`
      messages.map( (message: Message, index: number) => {
        threads[message.thread.id] = threads[message.thread.id] || message.thread;
        // Cache the most recent message for each thread
        const messagesThread: Thread = threads[message.thread.id];
        messagesThread.maxFilesPerSession = index === 0 ? (message.file ? 1 : 0) : (message.file ? Number(messagesThread.maxFilesPerSession) + 1 : messagesThread.maxFilesPerSession);
        if(this.debug) {
          console.log('THREADS.SERVICE: messagesThread.maxFilesPerSession: ',messagesThread.maxFilesPerSession);
        }
        if(this.debug) { 
          console.log('THREADS.SERVICE: messagesThread: ',messagesThread);
        }
        if (!messagesThread.lastMessage || messagesThread.lastMessage.sentAt < message.sentAt) {
          const lastMessage = Object.assign({}, message);
          messagesThread.lastMessage = lastMessage;
          if(messagesThread.lastMessage.thread) {
            // Delete lastMessage thread to prevent recursive data bloat
            messagesThread.lastMessage.thread = null;
          }
        }
      });
      if(this.debug) { 
        console.log('THREADS.SERVICE: threads: ',threads);
      }
      return threads;
    });

    this.orderedThreads = this.threads.map( (threadGroups: { [key: string]: Thread }) => {
      const threads: Thread[] = _.values(threadGroups);
      return _.sortBy(threads, (t: Thread) => t.lastMessage.sentAt).reverse();
    });

    this.currentThreadMessages = this.currentThread.combineLatest( this.messagesService.messages, (currentThread: Thread, messages: Message[]) => {
      if (currentThread && messages.length > 0) {
        if(this.limit > 0) {
          if(this.debug) { 
            console.log('THREADS.SERVICE: currentThreadMessages: branch 1');
          }
          return _.chain(messages)
            .filter((message: Message) => {
              if(this.debug) { 
                console.log('THREADS.SERVICE: message.thread: ',message.thread);
                console.log('THREADS.SERVICE: currentThread: ',currentThread);
              }
              return (message.thread.id === currentThread.id && !message.ping && message.display);
            })
            .map((message: Message, index:number, messages:Message[]) => {
              message.isRead = true;
              if(this.debug) { 
                console.log('THREADS.SERVICE: currentThreadMessages: message',message);
              }
              if (messages.length > this.limit) {
                this.chatThreadService.threadHasPreviousMessageState.next(true);
              }
              return message; 
            })
            .takeRight(this.limit)
            .value();
        }
        else{
          if(this.debug) { 
            console.log('THREADS.SERVICE: currentThreadMessages: branch 2');
          }
          return _.chain(messages)
              .filter((message: Message) => {
                return (message.thread.id === currentThread.id && !message.ping && message.display);
              })
              .map((message: Message, index:number, messages:Message[]) => {
                message.isRead = true;
                return message; 
              })
              .value();
        }
      } 
      else {
        return [];
      }
    });

    this.currentThread.subscribe(this.messagesService.markThreadAsRead);
    this.currentThreadFirstMessage.subscribe();

    this.currentThreadMessages.subscribe( (messages: Array<Message>) => {
      this.setCurrentThreadFirstMessage(_.last(messages));
      if(this.debug) { 
        console.log('THREADS.SERVICE: this.currentThreadFirstMessage: ',this.currentThreadFirstMessage);
      }
    });

    this.currentThreads.subscribe();

    this.orderedThreads.subscribe( (threads: Array<Thread>) => {
      this.setCurrentThreads(threads);
      if(this.debug) { 
        console.log('THREADS.SERVICE: this.currentThreads: ',this.currentThreads);
      }
    });

  }

  setCurrentThreadFirstMessage(message: Message): void {
    this.currentThreadFirstMessage.next(message);
  }

  setCurrentThread(newThread: Thread): void {
    this.currentThread.next(newThread);
  }

  setCurrentThreads(threads: Array<Thread>): void {
    this.currentThreads.next(threads);
  }

  setLimit(limit: number): void {
    this.limit = limit;
  }

}

export const threadsServiceInjectables: Array<any> = [
  ThreadsService
];
