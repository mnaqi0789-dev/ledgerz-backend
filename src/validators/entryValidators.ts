import { EntryType, EntryCategory, EntryStatus } from "@prisma/client";

export const VALID_ENTRY_TYPES = Object.values(EntryType);
export const VALID_ENTRY_CATEGORIES = Object.values(EntryCategory);
export const VALID_ENTRY_STATUSES = Object.values(EntryStatus);
