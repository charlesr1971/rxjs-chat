import {Component, ElementRef, ViewChild, EventEmitter, Output, Input, OnDestroy, Renderer2 } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { Subject, Observable, BehaviorSubject, Subscription } from 'rxjs';

import { User } from '../user/user.model';
import { UsersService } from '../user/users.service';
import { Thread } from '../thread/thread.model';
import { ChatThreadService } from '../chat-thread/chat-thread.service';
import { SnackBarService } from '../snack-bar/snack-bar.service';
import { GlobalsService } from '../globals/globals.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-base64-upload',
  templateUrl: './base64-upload.component.html',
  styleUrls: ['./base64-upload.component.css']
})

export class Base64UploadComponent implements OnDestroy {

  @Output() onFileChanged = new EventEmitter();
  @Input() currentUser: BehaviorSubject<User> = new BehaviorSubject<User>(null);
  @ViewChild('fileInput') fileInput: ElementRef;

  form: FormGroup;
  loading: boolean = false;
  fileStatus: number = 3;
  fileIsValidText = 'File is too large';
  threadInitState: number = 0;
  mobileFormat: boolean = false;
  showFileChangeIcon: boolean = true;
  matSnackBarActionButtonLabel: string = 'Close';
  matSnackBarAction: boolean = true;
  matSnackBarSetAutoHide: boolean = true;
  matSnackBarAutoHide: number = 10000;
  matSnackBarVerticalPosition: string = 'bottom';
  matSnackBarAddExtraClass: boolean = false;
  matSnackBarAddExtraClassName: string = '';
  matSnackBarRef: any = null;
  debug: boolean = false;

  private subscriptionShowFileChangeIcon: Subscription;
  private subscriptionChatThreadInitState: Subscription;

  constructor(private fb: FormBuilder,
              public usersService: UsersService,
              public globalsService: GlobalsService,
              private chatThreadService: ChatThreadService,
              private snackBarService: SnackBarService,
              private renderer: Renderer2) {

    this.createForm();
    this.mobileFormat = this.globalsService.mobileFormat;

    if(this.debug) {
      console.log('BASE64-UPLOAD: this.mobileFormat: ',this.mobileFormat);
    }

    this.subscriptionChatThreadInitState = this.chatThreadService.chatThreadInitState.subscribe( initState => {
      this.threadInitState = initState;
      if(this.debug) {
        console.log('BASE64-UPLOAD: this.threadInitState: ',this.threadInitState);
      }
    });

    this.subscriptionShowFileChangeIcon = this.chatThreadService.showFileChangeIcon.subscribe( state => {
      this.changeFileChangeIcon(state);
      if(this.debug) {
        console.log('BASE64-UPLOAD: this.showFileChangeIcon: ',state);
      }
    });

  }

  createForm() {
    this.form = this.fb.group({
      file: null
    });
  }

  onFileChangeUnSecure(event) {
    // "@angular/cli": "1.5.0", "@angular/compiler-cli": "5.0.0"
    // this is a production bug fix to allow the event to be passed via FileReader onload(), which, in turn exposes event.target & event.target.result
    const FileReader: new() => FileReader = ((window as any).FileReader as any).__zone_symbol__OriginalDelegate;
    const reader = new FileReader();
    if(event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if(this.debug) {
        console.log('BASE64-UPLOAD: file: ',file);
      }
      reader.onload = (evt: any) => {
        if(this.debug) {
          console.log('BASE64-UPLOAD: evt: ',evt);
        }
        const mimetypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'];
        const size = Math.floor(file.size);
        let _file = null;
        const result = evt.target.result;
        if(size < Number(this.globalsService.maxFileSize) && mimetypes.find((mimetype) => mimetype === file.type.toLowerCase())){
          if(this.debug) {
            console.log('BASE64-UPLOAD: result: ',result);
          }
          const filevalue =  result.split(',')[1];
          if(this.debug) {
            console.log('BASE64-UPLOAD: filevalue: ',filevalue);
          }
          if(filevalue && filevalue !== ''){
            this.fileStatus = 1;
            this.form.get('file').setValue({
              clientfilename: file.name,
              filename: '',
              filetype: file.type,
              filesize: file.size,
              value: filevalue
            });
            _file = this.form.get('file');
            if(this.debug) {
              console.log('BASE64-UPLOAD: _file: ',_file);
            }
            this.onFileChanged.emit(_file);
          }
          else{
            this.fileStatus = 2;
            this.onFileChanged.emit(_file);
            this.openSnackBar('The file requested contains no data or is empty');
          }
        }
        else{
          this.fileStatus = 2;
          this.onFileChanged.emit(_file);
          if(size < Number(this.globalsService.maxFileSize)){
            this.openSnackBar('Please choose an image file with either a \'jpg\', \'png\' or \'gif\' file extension');
          }
          else{
            this.openSnackBar('Please choose a file that is less than 500Kb');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  }

  onFileChangeSecure(event) {
    // "@angular/cli": "1.5.0", "@angular/compiler-cli": "5.0.0"
    // this is a production fix to allow the event to be passed via FileReader onload(), which, in turn exposes event.target & event.target.result
    const FileReader: new() => FileReader = ((window as any).FileReader as any).__zone_symbol__OriginalDelegate;
    const readerDataUrl = new FileReader();
    const readerArrayBuffer = new FileReader();
    let mimetypeIsValid = false;
    if(event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      // onloadend completes before onload
      readerArrayBuffer.onloadend = (evt: any) => {
        if (evt.target.readyState === readerArrayBuffer.DONE) {
          if(this.debug) {
            console.log('BASE64-UPLOAD: readerArrayBuffer.result: ',readerArrayBuffer.result);
          }
          const uint = new Uint8Array(readerArrayBuffer.result);
          if(this.debug) {
            console.log('BASE64-UPLOAD: uint: ',uint);
          }
          const bytes = [];
          uint.forEach((byte) => {
            bytes.push(byte.toString(16));
          });
          const hex = bytes.join('').toUpperCase();
          if(this.debug) {
            console.log('BASE64-UPLOAD: hex: ',hex);
            console.log('BASE64-UPLOAD: this.getMimetype(hex): ',this.getMimetype(hex));
          }
          const mimetypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'];
          mimetypeIsValid = mimetypes.find((mimetype) => mimetype === this.getMimetype(hex)) ? true : false;
        }
        if(this.debug) {
          console.log('BASE64-UPLOAD: readerArrayBuffer.onloadend');
        }
      };
      const blob = file.slice(0, 3);
      readerArrayBuffer.readAsArrayBuffer(blob);
      readerDataUrl.onload = (evt: any) => {
        const size = Math.floor(file.size);
        let _file = null;
        if(size < Number(this.globalsService.maxFileSize) && mimetypeIsValid) {
          const filevalue = readerDataUrl.result.split(',')[1];
          if(filevalue && filevalue !== '') {
            this.fileStatus = 1;
            this.form.get('file').setValue({
              clientfilename: file.name,
              filename: '',
              filetype: file.type,
              filesize: file.size,
              value: filevalue
            });
            _file = this.form.get('file');
            if(this.debug) {
              console.log('BASE64-UPLOAD: _file: ',_file);
            }
            this.onFileChanged.emit(_file);
          }
          else{
            this.fileStatus = 2;
            this.onFileChanged.emit(_file);
            this.openSnackBar('The file requested contains no data or is empty');
          }
        }
        else{
          this.fileStatus = 2;
          this.onFileChanged.emit(_file);
          if(size < Number(this.globalsService.maxFileSize)) {
            this.openSnackBar('Please choose an image file with either a \'jpg\', \'png\' or \'gif\' file extension');
          }
          else{
            this.openSnackBar('Please choose a file that is less than 500Kb');
          }
        }
        if(this.debug) {
          console.log('BASE64-UPLOAD: readerDataUrl.onload');
        }
      };
      readerDataUrl.readAsDataURL(file);
    }
  }

  getMimetype (signature): string {
    switch (signature) {
      case '89504E47':
        return 'image/png';
      case '47494638':
        return 'image/gif';
      case '25504446':
        return 'application/pdf';
      case 'FFD8FF':
        return 'image/jpeg';
      case '504B0304':
        return 'application/zip';
      default:
        return 'Unknown filetype';
    }
  }

  openSnackBar(message: string) {
    const config = {
      message: message,
      action: this.matSnackBarAction ? this.matSnackBarActionButtonLabel : undefined,
      verticalPosition: this.matSnackBarVerticalPosition,
      duration: this.matSnackBarSetAutoHide ? this.matSnackBarAutoHide : 0
    };
    this.snackBarService.snackBarOpen.next(config);
  }

  clearFile() {
    this.form.get('file').setValue(null);
    if(this.debug) {
      console.log('BASE64-UPLOAD: clearFile: this.form.get(\'file\'): ',this.form.get('file'));
    }
    this.fileInput.nativeElement.value = '';
    this.fileStatus = 3;
  }

  changeFileChangeIcon(state: any): void {
    const _currentUser = this.currentUser ? this.currentUser.value : null;
    if(this.debug) {
      console.log('BASE64-UPLOAD: _currentUser: ',_currentUser);
    }
    if(_currentUser && !_currentUser.isAdmin) {
      if((this.showFileChangeIcon && !this.globalsService.reviveSession) || (this.showFileChangeIcon && this.globalsService.reviveSession && this.threadInitState !== 3)) {
        if(this.debug) {
          console.log('BASE64-UPLOAD: this.showFileChangeIcon 1: ',this.showFileChangeIcon);
        }
        this.openSnackBar('Maximimum amount of ' + this.globalsService.maxFilesPerSession  + ' attachments per session has been reached');
      }
      this.showFileChangeIcon = state;
      if(this.debug) {
        console.log('BASE64-UPLOAD: this.showFileChangeIcon 2: ',this.showFileChangeIcon);
      }
    }
    

  }

  ngOnDestroy() {
    if (this.subscriptionShowFileChangeIcon) {
      this.subscriptionShowFileChangeIcon.unsubscribe();
    }
    if(this.subscriptionChatThreadInitState) {
      this.subscriptionChatThreadInitState.unsubscribe();
    }
  }

}
