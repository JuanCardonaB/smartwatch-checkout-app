import { render, screen, fireEvent } from '@testing-library/react';
import PhoneInput from './index';

function renderPhoneInput(value = '', onChange = jest.fn()) {
  return render(<PhoneInput value={value} onChange={onChange} />);
}

describe('PhoneInput', () => {
  /* ─── Rendering ─── */

  it('renders the country selector button', () => {
    renderPhoneInput();
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('renders the phone number input field', () => {
    renderPhoneInput();
    const input = screen.getByPlaceholderText('310 000 0000');
    expect(input).toBeInTheDocument();
  });

  it('displays Colombia (+57) as the default country', () => {
    renderPhoneInput();
    // The dial code +57 should be visible in the button
    expect(screen.getByText('+57')).toBeInTheDocument();
  });

  it('parses a pre-filled value with a known dial code', () => {
    // +1 is US, number portion is 3105551234
    renderPhoneInput('+13105551234');
    expect(screen.getByText('+1')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('310 000 0000') as HTMLInputElement;
    expect(input.value).toBe('3105551234');
  });

  it('falls back to Colombia when the value has no recognized prefix', () => {
    renderPhoneInput('9876543');
    // The whole string becomes the "number" and country defaults to Colombia
    expect(screen.getByText('+57')).toBeInTheDocument();
  });

  /* ─── Number input ─── */

  it('strips non-digit characters from phone number input', () => {
    const onChange = jest.fn();
    renderPhoneInput('+57', onChange);
    const input = screen.getByPlaceholderText('310 000 0000');
    fireEvent.change(input, { target: { value: 'abc123def' } });
    // Only "123" should have been kept
    expect(onChange).toHaveBeenCalledWith('+57123');
  });

  it('limits input to 12 digits', () => {
    const onChange = jest.fn();
    renderPhoneInput('+57', onChange);
    const input = screen.getByPlaceholderText('310 000 0000');
    // 14 digits -> sliced to 12
    fireEvent.change(input, { target: { value: '12345678901234' } });
    expect(onChange).toHaveBeenCalledWith('+57123456789012');
  });

  it('calls onChange with dial code + number on number input', () => {
    const onChange = jest.fn();
    renderPhoneInput('+57', onChange);
    const input = screen.getByPlaceholderText('310 000 0000');
    fireEvent.change(input, { target: { value: '3001234567' } });
    expect(onChange).toHaveBeenCalledWith('+573001234567');
  });

  /* ─── Country selector toggle ─── */

  it('opens the dropdown when the country selector button is clicked', () => {
    renderPhoneInput();
    // Dropdown should not be visible initially
    expect(screen.queryByText('Colombia')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    // Now the dropdown should list countries
    expect(screen.getByText('Colombia')).toBeInTheDocument();
  });

  it('closes the dropdown when the country selector button is clicked again', () => {
    renderPhoneInput();
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger); // open
    expect(screen.getByText('Colombia')).toBeInTheDocument();
    fireEvent.click(trigger); // close
    expect(screen.queryByText('Colombia')).not.toBeInTheDocument();
  });

  it('shows all 8 countries in the dropdown', () => {
    renderPhoneInput();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Colombia')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('México')).toBeInTheDocument();
    expect(screen.getByText('España')).toBeInTheDocument();
    expect(screen.getByText('Brasil')).toBeInTheDocument();
    expect(screen.getByText('Argentina')).toBeInTheDocument();
    expect(screen.getByText('Venezuela')).toBeInTheDocument();
    expect(screen.getByText('Perú')).toBeInTheDocument();
  });

  /* ─── Country selection ─── */

  it('selects a different country and closes the dropdown', () => {
    const onChange = jest.fn();
    renderPhoneInput('+57', onChange);
    // Open dropdown
    fireEvent.click(screen.getAllByRole('button')[0]);
    // Click United States
    const usButton = screen.getByText('United States').closest('button')!;
    fireEvent.click(usButton);
    // Dropdown closes
    expect(screen.queryByText('United States')).not.toBeInTheDocument();
    // The trigger should now show +1
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('calls onChange with new dial code when a country is selected', () => {
    const onChange = jest.fn();
    renderPhoneInput('+573001234567', onChange);
    fireEvent.click(screen.getAllByRole('button')[0]);
    const mexicoButton = screen.getByText('México').closest('button')!;
    fireEvent.click(mexicoButton);
    // number portion was "3001234567", new dial is +52
    expect(onChange).toHaveBeenCalledWith('+523001234567');
  });

  /* ─── Click-outside closes dropdown ─── */

  it('closes the dropdown when clicking outside the component', () => {
    renderPhoneInput();
    // Open dropdown
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByText('Colombia')).toBeInTheDocument();
    // Simulate mousedown outside (on document.body)
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Colombia')).not.toBeInTheDocument();
  });

  it('does NOT close the dropdown when clicking inside the component', () => {
    const { container } = renderPhoneInput();
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByText('Colombia')).toBeInTheDocument();
    // Click inside the wrapper div
    fireEvent.mouseDown(container.firstChild as Element);
    expect(screen.getByText('Colombia')).toBeInTheDocument();
  });

  /* ─── Cleanup / event listener removal ─── */

  it('removes mousedown listener on unmount without errors', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    const { unmount } = renderPhoneInput();
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });

  /* ─── SVG chevron rotation ─── */

  it('shows rotated chevron when dropdown is open', () => {
    renderPhoneInput();
    const trigger = screen.getAllByRole('button')[0];
    // Get the SVG inside the trigger (JSDOM stores SVG className as SVGAnimatedString object)
    const svg = trigger.querySelector('svg');
    expect(svg).not.toBeNull();
    // Initially not rotated — check the class attribute string
    expect(svg!.getAttribute('class')).not.toMatch(/rotate-180/);
    fireEvent.click(trigger);
    // Now rotated
    expect(svg!.getAttribute('class')).toMatch(/rotate-180/);
  });
});
