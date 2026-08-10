import BackgroundSunflower from "@/assets/images/sky-sunflower.jpeg";

export default function IntegrationSection() {
  return (
    <section
      style={{ backgroundImage: `url(${BackgroundSunflower})` }}
      className="relative w-full bg-cover bg-center bg-no-repeat min-h-screen"
    >
      <div className="absolute inset-0 bg-linear-to-b from-white via-transparent to-transparent" />
      <div className="absolute inset-0 bg-linear-to-t from-white via-transparent to-transparent" />
    </section>
  );
}
