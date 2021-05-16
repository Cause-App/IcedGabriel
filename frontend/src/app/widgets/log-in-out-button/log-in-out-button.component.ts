import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { UserDataService } from 'src/app/services/user-data.service';

@Component({
  selector: 'app-log-in-out-button',
  templateUrl: './log-in-out-button.component.html',
  styleUrls: ['./log-in-out-button.component.scss']
})
export class LogInOutButtonComponent {

  constructor(private oauthService: OAuthService, public user: UserDataService, private router: Router) {}

  login() {
    this.oauthService.initImplicitFlow();
  }

  logout() {
    this.oauthService.logOut();
    this.router.navigate(["/"]);
  }

}
