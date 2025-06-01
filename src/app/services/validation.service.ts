import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';

export interface AddressValidationResponse {
  valid: boolean;
  formatted?: string;
  suggestions?: string[];
  region?: string;
  comuna?: string;
}

export interface RutValidationResponse {
  valid: boolean;
  exists: boolean;
  companyName?: string;
  activity?: string;
}

export interface EmailValidationResponse {
  valid: boolean;
  exists: boolean;
  domain: string;
}

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  private readonly CORREOS_API_URL = 'https://api.correos.cl/v1';
  private readonly SII_API_URL = 'https://api.sii.cl/recursos/v1';
  private readonly EMAIL_VALIDATION_URL = 'https://api.hunter.io/v2/email-verifier';

  constructor(private http: HttpClient) {}

  /**
   * Valida una dirección usando la API de Correos de Chile
   */
  validateAddress(address: string): Observable<AddressValidationResponse> {
    if (!address || address.trim().length < 5) {
      return of({ valid: false });
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const body = {
      direccion: address.trim(),
      tipo_busqueda: 'direccion'
    };

    return this.http.post<any>(`${this.CORREOS_API_URL}/direcciones/validar`, body, { headers })
      .pipe(
        map(response => {
          return {
            valid: response.valida || false,
            formatted: response.direccion_formateada,
            suggestions: response.sugerencias || [],
            region: response.region,
            comuna: response.comuna
          };
        }),
        catchError(error => {
          console.warn('Error validando dirección con Correos de Chile:', error);
          // Fallback: validación básica local
          return of(this.validateAddressLocally(address));
        })
      );
  }

  /**
   * Valida un RUT usando la API del SII
   */
  validateRutWithSII(rut: string): Observable<RutValidationResponse> {
    if (!this.isValidRutFormat(rut)) {
      return of({ valid: false, exists: false });
    }

    const cleanRut = this.cleanRut(rut);
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; Address-Validation/1.0)'
    });

    return this.http.get<any>(`${this.SII_API_URL}/contribuyente/${cleanRut}`, { headers })
      .pipe(
        map(response => {
          return {
            valid: true,
            exists: response.existe || false,
            companyName: response.razon_social,
            activity: response.actividad_economica
          };
        }),
        catchError(error => {
          console.warn('Error validando RUT con SII:', error);
          // Fallback: solo validación de formato
          return of({
            valid: this.isValidRutFormat(rut),
            exists: false
          });
        })
      );
  }

  /**
   * Valida un email usando servicio externo
   */
  validateEmail(email_contacto: string): Observable<EmailValidationResponse> {
    if (!this.isValidEmailFormat(email_contacto)) {
      return of({ valid: false, exists: false, domain: '' });
    }

    const domain = email_contacto.split('@')[1];
    
    // Para efectos de demostración, implementamos validación básica
    // En producción, se usaría un servicio como Hunter.io o similar
    return of({
      valid: this.isValidEmailFormat(email_contacto),
      exists: this.isCommonEmailDomain(domain),
      domain: domain
    });
  }

  /**
   * Busca direcciones similares usando Correos de Chile
   */
  searchAddresses(query: string): Observable<string[]> {
    if (!query || query.trim().length < 3) {
      return of([]);
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const body = {
      consulta: query.trim(),
      limite: 10
    };

    return this.http.post<any>(`${this.CORREOS_API_URL}/direcciones/buscar`, body, { headers })
      .pipe(
        map(response => response.direcciones || []),
        catchError(error => {
          console.warn('Error buscando direcciones:', error);
          return of([]);
        })
      );
  }

  // Métodos auxiliares privados

  private validateAddressLocally(address: string): AddressValidationResponse {
    const hasNumber = /\d/.test(address);
    const hasStreetType = /(calle|avenida|av\.|pasaje|psje\.|camino)/i.test(address);
    const hasComma = address.includes(',');
    
    return {
      valid: hasNumber && (hasStreetType || hasComma) && address.length >= 10
    };
  }

  private isValidRutFormat(rut: string): boolean {
    const rutRegex = /^[0-9]+[-|‐]{1}[0-9kK]{1}$/;
    const cleanRut = this.cleanRut(rut);
    return rutRegex.test(cleanRut);
  }

  private cleanRut(rut: string): string {
    return rut.replace(/[^0-9kK-]/g, '').toUpperCase();
  }

  private isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isCommonEmailDomain(domain: string): boolean {
    const commonDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'empresa.cl', 'constructor.cl', 'inmobiliaria.cl'
    ];
    return commonDomains.includes(domain.toLowerCase());
  }
}
