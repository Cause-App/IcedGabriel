import { Component, OnInit } from '@angular/core';
import { warning, WarningsService } from 'src/app/services/warnings.service';

@Component({
  selector: 'app-warnings',
  templateUrl: './warnings.component.html',
  styleUrls: ['./warnings.component.scss']
})
export class WarningsComponent implements OnInit {

  public warnings: warning[] = [];
  public depressed: {[key: string]: boolean} = {};

  constructor(private warningsService: WarningsService) {
    warningsService.onChange.subscribe((w) => {
      this.warnings = w;
    })
  }

  getTop(w: warning): string {
    if (this.warnings.includes(w)) {
      return ""+(this.warnings.indexOf(w)*5+3)+"em";
    } else {
      return "0";
    }
  }

  ngOnInit(): void {
  }

}
