import { HTTP_STATUS } from '../constants/index.js';
import { ProductsService } from '../services/products.service.js';

export class ProductsController {
  constructor(productsService = new ProductsService()) {
    this.productsService = productsService;
  }

  getAll = async (req, res) => {
    try {
      const onlyAvailable = req.query.available === 'true';
      const products = await this.productsService.getAllProducts({ onlyAvailable });
      return res.status(HTTP_STATUS.OK).json({ ok: true, data: products });
    } catch (error) {
      const status = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return res.status(status).json({ ok: false, message: error.message });
    }
  };

  getById = async (req, res) => {
    try {
      const product = await this.productsService.getProductById(req.params.id);
      return res.status(HTTP_STATUS.OK).json({ ok: true, data: product });
    } catch (error) {
      const status = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return res.status(status).json({ ok: false, message: error.message });
    }
  };

  create = async (req, res) => {
    try {
      const created = await this.productsService.createProduct(req.body);
      return res.status(HTTP_STATUS.CREATED).json({ ok: true, data: created });
    } catch (error) {
      const status = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return res.status(status).json({ ok: false, message: error.message });
    }
  };

  update = async (req, res) => {
    try {
      const updated = await this.productsService.updateProduct(req.params.id, req.body);
      return res.status(HTTP_STATUS.OK).json({ ok: true, data: updated });
    } catch (error) {
      const status = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return res.status(status).json({ ok: false, message: error.message });
    }
  };

  updateStock = async (req, res) => {
    try {
      const updated = await this.productsService.updateStock(req.params.id, req.body.deltaStock);
      return res.status(HTTP_STATUS.OK).json({ ok: true, data: updated });
    } catch (error) {
      const status = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return res.status(status).json({ ok: false, message: error.message });
    }
  };

  delete = async (req, res) => {
    try {
      const deleted = await this.productsService.deleteProduct(req.params.id);
      return res.status(HTTP_STATUS.OK).json({ ok: true, data: deleted });
    } catch (error) {
      const status = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return res.status(status).json({ ok: false, message: error.message });
    }
  };
}
