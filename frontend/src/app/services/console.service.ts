import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConsoleService {

  constructor() { }

  public data: string = "";
  public onLog: EventEmitter<void> = new EventEmitter();

  public clear(): void {
    this.data = "";
  }

  public log(x: string): void {
    this.data += x;
    this.onLog.emit();
  }
}
