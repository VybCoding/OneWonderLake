export default function Mission() {
  return (
    <section id="mission" className="py-16 md:py-24 bg-background">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground" data-testid="text-mission-title">
          The Mission
        </h2>
        <div className="space-y-4 text-lg md:text-xl text-muted-foreground leading-relaxed" data-testid="text-mission-body">
          <p>
            Empower the Wonder Lake community to define its own future. One Wonder Lake seeks to unite our fragmented neighborhoods into a single, strong Village that commands its fair share of state funding and local authority.
          </p>
          <p>
            We advocate for mass annexation not just to grow, but to protect what matters: our rural character, our property values, and our shared identity. We exist to ensure that every resident gains a vote in their local government, a voice in our standards, and a stake in preserving Wonder Lake as a thriving, premier rural Village.
          </p>
          <p>
            By standing together, we secure the resources needed for community policing, vibrant green spaces, and a safe, family-oriented recreational haven for generations to come.
          </p>
        </div>
      </div>
    </section>
  );
}
