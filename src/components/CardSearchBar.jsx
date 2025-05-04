import React from "react";
import "./CardSearchBar.css";

const CardSearchBar = ({
  searchTerm,
  onSearchTermChange,
  searchField,
  onSearchFieldChange,
  onSearch
}) => {
  return (
    <div className="search-bar-container">
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className="search-input"
      />
      <select
        value={searchField}
        onChange={(e) => onSearchFieldChange(e.target.value)}
        className="search-select"
      >
        <option value="name">Name</option>
        <option value="artist">Artist</option>
      </select>
      <button
  onClick={() => onSearch(searchTerm, searchField)}
  style={{
    backgroundColor: "#8c92b9",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    cursor: "pointer"
  }}
>
  Search
</button>
    </div>
  );
};

export default CardSearchBar;
