import { redirect } from 'next/navigation';

export default function PendingPaymentsPage() {
  redirect('/payments?filter=pending');
}
