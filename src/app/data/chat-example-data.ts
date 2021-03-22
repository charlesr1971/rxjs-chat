/* tslint:disable:max-line-length */
import { Subject, Observable } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import * as _ from 'lodash';

import { User } from '../user/user.model';
import { Thread } from '../thread/thread.model';
import { Message } from '../message/message.model';
import { MessagesService } from '../message/messages.service';
import { ThreadsService } from '../thread/threads.service';
import { ChatThreadService } from '../chat-thread/chat-thread.service';
import { UsersService } from '../user/users.service';
import { uuid } from '../util/uuid';
import { environment } from '../../environments/environment';
import { GlobalsService } from '../globals/globals.service';
import * as moment from 'moment';

export class ChatExampleData {

  static init(messagesService: MessagesService, threadsService: ThreadsService, usersService: UsersService, globalsService: GlobalsService, cookieService: CookieService, chatThreadService: ChatThreadService): void {

    const me: User = new User('Juliet', 'assets/images/avatars/female-avatar-1.png', 0, 0, '', false);
    const ladycap: User = globalsService.threadOwners[0].user;
    const echo: User = globalsService.threadOwners[1].user;
    const rev: User = globalsService.threadOwners[2].user;
    const wait: User = globalsService.threadOwners[3].user;
    const tLadycap: Thread = globalsService.threadOwners[0].thread;
    const tEcho: Thread = globalsService.threadOwners[1].thread;
    const tRev: Thread = globalsService.threadOwners[2].thread;
    const tWait: Thread = globalsService.threadOwners[3].thread;
    const initialMessages: Array<Message> = [];
    const _threads: { [key: string]: Thread } = {};
    const debug: boolean = false;

    if (environment.use_bots) {
      initialMessages.push(
        new Message({
          author: me,
          sentAt: moment().subtract(45, 'minutes').toDate(),
          text: 'Yet let me weep for such a feeling loss.',
          thread: tLadycap
        })
      );
      initialMessages.push(
        new Message({
          author: ladycap,
          sentAt: moment().subtract(20, 'minutes').toDate(),
          text: 'So shall you feel the loss, but not the friend which you weep for.',
          thread: tLadycap
        })
      );
      initialMessages.push(
        new Message({
          author: echo,
          sentAt: moment().subtract(1, 'minutes').toDate(),
          text: `I\'ll echo whatever you send me`,
          thread: tEcho
        })
      );
      initialMessages.push(
        new Message({
          author: rev,
          sentAt: moment().subtract(3, 'minutes').toDate(),
          text: `I\'ll reverse whatever you send me`,
          thread: tRev
        })
      );
      initialMessages.push(
        new Message({
          author: wait,
          sentAt: moment().subtract(4, 'minutes').toDate(),
          text: `I\'ll wait however many seconds you send to me before responding. Try sending '3'`,
          thread: tWait
        }),
      );
    }

    globalsService.fetchUsers().subscribe((data: any) => {
      // TODO make `messages` hot
      messagesService.websocket.subscribe();
      // set "Juliet" as the current user
      usersService.setCurrentUser(me);
      // set db user as the current user, if meaningful data is returned
      let thread = tEcho;
      let user = null;
      if (environment.use_thread_input) {
        if (data['contactid'] > 0 && data['name'].trim() !== '') {
          let avatar = 'assets/images/avatars/avatar-no-gender.png';
          if (data['avatarSrc'].trim() !== '') {
            avatar = data['avatarSrc'].trim();
          }
          else {
            if (data['isAdmin']) {
              avatar = 'assets/images/avatars/avatar-admin.png';
            }
          }
          if (data['isAdmin']) {
            user = new User(data['name'], avatar, data['contactid'], data['contactid'], data['rxjschatid'], data['isAdmin']);
          }
          else {
            user = new User(data['name'], avatar, data['contactid'], 0, '', data['isAdmin']);
          }
          if (data['isAdmin']) {
            usersService.setCurrentUser(user);
          }
          if (!data['isAdmin']) {
            const lastLogin = new Date(data['lastLogin']).toUTCString();
            const lastLogout = new Date(data['lastLogout']).toUTCString();
            const threadStartDateTime = new Date(data['threadStartDateTime']).toUTCString();
            thread = new Thread(data['contactid'], data['name'], avatar, data['email'], false, lastLogin, lastLogout, threadStartDateTime, '', data['rxjschatid'], data['domain']);
            const message = new Message({
              author: user,
              text: globalsService.defaultMessageText,
              thread: thread,
              display: false
            });
            initialMessages.push(message);
            usersService.setCurrentThreadUser(user);
          }
        }
      }
      // create the initial messages
      if (debug) {
        console.log('CHAT-EXAMPLE-DATA: globalsService.reviveSession: ', globalsService.reviveSession);
      }
      if (!globalsService.reviveSession) {
        if (debug) {
          console.log('CHAT-EXAMPLE-DATA: globalsService.reviveSession');
        }
        if (initialMessages.length) {
          chatThreadService.chatThreadInitState.next(1);
          if (debug) {
            console.log('CHAT-EXAMPLE-DATA: chatThreadInitState: 1');
          }
          initialMessages.map((message: Message) => messagesService.addMessage(message));
        }
      }
      else {
        if (initialMessages.length) {
          chatThreadService.chatThreadInitState.next(2);
          initialMessages.map((message: Message) => messagesService.addMessage(message));
        }
        threadsService.currentThreadMessages.subscribe((messages: Array<Message>) => {
          if (debug) {
            console.log('CHAT-EXAMPLE-DATA: currentThreadMessages: messages ', messages);
          }
        });

        threadsService.currentThread.subscribe((thread: Thread) => {
          if (debug) {
            console.log('CHAT-EXAMPLE-DATA: currentThreadMessages: thread ', thread);
          }
          const threadid = thread.id.toString();
          const threadIsValid = !isNaN(parseInt(thread.id, 10)) && threadid.indexOf('-') === -1 ? true : false;
          if (debug) {
            console.log('CHAT-EXAMPLE-DATA: threadIsValid 1: ', threadIsValid);
          }
        });
        // fetch messages, only once, if 'reviveSession' is true
        // keep a record of the threads whose messages have been fetched to prevent data recursion
        const threads = threadsService.currentThread
          .subscribe((thread: Thread) => {
            const threadid = thread.id.toString();
            // only use threads with numeric thread id
            const threadIsValid = !isNaN(parseInt(thread.id, 10)) && threadid.indexOf('-') === -1 ? true : false;
            const threadExists = _threads.hasOwnProperty(thread.id) ? true : false;
            // only fetch messages for threads that have not been added to the class _threads object
            if (!threadExists && threadIsValid) {
              _threads[thread.id] = thread;
              if (debug) {
                console.log('CHAT-EXAMPLE-DATA: _threads[thread.id] 2: ', _threads[thread.id]);
              }
              if (threadIsValid) {
                if (debug) {
                  console.log('CHAT-EXAMPLE-DATA: thread: ', thread);
                }
                const message = thread.lastMessage;
                if (debug) {
                  console.log('CHAT-EXAMPLE-DATA: thread.lastMessage: ', message);
                }
                let adminid = 0;
                if (message) {
                  adminid = message.author.adminid;
                }
                const params = {
                  contactid: thread.id,
                  adminid: adminid > 0 ? adminid : (data['isAdmin'] ? data['contactid'] : 0),
                  sessionid: thread.sessionId,
                  domain: thread.domain
                };
                if (debug) {
                  console.log('CHAT-EXAMPLE-DATA: params: ', params);
                }
                globalsService.fetchMessages(globalsService.defaultLimit, params).subscribe((dbMessages: any) => {
                  if (dbMessages.length > 0) {
                    chatThreadService.chatThreadInitState.next(3);
                    dbMessages.map((message: Message) => {
                      if (globalsService.maxFilesPerSession > 0) {
                        if (message.thread.maxFilesPerSession < globalsService.maxFilesPerSession) {
                          chatThreadService.chatThreadInitState.next(4);
                          if (debug) {
                            console.log('CHAT-EXAMPLE-DATA: chatThreadInitState: ', 4);
                          }
                        }
                      }
                    });
                    chatThreadService.chatThreadInitDbMessagesLength.next(dbMessages.length);
                    dbMessages.map((message: Message) => messagesService.addMessage(message));
                    if (debug) {
                      console.log('CHAT-EXAMPLE-DATA: dbMessages: ', dbMessages);
                    }
                  }
                });
              }
            }
          });
      }
      // observe ping from admin
      messagesService.messages.subscribe((messages: Array<Message>) => {
        const lastMessage = _.chain(messages)
          .takeRight()
          .value();
        if (debug) {
          console.log('CHAT-EXAMPLE-DATA: ping: lastMessage: ', lastMessage);
        }
        let message = null;
        if (lastMessage.length && user && thread && !data['isAdmin']) {
          message = lastMessage[0].ping && lastMessage[0].author.isAdmin ? new Message({
            author: user,
            text: globalsService.defaultMessageText,
            thread: thread,
            ping: true,
            display: false
          }) : null;
        }
        if (message) {
          if (debug) {
            console.log('CHAT-EXAMPLE-DATA: ping: message: ', message);
          }
          if (debug) {
            console.log('CHAT-EXAMPLE-DATA: ping: lastMessage: ', lastMessage);
          }
          messagesService.addMessage(message);
        }
      });
      // set thread as the current user
      threadsService.setCurrentThread(thread);
      if (debug) {
        console.log('usersService.currentUser: ', usersService.currentUser);
        console.log('usersService.currentThreadUser: ', usersService.currentThreadUser);
        console.log('threadsService.currentThread: ', threadsService.currentThread);
      }
      // initialise bots to send replies to admin, automatically 
      if (environment.use_bots && !environment.use_thread_input) {
        this.setupBots(messagesService, globalsService);
      }
    });

  }

  static setupBots(messagesService: MessagesService, globalsService: GlobalsService): void {

    const ladycap: User = globalsService.threadOwners[0].user;
    const echo: User = globalsService.threadOwners[1].user;
    const rev: User = globalsService.threadOwners[2].user;
    const wait: User = globalsService.threadOwners[3].user;

    const tLadycap: Thread = globalsService.threadOwners[0].thread;
    const tEcho: Thread = globalsService.threadOwners[1].thread;
    const tRev: Thread = globalsService.threadOwners[2].thread;
    const tWait: Thread = globalsService.threadOwners[3].thread;

    // echo bot
    messagesService.messagesForThreadUser(tEcho, echo)
      .forEach((message: Message): void => {
        messagesService.addMessage(
          new Message({
            author: echo,
            text: message.text,
            thread: tEcho
          })
        );
      },
        null);


    // reverse bot
    messagesService.messagesForThreadUser(tRev, rev)
      .forEach((message: Message): void => {
        messagesService.addMessage(
          new Message({
            author: rev,
            text: message.text.split('').reverse().join(''),
            thread: tRev
          })
        );
      },
        null);

    // waiting bot
    messagesService.messagesForThreadUser(tWait, wait)
      .forEach((message: Message): void => {

        let waitTime: number = parseInt(message.text, 10);
        let reply: string;

        if (isNaN(waitTime)) {
          waitTime = 0;
          reply = `I didn\'t understand ${message.text}. Try sending me a number`;
        } else {
          reply = `I waited ${waitTime} seconds to send you this.`;
        }

        setTimeout(
          () => {
            messagesService.addMessage(
              new Message({
                author: wait,
                text: reply,
                thread: tWait
              })
            );
          },
          waitTime * 1000);
      },
        null);

  }


}
