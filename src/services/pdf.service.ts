import PDFDocument from 'pdfkit';
import { Student } from '../entities/students/student.entity';
import { MedicalInfo } from '../entities/students/medical-info.entity';
import { MedicalIncident } from '../entities/medical/medical-incident.entity';
import { ClassBookEntry } from '../entities/academic/class-book-entry.entity';

export const pdfService = {
    generateFichaReport: (student: Student, record: MedicalInfo): Promise<Buffer> => {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument();
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Header
            doc.fontSize(20).text('Ficha Médica Estudiantil', { align: 'center' });
            doc.moveDown();

            // Student Info
            doc.fontSize(14).text('Información del Estudiante');
            doc.fontSize(12).text(`Nombre: ${student.firstName} ${student.lastName}`);
            doc.text(`RUT: ${student.rut}`);
            // Provide safe fallbacks for optional fields to avoid undefined errors
            doc.text(`Curso: ${student.level?.name || 'N/A'}`);
            doc.moveDown();

            // Guardian Info (Primary)
            const guardian = student.studentGuardians && student.studentGuardians.length > 0 ? student.studentGuardians[0].guardian : null;
            if (guardian) {
                doc.fontSize(14).text('Apoderado Principal');
                doc.fontSize(12).text(`Nombre: ${guardian.firstName} ${guardian.lastName}`);
                doc.text(`Teléfono: ${guardian.phone || 'N/A'}`);
                doc.text(`Email: ${guardian.email}`);
                doc.moveDown();
            }

            // Medical Record
            if (record) {
                doc.fontSize(14).text('Antecedentes Médicos');
                doc.fontSize(12).text(`Tipo de Sangre: ${record.bloodType || 'No registrado'}`);
                doc.text(`Previsión: ${record.healthInsuranceProvider || record.healthInsuranceType || 'No registrada'}`);
                doc.moveDown();

                doc.text('Alergias:', { underline: true });
                doc.text(record.allergies || 'Ninguna registrada');
                doc.moveDown();

                doc.text('Condiciones Crónicas:', { underline: true });
                doc.text(record.chronicConditions || 'Ninguna registrada');
                doc.moveDown();

                doc.text('Medicamentos Permanentes:', { underline: true });
                doc.text(record.medications || 'Ninguno registrado');
                doc.moveDown();
            } else {
                doc.fontSize(12).text('No se ha registrado ficha médica para este estudiante.');
            }

            doc.end();
        });
    },

    generateIncidentsReport: (student: Student, incidents: MedicalIncident[], title: string = 'Reporte de Incidentes Médicos'): Promise<Buffer> => {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument();
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Header
            doc.fontSize(20).text(title, { align: 'center' });
            doc.moveDown();

            doc.fontSize(12).text(`Estudiante: ${student.firstName} ${student.lastName}`);
            doc.text(`RUT: ${student.rut}`);
            doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`);
            doc.moveDown();

            if (incidents.length === 0) {
                doc.text('No se encontraron incidentes registrados en el periodo solicitado.');
            } else {
                incidents.forEach((incident, index) => {
                    doc.fontSize(14).text(`Incidente #${index + 1} - ${new Date(incident.incidentDate).toLocaleDateString()}`);
                    doc.fontSize(12);
                    doc.text(`Tipo: ${incident.incidentType}`);
                    doc.text(`Severidad: ${incident.severity}`);
                    doc.text(`Descripción: ${incident.description}`);
                    if (incident.actionsTaken) doc.text(`Acciones Tomadas: ${incident.actionsTaken}`);
                    if (incident.resolvedAt) doc.text(`Estado: Resuelto el ${new Date(incident.resolvedAt).toLocaleDateString()}`);
                    else doc.text(`Estado: Abierto`);

                    if (incident.requiredMedicalAttention) {
                        doc.moveDown(0.5);
                        doc.text('Atención Médica Externa:', { underline: true });
                        doc.text(`Centro: ${incident.medicalCenterVisited || 'N/A'}`);
                        doc.text(`Diagnóstico: ${incident.diagnosis || 'N/A'}`);
                    }

                    doc.moveDown();
                    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(); // Separator line
                    doc.moveDown();
                });
            }

            doc.end();
        });
    },

    generateClassBookSummary: (entry: ClassBookEntry): Promise<Buffer> => {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument();
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            doc.fontSize(18).text('Libro de Clases Digital', { align: 'center' });
            doc.moveDown();

            doc.fontSize(12).text(`Fecha: ${new Date(entry.date).toLocaleDateString()}`);
            doc.text(`Nivel: ${entry.level?.name || 'N/A'}`);
            doc.text(`Profesor: ${entry.teacher?.firstName} ${entry.teacher?.lastName}`);
            doc.moveDown();

            doc.fontSize(14).text('Resumen de Asistencia', { underline: true });
            doc.fontSize(12).text(`Total Estudiantes: ${entry.totalStudents}`);
            doc.text(`Presentes: ${entry.studentsPresent}`);
            doc.text(`Ausentes: ${entry.studentsAbsent}`);
            doc.text(`Porcentaje: ${entry.attendancePercentage}%`);
            doc.moveDown();

            doc.fontSize(14).text('Detalles Pedagógicos', { underline: true });
            doc.fontSize(12).text('Actividades Realizadas:');
            doc.text(entry.activitiesPerformed);
            doc.moveDown(0.5);

            if (entry.teachingMethodology) {
                doc.text('Metodología:');
                doc.text(entry.teachingMethodology);
                doc.moveDown(0.5);
            }

            if (entry.resourcesUsed) {
                doc.text('Recursos Utilizados:');
                doc.text(entry.resourcesUsed);
            }

            doc.end();
        });
    }
};
