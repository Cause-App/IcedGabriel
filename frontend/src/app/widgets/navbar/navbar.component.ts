import { Component, OnInit } from '@angular/core';
import { GameListService } from 'src/app/services/game-list.service';
import { UserDataService } from 'src/app/services/user-data.service';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { faPaypal } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  constructor(public user: UserDataService, public gameList: GameListService) { }

  faChevronDown = faChevronDown;
  faPaypal = faPaypal;

  ngOnInit(): void {
  }

}
