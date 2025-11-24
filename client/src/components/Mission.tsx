export default function Mission() {
  return (
    <section id="mission" className="py-16 md:py-24 bg-background">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground" data-testid="text-mission-title">
          The Mission
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed" data-testid="text-mission-body">
          One Wonder Lake is a grassroots effort to unite our community under a single village government. 
          By annexing the unincorporated areas surrounding our lake, we can bring state tax dollars home, 
          establish consistent community standards, and invest in the infrastructure and services that make 
          Wonder Lake a great place to live for generations to come.
        </p>
      </div>
    </section>
  );
}
