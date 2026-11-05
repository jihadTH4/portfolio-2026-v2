import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import { Background } from "./components/Background";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Skills } from "./components/Skills";
import { Projects } from "./components/Projects";
import { Certificate } from "./components/Certificate";
import { Contact, Footer } from "./components/Contact";

export default function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <Background />
        <Navbar />
        <main>
          <Hero />
          <Skills />
          <Projects />
          <Certificate />
          <Contact />
        </main>
        <Footer />
      </MotionConfig>
    </LazyMotion>
  );
}
