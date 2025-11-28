export default function Hero() {
  return (
    <section className="bg-primary text-primary-foreground py-12 md:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4" data-testid="text-hero-headline">
          One Lake. One Community. One Future.
        </h1>
        <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-3xl mx-auto" data-testid="text-hero-subhead">
          Uniting our neighborhoods for a stronger Wonder Lake.
        </p>
      </div>
    </section>
  );
}
