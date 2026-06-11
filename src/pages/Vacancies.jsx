import React from 'react';
import Header from '../components/header/Header.jsx';
import Footer from '../components/footer/Footer.jsx';
import './vacanciesPage.css';

const Vacancies = () => (
    <>
        <Header />
        <main className="vacanciesPage">
            <h1 className="vacanciesPage__title">Вакансии</h1>
            <p className="vacanciesPage__hint">Раздел в разработке — скоро здесь появится каталог вакансий.</p>
        </main>
        <Footer />
    </>
);

export default Vacancies;
