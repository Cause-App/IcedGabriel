import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { OAuthModule, OAuthStorage } from 'angular-oauth2-oidc';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgcCookieConsentModule, NgcCookieConsentConfig } from 'ngx-cookieconsent';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { LogInOutButtonComponent } from './widgets/log-in-out-button/log-in-out-button.component';
import { NavbarComponent } from './widgets/navbar/navbar.component';
import { GameComponent } from './pages/game/game.component';
import { AngularSplitModule } from 'angular-split';
import { DragulaModule } from 'ng2-dragula';
import { ContextMenuComponent } from './widgets/context-menu/context-menu.component';
import { IdeComponent } from './widgets/ide/ide.component';
import { SnakeOptionsComponent } from './games/snake/snake-options/snake-options.component';
import { WarningsComponent } from './widgets/warnings/warnings.component';
import { SnakePlayerComponent } from './games/snake/snake-player/snake-player.component';
import { SnakeGridComponent } from './games/snake/snake-player/snake-grid/snake-grid.component';
import { ConsoleComponent } from './widgets/console/console.component';
import { LeaderboardComponent } from './pages/leaderboard/leaderboard.component';

const socketConfig: SocketIoConfig = { url: '/', options: {} };

const cookieConfig: NgcCookieConsentConfig = {
  cookie: {
    domain: window.location.hostname
  },
  palette: {
    popup: {
      background: '#000'
    },
    button: {
      background: '#f1d600'
    }
  },
  theme: 'classic',
  type: 'info',
};

export function storageFactory(): OAuthStorage {
  return localStorage
}

@NgModule({
  declarations: [
    AppComponent,
    HomePageComponent,
    LogInOutButtonComponent,
    NavbarComponent,
    GameComponent,
    ContextMenuComponent,
    IdeComponent,
    SnakeOptionsComponent,
    WarningsComponent,
    SnakePlayerComponent,
    SnakeGridComponent,
    ConsoleComponent,
    LeaderboardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    OAuthModule.forRoot(),
    FontAwesomeModule,
    AngularSplitModule,
    DragulaModule.forRoot(),
    NgcCookieConsentModule.forRoot(cookieConfig),
    SocketIoModule.forRoot(socketConfig)
  ],
  providers: [
    { provide: OAuthStorage, useFactory: storageFactory }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
