// src/services/location.service.ts
import { AppDataSource } from '../config/database';
import { Country } from '../entities/shared/country.entity';
import { Region } from '../entities/shared/region.entity';
import { City } from '../entities/shared/city.entity';

const countryRepository = AppDataSource.getRepository(Country);
const regionRepository = AppDataSource.getRepository(Region);
const cityRepository = AppDataSource.getRepository(City);

export const locationService = {
    /**
     * Get all countries
     */
    async getAllCountries() {
        const countries = await countryRepository.find({
            order: { name: 'ASC' }
        });

        return countries.map(country => ({
            id: country.id,
            name: country.name,
            code: country.code
        }));
    },

    /**
     * Get regions by country ID
     */
    async getRegionsByCountry(countryId: string) {
        const regions = await regionRepository.find({
            where: { countryId },
            order: { name: 'ASC' }
        });

        return regions.map(region => ({
            id: region.id,
            name: region.name,
            code: region.code,
            countryId: region.countryId
        }));
    },

    /**
     * Get cities by region ID
     */
    async getCitiesByRegion(regionId: string) {
        const cities = await cityRepository.find({
            where: { regionId },
            order: { name: 'ASC' }
        });

        return cities.map(city => ({
            id: city.id,
            name: city.name,
            code: city.code,
            regionId: city.regionId,
            latitude: city.latitude,
            longitude: city.longitude
        }));
    }
};
