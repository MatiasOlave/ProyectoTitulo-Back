// src/controllers/location.controller.ts
import { Request, Response } from 'express';
import { locationService } from '../services/location.service';

export const locationController = {
    /**
     * GET /api/locations/countries
     * Get all countries
     */
    async getCountries(_req: Request, res: Response) {
        try {
            const countries = await locationService.getAllCountries();

            return res.json({
                success: true,
                data: countries
            });
        } catch (error) {
            console.error('Error fetching countries:', error);
            return res.status(500).json({
                success: false,
                error: 'Error al obtener países'
            });
        }
    },

    /**
     * GET /api/locations/regions/:countryId
     * Get regions by country ID
     */
    async getRegionsByCountry(req: Request, res: Response) {
        try {
            const { countryId } = req.params;

            if (!countryId) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de país es requerido'
                });
            }

            const regions = await locationService.getRegionsByCountry(countryId);

            return res.json({
                success: true,
                data: regions
            });
        } catch (error) {
            console.error('Error fetching regions:', error);
            return res.status(500).json({
                success: false,
                error: 'Error al obtener regiones'
            });
        }
    },

    /**
     * GET /api/locations/cities/:regionId
     * Get cities by region ID
     */
    async getCitiesByRegion(req: Request, res: Response) {
        try {
            const { regionId } = req.params;

            if (!regionId) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de región es requerido'
                });
            }

            const cities = await locationService.getCitiesByRegion(regionId);

            return res.json({
                success: true,
                data: cities
            });
        } catch (error) {
            console.error('Error fetching cities:', error);
            return res.status(500).json({
                success: false,
                error: 'Error al obtener ciudades'
            });
        }
    }
};
