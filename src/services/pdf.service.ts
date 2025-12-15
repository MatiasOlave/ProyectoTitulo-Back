import PDFDocument from 'pdfkit';
import { Response } from 'express';

class PdfService {
    generateAttendanceReport(res: Response, data: any[], timeframe: string) {
        const doc = new PDFDocument();

        // Stream to response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=reporte_asistencia_${Date.now()}.pdf`);
        doc.pipe(res);

        // Header
        doc.fontSize(20).text('Reporte de Asistencia - KinderCloud', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Período: ${timeframe}`, { align: 'center' });
        doc.moveDown();

        // Table Header
        const startX = 50;
        let startY = 150;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Estudiante', startX, startY);
        doc.text('Fecha', startX + 150, startY);
        doc.text('Estado', startX + 250, startY);
        doc.text('Observaciones', startX + 350, startY);

        doc.moveTo(startX, startY + 15).lineTo(550, startY + 15).stroke();

        startY += 25;
        doc.font('Helvetica');

        // Rows
        data.forEach(item => {
            if (startY > 700) { // New Page
                doc.addPage();
                startY = 50;
            }

            const name = item.student ? `${item.student.firstName} ${item.student.lastName}` : 'N/A';
            const date = new Date(item.date).toLocaleDateString();
            const status = item.status.toUpperCase();
            const obs = item.observations || '-';

            doc.text(name, startX, startY);
            doc.text(date, startX + 150, startY);

            // Colorize status?
            if (status === 'ABSENT') doc.fillColor('red');
            else if (status === 'LATE') doc.fillColor('orange');
            else doc.fillColor('green');

            doc.text(status, startX + 250, startY);
            doc.fillColor('black');

            doc.text(obs, startX + 350, startY);

            startY += 20;
        });

        // Statistics
        // Calculate basic stats
        const total = data.length;
        const present = data.filter(d => d.status === 'present').length;
        const absent = data.filter(d => d.status === 'absent').length;
        const late = data.filter(d => d.status === 'late').length;

        doc.addPage();
        doc.fontSize(16).text('Resumen Estadístico', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Total Registros: ${total}`);
        doc.text(`Presentes: ${present} (${((present / total) * 100).toFixed(1)}%)`);
        doc.text(`Ausentes: ${absent} (${((absent / total) * 100).toFixed(1)}%)`);
        doc.text(`Atrasos: ${late} (${((late / total) * 100).toFixed(1)}%)`);

        doc.moveDown(2);

        // Render Chart
        this.drawBarChart(doc, 100, 400, 400, 200, [
            { label: 'Presentes', value: present, color: '#4ade80' }, // Green
            { label: 'Ausentes', value: absent, color: '#f87171' },   // Red
            { label: 'Atrasos', value: late, color: '#facc15' }       // Yellow
        ]);

        doc.end();
    }

    async generateFichaReport(student: any, record: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument();
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // Title
            doc.fontSize(20).text('Ficha Médica del Estudiante', { align: 'center' });
            doc.moveDown();

            // Student Info
            doc.fontSize(14).text('Información del Estudiante');
            doc.fontSize(12).text(`Nombre: ${student.firstName} ${student.lastName}`);
            doc.text(`RUT: ${student.rut || 'N/A'}`);
            doc.text(`Nivel: ${student.level?.name || 'Sin nivel'}`);
            doc.moveDown();

            // Primary Guardian
            const primaryGuardian = student.studentGuardians?.find((sg: any) => sg.isPrimary || sg.priority === 1)?.guardian;
            if (primaryGuardian) {
                doc.fontSize(14).text('Apoderado Principal');
                doc.fontSize(12).text(`Nombre: ${primaryGuardian.firstName} ${primaryGuardian.lastName}`);
                doc.text(`Teléfono: ${primaryGuardian.phone}`);
                doc.text(`Email: ${primaryGuardian.email}`);
                doc.moveDown();
            }

            // Medical Info
            if (record) {
                doc.fontSize(14).text('Información Médica');
                doc.fontSize(12);
                doc.text(`Tipo de Sangre: ${record.bloodType || 'No registrado'}`);
                doc.text(`Seguro de Salud: ${record.healthInsurance || 'No registrado'}`);

                doc.moveDown();
                doc.text('Alergias:');
                doc.text(record.allergies || 'Ninguna registrada');

                doc.moveDown();
                doc.text('Condiciones Crónicas:');
                doc.text(record.chronicConditions || 'Ninguna registrada');

                doc.moveDown();
                doc.text('Medicamentos:');
                doc.text(record.medications || 'Ninguno registrado');

                doc.moveDown();
                doc.text('Restricciones Alimentarias:');
                doc.text(record.dietaryRestrictions || 'Ninguna registrada');
            } else {
                doc.fontSize(12).text('No se ha registrado información médica detallada.');
            }

            doc.end();
        });
    }

    private drawBarChart(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number, data: { label: string, value: number, color: string }[]) {
        const maxValue = Math.max(...data.map(d => d.value), 1); // Avoid div by zero
        const barWidth = (width / data.length) - 20;
        const axisColor = '#333';

        // Draw Axis
        doc.lineWidth(1).strokeColor(axisColor);
        doc.moveTo(x, y).lineTo(x, y - height).stroke(); // Y Axis
        doc.moveTo(x, y).lineTo(x + width, y).stroke();  // X Axis

        // Draw Bars
        data.forEach((item, index) => {
            const barHeight = (item.value / maxValue) * (height - 20);
            const barX = x + 20 + (index * (barWidth + 20));
            const barY = y - barHeight;

            doc.fillColor(item.color)
                .rect(barX, barY, barWidth, barHeight)
                .fill();

            // Label
            doc.fillColor('#000')
                .fontSize(10)
                .text(item.label, barX, y + 5, { width: barWidth, align: 'center' });

            // Value
            doc.text(item.value.toString(), barX, barY - 15, { width: barWidth, align: 'center' });
        });
    }

    async generateIncidentsReport(student: any, incidents: any[], title: string = 'Reporte de Incidentes Médicos'): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument();
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            doc.fontSize(20).text(title, { align: 'center' });
            doc.moveDown();

            doc.fontSize(12).text(`Estudiante: ${student.firstName} ${student.lastName}`);
            doc.text(`RUT: ${student.rut || 'N/A'}`);
            doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`);
            doc.moveDown();

            if (!incidents || incidents.length === 0) {
                doc.text('No se encontraron registros para este reporte.');
            } else {
                incidents.forEach((incident, index) => {
                    doc.fontSize(14).text(`Incidente #${index + 1} - ${new Date(incident.date).toLocaleDateString()}`);
                    doc.fontSize(12);
                    doc.text(`Título: ${incident.title}`);
                    doc.text(`Severidad: ${incident.severity}`);
                    doc.text(`Lugar: ${incident.location || 'No especificado'}`);
                    doc.text(`Descripción:`);
                    doc.text(incident.description);

                    if (incident.actionsTaken) {
                        doc.text(`Acciones Tomadas: ${incident.actionsTaken}`);
                    }

                    if (incident.requiredMedicalAttention) {
                        doc.fillColor('red').text('REQUIRIÓ ATENCIÓN MÉDICA EXTERNA').fillColor('black');
                    }

                    doc.moveDown();
                    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                    doc.moveDown();
                });
            }

            doc.end();
        });
    }

    async generateClassBookSummary(entry: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument();
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).text('Resumen de Libro de Clases', { align: 'center' });
            doc.moveDown();

            const dateStr = entry.date instanceof Date ? entry.date.toLocaleDateString() : new Date(entry.date).toLocaleDateString();

            // Metadata
            doc.fontSize(12).text(`Fecha: ${dateStr}`);
            doc.text(`Profesor: ${entry.teacher?.firstName} ${entry.teacher?.lastName}`);
            doc.text(`Nivel: ${entry.level?.name || 'N/A'}`);
            doc.moveDown();

            // Stats
            doc.fontSize(14).text('Asistencia');
            doc.fontSize(12).text(`Total Estudiantes: ${entry.totalStudents}`);
            doc.text(`Presentes: ${entry.studentsPresent} (${entry.attendancePercentage}%)`);
            doc.text(`Ausentes: ${entry.studentsAbsent}`);
            doc.text(`Atrasos: ${entry.studentsLate}`);
            doc.moveDown();

            // Content
            doc.fontSize(14).text('Actividades Realizadas');
            doc.fontSize(12).text(entry.activitiesPerformed || 'Sin registro');
            doc.moveDown();

            if (entry.teachingMethodology) {
                doc.fontSize(14).text('Metodología');
                doc.fontSize(12).text(entry.teachingMethodology);
                doc.moveDown();
            }

            if (entry.resourcesUsed && entry.resourcesUsed.length > 0) {
                doc.fontSize(14).text('Recursos Utilizados');
                doc.fontSize(12).text(Array.isArray(entry.resourcesUsed) ? entry.resourcesUsed.join(', ') : entry.resourcesUsed);
                doc.moveDown();
            }

            if (entry.incidents) {
                doc.fontSize(14).text('Incidentes / Observaciones Generales');
                doc.fontSize(12).text(entry.incidents);
                doc.moveDown();
            }

            // Observations
            if (entry.studentObservations && entry.studentObservations.length > 0) {
                doc.addPage();
                doc.fontSize(16).text('Observaciones Individuales', { align: 'center' });
                doc.moveDown();

                entry.studentObservations.forEach((obs: any, idx: number) => {
                    doc.fontSize(12).font('Helvetica-Bold').text(`Estudiante: ${obs.student?.firstName} ${obs.student?.lastName}`);
                    doc.font('Helvetica').text(`Categoría: ${obs.category}`);
                    doc.text(`Observación: ${obs.observation}`);
                    if (obs.requiresFollowUp) doc.fillColor('red').text('Requiere Seguimiento').fillColor('black');
                    doc.moveDown();

                    if (idx < entry.studentObservations.length - 1) {
                        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                        doc.moveDown();
                    }
                });
            }

            doc.end();
        });
    }
}

export const pdfService = new PdfService();
