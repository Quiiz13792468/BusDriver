import { SchoolsTabs } from '@/app/(protected)/schools/_components/schools-tabs';
import { requireSession } from '@/lib/auth/session';
import { getSchools } from '@/lib/data/school';
import { getAllStudents } from '@/lib/data/student';

export default async function SchoolsPage() {
  await requireSession('ADMIN');
  const [schools, students] = await Promise.all([getSchools(), getAllStudents()]);

  return (
    <SchoolsTabs schools={schools} students={students} />
  );
}
