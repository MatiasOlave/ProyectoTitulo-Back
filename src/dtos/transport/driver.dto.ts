export class CreateDriverDto {
    firstName: string;
    lastName: string;
    rut: string;
    birthDate: string;
    phone: string;
    phoneSecondary?: string;
    email: string;
    address: string;
    cityId?: string;

    // Emergency Contact
    emergencyContactName: string;
    emergencyContactRelationship: string;
    emergencyContactPhone: string;
    emergencyContactPhoneSecondary?: string;

    // License
    licenseNumber: string;
    licenseType: string;
    licenseIssueDate: string;
    licenseExpirationDate: string;
    licenseRestrictions?: string;

    // Experience
    yearsOfExperience: number;
    previousExperience?: string;

    // Medical / Work
    lastMedicalExamDate?: string;
    nextMedicalExamDate?: string;
    medicalRestrictions?: string;
    hireDate: string;

    // Explicit Company (Frontend Requirement)
    companyId?: string;
}
