# UC-012: Vehicle Maintenance Scheduling - Implementation Gap Analysis

**Status:** ❌ NOT IMPLEMENTED  
**Impact:** Critical gap in fleet management  
**Frontend Ready:** No pages, components, or services  

---

## What's Missing

### Frontend Components
```
❌ No maintenance pages
❌ No maintenance services/API clients
❌ No maintenance dialog/forms
❌ No maintenance status indicators
❌ No maintenance calendar UI
```

### Expected UI Pages (Not Implemented)
```
(admin)/admin/fleet/maintenance/
├── page.tsx                  # Maintenance list/calendar
├── [maintenanceId]/
│   ├── page.tsx             # Detail view
│   └── edit/page.tsx        # Edit maintenance record
└── create/page.tsx          # Schedule new maintenance
```

### Expected Service File (Not Implemented)
```
src/features/admin/services/maintenanceService.ts
- getByBus(busId)
- getByDateRange(from, to)
- create(request)
- update(id, request)
- complete(id)
- cancel(id)
```

---

## What Should Be There

Based on backend API structure analysis, UC-012 should include:

### 1. **Maintenance Scheduling Page**
**Path:** `(admin)/admin/fleet/maintenance`

**Features:**
- Calendar view (week/month)
- List view with filters (bus, status, date range)
- Search by license plate or bus ID
- Status tracking: PLANNED, IN_PROGRESS, COMPLETED, CANCELLED

**Components Needed:**
```tsx
// MaintenanceCalendar.tsx
- Display maintenance events on calendar
- Color-code by status/type
- Click to view details

// MaintenanceList.tsx
- Sortable table with:
  - Bus (license plate, type)
  - Maintenance type (oil change, inspection, etc.)
  - Scheduled date
  - Status
  - Assigned technician
  - Estimated duration

// MaintenanceForm.tsx
- Bus selection dropdown
- Maintenance type selector
- Scheduled date picker
- Duration estimate input
- Notes/description
- Assign technician
```

### 2. **Maintenance Detail & Editing**
**Path:** `(admin)/admin/fleet/maintenance/[maintenanceId]`

**Features:**
- View full maintenance record
- Edit scheduling (reschedule)
- Update status
- Attach completion notes/photos
- Update actual duration
- Mark as completed with results

### 3. **Maintenance Service Client**
```typescript
// maintenanceService.ts
export const maintenanceService = {
    // Query
    getByBus: (busId: number) => GET /fleet/maintenance?busId={busId}
    getByDateRange: (from, to) => GET /fleet/maintenance?fromDate={from}&toDate={to}
    getUpcoming: (days?) => GET /fleet/maintenance/upcoming
    getOverdue: () => GET /fleet/maintenance/overdue
    getById: (id: number) => GET /fleet/maintenance/{id}
    
    // Mutations
    create: (request) => POST /fleet/maintenance
    update: (id, request) => PUT /fleet/maintenance/{id}
    complete: (id, notes) => PATCH /fleet/maintenance/{id}/complete
    cancel: (id, reason) => PATCH /fleet/maintenance/{id}/cancel
    reschedule: (id, newDate) => PATCH /fleet/maintenance/{id}/reschedule
};
```

### 4. **Maintenance Types (Master Data)**
Likely needed in backend:
- Oil change
- Tire rotation
- Brake inspection
- General inspection
- Accident repair
- Custom maintenance

### 5. **Integration Points**

**In Fleet Bus List:**
```tsx
// Should show maintenance status for each bus
<BusList>
  {buses.map(bus => (
    <BusRow>
      <Column>{bus.licensePlate}</Column>
      <Column>{bus.type}</Column>
      <Column>
        {/* NEW: Maintenance status indicator */}
        <MaintenanceStatusBadge 
          status={bus.nextMaintenanceStatus}
          daysUntil={bus.daysUntilMaintenance}
        />
      </Column>
    </BusRow>
  ))}
</BusList>
```

**In Bus Assignment/Check-in:**
```tsx
// Should prevent assignment if bus needs maintenance
<BusAssignmentForm>
  {/* Check: Is bus_maintenance_status = NOT_REQUIRED? */}
  {bus.needsMaintenance && (
    <Alert severity="warning">
      Bus requires maintenance on {bus.nextMaintenanceDate}
      Cannot assign until completed.
    </Alert>
  )}
</BusAssignmentForm>
```

**In Trip Operations:**
```tsx
// Should alert if bus with assigned trip needs maintenance
<TripList>
  {trips.map(trip => (
    <TripRow>
      {trip.bus.needsMaintenance && (
        <MaintenanceWarning trip={trip} />
      )}
    </TripRow>
  ))}
</TripList>
```

---

## Data Model Requirements

### Maintenance Record
```typescript
interface MaintenanceRecord {
  id: number;
  busId: number;
  busLicensePlate: string;
  
  maintenanceType: 'OIL_CHANGE' | 'TIRE_ROTATION' | 'INSPECTION' | ...;
  
  scheduledDate: string;       // ISO date
  scheduledDuration: number;   // minutes
  
  actualStartDate?: string;
  actualEndDate?: string;
  actualDuration?: number;
  
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  
  assignedTechnicianId?: number;
  assignedTechnicianName?: string;
  
  notes?: string;
  completionNotes?: string;
  
  estimatedCost?: number;
  actualCost?: number;
  
  attachments?: Attachment[];
  
  createdAt: string;
  updatedAt: string;
}
```

---

## Backend API Endpoints (Inference)

Based on codebase patterns, expected endpoints:

```
GET    /fleet/maintenance                      # List all
GET    /fleet/maintenance/upcoming              # Next 30 days
GET    /fleet/maintenance/overdue               # Past due
GET    /fleet/maintenance?busId={id}            # By bus
GET    /fleet/maintenance?fromDate=...&toDate=...  # By date range
GET    /fleet/maintenance/{id}                  # Detail
POST   /fleet/maintenance                       # Create
PUT    /fleet/maintenance/{id}                  # Update
PATCH  /fleet/maintenance/{id}/complete       # Mark complete
PATCH  /fleet/maintenance/{id}/cancel         # Cancel
PATCH  /fleet/maintenance/{id}/reschedule     # Reschedule
```

---

## Risks if Not Implemented

| Risk | Severity | Impact |
|------|----------|--------|
| No maintenance tracking | 🔴 HIGH | Fleet reliability issues, safety risk |
| Buses assigned despite maintenance need | 🔴 HIGH | Trip cancellations, customer dissatisfaction |
| Maintenance cost overruns | 🟡 MEDIUM | Budget tracking issues |
| Schedule conflicts | 🟡 MEDIUM | Bus unavailability not visible |
| Regulatory compliance | 🔴 HIGH | Safety inspection records missing |

---

## Implementation Effort Estimate

| Component | Effort | Time |
|-----------|--------|------|
| Service & API client | 4-6 hours | 1 day |
| Calendar component | 8 hours | 1 day |
| List view | 6 hours | 0.5 day |
| Create/edit forms | 8 hours | 1 day |
| Integration with bus list | 4 hours | 0.5 day |
| Integration with trip ops | 6 hours | 1 day |
| Testing & polish | 8 hours | 1 day |
| **Total** | **44-50 hours** | **~1.5 weeks** |

---

## Recommended Action

### Short-term (Current)
✅ Document the gap (DONE)  
✅ Plan backend API if not exists  
✅ Add to Phase 2 backlog

### Medium-term (Phase 2)
1. Implement backend `/fleet/maintenance` endpoints
2. Build frontend maintenance service
3. Create maintenance pages & components
4. Integrate with fleet management UI

### Long-term (Phase 3)
- Add maintenance cost analytics
- Implement preventive maintenance scheduling
- Add technician work order tracking
- Integrate with parts inventory

---

## For Next Phase Planning

**Acceptance Criteria for UC-012:**
- [ ] Maintenance calendar page shows all scheduled maintenance
- [ ] Can schedule maintenance for a bus with date, type, duration
- [ ] Can view all maintenance for a specific bus
- [ ] Can mark maintenance as completed with notes
- [ ] Bus cannot be assigned to trip if maintenance is overdue
- [ ] System shows overdue maintenance alerts
- [ ] Maintenance history visible in bus profile

---

Status: **READY FOR PHASE 2 IMPLEMENTATION**
