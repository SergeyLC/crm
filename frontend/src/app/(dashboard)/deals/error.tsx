'use client';

export default function LeadsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  console.error('Error occurred:', error);
  return (
    <div>
      <h1>Something went wrong!</h1>
      <button
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}