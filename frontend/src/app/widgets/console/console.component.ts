import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { ConsoleService } from 'src/app/services/console.service';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.scss']
})
export class ConsoleComponent implements AfterViewInit {

  constructor(public consoleService: ConsoleService) { }

  @ViewChild("console") console?: ElementRef;

  ngAfterViewInit(): void {
    if (this.console) {
      this.consoleService.onLog.subscribe(() => {
        const elt: HTMLElement = this.console?.nativeElement.parentElement.parentElement;
        elt.scrollTop = elt.scrollHeight;
      });
    }
  }

}
