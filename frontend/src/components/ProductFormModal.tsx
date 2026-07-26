import { useRef, useState } from "react";
import type { Product } from "../types";
import { productsApi, type ProductInput } from "../services/api";

interface Props {
  product: Product;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (data: ProductInput) => void;
}

export default function ProductFormModal({
  product,
  saving,
  onCancel,
  onSubmit,
}: Props) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [priceCOP, setPriceCOP] = useState(String(product.priceInCents / 100));
  const [stock, setStock] = useState(String(product.stock));
  const [imageUrls, setImageUrls] = useState<string[]>(product.imageUrls);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function addUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setImageUrls((prev) => [...prev, trimmed]);
    setUrlInput("");
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setFormError(null);
    setUploading(true);
    try {
      const urls = await productsApi.uploadImages(files);
      setImageUrls((prev) => [...prev, ...urls]);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setFormError(e?.response?.data?.message ?? "No se pudieron subir las imágenes.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const price = Number(priceCOP);
    const stockValue = Number(stock);

    if (!name.trim() || !description.trim()) {
      setFormError("Nombre y descripción son obligatorios.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setFormError("El precio debe ser mayor a 0.");
      return;
    }
    if (!Number.isInteger(stockValue) || stockValue < 0) {
      setFormError("El stock debe ser un entero mayor o igual a 0.");
      return;
    }
    if (imageUrls.length === 0) {
      setFormError("Agrega al menos una imagen.");
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      priceInCents: Math.round(price * 100),
      imageUrls,
      stock: stockValue,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Editar producto</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              placeholder="Smartwatch Pro X1"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              placeholder="Premium smartwatch..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Precio (COP)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={priceCOP}
                onChange={(e) => setPriceCOP(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                placeholder="299000"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Stock
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                placeholder="10"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Imágenes
            </label>

            {imageUrls.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="group relative">
                    <img
                      src={url}
                      alt={`imagen ${i + 1}`}
                      className="aspect-square w-full rounded-lg border border-gray-200 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
                      aria-label="Eliminar imagen"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50"
            >
              {uploading ? "Subiendo..." : "⬆ Subir imágenes desde el dispositivo"}
            </button>

            <div className="mt-2 flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addUrl();
                  }
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                placeholder="...o pega una URL de imagen"
              />
              <button
                type="button"
                onClick={addUrl}
                className="shrink-0 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-100"
              >
                Agregar
              </button>
            </div>
          </div>

          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
