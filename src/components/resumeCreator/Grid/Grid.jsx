import './grid.css';

const Grid = ({ left, right, children }) => {
    return (
        <main className="studentCreatorGrid">
            <div className="studentCreatorGrid__columns">
                <div className="studentCreatorGrid__left">{left}</div>
                <div className="studentCreatorGrid__right">{right}</div>
            </div>
            {children}
        </main>
    );
};

export default Grid;
