import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div style={{padding:32,fontFamily:'sans-serif'}}>
      <h1>Unauthorized</h1>
      <p>You do not have access to this page.</p>
      <p><Link href="/">Go home</Link></p>
    </div>
  );
}
