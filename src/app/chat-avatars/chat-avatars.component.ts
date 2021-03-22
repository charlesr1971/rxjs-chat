
import { Component, OnInit, Input, ElementRef, OnDestroy, Renderer2, ChangeDetectorRef } from '@angular/core';
import { Observable, Subject, BehaviorSubject, Subscription } from 'rxjs';
import { DeviceDetectorService } from 'ngx-device-detector';

import { Avatar } from '../avatar/avatar.model';
import { AvatarService } from '../avatar/avatar.service';
import { User } from '../user/user.model';
import { UsersService } from '../user/users.service';
import { ChatThreadService } from '../chat-thread/chat-thread.service';
import { GlobalsService } from '../globals/globals.service';

declare var ease, TweenMax, Elastic: any;

@Component({
  selector: 'app-chat-avatars',
  templateUrl: './chat-avatars.component.html',
  styleUrls: ['./chat-avatars.component.css']
})

export class ChatAvatarsComponent implements OnInit, OnDestroy {

  @Input() cell: any;
  avatars: Avatar[];
  deviceInfo = null;
  isSafari: boolean = false;
  currentThreadUserAvatarSrc: string = '';
  state: string = 'down';
  debug: boolean = false;

  private subscriptionAvatarsAnimateSafari: Subscription;
  private subscriptionIframeAvatarSrc: Subscription;
  private subscriptionAvatarSelectionContainerAnimationState: Subscription;

  constructor(private chatThreadService: ChatThreadService,
              public usersService: UsersService,
              public avatarService: AvatarService,
              public globalsService: GlobalsService,
              private changeDetectorRef: ChangeDetectorRef,
              public el: ElementRef,
              private renderer: Renderer2,
              private deviceService: DeviceDetectorService) { 

    this.deviceInfo = this.deviceService.getDeviceInfo();
    if(this.debug) {
      console.log('CHAT-AVATARS: this.deviceInfo: ',this.deviceInfo);
    }
    if(this.deviceInfo.browser.toLowerCase() === 'safari') {
      this.isSafari = true;
    }  
    
    this.isSafari = true;

    let n = 100;
    const incr = n;

    this.avatars = [
      new Avatar('assets/images/avatars/female-avatar-1.png', false, 0),
      new Avatar('assets/images/avatars/male-avatar-1.png', false, n),
      new Avatar('assets/images/avatars/female-avatar-2.png', false, n += incr),
      new Avatar('assets/images/avatars/male-avatar-2.png', false, n += incr),
      new Avatar('assets/images/avatars/female-avatar-3.png', false, n += incr),
      new Avatar('assets/images/avatars/male-avatar-3.png', false, n += incr),
      new Avatar('assets/images/avatars/female-avatar-4.png', false, n += incr),
      new Avatar('assets/images/avatars/male-avatar-4.png', false, n += incr),
      new Avatar('assets/images/avatars/placeholder-avatar.png', true, n += incr),
      new Avatar('assets/images/avatars/placeholder-avatar.png', true, n += incr),
      new Avatar('assets/images/avatars/placeholder-avatar.png', true, n += incr),
      new Avatar('assets/images/avatars/placeholder-avatar.png', true, n += incr)
    ];

    this.subscriptionAvatarsAnimateSafari = this.chatThreadService.avatarsAnimateSafari.subscribe( state => {
      if(this.debug) {
        console.log('CHAT-AVATARS: subscriptionAvatarsAnimateSafari.subscribe(): ',state);
      }
      this.avatarsAnimateSafari();
      if(this.debug) {
        console.log('CHAT-AVATARS: avatarsAnimateSafari() 1');
      }
    });

    this.subscriptionAvatarSelectionContainerAnimationState = this.chatThreadService.avatarSelectionContainerAnimationState.subscribe( state => {
      if(this.debug) {
        console.log('CHAT-AVATARS: avatarSelectionContainerAnimationState.subscribe(): ',state);
      }
      this.state = state;
      if(this.debug) {
        console.log('CHAT-AVATARS: this.state: ',this.state);
      }
    });

    this.subscriptionIframeAvatarSrc = this.globalsService.iframeAvatarSrcMutation.subscribe( src => {
      if(this.debug) {
        console.log('CHAT-AVATARS: iframeAvatarSrcMutation.subscribe(): ',src);
      }
      if(this.state === 'up') {
        this.avatarsAnimateSafari();
        if(this.debug) {
          console.log('CHAT-AVATARS: avatarsAnimateSafari() 2');
        }
      }
    });

  }

  ngOnInit() {
  }

  avatarsAnimateSafari(): void {
    if(this.isSafari) {
      this.usersService.currentThreadUser.subscribe( (user: User) => {
        if(this.debug) {
          console.log('CHAT-AVATARS: usersService.currentThreadUser.subscribe');
        }
        if(user && user.avatarSrc.trim() !== '') {
          let avatars = this.el.nativeElement.querySelectorAll('.avatar-image');
          avatars.forEach(avatar => {
            this.renderer.setStyle(
              avatar,
              'opacity',
              0
            );
            this.renderer.removeClass(avatar, 'animated');
            this.renderer.removeClass(avatar, 'bounceIn');
          });
          this.currentThreadUserAvatarSrc = user.avatarSrc;
          const that = this;
          avatars = document.querySelectorAll('.avatar-tween-max');
          TweenMax.staggerFromTo(avatars, 1, {scale:0, ease:Elastic.easeOut, opacity: 0}, {scale:1, ease:Elastic.easeOut, opacity: function(index, target) {
              const avatarSrc = (target as HTMLInputElement).getAttribute('src');
              if(that.debug) {
                console.log('CHAT-AVATARS: avatarSrc: ',avatarSrc);
                console.log('CHAT-AVATARS: that.currentThreadUserAvatarSrc: ',that.currentThreadUserAvatarSrc);
              }
              return avatarSrc.toLowerCase() === that.currentThreadUserAvatarSrc.toLowerCase() ? 1 : 0.5; 
            }
          }, 0.25);
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.subscriptionAvatarsAnimateSafari) {
      this.subscriptionAvatarsAnimateSafari.unsubscribe();
    }
    if(this.subscriptionIframeAvatarSrc) {
      this.subscriptionIframeAvatarSrc.unsubscribe();
    }
    if(this.subscriptionAvatarSelectionContainerAnimationState) {
      this.subscriptionAvatarSelectionContainerAnimationState.unsubscribe();
    }
  }

}
