import { Reflector } from '@nestjs/core';
import { StaffRole } from '@prisma/client';

import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { StudentsController } from './students.controller';

describe('StudentsController', () => {
  const reflector = new Reflector();

  function getMethod(name: keyof StudentsController) {
    const descriptor = Object.getOwnPropertyDescriptor(
      StudentsController.prototype,
      name,
    );

    return descriptor?.value as (...args: never[]) => unknown;
  }

  it('allows HQ and branch staff to create students', () => {
    expect(reflector.get<StaffRole[]>(ROLES_KEY, getMethod('create'))).toEqual([
      StaffRole.HQ_STAFF,
      StaffRole.BRANCH_STAFF,
    ]);
  });

  it('allows supported roles to list and view students', () => {
    const expectedRoles = [
      StaffRole.HQ_STAFF,
      StaffRole.BRANCH_STAFF,
      StaffRole.TEACHER,
    ];

    expect(reflector.get<StaffRole[]>(ROLES_KEY, getMethod('findAll'))).toEqual(
      expectedRoles,
    );
    expect(reflector.get<StaffRole[]>(ROLES_KEY, getMethod('findOne'))).toEqual(
      expectedRoles,
    );
  });

  it('limits credit adjustment to HQ and branch staff', () => {
    expect(
      reflector.get<StaffRole[]>(ROLES_KEY, getMethod('adjustCredit')),
    ).toEqual([StaffRole.HQ_STAFF, StaffRole.BRANCH_STAFF]);
  });
});
