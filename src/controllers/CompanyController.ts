import { Request, Response } from 'express';
import { CompanyService } from '../services/CompanyService';
import { createCompanySchema } from '../schemas/company.schema';
import { z } from 'zod';

export class CompanyController {
    private companyService: CompanyService;

    constructor() {
        this.companyService = new CompanyService();
    }

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const data = createCompanySchema.parse(req.body);
            const company = await this.companyService.create(data);
            res.status(201).json(company);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    message: 'Validation error',
                    errors: error.issues
                });
            } else if (error.message.includes('already exists')) {
                res.status(409).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Error creating company', error: error.message });
            }
        }
    };

    findAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const companies = await this.companyService.findAll();
            res.status(200).json(companies);
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching companies', error: error.message });
        }
    };

    getOne = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const company = await this.companyService.findById(id);

            if (!company) {
                res.status(404).json({ message: 'Company not found' });
                return;
            }

            res.status(200).json(company);
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching company', error: error.message });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const data = createCompanySchema.partial().parse(req.body);

            const updatedCompany = await this.companyService.update(id, data);

            if (!updatedCompany) {
                res.status(404).json({ message: 'Company not found' });
                return;
            }

            res.status(200).json(updatedCompany);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    message: 'Validation error',
                    errors: error.issues
                });
            } else {
                res.status(500).json({ message: 'Error updating company', error: error.message });
            }
        }
    };

    getStatistics = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            // Verify if company exists first? Not strictly necessary as stats will just be empty/zero, but good practice.
            // Actually getStatistics in service doesn't check existence, it just filters.

            const stats = await this.companyService.getStatistics(id);
            res.status(200).json(stats);
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching company statistics', error: error.message });
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const success = await this.companyService.softDelete(id);

            if (!success) {
                res.status(404).json({ message: 'Company not found' });
                return;
            }

            res.status(200).json({ message: 'Company deactivated successfully and users disabled' });
        } catch (error: any) {
            res.status(500).json({ message: 'Error deleting company', error: error.message });
        }
    };
}
