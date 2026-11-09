import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';

afterEach(() => {
  cleanup();
});

function renderSearchBar(overrides = {}) {
  const props = {
    suburb: '',
    onSuburbChange: vi.fn(),
    onSuggestionSelect: vi.fn(),
    onDismissSuggestions: vi.fn(),
    onSearch: vi.fn(),
    loading: false,
    invalidSearch: false,
    suggestedSuburbs: [],
    ...overrides,
  };

  render(<SearchBar {...props} />);

  return props;
}

describe('SearchBar', () => {
  it('renders the suburb input and search button', () => {
    renderSearchBar();

    expect(
      screen.getByRole('combobox', { name: 'Suburb' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Search' })
    ).toBeInTheDocument();
  });

  it('calls onSuburbChange when the user types', async () => {
    const user = userEvent.setup();

    const props = {
      suburb: '',
      onSuburbChange: vi.fn(),
      onSuggestionSelect: vi.fn(),
      onDismissSuggestions: vi.fn(),
      onSearch: vi.fn(),
      loading: false,
      invalidSearch: false,
      suggestedSuburbs: [],
    };

    function TestWrapper() {
      const [suburb, setSuburb] = useState('');

      return (
        <SearchBar
          {...props}
          suburb={suburb}
          onSuburbChange={(value) => {
            props.onSuburbChange(value);
            setSuburb(value);
          }}
        />
      );
    }

    render(<TestWrapper />);

    await user.type(screen.getByRole('combobox'), 'Bondi');

    expect(props.onSuburbChange).toHaveBeenLastCalledWith('Bondi');
  });

  it('calls onSearch when the form is submitted', async () => {
    const user = userEvent.setup();
    const props = renderSearchBar();

    await user.click(
      screen.getByRole('button', { name: 'Search' })
    );

    expect(props.onSearch).toHaveBeenCalledTimes(1);
  });

  it('disables the search button while loading', () => {
    renderSearchBar({ loading: true });

    expect(
      screen.getByRole('button', { name: 'Searching...' })
    ).toBeDisabled();
  });

  it('displays suburb suggestions', () => {
    renderSearchBar({
      suggestedSuburbs: ['Bondi', 'Belmont North'],
    });

    expect(
      screen.getByRole('option', { name: 'Bondi' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('option', { name: 'Belmont North' })
    ).toBeInTheDocument();
  });

  it('calls onSuggestionSelect when a suggestion is clicked', async () => {
    const user = userEvent.setup();

    const props = renderSearchBar({
      suggestedSuburbs: ['Bondi', 'Belmont North'],
    });

    await user.click(
      screen.getByRole('option', { name: 'Bondi' })
    );

    expect(props.onSuggestionSelect).toHaveBeenCalledWith('Bondi');
  });

  it('displays a validation error when the search is invalid', () => {
    renderSearchBar({
      invalidSearch: true,
      validationMessage: 'Please enter a suburb.',
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please enter a suburb.'
    );
  });

  it('selects a suggestion using the keyboard', async () => {
    const user = userEvent.setup();

    const props = renderSearchBar({
      suggestedSuburbs: ['Bondi', 'Belmont North'],
    });

    const input = screen.getByRole('combobox');

    await user.click(input);
    await user.keyboard('{ArrowDown}{Enter}');

    expect(props.onSuggestionSelect).toHaveBeenCalledWith('Bondi');
  });
});