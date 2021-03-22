import { Message } from '../message/message.model';
import { uuid } from '../util/uuid';

/**
 * Thread represents a group of Users exchanging Messages
 */

 export class Thread {

   id: string;
   lastMessage: Message;
   name: string;
   avatarSrc: string;
   email: string;
   isVisible?: boolean;
   lastLogin?: string;
   lastLogout?: string;
   threadStartDateTime?: string;
   threadTime?: string;
   sessionId?: string;
   domain?: string;
   newThreadId?: string;
   maxFilesPerSession?: number;

   constructor(id?: string,
               name?: string,
               avatarSrc?: string,
               email?: string,
               isVisible?: boolean,
               lastLogin?: string,
               lastLogout?: string,
               threadStartDateTime?: string,
               threadTime?: string,
               sessionId?: string,
               domain?: string,
               newThreadId?: string,
               maxFilesPerSession?: number) {
     this.id = id || uuid();
     this.name = name;
     this.avatarSrc = avatarSrc;
     this.email = email;
     this.isVisible = isVisible;
     this.lastLogin = lastLogin;
     this.lastLogout = lastLogout;
     this.threadStartDateTime = threadStartDateTime;
     this.threadTime = threadTime;
     this.sessionId = sessionId;
     this.domain = domain;
     this.newThreadId = newThreadId;
     this.maxFilesPerSession = maxFilesPerSession || 0;
   }

 }
