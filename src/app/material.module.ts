import { NgModule } from '@angular/core';

import {
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSnackBarModule
} from '@angular/material';

@NgModule({
  imports: [
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  exports: [
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSnackBarModule
  ]
})
export class MaterialModule {}
