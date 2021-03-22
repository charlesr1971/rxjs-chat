import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class ChatThreadService {

  badgeChatThreadsState = new Subject<any>();
  badgeChatWindowState = new Subject<any>();
  badgeChatThreadState = new Subject<any>();
  threadHasPreviousMessageState = new Subject<any>();
  chatThreadInitState = new Subject<any>();
  chatThreadInitDbMessagesLength = new Subject<any>();
  showMessageLoader = new Subject<any>();
  showFileChangeIcon = new Subject<any>();
  avatarsAnimateSafari = new Subject<any>();
  avatarSelectionContainerAnimationState = new Subject<any>();
  doCloseChatThreadWindow = new Subject<any>();

  private selectionAnimationState = new Subject<any>();
  private threadMessagesRemovalComplete = new Subject<any>();

  constructor() {

  }

  setAnimationState(state: any) {
    this.selectionAnimationState.next(state);
  }

  getAnimationState(): Observable<any> {
    return this.selectionAnimationState.asObservable();
  }

  setThreadMessagesRemovalComplete(state: any) {
    this.threadMessagesRemovalComplete.next(state);
  }

  getThreadMessagesRemovalComplete(): Observable<any> {
    return this.threadMessagesRemovalComplete.asObservable().first();
  }

}

export const chatThreadServiceInjectables: Array<any> = [
  ChatThreadService
];
