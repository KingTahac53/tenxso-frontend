import { Injectable } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  constructor(private deviceDetector: DeviceDetectorService) {}

  // Check if the device is a mobile device
  isMobile(): boolean {
    return this.deviceDetector.isMobile();
  }

  // Check if the device is a tablet
  isTablet(): boolean {
    return this.deviceDetector.isTablet();
  }

  // Check if the device is a desktop
  isDesktop(): boolean {
    return this.deviceDetector.isDesktop();
  }

  // Get the operating system
  getOS(): string {
    return this.deviceDetector.os;
  }
}
