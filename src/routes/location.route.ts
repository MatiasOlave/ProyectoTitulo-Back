// src/routes/location.route.ts
import { Router } from 'express';
import { locationController } from '../controllers/location.controller';

export const locationRoutes = Router();

// GET /api/locations/countries - Get all countries
locationRoutes.get('/countries', locationController.getCountries);

// GET /api/locations/regions/:countryId - Get regions by country
locationRoutes.get('/regions/:countryId', locationController.getRegionsByCountry);

// GET /api/locations/cities/:regionId - Get cities by region
locationRoutes.get('/cities/:regionId', locationController.getCitiesByRegion);
