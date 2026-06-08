# Bookings Service — Sequence Diagrams

Source: `src/modules/bookings/bookings.service.ts`

## 1. Create booking — `POST /bookings`

```mermaid
sequenceDiagram
    actor Staff as Staff (HQ_STAFF / BRANCH_STAFF)
    participant Ctrl as BookingsController
    participant Svc as BookingsService
    participant Tx as Prisma TX (Serializable)

    Staff->>Ctrl: POST /bookings (CreateBookingDto)
    Note over Ctrl: JwtAuthGuard + RolesGuard
    Ctrl->>Svc: create(user, dto)
    Svc->>Tx: $transaction(Serializable)

    Tx->>Tx: classSession.update(touch updatedAt) -> lock row
    Tx->>Tx: student.findUnique(studentId)
    alt student missing or inactive
        Tx-->>Svc: throw NotFoundException
    end

    Svc->>Svc: assertCanAccessClass(user, classSession)
    alt no access
        Svc-->>Staff: 403 ForbiddenException
    end

    alt student.branchId != classSession.branchId
        Tx-->>Svc: throw BadRequestException
    end

    Tx->>Tx: booking.findUnique(classSession + student)
    alt booking already exists
        Tx-->>Svc: throw ConflictException
    end

    Tx->>Tx: booking.count(classSessionId)
    alt bookedSeats >= capacity
        Tx-->>Svc: throw ConflictException (fully booked)
    end

    Tx->>Tx: booking.create(status = BOOKED)
    Tx-->>Svc: booking
    Svc-->>Ctrl: booking
    Ctrl-->>Staff: 201 Created
```

## 2. Update attendance — `PATCH /bookings/:id/attendance`

```mermaid
sequenceDiagram
    actor Staff as Staff (HQ / BRANCH / TEACHER)
    participant Ctrl as BookingsController
    participant Svc as BookingsService
    participant Tx as Prisma TX

    Staff->>Ctrl: PATCH /bookings/:id/attendance (UpdateAttendanceDto)
    Ctrl->>Svc: updateAttendance(user, id, dto)
    Svc->>Tx: $transaction()

    Tx->>Tx: booking.findUnique(include student, session, ledger, comp)
    alt booking not found
        Tx-->>Svc: throw NotFoundException
    end

    Svc->>Svc: assertCanAccessClass(user, classSession)
    alt no access
        Svc-->>Staff: 403 ForbiddenException
    end

    alt status unchanged (already == dto.status)
        Tx-->>Svc: return current booking (no-op)
    else current status != BOOKED
        Tx-->>Svc: throw BadRequestException (illegal transition)
    end

    alt dto.status == SKIP
        Note over Svc,Tx: markSkip()
        Tx->>Tx: booking.update(status = SKIP, markedBy/At)
        Tx->>Tx: studentCompensation.create(MAKEUP_CLASS, AVAILABLE)
    else dto.status == ATTEND or ABSENT
        Note over Svc,Tx: markCreditDeductingAttendance()
        alt creditBalance < 1
            Tx-->>Svc: throw BadRequestException (insufficient credit)
        end
        Tx->>Tx: student.update(creditBalance - 1)
        Tx->>Tx: booking.update(status, markedBy/At)
        Tx->>Tx: studentCreditLedger.create(amount -1, reason ATTEND/ABSENT)
    end

    Tx->>Tx: findBookingInTransaction(id)
    Tx-->>Svc: updated booking
    Svc-->>Ctrl: booking
    Ctrl-->>Staff: 200 OK
```

## Notes

- **Create** runs at `Serializable` isolation and touches the `classSession` row first to guard the capacity check against concurrent bookings.
- **Attendance** only transitions out of `BOOKED`; it is an idempotent no-op when the status already matches.
- `SKIP` issues a makeup-class compensation; `ATTEND` / `ABSENT` deduct 1 credit and write a credit-ledger entry.
