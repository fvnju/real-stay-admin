"use client";

import { SearchField } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

/** A search box that calls `onSearch` 400 ms after the last key. */
export function SearchInput({
  placeholder,
  onSearch,
  className,
  defaultValue = "",
}: {
  placeholder: string;
  onSearch: (value: string) => void;
  className?: string;
  /** The first text of the field, for example a search kept in the URL. */
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = setTimeout(() => onSearchRef.current(value.trim()), 400);
    return () => clearTimeout(id);
  }, [value]);

  return (
    <SearchField
      aria-label={placeholder}
      value={value}
      onChange={setValue}
      className={className}
    >
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder={placeholder} />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
}
