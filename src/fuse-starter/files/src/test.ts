// Karma test entry point (angular.json -> test.options.main).
// Initializes the Angular testing environment in zoneless mode, matching the
// application (see provideZonelessChangeDetection() in app.config.ts).
import { NgModule, provideZonelessChangeDetection } from '@angular/core'
import { getTestBed } from '@angular/core/testing'
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing'

@NgModule({
  providers: [provideZonelessChangeDetection()],
})
class ZonelessTestingModule {}

getTestBed().initTestEnvironment(
  [BrowserTestingModule, ZonelessTestingModule],
  platformBrowserTesting(),
  {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
  },
)
