import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

import { User } from './user.model';
import { environment } from '../../environments/environment';

/**
 * UserService manages our current user
 */

@Injectable()
export class UsersService {

  // `currentUser` contains the current user
  currentUser: BehaviorSubject<User> = new BehaviorSubject<User>(null);
  currentThreadUser: BehaviorSubject<User> = new BehaviorSubject<User>(null);

  constructor() {

  }

  public setCurrentUser(newUser: User): void {
    this.currentUser.next(newUser);
  }

  public setCurrentThreadUser(newUser: User): void {
    this.currentThreadUser.next(newUser);
  }

}

export const userServiceInjectables: Array<any> = [
  UsersService
];
