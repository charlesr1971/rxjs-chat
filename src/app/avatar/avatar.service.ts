import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs/Rx';

@Injectable()
export class AvatarService {

  avatarSelected = new Subject<any>();
  avatarAnimationStart = new Subject<any>();

  constructor() {
    
  }

}
