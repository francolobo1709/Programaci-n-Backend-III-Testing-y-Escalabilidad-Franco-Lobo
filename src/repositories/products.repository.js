import { ProductModel } from '../models/product.model.js';

const DEFAULT_PROJECTION = '-__v -isDeleted';

export class ProductsRepository {
  async findAll(filter = {}) {
    return ProductModel.find({ isDeleted: false, ...filter }, DEFAULT_PROJECTION)
      .sort({ createdAt: -1 })
      .lean();
  }

  async findById(id) {
    return ProductModel.findOne({ _id: id, isDeleted: false }, DEFAULT_PROJECTION).lean();
  }

  async create(productData) {
    const created = await ProductModel.create(productData);
    const plain = created.toObject();
    delete plain.__v;
    delete plain.isDeleted;
    return plain;
  }

  async updateById(id, updateFields) {
    return ProductModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateFields },
      { new: true, runValidators: true, projection: DEFAULT_PROJECTION }
    ).lean();
  }

  async softDeleteById(id) {
    return ProductModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true, projection: DEFAULT_PROJECTION }
    ).lean();
  }
}
