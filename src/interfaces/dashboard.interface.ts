export interface DashboardDataBase {
    role: string;
}

export interface DirectorDashboardData extends DashboardDataBase {
    role: 'DIRECTOR';
    metrics: {
        totalStudents: number;
        activeStudents: number;
        totalTeachers: number;
        attendanceRate: number; // Porcentaje 0-100
    };
    alerts: {
        id: string;
        type: 'DOCUMENT_EXPIRING' | 'LOW_ATTENDANCE';
        message: string;
        severity: 'high' | 'medium' | 'low';
    }[];
}

export interface TeacherDashboardData extends DashboardDataBase {
    role: 'TEACHER';
    todayClasses: {
        courseName: string;
        startTime: string;
        endTime: string;
        studentCount: number;
        presentCount: number;
    }[];
    pendingPlannings: number;
    nextClass: string | null;
}

export interface GuardianDashboardData extends DashboardDataBase {
    role: 'GUARDIAN';
    children: {
        id: string;
        fullName: string;
        status: 'IN_CLASS' | 'ABSENT' | 'ON_ROUTE' | 'AT_HOME';
        lastActivity: string;
        attendanceToday: {
            status: string;
            checkInTime: string | null;
        } | null;
    }[];
    unreadMessages: number;
}

export interface DriverDashboardData extends DashboardDataBase {
    role: 'DRIVER';
    currentVehicle: {
        plate: string;
        model: string;
        status: string;
        maintenanceAlert: boolean;
    } | null;
    nextRoute: {
        name: string;
        startTime: string;
        stopsCount: number;
    } | null;
}

export interface AdminDashboardData extends DashboardDataBase {
    role: 'ADMIN';
    enrollment: {
        current: number;
        capacity: number;
    };
    fleetStatus: {
        totalVehicles: number;
        documentsExpiring: number;
        maintenanceAlerts: number;
    };
    usersSummary: {
        staffCount: number;
        guardianCount: number;
    };
    recentAuditLogs: {
        id: string;
        action: string;
        user: string;
        date: string;
    }[];
}

export type DashboardData =
    | DirectorDashboardData
    | TeacherDashboardData
    | GuardianDashboardData
    | DriverDashboardData
    | AdminDashboardData;
