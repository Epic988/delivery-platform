const SD_PHONE = /^\+249\d{9}$/;

export function isValidSudanesePhone(phone: string): boolean {
  return SD_PHONE.test(phone);
}

export function normalizeSudanesePhone(input: string): string {
  const cleaned = input.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+249') && cleaned.length === 13) return cleaned;
  if (cleaned.startsWith('249') && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.startsWith('0') && cleaned.length === 10) return `+249${cleaned.slice(1)}`;
  return cleaned;
}
