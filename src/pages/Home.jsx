import React from "react";
import Header from "../components/header/Header.jsx";
import Hero from "../components/hero/Hero.jsx";
import StudentSlider from "../components/studentSlider/StudentSlider.jsx";
import Footer from "../components/footer/Footer.jsx";
import Benefits from "../components/benefits/Benefits.jsx";
import Projects from "../components/projects/Projects.jsx";
import Banner from "../components/banner/Banner.jsx";

const Home = () => {
    return (
        <>
            <Header />
            <Hero />
            <StudentSlider />
            <Benefits />
            <Projects />
            <Banner />
            <Footer />
        </>
    )
}

export default Home;