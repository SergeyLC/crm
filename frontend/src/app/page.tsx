
import { redirect } from 'next/navigation';

// Redirect root to default locale (German). Adjust if default changes.
export default function RootRedirect() {
  redirect('/de');
}
