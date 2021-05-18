import { EventEmitter, Injectable } from '@angular/core';


export type warning = "unsavedChanges";

@Injectable({
  providedIn: 'root'
})
export class WarningsService {

  constructor() { }

  public onChange: EventEmitter<warning[]> = new EventEmitter<warning[]>();

  private warnings: warning[] = [];
  
  setWarning(w: warning, x: boolean): void {
    if (x && !this.warnings.includes(w)) {
      this.warnings.push(w);
    } else if (!x) {
      this.warnings = this.warnings.filter((e) => e !== w);
    }
    this.onChange.emit(this.warnings);
  }

  getWarning(w: warning): boolean {
    return this.warnings.includes(w);
  }

}
