/**
 * Client-Side Real-Time Field Validators & Formatters
 */

export function validatePhone(phone, isRequired = true) {
  if (!phone || !phone.trim()) {
    return isRequired ? 'Phone number is required' : null;
  }
  const clean = phone.trim();
  if (/[^\d]/.test(clean)) {
    return 'Phone number cannot contain letters or symbols (digits only)';
  }
  if (clean.length !== 11) {
    return `Phone number must be exactly 11 digits (Current: ${clean.length} digits)`;
  }
  return null;
}

export function validateIMEI(imei, isRequired = true, label = 'IMEI') {
  if (!imei || !imei.trim()) {
    return isRequired ? `${label} is required` : null;
  }
  const clean = imei.trim();
  if (/[^\d]/.test(clean)) {
    return `${label} cannot contain letters or symbols (15 digits only)`;
  }
  if (clean.length !== 15) {
    return `${label} must be exactly 15 digits (Current: ${clean.length}/15)`;
  }
  return null;
}

export function validateCNIC(cnic, isRequired = true) {
  if (!cnic || !cnic.trim()) {
    return isRequired ? 'CNIC number is required' : null;
  }
  const digitsOnly = cnic.replace(/\D/g, '');
  if (digitsOnly.length !== 13) {
    return `CNIC must be exactly 13 digits (Current: ${digitsOnly.length}/13)`;
  }
  return null;
}

export function validatePrice(val, label = 'Price') {
  if (val === undefined || val === null || val === '') {
    return `${label} is required`;
  }
  const num = Number(val);
  if (isNaN(num) || num <= 0) {
    return `${label} must be a valid positive amount`;
  }
  return null;
}

export function validateRequired(val, label = 'Field') {
  if (!val || !String(val).trim()) {
    return `${label} is required`;
  }
  return null;
}
