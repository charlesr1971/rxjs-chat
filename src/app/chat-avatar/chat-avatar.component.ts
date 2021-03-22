import { Component, OnInit, OnDestroy, Input, ElementRef, Renderer2 } from '@angular/core';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { AnimationTransitionEvent } from '@angular/core';
import { easeOutBounce } from 'easing-utils';
import { DeviceDetectorService } from 'ngx-device-detector';

import { Avatar } from '../avatar/avatar.model';
import { AvatarService } from '../avatar/avatar.service';
import { User } from '../user/user.model';
import { UsersService } from '../user/users.service';
import { ThreadsService } from '../thread/threads.service';
import { Thread } from '../thread/thread.model';
import { GlobalsService } from '../globals/globals.service';

@Component({
  selector: 'app-chat-avatar',
  templateUrl: './chat-avatar.component.html',
  styleUrls: ['./chat-avatar.component.css'],
  animations: [
    trigger('scaleImageAvatar', [
        state('up', style({
          transform: 'scale(1)',
          opacity: '{{opacityImageAvatar}}',
        }),{params: {opacityImageAvatar: 0.5}}),
        state('down', style({
          transform: 'scale(0)',
          opacity: 0,
        }),{params: {scaleImageAvatarDelay: 0}}),
        transition('up => down', animate('500ms {{scaleImageAvatarDelay}}ms ease-in')),
        transition('down => up', animate('500ms {{scaleImageAvatarDelay}}ms ease-out'))
    ]),
  ]
})
export class ChatAvatarComponent implements OnInit, OnDestroy {

  @Input() avatar: Avatar;

  state: string = 'down';
  scaleImageAvatarDelay: number = 0;
  opacityImageAvatar: number = 0.5;
  avatarSrc: string = '';
  deviceInfo = null;
  isSafari: boolean = false;
  debug: boolean = false;

  private avatarAnimationStartSubscription: Subscription;

  constructor(public threadsService: ThreadsService,
    public usersService: UsersService,
    public avatarService: AvatarService,
    public globalsService: GlobalsService,
    private deviceService: DeviceDetectorService,
    private renderer: Renderer2,
    public el: ElementRef) { 

      this.deviceInfo = this.deviceService.getDeviceInfo();
      if(this.debug) {
        console.log('CHAT-AVATAR: this.deviceInfo: ',this.deviceInfo);
      }
      if(this.deviceInfo.browser.toLowerCase() === 'safari') {
        this.isSafari = true;
      }

      this.isSafari = true;
      
  }

  ngOnInit() {
    this.avatarAnimationStartSubscription = this.avatarService.avatarAnimationStart.subscribe( target => {
      this.state = 'up';
    });
    this.usersService.currentThreadUser.subscribe( (user: User) => {
      if(this.debug) {
        console.log('CHAT-AVATAR: usersService.currentThreadUser.subscribe');
      }
      this.avatarSrc = user.avatarSrc;
      if(this.avatarSrc === this.avatar.src) {
        this.opacityImageAvatar = 1;
        if(this.debug) {
          console.log('CHAT-AVATAR: this.avatarSrc: ',this.avatarSrc);
        }
      }
    });
  }

  addAvatar(event: any): void {
    const target = event.target || event.srcElement || event.currentTarget;
    if(this.debug) { 
      console.log('CHAT-AVATAR: target: ',target);
    }
    const srcAttr = target.attributes.src;
    if(this.debug) { 
      console.log('CHAT-AVATAR: srcAttr: ',srcAttr);
    }
    const src = srcAttr.nodeValue;
    if(this.debug) { 
      console.log('src: ',src);
    }
    if(src.trim() !== '') {
      this.usersService.currentThreadUser.subscribe( (user: User) => {
        if(this.debug) {
          console.log('CHAT-AVATAR: usersService.currentThreadUser.subscribe');
        }
        user.avatarSrc = src;
      });
      this.threadsService.currentThread.subscribe( (currentThread: Thread) => {
        currentThread.avatarSrc = src;
        this.globalsService.threadOwners.forEach( (threadOwner: any): void => {
          if(threadOwner.thread.id === currentThread.id) {
            threadOwner.user.avatarSrc = src;
            threadOwner.thread.avatarSrc = src;
          }
        });
      }); 
      this.avatarService.avatarSelected.next(target);
    }
  }

  scaleImageAvatar(): void {
    this.state = 'up';
  }

  scaleImageAvatarStarted(event: AnimationTransitionEvent): void {
    if(this.debug) { 
      console.log('scaleImageAvatarStarted: this.state: ',this.state);
    }
  }

  ngOnDestroy() {
    if (this.avatarAnimationStartSubscription) {
      this.avatarAnimationStartSubscription.unsubscribe();
    }
  }

}
