import { z } from 'zod';

export const createMedicalRecordSchema = z.object({
    bloodType: z.string().max(10).optional().nullable(),
    bloodTypeVerified: z.boolean().optional(),
    hasAllergies: z.boolean().optional(),
    allergies: z.string().optional().nullable(),
    allergySeverity: z.string().max(50).optional().nullable(),

    hasDietaryRestrictions: z.boolean().optional(),
    dietaryRestrictions: z.string().optional().nullable(),
    dietaryRestrictionType: z.string().max(100).optional().nullable(),

    takesRegularMedication: z.boolean().optional(),
    medications: z.string().optional().nullable(),
    medicationSchedule: z.string().optional().nullable(),
    medicationAdministrationNotes: z.string().optional().nullable(),

    hasChronicConditions: z.boolean().optional(),
    chronicConditions: z.string().optional().nullable(),

    hasAsthma: z.boolean().optional(),
    hasDiabetes: z.boolean().optional(),
    hasEpilepsy: z.boolean().optional(),
    hasAutism: z.boolean().optional(),
    hasAdhd: z.boolean().optional(),

    healthInsuranceProvider: z.string().max(100).optional().nullable(),
    healthInsuranceType: z.string().max(50).optional().nullable(),
    healthInsuranceNumber: z.string().max(100).optional().nullable(),

    doctorName: z.string().max(255).optional().nullable(),
    doctorSpecialty: z.string().max(100).optional().nullable(),
    doctorPhone: z.string().max(50).optional().nullable(),
    doctorEmail: z.string().email().optional().nullable().or(z.literal('')),

    preferredHospital: z.string().max(255).optional().nullable(),
    preferredHospitalAddress: z.string().optional().nullable(),
    preferredHospitalPhone: z.string().max(50).optional().nullable(),

    hasSpecialNeeds: z.boolean().optional(),
    specialNeedsType: z.string().max(100).optional().nullable(),
    specialNeedsDescription: z.string().optional().nullable(),

    requiresSpecialEquipment: z.boolean().optional(),
    specialEquipmentDescription: z.string().optional().nullable(),

    vaccinationCardUrl: z.string().url().optional().nullable().or(z.literal('')),
    vaccinationUpToDate: z.boolean().optional().nullable(),
    vaccinationNotes: z.string().optional().nullable(),

    generalObservations: z.string().optional().nullable(),

    hasActivityRestrictions: z.boolean().optional(),
    activityRestrictions: z.string().optional().nullable(),

    consentEmergencyTreatment: z.boolean().optional(),
    consentMedicationAdministration: z.boolean().optional(),

    consentGivenById: z.string().uuid().optional().nullable(),
    consentDate: z.string().transform((str) => str ? new Date(str) : null).optional().nullable(),

    lastReviewedDate: z.string().transform((str) => str ? new Date(str) : null).optional().nullable(),
    nextReviewDate: z.string().transform((str) => str ? new Date(str) : null).optional().nullable(),
});
