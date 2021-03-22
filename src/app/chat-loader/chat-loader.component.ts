import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { LoaderService } from '../loader/loader.service';
import { LoaderState } from '../loader/loader';
import { User } from '../user/user.model';
import { UsersService } from '../user/users.service';
import { GlobalsService } from '../globals/globals.service';

@Component({
  selector: 'app-chat-loader',
  templateUrl: './chat-loader.component.html',
  styleUrls: ['./chat-loader.component.css']
})

export class ChatLoaderComponent implements OnInit, OnDestroy {

  currentUser: User;
  show: boolean = false;
  loaderSize: string = 'extra-large';
  debug: boolean = false;
  
  private subscriptionLoaderState: Subscription;
  private subscriptionLoaderSize: Subscription;

  constructor(private loaderService: LoaderService,
              public usersService: UsersService,
              public globalsService: GlobalsService) { 

  }

  ngOnInit() { 
    this.subscriptionLoaderState = this.loaderService.loaderState.subscribe( (state: LoaderState) => {
      if(this.globalsService.showLoaderDefault) {
        this.show = state.show;
      }
    });
    this.subscriptionLoaderSize = this.loaderService.loaderSize.subscribe( (size: string) => {
        this.loaderSize = size;
    });
    this.usersService.currentUser.subscribe( (user: User) => {
      this.currentUser = user;
      if(this.debug) {
        console.log('CHAT-LOADER: this.currentUser: ',this.currentUser);
      }
    });
  }

  ngOnDestroy() {
    if(this.subscriptionLoaderState) {
      this.subscriptionLoaderState.unsubscribe();
    }
    if(this.subscriptionLoaderSize) {
      this.subscriptionLoaderSize.unsubscribe();
    }
  }

}
