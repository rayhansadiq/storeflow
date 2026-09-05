function SearchBar({ value, onChange }) {
  return (
    <input
      type="text"
      className="search-bar"
      placeholder="Search products..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search products by name or category"
    />
  );
}

export default SearchBar;
