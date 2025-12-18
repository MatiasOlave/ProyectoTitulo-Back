import { MercadoPagoConfig, Preference } from 'mercadopago';
import { AppDataSource } from '../config/database';
import { Company } from '../entities/companies/company.entity';
import { Student } from '../entities/students/student.entity';

export class PaymentService {
    private client: MercadoPagoConfig;
    private preference: Preference;

    constructor() {
        const accessToken = process.env.MP_ACCESS_TOKEN;
        if (!accessToken) {
            console.warn('MP_ACCESS_TOKEN is not defined in .env');
        }

        this.client = new MercadoPagoConfig({
            accessToken: accessToken || '',
        });
        this.preference = new Preference(this.client);
    }

    async createMonthlyPaymentPreference(companyId: string) {
        const companyRepo = AppDataSource.getRepository(Company);
        const studentRepo = AppDataSource.getRepository(Student);

        const company = await companyRepo.findOne({ where: { id: companyId } });
        if (!company) {
            throw new Error('Company not found');
        }

        const activeStudentsCount = await studentRepo.count({
            where: {
                companyId: companyId,
                status: 'active',
            },
        });

        if (activeStudentsCount === 0) {
            throw new Error('No active students found to bill for this company');
        }

        const pricePerStudent = 1200;
        const taxRate = 0.19; // 19% IVA
        const unitPriceWithTax = pricePerStudent * (1 + taxRate);

        // Rounding to nearest integer for CLP if needed, though MP supports decimals, CLP is usually integer.
        // 1200 * 1.19 = 1428. It is exact integer.
        const unitPrice = Math.round(unitPriceWithTax);

        try {
            const result = await this.preference.create({
                body: {
                    items: [
                        {
                            id: 'student-monthly-fee',
                            title: `Mensualidad por Estudiante - ${company.name}`,
                            description: `Cobro mensual de $${pricePerStudent} + IVA por estudiante`,
                            quantity: activeStudentsCount,
                            unit_price: unitPrice,
                            currency_id: 'CLP',
                        },
                    ],
                    metadata: {
                        company_id: companyId,
                        student_count: activeStudentsCount,
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear(),
                    },
                    external_reference: `SUB-${companyId}-${Date.now()}`,
                    // You might want to add back_urls here if the user provided frontend URLs
                    // back_urls: {
                    //   success: "http://localhost:3000/payments/success",
                    //   failure: "http://localhost:3000/payments/failure",
                    //   pending: "http://localhost:3000/payments/pending"
                    // },
                    // auto_return: "approved",
                },
            });

            return {
                preferenceId: result.id,
                initPoint: result.init_point,
                sandboxInitPoint: result.sandbox_init_point,
                details: {
                    studentCount: activeStudentsCount,
                    unitPrice: unitPrice,
                    totalAmount: unitPrice * activeStudentsCount,
                    currency: 'CLP'
                }
            };
        } catch (error) {
            console.error('Error creating MercadoPago preference:', error);
            throw new Error('Failed to create payment preference');
        }
    }
}
