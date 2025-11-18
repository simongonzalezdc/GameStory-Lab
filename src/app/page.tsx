export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to ShipLab
        </h1>
        <p className="text-center text-muted-foreground">
          Post-production AI tool for developers
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a
            href="/dashboard"
            className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get Started
          </a>
        </div>
      </div>
    </main>
  );
}
