import LogoLoop from "#/components/LogoLoop";
import aqicnLogo from "#/assets/logo/aqicn-logo.png";
import nasaLogo from "#/assets/logo/nasa-logo.webp";
import openMeteoLogo from "#/assets/logo/open-mateo-logo.png";

const dataSourceLogos = [
  {
    src: aqicnLogo,
    alt: "AQICN",
    href: "https://aqicn.org",
  },
  {
    src: nasaLogo,
    alt: "NASA",
    href: "https://www.nasa.gov",
  },
  {
    src: openMeteoLogo,
    alt: "Open-Meteo",
    href: "https://open-meteo.com",
  },
];

export default function CollectedDataSection() {
  return (
    <section className="relative z-10 bg-background px-6 pt-55 pb-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-xl font-semibold tracking-tight text-neutral-700">
          Didukung Data dari Sumber Terpercaya
        </h2>

        <div className="relative mx-auto mt-12 h-20 overflow-hidden grayscale">
          <LogoLoop
            logos={dataSourceLogos}
            speed={35}
            direction="left"
            logoHeight={45}
            gap={70}
            hoverSpeed={0}
            scaleOnHover
            fadeOut
            fadeOutColor="#ffffff"
            ariaLabel="Sumber data terpercaya"
          />
        </div>
      </div>
    </section>
  );
}
