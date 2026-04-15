import { describe, it, expect } from "vitest";

function validateCPF(cpf: string): boolean {
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

function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  let sum = 0;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(digits[12]) !== digit1) return false;

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

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return /^\d{10,11}$/.test(digits);
}

function validateCEP(cep: string): boolean {
  const digits = cep.replace(/\D/g, "");
  return digits.length === 8;
}

describe("validateCPF", () => {
  it("should return true for valid CPF", () => {
    expect(validateCPF("123.456.789-09")).toBe(true);
    expect(validateCPF("12345678909")).toBe(true);
    expect(validateCPF("529.982.247-25")).toBe(true);
    expect(validateCPF("111.444.777-35")).toBe(true);
  });

  it("should return false for invalid CPF", () => {
    expect(validateCPF("123.456.789-00")).toBe(false);
    expect(validateCPF("000.000.000-00")).toBe(false);
    expect(validateCPF("123")).toBe(false);
    expect(validateCPF("12345678901234")).toBe(false);
    expect(validateCPF("999.999.999-99")).toBe(false);
  });

  it("should ignore formatting", () => {
    expect(validateCPF("123.456.789-09")).toBe(true);
    expect(validateCPF("123-456-789-09")).toBe(true);
    expect(validateCPF("12345678909")).toBe(true);
  });
});

describe("validateCNPJ", () => {
  it("should return true for valid CNPJ", () => {
    expect(validateCNPJ("12.345.678/0001-90")).toBe(true);
    expect(validateCNPJ("12345678000190")).toBe(true);
    expect(validateCNPJ("11.222.333/0001-61")).toBe(true);
  });

  it("should return false for invalid CNPJ", () => {
    expect(validateCNPJ("12.345.678/0001-00")).toBe(false);
    expect(validateCNPJ("00.000.000/0000-00")).toBe(false);
    expect(validateCNPJ("123")).toBe(false);
  });

  it("should ignore formatting", () => {
    expect(validateCNPJ("12.345.678/0001-90")).toBe(true);
    expect(validateCNPJ("12345678000190")).toBe(true);
  });
});

describe("validatePhone", () => {
  it("should return true for valid phones", () => {
    expect(validatePhone("11999999999")).toBe(true);
    expect(validatePhone("1133334444")).toBe(true);
    expect(validatePhone("11999998888")).toBe(true);
  });

  it("should return false for invalid phones", () => {
    expect(validatePhone("123")).toBe(false);
    expect(validatePhone("119999999")).toBe(false);
    expect(validatePhone("123456789012")).toBe(false);
  });
});

describe("validateCEP", () => {
  it("should return true for valid CEP", () => {
    expect(validateCEP("01310-000")).toBe(true);
    expect(validateCEP("01310000")).toBe(true);
    expect(validateCEP("88000000")).toBe(true);
  });

  it("should return false for invalid CEP", () => {
    expect(validateCEP("123")).toBe(false);
    expect(validateCEP("1234567890")).toBe(false);
    expect(validateCEP("00000000")).toBe(false);
  });
});
