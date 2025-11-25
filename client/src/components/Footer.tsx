const APP_VERSION = "1.1.0";
const BUILD_DATE = new Date().toISOString().split('T')[0];

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <p className="text-sm" data-testid="text-footer">
          Paid for by concerned citizens.
        </p>
        <p className="text-xs mt-4 opacity-70" data-testid="text-version">
          v{APP_VERSION} ({BUILD_DATE})
        </p>
      </div>
    </footer>
  );
}
