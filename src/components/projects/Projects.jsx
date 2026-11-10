import React from 'react';
import './projects.css';
import dogRepairmanImg from '../../assets/other/dog-repairman.png';

const Projects = () => (
    <section id="projects" className="projects projects--wip">
        <div className="projects__wip">
            <img
                className="projects__wipImg"
                src={dogRepairmanImg}
                alt=""
                width={280}
                height={280}
            />
            <p className="projects__wipText">не грусти собачка, страница в разработке</p>
        </div>
    </section>
);

export default Projects;
