import { Component, OnInit, OnDestroy, Renderer2, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Subject, Observable, BehaviorSubject, Subscription } from 'rxjs';

import { SnackBarService } from '../snack-bar/snack-bar.service';

declare var ease, TweenMax, Elastic: any, Circ: any;

@Component({
  selector: 'snack-bar',
  templateUrl: './snack-bar.component.html',
  styleUrls: ['./snack-bar.component.css']
})
export class SnackBarComponent implements OnInit, OnDestroy {

  snackbarMessage: string = '';
  snackbarAction: string = 'close';
  timeout: any = null;
  durationShow: number = 2;
  durationHide: number = 1;
  verticalPosition: string = 'bottom';
  easeShow: any = Elastic.easeOut;
  easeHide: any =  Circ.easeOut;
  @ViewChild('snackbar') snackbar: ElementRef;
  debug: boolean = false;

  private subscriptionSnackBarOpen: Subscription;

  constructor(private snackBarService: SnackBarService,
              private changeDetectorRef: ChangeDetectorRef,
              private renderer: Renderer2,
              public elementRef: ElementRef) { 

    this.subscriptionSnackBarOpen = this.snackBarService.snackBarOpen.subscribe( config => {
      if(this.snackbar && this.snackbar.nativeElement) {
        let duration = 1000;
        if('message' in config && config.message !== '') {
          this.snackbarMessage = config.message;
        }
        if('action' in config && config.action !== '') {
          this.snackbarAction = config.action;
        }
        if('duration' in config && !isNaN(config.duration) && config.duration > 100) {
          duration = config.duration;
        }
        if('verticalPosition' in config && config.verticalPosition !== '') {
          this.verticalPosition = config.verticalPosition;
        }
        this.renderer.setStyle(
          this.snackbar.nativeElement,
          this.verticalPosition,
          '-1000px'
        );
        this.renderer.setStyle(
          this.snackbar.nativeElement,
          'display',
          'block'
        );
        const height = this.getSnackBarHeight();
        this.changeDetectorRef.detectChanges();
        const that = this;
        if(this.verticalPosition === 'bottom') {
          TweenMax.fromTo(this.snackbar.nativeElement, this.durationShow, {bottom: '-' + height + 'px', ease:this.easeShow}, {bottom: '0px', ease:this.easeShow, onComplete: function(){
            that.timeout = setTimeout( () => {
              TweenMax.fromTo(that.snackbar.nativeElement, that.durationHide, {bottom: '0px', ease:that.easeHide}, {bottom: '-' + height + 'px', ease:that.easeHide});
            },duration);
          }});
        }
        else{
          TweenMax.fromTo(this.snackbar.nativeElement, this.durationShow, {top: '-' + height + 'px', ease:this.easeShow}, {top: '0px', ease:this.easeShow, onComplete: function(){
            that.timeout = setTimeout( () => {
              TweenMax.fromTo(that.snackbar.nativeElement, that.durationHide, {top: '0px', ease:that.easeHide}, {top: '-' + height + 'px', ease:that.easeHide});
            },duration);
          }});
        }
      }
    });

  }

  ngOnInit() {
  }

  close(event: any): void {
    if(this.snackbar && this.snackbar.nativeElement) {
      if(this.timeout) {
        clearTimeout(this.timeout);
      }
      const height = this.getSnackBarHeight();
      if(this.verticalPosition === 'bottom') {
        TweenMax.fromTo(this.snackbar.nativeElement, this.durationHide, {bottom: '0px', ease:this.easeHide}, {bottom: '-' + height + 'px', ease:this.easeHide});
      }
      else{
        TweenMax.fromTo(this.snackbar.nativeElement, this.durationHide, {top: '0px', ease:this.easeHide}, {top: '-' + height + 'px', ease:this.easeHide});
      }
    }
  }

  getSnackBarHeight(): any {
    let height = 0;
    if(this.snackbar && this.snackbar.nativeElement) {
      height = this.snackbar.nativeElement.offsetHeight;
    }
    if(isNaN(height)) {
      height = 0;
    }
    if(this.debug) {
      console.log('SNACK-BAR: height: ',height);
    }
    return height;
  }

  ngOnDestroy() {
    if (this.subscriptionSnackBarOpen) {
      this.subscriptionSnackBarOpen.unsubscribe();
    }
  }

}
