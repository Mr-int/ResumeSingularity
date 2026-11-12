import React from 'react';
import ChatsView from '../components/chats/ChatsView.jsx';
import '../components/chats/chatsView.css';
import '../components/projects/projects.css';
import dogRepairmanImg from '../assets/other/dog-repairman.png';
import { getStoredRole } from '../services/authApi.js';

const ChatsWip = () => (
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
);

const ChatsPage = () => {
    const isStudent = getStoredRole() === 'STUDENT';

    return (
        <div className={`chatsPage${isStudent ? ' chatsPage--wip' : ''}`}>
            {isStudent ? <ChatsWip /> : <ChatsView />}
        </div>
    );
};

export default ChatsPage;
