import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Perche, CosaTrovi, Community, Magistra } from "@/components/Sections";
import { Manifesto } from "@/components/Manifesto";
import { PerChi, Accesso, Footer } from "@/components/Closing";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Perche />
        <CosaTrovi />
        <Community />
        <Magistra />
        <Manifesto />
        <PerChi />
        <Accesso />
      </main>
      <Footer />
    </>
  );
}
