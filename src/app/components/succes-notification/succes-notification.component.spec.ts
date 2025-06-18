import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuccesNotificationComponent } from './succes-notification.component';

describe('SuccesNotificationComponent', () => {
  let component: SuccesNotificationComponent;
  let fixture: ComponentFixture<SuccesNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuccesNotificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuccesNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
