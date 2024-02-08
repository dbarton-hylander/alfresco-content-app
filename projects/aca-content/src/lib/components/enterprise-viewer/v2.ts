import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core'
import { Pipe, PipeTransform } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { AppStore, getUserProfile } from '@alfresco/aca-shared/store'
import { Store } from '@ngrx/store'
import { map } from 'rxjs/operators'
import { AsyncPipe } from '@angular/common'
import { ReplaySubject, forkJoin } from 'rxjs'

@Pipe({
  standalone: true,
  name: 'safe',
})
export class SafePipe implements PipeTransform {
  sanitizer = inject(DomSanitizer)
  // constructor(private sanitizer: DomSanitizer) {}

  transform(url: any) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url)
  }
}

@Component({
  standalone: true,
  template: `
    <!-- <iframe [src]="iframeUrl | safe"></iframe> -->
    <iframe [src]="srcUrl$ | async | safe"></iframe>

    <style>
      iframe {
        flex: 1;
        width: 100vw;
      }
    </style>
  `,
  imports: [SafePipe, AsyncPipe],
})
export class EnterpriseViewer implements OnInit, OnDestroy {
  @Input() set url(url: string) {
    this.url$.next(url)
  }

  private store = inject<Store<AppStore>>(Store<AppStore>)
  user$ = this.store.select(getUserProfile)
  url$ = new ReplaySubject<string>(1)

  srcUrl$ = forkJoin([this.user$, this.url$]).pipe(
    map(([user, nodeContentUrl]) => {
      const nodeUrl = new URL(nodeContentUrl)
      const matches = nodeUrl.pathname.match(/nodes\/(?<nodeId>.*)\/content/)
      const nodeId = matches.groups?.nodeId
      const ticket = nodeUrl.searchParams.get('alf_ticket')

      const iframeUrl = new URL(`${nodeUrl.origin}/OpenAnnotate/viewer.htm`)

      iframeUrl.searchParams.set('docId', `workspace://SpacesStore/${nodeId}`)
      // iframeUrl.searchParams.set('parentId', `workspace://SpacesStore/0eb86736-3e91-49de-9354-2dbe2c45d462`);
      iframeUrl.searchParams.set('ticket', ticket)
      iframeUrl.searchParams.set('username', user.id)

      return iframeUrl.toString()
    })
  )

  ngOnInit(): void {}

  ngOnDestroy() {
    this.url$.complete()
  }
}
