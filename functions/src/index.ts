import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

export const createStudentOnboarding = functions.https.onCall(async (data, context) => {
    // 1. Validar autenticación
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "El usuario debe estar autenticado."
        );
    }

    // 2. Validar rol de Admin (Claims o Firestore)
    const callerUid = context.auth.uid;
    const callerDoc = await db.collection("users").doc(callerUid).get();
    const callerData = callerDoc.data();

    if (!callerData || callerData.role !== "admin") {
        throw new functions.https.HttpsError(
            "permission-denied",
            "Solo los administradores pueden realizar esta acción."
        );
    }

    const { email, displayName, planId, phone } = data;

    // Validación básica de entrada
    if (!email || !displayName || !planId) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Faltan campos obligatorios: email, displayName o planId."
        );
    }

    try {
        // 3. Crear usuario en Auth (sin password)
        const userRecord = await admin.auth().createUser({
            email,
            displayName,
            disabled: false,
        });

        // 4. Generar link de reset de contraseña
        const resetLink = await admin.auth().generatePasswordResetLink(email);

        // 5. Obtener datos del plan desde Firestore
        const planDoc = await db.collection("plans").doc(planId).get();
        if (!planDoc.exists) {
            throw new functions.https.HttpsError(
                "not-found",
                "El plan seleccionado no existe."
            );
        }
        const selectedPlan = planDoc.data() || { name: "Sin plan", classes: 0, days: 0 };
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + (selectedPlan.days || 30));

        // 6. Crear documentos en Firestore (Atomicidad si es posible)
        const batch = db.batch();

        const userRef = db.collection("users").doc(userRecord.uid);
        batch.set(userRef, {
            id: userRecord.uid,
            name: displayName,
            email: email,
            phone: phone || "",
            role: "student",
            plan: selectedPlan.name,
            status: "Activo",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const studentRef = db.collection("students").doc(userRecord.uid);
        batch.set(studentRef, {
            uid: userRecord.uid,
            current_plan_id: planId,
            clases_restantes: selectedPlan.classes,
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
                    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E8F5E9; rounded: 12px;">
                        <h1 style="color: #1E293B; font-family: serif;">¡Namasté, ${displayName}!</h1>
                        <p style="color: #64748b;">Tu cuenta ha sido creada exitosamente en TeraYoga Estudio.</p>
                        <p style="color: #64748b;">Para comenzar, es necesario que configures tu contraseña haciendo clic en el siguiente botón:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" style="background-color: #1E293B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Configurar mi Cuenta</a>
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
        console.error("Error in onboarding:", error);

        if (error.code === "auth/email-already-exists") {
            throw new functions.https.HttpsError(
                "already-exists",
                "Este correo ya está registrado en el sistema."
            );
        }

        throw new functions.https.HttpsError(
            "internal",
            error.message || "Error interno al procesar el onboarding."
        );
    }
});
