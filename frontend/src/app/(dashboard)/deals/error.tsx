'use client';

export default function LeadsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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