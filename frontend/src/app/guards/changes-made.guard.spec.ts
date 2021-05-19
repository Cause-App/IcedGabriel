import { TestBed } from '@angular/core/testing';

import { ChangesMadeGuard } from './changes-made.guard';

describe('ChangesMadeGuard', () => {
  let guard: ChangesMadeGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(ChangesMadeGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
