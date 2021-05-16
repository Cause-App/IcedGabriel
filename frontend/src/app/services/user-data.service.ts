import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';

@Injectable({
  providedIn: 'root'
})
export class UserDataService implements CanActivate {

  constructor(private oauthService: OAuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.loggedIn) {
      return true;
    }
    this.router.navigate(["/"]);
    return false;
  }
  
  get loggedIn(): boolean {
    return this.oauthService.hasValidIdToken();
  }

  private getIdentityClaims(): any {
    const claims: any = this.oauthService.getIdentityClaims();
    if (!claims) {
      return {};
    }
    return claims;
  }

  get name(): string | undefined {
    return this.getIdentityClaims()["name"];
  }

  get givenName(): string | undefined {
    return this.getIdentityClaims()["given_name"];
  }

  get familyName(): string | undefined {
    return this.getIdentityClaims()["family_name"];
  }
  
  get email(): string | undefined {
    return this.getIdentityClaims()["email"];
  }

  get sub(): string | undefined {
    return this.getIdentityClaims()["sub"];
  }

  get picture(): string | undefined {
    return this.getIdentityClaims()["picture"];
  }
}
