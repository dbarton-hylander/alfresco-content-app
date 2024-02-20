import { NgModule, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ExtensionService } from '@alfresco/adf-extensions'
import { EnterpriseViewer } from './enterprise-viewer.component'

@NgModule({
  imports: [CommonModule],
})
export class AevViewerPluginModule {
  extensions = inject(ExtensionService)

  constructor() {
    this.extensions.setComponents({
      'app.components.enterprise-viewer': EnterpriseViewer,
    })
  }
}
