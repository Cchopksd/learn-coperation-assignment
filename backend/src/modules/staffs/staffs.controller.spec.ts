import { Reflector } from '@nestjs/core';
import { StaffRole } from '@prisma/client';

import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { StaffsController } from './staffs.controller';

describe('StaffsController', () => {
  const reflector = new Reflector();

  function getMethod(name: keyof StaffsController) {
    const descriptor = Object.getOwnPropertyDescriptor(
      StaffsController.prototype,
      name,
    );

    return descriptor?.value as (...args: never[]) => unknown;
  }

  it('restricts staff creation to HQ staff through role metadata', () => {
    const roles = reflector.get<StaffRole[]>(ROLES_KEY, getMethod('create'));

    expect(roles).toEqual([StaffRole.HQ_STAFF]);
  });

  it('allows supported staff roles to list staff through role metadata', () => {
    const roles = reflector.get<StaffRole[]>(ROLES_KEY, getMethod('findAll'));

    expect(roles).toEqual([
      StaffRole.HQ_STAFF,
      StaffRole.BRANCH_STAFF,
      StaffRole.TEACHER,
    ]);
  });

  it('allows supported staff roles to view staff detail through role metadata', () => {
    const roles = reflector.get<StaffRole[]>(ROLES_KEY, getMethod('findOne'));

    expect(roles).toEqual([
      StaffRole.HQ_STAFF,
      StaffRole.BRANCH_STAFF,
      StaffRole.TEACHER,
    ]);
  });
});
