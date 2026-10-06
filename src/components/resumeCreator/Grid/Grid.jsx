import './grid.css';

const Grid = ({ left, right, footer, children }) => {
    return (
        <main className="studentCreatorGrid">
            <div className="studentCreatorGrid__columns">
                <div className="studentCreatorGrid__left">{left}</div>
                <div className="studentCreatorGrid__right">{right}</div>
            </div>
            {footer}
            {children}
        </main>
    );
};

export default Grid;
