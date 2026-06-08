import { Reflector } from '@nestjs/core';
import { StaffRole } from '@prisma/client';

import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { BranchesController } from './branches.controller';

describe('BranchesController', () => {
  const reflector = new Reflector();

  function getMethod(name: keyof BranchesController) {
    const descriptor = Object.getOwnPropertyDescriptor(
      BranchesController.prototype,
      name,
    );

    return descriptor?.value as (...args: never[]) => unknown;
  }

  it('restricts branch creation to HQ staff through role metadata', () => {
    const roles = reflector.get<StaffRole[]>(ROLES_KEY, getMethod('create'));

    expect(roles).toEqual([StaffRole.HQ_STAFF]);
  });

  it('allows supported staff roles to list branches through role metadata', () => {
    const roles = reflector.get<StaffRole[]>(ROLES_KEY, getMethod('findAll'));

    expect(roles).toEqual([
      StaffRole.HQ_STAFF,
      StaffRole.BRANCH_STAFF,
      StaffRole.TEACHER,
    ]);
  });

  it('allows supported staff roles to view branch detail through role metadata', () => {
    const roles = reflector.get<StaffRole[]>(ROLES_KEY, getMethod('findOne'));

    expect(roles).toEqual([
      StaffRole.HQ_STAFF,
      StaffRole.BRANCH_STAFF,
      StaffRole.TEACHER,
    ]);
  });
});
