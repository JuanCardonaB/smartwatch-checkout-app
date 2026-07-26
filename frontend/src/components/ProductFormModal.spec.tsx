import { render, screen, fireEvent, act } from '@testing-library/react';

jest.mock('../services/api', () => ({
  productsApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    uploadImages: jest.fn().mockResolvedValue(['https://img.com/uploaded.jpg']),
  },
  transactionsApi: { getAll: jest.fn(), create: jest.fn(), getById: jest.fn() },
  customersApi: { getAll: jest.fn() },
  deliveriesApi: { getAll: jest.fn() },
}));

import { productsApi } from '../services/api';
import ProductFormModal from './ProductFormModal';

const mockProduct = {
  id: 'prod-1',
  name: 'Smartwatch Pro X1',
  description: 'A great watch',
  priceInCents: 29900000,
  imageUrls: ['https://img.com/watch.jpg'],
  stock: 10,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('ProductFormModal', () => {
  it('renders the form with pre-filled product name', () => {
    render(
      <ProductFormModal
        product={mockProduct}
        saving={false}
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    const nameInput = screen.getByDisplayValue('Smartwatch Pro X1');
    expect(nameInput).toBeInTheDocument();
  });

  it('renders description field pre-filled', () => {
    render(
      <ProductFormModal
        product={mockProduct}
        saving={false}
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    expect(screen.getByDisplayValue('A great watch')).toBeInTheDocument();
  });

  it('renders stock field pre-filled', () => {
    render(
      <ProductFormModal
        product={mockProduct}
        saving={false}
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    render(
      <ProductFormModal
        product={mockProduct}
        saving={false}
        onCancel={onCancel}
        onSubmit={jest.fn()}
      />,
    );
    const cancelButton = screen.getByText(/Cancelar/i);
    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onSubmit with form data when save button is clicked (valid data)', () => {
    const onSubmit = jest.fn();
    render(
      <ProductFormModal
        product={mockProduct}
        saving={false}
        onCancel={jest.fn()}
        onSubmit={onSubmit}
      />,
    );
    const saveButton = screen.getByText(/Guardar cambios/i);
    fireEvent.click(saveButton);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Smartwatch Pro X1',
        description: 'A great watch',
        stock: 10,
        imageUrls: ['https://img.com/watch.jpg'],
      }),
    );
  });

  it('shows saving state when saving=true', () => {
    render(
      <ProductFormModal
        product={mockProduct}
        saving={true}
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    expect(screen.getByText(/Guardando\.\.\./i)).toBeInTheDocument();
  });

  it('can update product name', () => {
    render(
      <ProductFormModal
        product={mockProduct}
        saving={false}
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    const nameInput = screen.getByDisplayValue('Smartwatch Pro X1') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Updated Watch' } });
    expect(nameInput.value).toBe('Updated Watch');
  });

  it('shows image URL in preview', () => {
    render(
      <ProductFormModal
        product={mockProduct}
        saving={false}
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    const images = screen.queryAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('shows validation error when name is empty', () => {
    render(
      <ProductFormModal
        product={{ ...mockProduct, name: '' }}
        saving={false}
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    const saveButton = screen.getByText(/Guardar cambios/i);
    fireEvent.click(saveButton);
    expect(screen.getByText(/Nombre y descripción son obligatorios/i)).toBeInTheDocument();
  });

  it('shows validation error when description is empty', () => {
    render(
      <ProductFormModal
        product={{ ...mockProduct, description: '' }}
        saving={false}
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    const saveButton = screen.getByText(/Guardar cambios/i);
    fireEvent.click(saveButton);
    expect(screen.getByText(/Nombre y descripción son obligatorios/i)).toBeInTheDocument();
  });

  it('shows validation error when price is 0', () => {
    const onSubmit = jest.fn();
    render(
      <ProductFormModal
        product={{ ...mockProduct, priceInCents: 0 }}
        saving={false}
        onCancel={jest.fn()}
        onSubmit={onSubmit}
      />,
    );
    const saveButton = screen.getByText(/Guardar cambios/i);
    fireEvent.click(saveButton);
    expect(screen.getByText(/precio debe ser mayor a 0/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error when no images', () => {
    const onSubmit = jest.fn();
    render(
      <ProductFormModal
        product={{ ...mockProduct, imageUrls: [] }}
        saving={false}
        onCancel={jest.fn()}
        onSubmit={onSubmit}
      />,
    );
    const saveButton = screen.getByText(/Guardar cambios/i);
    fireEvent.click(saveButton);
    expect(screen.getByText(/Agrega al menos una imagen/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('stock field accepts numeric changes', () => {
    render(
      <ProductFormModal
        product={mockProduct}
        saving={false}
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    // The stock input has step=1 type=number; changing it updates the state
    const stockInput = screen.getByDisplayValue('10') as HTMLInputElement;
    fireEvent.change(stockInput, { target: { value: '20' } });
    expect(stockInput.value).toBe('20');
  });

  it('can add an image via URL input and Agregar button', () => {
    const onSubmit = jest.fn();
    render(
      <ProductFormModal
        product={mockProduct}
        saving={false}
        onCancel={jest.fn()}
        onSubmit={onSubmit}
      />,
    );
    // Type URL in the url input (type=url)
    const urlInput = screen.getByPlaceholderText(/pega una URL de imagen/i) as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://img.com/new.jpg' } });
    const addButton = screen.getByText(/Agregar/i);
    fireEvent.click(addButton);
    // Now there are 2 images; submit should include both
    fireEvent.click(screen.getByText(/Guardar cambios/i));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrls: ['https://img.com/watch.jpg', 'https://img.com/new.jpg'],
      }),
    );
    // urlInput should be cleared
    expect(urlInput.value).toBe('');
  });

  it('adds URL on Enter keypress in url input', () => {
    const onSubmit = jest.fn();
    render(
      <ProductFormModal
        product={mockProduct}
        saving={false}
        onCancel={jest.fn()}
        onSubmit={onSubmit}
      />,
    );
    const urlInput = screen.getByPlaceholderText(/pega una URL de imagen/i);
    fireEvent.change(urlInput, { target: { value: 'https://img.com/enter.jpg' } });
    fireEvent.keyDown(urlInput, { key: 'Enter' });
    fireEvent.click(screen.getByText(/Guardar cambios/i));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrls: expect.arrayContaining(['https://img.com/enter.jpg']),
      }),
    );
  });

  it('ignores empty URL input when Agregar is clicked', () => {
    const onSubmit = jest.fn();
    render(
      <ProductFormModal
        product={mockProduct}
        saving={false}
        onCancel={jest.fn()}
        onSubmit={onSubmit}
      />,
    );
    const addButton = screen.getByText(/Agregar/i);
    fireEvent.click(addButton); // urlInput is empty
    // Should still submit with only the original image
    fireEvent.click(screen.getByText(/Guardar cambios/i));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrls: ['https://img.com/watch.jpg'],
      }),
    );
  });

  it('can remove an image', () => {
    const onSubmit = jest.fn();
    render(
      <ProductFormModal
        product={mockProduct}
        saving={false}
        onCancel={jest.fn()}
        onSubmit={onSubmit}
      />,
    );
    // The remove button has aria-label="Eliminar imagen"
    const removeButton = screen.getByLabelText(/Eliminar imagen/i);
    fireEvent.click(removeButton);
    // Now no images remain; submitting should show error
    fireEvent.click(screen.getByText(/Guardar cambios/i));
    expect(screen.getByText(/Agrega al menos una imagen/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('uploads images via file input', async () => {
    const mockedUpload = productsApi.uploadImages as jest.MockedFunction<typeof productsApi.uploadImages>;
    mockedUpload.mockResolvedValue(['https://img.com/uploaded.jpg']);

    render(
      <ProductFormModal
        product={{ ...mockProduct, imageUrls: [] }}
        saving={false}
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );

    // The file input is hidden; we need to trigger change on it
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    expect(mockedUpload).toHaveBeenCalled();
  });

  it('shows upload error when file upload fails', async () => {
    const mockedUpload = productsApi.uploadImages as jest.MockedFunction<typeof productsApi.uploadImages>;
    mockedUpload.mockRejectedValue({ response: { data: { message: 'Upload failed' } } });

    render(
      <ProductFormModal
        product={{ ...mockProduct, imageUrls: [] }}
        saving={false}
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    expect(screen.getByText(/Upload failed/i)).toBeInTheDocument();
  });

  it('shows default upload error when no message in response', async () => {
    const mockedUpload = productsApi.uploadImages as jest.MockedFunction<typeof productsApi.uploadImages>;
    mockedUpload.mockRejectedValue(new Error('network error'));

    render(
      <ProductFormModal
        product={{ ...mockProduct, imageUrls: [] }}
        saving={false}
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    expect(screen.getByText(/No se pudieron subir las imágenes/i)).toBeInTheDocument();
  });
});
