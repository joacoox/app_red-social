import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtendSessionDialogComponent } from './extend-session-dialog.component';

describe('ExtendSessionDialogComponent', () => {
  let component: ExtendSessionDialogComponent;
  let fixture: ComponentFixture<ExtendSessionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtendSessionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtendSessionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
