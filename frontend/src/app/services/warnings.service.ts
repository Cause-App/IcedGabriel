import { EventEmitter, Injectable } from '@angular/core';


export type warning = "unsavedChanges" | "failedToCompile" | "invalidGame" | "failedToDelete" | "save";
const temporaryWarnings: {[key: string]: number} = {
  "failedToCompile": 3000,
  "invalidGame": 3000,
  "failedToDelete": 3000,
  "save": 1000
};

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
      if (w in temporaryWarnings) {
        setTimeout(() => {
          this.setWarning(w, false);
        }, temporaryWarnings[w]);
      }
    } else if (!x) {
      this.warnings = this.warnings.filter((e) => e !== w);
    }
    this.onChange.emit(this.warnings);
  }

  getWarning(w: warning): boolean {
    return this.warnings.includes(w);
  }

}
