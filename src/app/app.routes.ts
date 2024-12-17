import { Routes } from '@angular/router';
import { FeedsComponent } from './feeds/feeds.component';

export const routes: Routes = [
    { path: '', component: FeedsComponent },
    { path: 'feeds', component: FeedsComponent },
];
