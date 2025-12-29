/**
 * Patient Grouping Utility for Session Library
 * Groups sessions by patient for the list view display
 */

export type PatientInfo = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

export type SessionWithPatient = {
  id: string;
  title: string;
  sessionDate: string;
  sessionType: 'individual' | 'group';
  therapistId: string;
  patientId?: string | null;
  groupId?: string | null;
  audioUrl: string;
  transcriptionStatus: string;
  createdAt: Date;
  // Patient/Group info populated from joins
  patient?: PatientInfo | null;
  group?: {
    id: string;
    name: string;
  } | null;
};

export type PatientSessionGroup = {
  patient: PatientInfo;
  sessions: SessionWithPatient[];
  sessionCount: number;
  isExpanded?: boolean;
};

/**
 * Groups sessions by patient, sorting patients alphabetically by name
 * Both individual and group sessions are grouped by their patient
 *
 * @param sessions - Array of sessions with patient/group data populated
 * @returns Array of patient groups with their sessions
 */
export function groupSessionsByPatient(
  sessions: SessionWithPatient[],
): PatientSessionGroup[] {
  // Group sessions by patient ID or group ID
  const grouped = sessions.reduce(
    (acc, session) => {
      let key: string;
      let patientInfo: PatientInfo;

      if (session.patient) {
        // Use patient info for both individual and group sessions
        key = session.patientId || 'unknown';
        patientInfo = {
          id: session.patient.id,
          name: session.patient.name,
          avatarUrl: session.patient.avatarUrl,
        };
      } else {
        // Fallback for sessions without proper patient/group data
        key = 'unknown';
        patientInfo = {
          id: 'unknown',
          name: 'Unknown Patient',
          avatarUrl: null,
        };
      }

      if (!acc[key]) {
        acc[key] = {
          patient: patientInfo,
          sessions: [],
          sessionCount: 0,
          isExpanded: false,
        };
      }

      acc[key]!.sessions.push(session);
      acc[key]!.sessionCount += 1;

      return acc;
    },
    {} as Record<string, PatientSessionGroup>,
  );

  // Convert to array and sort by patient name alphabetically
  const patientGroups = Object.values(grouped).sort((a, b) =>
    a.patient.name.localeCompare(b.patient.name),
  );

  // Sort sessions within each group by date (most recent first)
  patientGroups.forEach((group) => {
    group.sessions.sort(
      (a, b) =>
        new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime(),
    );
  });

  return patientGroups;
}

/**
 * Filters patient groups based on search query
 * Searches in patient name, session title, and group name
 */
export function filterPatientGroups(
  groups: PatientSessionGroup[],
  searchQuery: string,
): PatientSessionGroup[] {
  if (!searchQuery.trim()) {
    return groups;
  }

  const query = searchQuery.toLowerCase().trim();

  return groups
    .map((group) => {
      // Check if patient name matches
      const patientNameMatches = group.patient.name
        .toLowerCase()
        .includes(query);

      // Filter sessions that match the query
      const matchingSessions = group.sessions.filter((session) => {
        return (
          session.title.toLowerCase().includes(query)
          || session.patient?.name.toLowerCase().includes(query)
          || session.group?.name.toLowerCase().includes(query)
        );
      });

      // Include group if patient name matches OR if any sessions match
      if (patientNameMatches || matchingSessions.length > 0) {
        return {
          ...group,
          sessions: patientNameMatches ? group.sessions : matchingSessions,
          sessionCount: patientNameMatches
            ? group.sessionCount
            : matchingSessions.length,
        };
      }

      return null;
    })
    .filter((group): group is PatientSessionGroup => group !== null);
}

/**
 * Filters sessions by date range
 */
export function filterByDateRange(
  sessions: SessionWithPatient[],
  startDate?: Date | null,
  endDate?: Date | null,
): SessionWithPatient[] {
  return sessions.filter((session) => {
    const sessionDate = new Date(session.sessionDate);

    if (startDate && sessionDate < startDate) {
      return false;
    }

    if (endDate) {
      // Set end date to end of day for inclusive filtering
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (sessionDate > endOfDay) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Filters sessions by patient IDs
 * Includes both individual and group sessions for the selected patients
 */
export function filterByPatients(
  sessions: SessionWithPatient[],
  patientIds: string[],
): SessionWithPatient[] {
  if (patientIds.length === 0) {
    return sessions;
  }

  return sessions.filter((session) => {
    // Include both individual and group sessions by patient ID
    return session.patientId && patientIds.includes(session.patientId);
  });
}

/**
 * Filters sessions by group IDs
 */
export function filterByGroups(
  sessions: SessionWithPatient[],
  groupIds: string[],
): SessionWithPatient[] {
  if (groupIds.length === 0) {
    return sessions;
  }

  return sessions.filter((session) => {
    if (session.sessionType === 'group') {
      return session.groupId && groupIds.includes(session.groupId);
    }
    return false; // Don't include individual sessions in group filter
  });
}
