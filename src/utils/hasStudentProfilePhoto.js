export function hasStudentProfilePhoto(student) {
  if (!student || typeof student !== 'object') return false;

  const raw =
    student.imagePath ??
    student.image ??
    student.photo ??
    student.avatar ??
    null;

  if (raw == null) return false;
  if (typeof raw !== 'string') return Boolean(raw);

  const v = raw.trim();
  if (!v) return false;

  // If backend ever sends a placeholder as data-url, treat it as "no photo".
  if (v.startsWith('data:image/svg+xml')) return false;

  return true;
}

