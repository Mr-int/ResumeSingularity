import React from "react";
import Header from "../components/header/Header.jsx";
import Footer from "../components/footer/Footer.jsx";
import StudentsList from "../components/studentsList/StudentsList.jsx";

const Students = () => {
    return (
        <>
            <Header />
            <StudentsList />
            <Footer />
        </>
    )
}

export default Students;
