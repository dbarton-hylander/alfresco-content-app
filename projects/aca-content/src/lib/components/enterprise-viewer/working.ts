import { Component, Input, OnInit, inject } from '@angular/core'
import { Pipe, PipeTransform } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { AppStore, getUserProfile } from '@alfresco/aca-shared/store'
import { Store } from '@ngrx/store'
import { map } from 'rxjs/operators'
import { AsyncPipe } from '@angular/common'

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
export class EnterpriseViewer implements OnInit {
  @Input() url: string

  private store = inject<Store<AppStore>>(Store<AppStore>)
  user$ = this.store.select(getUserProfile)

  srcUrl$ = this.user$.pipe(
    map((user) => {
      const url = new URL(this.url)
      const matches = url.pathname.match(/nodes\/(?<nodeId>.*)\/content/)
      const nodeId = matches.groups?.nodeId
      const ticket = url.searchParams.get('alf_ticket')

      const iframeUrl = new URL(`${url.origin}/OpenAnnotate/viewer.htm`)

      iframeUrl.searchParams.set('docId', `workspace://SpacesStore/${nodeId}`)
      // iframeUrl.searchParams.set('parentId', `workspace://SpacesStore/0eb86736-3e91-49de-9354-2dbe2c45d462`);
      iframeUrl.searchParams.set('ticket', ticket)
      iframeUrl.searchParams.set('username', user.id)

      return iframeUrl.toString()
    })
  )

  get iframeUrl() {
    const url = new URL(this.url)
    const matches = url.pathname.match(/nodes\/(?<nodeId>.*)\/content/)
    const nodeId = matches.groups?.nodeId
    const ticket = url.searchParams.get('alf_ticket')

    const iframeUrl = new URL(`${url.origin}/OpenAnnotate/viewer.htm`)

    iframeUrl.searchParams.set('docId', `workspace://SpacesStore/${nodeId}`)
    // iframeUrl.searchParams.set('parentId', `workspace://SpacesStore/0eb86736-3e91-49de-9354-2dbe2c45d462`);
    iframeUrl.searchParams.set('ticket', ticket)
    iframeUrl.searchParams.set('username', 'admin')

    return iframeUrl.toString()
  }

  ngOnInit(): void {}
}
