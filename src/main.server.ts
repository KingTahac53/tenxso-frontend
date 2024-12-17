import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

////const bootstrap = () => bootstrapApplication(AppComponent, config);
const bootstrap = () => platformBrowserDynamic().bootstrapModule(AppComponent, config);

export default bootstrap;
