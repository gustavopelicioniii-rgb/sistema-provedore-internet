import { z } from "zod";

// ============================================================================
// CPF Validation
// ============================================================================

export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder > 9) remainder = 0;
  if (parseInt(digits[9]) !== remainder) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder > 9) remainder = 0;
  if (parseInt(digits[10]) !== remainder) return false;

  return true;
}

export const CPFSchema = z.string()
  .transform(val => val.replace(/\D/g, ""))
  .refine(val => val.length === 11, "CPF deve ter 11 dígitos")
  .refine(val => validateCPF(val), "CPF inválido");

// ============================================================================
// CNPJ Validation
// ============================================================================

export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  // First digit check
  let sum = 0;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(digits[12]) !== digit1) return false;

  // Second digit check
  sum = 0;
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(digits[13]) !== digit2) return false;

  return true;
}

export const CNPJSchema = z.string()
  .transform(val => val.replace(/\D/g, ""))
  .refine(val => val.length === 14, "CNPJ deve ter 14 dígitos")
  .refine(val => validateCNPJ(val), "CNPJ inválido");

// ============================================================================
// Phone Validation (Brazilian)
// ============================================================================

export const PhoneSchema = z.string()
  .transform(val => val.replace(/\D/g, ""))
  .refine(val => /^\d{10,11}$/.test(val), "Telefone inválido")
  .transform(val => {
    if (val.length === 11) {
      return `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    }
    return `(${val.slice(0, 2)}) ${val.slice(2, 6)}-${val.slice(6)}`;
  });

// ============================================================================
// CEP Validation
// ============================================================================

export const CEPSchema = z.string()
  .transform(val => val.replace(/\D/g, ""))
  .refine(val => val.length === 8, "CEP deve ter 8 dígitos")
  .transform(val => `${val.slice(0, 5)}-${val.slice(5)}`);

export interface CEPAddress {
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export async function fetchAddressByCEP(cep: string): Promise<CEPAddress | null> {
  const cleanCEP = cep.replace(/\D/g, "");
  if (cleanCEP.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await response.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

// ============================================================================
// PIS/NIT Validation
// ============================================================================

export function validatePIS(pis: string): boolean {
  const digits = pis.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * weights[i];
  }
  const remainder = sum % 11;
  const digit = remainder < 2 ? 0 : 11 - remainder;

  return parseInt(digits[10]) === digit;
}

export const PISSchema = z.string()
  .transform(val => val.replace(/\D/g, ""))
  .refine(val => val.length === 11, "PIS deve ter 11 dígitos")
  .refine(val => validatePIS(val), "PIS inválido");

// ============================================================================
// Complete Customer Schema
// ============================================================================

export const CustomerSchema = z.object({
  nome: z.string()
    .min(2, "Nome muito curto")
    .max(100, "Nome muito longo"),
  
  email: z.string().email("Email inválido"),
  
  cpf: CPFSchema,
  
  telefone_principal: z.string()
    .transform(val => val.replace(/\D/g, ""))
    .refine(val => /^\d{10,11}$/.test(val), "Telefone inválido"),
  
  telefone_secundario: z.string()
    .transform(val => val.replace(/\D/g, ""))
    .refine(val => /^\d{10,11}$/.test(val), "Telefone inválido")
    .optional(),
  
  cep: CEPSchema,
  
  logradouro: z.string().max(200),
  
  numero: z.string().max(10),
  
  complemento: z.string().max(50).optional(),
  
  bairro: z.string().max(100),
  
  cidade: z.string().max(100),
  
  estado: z.string().length(2, "Use a UF (ex: SP)"),
  
  plano_id: z.string().uuid("Selecione um plano"),
  
  tipo_pessoa: z.enum(["fisica", "juridica"]),
  
  cnpj: CNPJSchema.optional(),
});

export type CustomerData = z.infer<typeof CustomerSchema>;

// ============================================================================
// Error Formatting
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export function formatZodErrors(error: z.ZodError): ValidationError[] {
  return error.errors.map(err => ({
    field: err.path.join("."),
    message: err.message,
    code: "INVALID_FIELD",
  }));
}
