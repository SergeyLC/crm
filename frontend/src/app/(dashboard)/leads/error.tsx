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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Something went wrong!</h1>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}