import { Component } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

@Component({
  selector: 'app-log-in-out-button',
  templateUrl: './log-in-out-button.component.html',
  styleUrls: ['./log-in-out-button.component.scss']
})
export class LogInOutButtonComponent {

  constructor(private oauthService: OAuthService) {}

  login() {
    this.oauthService.initImplicitFlow();
  }

  logout() {
    this.oauthService.logOut();
  }

  get givenName(): string | null {
    const claims: any = this.oauthService.getIdentityClaims();
    if (!claims) {
      return null;
    }
    return (claims['name'] as string);
  }


}
