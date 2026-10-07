import profileStockIco from '../../../../assets/icons/profileStockIco.png';

const Avatar = ({ src, alt = 'Пользователь', onClick }) => {
    return (
        <button
            type="button"
            className="studentCreatorHeader__avatar"
            onClick={onClick}
            aria-label={alt}
        >
            <img
                src={src || profileStockIco}
                alt={alt}
                className={
                    'studentCreatorHeader__avatarImg'
                    + (src ? ' studentCreatorHeader__avatarImg--custom' : '')
                }
                width={src ? 56 : 42}
                height={src ? 56 : 42}
            />
        </button>
    );
};

export default Avatar;
