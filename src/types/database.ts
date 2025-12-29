import { Timestamp } from "firebase/firestore";

// Colección: /users/{uid}
// Perfil privado y de autenticación
export interface UserProfile {
    id: string; // Auth UID
    role: "admin" | "student";
    email: string;
    name: string;
    phone?: string;
    createdAt: Timestamp;
}

// Colección: /students/{uid}
// Datos operativos de negocio
export interface StudentData {
    uid: string;
    current_plan_id: string; // Referencia a /plans/{id}
    clases_restantes: number;
    fecha_expiracion: Timestamp;
    qr_token: string; // Hash único para validación de check-in
    last_checkin: Timestamp | null;
}

// Colección: /plans/{id}
// Catálogo de servicios
export interface YogaPlan {
    id: string;
    name: string;
    clases_totales: number;
    precio: number;
    duracion_dias: number;
}

// Colección: /asistencias/{asistenciaId}
// Log de auditoría inmutable
export interface AttendanceLog {
    student_id: string;
    timestamp: Timestamp;
    status: "success" | "failed";
    admin_id: string; // UID del admin/dispositivo que validó
}
