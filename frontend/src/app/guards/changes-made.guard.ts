import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';

export interface ChangeableComponent {
  changesMade: boolean;
};

export function checkSaveChangesBeforeLeave(): boolean {
  return confirm("Are you sure you want to leave this page? You have unsaved changes which will be lost.");
}

@Injectable({
  providedIn: 'root'
})
export class ChangesMadeGuard implements CanDeactivate<ChangeableComponent> {

  constructor() { }

  canDeactivate(x: ChangeableComponent): boolean {
    if (x.changesMade) {
      return checkSaveChangesBeforeLeave();
    } else {
      return true;
    }
  }

}
