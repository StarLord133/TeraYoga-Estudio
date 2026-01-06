import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

export const createStudentOnboarding = functions.https.onCall(async (data, context) => {
    try {
        // 1. Validar autenticación preliminar
        if (!context.auth) {
            throw new functions.https.HttpsError(
                "unauthenticated",
                "El usuario debe estar autenticado."
            );
        }

        const { email, displayName, planId, phone } = data;

        // Validación básica de entrada
        if (!email || !displayName || !planId) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "Faltan campos obligatorios: correo, nombre o plan."
            );
        }

        // 2. Validar rol de Admin (Firestore)
        const callerUid = context.auth.uid;
        const callerDoc = await db.collection("users").doc(callerUid).get();
        const callerData = callerDoc.data();

        if (!callerDoc.exists || !callerData || callerData.role !== "admin") {
            throw new functions.https.HttpsError(
                "permission-denied",
                "Solo los administradores pueden realizar esta acción."
            );
        }

        // 3. Crear usuario en Auth (sin password)
        let userRecord;
        try {
            userRecord = await admin.auth().createUser({
                email,
                displayName,
                disabled: false,
            });
        } catch (authError: any) {
            console.error("Auth creation error:", authError);
            if (authError.code === "auth/email-already-exists") {
                throw new functions.https.HttpsError("already-exists", "Este correo ya está registrado.");
            }
            throw new functions.https.HttpsError("internal", "Error al crear la cuenta de usuario: " + authError.message);
        }

        // 4. Generar link de reset de contraseña
        let resetLink;
        try {
            const defaultLink = await admin.auth().generatePasswordResetLink(email);
            // Reemplazamos el dominio por defecto de Firebase auth por nuestro dominio personalizado
            // para que cargue nuestra página de styling zen.
            resetLink = defaultLink.replace(
                "terayoga-estudio.firebaseapp.com/__/auth/action",
                "terayoga-estudio.web.app/auth/action"
            );
        } catch (resetError: any) {
            console.error("Reset link error:", resetError);
            resetLink = "#error-link-config";
        }

        // 5. Obtener datos del plan desde Firestore
        const planDoc = await db.collection("plans").doc(planId).get();
        if (!planDoc.exists) {
            throw new functions.https.HttpsError("not-found", "El plan seleccionado no existe.");
        }

        const selectedPlan = planDoc.data() || {};
        const classes = selectedPlan.classes || 0;
        const days = selectedPlan.days || 30;

        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + days);

        // 6. Crear documentos en Firestore
        const batch = db.batch();

        const userRef = db.collection("users").doc(userRecord.uid);
        batch.set(userRef, {
            id: userRecord.uid,
            name: displayName,
            email: email,
            phone: phone || "",
            role: "student",
            plan: selectedPlan.name || "Sin plan",
            status: "Activo",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const studentRef = db.collection("students").doc(userRecord.uid);
        batch.set(studentRef, {
            uid: userRecord.uid,
            current_plan_id: planId,
            clases_restantes: classes,
            fecha_expiracion: admin.firestore.Timestamp.fromDate(expirationDate),
            qr_token: Buffer.from(userRecord.uid + Date.now()).toString("base64"),
            last_checkin: null,
        });

        // 7. Integración con Trigger Email extension
        const mailRef = db.collection("mail").doc();
        batch.set(mailRef, {
            to: email,
            message: {
                subject: "¡Bienvenida a TeraYoga!",
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E8F5E9; border-radius: 12px;">
                        <h1 style="color: #1E293B; font-family: serif;">¡Namasté, ${displayName}!</h1>
                        <p style="color: #64748b;">Tu cuenta ha sido creada exitosamente en TeraYoga Estudio.</p>
                        <p style="color: #64748b;">Para comenzar, es necesario que configures tu contraseña haciendo clic en el siguiente botón:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" style="background-color: #1E293B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Configurar mi Cuenta</a>
                        </div>
                        <p style="font-size: 12px; color: #94a3b8;">Si el botón no funciona, copia y pega este enlace en tu navegador: <br> ${resetLink}</p>
                        <hr style="border: none; border-top: 1px solid #E8F5E9; margin: 20px 0;">
                        <p style="font-size: 12px; color: #94a3b8; text-align: center;">TeraYoga Estudio &copy; 2025</p>
                    </div>
                `,
            },
        });

        await batch.commit();
        return { success: true, uid: userRecord.uid };

    } catch (error: any) {
        console.error("Error global in onboarding:", error);

        // Si ya es un HttpsError, volver a lanzarlo tal cual
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }

        // Si es un error desconocido, lanzarlo como internal con mensaje
        throw new functions.https.HttpsError(
            "internal",
            error.message || "Error inesperado al procesar el onboarding."
        );
    }
});

/**
 * Procesa el check-in de una alumna de forma transaccional.
 * Valida créditos, expiración y token del QR.
 */
export const processCheckIn = functions
    .runWith({ memory: "512MB" })
    .https.onCall(async (data, context) => {
        // 1. Validar Seguridad (Solo Admins)
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "Usuario no autenticado.");
        }

        // Verificamos el rol mediante Custom Claims, con fallback a Firestore por si el token no se ha refrescado
        let isAdmin = context.auth.token.role === "admin";

        if (!isAdmin) {
            functions.logger.info(`Claim de admin no hallado en token para ${context.auth.uid}, consultando Firestore...`);
            const adminDoc = await db.collection("users").doc(context.auth.uid).get();
            isAdmin = adminDoc.exists && adminDoc.data()?.role === "admin";
        }

        if (!isAdmin) {
            throw new functions.https.HttpsError("permission-denied", "Acceso restringido a administradores.");
        }

        const { alumnaId, token } = data;

        functions.logger.info(`Intento de Check-in para: ${alumnaId}`, { hasToken: !!token });

        if (!alumnaId || !token) {
            throw new functions.https.HttpsError("invalid-argument", "Faltan parámetros (alumnaId o token).");
        }

        try {
            const result = await db.runTransaction(async (transaction) => {
                const studentRef = db.collection("students").doc(alumnaId);
                const userRef = db.collection("users").doc(alumnaId);

                const studentDoc = await transaction.get(studentRef);
                const userDoc = await transaction.get(userRef);

                // Validaciones de existencia
                if (!studentDoc.exists) {
                    throw new functions.https.HttpsError("not-found", "La alumna no está registrada en la colección de estudiantes.");
                }
                if (!userDoc.exists) {
                    throw new functions.https.HttpsError("not-found", "No se encontraron datos de usuario para esta ID.");
                }

                const studentData = studentDoc.data()!;
                const userData = userDoc.data()!;
                const now = admin.firestore.Timestamp.now();

                // 2. Validación de Token QR (Seguridad contra capturas de pantalla viejas)
                if (studentData.qr_token !== token) {
                    functions.logger.warn(`Intento de check-in con token inválido para: ${alumnaId}`);
                    throw new functions.https.HttpsError("permission-denied", "Código QR inválido o expirado.");
                }

                // 3. Validación de Negocio
                if (studentData.clases_restantes <= 0) {
                    throw new functions.https.HttpsError("failed-precondition", "Sin clases disponibles.");
                }

                if (studentData.fecha_expiracion && studentData.fecha_expiracion.toMillis() < now.toMillis()) {
                    throw new functions.https.HttpsError("failed-precondition", "Plan expirado.");
                }

                // 4. Ejecutar cambios (Atómicos)
                const newClassesCount = studentData.clases_restantes - 1;
                // Generar nuevo token aleatorio para invalidar el actual
                const newQrToken = Buffer.from(alumnaId + Date.now() + Math.random()).toString("base64");

                transaction.update(studentRef, {
                    clases_restantes: newClassesCount,
                    qr_token: newQrToken,
                    last_checkin: now
                });

                // Registrar auditoría de asistencia
                const attendanceRef = db.collection("asistencias").doc();
                transaction.set(attendanceRef, {
                    student_id: alumnaId,
                    student_name: userData.name || "Alumna",
                    fecha: now,
                    status: "success",
                    plan_id: studentData.current_plan_id || "unknown"
                });

                return {
                    success: true,
                    remainingClasses: newClassesCount,
                    studentName: userData.name || "Alumna",
                    photo: userData.photoURL || null
                };
            });

            return result;

        } catch (error: any) {
            functions.logger.error("Error en Transacción Check-in:", error);
            if (error instanceof functions.https.HttpsError) throw error;
            throw new functions.https.HttpsError("internal", error.message || "Error al procesar el check-in.");
        }
    });

/**
 * Trigger automático para asignar roles en Auth cuando se crea un usuario en Firestore.
 * Esto habilita el uso de Custom Claims en Security Rules y context.auth.token.
 */
export const onUserCreated = functions.firestore
    .document("users/{userId}")
    .onCreate(async (snap, context) => {
        const userData = snap.data();
        const userId = context.params.userId;
        const role = userData.role || "student";

        try {
            await admin.auth().setCustomUserClaims(userId, { role });
            functions.logger.info(`Custom claims establecidos para ${userId}: ${role}`);
        } catch (error) {
            functions.logger.error(`Error al establecer claims para ${userId}:`, error);
        }
    });
