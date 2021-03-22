import { Component, OnInit } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';

import { User } from '../user/user.model';
import { UsersService } from '../user/users.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'chat-page',
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.css']
})

export class ChatPageComponent implements OnInit {

  currentUser: BehaviorSubject<User> = new BehaviorSubject<User>(null);
  showChatWindow: boolean = false;

  constructor(public usersService: UsersService) { 
    
  }

  ngOnInit() {
    this.currentUser = this.usersService.currentUser;
    if(!environment.use_bots && environment.split_ui) {
      this.showChatWindow = true;
    }
  }

}
