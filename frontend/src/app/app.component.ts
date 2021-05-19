import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthConfig, NullValidationHandler, OAuthService } from 'angular-oauth2-oidc';
import { NgcCookieConsentService, NgcInitializeEvent, NgcNoCookieLawEvent, NgcStatusChangeEvent } from 'ngx-cookieconsent';
import { Subscription } from 'rxjs-compat/Subscription';

const authConfig: AuthConfig = {
  clientId: '527633665148-g2dignt1vnbt5o5imcpkh5s80jinckcr.apps.googleusercontent.com',
  redirectUri: window.location.origin,
  issuer: 'https://accounts.google.com',
  scope: 'openid profile email',
  loginUrl: 'https://accounts.google.com/o/oauth2/v2/auth?hd=cam.ac.uk',
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  userinfoEndpoint: "https://openidconnect.googleapis.com/v1/userinfo",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
  requireHttps: "remoteOnly"
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'IcedGabriel';

  //keep refs to subscriptions to be able to unsubscribe later
  private popupOpenSubscription?: Subscription;
  private popupCloseSubscription?: Subscription;
  private initializeSubscription?: Subscription;
  private statusChangeSubscription?: Subscription;
  private revokeChoiceSubscription?: Subscription;
  private noCookieLawSubscription?: Subscription;


  constructor(private oauthService: OAuthService, private ccService: NgcCookieConsentService) {
    this.oauthService.configure(authConfig);
    this.oauthService.tokenValidationHandler = new NullValidationHandler();
    this.oauthService.tryLogin();
  }

  ngOnInit(): void {
    // subscribe to cookieconsent observables to react to main events
    this.popupOpenSubscription = this.ccService.popupOpen$.subscribe(
      () => {
        // you can use this.ccService.getConfig() to do stuff...
      });

    this.popupCloseSubscription = this.ccService.popupClose$.subscribe(
      () => {
        // you can use this.ccService.getConfig() to do stuff...
      });

    this.initializeSubscription = this.ccService.initialize$.subscribe(
      (event: NgcInitializeEvent) => {
        // you can use this.ccService.getConfig() to do stuff...
      });

    this.statusChangeSubscription = this.ccService.statusChange$.subscribe(
      (event: NgcStatusChangeEvent) => {
        // you can use this.ccService.getConfig() to do stuff...
      });

    this.revokeChoiceSubscription = this.ccService.revokeChoice$.subscribe(
      () => {
        // you can use this.ccService.getConfig() to do stuff...
      });

    this.noCookieLawSubscription = this.ccService.noCookieLaw$.subscribe(
      (event: NgcNoCookieLawEvent) => {
        // you can use this.ccService.getConfig() to do stuff...
      });
  }

  ngOnDestroy() {
    // unsubscribe to cookieconsent observables to prevent memory leaks
    this.popupOpenSubscription?.unsubscribe();
    this.popupCloseSubscription?.unsubscribe();
    this.initializeSubscription?.unsubscribe();
    this.statusChangeSubscription?.unsubscribe();
    this.revokeChoiceSubscription?.unsubscribe();
    this.noCookieLawSubscription?.unsubscribe();
  }


}
