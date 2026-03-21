import NavBar from "../components/NavBar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Features2 from "../components/Features2";
import Pricing from "../components/Pricing";
import ModpackSection from "../components/ModpackSection";
import Features3 from "../components/Features3";
import Testimonial from "../components/Testimonial";
import Faq from "../components/Faq";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <NavBar />
      <main>
        <Hero />
        <Features />
        <Features2 />
        <Pricing />
        <ModpackSection />
        <Features3 />
        <Testimonial />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
