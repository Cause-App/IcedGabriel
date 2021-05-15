import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {

  constructor(private http: HttpClient, private oauthService: OAuthService) { }

  code = `public class Snake implements Slitherable {

  @Override
  public Direction move(int myHeadX, int myHeadY, int enemyHeadX, int enemyHeadY, int appleX, int appleY) {
    return Direction.LEFT;
  }

  @Override
  public String getName() {
    return "My Awesome Snake";
  }

}
  `;

  async submit(): Promise<void> {
    const response = await this.http.get(`/api/submitsnake?code=${encodeURIComponent(this.code)}`).toPromise();
    console.log(response);
  }

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
