/*!
 * @license
 * Copyright 2017 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component, ViewEncapsulation } from '@angular/core';
import { AppConfigService } from 'ng2-alfresco-core';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: [ './header.component.scss' ],
    encapsulation: ViewEncapsulation.None
})
export class HeaderComponent {
    private enhancedContrast: Boolean = false;

    constructor(private appConfig: AppConfigService) {}

    get appName(): string {
        return <string>this.appConfig.get('application.name');
    }

    get appBuildNumber(): string {
        return <string>this.appConfig.get('application.build');
    }

    get appTitle(): string {
        const { appName, appBuildNumber } = this;

        return `${appName} (Build #${appBuildNumber})`;
    }

    toggleContrast() {
        this.enhancedContrast = !this.enhancedContrast;
    }
}
