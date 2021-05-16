import { Component } from '@angular/core';
import { AuthConfig, NullValidationHandler, OAuthService } from 'angular-oauth2-oidc';

const authConfig: AuthConfig = {
  clientId: '527633665148-g2dignt1vnbt5o5imcpkh5s80jinckcr.apps.googleusercontent.com',
  redirectUri: window.location.origin,
  issuer: 'https://accounts.google.com',
  scope: 'openid profile email',
  loginUrl: 'https://accounts.google.com/o/oauth2/v2/auth?hd=cam.ac.uk',
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  userinfoEndpoint: "https://openidconnect.googleapis.com/v1/userinfo",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
  requireHttps: false,
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'IcedGabriel';

  constructor(private oauthService: OAuthService) {
    this.oauthService.configure(authConfig);
    this.oauthService.tokenValidationHandler = new NullValidationHandler();
    this.oauthService.tryLogin();
  }

}
