import { Component, Input, OnInit } from '@angular/core';

export interface ContextMenuItem {
  text: string;
  click: Function;
};

@Component({
  selector: 'app-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.scss']
})
export class ContextMenuComponent implements OnInit {

  @Input() items: ContextMenuItem[] = [];

  constructor() { }

  ngOnInit(): void {
  }

}
