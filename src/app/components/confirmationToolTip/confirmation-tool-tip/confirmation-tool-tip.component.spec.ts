import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmationToolTipComponent } from './confirmation-tool-tip.component';

describe('ConfirmationToolTipComponent', () => {
  let component: ConfirmationToolTipComponent;
  let fixture: ComponentFixture<ConfirmationToolTipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationToolTipComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmationToolTipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
