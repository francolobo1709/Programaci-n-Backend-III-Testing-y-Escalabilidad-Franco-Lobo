import { HTTP_STATUS, PRODUCT_STATUS } from '../constants/index.js';
import { ProductsRepository } from '../repositories/products.repository.js';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export class ProductsService {
  constructor(productsRepository = new ProductsRepository()) {
    this.productsRepository = productsRepository;
  }

  validateId(id) {
    if (!id || !OBJECT_ID_REGEX.test(String(id))) {
      const error = new Error(`El identificador de producto "${id}" no tiene un formato válido`);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }
  }

  resolveStatusByStock(stock) {
    return stock > 0 ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.OUT_OF_STOCK;
  }

  async getAllProducts({ onlyAvailable = false } = {}) {
    const filter = onlyAvailable ? { status: PRODUCT_STATUS.AVAILABLE } : {};
    return this.productsRepository.findAll(filter);
  }

  async getProductById(id) {
    this.validateId(id);
    const product = await this.productsRepository.findById(id);
    if (!product) {
      const error = new Error('Producto no encontrado');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }
    return product;
  }

  async createProduct({ name, price, stock = 0 }) {
    if (!name || String(name).trim() === '' || price === undefined) {
      const error = new Error('Los campos name y price son obligatorios');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    const normalizedPrice = Number(price);
    if (Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
      const error = new Error('El precio debe ser un número mayor o igual a 0');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    const normalizedStock = Number(stock);
    if (Number.isNaN(normalizedStock) || normalizedStock < 0) {
      const error = new Error('El stock debe ser un número mayor o igual a 0');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    const status = this.resolveStatusByStock(normalizedStock);

    return this.productsRepository.create({
      name: String(name).trim(),
      price: normalizedPrice,
      stock: normalizedStock,
      status,
    });
  }

  async updateProduct(id, { name, price, stock }) {
    const currentProduct = await this.getProductById(id);
    const updateFields = {};

    if (name !== undefined) {
      if (String(name).trim() === '') {
        const error = new Error('El nombre del producto no puede estar vacío');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }
      updateFields.name = String(name).trim();
    }

    if (price !== undefined) {
      const normalizedPrice = Number(price);
      if (Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
        const error = new Error('El precio debe ser un número mayor o igual a 0');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }
      updateFields.price = normalizedPrice;
    }

    if (stock !== undefined) {
      const normalizedStock = Number(stock);
      if (Number.isNaN(normalizedStock) || normalizedStock < 0) {
        const error = new Error('El stock debe ser un número mayor o igual a 0');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }
      updateFields.stock = normalizedStock;
      updateFields.status = this.resolveStatusByStock(normalizedStock);
    }

    if (Object.keys(updateFields).length === 0) {
      return currentProduct;
    }

    return this.productsRepository.updateById(id, updateFields);
  }

  async updateStock(id, deltaStock) {
    const product = await this.getProductById(id);
    const change = Number(deltaStock);

    if (Number.isNaN(change)) {
      const error = new Error('deltaStock debe ser un número válido');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    const nextStock = product.stock + change;
    if (nextStock < 0) {
      const error = new Error('Stock insuficiente para completar la operación');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    const nextStatus = this.resolveStatusByStock(nextStock);

    return this.productsRepository.updateById(id, {
      stock: nextStock,
      status: nextStatus,
    });
  }

  async deleteProduct(id) {
    await this.getProductById(id);
    return this.productsRepository.softDeleteById(id);
  }
}
