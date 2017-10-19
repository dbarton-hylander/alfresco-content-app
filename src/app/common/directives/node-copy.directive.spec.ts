import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Observable } from 'rxjs/Rx';

import { CoreModule, TranslationService, NodesApiService, NotificationService } from 'ng2-alfresco-core';
import { DocumentListModule } from 'ng2-alfresco-documentlist';

import { NodeActionsService } from '../services/node-actions.service';
import { ContentManagementService } from '../services/content-management.service';
import { NodeCopyDirective } from './node-copy.directive';

@Component({
    template: '<div [app-copy-node]="selection"></div>'
})
class TestComponent {
    selection;
}

describe('NodeCopyDirective', () => {
    let fixture: ComponentFixture<TestComponent>;
    let component: TestComponent;
    let element: DebugElement;
    let notificationService: NotificationService;
    let nodesApiService: NodesApiService;
    let service: NodeActionsService;
    let translationService: TranslationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                CoreModule,
                DocumentListModule
            ],
            declarations: [
                TestComponent,
                NodeCopyDirective
            ],
            providers: [
                ContentManagementService,
                NodeActionsService
            ]
        });

        fixture = TestBed.createComponent(TestComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement.query(By.directive(NodeCopyDirective));
        notificationService = TestBed.get(NotificationService);
        nodesApiService = TestBed.get(NodesApiService);
        service = TestBed.get(NodeActionsService);
        translationService = TestBed.get(TranslationService);
    });

    beforeEach(() => {
        spyOn(translationService, 'get').and.callFake((key) => {
            return Observable.of(key);
        });
    });

    describe('Copy node action', () => {
        beforeEach(() => {
            spyOn(notificationService, 'openSnackMessageAction').and.callThrough();
        });

        it('notifies successful copy of a node', () => {
            spyOn(service, 'copyNodes').and.returnValue(Observable.of('OPERATION.SUCCES.CONTENT.COPY'));

            component.selection = [{ entry: { id: 'node-to-copy-id', name: 'name' } }];
            const createdItems = [{ entry: { id: 'copy-id', name: 'name' } }];

            fixture.detectChanges();
            element.triggerEventHandler('click', null);
            service.contentCopied.next(<any>createdItems);

            expect(service.copyNodes).toHaveBeenCalled();
            expect(notificationService.openSnackMessageAction).toHaveBeenCalledWith(
                'APP.MESSAGES.INFO.NODE_COPY.SINGULAR', 'Undo', 10000
            );
        });

        it('notifies successful copy of multiple nodes', () => {
            spyOn(service, 'copyNodes').and.returnValue(Observable.of('OPERATION.SUCCES.CONTENT.COPY'));

            component.selection = [
                { entry: { id: 'node-to-copy-1', name: 'name1' } },
                { entry: { id: 'node-to-copy-2', name: 'name2' } }];
            const createdItems = [
                { entry: { id: 'copy-of-node-1', name: 'name1' } },
                { entry: { id: 'copy-of-node-2', name: 'name2' } }];

            fixture.detectChanges();
            element.triggerEventHandler('click', null);
            service.contentCopied.next(<any>createdItems);

            expect(service.copyNodes).toHaveBeenCalled();
            expect(notificationService.openSnackMessageAction).toHaveBeenCalledWith(
                'APP.MESSAGES.INFO.NODE_COPY.PLURAL', 'Undo', 10000
            );
        });

        it('notifies error if success message was not emitted', () => {
            spyOn(service, 'copyNodes').and.returnValue(Observable.of(''));

            component.selection = [{ entry: { id: 'node-to-copy-id', name: 'name' } }];

            fixture.detectChanges();
            element.triggerEventHandler('click', null);
            service.contentCopied.next();

            expect(service.copyNodes).toHaveBeenCalled();
            expect(notificationService.openSnackMessageAction).toHaveBeenCalledWith('APP.MESSAGES.ERRORS.GENERIC', '', 3000);
        });

        it('notifies permission error on copy of node', () => {
            spyOn(service, 'copyNodes').and.returnValue(Observable.throw(new Error(JSON.stringify({error: {statusCode: 403}}))));

            component.selection = [{ entry: { id: '1', name: 'name' } }];

            fixture.detectChanges();
            element.triggerEventHandler('click', null);

            expect(service.copyNodes).toHaveBeenCalled();
            expect(notificationService.openSnackMessageAction).toHaveBeenCalledWith(
                'APP.MESSAGES.ERRORS.PERMISSION', '', 3000
            );
        });

        it('notifies generic error message on all errors, but 403', () => {
            spyOn(service, 'copyNodes').and.returnValue(Observable.throw(new Error(JSON.stringify({error: {statusCode: 404}}))));

            component.selection = [{ entry: { id: '1', name: 'name' } }];

            fixture.detectChanges();
            element.triggerEventHandler('click', null);

            expect(service.copyNodes).toHaveBeenCalled();
            expect(notificationService.openSnackMessageAction).toHaveBeenCalledWith(
                'APP.MESSAGES.ERRORS.GENERIC', '', 3000
            );
        });
    });

    describe('Undo Copy action', () => {
        beforeEach(() => {
            spyOn(service, 'copyNodes').and.returnValue(Observable.of('OPERATION.SUCCES.CONTENT.COPY'));

            spyOn(notificationService, 'openSnackMessageAction').and.returnValue({
                onAction: () => Observable.of({})
            });
        });

        it('should delete the newly created node on Undo action', () => {
            spyOn(nodesApiService, 'deleteNode').and.returnValue(Observable.of(null));

            component.selection = [{ entry: { id: 'node-to-copy-id', name: 'name' } }];
            const createdItems = [{ entry: { id: 'copy-id', name: 'name' } }];

            fixture.detectChanges();
            element.triggerEventHandler('click', null);
            service.contentCopied.next(<any>createdItems);

            expect(service.copyNodes).toHaveBeenCalled();
            expect(notificationService.openSnackMessageAction).toHaveBeenCalledWith(
                'APP.MESSAGES.INFO.NODE_COPY.SINGULAR', 'Undo', 10000
            );

            expect(nodesApiService.deleteNode).toHaveBeenCalledWith(createdItems[0].entry.id, { permanent: true });
        });

        it('should delete also the node created inside an already existing folder from destination', () => {
            const spyOnDeleteNode = spyOn(nodesApiService, 'deleteNode').and.returnValue(Observable.of(null));

            component.selection = [
                { entry: { id: 'node-to-copy-1', name: 'name1' } },
                { entry: { id: 'node-to-copy-2', name: 'folder-with-name-already-existing-on-destination' } }];
            const id1 = 'copy-of-node-1';
            const id2 = 'copy-of-child-of-node-2';
            const createdItems = [
                { entry: { id: id1, name: 'name1' } },
                [ { entry: { id: id2, name: 'name-of-child-of-node-2' , parentId: 'the-folder-already-on-destination' } }] ];

            fixture.detectChanges();
            element.triggerEventHandler('click', null);
            service.contentCopied.next(<any>createdItems);

            expect(service.copyNodes).toHaveBeenCalled();
            expect(notificationService.openSnackMessageAction).toHaveBeenCalledWith(
                'APP.MESSAGES.INFO.NODE_COPY.PLURAL', 'Undo', 10000
            );

            expect(spyOnDeleteNode).toHaveBeenCalled();
            expect(spyOnDeleteNode.calls.allArgs())
                .toEqual([[id1, { permanent: true }], [id2, { permanent: true }]]);
        });

        it('notifies when error occurs on Undo action', () => {
            spyOn(nodesApiService, 'deleteNode').and.returnValue(Observable.throw(null));

            component.selection = [{ entry: { id: 'node-to-copy-id', name: 'name' } }];
            const createdItems = [{ entry: { id: 'copy-id', name: 'name' } }];

            fixture.detectChanges();
            element.triggerEventHandler('click', null);
            service.contentCopied.next(<any>createdItems);

            expect(service.copyNodes).toHaveBeenCalled();
            expect(nodesApiService.deleteNode).toHaveBeenCalled();
            expect(notificationService.openSnackMessageAction['calls'].allArgs())
            .toEqual([['APP.MESSAGES.INFO.NODE_COPY.SINGULAR', 'Undo', 10000],
                ['APP.MESSAGES.ERRORS.GENERIC', '', 3000]]);
        });

        it('notifies when some error of type Error occurs on Undo action', () => {
            spyOn(nodesApiService, 'deleteNode').and.returnValue(Observable.throw(new Error('oops!')));

            component.selection = [{ entry: { id: 'node-to-copy-id', name: 'name' } }];
            const createdItems = [{ entry: { id: 'copy-id', name: 'name' } }];

            fixture.detectChanges();
            element.triggerEventHandler('click', null);
            service.contentCopied.next(<any>createdItems);

            expect(service.copyNodes).toHaveBeenCalled();
            expect(nodesApiService.deleteNode).toHaveBeenCalled();
            expect(notificationService.openSnackMessageAction['calls'].allArgs())
            .toEqual([['APP.MESSAGES.INFO.NODE_COPY.SINGULAR', 'Undo', 10000],
                ['APP.MESSAGES.ERRORS.GENERIC', '', 3000]]);
        });

        it('notifies permission error when it occurs on Undo action', () => {
            spyOn(nodesApiService, 'deleteNode').and.returnValue(Observable.throw(new Error(JSON.stringify({error: {statusCode: 403}}))));

            component.selection = [{ entry: { id: 'node-to-copy-id', name: 'name' } }];
            const createdItems = [{ entry: { id: 'copy-id', name: 'name' } }];

            fixture.detectChanges();
            element.triggerEventHandler('click', null);
            service.contentCopied.next(<any>createdItems);

            expect(service.copyNodes).toHaveBeenCalled();
            expect(nodesApiService.deleteNode).toHaveBeenCalled();
            expect(notificationService.openSnackMessageAction['calls'].allArgs())
            .toEqual([['APP.MESSAGES.INFO.NODE_COPY.SINGULAR', 'Undo', 10000],
                ['APP.MESSAGES.ERRORS.PERMISSION', '', 3000]]);
        });
    });

});
