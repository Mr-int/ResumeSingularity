import React, { useEffect, useState } from "react";
import Header from "../components/header/Header.jsx";
import Hero from "../components/hero/Hero.jsx";
import StudentSlider from "../components/studentSlider/StudentSlider.jsx";
import Footer from "../components/footer/Footer.jsx";
import Benefits from "../components/benefits/Benefits.jsx";
import Projects from "../components/projects/Projects.jsx";
import Banner from "../components/banner/Banner.jsx";
import { fetchHomeVitrina } from "../services/vitrinaApi.js";
import { mapApiProjectToViewModel } from "../data/staticProjects.js";

const Home = () => {
    const [vitrinaStudents, setVitrinaStudents] = useState([]);
    const [vitrinaProjects, setVitrinaProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                setLoading(true);
                const data = await fetchHomeVitrina();
                if (cancelled) return;
                setVitrinaStudents(data.students);
                setVitrinaProjects(
                    (data.projects || [])
                        .map((project, index) => mapApiProjectToViewModel(project, index))
                        .filter(Boolean),
                );
            } catch (error) {
                console.error('Failed to load home vitrina:', error);
                if (!cancelled) {
                    setVitrinaStudents([]);
                    setVitrinaProjects([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <>
            <Header />
            <Hero />
            <StudentSlider
                students={vitrinaStudents}
                loading={loading}
                guestVitrina
            />
            <Benefits />
            <Projects
                projects={vitrinaProjects}
                guestVitrina
            />
            <Banner />
            <Footer />
        </>
    );
};

export default Home;
