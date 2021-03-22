import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { Lightbox } from 'angular2-lightbox';

import { UsersService } from './../user/users.service';
import { ThreadsService } from './../thread/threads.service';
import { MessagesService } from './../message/messages.service';
import { Message } from './../message/message.model';
import { Thread } from './../thread/thread.model';
import { User } from './../user/user.model';
import { GlobalsService } from '../globals/globals.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'chat-message',
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.css']
})

export class ChatMessageComponent implements OnInit {

  @Input() message: Message;

  currentUser: User;
  currentThread: Thread;
  incoming: boolean;
  display: boolean = true;
  debug: boolean = false;
  
  private album: Array<any> = [];
  private subscriptionLightBox: Subscription;

  constructor(public UsersService: UsersService,
              public threadsService: ThreadsService,
              public globalsService: GlobalsService,
              public messagesService: MessagesService,
              private lightBox: Lightbox,
              public el: ElementRef) {

  }

  ngOnInit(): void {
    this.UsersService.currentUser.subscribe( (user: User) => {
      this.currentUser = user;
      if(this.debug) {
        console.log('CHAT-MESSAGE: this.currentUser: ',this.currentUser);
      }
      if (this.message.author && user) {
        this.incoming = this.message.author.id !== user.id;
      }
      if(this.currentUser.adminid === 0 && this.message.author.isAdmin) {
        this.incoming = false;
      }
      if(this.currentUser.adminid > 0 && this.message.author.isAdmin) {
        this.incoming = false;
      }
      if(!this.currentUser.isAdmin && !this.message.display) {
        this.display = false;
      }
    });
    this.threadsService.currentThread.subscribe( (thread: Thread) => {
      this.currentThread = thread;
    }); 
    this.messagesService.messages.subscribe( (messages: Array<Message>) => {
      // Once the message recipient's data has been posted to the db, get filename.
      // Timeout may need to be adjusted as base64 data can take time to send & process
      if(this.debug) {
        console.log('CHAT-MESSAGE: this.message.file: ',this.message.file);
      }
      if(this.message.file && this.message.file.filename.trim() === '') {
        setTimeout( () => {
          this.globalsService.fetchFile(this.message.id).subscribe((data: any) => {
            if(this.debug) {
              console.log('CHAT-MESSAGE: this.message.id: ',this.message.id);
              console.log('CHAT-MESSAGE: data: ',data);
            }
            if('file' in data && 'filename' in data['file'] && data['file']['filename'].trim() !== ''){
              if(this.debug) {
                console.log('CHAT-MESSAGE: filename: ',data['file']['filename']);
              }
              this.message.file.filename = data['file']['filename'];
              this.message.file.value = '';
            }
          });
        },2000);
      }
    });
  }

  openFile(): void{   
    const album = {
      src: this.message.file.value === '' ? this.globalsService.baseUrl + environment.file_dir + '/' + this.message.file.filename : 'data:' + this.message.file.filetype + ';base64,' + this.message.file.value
    };
    if(this.debug) {
      console.log('CHAT-MESSAGE: openFile(): album: ',album);
    }
    this.album.push(album);
    this.lightBox.open(this.album,0,{ centerVertically: true, showImageNumberLabel: false });
  }

  isBase64(str): boolean {
    try {
        return btoa(atob(str)) === str;
    } catch (err) {
        return false;
    }
  }

}
