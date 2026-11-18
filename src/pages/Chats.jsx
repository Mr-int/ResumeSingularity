import React from 'react';
import '../components/projects/projects.css';
import dogRepairmanImg from '../assets/other/dog-repairman.png';

const ChatsPage = () => (
    <div className="chatsPage chatsPage--wip">
        <section className="projects projects--wip chatsPage__wip" aria-label="Чаты в разработке">
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
    </div>
);

export default ChatsPage;
