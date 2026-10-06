const SearchInput = ({
    value = '',
    placeholder = 'Поиск',
    onChange,
}) => {
    return (
        <label className="studentCreatorHeader__search">
            <span className="studentCreatorHeader__searchIcon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </span>
            <input
                type="search"
                className="studentCreatorHeader__searchInput"
                value={value}
                placeholder={placeholder}
                onChange={onChange}
            />
        </label>
    );
};

export default SearchInput;
