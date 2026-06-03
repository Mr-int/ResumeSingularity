import React from 'react';
import { Link } from 'react-router-dom';
import ChatsView from '../components/chats/ChatsView.jsx';
import '../components/chats/chatsView.css';
import '../components/chats/chatsModal.css';

const ChatsPage = () => (
    <div className="chatsPage">
        <header className="chatsPage__bar">
            <Link to="/students" className="chatsPage__barLink">
                ← К каталогу
            </Link>
            <span className="chatsPage__barTitle">Чаты</span>
            <Link to="/settings" className="chatsPage__barLink">
                Настройки
            </Link>
        </header>
        <div className="chatsPage__fill">
            <ChatsView />
        </div>
    </div>
);

export default ChatsPage;
