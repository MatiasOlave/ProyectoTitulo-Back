// src/interfaces/auth-company.interface.ts


export interface ICompanyData {
  name: string;
  rut: string;
  email: string;
  phone?: string;
  address?: string;
  cityId: string;
}

export interface IDirectorData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface IRegisterCompanyData {
  company: ICompanyData;
  director: IDirectorData;
}

export interface IRegisterCompanyResult {
  company: ICompanyData;
  user: IDirectorData;
  message: string;
}